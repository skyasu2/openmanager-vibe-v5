# Multi-Agent System 재설계 계획서

**작성일**: 2025-12-27
**버전**: 1.4.0
**상태**: Phase 5 완료 (v5.91.0 - LangGraph 최적화 포함)

---

## 1. 현황 분석

### 1.1 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Supervisor (Groq)                       │
│                    라우팅 및 조율 역할                         │
└───────────┬─────────────┬─────────────┬─────────────────────┘
            │             │             │
    ┌───────▼───────┐ ┌───▼───┐ ┌───────▼───────┐
    │  NLQ Agent    │ │Analyst│ │   Reporter    │
    │  (Cerebras)   │ │(Cere.)│ │  (Cerebras)   │
    └───────────────┘ └───────┘ └───────────────┘
```

### 1.2 발견된 문제점

| 문제 | 상세 | 영향 |
|------|------|------|
| **토큰 낭비** | Reporter가 JSON.stringify 전체 덤프 사용 | ~7,000 tokens/call |
| **역할 중복** | Reporter가 NLQ Tools 직접 호출 | 비효율적 처리 |
| **시뮬레이션 데이터** | Analyst가 FIXED_24H_DATASETS 사용 | 실제 메트릭 미반영 |
| **에이전트 격리** | 공유 메모리 없음 | 중복 분석 발생 |
| **추천 명령어 하드코딩** | 5개 패턴만 존재 | 유연성 부족 |

### 1.3 토큰 사용량 분석

```
Reporter Agent (1회 호출당):
├── RAG 결과 전체 덤프: ~2,000 tokens
├── 로그 분석 결과 덤프: ~2,500 tokens
├── 메트릭 상태 덤프: ~2,000 tokens
├── 시스템 프롬프트: ~500 tokens
└── 합계: ~7,000 tokens/call

Analyst Agent (1회 호출당):
├── 이상 감지 결과: ~1,000 tokens
├── 트렌드 예측 결과: ~800 tokens
├── 시스템 프롬프트: ~300 tokens
└── 합계: ~2,100 tokens/call
```

---

## 2. 에이전트 역할 재정의

### 2.1 핵심 원칙

> **NLQ Agent는 "서버 메트릭 조회"가 아닌 "자연어 질의 처리 및 사용자 질문 분석"이 핵심 역할**

### 2.2 에이전트별 책임 (SRP 준수)

| Agent | 핵심 역할 | Input | Output | Provider |
|-------|----------|-------|--------|----------|
| **Supervisor** | 의도 분류 + 라우팅 | User Query | Agent 선택 + Handoff | Groq |
| **NLQ Agent** | 자연어 질의 이해 + 답변 생성 | Query + Context | 자연어 응답 | Cerebras |
| **Analyst Agent** | 데이터 기반 이상/트렌드 분석 | Metrics Data | 분석 결과 (구조화) | Cerebras |
| **Reporter Agent** | 분석 결과 종합 보고서 작성 | 분석 결과들 | 장애 보고서 | Cerebras |
| **Verifier Agent** | 응답 품질 검증 | Agent 출력 | 검증 결과 | Mistral |

### 2.3 역할 상세 설명

#### NLQ Agent (자연어 질의 처리)
```
책임:
├── 사용자 질문 의도 파악
├── 필요한 정보 수집 (도구 호출)
├── 수집된 정보 기반 답변 생성
└── 자연어로 명확한 응답 제공

예시:
├── "CPU 80% 이상인 서버 알려줘" → 메트릭 조회 + 필터링 + 자연어 응답
├── "어제 장애 원인이 뭐였어?" → 로그 분석 + 원인 추론 + 설명
└── "다음 주 트래픽 예측해줘" → Analyst 결과 참조 + 해석 + 응답
```

#### Analyst Agent (데이터 분석 전문)
```
책임:
├── 이상 감지 (Anomaly Detection)
├── 트렌드 예측 (Trend Prediction)
├── 패턴 분석 (Pattern Analysis)
└── 구조화된 분석 결과 반환

