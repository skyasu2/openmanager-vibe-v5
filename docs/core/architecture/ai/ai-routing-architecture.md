# AI Routing Architecture (LangGraph Multi-Agent)

> **버전**: v3.0 (2025-12-20)
> **환경**: LangGraph StateGraph on Cloud Run, Supervisor-Worker Pattern

## Overview

OpenManager Vibe v5.83.7은 **Cloud Run에서 실행되는 LangGraph Supervisor Agent**를 사용하여 AI 라우팅을 수행합니다. Vercel은 프론트엔드와 API 프록시 역할만 담당하며, 모든 AI 처리는 Cloud Run에서 이루어집니다.

> **Migration History**: LangGraph는 2025-12-16에 Vercel Edge Runtime 제약으로 인해 Cloud Run으로 마이그레이션되었습니다.

## Architecture Diagram

```mermaid
graph TD
    User[User Query] --> Vercel[Vercel Next.js]

    subgraph "Vercel (Frontend + Proxy)"
        Vercel --> ProxyRoute[/api/ai/supervisor]
        ProxyRoute -->|X-API-Key Auth| CloudRun
    end

    subgraph "Google Cloud Run (AI Engine)"
        CloudRun[Hono Server :8080] --> Supervisor[Supervisor Agent]

        Supervisor -->|Simple Query| NLQ[NLQ Agent]
        Supervisor -->|Pattern Analysis| Analyst[Analyst Agent]
        Supervisor -->|Incident/RAG| Reporter[Reporter Agent]
        Supervisor -->|Comprehensive| Parallel[Parallel Node]
        Supervisor -->|Greeting| Direct[Direct Reply]

        Parallel --> NLQ
        Parallel --> Analyst

        Reporter -->|Critical Action| Approval{Approval Check}
        Approval -->|Approved| Response[Response]
        Approval -->|Pending| Interrupt[Human Interrupt]
    end

    Response --> User
```

## Hybrid Architecture

| Layer | Platform | Role |
|-------|----------|------|
| **Frontend** | Vercel | Next.js UI, `useChat` hook |
| **API Proxy** | Vercel | `/api/ai/*` routes → Cloud Run |
| **AI Engine** | Cloud Run | LangGraph StateGraph, All AI processing |
| **Data** | Supabase | pgvector RAG, PostgresCheckpointer |

## Proxy Layer (`src/lib/ai-proxy/proxy.ts`)

### Environment Detection

| Environment | Backend | URL |
|-------------|---------|-----|
| **Development** | Local Docker | `http://localhost:8080` |
| **Production (Vercel)** | Cloud Run | `CLOUD_RUN_AI_URL` |

### Configuration Priority

```typescript
// 1. Vercel Production → Cloud Run
if (isVercel) return { backend: 'cloud-run' };

// 2. Development + USE_LOCAL_DOCKER=true → Local Docker
if (isDev && useLocalDocker) return { backend: 'local-docker' };

// 3. Development + AI_ENGINE_MODE=CLOUD → Cloud Run
if (isDev && aiEngineMode === 'CLOUD') return { backend: 'cloud-run' };

// 4. Default (Development) → Local Docker
return { backend: 'local-docker' };
```

### Authentication

| Header | Value | Purpose |
|--------|-------|---------|
| `X-API-Key` | `CLOUD_RUN_API_SECRET` | Cloud Run 인증 |
| `Content-Type` | `application/json` | Request body |
| `Accept` | `text/event-stream` | Streaming response |

## Agent-Based Routing

### Supervisor Agent (Router)

| 항목 | 값 |
|------|-----|
| **모델** | Groq `llama-3.3-70b-versatile` |
| **역할** | Intent classification & routing |
| **출력** | `targetAgent`: nlq \| analyst \| reporter \| parallel \| reply |

### Routing Rules

| Intent | Target Agent | 예시 쿼리 | 응답 시간 |
|--------|--------------|-----------|-----------|
| **greeting** | reply (direct) | "안녕", "도와줘" | < 300ms |
| **metrics_query** | nlq | "서버 5번 CPU 사용량" | < 800ms |
| **pattern_analysis** | analyst | "이상 패턴 분석해줘" | < 1.5s |
| **incident_report** | reporter | "장애 보고서 작성" | < 3s |
| **comprehensive** | parallel | "종합 분석해줘" | < 2s |

## Agent Specifications

| Agent | Model | Latency Target | Tools |
|-------|-------|----------------|-------|
| **Supervisor** | Groq Llama 70b | < 200ms | - |
| **NLQ Agent** | Gemini 2.5 Flash | < 500ms | `getServerMetrics` |
| **Analyst Agent** | Gemini 2.5 Flash | < 1s | `detectAnomalies`, `predictTrends`, `analyzePattern` |
| **Reporter Agent** | Llama 3.3-70b | < 2s | `searchKnowledgeBase` (RAG), `recommendCommands` |

