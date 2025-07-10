# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests with Vitest
npm run test:integration   # Integration tests with Vitest
npm run test:e2e          # E2E tests with Playwright
npm run test:watch        # Watch mode for tests
npm run test:coverage     # Coverage reports

# Run validation suite
npm run validate:all      # TypeScript + ESLint + Unit tests
```

### Code Quality

```bash
# Linting
npm run lint              # Check code quality
npm run lint:fix         # Fix linting issues

# Type checking
npm run type-check       # TypeScript type checking

# Memory optimization
npm run memory:cleanup   # Clean up memory usage
npm run memory:check     # Check memory usage
```

### Monitoring & Debugging

```bash
# MCP server status
npm run mcp:status       # Check MCP server status
npm run mcp:setup        # Setup MCP server

# Time utilities (Korean timezone)
npm run kst:time        # Current Korean time
npm run kst:commit      # Commit timestamp format

# Health check
npm run health-check    # API health check
```

## Architecture Overview

This is a Next.js 15 project with App Router implementing a sophisticated AI-powered server monitoring platform.

### Core Architecture Patterns

**Multi-AI Engine System**

- Unified AI Router with fallback strategies
- Google AI, Supabase RAG, Korean NLP, and MCP engines
- Edge Runtime optimized for Vercel deployment

**Domain-Driven Design**

- Bounded contexts in `src/domains/`
- Service layer separation in `src/services/`
- Clean interfaces and dependency injection

**Data Processing Pipeline**

- Unified data processor for monitoring and AI flows
- Adapter pattern for different data sources
- Real-time communication via SSE/WebSocket

### Key Directories

```
src/
├── app/                    # Next.js App Router (pages + API routes)
├── components/             # React components (domain-organized)
├── services/              # Business logic and external integrations
├── domains/               # Domain-specific modules (DDD)
├── lib/                   # Shared utilities and configurations
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

### AI Engine Architecture

The project implements a sophisticated AI routing system:

1. **UnifiedAIEngineRouter** - Central orchestrator for all AI services
2. **Google AI Service** - Primary AI engine with Gemini models
3. **Supabase RAG Engine** - Vector search and knowledge retrieval
4. **Korean NLP Engine** - Local natural language processing
5. **MCP Context Assistant** - GCP VM에서 실행되는 컨텍스트 분석 보조 도구
6. **AI Agent Engine** - Independent LLM-free intelligent inference

### Data Flow

```
User Query → AI Agent Engine → Intent Classifier → Response Generator
              ↓                    ↓                    ↓
         Context Manager → MCP Context (GCP VM) → Action Executor
```

## Development Guidelines

### Time Zone Requirements

- All timestamps must use Korean timezone (Asia/Seoul, UTC+9)
- Use format: `YYYY-MM-DD HH:mm:ss (KST)`
- Commit messages should include KST timestamps

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Path aliases: `@/` for `src/`
- Korean time format: `new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})`

### Testing Strategy

- **Unit Tests**: Vitest for service logic and utilities
- **Integration Tests**: API endpoints and AI engine flows
- **E2E Tests**: Playwright for full user workflows
- **Coverage Target**: 70% minimum across all metrics

### Environment Variables

Key environment variables for development:

- `GOOGLE_AI_API_KEY` - Google AI Studio API key
- `SUPABASE_*` - Supabase database credentials
- `UPSTASH_REDIS_*` - Redis caching credentials
- `GOOGLE_OAUTH_*` - Google OAuth configuration

### Memory Management

- Node.js memory limits configured per script
- Development: 8GB (`--max-old-space-size=8192`)
- Production: 4GB (`--max-old-space-size=4096`)
- TypeScript checking: 6GB (`--max-old-space-size=6144`)

### AI Engine Development

When working with AI engines:

1. Use `UnifiedAIEngineRouter` for all AI queries
2. Implement fallback strategies for reliability
3. Add proper error handling and logging
4. Test with different engine configurations
5. Monitor response times and memory usage

### API Route Patterns

- Use Edge Runtime for performance: `export const runtime = 'edge'`
- Implement proper error handling with status codes
- Add rate limiting for resource-intensive endpoints
- Use TypeScript for request/response typing

### Component Development

- Use domain-based organization
- Implement proper loading states
- Add error boundaries for AI components
- Use React Query for data fetching
- Follow atomic design principles

### Testing New Features

1. Write unit tests first (TDD approach)
2. Add integration tests for API endpoints
3. Create E2E tests for critical user flows
4. Run `npm run validate:all` before committing
5. Check memory usage with `npm run memory:check`

### Deployment Notes

- Project optimized for Vercel free tier
- Uses Edge Runtime for better performance
- Implements caching strategies for cost optimization
- Graceful degradation for service limitations

## Troubleshooting

### Common Issues

- **Memory errors**: Check Node.js memory limits in package.json
- **AI timeouts**: Verify API keys and network connectivity
- **Build failures**: Run `npm run type-check` to identify TypeScript issues
- **Test failures**: Use `npm run test:watch` for interactive debugging

### Performance Optimization

- Monitor AI engine response times
- Use Redis caching for frequently accessed data
- Implement proper error boundaries
- Check bundle size with `npm run build`

This project demonstrates advanced Next.js patterns with AI integration, optimized for production deployment with comprehensive testing and monitoring capabilities.

## Gemini CLI Collaboration

When working with Gemini CLI for local development assistance, refer to the detailed guide in `docs/gemini-collaboration.md`.

### Quick Reference

```bash
# Save project context
gemini /memory add "OpenManager VIBE v5 - AI server monitoring"
gemini /memory add "Next.js 15, TypeScript, Supabase Auth"
gemini /memory add "Vercel free tier optimization focus"

# Efficient usage (1,000 daily limit)
cat src/app/page.tsx | gemini -p "analyze auth logic"
echo "login redirect issue" | gemini -p "3-line solution"
git diff | gemini -p "review changes"

# Token management
gemini /stats     # Check usage
gemini /compress  # Compress conversation
gemini /clear     # Reset context
```

### Current Development Focus

- **Login Redirect Issue**: Authentication successful but home redirect failing
- **Vercel Optimization**: Edge Runtime, minimal memory usage
- **Debugging**: Console logs added for auth state tracking

For detailed collaboration patterns and examples, see `docs/gemini-collaboration.md`.