출력 형식:
{
  "anomalies": [...],      // 감지된 이상
  "trends": [...],         // 예측 트렌드
  "confidence": 0.85,      // 신뢰도
  "summary": "..."         // 요약 (200자 이내)
}
```

#### Reporter Agent (보고서 작성 전문)
```
책임:
├── 분석 결과 종합 (NLQ + Analyst 결과)
├── 장애 보고서 템플릿 적용
├── 권장 조치 사항 제안
└── Markdown 형식 보고서 생성

입력: 이미 분석된 결과 (JSON.stringify 전체 덤프 X)
출력: 구조화된 장애 보고서
```

---

## 3. 개선 아키텍처

### 3.1 Hierarchical Supervisor + Shared Memory

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Supervisor (Groq)                             │
│                   의도 분류 + 에이전트 라우팅                          │
│                                                                      │
│   "서버 상태 요약해줘" → NLQ Agent                                    │
│   "장애 보고서 작성해줘" → NLQ → Analyst → Reporter (Chain)           │
│   "CPU 이상 감지해줘" → Analyst Agent                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   NLQ Agent     │  │  Analyst Agent  │  │ Reporter Agent  │
│   (Cerebras)    │  │   (Cerebras)    │  │   (Cerebras)    │
│                 │  │                 │  │                 │
│ 자연어 이해     │  │ 이상 감지       │  │ 보고서 작성     │
│ 질의 처리       │  │ 트렌드 예측     │  │ 결과 종합       │
│ 답변 생성       │  │ 패턴 분석       │  │ 권장 조치       │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │     Shared Context Store        │
            │         (Upstash Redis)         │
            │                                 │
            │  agent:result:{sessionId}       │
            │  agent:context:{sessionId}      │
            │  TTL: 10분                       │
            └─────────────────────────────────┘
```

### 3.2 Context Compression 전략

**Before (현재)**:
```typescript
const prompt = `
## RAG 결과
${JSON.stringify(ragResult, null, 2)}  // ~2,000 tokens

## 로그 분석
${JSON.stringify(logsResult, null, 2)}  // ~2,500 tokens
`;
```

**After (개선)**:
```typescript
const prompt = `
## RAG 요약 (상위 3개)
${ragResult.slice(0, 3).map(r => `- ${r.title}: ${r.summary}`).join('\n')}

## 로그 요약
- 에러 수: ${logsResult.errorCount}
- 주요 에러: ${logsResult.topErrors.slice(0, 3).join(', ')}
- 기간: ${logsResult.timeRange}
`;
```

**예상 효과**: 7,000 tokens → 800 tokens (88% 감소)

---

## 4. 구현 계획

### Phase 1: 토큰 최적화 (1-2일)

#### 1.1 Reporter Prompt 압축
```typescript
// reporter-agent.ts 수정
function compressRagResult(ragResult: RAGResult[]): string {
  return ragResult
    .slice(0, 3)
    .map(r => `- [${r.source}] ${r.summary.slice(0, 100)}`)
    .join('\n');
}

function compressLogResult(logsResult: LogAnalysis): string {
  return `에러: ${logsResult.errorCount}건, 주요: ${logsResult.topErrors[0]}`;
}
```

#### 1.2 Analyst 출력 구조화
```typescript
// analyst-agent.ts 수정
interface AnalystOutput {
  anomalies: AnomalySummary[];  // 최대 5개
  trends: TrendSummary[];       // 최대 3개
  confidence: number;
  summary: string;              // 200자 제한
}
```

### Phase 2: 역할 분리 (2-3일)

#### 2.1 Reporter에서 NLQ Tools 제거
- `getServerLogsTool` → Analyst로 이동
- `getServerMetricsTool` → NLQ Agent 전용
- Reporter는 분석된 결과만 수신

