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
    ├── context-compression.ts     # Token Optimization
    └── langfuse-handler.ts        # Observability
```

## LLM Providers

| Provider | Model | Usage |
|----------|-------|-------|
| Google | gemini-2.0-flash-exp | Primary (Supervisor) |
| Groq | llama-3.3-70b-versatile | Fallback (Agents) |

## Environment Variables

```bash
# Required
GOOGLE_API_KEY=xxx              # Gemini API
GROQ_API_KEY=xxx                # Groq API

# Optional: Supabase (for checkpointing)
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional: LangFuse Observability (v4)
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

## LangFuse Integration (v4)

### Package Dependencies

```json
{
  "@langfuse/core": "^4.5.1",
  "@langfuse/langchain": "^4.5.1",
  "@opentelemetry/api": "^1.9.0"
}
```

> **Note**: v4 packages natively support `@langchain/core >=0.3.0`.
> No `--legacy-peer-deps` required.

### Usage

LangFuse tracing is automatically enabled when environment variables are set.
See `src/lib/langfuse-handler.ts` for implementation details.

### Migration from v3

If migrating from `langfuse-langchain` (v3.x):

```bash
# Remove deprecated packages
npm uninstall langfuse langfuse-langchain

# Install v4 scoped packages
npm install @langfuse/core @langfuse/langchain @opentelemetry/api
```

Update imports:
```typescript
// Before (v3)
import { CallbackHandler } from 'langfuse-langchain';

// After (v4)
import { CallbackHandler } from '@langfuse/langchain';
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

Current: `5.83.11`

See [CHANGELOG.md](../../CHANGELOG.md) for release history.
