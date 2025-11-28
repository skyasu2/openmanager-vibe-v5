# AI Assistant Architecture

## 🏗️ Overview

The AI Assistant is built on a **Hybrid Engine Architecture** that combines **Offline Capabilities** for speed and **Google Gemini 1.5 Flash** for intelligence. It features a unique "Thinking Process" visualization that exposes the AI's internal reasoning and tool usage to the user.

## 🧩 Core Components

### 1. Frontend: AI Sidebar (`AISidebarV4`)

- **Location**: `src/domains/ai-sidebar/components/AISidebarV4.tsx`
- **Framework**: React + Vercel AI SDK (`useChat` hook)
- **Endpoint**: `/api/ai/unified-stream`
- **Features**:
  - Real-time streaming response
  - **Thinking Process Visualization**: Renders `toolInvocations` as step-by-step thinking blocks.
  - **Enhanced UX**: Gradient bubbles, auto-resizing input, mobile responsive.

### 2. Backend: Unified Stream API (Hybrid Engine)

- **Location**: `src/app/api/ai/unified-stream/route.ts`
- **Framework**: Next.js App Router + Vercel AI SDK (`streamText`)
- **Model**: `google('gemini-1.5-flash')`
- **Architecture**:
  - **Offline Layer**: Handles simple queries (patterns, commands) locally without LLM.
  - **Online Layer**: Uses Gemini 1.5 Flash for complex reasoning.
- **System Prompt**: Enforces a structured thinking process and prioritizes offline tools for simple tasks.

## 🛠️ Tool System

The AI uses a multi-layer tool system to simulate human-like reasoning and optimize performance.

### A. Offline Tools (Speed Layer)

Used for instant responses without incurring LLM costs.

1.  **`analyzePattern`**: Detects intent using regex patterns (e.g., "CPU status") -> Returns instant analysis.
2.  **`recommendCommands`**: Suggests CLI commands based on keywords -> Returns command list.

### B. Thinking Tools (Cognitive Layer)

Used to plan and analyze _before_ taking action.

1.  **`analyzeIntent`**: Classifies user intent (Monitoring, Troubleshooting, Prediction, etc.).
2.  **`analyzeComplexity`**: Scores query complexity to decide strategy (Offline vs Online).
3.  **`selectRoute`**: Chooses the optimal execution path.
4.  **`searchContext`**: Retrieves relevant history or knowledge.
5.  **`generateInsight`**: Synthesizes findings into actionable insights.

### C. Action Tools (Execution Layer)

Used to fetch data or perform operations.

1.  **`getServerMetrics`**: Retrieves server stats (CPU, Memory, Disk) using `scenario-loader`.
2.  **`predictIncident`**: **[Real GCP]** Calls Google Cloud Functions for ML-based anomaly detection.
3.  **`searchKnowledgeBase`**: **[Real RAG]** Uses `SupabaseRAGEngine` (pgvector) to search actual knowledge base.
4.  **`analyzeServerHealth`**: Performs comprehensive health analysis of all servers.

## 🔄 Data Flow

1.  **User Query**: User types a message in `AISidebarV4`.
2.  **API Request**: `useChat` sends POST request to `/api/ai/unified-stream`.
3.  **AI Processing (Hybrid Routing)**:
    - **Phase 1 (Thinking)**: Calls `analyzeIntent` -> `analyzeComplexity`.
    - **Phase 2 (Routing)**:
      - If **Simple**: Calls `analyzePattern` or `recommendCommands` (Offline).
      - If **Complex**: Calls `searchKnowledgeBase` (RAG) or `predictIncident` (GCP).
    - **Phase 3 (Insight)**: Calls `generateInsight`.
4.  **Streaming Response**:
    - Tool calls are streamed as `toolInvocations` (rendered as UI steps).
    - Final text response is streamed as markdown.
5.  **Visualization**: User sees the "Thinking..." block expand with steps, followed by the final answer.

## 🔌 Integration Points

- **GCP Integration**: `predictIncident` tool connects to external GCP Cloud Functions.
- **Supabase Integration**: `searchKnowledgeBase` connects to Supabase `pgvector` for RAG.
- **Scenario Loader**: `getServerMetrics` uses `src/services/scenario/scenario-loader.ts` for consistent demo data.
