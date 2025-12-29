# AI Engine 개선 작업 계획서

**버전**: v5.84.x
**작성일**: 2025-12-28
**작성자**: Claude Opus 4.5
**상태**: 계획 수립

---

## 1. 개요

### 1.1 현재 상태
- **버전**: v5.83.12
- **아키텍처**: LangGraph Multi-Agent Supervisor (6 Agents + 1 Verifier)
- **Provider**: Cerebras (Primary) → Groq (Fallback) → Mistral (Verifier)
- **평가 점수**: 8.2/10

### 1.2 분석 결과 요약
| 영역 | 현재 점수 | 목표 점수 |
|------|----------|----------|
| Provider 전략 | 9/10 | 9/10 (유지) |
| Agent 역할 분리 | 8/10 | 9/10 |
| Fallback 체인 | 9/10 | 9/10 (유지) |
| Verification | 8/10 | 9/10 |
| Context 관리 | 7/10 | 8/10 |
| 에러 처리 | 8/10 | 9/10 |

---

## 2. 개선 항목

### 2.1 [P0 - 높음] RCA/Capacity Agent 실제 데이터 연결

**현재 문제**:
```typescript
// rca-agent.ts - 시뮬레이션 데이터 의존
import { FAILURE_SCENARIOS } from '../data/scenarios';
import { FIXED_24H_DATASETS } from '../data/fixed-24h-metrics';
```

RCA/Capacity Agent가 고정된 시뮬레이션 데이터에 의존하여 실제 운영 환경에서 제한적.

**개선 방안**:
```typescript
// 옵션 A: Supabase 직접 연동
const metrics = await supabase
  .from('server_metrics')
  .select('*')
  .eq('server_id', serverId)
  .gte('timestamp', startTime);

// 옵션 B: NLQ Agent 결과 재활용 (Shared Context)
const nlqResult = await getAgentResult(sessionId, 'nlq');
const analystResult = await getAgentResult(sessionId, 'analyst');
```

**작업 항목**:
- [ ] RCA Agent 도구에 Supabase 메트릭 조회 추가
- [ ] Capacity Agent에 실시간 트렌드 데이터 연동
- [ ] 시뮬레이션 데이터는 fallback으로 유지 (데이터 없을 때)
- [ ] 단위 테스트 추가

**예상 소요**: 2-3일
**영향 범위**: `rca-agent.ts`, `capacity-agent.ts`, `shared-context.ts`

---

### 2.2 [P1 - 중간] Supervisor 프롬프트 최적화

**현재 문제**:
```typescript
const SUPERVISOR_PROMPT = `...`; // 70+ 줄의 수동 라우팅 규칙
```

프롬프트가 과도하게 길어 토큰 소비 증가 및 유지보수 어려움.

**개선 방안**:
```typescript
// Agent description 활용 (LangGraph 자동 라우팅)
const nlqAgent = createReactAgent({
  name: 'nlq_agent',
  description: '서버 메트릭/로그 조회 전문. 키워드: 서버, CPU, 메모리, 상태, 로그',
  // ...
});

// 간소화된 Supervisor 프롬프트
const SUPERVISOR_PROMPT = `당신은 Multi-Agent Supervisor입니다.
사용자 의도에 가장 적합한 에이전트를 선택하세요.
의존성 규칙: nlq → analyst → rca/capacity → reporter`;
```

**작업 항목**:
- [ ] 각 Agent에 `description` 필드 추가
- [ ] SUPERVISOR_PROMPT 20줄 이내로 축소
- [ ] 라우팅 정확도 테스트 (기존 대비)
- [ ] 토큰 사용량 비교 측정

**예상 소요**: 1일
**영향 범위**: `multi-agent-supervisor.ts`

---

### 2.3 [P1 - 중간] Agent 식별 메타데이터 기반 변경

**현재 문제**:
```typescript
// 정규식 기반 Agent 식별 - 오탐/미탐 가능
const agentPatterns: Record<AgentName, RegExp[]> = {
  nlq: [/전체 서버 현황|서버 상태|메트릭/i],
  // ...
};
```

**개선 방안**:
```typescript
// 메시지 메타데이터에 Agent 이름 포함
const aiMessage = new AIMessage({
  content: response,
  additional_kwargs: {
    agent_name: 'nlq_agent',
    tool_calls_made: ['getServerMetrics'],
  },
});

// 저장 시 메타데이터 활용
async function saveAgentResultsFromHistory(messages, sessionId) {
  for (const msg of messages) {
    const agentName = msg.additional_kwargs?.agent_name;
    if (agentName) {
      await saveAgentResult(sessionId, agentName, msg.content);
    }
  }
}
```

**작업 항목**:
- [ ] Agent 응답에 메타데이터 추가
- [ ] `saveAgentResultsFromHistory` 메타데이터 기반으로 수정
- [ ] 기존 정규식 로직은 fallback으로 유지
- [ ] 테스트 케이스 추가

**예상 소요**: 1일
**영향 범위**: `multi-agent-supervisor.ts`, `shared-context.ts`

---

### 2.4 [P2 - 낮음] Last Keeper 도구 확장

