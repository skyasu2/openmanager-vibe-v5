# LangChain/LangGraph → Vercel AI SDK 마이그레이션 계획서

**Version**: 1.0.0
**Created**: 2025-12-28
**Target Version**: v5.85.0

---

## 1. 마이그레이션 배경

### 1.1 현재 문제

| 문제 | 영향 | 근본 원인 |
|------|------|----------|
| AI 어시스턴트가 실제 서버 데이터 반환 안함 | 사용자 경험 저하 | Cerebras `llama-3.3-70b`가 **multi-turn tool calling 미지원** |
| LangGraph Supervisor 에이전트 핸드오프 실패 | 멀티에이전트 동작 불가 | Supervisor가 도구 호출로 에이전트 전환하는 구조 |

**Cerebras 공식 문서**:
> "Multi-turn tool calling is currently not supported with the llama-3.3-70b model"

### 1.2 해결 방안

**Vercel AI SDK**의 `maxSteps` 패턴 사용:
- 각 step이 **독립적인 단일 호출**
- SDK가 tool result를 자동으로 다음 호출에 주입
- Multi-turn 제약을 **우회**

---

## 2. 현재 아키텍처 분석

### 2.1 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              사용자                                      │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js 16)                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ /api/ai/jobs    │→→│ Supabase       │  │ SSE Polling     │          │
│  │ POST: Job 생성   │  │ ai_jobs 테이블  │  │ Redis 결과 전달  │          │
│  └────────┬────────┘  └─────────────────┘  └────────▲────────┘          │
│           │                                         │                    │
│           │ Fire-and-forget                         │                    │
│           ▼                                         │                    │
└───────────┼─────────────────────────────────────────┼────────────────────┘
            │                                         │
            │ HTTP POST                               │ GET job result
            ▼                                         │
┌───────────────────────────────────────────────────────────────────────────┐
│  Cloud Run (AI Engine)                                                    │
│  ┌─────────────────────────────────────────────────────────┐             │
│  │ LangGraph Supervisor (현재)                               │             │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │             │
│  │ │ NLQ     │ │ RCA     │ │ Analyst │ │ Reporter│ ...     │             │
│  │ │ Agent   │ │ Agent   │ │ Agent   │ │ Agent   │         │             │
│  │ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │             │
│  └──────┼───────────┼───────────┼───────────┼──────────────┘             │
│         └───────────┴───────────┴───────────┘                            │
│                           │                                               │
│                           ▼                                               │
│  ┌─────────────────────────────────────────────────┐                     │
│  │ Redis (Upstash)                                  │                     │
│  │ - Job 결과 저장 (job:<id>)                        │                     │
│  │ - Job 진행 상태 (job:<id>:progress)               │                     │
│  └─────────────────────────────────────────────────┘                     │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.2 컴포넌트별 역할

| 컴포넌트 | 역할 | 마이그레이션 영향 |
|----------|------|------------------|
| **Vercel** | Job 생성, SSE 폴링 | ⚪ 변경 없음 |
| **Cloud Run** | LangGraph 멀티에이전트 처리 | 🔴 **주요 변경 대상** |
| **Redis** | Job 결과 임시 저장 | ⚪ 변경 없음 |
| **Supabase** | Job 메타데이터 저장 | ⚪ 변경 없음 |

---

## 3. LangChain/LangGraph 의존성 목록

### 3.1 Cloud Run AI Engine 파일 (18개)

#### Core (완전 재작성 필요)
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `services/langgraph/multi-agent-supervisor.ts` | Supervisor 그래프 | `@langchain/langgraph-supervisor`, `createReactAgent` |
| `lib/state-definition.ts` | LangGraph State | `Annotation`, `messagesStateReducer` |
| `lib/checkpointer.ts` | 체크포인터 | `MemorySaver`, `PostgresSaver` |

#### Agents (도구 변환 필요)
| 파일 | 의존성 |
|------|--------|
| `agents/nlq-agent.ts` | `tool` from `@langchain/core/tools` |
| `agents/rca-agent.ts` | `tool` from `@langchain/core/tools` |
| `agents/analyst-agent.ts` | `tool` from `@langchain/core/tools` |
| `agents/capacity-agent.ts` | `tool` from `@langchain/core/tools` |
| `agents/reporter-agent.ts` | `tool`, `AIMessage`, `HumanMessage` |
| `agents/verifier-agent.ts` | `tool` from `@langchain/core/tools` |

