# AI Assistant Architecture

## 🏗️ Overview

The AI Assistant is built on a **Hybrid Engine Architecture** that intelligently switches between **Offline Capabilities** (Speed Layer) and **Google Gemini 1.5 Flash** (Intelligence Layer). This approach minimizes latency and cost while maximizing reasoning capabilities. It features a unique "Thinking Process" visualization that exposes the AI's internal reasoning and tool usage to the user.

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
  - **Offline Layer (Speed)**: Handles simple queries (patterns, commands) locally using `analyzePattern` and `recommendCommands`.
  - **Online Layer (Intelligence)**: Uses Gemini 1.5 Flash for complex reasoning, RAG (`searchKnowledgeBase`), and ML predictions (`predictIncident`).
- **System Prompt**: Enforces a structured thinking process and prioritizes offline tools for simple tasks.

## 🛠️ Tool System

The AI uses a multi-layer tool system to simulate human-like reasoning and optimize performance.

### A. Offline Tools (Speed Layer)

Used for instant responses without incurring LLM costs. These tools run locally on the server.

1.  **`analyzePattern`**: Detects intent using regex patterns (e.g., "CPU status", "Memory usage") -> Returns instant analysis.
2.  **`recommendCommands`**: Suggests CLI commands based on keywords -> Returns command list.

### B. Thinking Tools (Cognitive Layer)

Used to plan and analyze _before_ taking action. These are internal reasoning steps.

1.  **`analyzeRequest`**: Consolidates intent classification and complexity analysis into a single step to optimize token usage.

### C. Action Tools (Execution Layer)

Used to fetch data or perform operations.

1.  **`callUnifiedProcessor`**: **[Real GCP]** Calls the unified Google Cloud Function for complex analysis (NLP + ML + Server Analysis).
2.  **`getServerMetrics`**: Retrieves server stats (CPU, Memory, Disk) using `scenario-loader` (Simulation).
3.  **`searchKnowledgeBase`**: **[Real RAG]** Uses `SupabaseRAGEngine` (pgvector) to search the actual knowledge base.

## 🔄 Data Flow

1.  **User Query**: User types a message in `AISidebarV4`.
2.  **API Request**: `useChat` sends POST request to `/api/ai/unified-stream`.
3.  **AI Processing (Hybrid Routing)**:
    - **Phase 1 (Thinking)**: Calls `analyzeRequest`.
    - **Phase 2 (Routing)**:
      - If **Simple**: Calls `analyzePattern` or `recommendCommands` (Offline).
      - If **Complex**: Calls `searchKnowledgeBase` (RAG) or `callUnifiedProcessor` (GCP).
4.  **Streaming Response**:
    - Tool calls are streamed as `toolInvocations` (rendered as UI steps).
    - Final text response is streamed as markdown.
5.  **Visualization**: User sees the "Thinking..." block expand with steps, followed by the final answer.

## 🔌 Integration Points

- **GCP Integration**: `callUnifiedProcessor` tool connects to external GCP Cloud Functions.
- **Supabase Integration**: `searchKnowledgeBase` connects to Supabase `pgvector` for RAG.
- **Scenario Loader**: `getServerMetrics` uses `src/services/scenario/scenario-loader.ts` for consistent demo data.
