# AI Engine Internals

> **v6.1.0** | Updated 2026-01-25
>
> API, 데이터 계층, 환경변수, 파일 구조 상세

**관련 문서**: [AI Engine Architecture](./ai-engine-architecture.md) - 개요 및 아키텍처

---

## State Interfaces

### Vercel AI SDK Types (ai v6.0)

The core interfaces for AI SDK multi-agent orchestration:

### SupervisorRequest

```typescript
interface SupervisorRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
  mode?: 'single' | 'multi' | 'auto';  // Execution mode
}
```

### SupervisorResponse

```typescript
interface SupervisorResponse {
  success: boolean;
  response: string;
  toolsCalled: string[];              // Names of tools invoked
  toolResults: Record<string, unknown>[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    provider: string;                 // 'cerebras' | 'groq' | 'mistral'
    modelId: string;
    stepsExecuted: number;            // Multi-step tool calling count
    durationMs: number;
    mode?: 'single' | 'multi';
    handoffs?: Array<{ from: string; to: string; reason?: string }>;
    finalAgent?: string;              // Last agent that handled the query
  };
}
```

### MultiAgentRequest/Response

```typescript
interface MultiAgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
}

interface MultiAgentResponse {
  success: true;
  response: string;
  toolsCalled: string[];
  handoffs: Array<{ from: string; to: string; reason?: string }>;
  finalAgent: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  metadata: { provider: string; modelId: string; totalRounds: number; durationMs: number };
}
```

---

## API Specification

### Main Endpoint

**`POST /api/ai/supervisor`** - Multi-Agent AI Processing (Cloud Run)

### Request Format

```json
{
  "messages": [
    { "role": "user", "content": "서버 5번 CPU 상태 알려줘" }
  ],
  "sessionId": "optional-session-id"
}
```

### Response Format (Streaming - AI SDK v6 UIMessageStream Protocol)

```
Headers:
- Content-Type: text/event-stream; charset=utf-8
- X-Stream-Protocol: ui-message-stream
- X-Resumable: true
- X-Session-Id: {sessionId}

Body (UIMessageStream native format):
{"type":"text_delta","data":"Hello! I'm checking..."}
{"type":"tool_call","data":{"name":"getServerMetrics","args":{}}}
{"type":"tool_result","data":{"result":{...}}}
{"type":"text_delta","data":"Based on the analysis..."}
{"type":"finish","data":{"finishReason":"stop"}}
```

### Resumable Stream v2 (신규)

```
# 재연결 시 (GET 요청)
GET /api/ai/supervisor/stream/v2?sessionId={sessionId}

Headers:
- X-Resumed: true
- X-Stream-Id: {streamId}
```

Redis 상태 관리:
| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `ai:stream:v2:{sessionId}` | 10분 | 활성 스트림 ID 저장 |

### Additional Cloud Run Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/embedding` | POST | Single text embedding |
| `/api/ai/embedding/batch` | POST | Batch text embeddings |
| `/api/ai/graphrag/search` | POST | GraphRAG hybrid search |
| `/api/ai/cache/stats` | GET | Redis cache statistics |
| `/rag/sync-incidents` | POST | Manual RAG incident sync |
| `/health` | GET | Health check |
| `/warmup` | GET | Cold start warmup |
| `/api/jobs/process` | POST | Async job processing |
| `/api/jobs/:id` | GET | Get job result |

---

## Data & Memory

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Vector Store** | Supabase (pgvector) | RAG knowledge base |
| **GraphRAG** | Supabase + pgvector | Hybrid vector + graph retrieval |
| **Redis L2 Cache** | Upstash Redis | Response caching (TTL: 1hr) |
| **Metrics History** | Supabase | Server metrics (6hr window) |
| **Conversation History** | Supabase | Compressed conversation storage |
| **Client State** | Zustand | Chat history, UI state |

### Redis Caching Strategy

| Cache Type | TTL | Key Pattern | Purpose |
|------------|-----|-------------|---------|
| **Response Cache** | 1 hour | `ai:response:{hash}` | Repeated query optimization |
| **Session Cache** | 24 hours | `ai:session:{sessionId}` | Conversation state |
| **Embedding Cache** | 7 days | `ai:embed:{hash}` | Embedding reuse |
| **Job Result** | 5 min | `job:{jobId}` | Async job status & result |
| **Job Progress** | 5 min | `job:progress:{jobId}` | Real-time progress updates |

### GraphRAG Architecture

```
Query → Text Embedding → [Vector Search + Graph Traversal] → Result Merger → Re-ranking → Response
```

