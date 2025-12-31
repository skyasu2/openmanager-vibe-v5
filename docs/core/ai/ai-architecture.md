# AI Assistant Architecture

> **버전**: v4.0 (2025-12-31)
> **환경**: Next.js 16, React 19, TypeScript 5.9 strict, Vercel AI SDK (Cloud Run)

## Overview

The AI Assistant is built on a **LLM 멀티 에이전트 시스템** using **Vercel AI SDK** with `@ai-sdk-tools/agents`. It uses a **Hybrid Architecture**:

- **Frontend (Vercel)**: Next.js UI, API proxy routes
- **AI Engine (Cloud Run)**: Vercel AI SDK Multi-Agent, all AI processing

> **📢 Architecture Update (2025-12-28)**: LangGraph migrated to **Vercel AI SDK** for better multi-agent orchestration.
> See [ai-engine-architecture.md](../architecture/ai/ai-engine-architecture.md) for detailed backend architecture.

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

#### Agent Architecture

```
User Query → Orchestrator (Cerebras)
                ├→ NLQ Agent (Cerebras) - 자연어 쿼리 처리
                ├→ Analyst Agent (Groq) - 이상 탐지, 트렌드 예측
                ├→ Reporter Agent (Groq) - 인시던트 리포트
                └→ Advisor Agent (Mistral) - RAG 기반 트러블슈팅
```

#### Agent Stack

| Agent | Provider | Model | Role |
|-------|----------|-------|------|
| **Orchestrator** | Cerebras | Llama 3.3-70b | Fast routing (~200ms) |
| **NLQ Agent** | Cerebras | Llama 3.3-70b | Server metrics queries |
| **Analyst Agent** | Groq | Llama 3.3-70b | Anomaly detection, trends |
| **Reporter Agent** | Groq | Llama 3.3-70b | Incident reports |
| **Advisor Agent** | Mistral | mistral-small | RAG + troubleshooting |

> **Triple-Provider Strategy (v5.92.0)**:
> - **Cerebras**: 빠른 라우팅 (무제한)
> - **Groq**: 분석/리포팅 (6K req/day)
> - **Mistral**: RAG/임베딩 (1024d)

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

The AI uses specialized tools within each agent for domain-specific operations.

### NLQ Agent Tools (SubGraph v5.89.0)

| Tool | Description |
|------|-------------|
| `getServerMetricsAdvanced` | Advanced metrics with time range, filters, aggregation support |

**NLQ SubGraph 5-Node Workflow**:
1. **parse_intent**: Intent classification (metrics, logs, status, comparison)
2. **extract_params**: Korean NLP parsing (time expressions, filters)
3. **validate**: Rule-based parameter validation
4. **execute_query**: Tool invocation with extracted parameters
5. **format_response**: User-friendly response formatting

### Analyst Agent Tools

| Tool | Description |
|------|-------------|
| `detectAnomalies` | 6-hour moving average + 2σ deviation anomaly detection |
| `predictTrends` | Linear Regression based trend prediction |
| `analyzePattern` | Comprehensive pattern analysis (combines above tools) |

**Intent Detection**: The Analyst Agent auto-detects query intent:
- `anomaly` → Executes `detectAnomalies`
- `trend` → Executes `predictTrends`
- `pattern` → Executes `analyzePattern`
- `comprehensive` → Executes all tools

### Reporter Agent Tools

| Tool | Description |
|------|-------------|
| `searchKnowledgeBase` | RAG search using Supabase pgvector (1024 dimensions) |
| `recommendCommands` | Suggests runbook commands for incident resolution |

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

## Recent Updates (v3.3)

### GraphRAG Hybrid Search

The Reporter Agent now uses GraphRAG for enhanced knowledge retrieval:

| Feature | Description |
|---------|-------------|
| **Vector Search** | Semantic similarity via pgvector (cosine distance) |
| **Graph Traversal** | Entity-relationship exploration |
| **Hybrid Scoring** | Weighted combination for better relevance |

### Redis L2 Caching

Response caching layer for performance optimization:

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Response Cache | 1h | Repeated query optimization |
| Session Cache | 24h | Conversation state |
| Embedding Cache | 7d | Embedding reuse |

### Verifier Agent (Mistral 24B, v5.89.0)

Post-processing validation agent upgraded to Mistral Small 3.2 (24B parameters):

```
[Agent Output] → [Verifier Agent] → [Final Response]
                     │
                     ├─ Hallucination check
                     ├─ Safety validation
                     └─ Confidence scoring
```

> **Provider Change (v5.89.0)**: Groq Llama 8B → Mistral Small 24B for improved verification quality

### Approval History Persistence

HITL approval records are now persisted to PostgreSQL for audit:

```typescript
interface ApprovalRecord {
  id: string;
  sessionId: string;
  actionType: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
```
