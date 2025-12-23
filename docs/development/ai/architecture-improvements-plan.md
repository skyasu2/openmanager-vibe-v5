# AI Architecture Improvements Implementation Plan

**Version**: 1.1.0
**Date**: 2025-12-23
**Status**: In Progress

## Overview

LangGraph Multi-Agent 시스템에 다음 개선사항을 적용합니다:

| Task | Status | 설명 |
|------|--------|------|
| Verifier Agent | ✅ 완료 | Groq 기반 출력 검증 에이전트 |
| Caching Layer | ✅ 완료 | 데이터 접근 캐싱 (TTL: 1분/5분/10분) |
| AgentState 확장 | ✅ 완료 | Agent 간 결과 공유 (SharedContext) |
| PostgreSQL Context | ✅ 완료 | 세션 컨텍스트 저장 (context-service.ts) |

---

## Task 1: Verifier Agent 구현

### 1.1 설계 목표

```
┌─────────────────────────────────────────────────────────────────┐
│                    Verifier Agent Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   NLQ/Analyst/Reporter Output                                     │
│           │                                                       │
│           ▼                                                       │
│   ┌─────────────────────────────────────────┐                    │
│   │  Verifier Agent (Groq)                  │                    │
│   │                                          │                    │
│   │  1. 수치 범위 검증 (0-100% 메트릭)       │                    │
│   │  2. 필수 정보 완전성 확인                │                    │
│   │  3. 응답 포맷 정규화                     │                    │
│   │  4. 환각(Hallucination) 탐지            │                    │
│   │  5. 신뢰도 점수 부여                     │                    │
│   │                                          │                    │
│   └──────┬────────────────────────────────────┘                    │
│          │                                                        │
│          ▼                                                        │
│   Validated Response + Confidence Score                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 구현 파일

```
cloud-run/ai-engine/src/
├── agents/
│   └── verifier-agent.ts          # NEW: Verifier Agent 구현
├── lib/
│   └── state-definition.ts        # UPDATE: VerifierResult 타입 추가
└── services/langgraph/
    └── multi-agent-supervisor.ts  # UPDATE: Verifier 통합
```

### 1.3 Verifier Agent 스펙

```typescript
// verifier-agent.ts
interface VerifierConfig {
  // 검증 규칙
  rules: {
    checkMetricRanges: boolean;     // 0-100% 범위 검증
    checkRequiredFields: boolean;   // 필수 필드 확인
    checkFormatConsistency: boolean; // 포맷 일관성
    detectHallucination: boolean;   // 환각 탐지
  };

  // 임계값
  thresholds: {
    minConfidence: number;          // 최소 신뢰도 (기본 0.7)
    metricMin: number;              // 메트릭 최소값 (0)
    metricMax: number;              // 메트릭 최대값 (100)
  };
}

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  originalResponse: string;
  validatedResponse: string;
  issues: VerificationIssue[];
  metadata: {
    verifiedAt: string;
    rulesApplied: string[];
    corrections: Correction[];
  };
}
```

### 1.4 Supervisor 통합 방식

```typescript
// Option A: 후처리 방식 (권장)
const workflow = createSupervisor({
  agents: [nlqAgent, analystAgent, reporterAgent],
  llm: getSupervisorModel(),
  prompt: SUPERVISOR_PROMPT,
  outputMode: 'full_history',
});

// Verifier를 Supervisor 출력 후 호출
const result = await workflow.invoke(query);
const verified = await verifierAgent.verify(result.response);
return verified.validatedResponse;

// Option B: Agent 추가 방식
const workflow = createSupervisor({
  agents: [nlqAgent, analystAgent, reporterAgent, verifierAgent],
  // ...
});
// Supervisor가 Verifier를 마지막에 호출하도록 프롬프트 수정
```

### 1.5 구현 순서

1. `verifier-agent.ts` 생성
2. `state-definition.ts` 업데이트
3. `multi-agent-supervisor.ts` 통합
4. 테스트

---

## Task 2: Caching Layer 추가

### 2.1 설계

```typescript
// cache-layer.ts
interface CacheConfig {
  ttl: {
    metrics: number;     // 메트릭: 1분
    rag: number;         // RAG: 5분
    analysis: number;    // 분석: 10분
  };
  maxSize: number;       // 최대 캐시 엔트리 수
}

class DataCacheLayer {
  private cache: Map<string, CachedItem>;

  async getMetrics(serverId?: string): Promise<ServerMetrics[]>;
  async searchRAG(query: string): Promise<RAGResult[]>;
  async getAnalysis(type: string, data: any): Promise<AnalysisResult>;
}
```

### 2.2 구현 파일

```
cloud-run/ai-engine/src/
└── lib/
    └── cache-layer.ts    # NEW: 캐싱 레이어
```

---

## Task 3: AgentState 확장

### 3.1 추가 필드

```typescript
// state-definition.ts
export const AgentState = Annotation.Root({
  // ... 기존 필드 ...

  // NEW: Agent 간 결과 공유
  sharedContext: Annotation<SharedContext>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      nlqResults: null,
      analystResults: null,
      reporterResults: null,
      verifierResults: null,
    }),
  }),

  // NEW: 검증 결과
  verificationResult: Annotation<VerificationResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

interface SharedContext {
  nlqResults?: NLQResult;
  analystResults?: AnalystResult;
  reporterResults?: ReporterResult;
  verifierResults?: VerificationResult;
}
```

---

## Task 4: PostgreSQL Context Table

### 4.1 테이블 스키마

```sql
-- Supabase Migration
CREATE TABLE agent_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',

  -- 인덱스
  CONSTRAINT fk_session FOREIGN KEY (session_id)
    REFERENCES checkpoints(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_context_session ON agent_context(session_id);
CREATE INDEX idx_agent_context_expires ON agent_context(expires_at);

-- 자동 정리 (1시간 이상 된 컨텍스트 삭제)
CREATE OR REPLACE FUNCTION cleanup_expired_context()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_context WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Context Service

```typescript
// context-service.ts
class AgentContextService {
  async saveContext(sessionId: string, agentType: string, result: any): Promise<void>;
  async getContext(sessionId: string, agentType?: string): Promise<SharedContext>;
  async cleanupExpired(): Promise<number>;
}
```

---

## Implementation Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Verifier Agent | Now | None |
| 2 | AgentState 확장 | After Phase 1 | Verifier Agent |
| 3 | PostgreSQL Context | After Phase 2 | AgentState |
| 4 | Caching Layer | Parallel | None |

---

## Testing Strategy

### Unit Tests
- `verifier-agent.test.ts`: 검증 로직 테스트
- `cache-layer.test.ts`: 캐싱 동작 테스트

### Integration Tests
- Supervisor → Verifier 흐름 테스트
- Agent 간 컨텍스트 공유 테스트

### E2E Tests
- 전체 파이프라인 검증
- 성능 벤치마크

---

## Rollback Plan

각 단계는 독립적으로 롤백 가능:
1. Verifier: `createSupervisorStreamResponse`에서 검증 호출 제거
2. Cache: 캐시 레이어 우회, 직접 호출로 복구
3. Context: `AgentState` 기본 상태로 복귀

---

_Last Updated: 2025-12-23_