#### Model Config (프로바이더 변경)
| 파일 | 의존성 |
|------|--------|
| `lib/model-config.ts` | `ChatMistralAI`, `ChatGroq`, `ChatCerebras` |

#### Context Compression (메시지 타입 변경)
| 파일 | 의존성 |
|------|--------|
| `lib/context-compression/summarizer.ts` | `BaseMessage`, `HumanMessage`, `SystemMessage` |
| `lib/context-compression/buffer-manager.ts` | `BaseMessage`, `RemoveMessage` |
| `lib/context-compression/compression-trigger.ts` | `BaseMessage` |
| `lib/context-compression/compression-node.ts` | `BaseMessage` |
| `lib/context-compression/encoding-counter.ts` | `BaseMessage` |

#### Others
| 파일 | 의존성 |
|------|--------|
| `tools/web-search.ts` | `tool` from `@langchain/core/tools` |
| `test-groq-tool-calling.ts` | 테스트 파일 (삭제) |

### 3.2 프론트엔드 참조 (21개 파일)

**런타임 의존성 없음** - 주로 문서/설명 문자열:
- `src/data/feature-cards.data.ts` - 기능 소개 텍스트
- `src/data/tech-stacks.data.ts` - 기술 스택 목록
- `src/config/ai-engine.ts` - 설정 파일 주석
- 기타 컴포넌트/설정 파일

### 3.3 문서 파일 (26개)

업데이트 필요한 주요 문서:
- `docs/core/architecture/ai/ai-engine-architecture.md`
- `docs/core/architecture/ai/ai-assistant-architecture.md`
- `docs/development/ai/multi-agent-redesign-plan.md`
- `docs/status.md`

---

## 4. 마이그레이션 전략

### 4.1 패키지 변경

```bash
# 추가
npm install @ai-sdk/cerebras @ai-sdk/mistral

# 제거
npm uninstall \
  @langchain/cerebras \
  @langchain/core \
  @langchain/groq \
  @langchain/langgraph \
  @langchain/langgraph-checkpoint-postgres \
  @langchain/langgraph-supervisor \
  @langchain/mistralai \
  @ai-sdk/langchain
```

**변경 전 → 후**:
```json
{
  "dependencies": {
    // 제거
    "@langchain/cerebras": "^1.0.1",
    "@langchain/core": "^1.1.5",
    "@langchain/groq": "^1.0.2",
    "@langchain/langgraph": "^1.0.4",
    "@langchain/langgraph-checkpoint-postgres": "^1.0.0",
    "@langchain/langgraph-supervisor": "^1.0.0",
    "@langchain/mistralai": "^1.0.2",
    "@ai-sdk/langchain": "^1.0.113",

    // 유지
    "@ai-sdk/google": "^2.0.43",
    "@ai-sdk/groq": "^2.0.32",
    "ai": "^5.0.102",

    // 추가
    "@ai-sdk/cerebras": "^1.0.x",
    "@ai-sdk/mistral": "^1.0.x"
  }
}
```

### 4.2 도구 변환 패턴

```typescript
// Before (LangChain)
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const getServerMetricsTool = tool(
  async ({ serverId, metric }: GetServerMetricsInput) => {
    const state = getCurrentState();
    return { success: true, servers: state.servers };
  },
  {
    name: 'getServerMetrics',
    description: '서버 CPU/메모리/디스크 상태를 조회합니다',
    schema: z.object({
      serverId: z.string().optional(),
      metric: z.enum(['cpu', 'memory', 'disk', 'all']),
    }),
  }
);

// After (AI SDK)
import { tool } from 'ai';
import { z } from 'zod';

export const getServerMetricsTool = tool({
  description: '서버 CPU/메모리/디스크 상태를 조회합니다',
  inputSchema: z.object({
    serverId: z.string().optional().describe('특정 서버 ID'),
    metric: z.enum(['cpu', 'memory', 'disk', 'all']).describe('조회할 메트릭'),
  }),
  execute: async ({ serverId, metric }) => {
    const state = getCurrentState();
    return { success: true, servers: state.servers };
  },
});
```

### 4.3 Supervisor 재구현 (Router Agent 패턴)

