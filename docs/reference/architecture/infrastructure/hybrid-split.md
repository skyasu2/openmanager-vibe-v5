# Hybrid AI Architecture: Vercel vs. Cloud Run

## Architecture Overview

This project uses a **Hybrid Architecture** to balance cost, performance, and scalability.

### 1. Vercel (Frontend & Orchestrator)
**Role**: The "Brain's Interface" and "Router"
- **Hosting**: Next.js App Router (Serverless Functions)
- **Responsibilities**:
  - **UI/UX**: Renders everything the user sees (React Components).
  - **Authentication**: Verifies user login before generating AI responses.
  - **Input Validation**: Sanitizes user queries.
  - **Routing/Failover**:
    - Checks `CLOUD_RUN_ENABLED`.
    - If **True**: Proxies the request to Cloud Run.
    - If **False** or **Failure**: Falls back to executing AI locally (Serverless).

### 2. Google Cloud Run (AI Engine)
**Role**: The "Heavy Lifter"
- **Hosting**: Docker Container (Node.js 22 + Vercel AI SDK)
- **Responsibilities**:
  - **AI SDK Multi-Agent**: Orchestrates agents (NLQ, Analyst, Reporter, Advisor, Verifier).
  - **Agent Execution**: Runs the prompt engineering and tool calls using `@ai-sdk-tools/agents`.
  - **Heavy Computation**: Handles complex queries and multi-step reasoning.
  - **Streaming**: Streams tokens back to Vercel via SSE.

### 3. TypeScript ML (Built into AI Engine)
**Role**: The "Mathematician"
- **Hosting**: Same as AI Engine (Node.js)
- **Responsibilities**:
  - **Anomaly Detection**: 6-hour moving avg + 2σ (`SimpleAnomalyDetector.ts`)
  - **Trend Prediction**: Linear regression (`TrendPredictor.ts`)
- **Note**: Rust ML service was removed in v5.84.0 and replaced by these optimized TypeScript implementations.

---

## Request Flow

1. **User** types "Analyze server status".
2. **Vercel Frontend**:
   - `POST /api/ai/supervisor`
   - Validates request.
   - Checks `CLOUD_RUN_ENABLED=true`.
3. **Vercel Proxy**:
   - Forwards request to `https://ai-engine-jdhr.../api/ai/supervisor`.
   - Adds `X-API-Key` for security.
4. **Cloud Run**:
   - Receives request.
   - **Vercel AI SDK** processes the intent and routes to the appropriate agent.
   - **Analyst Agent** performs pattern analysis if needed.
   - Streams response back to Vercel via SSE.
5. **Vercel**:
   - Pipes the stream to the User's browser.

---

## Status Comparison

| Feature | Vercel (Frontend) | Cloud Run (Backend) |
|:--- |:--- |:--- |
| **State** | **Active** (Serving UI) | **Active** (Waiting for requests) |
| **Scaling** | Auto-scale (Serverless) | Auto-scale (0 to N instances) |
| **Authentication**| NextAuth (User Session) | API Key (`CLOUD_RUN_API_SECRET`) |
| **Timeout** | 10-60 Seconds (Hard limit) | 60 Minutes (Configurable) |
| **Logic** | Display & Routing | AI Reasoning & Processing |

## Data Architecture

The system follows a **Stateless Cloud Run** design where all persistent data lives in Supabase.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW (v5.88.x)                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐       ┌─────────────────────────────┐
│     Vercel (SSoT Generator)     │       │     Supabase (Database)     │
│  ┌───────────────────────────┐  │       │  ┌───────────────────────┐  │
│  │  public/hourly-data/      │  │ seed  │  │  unified_server_      │  │
│  │  ├─ hour-00.json          │──┼──────►│  │  metrics (optional)   │  │
│  │  ├─ hour-01.json          │  │       │  ├───────────────────────┤  │
│  │  └─ ... (24 files)        │  │       │  │  ai_conversations     │  │
│  │                           │  │       │  │  (대화 이력)          │  │
│  │  • 17 Servers             │  │       │  ├───────────────────────┤  │
│  │  • 1440 Data Points/day   │  │       │  │  embeddings           │  │
│  └───────────────────────────┘  │       │  │  (GraphRAG Vector)    │  │
└─────────────────────────────────┘       │  └───────────────────────┘  │
                                          └─────────────┬───────────────┘
                                                        │ query
                                                        ▼
                                          ┌─────────────────────────────┐
                                          │  Cloud Run (Stateless AI)   │
                                          │  ┌───────────────────────┐  │
                                          │  │ • NO local data files │  │
                                          │  │ • Queries Supabase    │  │
                                          │  │ • Pure AI computation │  │
                                          │  │ • Scale-to-Zero OK    │  │
                                          │  └───────────────────────┘  │
                                          └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        REQUEST FLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

 ┌────────┐      ┌──────────────────────┐      ┌──────────────────────┐
 │  User  │ ───► │   Vercel Frontend    │ ───► │   Cloud Run AI       │
 │        │      │   (Next.js 16)       │      │   (Node.js 22)       │
 └────────┘      └──────────────────────┘      └──────────────────────┘
     │                    │                             │
     │  1. "서버 분석"    │  2. POST /api/ai/supervisor │
     │  ───────────────►  │  ─────────────────────────► │
     │                    │     + X-API-Key header      │
     │                    │                             │
     │                    │  3. SSE Stream              │
     │  4. 렌더링 결과    │  ◄───────────────────────── │
     │  ◄───────────────  │                             │
     │                    │                             │
```

### Key Principles
- **Single Source of Truth (SSoT)**: `src/data/fixed-24h-metrics.ts` on Vercel
- **Database Layer**: Supabase PostgreSQL (15 servers, 360 metrics per 24h window)
- **Stateless AI**: Cloud Run containers have **no local data files** - all data fetched from Supabase
- **Data Sync**: Vercel seeds Supabase on deployment; Cloud Run reads from Supabase at runtime

### Why Stateless?
1. **Scale-to-Zero**: No data loss when containers spin down
2. **Consistency**: All instances see the same data from Supabase
3. **Cost**: No persistent storage costs in Cloud Run

---

## Controls (Planned)

- **Start (Wake Up)**: Triggers `/warmup` on Cloud Run to spin up an instance (Cold Start mitigation).
- **Stop**: Not applicable (Serverless scales to 0 automatically when idle).