#### 2.2 Shared Context Store 구현
```typescript
// shared-context.ts (신규)
export async function saveAgentResult(
  sessionId: string,
  agentName: string,
  result: unknown
): Promise<void> {
  await redis.set(
    `agent:result:${sessionId}:${agentName}`,
    JSON.stringify(result),
    { ex: 600 }  // 10분 TTL
  );
}

export async function getAgentResult(
  sessionId: string,
  agentName: string
): Promise<unknown | null> {
  const data = await redis.get(`agent:result:${sessionId}:${agentName}`);
  return data ? JSON.parse(data) : null;
}
```

### Phase 3: 실제 메트릭 연동 (3-5일)

#### 3.1 Analyst 데이터 소스 변경
```typescript
// Before: 시뮬레이션 데이터
const data = loadHourlyScenarioData(serverId);

// After: 실제 메트릭
const data = await fetchRealMetrics(serverId, timeRange);
```

#### 3.2 메트릭 수집 인터페이스
```typescript
interface MetricsProvider {
  fetchCpuMetrics(serverId: string, range: TimeRange): Promise<MetricPoint[]>;
  fetchMemoryMetrics(serverId: string, range: TimeRange): Promise<MetricPoint[]>;
  fetchNetworkMetrics(serverId: string, range: TimeRange): Promise<MetricPoint[]>;
}
```

### Phase 4: 에이전트 협업 강화 (5-7일)

#### 4.1 Chain 패턴 구현
```typescript
// 장애 보고서 생성 Flow
const chain = [
  { agent: 'nlq', task: 'query_understanding' },
  { agent: 'analyst', task: 'anomaly_detection' },
  { agent: 'analyst', task: 'trend_prediction' },
  { agent: 'reporter', task: 'report_generation' },
  { agent: 'verifier', task: 'quality_check' },
];
```

#### 4.2 결과 공유 프로토콜
```typescript
interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  context: {
    query: string;
    previousResults: Map<string, unknown>;
    requiredOutput: string;
  };
}
```

---

## 5. 검증 계획

### 5.1 토큰 사용량 측정
```bash
# Before/After 비교
curl -X POST .../supervisor \
  -d '{"messages":[{"role":"user","content":"장애 보고서 작성해줘"}]}'

# 토큰 사용량 로그 확인
grep "tokenUsage" logs/ai-engine.log
```

### 5.2 응답 품질 검증
| 테스트 케이스 | 기대 결과 |
|--------------|----------|
| "CPU 80% 이상 서버" | 정확한 서버 목록 + 자연어 설명 |
| "어제 장애 원인" | 로그 기반 분석 + 명확한 원인 설명 |
| "장애 보고서 작성" | 구조화된 Markdown 보고서 |

### 5.3 성능 목표
| 지표 | 현재 | 목표 |
|------|------|------|
| Reporter 토큰 | ~7,000 | < 1,000 |
| Analyst 토큰 | ~2,100 | < 500 |
| 응답 시간 | 6.7s | < 5s |
| 일일 처리량 | ~200 queries | > 1,000 queries |

---

## 6. 파일 변경 목록

| 파일 | 변경 내용 | Phase |
|------|----------|-------|
| `reporter-agent.ts` | Prompt 압축, NLQ Tools 제거 | 1, 2 |
| `analyst-agent.ts` | 출력 구조화, 실제 메트릭 연동 | 1, 3 |
| `nlq-agent.ts` | 역할 명확화 (자연어 처리 중심) | 2 |
| `shared-context.ts` | 신규 - 에이전트 결과 공유 | 2 |
| `SimpleAnomalyDetector.ts` | 실제 메트릭 소스 연동 | 3 |
| `multi-agent-supervisor.ts` | Chain 패턴 지원 | 4 |

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| Prompt 압축으로 정보 손실 | 응답 품질 저하 | A/B 테스트로 최적 압축률 탐색 |
| 실제 메트릭 API 지연 | 응답 시간 증가 | 캐싱 + Timeout 설정 |
| 에이전트 간 통신 오류 | 작업 실패 | Fallback to 단독 처리 |