```typescript
// new file: services/ai-sdk/multi-agent-supervisor.ts

import { generateText, tool, stepCountIs } from 'ai';
import { cerebras } from '@ai-sdk/cerebras';
import { groq } from '@ai-sdk/groq';
import { mistral } from '@ai-sdk/mistral';

// Agent tools
import { getServerMetricsTool, filterServersTool } from '../../agents/nlq-tools';
import { performRCATool } from '../../agents/rca-tools';
import { analyzePatternsTool } from '../../agents/analyst-tools';

// Model fallback chain
const getModel = (provider: 'cerebras' | 'groq' | 'mistral') => {
  switch (provider) {
    case 'cerebras': return cerebras('llama-3.3-70b');
    case 'groq': return groq('llama-3.3-70b-versatile');
    case 'mistral': return mistral('mistral-small-2506');
  }
};

export async function runSupervisor(
  query: string,
  options?: { sessionId?: string }
) {
  const { text, steps } = await generateText({
    model: getModel('cerebras'),
    stopWhen: stepCountIs(10),
    system: `당신은 서버 모니터링 AI 어시스턴트입니다.
사용자 질문을 분석하고 적절한 도구를 호출하여 답변합니다.

사용 가능한 도구:
- getServerMetrics: 서버 상태 조회
- filterServers: 조건별 서버 필터링
- performRCA: 장애 원인 분석
- analyzePatterns: 패턴 분석`,

    tools: {
      getServerMetrics: getServerMetricsTool,
      filterServers: filterServersTool,
      performRCA: performRCATool,
      analyzePatterns: analyzePatternsTool,
    },

    prompt: query,
  });

  return { text, steps };
}

// Streaming version for API response
export async function createSupervisorStreamResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream> {
  const { textStream } = await streamText({
    model: getModel('cerebras'),
    stopWhen: stepCountIs(10),
    system: SUPERVISOR_SYSTEM_PROMPT,
    tools: ALL_TOOLS,
    prompt: query,
  });

  return textStream;
}
```

---

## 5. 영향 없는 컴포넌트 (변경 불필요)

### 5.1 Vercel (Next.js)

| 파일/모듈 | 이유 |
|-----------|------|
| `/api/ai/jobs/route.ts` | Cloud Run 호출만 하므로 변경 없음 |
| `/api/ai/jobs/[id]/stream/route.ts` | Redis 폴링 로직이므로 변경 없음 |
| `src/lib/redis/*` | 순수 Redis 클라이언트, AI와 무관 |

### 5.2 Redis (Upstash)

| 항목 | 이유 |
|------|------|
| Job 결과 저장 구조 | 동일하게 유지 (`job:<id>`) |
| TTL 정책 | 변경 없음 (5분) |
| 연결 방식 | HTTP-based, 변경 없음 |

### 5.3 Supabase

| 항목 | 이유 |
|------|------|
| `ai_jobs` 테이블 | 스키마 변경 없음 |
| RLS 정책 | 변경 없음 |
| 체크포인터 | AI SDK는 별도 체크포인터 불필요 |

---

## 6. 구현 단계

### Phase 1: 도구 마이그레이션 (1-2일)

```
cloud-run/ai-engine/src/
├── agents/
│   ├── nlq-tools.ts          # 새 파일 (AI SDK 도구)
│   ├── rca-tools.ts          # 새 파일
│   ├── analyst-tools.ts      # 새 파일
│   └── ...
```

**작업 내용**:
1. 기존 에이전트에서 도구 정의만 추출
2. AI SDK `tool()` 형식으로 변환
3. 기존 에이전트 파일은 참조용 유지

### Phase 2: Supervisor 재구현 (2-3일)

```
cloud-run/ai-engine/src/
├── services/
│   ├── langgraph/              # 기존 (deprecated)
│   └── ai-sdk/                 # 새 디렉토리
│       ├── multi-agent-supervisor.ts
│       ├── model-provider.ts   # 프로바이더 팩토리
│       └── types.ts
```

**작업 내용**:
1. Router Agent 패턴으로 Supervisor 구현
2. 모델 fallback 체인 구현
3. 스트리밍 응답 지원

### Phase 3: 통합 및 테스트 (2-3일)

**작업 내용**:
1. `jobs.ts` 라우터에서 새 Supervisor 호출
2. E2E 테스트 (Playwright)
3. 성능 테스트 (응답 시간, 토큰 사용량)

### Phase 4: 정리 (1일)

**작업 내용**:
1. 기존 LangChain 코드 삭제
2. 패키지 정리 (`npm uninstall`)
3. 문서 업데이트

---

## 7. 파일 변경 계획

