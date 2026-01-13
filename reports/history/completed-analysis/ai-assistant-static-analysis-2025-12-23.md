# AI Assistant 정적 분석 리포트

**분석 일시**: 2025-12-23
**버전**: v5.83.1
**분석 유형**: 정적 코드 분석 (Static Code Analysis)

---

## 1. 아키텍처 개요

### 1.1 시스템 구성

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (Vercel)                          │
│  Next.js 16 + React 19 + Zustand State Management                   │
├─────────────────────────────────────────────────────────────────────┤
│  src/domains/ai-sidebar/    │  src/stores/                         │
│  - AISidebarV4              │  - useAISidebarStore (persist)       │
│  - EnhancedAIChat           │  - useAIChatStore                    │
│  - useAIEngine (UNIFIED)    │  - useAIStore (management)           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js Routes)                     │
├─────────────────────────────────────────────────────────────────────┤
│  /api/ai/supervisor    │ Cloud Run Proxy + Data Stream Protocol    │
│  /api/ai/jobs          │ Async Job Queue (Supabase ai_jobs table)  │
│  /api/ai/status        │ Circuit Breaker Status + Health Check     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend (Google Cloud Run)                       │
│  LangGraph Multi-Agent System + Express Server                      │
├─────────────────────────────────────────────────────────────────────┤
│  5 Agents:                     │  Core Libraries:                   │
│  - NLQ Agent (쿼리 분석)        │  - state-definition.ts            │
│  - Analyst Agent (데이터 분석)   │  - cache-layer.ts (TTL)           │
│  - Reporter Agent (리포트 생성) │  - model-config.ts (Multi-model)   │
│  - Verifier Agent (검증)        │  - embeddings.ts (pgvector)        │
│  - Reply Agent (응답 생성)      │  - supervisor.ts (LangGraph)       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Database (Supabase)                           │
│  PostgreSQL + pgvector Extension + RLS Policies                     │
├─────────────────────────────────────────────────────────────────────┤
│  - ai_jobs: Async Job Queue                                         │
│  - agent_context: 에이전트 컨텍스트 저장                             │
│  - documents: RAG 문서 저장 (Vector Search)                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend 분석

### 2.1 주요 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| `AISidebarV4` | `src/domains/ai-sidebar/components/` | 메인 사이드바 UI |
| `EnhancedAIChat` | 동일 | 채팅 인터페이스 + Thinking 표시 |
| `AISidebarHeader` | 동일 | 헤더 + 모드 표시 |
| `CloudRunStatusIndicator` | 동일 | Cloud Run 연결 상태 |

### 2.2 상태 관리 (Zustand)

3개의 분리된 스토어로 관리:

**1. useAISidebarStore** (`src/stores/useAISidebarStore.ts`)
```typescript
interface AISidebarState {
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions';
  messages: EnhancedChatMessage[];  // localStorage persist
  sessionId: string;
  functionTab: 'qa' | 'report' | 'patterns' | 'logs' | 'context';
}
```
- **특징**: `persist` 미들웨어로 localStorage 저장
- **최적화**: 최대 100개 메시지 유지 (메모리 누수 방지)
- **SSR 안전**: `skipHydration: true`

**2. useAIChatStore** (`src/stores/ai-chat-store.ts`)
```typescript
interface AIChatState {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  isThinkingMode: boolean;
  attachments: Attachment[];  // 멀티모달 지원
}
```
- **특징**: Fullpage 채팅용 (persist 없음)
- **멀티모달**: 이미지/파일 첨부 지원

**3. useAIStore** (`src/stores/modules/ai.store.ts`)
```typescript
interface AIState {
  isEnabled: boolean;
  config: { autoLearn, responseDelay, maxConcurrentTasks };
  metrics: { totalQueries, averageResponseTime };
  management: AIManagementState;  // Circuit Breaker 상태
}
```
- **특징**: AI 메트릭 + Circuit Breaker 상태 관리
- **v2.0.0**: Circuit Breaker 이벤트 실시간 추적

### 2.3 주요 Hooks

| Hook | 파일 | 역할 |
|------|------|------|
| `useAIEngine` | `hooks/useAIEngine.ts` | UNIFIED 모드 고정 (v4.0) |
| `useAIThinking` | `stores/useAISidebarStore.ts` | Thinking 단계 관리 |
| `useAIChat` | `stores/useAISidebarStore.ts` | 채팅 메시지 관리 |
| `useAISidebarUI` | `stores/useAISidebarStore.ts` | UI 상태 선택자 |

### 2.4 레거시 마이그레이션