**현재 문제**:
```typescript
async function executeLastKeeperMode(query, sessionId) {
  // 도구 없이 일반 응답만 생성
  const mistralModel = createMistralModel(MISTRAL_MODELS.SMALL, ...);
  const response = await mistralModel.invoke([...]);
}
```

Last Keeper 모드에서 실시간 데이터 조회 불가.

**개선 방안**:
```typescript
// 읽기 전용 도구 제공
const lastKeeperTools = [
  getServerMetricsTool,      // 읽기 전용
  searchKnowledgeBaseTool,   // RAG 검색
];

// React Agent로 업그레이드
const lastKeeperAgent = createReactAgent({
  llm: createMistralModel(MISTRAL_MODELS.SMALL),
  tools: lastKeeperTools,
  name: 'last_keeper',
  stateModifier: createMistralCompatibleStateModifier(systemPrompt),
});
```

**작업 항목**:
- [ ] Last Keeper용 읽기 전용 도구 세트 정의
- [ ] `executeLastKeeperMode`를 React Agent로 변경
- [ ] Rate limit 상황에서 동작 테스트
- [ ] 응답 품질 비교 테스트

**예상 소요**: 1일
**영향 범위**: `multi-agent-supervisor.ts`

---

### 2.5 [P2 - 낮음] Verification 오버헤드 최적화

**현재 문제**:
```typescript
// 모든 복잡한 쿼리에 Verification 수행
const isSimpleQuery = query.length < 30 || /^(안녕|반가워|...)/i.test(query);
const { response, verification } = await executeSupervisor(query, {
  enableVerification: !isSimpleQuery,  // 현재: 단순 쿼리만 스킵
});
```

복잡한 쿼리에서 Verification이 10-20초 추가 지연 발생.

**개선 방안**:
```typescript
// 응답 신뢰도 기반 선택적 검증
const shouldVerify = determineVerificationNeed(response, query);
// 조건:
// 1. 응답에 수치 데이터 포함
// 2. 명령어 추천 포함
// 3. 장애 분석 결과

// 병렬 처리 (비차단)
if (shouldVerify) {
  // 응답 먼저 반환, 백그라운드에서 검증
  setImmediate(() => verifyAgentResponse(response, options));
}
```

**작업 항목**:
- [ ] 응답 유형별 Verification 필요성 판단 로직 추가
- [ ] 비동기 검증 옵션 구현 (선택적)
- [ ] 검증 스킵 시 신뢰도 저하 모니터링
- [ ] 성능 측정 (before/after)

**예상 소요**: 1일
**영향 범위**: `multi-agent-supervisor.ts`, `verifier-agent.ts`

---

## 3. 우선순위 매트릭스

```
영향도 ↑
        │
   P0   │  ● RCA/Capacity 실제 데이터
        │
   P1   │  ● Supervisor 프롬프트    ● Agent 식별 개선
        │
   P2   │  ● Last Keeper 도구       ● Verification 최적화
        │
        └─────────────────────────────────────────────→ 긴급도
              낮음          중간           높음
```

---

## 4. 구현 일정

| 주차 | 작업 항목 | 담당 | 상태 |
|------|----------|------|------|
| W1 | P0: RCA/Capacity 실제 데이터 연결 | - | 대기 |
| W1 | P1: Supervisor 프롬프트 최적화 | - | 대기 |
| W2 | P1: Agent 식별 메타데이터 기반 변경 | - | 대기 |
| W2 | P2: Last Keeper 도구 확장 | - | 대기 |
| W3 | P2: Verification 최적화 | - | 대기 |
| W3 | 통합 테스트 및 문서화 | - | 대기 |

---

## 5. 성공 기준

### 5.1 기능 기준
- [ ] RCA Agent가 실제 Supabase 메트릭 조회 가능
- [ ] Capacity Agent가 실시간 트렌드 데이터 활용
- [ ] Supervisor 프롬프트 50% 이상 축소
- [ ] Agent 식별 정확도 95% 이상

### 5.2 성능 기준
- [ ] 평균 응답 시간 20% 개선 (Verification 최적화)
- [ ] 토큰 사용량 15% 감소 (프롬프트 축소)
- [ ] Last Keeper 모드에서도 기본 조회 가능

### 5.3 품질 기준
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 통과 (AI 3-way review)

---

## 6. 위험 요소 및 대응

| 위험 | 가능성 | 영향 | 대응 방안 |
|------|-------|------|----------|
| Supabase 연동 지연 | 중 | 높 | 시뮬레이션 데이터 fallback 유지 |
| 프롬프트 축소 시 라우팅 오류 | 중 | 중 | A/B 테스트로 점진적 적용 |
| Verification 스킵 시 품질 저하 | 낮 | 중 | 수치 포함 응답은 항상 검증 |

---

## 7. 참고 문서

- [AI Engine Architecture](../core/architecture/ai/ai-engine-architecture.md)
- [LangGraph Supervisor Docs](https://langchain-ai.github.io/langgraph/concepts/langgraph_supervisor/)
- [Cerebras API Reference](https://inference-docs.cerebras.ai/)
- [Mistral API Docs](https://docs.mistral.ai/)

---

**다음 단계**: P0 작업부터 순차 진행, 각 단계별 코드 리뷰 필수
