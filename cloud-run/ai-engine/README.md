# AI Engine - Cloud Run Service

Vercel AI SDK Multi-Agent Supervisor for OpenManager VIBE v5

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Deploy to Cloud Run
gcloud run deploy ai-engine --source . --region asia-northeast1
```

## Architecture (v5.84.0)

```
src/
├── server.ts                      # Hono HTTP server (+ Graceful Shutdown)
├── routes/                        # API route handlers
├── services/
│   ├── ai-sdk/
│   │   ├── supervisor.ts          # Vercel AI SDK Supervisor
│   │   ├── model-provider.ts      # Multi-provider failover
│   │   └── agents/                # Agent definitions
│   ├── observability/
│   │   └── langfuse.ts            # LLM Observability (FREE)
│   └── resilience/
│       └── circuit-breaker.ts     # Fault tolerance
├── tools-ai-sdk/                  # AI SDK Tools
├── data/
│   └── precomputed-state.ts       # O(1) server state lookup
└── lib/
    ├── model-config.ts            # LLM Configuration
    └── redis-client.ts            # Upstash Redis cache
```

## LLM Providers (Role-Based Assignment)

| Agent | Primary | Fallback | Free Tier |
|-------|---------|----------|-----------|
| Supervisor | Cerebras `llama-3.3-70b` | Mistral → OpenRouter | 24M tokens/day |
| Orchestrator | Cerebras `llama-3.3-70b` | Groq | 24M tokens/day |
| NLQ Agent | Cerebras `llama-3.3-70b` | Groq | 24M tokens/day |
| Analyst Agent | Groq `llama-3.3-70b-versatile` | Cerebras | 14.4K RPD |
| Reporter Agent | Groq `llama-3.3-70b-versatile` | Cerebras | 14.4K RPD |
| Advisor Agent | Mistral `mistral-small-2506` | - | 10K RPD |
| Summarizer | OpenRouter `qwen-2.5-7b:free` | `llama-3.1-8b:free` | ∞ (free models) |

## Observability - Langfuse (FREE Tier)

**무료 사용 가능**: [langfuse.com/pricing](https://langfuse.com/pricing)

| 항목 | Hobby (무료) |
|------|-------------|
| 비용 | $0 |
| 이벤트 | ~50K-100K/월 |
| 데이터 보존 | 90일 |
| 신용카드 | 불필요 |

### 환경 변수 설정

```bash
# Langfuse (FREE - https://cloud.langfuse.com)
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

### 기능
- LLM 호출 트레이싱
- 토큰 사용량 추적
- 비용 분석
- 성능 모니터링

## Resilience - Circuit Breaker

Provider 장애 시 자동 복구:

```
CLOSED → (3회 실패) → OPEN → (30초 후) → HALF_OPEN → (성공) → CLOSED
```

### 모니터링 엔드포인트

```bash
# Circuit Breaker 상태 조회
curl https://ai-engine-xxx.run.app/monitoring

# Circuit Breaker 리셋
curl -X POST https://ai-engine-xxx.run.app/monitoring/reset
```

## Environment Variables

```bash
# Required - AI Providers (최소 1개)
CEREBRAS_API_KEY=xxx               # Cerebras (Primary - Supervisor, NLQ)
GROQ_API_KEY=xxx                   # Groq (Analyst, Reporter)
MISTRAL_API_KEY=xxx                # Mistral (Advisor, Verifier)
OPENROUTER_API_KEY=xxx             # OpenRouter (Summarizer, Fallback)

# Optional - Observability (FREE)
LANGFUSE_SECRET_KEY=xxx
LANGFUSE_PUBLIC_KEY=xxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com

# Optional - Supabase
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional - Upstash Redis
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# Security
CLOUD_RUN_API_SECRET=xxx           # API Key for /api/* endpoints
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/warmup` | GET | Precomputed state warmup |
| `/monitoring` | GET | Circuit Breaker status |
| `/monitoring/reset` | POST | Reset Circuit Breakers |
| `/api/ai/supervisor` | POST | AI Chat (streaming) |
| `/api/ai/embedding` | POST | Text embedding |
| `/api/ai/generate` | POST | Text generation |

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Promptfoo evaluation
npm run prompt:eval
npm run prompt:view

# Security red-team tests
npm run prompt:redteam
```

## Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy ai-engine \
  --source . \
  --region asia-northeast1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated

# Service URL
https://ai-engine-490817238363.asia-northeast1.run.app
```

## Docker

```bash
# Local build
docker build -t ai-engine:local .

# Run locally
docker run -p 8080:8080 --env-file .env ai-engine:local
```

## Version

Current: `5.84.0`

## Changelog

### v5.84.0 (2025-12-29)
- Vercel AI SDK v6 migration (from LangGraph)
- Langfuse Observability integration (FREE tier)
- Circuit Breaker for provider fault tolerance
- streamText real-time token streaming
- Graceful shutdown with trace flushing
- Docker v4.0 optimization

See [CHANGELOG.md](../../CHANGELOG.md) for full release history.
