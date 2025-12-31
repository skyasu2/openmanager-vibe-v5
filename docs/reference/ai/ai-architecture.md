# AI Assistant Architecture (Frontend)

> **버전**: v4.1 (2025-12-31)
> **환경**: Next.js 16, React 19, TypeScript 5.9 strict, Vercel AI SDK (Cloud Run)

## Overview

The AI Assistant is built on a **LLM 멀티 에이전트 시스템** using **Vercel AI SDK** with `@ai-sdk-tools/agents`. It uses a **Hybrid Architecture**:

- **Frontend (Vercel)**: Next.js UI, API proxy routes
- **AI Engine (Cloud Run)**: Vercel AI SDK Multi-Agent, all AI processing

> **관련 문서**:
> - [AI Engine 5W1H 분석](../architecture/ai/ai-engine-5w1h.md) - 육하원칙 기반 아키텍처 요약
> - [AI Engine 상세 아키텍처](../architecture/ai/ai-engine-architecture.md) - 기술 상세 명세

## Core Components

### 1. Frontend: Dual-Mode Architecture

#### Mode Comparison

| 항목 | 사이드바 모드 | 풀페이지 모드 |
|:-----|:-------------|:-------------|
| **진입점** | `AISidebarV4.tsx` | `AIWorkspace.tsx` |
| **레이아웃** | 우측 패널 (~400px) | 3-column 전체 화면 |
| **라우트** | 대시보드 내 컴포넌트 | `/dashboard/ai-assistant` |
| **사용 시나리오** | 빠른 질의 | 심층 분석, 보고서 |

#### Sidebar Mode (`AISidebarV4`)

- **Location**: `src/domains/ai-sidebar/components/AISidebarV4.tsx`
- **Framework**: React + Vercel AI SDK (`useChat` hook)
- **Endpoint**: `/api/ai/supervisor`
- **Features**:
  - Real-time streaming response
  - Agent routing visualization
  - Tool invocation display
  - Session persistence

#### Fullpage Mode (`AIWorkspace`)

- **Location**: `src/components/ai/AIWorkspace.tsx`
- **Layout**: 3-column (Left Nav / Center Content / Right Context)
- **Features**:
  - 좌측: 기능 선택 네비게이션
  - 중앙: EnhancedAIChat 또는 기능별 페이지
  - 우측: 시스템 컨텍스트 패널

### 2. Backend: LLM 멀티 에이전트 시스템

- **Location**: `cloud-run/ai-engine/src/` (TypeScript Hono)
- **Framework**: Vercel AI SDK with `@ai-sdk-tools/agents`
- **Deployment**: Google Cloud Run
- **Proxy**: `/api/ai/*` routes on Vercel forward to Cloud Run

> **📖 상세 정보**: [AI Engine 5W1H 분석](../architecture/ai/ai-engine-5w1h.md) 참조
> - 4대 에이전트 상세 (NLQ, Analyst, Reporter, Advisor)
> - 3중 Provider 폴백 (Cerebras → Mistral → Groq)
> - 12개 AI 도구 명세

## 3 AI Features

### 1. Natural Language Query (Chat)

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `EnhancedAIChat.tsx` |
| **API** | `/api/ai/supervisor` |
| **에이전트** | Supervisor → NLQ/Analyst/Reporter |

### 2. Auto Incident Report

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `AutoReportPage.tsx` |
| **API** | `/api/ai/incident-report` |
| **에이전트** | Reporter Agent (Llama 70b) |

### 3. Intelligent Monitoring

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `IntelligentMonitoringPage.tsx` |
| **API** | `/api/ai/intelligent-monitoring` |
| **에이전트** | Analyst Agent (Groq Llama 3.3-70b) |

## Tool System

The AI uses 12 specialized tools within each agent for domain-specific operations.