---

## 8. 다음 단계

1. **Phase 1 승인 요청**: 토큰 최적화 먼저 진행
2. 구현 후 토큰 사용량 측정
3. Phase 2 진행 여부 결정

---

---

## 9. 구현 완료 내역

### Phase 1: 토큰 최적화 ✅ (2025-12-27)

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `reporter-agent.ts` | `compressRagResult()`, `compressLogResult()`, `compressMetricsResult()`, `compressCommandResult()` 함수 추가 |
| `analyst-agent.ts` | `AnalystCompressedOutput` 인터페이스, `compressAnomalyResult()`, `compressTrendResult()` 함수 추가 |

#### 예상 토큰 절감
| Agent | Before | After | 절감률 |
|-------|--------|-------|--------|
| Reporter | ~7,000 | ~800 | 88% |
| Analyst | ~2,100 | ~500 | 76% |

#### 핵심 변경사항
1. **Reporter Prompt 압축**
   - RAG 결과: JSON 전체 → 상위 3개 요약 (100자/항목)
   - 로그 분석: JSON 전체 → 에러/경고 카운트 + 주요 에러 3개
   - 메트릭 상태: JSON 전체 → 한 줄 요약
   - 추천 명령어: JSON 전체 → 상위 3개 포맷팅

2. **Analyst 출력 구조화**
   - `_compressed` 필드 추가 (200자 요약)
   - `AnomalySummary[]`, `TrendSummary[]` 인터페이스 정의
   - 최대 5개 이상, 3개 트렌드로 제한

### Phase 2: 역할 분리 ✅ (2025-12-27)

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `shared-context.ts` | 신규 - Redis 기반 에이전트 결과 공유 저장소 |
| `reporter-agent.ts` | NLQ Tools 제거, Shared Context 참조로 전환 |
| `multi-agent-supervisor.ts` | `saveAgentResultsFromHistory()` 추가 |

#### 구현 상세
1. **Shared Context Store** (`shared-context.ts`)
   - `saveAgentResult()`: 에이전트 결과 Redis 저장 (TTL 10분)
   - `getAgentResult()`: 에이전트 결과 조회
   - `buildReporterContext()`: Reporter용 컨텍스트 빌드
   - `formatContextForPrompt()`: 프롬프트 문자열 변환

2. **Reporter Agent 역할 분리**
   - ❌ 제거: `getServerLogsTool`, `getServerMetricsTool` 직접 호출
   - ✅ 추가: Shared Context에서 NLQ/Analyst 결과 참조
   - 미사용 코드 정리: `compressLogResult()`, `compressMetricsResult()` 등

3. **Supervisor Context 저장**
   - 에이전트 실행 후 결과 자동 저장 (패턴 매칭 기반)
   - NLQ/Analyst/Reporter 결과 분류 및 저장

#### 효과
- ✅ SRP (단일 책임 원칙) 준수
- ✅ 에이전트 간 중복 분석 방지
- ✅ Reporter 토큰 효율성 유지 (Phase 1 88% 절감 유지)

#### 배포 정보
- Cloud Run Revision: `ai-engine-00053-4jg`
- 배포 시각: 2025-12-27 20:51 KST

### Phase 5: Agent Dependency System 🔄 (2025-12-28 진행 중)

#### 5.1 목표
RCA/Capacity Agent가 NLQ/Analyst 결과 없이 실행되는 것을 방지하고,
의존성 기반 라우팅으로 분석 품질을 보장합니다.