### 7.1 삭제 파일
```
cloud-run/ai-engine/src/
├── services/langgraph/                      # 전체 디렉토리
│   ├── multi-agent-supervisor.ts
│   └── supervisor-verifier.integration.test.ts
├── lib/
│   ├── state-definition.ts                  # LangGraph state
│   └── checkpointer.ts                      # LangGraph checkpointer
├── agents/
│   ├── nlq-agent.ts                         # 기존 에이전트 (도구 분리 후)
│   ├── rca-agent.ts
│   ├── analyst-agent.ts
│   ├── capacity-agent.ts
│   ├── reporter-agent.ts
│   └── verifier-agent.ts
└── test-groq-tool-calling.ts                # 테스트 파일
```

### 7.2 신규 파일
```
cloud-run/ai-engine/src/
├── services/ai-sdk/
│   ├── multi-agent-supervisor.ts            # 새 Supervisor
│   ├── model-provider.ts                    # 모델 팩토리
│   ├── tool-registry.ts                     # 도구 레지스트리
│   └── types.ts
├── tools/                                   # 도구 디렉토리 (재구성)
│   ├── server-metrics.ts                    # 서버 메트릭 도구
│   ├── server-filter.ts                     # 서버 필터 도구
│   ├── rca-analysis.ts                      # RCA 도구
│   ├── pattern-analysis.ts                  # 패턴 분석 도구
│   ├── capacity-planning.ts                 # 용량 계획 도구
│   └── report-generation.ts                 # 리포트 생성 도구
```

### 7.3 수정 파일
```
cloud-run/ai-engine/
├── package.json                             # 의존성 변경
├── src/
│   ├── routes/jobs.ts                       # Supervisor 호출 변경
│   ├── lib/
│   │   └── model-config.ts                  # AI SDK 프로바이더로 변경
│   └── lib/context-compression/             # 메시지 타입 변경
│       ├── summarizer.ts
│       ├── buffer-manager.ts
│       ├── compression-trigger.ts
│       ├── compression-node.ts
│       └── encoding-counter.ts
```

---

## 8. 문서 업데이트 목록

### 8.1 아키텍처 문서
- [ ] `docs/core/architecture/ai/ai-engine-architecture.md`
- [ ] `docs/core/architecture/ai/ai-assistant-architecture.md`
- [ ] `docs/core/ai/ai-architecture.md`

### 8.2 개발 문서
- [ ] `docs/development/ai/multi-agent-redesign-plan.md`
- [ ] `docs/development/ai/async-job-architecture.md`

### 8.3 상태 문서
- [ ] `docs/status.md`

### 8.4 프론트엔드 참조 (텍스트 수정)
- [ ] `src/data/feature-cards.data.ts`
- [ ] `src/data/tech-stacks.data.ts`

---

## 9. 리스크 및 완화 방안

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| AI SDK 도구 호출 동작 차이 | 중간 | 단위 테스트로 각 도구 검증 |
| Cerebras 단일 턴 제약 | 낮음 | `maxSteps`로 다중 호출 처리 |
| 응답 시간 증가 | 중간 | 스트리밍 응답 + 캐싱 유지 |
| Context Compression 호환성 | 중간 | AI SDK 메시지 타입으로 변환 레이어 |

---

## 10. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| NLQ 도구 호출 성공 | "CPU 80% 이상 서버" 쿼리로 실제 데이터 반환 |
| 멀티스텝 동작 | 복잡한 쿼리에서 여러 도구 순차 호출 |
| 응답 시간 | 평균 5초 이내 (현재 대비 동등 또는 개선) |
| 에러율 | 5% 미만 |

---

## 11. 롤백 계획

1. 기존 LangGraph 코드를 `_deprecated` 브랜치로 보존
2. `jobs.ts`에서 Supervisor import 경로만 변경하면 롤백 가능
3. 환경 변수 `AI_ENGINE_VERSION=langgraph|ai-sdk`로 동적 전환 가능

---

## Appendix A: 모델 호환성 매트릭스

| 모델 | Provider | AI SDK Package | Tool Calling | Status |
|------|----------|----------------|--------------|--------|
| llama-3.3-70b | Cerebras | @ai-sdk/cerebras | ✅ | Primary |
| llama-3.3-70b-versatile | Groq | @ai-sdk/groq | ✅ | Fallback |
| mistral-small-2506 | Mistral | @ai-sdk/mistral | ✅ | Verifier |

## Appendix B: API 변경 없음 확인

```typescript
// 현재 API (변경 없음)
POST /api/ai/supervisor
POST /api/ai/jobs
GET  /api/ai/jobs/:id
GET  /api/ai/jobs/:id/stream

// Cloud Run API (변경 없음)
POST /api/jobs/process
GET  /api/jobs/:id
```

---

_Last Updated: 2025-12-28_