```typescript
// useAIEngine.ts - 자동 마이그레이션
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved !== 'UNIFIED') {
    console.info(`🔄 AI 모드 자동 마이그레이션: ${saved} → UNIFIED`);
    localStorage.setItem(STORAGE_KEY, 'UNIFIED');
  }
}, []);
```

---

## 3. Backend 분석

### 3.1 Cloud Run AI Engine 구조

```
cloud-run/ai-engine/
├── src/
│   ├── agents/                    # 5개 전문 에이전트
│   │   ├── nlq-agent.ts          # 자연어 쿼리 분석
│   │   ├── analyst-agent.ts      # 데이터 분석
│   │   ├── reporter-agent.ts     # 리포트 생성
│   │   ├── verifier-agent.ts     # 결과 검증
│   │   └── reply-agent.ts        # 최종 응답 생성
│   ├── lib/
│   │   ├── state-definition.ts   # AgentState, SharedContext
│   │   ├── cache-layer.ts        # TTL 기반 캐싱
│   │   ├── model-config.ts       # Multi-model 설정
│   │   ├── embeddings.ts         # pgvector 임베딩
│   │   └── supervisor.ts         # LangGraph 오케스트레이션
│   └── index.ts                   # Express 서버
```

### 3.2 모델 구성

| 역할 | 모델 | 제공자 |
|------|------|--------|
| Supervisor | Gemini 2.5 Flash-Lite | Google AI |
| Agents | Llama 3.3 70B | Groq |
| Embeddings | text-embedding-004 | Google AI |

### 3.3 캐싱 전략

```typescript
// cache-layer.ts - TTL 설정
const TTL_CONFIG = {
  metrics: 60_000,      // 1분
  rag: 300_000,         // 5분
  analysis: 600_000,    // 10분
};
```

### 3.4 데이터 흐름 (LangGraph)

```
User Query
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  NLQ Agent  │───▶│  Analyst    │───▶│  Reporter   │
│ (쿼리 분석)  │    │ (데이터 분석)│    │ (리포트 생성)│
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Reply     │◀───│  Verifier   │
                   │ (응답 생성)  │    │ (결과 검증)  │
                   └─────────────┘    └─────────────┘
                          │
                          ▼
                    Final Response
```

---

## 4. API Routes 분석

### 4.1 주요 엔드포인트

| 엔드포인트 | 메서드 | 역할 |
|-----------|--------|------|
| `/api/ai/supervisor` | POST | Cloud Run 프록시 (메인) |
| `/api/ai/jobs` | GET/POST | Job Queue 관리 |
| `/api/ai/status` | GET | 서비스 상태 + Circuit Breaker |
| `/api/ai/health` | GET | 헬스 체크 |

### 4.2 Supervisor Route 분석

**파일**: `src/app/api/ai/supervisor/route.ts`

```typescript
// AI SDK v5 UIMessage 변환
function normalizeMessagesForCloudRun(messages) {
  return messages.map((msg) => {
    const content = extractTextFromMessage(msg);
    return { role: msg.role, content: content || '[Non-text content]' };
  });
}

// Data Stream Protocol 파싱 (0:, 3:, d:, e: prefixes)
function parseDataStreamProtocol(chunk: string) {
  if (chunk.startsWith('0:')) return { type: 'text', data: JSON.parse(chunk.slice(2)) };
  if (chunk.startsWith('3:')) return { type: 'error', data: chunk.slice(2) };
  if (chunk.startsWith('d:')) return { type: 'data', data: JSON.parse(chunk.slice(2)) };
  if (chunk.startsWith('e:')) return { type: 'event', data: chunk.slice(2) };
}
```

**미들웨어 체인**:
1. `withRateLimit` - Rate Limiting
2. `withAuth` - 인증 (옵션)
3. Cloud Run Proxy - 스트림 전달

### 4.3 Job Queue API

**파일**: `src/app/api/ai/jobs/route.ts`

```typescript
// 복잡도 분석
function analyzeComplexity(query: string): 'simple' | 'moderate' | 'complex' {
  const length = query.length;
  const keywords = ['분석', '비교', '예측', '최적화'];

  if (length < 50 && !keywords.some(k => query.includes(k))) return 'simple';
  if (length > 200 || keywords.filter(k => query.includes(k)).length > 2) return 'complex';
  return 'moderate';
}

// Cloud Run Worker 트리거
async function triggerWorker(jobId, query, type) {
  fetch(`${cloudRunUrl}/api/jobs/process`, {
    method: 'POST',
    body: JSON.stringify({ jobId, query, type }),
  }).catch(err => console.error('[AI Jobs] Failed to trigger worker:', err));
}
```

---

## 5. 복원력 패턴 (Resilience)