#### 5.2 구현 완료 (코드 작성됨, 미커밋)

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `shared-context.ts` | `AGENT_DEPENDENCIES` 맵, `buildAgentContext()`, `hasRequiredDependencies()` | ✅ 구현 |
| `checkpointer.ts` | `DEFAULT_RECURSION_LIMIT=8`, Cloud Run 로깅 개선 | ✅ 구현 |
| `multi-agent-supervisor.ts` | `validateAgentDependencies()`, `shouldUseAdvancedAgent()` | ✅ 구현 |
| `feature-cards.data.ts` | AI 카드 기술 트렌드 반영 (Wafer-Scale, LPU, SLM, Agentic) | ✅ 구현 |
| `ai-model-policy.md` | Google AI → Embedding Only 전환 문서화 | ✅ 문서 |

#### 5.3 Agent 의존성 맵
```typescript
const AGENT_DEPENDENCIES: Record<AgentName, AgentName[]> = {
  nlq: [],                      // 독립 실행
  analyst: ['nlq'],             // NLQ 결과 필요
  rca: ['nlq', 'analyst'],      // NLQ + Analyst 필요
  capacity: ['nlq', 'analyst'], // NLQ + Analyst 필요
  reporter: [],                 // buildReporterContext() 사용
  supervisor: [],
};
```

#### 5.4 Recursion Limit
- `DEFAULT_RECURSION_LIMIT = 8`
- 정상 흐름: 4-6 steps (NLQ → Analyst → RCA/Capacity → Reporter)
- 재시도 버퍼: +2 steps
- 무한 루프 및 토큰 폭발 방지

#### 5.5 Supervisor 프롬프트 강화 ✅ (2025-12-28)

LangGraph `createSupervisor`는 내부 라우팅을 직접 제어하기 어려우므로,
**Supervisor 프롬프트에서 의존성 규칙을 강제**하는 방식으로 구현했습니다.

**추가된 프롬프트 규칙:**
```
🚨 에이전트 의존성 규칙 (필수 준수)

의존성 체인:
nlq_agent (독립) → analyst_agent → rca_agent / capacity_agent → reporter_agent

⛔ 금지: rca_agent나 capacity_agent를 nlq_agent/analyst_agent 없이 직접 호출하면 안 됩니다!
```

#### 5.6 LangGraph 최적화 ✅ (2025-12-28)

**분석 결과:**
- NLQ SubGraph (nlq-subgraph.ts, 506 lines)가 import만 되고 실제 미사용
- NLQ Agent는 `createReactAgent`로 직접 처리 중
- Cerebras 24M 토큰 한도로 4,000+ 요청/일 처리 가능

**적용된 개선:**

| 항목 | 변경 내용 | 효과 |
|------|----------|------|
| **데드코드 제거** | nlq-subgraph.ts, nlq-state.ts 삭제 | -1,010 lines |
| **Recursion limit** | 8 → 10 상향 | retry buffer +2 확보 |
| **Workflow 캐싱** | 5분 TTL 캐시 적용 | 초기화 오버헤드 감소 |
| **invalidateWorkflowCache()** | 캐시 무효화 함수 추가 | 에러 복구 지원 |

**LLM 호출 분석 (요청당):**
```
단순 쿼리 ("서버 상태"):     2-4회
중간 쿼리 ("패턴 분석"):     5-8회
복합 쿼리 ("장애 원인"):     11-14회
```

#### 5.7 남은 작업

| 작업 | 설명 | 우선순위 |
|------|------|----------|
| **단위 테스트 추가** | `hasRequiredDependencies()` 테스트 | 🟡 중간 |
| **통합 테스트** | 복합 쿼리 시나리오 검증 | 🟡 중간 |
| **Cloud Run 배포** | Phase 5 코드 반영 | 🔴 높음 |

#### 5.8 예상 효과
- ✅ RCA/Capacity 분석 정확도 향상 (선행 데이터 보장)
- ✅ 순환 루프 방지 (recursionLimit)
- ✅ 디버깅 용이성 (의존성 로깅)

---

_Last Updated: 2025-12-28_
_Document Version: 1.4.0_