> **📖 전체 도구 목록**: [AI Engine 5W1H 분석 - WHAT](../architecture/ai/ai-engine-5w1h.md#2-무엇을-what---제공-기능) 참조

### 주요 도구 요약

| 카테고리 | 대표 도구 | 용도 |
|----------|-----------|------|
| **Metrics** | `getServerMetrics` | 서버 상태 조회 |
| **Analyst** | `detectAnomalies`, `predictTrends` | 이상치 탐지, 예측 |
| **Reporter** | `searchKnowledgeBase`, `searchWeb` | RAG/웹 검색 |
| **RCA** | `findRootCause` | 근본 원인 분석 |

## Data Flow

1. **User Query**: User types a message in `AISidebarV4`
2. **API Request**: `useChat` sends POST to `/api/ai/supervisor`
3. **Proxy to Cloud Run**: Vercel API route forwards request to Cloud Run
4. **Orchestrator Routing**: Cerebras Llama classifies intent and routes to appropriate agent
5. **Agent Execution**: Selected agent (NLQ/Analyst/Reporter/Advisor) processes query
6. **Tool Calling**: Multi-step tool execution with Vercel AI SDK
7. **Approval Check** (Reporter only): Critical actions require human approval
8. **Response**: AI SDK v5 Data Stream Protocol (`0:"text"\n`, `d:{...}\n`)

## Human-in-the-Loop Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Supervisor
    participant R as Reporter Agent
    participant A as Approval Node
    participant Admin as Administrator

    U->>S: "서버 5번 장애 분석해줘"
    S->>R: Route to Reporter (incident_ops)
    R->>R: Generate incident report
    R->>A: requiresApproval = true
    A->>U: "관리자 승인이 필요합니다"

    Note over A,Admin: Interrupt - Graph paused

    Admin->>A: Approve/Reject
    A->>U: Final response (approved) or rejection message
```

### Approval Types

| Action Type | Trigger | Requires Approval |
|-------------|---------|-------------------|
| `incident_report` | Root cause analysis completed | Yes |
| `system_command` | Risky operations | Yes |
| `critical_alert` | High-severity alerts | Yes |

## A2A (Agent-to-Agent) Communication

Vercel AI SDK supports agent-to-agent communication via **Agent Handoffs** pattern:

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant A as Analyst Agent
    participant R as Reporter Agent

    S->>A: Route (pattern_analysis)
    A->>A: Analyze patterns
    Note over A: Needs deeper incident analysis
    A->>S: DelegationRequest (toAgent: reporter)
    S->>R: Re-route to Reporter
    R->>R: Generate incident report
    R-->>S: Final response
```

### DelegationRequest Interface

```typescript
interface DelegationRequest {
  fromAgent: AgentType;     // Origin agent
  toAgent: AgentType;       // Target agent (optional)
  reason: string;           // Why delegation is needed
  context?: unknown;        // Additional context
}
```

### State Fields for A2A

| Field | Type | Purpose |
|-------|------|---------|
| `returnToSupervisor` | boolean | Signals delegation request |
| `delegationRequest` | DelegationRequest \| null | Delegation details |
| `agentResults` | AgentResult[] | Context propagation between agents |

### When A2A is Triggered

- Analyst detects critical anomaly → Delegates to Reporter for incident report
- NLQ finds multiple alerts → Delegates to Analyst for pattern analysis
- Reporter needs fresh metrics → Delegates to NLQ for data retrieval

## Parallel Analysis

When comprehensive analysis is needed (both metrics and patterns), the Supervisor routes to the `parallel_analysis` node:

```typescript
// Promise.all for concurrent execution
const [analystResult, nlqResult] = await Promise.all([
  analystAgentNode(state),
  nlqAgentNode(state),
]);

// Results merged into combined response
```

Benefits:
- 2x faster than sequential execution
- Unified response combining metrics + insights
- Automatic result aggregation

## Session Persistence

Sessions are persisted using Supabase PostgresCheckpointer:

```typescript
const checkpointer = PostgresSaver.fromConnString(
  process.env.SUPABASE_DATABASE_URL
);

// Graph compiled with checkpointer
const graph = workflow.compile({
  checkpointer,
  interruptBefore: ['approval_check'],
});
```

Features:
- Conversation history preserved across requests
- Resume from interrupt points (Human-in-the-Loop)
- Thread-based isolation per session

## Circuit Breaker

Model health is monitored with Circuit Breaker pattern:

| State | Behavior | Transition |
|-------|----------|------------|
| **Closed** | Normal operation | 3 failures → Open |
| **Open** | Block requests, use fallback | 60s cooldown → Half-Open |
| **Half-Open** | Test single request | Success → Closed, Failure → Open |

## Integration Points

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Supabase** | pgvector | RAG knowledge base |
| **Supabase** | PostgresCheckpointer | Session persistence |
| **Supabase** | Realtime | Live updates |
| **Supabase** | `approval_history` | HITL approval audit trail |
| **GraphRAG** | pgvector + graph | Hybrid vector + graph search |
| **Upstash Redis** | REST API | L2 response caching |
| **Scenario Loader** | `src/services/scenario/` | Demo metrics data |

## Recent Updates

### v4.1 (2025-12-31)
- 문서 구조 개선: 5W1H 문서 분리 및 중복 제거

### v4.0 (2025-12-28)
- LangGraph → Vercel AI SDK 마이그레이션
- Dual-Mode Supervisor (Single/Multi Agent)

> **📖 상세 변경 이력**: [AI Engine Architecture - Previous Versions](../architecture/ai/ai-engine-architecture.md#previous-versions) 참조

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [AI Engine 5W1H](../architecture/ai/ai-engine-5w1h.md) | 육하원칙 기반 아키텍처 요약 |
| [AI Engine Architecture](../architecture/ai/ai-engine-architecture.md) | 기술 상세 명세 (API, 환경변수, 파일구조) |
| [API Endpoints](../../api/endpoints.md) | REST API 명세 |