## Cloud Run Endpoints

### Main AI Endpoint

**`POST /api/ai/supervisor`** - Multi-Agent AI Processing

```json
// Request
{
  "messages": [{ "role": "user", "content": "서버 5번 CPU 상태" }],
  "sessionId": "optional-session-id"
}

// Response (AI SDK v5 Data Stream)
Headers:
  Content-Type: text/event-stream; charset=utf-8
  X-Vercel-AI-Data-Stream: v1

Body:
0:"서버 5번의 CPU 사용률은 "
0:"현재 45%입니다.\n"
d:{"finishReason":"stop"}
```

### Additional Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/embedding` | POST | Single text embedding |
| `/api/ai/embedding/batch` | POST | Batch text embeddings |
| `/api/ai/embedding/stats` | GET | Embedding service stats |
| `/api/ai/generate` | POST | Text generation |
| `/api/ai/generate/stream` | POST | Streaming text generation |
| `/api/ai/generate/stats` | GET | Generate service stats |
| `/api/ai/approval/status` | GET | Check pending approval |
| `/api/ai/approval/decide` | POST | Submit approval decision |
| `/api/ai/approval/stats` | GET | Approval store stats |
| `/health` | GET | Health check |
| `/warmup` | GET | Cold start warmup |

## Fallback & Resilience

### Circuit Breaker Pattern

| State | Behavior | Transition |
|-------|----------|------------|
| **Closed** | Normal operation | 3 failures → Open |
| **Open** | Block requests, use fallback | 60s cooldown → Half-Open |
| **Half-Open** | Test single request | Success → Closed, Failure → Open |

### Model Fallback Chain

```
Primary Model 실패 시:
  Groq Llama-70b → Gemini Flash → Gemini Pro
  Gemini Flash → Gemini Pro → Llama-70b
  Gemini Pro → Gemini Flash → Llama-70b
```

### API Key Failover (Gemini)

```
GOOGLE_AI_API_KEY (Primary)
    ↓ Rate Limit (429)
GOOGLE_AI_API_KEY_SECONDARY (Round-robin)
```

## A2A (Agent-to-Agent) Communication

에이전트 간 협업이 필요한 경우, **Return-to-Supervisor** 패턴을 사용합니다:

1. 에이전트가 다른 에이전트의 도움이 필요하다고 판단
2. `returnToSupervisor = true` + `delegationRequest` 설정
3. Supervisor가 요청을 받고 지정된 에이전트로 재라우팅
4. 최종 응답 반환

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUD_RUN_AI_URL` | Yes | Cloud Run AI Engine URL |
| `CLOUD_RUN_API_SECRET` | Yes | Cloud Run authentication secret |
| `CLOUD_RUN_ENABLED` | Yes | Enable Cloud Run backend (`true`) |
| `GOOGLE_AI_API_KEY` | Yes | Gemini API key (Primary) |
| `GOOGLE_AI_API_KEY_SECONDARY` | Yes | Gemini API key (Secondary) |
| `GROQ_API_KEY` | Yes | Groq (Llama) API key |
| `USE_LOCAL_DOCKER` | Dev | Force local Docker in development |
| `AI_ENGINE_MODE` | Dev | `AUTO` (local) or `CLOUD` (Cloud Run) |

## File Structure

```
# Cloud Run AI Engine (Primary Backend)
cloud-run/ai-engine/
├── src/
│   ├── server.ts              # Hono HTTP server
│   ├── lib/model-config.ts    # API key validation
│   └── services/
│       ├── langgraph/         # LangGraph StateGraph
│       │   └── multi-agent-supervisor.ts
│       ├── embedding/         # Embedding service
│       ├── generate/          # Generate service
│       ├── approval/          # HITL approval store
│       └── scenario/          # Demo data loader
└── package.json               # @langchain/langgraph, hono, ai

# Vercel Proxy Layer
src/lib/ai-proxy/
└── proxy.ts                   # Cloud Run proxy with env detection

# Vercel API Routes (Proxy to Cloud Run)
src/app/api/ai/
├── supervisor/route.ts        # Main AI endpoint
├── embedding/route.ts         # Embedding proxy
├── generate/route.ts          # Generate proxy
└── approval/route.ts          # Approval proxy
```

---

> **참고 문서**:
> - `ai-engine-architecture.md`: 전체 엔진 아키텍처 및 상태 인터페이스
> - `ai-architecture.md`: 프론트엔드 통합 및 UI 컴포넌트