### 5.1 Circuit Breaker

**파일**: `src/lib/ai/circuit-breaker.ts`

```typescript
export class AIServiceCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60_000;  // 1분

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error(`${this.serviceName} 서비스가 일시적으로 중단되었습니다.`);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
```

**이벤트 유형**:
- `circuit_open` - 회로 열림
- `circuit_close` - 회로 닫힘
- `failover` - 장애 조치 발생
- `rate_limit` - 요청 제한

### 5.2 자동 Failover

```typescript
// model-config.ts
const FAILOVER_ORDER = ['gemini-2.5-flash-lite', 'groq-llama-3.3', 'groq-llama-3.1'];

async function executeWithFailover(fn: ModelFunction): Promise<Result> {
  for (const model of FAILOVER_ORDER) {
    try {
      return await fn(model);
    } catch (error) {
      console.warn(`Failover: ${model} failed, trying next...`);
    }
  }
  throw new Error('All models failed');
}
```

---

## 6. 데이터 흐름 요약

### 6.1 실시간 채팅 플로우

```
1. User Input (AISidebarV4)
       │
       ▼
2. useAISidebarStore.addMessage()
       │
       ▼
3. POST /api/ai/supervisor
       │
       ├── AI SDK v5 Message Normalization
       ├── Data Stream Protocol Encoding
       │
       ▼
4. Cloud Run AI Engine
       │
       ├── LangGraph Multi-Agent Processing
       ├── Supabase Vector Search (RAG)
       ├── TTL Cache Layer
       │
       ▼
5. Streaming Response (ReadableStream)
       │
       ├── Data Stream Protocol Parsing
       ├── Thinking Steps Extraction
       │
       ▼
6. useAISidebarStore.updateMessage()
       │
       ▼
7. UI Update (EnhancedAIChat)
```

### 6.2 비동기 Job Queue 플로우

```
1. Heavy Query Detection
       │
       ▼
2. POST /api/ai/jobs (Create Job)
       │
       ├── Supabase ai_jobs INSERT
       ├── Complexity Analysis
       │
       ▼
3. triggerWorker() (Fire & Forget)
       │
       ▼
4. Cloud Run Worker Processing
       │
       ├── get_next_job() (Priority Queue)
       ├── update_job_progress()
       ├── complete_job() or fail_job()
       │
       ▼
5. Client Polling (GET /api/ai/jobs/:id)
       │
       ▼
6. Result Display
```

---

## 7. 주요 발견 사항

### 7.1 강점

| 영역 | 강점 |
|------|------|
| 상태 관리 | Zustand 기반 분리된 스토어, localStorage 영속화 |
| 복원력 | Circuit Breaker + 자동 Failover + Rate Limiting |
| 확장성 | LangGraph Multi-Agent + 비동기 Job Queue |
| 캐싱 | TTL 기반 계층적 캐싱 (메트릭/RAG/분석) |
| 타입 안정성 | TypeScript strict mode, Zod 스키마 검증 |

### 7.2 개선 기회

| 영역 | 개선 기회 |
|------|----------|
| SSR | Hydration 불일치 방지를 위한 추가 처리 필요 |
| 에러 경계 | 컴포넌트 레벨 에러 경계 추가 권장 |
| 테스트 | AI 컴포넌트 단위 테스트 커버리지 확대 |
| 모니터링 | 실시간 메트릭 대시보드 강화 |

---

## 8. 파일 인덱스

### Frontend

| 파일 | 라인 수 | 역할 |
|------|--------|------|
| `src/stores/useAISidebarStore.ts` | 520 | 메인 사이드바 스토어 |
| `src/stores/modules/ai.store.ts` | 483 | AI 관리 + Circuit Breaker |
| `src/stores/ai-chat-store.ts` | 114 | Fullpage 채팅 스토어 |
| `src/domains/ai-sidebar/hooks/useAIEngine.ts` | 139 | UNIFIED 엔진 훅 |

### API Routes

| 파일 | 역할 |
|------|------|
| `src/app/api/ai/supervisor/route.ts` | Cloud Run 프록시 |
| `src/app/api/ai/jobs/route.ts` | Job Queue API |
| `src/lib/ai/circuit-breaker.ts` | 복원력 패턴 |
| `src/lib/ai-proxy/proxy.ts` | 프록시 유틸리티 |

### Backend

| 디렉토리 | 역할 |
|---------|------|
| `cloud-run/ai-engine/src/agents/` | 5개 전문 에이전트 |
| `cloud-run/ai-engine/src/lib/` | 코어 라이브러리 |

---

**분석 완료**: 2025-12-23
**작성**: Claude Code (Opus 4.5)
