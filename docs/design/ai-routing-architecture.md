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

### 1. Classification (The Router)
- **Engine**: Groq (Llama-3.1-8b-instant)
- **Latency**: < 200ms
- **Cost**: Negligible (approx. $0.05 / 1M tokens)
- **Function**: Classifies intent and complexity (1-5).

### 2. Primary Execution
| Complexity | Engine | Use Case |
| :--- | :--- | :--- |
| **Simple (1-3)** | **Gemini 1.5/2.0 Flash** | Greetings, status checks, CLI command lookup. |
| **Complex (4-5)** | **Gemini 1.5/2.0 Pro** | Root cause analysis, code generation, log correlation. |

### 3. Fallback Mechanism (High Availability)
If the primary Google model fails (e.g., 429 Too Many Requests, 500 Error):
- **For Flash**: Seamlessly switches to **Llama 3.1 8B** (Groq).
- **For Pro**: Seamlessly switches to **Llama 3.3 70B** (Groq).

## Configuration
Requires the following environment variables:
```bash
# Primary
GOOGLE_AI_API_KEY=...

# Router & Fallback
GROQ_API_KEY=gsk_...
```
