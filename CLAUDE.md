# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 설정

- 모든 응답은 한국어로 제공해주세요
- 기술적 설명도 한국어로 번역해서 설명해주세요
- 영어 용어가 필요한 경우 한국어 설명 후 괄호에 영어를 병기해주세요

## 응답 스타일

- 친근하고 이해하기 쉬운 설명
- 코드 주석도 한국어로 작성
- 에러 메시지 해석 시 한국어로 설명
- 기술적인 내용도 초보자가 이해할 수 있도록 쉽게 풀어서 설명
- 작업 진행 상황을 단계별로 명확히 안내

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

### 🚀 개발 체크리스트 (필수 준수사항)

✅ **코드 작성 전**
- [ ] 기존 코드에서 재사용 가능한 부분 확인 (`@codebase` 활용)
- [ ] 실패하는 테스트 먼저 작성 (TDD - Red)
- [ ] SOLID 원칙 고려한 설계

✅ **코드 작성 중**
- [ ] TypeScript any 타입 사용 금지
- [ ] Next.js 최적화 (Image 컴포넌트, 서버/클라이언트 분리)
- [ ] 1500줄 넘으면 파일 분리

✅ **코드 작성 후**
- [ ] 불필요한 import 제거
- [ ] 테스트 통과 확인 (TDD - Green)
- [ ] Gemini 피드백 반영하여 리팩토링 (TDD - Refactor)
- [ ] CHANGELOG.md 업데이트
- [ ] /docs 문서 갱신

### Time Zone Requirements

- All timestamps must use Korean timezone (Asia/Seoul, UTC+9)
- Use format: `YYYY-MM-DD HH:mm:ss (KST)`
- Commit messages should include KST timestamps

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Path aliases: `@/` for `src/`
- Korean time format: `new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})`

### 핵심 개발 규칙

#### 1. SOLID 원칙 준수
- **Single Responsibility**: 각 클래스/모듈은 하나의 책임만
- **Open/Closed**: 확장에는 열려있고 수정에는 닫혀있게
- **Liskov Substitution**: 하위 타입은 상위 타입을 대체 가능
- **Interface Segregation**: 인터페이스는 최소한으로 분리
- **Dependency Inversion**: 추상화에 의존, 구체화에 의존 X
- **1500줄 규칙**: 파일이 1500줄을 넘으면 의도적인 분리 필수

#### 2. 기존 코드 우선 원칙
- 새 기능 개발 전 **반드시** 기존 코드 분석
- `@codebase`로 중복 확인 후 재사용
- 중복 코드 작성 금지
- 기존 패턴과 컨벤션 따르기

#### 3. Next.js 최적화
- `next/image` 컴포넌트 사용 필수
- 서버/클라이언트 컴포넌트 명확히 분리
- Dynamic imports로 번들 크기 최적화
- ISR/SSG 적극 활용

#### 4. 타입 안전성
- **any 타입 절대 금지**
- 명확한 타입 정의 필수
- 유틸리티 타입 활용 (Partial, Pick, Omit 등)
- 타입 가드 함수 작성

#### 5. 코드 정리 원칙
- 사용하지 않는 import 즉시 제거
- 주석 처리된 코드 커밋 금지
- 명확하고 의미있는 커밋 메시지
- 한 커밋에 하나의 기능/수정사항

#### 6. 문서화 규칙
- 모든 커밋마다 CHANGELOG.md 업데이트
- `/docs` 경로의 관련 문서 갱신
- 새로운 기능은 반드시 문서 작성
- API 변경사항은 상세히 기록
- 복잡한 로직은 인라인 주석 추가

### Testing Strategy (TDD 필수)

#### Test-Driven Development (TDD) 프로세스
1. **Red**: 실패하는 테스트 먼저 작성
2. **Green**: 테스트를 통과할 최소한의 구현
3. **Refactor**: Claude가 Gemini로부터 받은 개선 피드백을 반영하여 고품질 코드로 마무리

#### 테스트 유형
- **Unit Tests**: Vitest for service logic and utilities
- **Integration Tests**: API endpoints and AI engine flows
- **E2E Tests**: Playwright for full user workflows
- **Coverage Target**: 70% minimum across all metrics

#### TDD 필수 적용 영역
- API 엔드포인트
- 핵심 비즈니스 로직
- AI 엔진 통합
- 데이터 처리 파이프라인

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

Gemini CLI는 로컬 개발용 도구로, Google AI API와는 완전히 별개입니다. 상세 가이드는 `development/gemini-local/`을 참조하세요.

### 중요 차이점

- **Gemini CLI**: 로그인만 필요 (API 키 불필요), 로컬 개발 전용
- **Google AI API**: 프로덕션 AI 기능용, `GOOGLE_AI_API_KEY` 필요

### 빠른 사용법

