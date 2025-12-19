# AI Routing Architecture (LangGraph Multi-Agent)

> **버전**: v2.0 (2025-12-14)
> **환경**: LangGraph StateGraph, Supervisor-Worker Pattern

## Overview

OpenManager Vibe v5.80.0은 **LangGraph Supervisor Agent**를 사용하여 AI 라우팅을 수행합니다. 이전의 SmartRoutingEngine은 deprecated되었으며, 모든 라우팅 로직은 LangGraph 그래프 내에서 처리됩니다.

## Architecture Diagram

```mermaid
graph TD
    User[User Query] --> API[/api/ai/unified-stream]

    subgraph "Vercel (Next.js)"
        API --> Supervisor[Supervisor Agent]

        Supervisor -->|Simple Query| NLQ[NLQ Agent]
        Supervisor -->|Pattern Analysis| Analyst[Analyst Agent]
        Supervisor -->|Incident/RAG| Reporter[Reporter Agent]
        Supervisor -->|Comprehensive| Parallel[Parallel Node]
        Supervisor -->|Greeting| Direct[Direct Reply]

        Parallel --> NLQ
        Parallel --> Analyst
    end

    NLQ --> Response[Response]
    Analyst --> Response
    Reporter --> Response
    Direct --> Response
    Response --> User
```

> **Note**: Cloud Run ai-backend was removed (2025-12-14). LangGraph runs directly on Vercel.

## Agent-Based Routing

### Supervisor Agent (Router)

| 항목 | 값 |
|------|-----|
| **모델** | Groq `llama-3.1-8b-instant` |
| **역할** | Intent classification & routing |
| **출력** | `targetAgent`: nlq \| analyst \| reporter \| parallel \| reply |

**라우팅 로직**:

```typescript
// Supervisor 출력 예시
{
  "targetAgent": "nlq",
  "reasoning": "사용자가 서버 메트릭 조회를 요청함",
  "confidence": 0.95
}
```

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
| **Supervisor** | Groq Llama-8b | < 200ms | - |
| **NLQ Agent** | Gemini 2.5 Flash | < 500ms | `getServerMetrics` |
| **Analyst Agent** | Gemini 2.5 Pro | < 1s | `detectAnomalies`, `predictTrends`, `analyzePattern` |
| **Reporter Agent** | Llama 3.3-70b | < 2s | `searchKnowledgeBase`, `recommendCommands` |

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
  Groq Llama-8b → Llama-70b → Gemini Flash
  Gemini Flash → Gemini Pro → Llama-70b
  Gemini Pro → Gemini Flash → Llama-70b
  Llama-70b → Gemini Pro → Gemini Flash
```

### A2A (Agent-to-Agent) Communication

에이전트 간 협업이 필요한 경우, **Return-to-Supervisor** 패턴을 사용합니다:

1. 에이전트가 다른 에이전트의 도움이 필요하다고 판단
2. `returnToSupervisor = true` + `delegationRequest` 설정
3. Supervisor가 요청을 받고 지정된 에이전트로 재라우팅
4. 최종 응답 반환

> **상세 내용**: `ai-architecture.md` 참조

## Data Flow

```
1. User Query
       ↓
2. /api/ai/unified-stream (POST)
       ↓
3. LangGraph StateGraph (Vercel)
       ↓
4. Supervisor Agent (Intent Classification)
       ↓
5. Target Agent Execution
       ├─ NLQ: getServerMetrics()
       ├─ Analyst: analyzePattern()
       └─ Reporter: searchKnowledgeBase()
       ↓
6. Response Aggregation
       ↓
7. Streaming Response to Client (AI SDK v5 Protocol)
```

## Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_AI_API_KEY` | Yes | Gemini API key |
| `GROQ_API_KEY` | Yes | Groq (Llama) API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |

## Deprecated Components

| Component | Status | Replacement |
|-----------|--------|-------------|
| `cloud-run/ai-backend/` | ❌ Removed (2025-12-14) | `src/services/langgraph/` |
| `SmartRoutingEngine` | ❌ Removed | LangGraph Supervisor Agent |
| Python Unified Processor | ❌ Removed | TypeScript LangGraph Agents |
| `/api/ai/query` (sync) | ❌ Removed | `/api/ai/unified-stream` |
| GCP Cloud Functions | ❌ Removed | Vercel Edge |
| RouteLLM-style Scoring | ❌ Removed | Supervisor Agent 분류 |

---

> **참고 문서**:
> - `ai-engine-architecture.md`: 전체 엔진 아키텍처
> - `ai-assistant-sidebar-architecture.md`: 프론트엔드 통합
