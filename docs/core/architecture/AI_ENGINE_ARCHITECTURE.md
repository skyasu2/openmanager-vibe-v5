# 🧠 AI Engine Architecture

## Overview

The AI Engine for OpenManager Vibe is a **Hybrid Intelligence System** that combines fast local processing with powerful cloud-based reasoning. It leverages **Google's Gemini 2.5** models for state-of-the-art performance and **Groq** for high-speed routing.

## Core Components

### 1. Unified Intelligence Processor (v3.1.0)
The central nervous system of the AI, orchestrating all analysis and response generation.

-   **Location**: `gcp-functions/unified-ai-processor/main.py` (Python)
-   **Orchestrator**: `UnifiedAIProcessor` class.
-   **Sub-Engines**:
    -   **Gateway Router**: Routes requests to specific sub-engines.
    -   **Korean NLP Engine**: Specialized Korean language processing using `KoNLPy`.
    -   **ML Analytics Engine**: Scikit-learn based anomaly detection and trend analysis.
    -   **Rule Engine**: Deterministic rules for known operational scenarios.

### 2. Model Stack
-   **Primary (Reasoning)**: **Gemini 2.5 Pro** - Detailed analysis, complex troubleshooting ("Thinking Mode").
-   **Primary (Speed)**: **Gemini 2.5 Flash** - Quick responses, UI interactions, routine checks.
-   **Fallback**: **Groq (Llama 3.1/3.3)** - High-speed redundancy if Google AI is unavailable.

### 3. Data & Memory
-   **Vector Store**: Supabase (pgvector) for RAG (Retrieval Augmented Generation).
-   **Realtime**: Supabase Realtime for live dashboard updates.
-   **State Management**: `zustand` stores for client-side chat history and "Thinking Steps" visualization.

## API Architecture

> [!WARNING]
> **Architecture Note**: There are currently two parallel API implementations.
> 1.  **`/api/ai/unified-stream` (Recommended)**: Utilizes Vercel AI SDK for **streaming responses**, tool calling, and "Thinking Process" visualization. Used by the **AI Sidebar**.
> 2.  **`/api/ai/query` (Legacy)**: Standard request/response endpoint. Used by the **Fullscreen AI Workspace**. *Planned for deprecation/refactoring.*

## Architecture Diagram

```mermaid
graph TD
    Client[Client UI] -->|Stream Request| API[Next.js API (/api/ai/unified-stream)]
    
    subgraph "Next.js Server (Edge/Node)"
        API --> Router{Dynamic Router}
        Router -- "Simple/Visual" --> GeminiFlash[Gemini 2.5 Flash]
        Router -- "Complex/Thinking" --> GeminiPro[Gemini 2.5 Pro]
        
        GeminiFlash -- Tool Call --> UnifiedProc[Unified AI Processor]
        GeminiPro -- Tool Call --> UnifiedProc
    end
    
    subgraph "Unified AI Processor (Python)"
        UnifiedProc --> NLP[NLP Engine]
        UnifiedProc --> ML[ML Analytic Engine]
        UnifiedProc --> Rules[Rule Engine]
    end
    
    subgraph "Data Layer"
        UnifiedProc --> DB[(Supabase PG)]
        UnifiedProc --> RAG[(Vector Store)]
    end
    
    UnifiedProc -->|Analysis Result| GeminiPro
    GeminiPro -->|Streaming Response| Client
```

## 🧩 Key Components

### 1. Unified Processor
- **Single Entry Point**: All AI interactions go through a central processor.
- **Context Awareness**: Automatically injects relevant system metrics and logs.
- **Prompt Engineering**: Dynamic prompt construction based on task type.

### 2. Supabase Realtime Adapter
- **Streaming Thinking Process**: Instead of waiting for the full response, the AI streams its "thinking steps" (e.g., "Analyzing logs...", "Checking metrics...") to the client via Supabase Realtime.
- **Persistence**: Thinking steps are stored in PostgreSQL for audit and debugging.

### 3. Multi-Model Fallback
- **High Availability**: If the primary model (Gemini) fails or is rate-limited, the system automatically retries with secondary models (Claude, GPT).
- **Cross-Validation**: Critical decisions can be cross-validated by multiple models (optional configuration).

## 📊 RAG (Retrieval-Augmented Generation)

- **Vector Store**: Uses `pgvector` in Supabase.
- **Embeddings**: Generates embeddings for documentation and past incident reports.
- **Retrieval**: Semantically searches for similar past issues to provide context-aware solutions.