```bash
# 로그인 (최초 1회)
gemini login

# 프로젝트 컨텍스트 저장
gemini /memory add "OpenManager VIBE v5 - AI server monitoring"
gemini /memory add "Next.js 15, TypeScript, Supabase Auth"
gemini /memory add "Vercel free tier optimization focus"

# 효율적 사용 (일일 1,000회 제한)
cat src/app/page.tsx | gemini -p "인증 로직 분석"
echo "로그인 리다이렉트 문제" | gemini -p "3줄 해결책"
git diff | gemini -p "변경사항 리뷰"

# 토큰 관리
gemini /stats     # 사용량 확인
gemini /compress  # 대화 압축
gemini /clear     # 컨텍스트 초기화
```

## Claude Code 사용량 모니터링

### ccusage 명령어 (설치 없이 사용)

Claude Code의 토큰 사용량을 확인하는 공식 도구입니다:

```bash
# 🎯 빠른 실행 (명령어 가이드 포함)
npm run ccusage

# 또는 alias 설정 후
ccusage  # (alias 설정: bash scripts/setup-ccusage-alias.sh)

# 개별 명령어 실행
npx ccusage@latest blocks --live    # 🆕 실시간 대시보드로 라이브 모니터링
npx ccusage@latest blocks --active  # 현재 과금 블록과 예상 사용량 확인
npx ccusage@latest daily           # 일별 사용량 세부 분석
npx ccusage@latest session         # 현재 세션 분석
npx ccusage@latest blocks          # 5시간 블록 단위 사용량 전체 보기

# 고급 옵션
npx ccusage@latest blocks --since 20250701    # 특정 날짜부터
npx ccusage@latest blocks --until 20250731    # 특정 날짜까지
npx ccusage@latest blocks --json              # JSON 출력
npx ccusage@latest blocks --breakdown         # 상세 분석
```

### claude-monitor (커스텀 모니터)

프로젝트에 포함된 한국어 최적화 모니터링 도구:

```bash
# claude-monitor 실행 (화면 지우지 않음)
cd claude-monitor-standalone
python3 claude-monitor.py --plan max20 --timezone Asia/Seoul --no-clear --once

# 연속 모니터링 (5초마다 새로고침)
python3 claude-monitor.py --plan max20 --no-clear

# npm 스크립트 사용
npm run cm:simple  # 간단한 정보만 출력
```

### 모니터링 도구 비교

| 기능 | ccusage | claude-monitor |
|------|---------|----------------|
| 설치 | 불필요 (npx) | Python 필요 |
| 실시간 | ✅ (--live) | ✅ (기본값) |
| 한국어 | ❌ | ✅ |
| 시각화 | 표 형식 | 프로그레스바 |
| JSON 출력 | ✅ | ❌ |
| 화면 지우기 | ✅ (항상) | 선택 가능 |

### 현재 개발 중점 사항

- **Node.js v22.15.1 업그레이드 완료**: 최신 LTS 버전으로 성능 향상
- **Vercel 최적화**: Edge Runtime, 최소 메모리 사용
- **AI 도구 협업**: Claude (유료) + Gemini CLI (무료) 효율적 조합

자세한 협업 패턴과 예시는 `development/gemini-local/`을 참조하세요.
MCP 서버 설정 가이드는 `docs/gemini-cli-mcp-setup.md`를 참조하세요.

## AI 도구 협업 전략

### Claude + Gemini CLI 효율적 사용

Claude와 Gemini CLI를 상황에 맞게 조합하여 비용 효율적인 개발:

#### Claude가 적합한 작업:
- 복잡한 코드 작성 및 리팩토링
- 실시간 디버깅 및 문제 해결
- 프로젝트 아키텍처 설계
- 파일 생성/수정 작업
- Git 작업 및 PR 생성

#### Gemini CLI가 적합한 작업:
- 대용량 파일 분석 (`@` 구문 활용)
- 코드베이스 전체 이해
- 간단한 코드 리뷰
- 문서 요약 및 설명
- 반복적인 질문/답변

#### 협업 워크플로우 예시:

**TDD 개발 프로세스에서의 협업**
```bash
# 1. Gemini로 기존 코드 분석 (중복 방지)
echo "새 기능: 사용자 인증" | gemini -p "@src/ 기존 인증 로직 분석"

# 2. Claude로 테스트 작성 (TDD - Red)
# 실패하는 테스트 먼저 작성

# 3. Claude로 구현 (TDD - Green)
# 테스트를 통과하는 최소 구현

# 4. Gemini로 코드 리뷰 및 개선점 제안
git diff | gemini -p "SOLID 원칙 관점에서 리뷰"

# 5. Claude로 리팩토링 (TDD - Refactor)
# Gemini 피드백 반영하여 고품질 코드로 개선

# 6. 문서 업데이트
echo "변경사항" | gemini -p "@docs/ 관련 문서 찾기"
# Claude가 CHANGELOG.md 및 문서 갱신
```

### MCP 서버 활용

Gemini CLI의 MCP 서버가 설정되어 있어 대용량 파일 분석이 가능합니다:
- 설정 파일: `~/.gemini/settings.json`
- MCP 도구: `gemini-mcp-tool`
- 파일 참조: `@파일경로` 구문 사용

자세한 사용법은 `GEMINI_USAGE_GUIDE.md`를 참조하세요.
