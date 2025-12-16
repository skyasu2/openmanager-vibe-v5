# Hybrid AI Architecture: Vercel vs. Cloud Run

## 🎯 Architecture Overview

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
- **Hosting**: Docker Container (Node.js 22 + LangGraph)
- **Responsibilities**:
  - **LangGraph Supervisor**: Decides which agent (NLQ, Analyst, Reporter, Writer) to use.
  - **Agent Execution**: Runs the prompt engineering and tool calls.
  - **Heavy Computation**: Handles long-running tasks (up to 60 mins) that would timeout on Vercel (60s limit).
  - **Streaming**: Streams tokens back to Vercel.

---

## 🔄 Request Flow

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
   - `LangGraph` processes the intent.
   - Streams response back to Vercel.
5. **Vercel**:
   - Pipes the stream to the User's browser.

---

## 🛠️ Status Comparison

| Feature | Vercel (Frontend) | Cloud Run (Backend) |
|:--- |:--- |:--- |
| **State** | **Active** (Serving UI) | **Active** (Waiting for requests) |
| **Scaling** | Auto-scale (Serverless) | Auto-scale (0 to N instances) |
| **Authentication**| NextAuth (User Session) | API Key (`CLOUD_RUN_API_SECRET`) |
| **Timeout** | 10-60 Seconds (Hard limit) | 60 Minutes (Configurable) |
| **Logic** | Display & Routing | AI Reasoning & Processing |

## 🕹️ Controls (Planned)

- **Start (Wake Up)**: Triggers `/warmup` on Cloud Run to spin up an instance (Cold Start mitigation).
- **Stop**: Not applicable (Serverless scales to 0 automatically when idle).
