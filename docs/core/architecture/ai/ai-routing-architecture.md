# AI Routing Architecture (LLM 멀티 에이전트)

> **버전**: v4.0 (2025-12-31)
> **환경**: Vercel AI SDK with @ai-sdk-tools/agents on Cloud Run

## Overview

OpenManager Vibe v5는 **Cloud Run에서 실행되는 LLM 멀티 에이전트 시스템**을 사용합니다. Vercel은 프론트엔드와 API 프록시 역할만 담당하며, 모든 AI 처리는 Cloud Run에서 이루어집니다.

> **Architecture Update (2025-12-28)**: LangGraph → Vercel AI SDK 마이그레이션 완료

## Architecture Diagram

```mermaid
graph TD
    User[User Query] --> Vercel[Vercel Next.js]

    subgraph "Vercel (Frontend + Proxy)"
        Vercel --> ProxyRoute[/api/ai/supervisor]
        ProxyRoute -->|X-API-Key Auth| CloudRun
    end

    subgraph "Google Cloud Run (AI Engine)"
        CloudRun[Hono Server :8080] --> Orchestrator[Orchestrator Agent]

        Orchestrator -->|Cerebras| NLQ[NLQ Agent]
        Orchestrator -->|Groq| Analyst[Analyst Agent]
        Orchestrator -->|Groq| Reporter[Reporter Agent]
        Orchestrator -->|Mistral| Advisor[Advisor Agent]

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
| **AI Engine** | Cloud Run | Vercel AI SDK Multi-Agent |
| **Data** | Supabase | pgvector RAG (1024d), PostgreSQL |

## Agent-Based Routing

### Orchestrator Agent (Router)

| 항목 | 값 |
|------|-----|
| **모델** | Cerebras `llama-3.3-70b` |
| **역할** | Intent classification & agent handoff |
| **응답 시간** | ~200ms |

### Agent Stack

| Agent | Provider | Model | Role |
|-------|----------|-------|------|
| **Orchestrator** | Cerebras | Llama 3.3-70b | Fast routing |
| **NLQ Agent** | Cerebras | Llama 3.3-70b | Server metrics queries |
| **Analyst Agent** | Groq | Llama 3.3-70b | Anomaly detection, trends |
| **Reporter Agent** | Groq | Llama 3.3-70b | Incident reports |
| **Advisor Agent** | Mistral | mistral-small | RAG + troubleshooting |

### Routing Rules

| Intent | Target Agent | 예시 쿼리 | 응답 시간 |
|--------|--------------|-----------|-----------|
| **greeting** | direct reply | "안녕", "도와줘" | < 300ms |
| **metrics_query** | NLQ | "서버 5번 CPU 사용량" | < 800ms |
| **pattern_analysis** | Analyst | "이상 패턴 분석해줘" | < 1.5s |
| **incident_report** | Reporter | "장애 보고서 작성" | < 3s |
| **troubleshoot** | Advisor | "해결 방법 알려줘" | < 2s |

## Fallback & Resilience

### Circuit Breaker Pattern

| State | Behavior | Transition |
|-------|----------|------------|
| **Closed** | Normal operation | 3 failures → Open |
| **Open** | Block requests, use fallback | 60s cooldown → Half-Open |
| **Half-Open** | Test single request | Success → Closed, Failure → Open |

### Provider Fallback Chain

```
Cerebras → Groq → Mistral
Groq → Cerebras → Mistral
Mistral → Groq → Cerebras
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUD_RUN_AI_URL` | Yes | Cloud Run AI Engine URL |
| `CLOUD_RUN_API_SECRET` | Yes | Cloud Run authentication secret |
| `CLOUD_RUN_ENABLED` | Yes | Enable Cloud Run backend (`true`) |
| `CEREBRAS_API_KEY` | Yes | Cerebras API key (Orchestrator, NLQ) |
| `GROQ_API_KEY` | Yes | Groq API key (Analyst, Reporter) |
| `MISTRAL_API_KEY` | Yes | Mistral API key (Advisor, Embedding) |
| `USE_LOCAL_DOCKER` | Dev | Force local Docker in development |
| `AI_ENGINE_MODE` | Dev | `AUTO` (local) or `CLOUD` (Cloud Run) |

## File Structure

```
# Cloud Run AI Engine
cloud-run/ai-engine/
├── src/
│   ├── server.ts                    # Hono HTTP server
│   ├── services/ai-sdk/
│   │   ├── supervisor.ts            # Dual-mode supervisor
│   │   └── agents/
│   │       ├── orchestrator.ts      # Cerebras orchestrator
│   │       ├── nlq-agent.ts         # Cerebras NLQ
│   │       ├── analyst-agent.ts     # Groq analyst
│   │       ├── reporter-agent.ts    # Groq reporter
│   │       └── advisor-agent.ts     # Mistral advisor
│   └── services/embedding/
│       └── embedding-service.ts     # Mistral 1024d
└── package.json                     # ai, @ai-sdk-tools/agents

# Vercel Proxy Layer
src/app/api/ai/
├── supervisor/route.ts              # Main AI endpoint proxy
└── jobs/                            # Async job queue
```

---

> **참고 문서**:
> - `ai-engine-architecture.md`: 전체 엔진 아키텍처 및 상태 인터페이스
> - `ai-architecture.md`: 프론트엔드 통합 및 UI 컴포넌트
> - `ai-model-policy.md`: AI 모델 정책 및 Provider 전략
