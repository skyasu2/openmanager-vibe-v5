# AI Engine - Cloud Run Service

LangGraph Multi-Agent Supervisor for OpenManager VIBE v5

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Deploy to Cloud Run
./deploy.sh
```

## Architecture

```
src/
├── server.ts                      # Hono HTTP server
├── agents/
│   ├── nlq-agent.ts               # Natural Language Query
│   ├── analyst-agent.ts           # Pattern Analysis
│   ├── reporter-agent.ts          # Incident Reports
│   └── verifier-agent.ts          # Response Validation
├── services/
│   └── langgraph/
│       └── multi-agent-supervisor.ts  # LangGraph Supervisor
└── lib/
    ├── model-config.ts            # LLM Configuration
    ├── checkpointer.ts            # Supabase Persistence
    └── context-compression.ts     # Token Optimization
```

## LLM Providers

| Provider | Model | Usage |
|----------|-------|-------|
| Cerebras | llama-3.3-70b | Primary (7 Agents) |
| Groq | llama-3.3-70b-versatile | Fallback Provider |
| Mistral | mistral-small-latest | Verifier & Last Keeper |

## Environment Variables

```bash
# Required
GOOGLE_API_KEY=xxx              # Gemini API (Embedding)
CEREBRAS_API_KEY=xxx            # Cerebras API (Primary)
GROQ_API_KEY=xxx                # Groq API (Fallback)
MISTRAL_API_KEY=xxx             # Mistral API (Verifier)

# Optional: Supabase (for checkpointing)
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Promptfoo Testing

```bash
# Run prompt evaluation
npm run prompt:eval

# View results
npm run prompt:view

# Security red-team tests
npm run prompt:redteam
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/supervisor` | POST | Chat completion |
| `/api/analyze-server` | POST | Server analysis |

## Deployment

```bash
# Deploy to Cloud Run (asia-northeast1)
./deploy.sh

# Service URL
https://ai-engine-490817238363.asia-northeast1.run.app
```

## Version

Current: `5.83.12`

See [CHANGELOG.md](../../CHANGELOG.md) for release history.