GraphRAG combines:
- **Vector Search**: Semantic similarity via pgvector (cosine distance)
- **Graph Traversal**: Entity-relationship exploration for context
- **Hybrid Scoring**: Weighted combination of vector + graph relevance

---

## Environment Variables

### Vercel (Frontend + Proxy)

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUD_RUN_AI_URL` | Yes | Cloud Run AI Engine endpoint |
| `CLOUD_RUN_API_SECRET` | Yes | Cloud Run authentication secret |
| `CLOUD_RUN_ENABLED` | Yes | Enable Cloud Run backend (`true`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |

### Cloud Run (AI Engine)

| Variable | Required | Description |
|----------|----------|-------------|
| `CEREBRAS_API_KEY` | Yes | Cerebras (Llama 3.3-70b) - Orchestrator, NLQ |
| `GROQ_API_KEY` | Yes | Groq (Llama 3.3-70b) - Analyst, Reporter |
| `MISTRAL_API_KEY` | Yes | Mistral - Advisor, Embedding |
| `UPSTASH_REDIS_URL` | Yes | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | Yes | Upstash Redis REST token |
| `SUPABASE_URL` | Yes | Supabase project URL (for GraphRAG) |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |

---

## File Structure

```
# Cloud Run AI Engine (Primary Backend)
cloud-run/ai-engine/
├── src/
│   ├── server.ts               # Hono HTTP server (main entry)
│   ├── tools-ai-sdk/           # Vercel AI SDK tool definitions
│   ├── lib/
│   │   ├── cache-layer.ts      # Multi-tier caching
│   │   ├── redis-client.ts     # Upstash Redis client
│   │   ├── graph-rag-service.ts # GraphRAG hybrid search
│   │   └── incident-rag-injector.ts # RAG incident injection
│   └── services/
│       ├── ai-sdk/             # Vercel AI SDK (Primary)
│       │   ├── supervisor.ts   # Dual-mode supervisor
│       │   ├── model-provider.ts # Provider factory
│       │   └── agents/         # Multi-agent system
│       │       ├── orchestrator.ts
│       │       ├── nlq-agent.ts
│       │       ├── analyst-agent.ts
│       │       ├── reporter-agent.ts
│       │       └── advisor-agent.ts
│       └── langgraph/          # Legacy - Deprecated
├── package.json
└── Dockerfile

# Vercel Proxy Layer
src/lib/ai-proxy/
└── proxy.ts                    # Cloud Run proxy

# Vercel API Routes
src/app/api/ai/
├── supervisor/
│   └── stream/
│       └── v2/
│           ├── route.ts        # POST: 새 스트림, GET: 재연결
│           └── stream-state.ts # Redis 상태 헬퍼
├── embedding/route.ts          # Embedding proxy
└── jobs/                       # Async job handling
    ├── route.ts
    └── [id]/
        ├── route.ts
        └── stream/route.ts     # SSE streaming
```

---

## Deprecated Components

| Component | Status | Replacement |
|-----------|--------|-------------|
| `stream/route.ts` (v1) | Removed (2026-01-25) | `stream/v2/route.ts` + UIMessageStream |
| `TextStreamChatTransport` | Removed (2026-01-25) | `DefaultChatTransport` + `resume: true` |
| `services/langgraph/` | Deprecated (2025-12-28) | `services/ai-sdk/` |
| `cloud-run/supabase-mcp/` | Deprecated | Direct Supabase JS client |
| `cloud-run/rust-inference/` | Removed | Vercel AI SDK agents |
| `SmartRoutingEngine` | Removed | AI SDK Dual-mode Supervisor |
| Python Unified Processor | Removed | Vercel AI SDK agents |

---

## Quick Reference

### Health Check

```bash
curl https://ai-engine-490817238363.asia-northeast1.run.app/health

# Expected response
{
  "status": "healthy",
  "apiKeys": { "mistral": true, "groq": true, "cerebras": true, "tavily": true },
  "supabase": true
}
```

### Query Examples

```bash
# 서버 상태 조회 (NLQ Agent)
curl -X POST /api/supervisor \
  -H "Content-Type: application/json" \
  -d '{"query": "web-01 서버 CPU 사용량 알려줘"}'

# 장애 분석 (Multi-Agent)
curl -X POST /api/supervisor \
  -H "Content-Type: application/json" \
  -d '{"query": "어제 발생한 장애의 원인을 분석하고 해결 방법을 추천해줘"}'
```
