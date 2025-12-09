# Dynamic AI Model Routing Architecture

## Overview
OpenManager Vibe v5 uses a **Dynamic Model Router** to optimize for both speed and intelligence while minimizing costs. Instead of sending all queries to a single model, the system analyzes the complexity of each request and routes it to the most appropriate AI engine.

## Architecture Diagram

```mermaid
graph TD
    User[User Query] --> Router{Groq Classifier<br/>(Llama-3.1-8b-instant)}
    
    Router -->|Complexity 1-3| Flash[Gemini 1.5/2.0 Flash]
    Router -->|Complexity 4-5| Pro[Gemini 1.5/2.0 Pro]
    
    Flash -->|Success| Response
    Flash -->|Error/Rate Limit| FallbackFlash[Groq<br/>Llama-3.1-8b]
    
    Pro -->|Success| Response
    Pro -->|Error/Rate Limit| FallbackPro[Groq<br/>Llama-3.3-70b]
    
    FallbackFlash --> Response
    FallbackPro --> Response
```

## Routing Logic

### 1. Dynamic Model Router (DMR)

The **Dynamic Model Router** is the core intelligence that intercepts every user query and decides the optimal processing path. It uses a preliminary analysis step to categorize intent and complexity.

### Routing Logic (v3.2)

The router evaluates the query's **complexity (1-5)** and **intent** to select the appropriate model and toolset.

| Complexity | Intent Examples | Primary Model | Fallback Model | Latency Target |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | Greetings, FAQ | **Groq Llama 3.1 8B** | Gemini 2.5 Flash | < 300ms |
| **Level 2** | Server Status (Simple) | **Gemini 2.5 Flash** | - | < 800ms |
| **Level 3** | Simple Metrics | **Gemini 2.5 Flash** | Groq Llama 3.1 8B | < 1.5s |
| **Level 4** | Document Analysis, Pattern Analysis | **Gemini 2.5 Flash** | Groq Llama 3.1 8B | < 3s |
| **Level 5** | Complex Reasoning, Prediction | **Gemini 2.5 Pro** | Groq Llama 3.3 70B | Variable (Streaming) |

> **Note**: **Gemini 2.5 Flash** is now the default workhorse for most tasks due to its speed/cost efficiency. **Gemini 2.5 Pro** is reserved for "Thinking Mode" and complex reasoning tasks.

---

## 2. Integration with Unified AI Processor

For high-complexity tasks (typically Level 4+ or specific analytic intents), the Router delegates execution to the **Unified AI Processor** (Python/GCP).

-   **Endpoint**: `/api/ai/unified-stream` (Streaming) or `/api/ai/query` (Legacy/Sync)
-   **Role**: The Next.js API acts as a gateway. It calls the local `UnifiedAIProcessor` class (or external GCP Function if configured) to perform heavy lifting like:
    -   Korean NLP processing (KoNLPy)
    -   ML-based Anomaly Detection (Scikit-learn)
    -   RAG (Supabase pgvector)

### Architecture Flow

```mermaid
graph TD
    User[User Query] --> Router[Next.js API Route /api/ai/unified-stream]
    Router --> Classifier{Query Classifier}
    
    Classifier -- Simple (L1-3) --> Direct[Direct Response / Tool Call]
    Classifier -- Complex (L4-5) --> Unified[Unified Processor (Python)]
    
    Direct --> Gemini[Gemini 2.5 Flash]
    Unified --> GeminiPro[Gemini 2.5 Pro (Reasoning)]
    
    Unified --> NLP[NLP Engine]
    Unified --> ML[ML Analytics]
    Unified --> RAG[Knowledge Base]
```

## 3. Environment Configuration

Ensure the following environment variables are set in `.env.local`:

-   `GOOGLE_AI_API_KEY`: API Key for Gemini 2.5
-   `GROQ_API_KEY`: API Key for Groq (Llama models)
-   `NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT`: (Optional) URL for external GCP Cloud Function deployment
