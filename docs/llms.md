# OpenManager VIBE v5 - LLM Context

> **v7.0.1** | Updated 2026-01-26
>
> AI 어시스턴트가 프로젝트를 이해하는 데 필요한 핵심 정보

## Project Overview

OpenManager VIBE is an AI-native server monitoring platform built with:
- Frontend: Next.js 16, React 19, TypeScript 5.9
- AI Engine: Vercel AI SDK 6, Multi-Agent System
- Database: Supabase (PostgreSQL + pgVector)
- Deployment: Vercel (Frontend) + Cloud Run (AI Engine)

## Architecture

### Hybrid Architecture
```
[User] → [Vercel/Next.js] → [Cloud Run/AI Engine] → [Supabase]
              ↓                      ↓
         UI/API Proxy         Multi-Agent System
```

### AI Engine Components
- Supervisor: Dual-mode (Single/Multi Agent)
- Agents: NLQ, Analyst, Reporter, Advisor
- Providers: Cerebras → Mistral → Groq (fallback chain)
- Tools: 12 specialized tools (metrics, RAG, web search)

## Key Files

### Entry Points
- `src/app/page.tsx` - Main dashboard
- `cloud-run/ai-engine/src/server.ts` - AI Engine entry
- `CLAUDE.md` - AI assistant instructions

### Configuration
- `.env.local` - Environment variables
- `package.json` - Dependencies
- `next.config.ts` - Next.js config

### Documentation
- `docs/README.md` - Documentation index
- `docs/QUICK-START.md` - Getting started
- `docs/DEVELOPMENT.md` - Development guide
- `docs/reference/architecture/ai/ai-engine-architecture.md` - AI architecture

## Common Tasks

### Development
```bash
npm run dev:network    # Start dev server
npm run validate:all   # Run all validations
npm run test           # Run tests
```

### Deployment
```bash
npm run release:patch  # Version bump
git push --follow-tags # Deploy to Vercel
```

### AI Engine
```bash
curl https://ai-engine-xxx.run.app/health  # Health check
```

## Important Constraints

1. TypeScript strict mode - no `any` types
2. AI Engine timeout: unlimited (Cloud Run)
3. Vercel timeout: 10s (use async jobs for long tasks)
4. Free tier optimization: Cerebras/Mistral/Groq rotation

## Contact

- Repository: github.com/skyasu2/openmanager-vibe-v5
- Version: 5.88.0
