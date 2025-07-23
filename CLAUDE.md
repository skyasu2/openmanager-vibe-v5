# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📑 목차 (Table of Contents)

1. [🌏 개발 환경 및 언어 설정](#-개발-환경-및-언어-설정)
2. [🧠 깊이 있는 사고 모드 (필수 적용)](#-깊이-있는-사고-모드-필수-적용)
3. [📦 MCP 도구 함수 상세](#-실제-mcp-도구-함수-상세)
4. [🛡️ 일반 도구 (대체 항목)](#️-일반-도구-대체-항목)
5. [📋 Common Commands](#common-commands)
6. [🏗️ Architecture Overview](#architecture-overview)
7. [📝 Development Guidelines](#development-guidelines)
8. [📂 문서 생성 위치 규칙 (필수 준수)](#-문서-생성-위치-규칙-필수-준수)
9. [🧪 Testing Strategy (TDD 필수)](#testing-strategy-tdd-필수)
10. [🔧 Environment Variables](#environment-variables)
11. [💾 Memory Management](#memory-management)
12. [🤖 AI Engine Development](#ai-engine-development)
13. [🌐 API Route Patterns](#api-route-patterns)
14. [🎨 Component Development](#component-development)
15. [✅ Testing New Features](#testing-new-features)
16. [🚀 Deployment Notes](#deployment-notes)
17. [🔍 Troubleshooting](#troubleshooting)
18. [🛠️ MCP (Model Context Protocol) 도구 통합](#mcp-model-context-protocol-도구-통합)
19. [🚀 AI 도구 v2.0 - 차세대 통합 시스템](#-ai-도구-v20---차세대-통합-시스템)
20. [📊 Claude Code 사용량 모니터링](#claude-code-사용량-모니터링)
21. [🤝 AI 도구 협업 전략](#ai-도구-협업-전략)

## 🌏 **개발 환경 및 언어 설정**

### 🖥️ 개발 환경

- **운영체제**: Windows 11
- **실행 환경**: WSL (Windows Subsystem for Linux)
- **터미널**: Ubuntu on WSL
- **Node.js**: v22.15.1 (LTS)
- **패키지 매니저**: npm

### 🗣️ 언어 정책

- **모든 대화 및 응답은 한국어로 진행합니다**
- 기술적 설명, 코드 주석, 에러 메시지 해석 모두 한국어 우선
- 영어 용어가 필요한 경우: 한국어 설명 후 괄호에 영어 병기
- 예시: "속성 (property)", "상태 관리 (state management)"

### 💬 응답 스타일

- 친근하고 이해하기 쉬운 설명
- 초보자도 이해할 수 있도록 쉽게 풀어서 설명
- 작업 진행 상황을 단계별로 명확히 안내
- **항상 깊이 있는 분석을 기반으로 한 통찰력 있는 답변 제공**

## 🧠 **깊이 있는 사고 모드 (필수 적용)**

**중요: 모든 사용자 명령에 대해 "think hard" 모드가 기본적으로 활성화됩니다.**

### 🎯 **사고 프로세스 가이드라인**

#### 1. **문제 분석 단계**

- 사용자의 요청 뒤에 숨은 진짜 의도 파악
- 현재 상황과 맥락을 종합적으로 고려
- 즉시 해결책보다 문제의 근본 원인 탐구
- 유사한 과거 경험이나 패턴과 연결하여 분석

#### 2. **다각도 검토 단계**

- 기술적 관점: 코드 품질, 성능, 확장성
- 사용자 관점: 사용성, 접근성, 경험
- 비즈니스 관점: 비용, 유지보수, 장기적 영향
- 보안 관점: 취약점, 데이터 보호, 권한 관리

#### 3. **솔루션 설계 단계**

- 여러 대안 솔루션 비교 검토
- 각 솔루션의 장단점과 트레이드오프 분석
- 프로젝트의 SOLID 원칙 및 개발 규칙 준수 확인
- Vercel 무료 티어 최적화 고려

#### 4. **미래 대비 단계**

- 확장 가능성과 유지보수성 고려
- 잠재적 문제점 및 리스크 식별
- 성능 최적화 및 모니터링 방안
- 문서화 및 팀 협업 관점에서의 개선점

### 🔍 **구체적 적용 사례**

- **단순 버그 수정 요청** → 버그의 근본 원인, 재발 방지책, 관련 코드 전반 점검
- **기능 추가 요청** → 기존 아키텍처와의 호환성, 사용자 여정, 성능 영향 분석
- **설정 변경 요청** → 다른 시스템에 미치는 영향, 보안성, 복원 계획
- **문서 작성 요청** → 독자 대상, 유지보수성, 실용성, 완전성

### ⚡ **빠른 판단이 필요한 경우에도**

- 긴급한 상황에서도 최소한의 리스크 분석 수행
- 임시 해결책과 장기적 해결책 구분 제시
- 빠른 조치 후 후속 개선 계획 제안

#### 📦 실제 MCP 도구 함수 상세

#### 📁 Filesystem MCP 도구

```
파일 읽기/쓰기:
- mcp__filesystem__read_file - 파일 내용 읽기
- mcp__filesystem__write_file - 파일 생성 또는 덮어쓰기

디렉토리 탐색:
- mcp__filesystem__list_directory - 디렉토리 내용 조회
- mcp__filesystem__create_directory - 새 디렉토리 생성

파일 검색:
- mcp__filesystem__search_files - 패턴으로 파일 검색
- mcp__filesystem__get_file_info - 파일 메타데이터 조회
```

#### 🐙 GitHub MCP 도구

```
저장소 관리:
- mcp__github__search_repositories - GitHub 저장소 검색
- mcp__github__create_repository - 새 저장소 생성

파일 작업:
- mcp__github__get_file_contents - 파일 내용 가져오기
- mcp__github__create_or_update_file - 파일 생성/수정

이슈/PR 관리:
- mcp__github__create_issue - 새 이슈 생성
- mcp__github__create_pull_request - PR 생성
- mcp__github__list_issues - 이슈 목록 조회

코드 검색:
- mcp__github__search_code - 코드베이스 검색
```

#### 🧠 Memory MCP 도구

```
엔티티 관리:
- mcp__memory__create_entities - 새 엔티티 생성
- mcp__memory__delete_entities - 엔티티 삭제
- mcp__memory__add_observations - 관찰 내용 추가

관계 관리:
- mcp__memory__create_relations - 엔티티 간 관계 생성
- mcp__memory__delete_relations - 관계 삭제

검색 및 조회:
- mcp__memory__search_nodes - 노드 검색
- mcp__memory__open_nodes - 특정 노드 열기
- mcp__memory__read_graph - 전체 그래프 조회
```

#### 🗄️ Supabase MCP 도구

```
데이터베이스 작업:
- mcp__supabase__execute_sql - SQL 쿼리 실행
- mcp__supabase__list_tables - 테이블 목록 조회
- mcp__supabase__list_extensions - 확장 기능 목록

마이그레이션:
- mcp__supabase__list_migrations - 마이그레이션 목록
- mcp__supabase__apply_migration - 마이그레이션 적용

프로젝트 관리:
- mcp__supabase__get_project_url - 프로젝트 URL 조회
- mcp__supabase__get_anon_key - 익명 API 키 조회
- mcp__supabase__generate_typescript_types - TypeScript 타입 생성

문서 검색:
- mcp__supabase__search_docs - Supabase 문서 검색
```

#### 📚 Context7 MCP 도구

```
라이브러리 문서 검색:
- mcp__context7__resolve-library-id - 라이브러리 ID 검색
- mcp__context7__get-library-docs - 라이브러리 문서 가져오기

사용 예시:
1. 먼저 resolve-library-id로 라이브러리 ID 찾기 (예: 'next.js' → '/vercel/next.js')
2. get-library-docs로 해당 ID의 문서 조회
```

#### 🔍 Tavily MCP 도구

```
웹 검색:
- mcp__tavily-mcp__tavily-search - 웹 검색 (일반 또는 뉴스)
- mcp__tavily-mcp__tavily-extract - URL 컨텐츠 추출
- mcp__tavily-mcp__tavily-crawl - 웹사이트 크롤링
- mcp__tavily-mcp__tavily-map - 사이트맵 생성

검색 옵션:
- topic: 'general' 또는 'news'
- search_depth: 'basic' 또는 'advanced'
- max_results: 5-20
- include_images: 이미지 포함 여부
```

#### 🧠 Sequential-Thinking MCP 도구 (단축명: st)

```
단계별 사고 도구:
- mcp__sequential-thinking__sequentialthinking - 복잡한 문제를 단계별로 분석

주요 매개변수:
- thought: 현재 사고 단계
- nextThoughtNeeded: 추가 사고 필요 여부
- thoughtNumber: 현재 단계 번호
- totalThoughts: 예상 총 단계 수 (동적 조정 가능)
- isRevision: 이전 사고 수정 여부
- revisesThought: 수정할 사고 번호

활용 시나리오:
- 복잡한 알고리즘 설계
- 시스템 아키텍처 개선
- 성능 병목 현상 분석
- 보안 취약점 탐색
- 다단계 리팩토링 계획
```

### 🛡️ 일반 도구 (대체 항목)

#### 파일 시스템 도구

```
파일 읽기/쓰기:
- Read - 파일 내용 읽기
- Write - 파일 생성 또는 덮어쓰기
- Edit - 특정 문자열 교체
- MultiEdit - 여러 부분 동시 편집

파일 검색:
- Glob - 패턴으로 파일 찾기 (예: "**/*.ts")
- Grep - 파일 내용 검색
- LS - 디렉토리 목록 조회
```

#### 웹 검색 도구

```
웹 검색 (MCP 대체):
- WebSearch - 웹 검색 수행
- WebFetch - URL 컨텐츠 가져오기 및 분석
```

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
# Time utilities (Korean timezone)
npm run kst:time        # Current Korean time
npm run kst:commit      # Commit timestamp format

# Health check
npm run health-check    # API health check

# Gemini CLI Dev Tools
npm run gemini:status   # Gemini CLI connection status
npm run gemini:analyze  # Code analysis
npm run gemini:review   # Git changes review
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

### 💡 **lint-staged 자동 수정 기능**

- **자동 포맷팅**: 커밋 시 ESLint와 Prettier가 자동으로 코드를 수정합니다
- **자동 재스테이징**: lint-staged v15는 수정된 파일을 자동으로 다시 스테이징합니다
- **추가 작업 불필요**: 개발자가 별도로 수정사항을 다시 add할 필요가 없습니다

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
- **파일 길이 가이드라인**:
  - 🟢 권장: 500줄 이하 (최적의 가독성과 유지보수성)
  - 🟡 주의: 800줄 이하 (ESLint 경고 발생)
  - 🔴 필수 분리: 1500줄 초과 시 즉시 리팩토링
  - 테스트 파일: 1000줄까지 허용
  - 함수당 100줄 제한 (복잡한 로직은 분리)

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

### 📝 문서 생성 위치 규칙 (필수 준수)

#### 루트 디렉토리 (/) - 4개 파일만 허용

**절대 규칙**: 다음 4개 파일만 루트에 유지

- README.md - 프로젝트 소개
- CLAUDE.md - AI 지시사항
- CHANGELOG.md - 버전 이력
- GEMINI.md - Gemini CLI 가이드

⚠️ **중요**: LICENSE, CONTRIBUTING.md 등 다른 문서는 생성하지 말 것

#### docs 폴더 (/docs) - 모든 기타 문서

- 설정 가이드 → `/docs/setup/`
- 트러블슈팅 → `/docs/troubleshooting/`
- 개발 가이드 → `/docs/development/`
- 보안 문서 → `/docs/security/`
- API 문서 → `/docs/api/`
- 기타 모든 문서 → `/docs/`

❌ **절대 금지**: 루트에 임시 문서, 분석 문서, 이슈 문서 생성

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

### Environment Variables Backup/Restore

개발 환경 설정을 쉽게 백업하고 복원할 수 있는 도구가 제공됩니다:

```bash
# 환경변수 백업 (민감한 정보는 자동 암호화)
npm run env:backup

# 환경변수 복원 (새 컴퓨터나 환경에서)
npm run env:restore
```

상세 가이드: `docs/development/env-backup-restore-guide.md`

### 🔑 토큰 관리 정책 (2025.07 업데이트)

**평문 토큰 사용 (개발 편의성 우선)**:

- 개발 환경에서는 평문 토큰 사용을 기본으로 합니다
- `.env.local`에 토큰을 직접 저장하여 사용
- 암호화 시스템은 선택적으로 사용 가능
- **주의**: `.env.local`은 절대 Git에 커밋하지 마세요!

**보안 참고사항**:

- 프로덕션 환경에서는 환경변수를 통한 관리 권장
- 토큰이 노출된 경우 즉시 재생성 필요
- `config/env-backup.json`은 민감한 정보를 암호화하여 저장

### Performance Optimization

- Monitor AI engine response times
- Use Redis caching for frequently accessed data
- Implement proper error boundaries
- Check bundle size with `npm run build`

This project demonstrates advanced Next.js patterns with AI integration, optimized for production deployment with comprehensive testing and monitoring capabilities.

## MCP (Model Context Protocol) 도구 통합

Claude Code에는 7개의 공식 MCP 서버가 설정되어 있습니다. MCP 도구들은 `mcp__서버명__함수명` 형식으로 사용 가능합니다.

### 🚨 **보안 경고: GitHub Personal Access Token 관리**

**절대로 GitHub Personal Access Token을 채팅이나 코드에 직접 입력하지 마세요!**

- ❌ 채팅에 토큰 붙여넣기
- ❌ 코드에 토큰 하드코딩
- ❌ 공개 저장소에 토큰 커밋
- ✅ 환경 변수로 안전하게 관리
- ✅ .env.local 파일 사용 (.gitignore 확인 필수)

**토큰이 노출된 경우**: 즉시 GitHub에서 토큰을 revoke하고 새로 생성하세요.

상세 설정 가이드: `docs/setup/github-mcp-token-setup.md`

### 🛠️ MCP 서버 목록

- **filesystem** - 파일 시스템 접근
- **github** - GitHub API 통합
- **memory** - 컨텍스트 메모리
- **supabase** - 데이터베이스 통합
- **context7** - 문서 검색
- **tavily** - AI 웹 검색
- **st** (sequential-thinking) - 복잡한 문제의 단계별 분석 및 해결

### 🚀 MCP 설정 및 사용법

**최신 Claude Code MCP 설정 가이드**: `docs/claude-code-mcp-setup-2025.md`

#### 기본 MCP 서버 추가

```bash
# 로컬 MCP 서버 추가
claude mcp add <서버이름> <명령> [인수...]

# 환경변수와 함께
claude mcp add my-server -e API_KEY=123 -- /path/to/server

# Remote MCP 서버 (신기능)
claude mcp add --transport sse remote-server https://vendor.com/mcp-endpoint

# 스코프 설정 (local/project/user)
claude mcp add my-server -s project /path/to/server
```

#### 스코프 상세 설명

- **local** (기본값): 현재 프로젝트에서만 사용
- **project**: 프로젝트 팀원들과 공유 (.mcp.json 파일을 통해)
- **user**: 모든 프로젝트에서 전역적으로 사용

#### 설정 파일 위치 및 직접 편집 (권장)

- **로컬/프로젝트**: `.mcp.json` (프로젝트 디렉토리)
- **유저(전역)**: `~/.claude.json` (홈 디렉토리)

#### 설정 파일 예시

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "true"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "~/Documents",
        "~/Projects"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### 주요 MCP 서버 설치 예시

```bash
# Filesystem
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem .

# GitHub (토큰 필요)
claude mcp add github -e GITHUB_TOKEN="YOUR_TOKEN" npx -y @modelcontextprotocol/server-github

# Supabase (토큰 필요)
claude mcp add supabase npx -y @supabase/mcp-server-supabase --project-ref=YOUR_REF -e SUPABASE_ACCESS_TOKEN=YOUR_TOKEN

# Memory
claude mcp add memory npx -y @modelcontextprotocol/server-memory

# Context7
claude mcp add context7 npx -y @context7/mcp-server

# Tavily (키 필요)
claude mcp add tavily -e TAVILY_API_KEY=YOUR_KEY npx -y @tavily/mcp-server

# Sequential-Thinking
claude mcp add sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking
```

#### MCP 서버 관리

```bash
# 등록된 모든 MCP 서버 확인
claude mcp list

# 특정 서버 상세 정보 확인
claude mcp get server-name

# Claude Code 내에서 확인
/mcp
```

#### MCP 서버 삭제

⚠️ **주의**: 현재 `claude mcp remove` 명령어에 버그가 있어 설정 파일 직접 편집을 권장합니다.

```bash
# CLI 시도 (버그 가능성)
claude mcp remove server-name -s [local|project|user]

# 권장: 설정 파일 직접 편집
# .mcp.json 또는 ~/.claude.json에서 해당 서버 블록 삭제
```

#### OAuth 인증 (신기능)

```bash
# 대화형 메뉴로 OAuth 관리
/mcp

# Remote MCP 서버 OAuth 인증
claude mcp add linear-server https://api.linear.app/mcp
# → /mcp 명령으로 OAuth 인증 진행
```

#### 문제 해결

```bash
# MCP 디버그 모드
claude --mcp-debug

# 설정 파일 구문 검증
cat ~/.claude.json | python -m json.tool

# Node.js 캐시 정리
npx clear-npx-cache

# 로그 확인 (macOS/Linux)
tail -f ~/.claude/logs/mcp-server-*.log
```

#### 권장 MCP 서버

**개발 필수 도구**

1. **Sequential Thinking**: 복잡한 문제 해결 과정 구조화
2. **Filesystem**: 로컬 파일 읽기/쓰기/편집
3. **GitHub**: Git 저장소 관리 및 이슈 추적
4. **Puppeteer**: 웹 자동화 및 테스팅

**생산성 도구**

1. **Notion**: 문서 및 프로젝트 관리
2. **Brave Search**: 웹 검색 기능
3. **Memory Bank**: 세션 간 컨텍스트 유지
4. **PostgreSQL**: 데이터베이스 쿼리

#### 보안 고려사항

1. **MCP 서버 신뢰성 검증**: 공식/검증된 서버만 사용
2. **환경 변수 보안**: API 키는 환경 변수로 관리
3. **파일 시스템 접근 제한**: 필요한 디렉토리만 지정
4. **프로젝트 공유시 주의**: 민감한 정보는 환경 변수 사용
5. **권한 관리**: 새 MCP 서버 발견시 신중히 승인

상세한 설정 및 사용법은 `docs/claude-code-mcp-setup-2025.md`를 참조하세요.

## 🚀 AI 도구 v2.0 - 차세대 통합 시스템 (최신)

**v2.0 핵심**: Claude와 Gemini의 지능형 협업, 자동 fallback, 실시간 모니터링

### 🎯 새로운 AI 도구 소개

#### 1. **Smart Gemini Wrapper** - 지능형 자동 전환 시스템

- Pro 모델 한도 초과 시 자동으로 Flash 모델로 전환
- 캐싱 시스템으로 응답 속도 향상
- 사용량 추적 및 비용 분석

#### 2. **AI Orchestrator** - Claude와 Gemini 협업 도구

- 다각도 분석: 기술, 사용자, 비즈니스, 보안 관점
- 단계별 솔루션 자동 생성
- 컨텍스트 누적 및 보존

#### 3. **AI Usage Dashboard** - 실시간 모니터링

- 모델별 사용량 통계 및 트렌드
- 비용 예측 및 최적화 제안
- 실시간 대시보드 (터미널)

### 💡 빠른 사용법 (WSL 최적화)

```bash
# WSL 환경 설정 (최초 1회)
npm run ai:setup

# 일상적인 사용
ai chat "질문"              # 스마트 채팅
ai analyze "복잡한 문제"     # 협업 분석
ai quick "빠른 해결"         # 즉시 해답
ai stats                     # 사용량 확인

# npm 스크립트
npm run ai:usage            # 대시보드 보기
npm run ai:live             # 실시간 모니터링
```

### 📊 사용 시나리오

1. **버그 해결**: `ai analyze "로그인이 간헐적으로 실패"`
2. **코드 리뷰**: `git diff | ai diff "SOLID 원칙 검토"`
3. **성능 최적화**: `ai file src/app/page.tsx "최적화 방법"`
4. **사용량 관리**: `ai stats` 또는 `npm run ai:live`

### ⚠️ 기존 도구와의 관계

- **기존 v5.0 도구**: 계속 사용 가능 (`./tools/g`, `npm run gemini:*`)
- **새로운 v2.0 도구**: 더 강력한 기능 제공 (권장)
- **마이그레이션**: 기존 명령어와 100% 호환

상세 가이드: `docs/gemini-dev-tools-v5-guide.md`

### 💡 사용법

#### npm 스크립트로 사용 (권장)

```bash
# 🎯 가장 많이 사용할 명령어
npm run gemini:chat "TypeScript 에러 해결법"
npm run gemini:analyze src/app/page.tsx
npm run gemini:diff "SOLID 원칙 관점에서 리뷰"
npm run gemini:stats
npm run gemini:health

# 📁 직접 실행 (더 빠름)
./tools/g "질문내용"
./tools/g file src/app/page.tsx
./tools/g diff
./tools/g stats
./tools/g health

# 💻 PowerShell 환경
.\tools\g.ps1 "질문내용"
.\tools\g.ps1 file src\app\page.tsx
.\tools\g.ps1 diff "변경사항 리뷰"
```

### 중요 차이점

- **기존 MCP 브릿지**: stdio 통신으로 성능 저하
- **새로운 v5.0**: 직접 gemini CLI 실행으로 빠른 응답
- **캐싱 시스템**: 반복 질문 즉시 응답 (5분 TTL)
- **배치 처리**: 여러 파일 동시 분석 가능

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

### ccusage 직접 사용 (권장)

설치 불필요하고 항상 최신 버전을 사용할 수 있는 ccusage 직접 사용을 권장합니다:

#### 💡 PowerShell에서 바로 사용

```powershell
# 🎯 가장 많이 사용할 명령어
npx ccusage@latest blocks --live      # 실시간 대시보드
npx ccusage@latest blocks --active    # 현재 상태
npx ccusage@latest daily             # 일별 사용량

# 📊 추가 명령어
npx ccusage@latest session           # 현재 세션
npx ccusage@latest monthly           # 월별 통계
npx ccusage@latest blocks            # 모든 블록
```

#### ⚡ npm 단축 명령어

```powershell
npm run usage                        # 사용법 가이드
npm run ccusage:live                 # 실시간 대시보드
npm run ccusage:daily                # 일별 사용량
npm run ccusage:blocks               # 현재 활성 블록
```

#### 🎯 일상 사용 패턴

```powershell
# 🌅 아침: 전날 사용량 확인
npx ccusage@latest daily

# 🕐 작업 중: 실시간 모니터링 (새 터미널)
npx ccusage@latest blocks --live

# 🌙 저녁: 현재 블록 상태 확인
npx ccusage@latest blocks --active
```

### 현재 개발 중점 사항

- **Node.js v22.15.1 업그레이드 완료**: 최신 LTS 버전으로 성능 향상
- **Vercel 최적화**: Edge Runtime, 최소 메모리 사용
- **AI 도구 협업**: Claude (유료) + Gemini CLI (무료) 효율적 조합

### 📚 관련 문서

#### 🆕 최신 가이드 (권장)

- **🚀 Claude Code MCP 설정 2025**: `docs/claude-code-mcp-setup-2025.md`
- **🤖 AI 시스템 통합 가이드**: `docs/ai-system-unified-guide.md`
- **🔒 보안 완전 가이드**: `docs/security-complete-guide.md`
- **🛠️ 개발 도구 통합**: `docs/development-tools.md`
- **🤝 AI 도구 협업 가치**: `docs/claude-gemini-collaboration-value.md`

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

#### 💊 Gemini CLI 사용량 관리 (일일 1,000회 제한):

```bash
# 사용량 확인
gemini /stats      # 현재 사용량 및 남은 횟수
gemini /compress   # 대화 압축으로 토큰 절약
gemini /clear      # 컨텍스트 초기화

# 사용량 임계값 가이드
# 0-50%: 자유롭게 사용
# 50-80%: 중요한 작업 위주
# 80-100%: Claude로 전환 권장

# ✅ 효율적 (토큰 절약)
echo "질문" | gemini -p "3줄로 답변"
cat 파일명.js | gemini -p "핵심만 요약"

# ❌ 비효율적 (토큰 낭비)
gemini  # 장시간 대화형 모드
```

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

### 🚀 Gemini CLI 직접 실행 (권장)

중간 도구 없이 터미널에서 직접 실행합니다:

#### 📋 기본 사용법

```bash
# 간단한 질문
echo "TypeScript generic type 사용법" | gemini -p "간단히 설명"

# 파일 분석
cat src/app/page.tsx | gemini -p "코드 품질 분석"

# Git diff 리뷰
git diff | gemini -p "변경사항 리뷰"

# 에러 해결
echo "TypeError: Cannot read property..." | gemini -p "해결 방법"
```

#### 🎯 시스템 명령

```bash
# 대화 초기화
gemini /clear

# 사용량 확인
gemini /stats

# 대화 압축
gemini /compress
```

#### 🐧 WSL 환경에서 사용 팁

```bash
# 헬퍼 함수 설정 (선택사항)
# ~/.bashrc에 추가하면 편리합니다:

# 빠른 질문
gq() {
    echo "$@" | gemini -p "답변"
}

# 파일 분석
gf() {
    cat "$1" | gemini -p "코드 분석"
}

# Git diff 리뷰
gd() {
    git diff | gemini -p "변경사항 리뷰"
}
```

#### 💡 효율적 사용 팁

- **간결한 프롬프트**: "3줄로 요약", "핵심만"
- **파이프라인 활용**: `echo "질문" | gemini -p "답변"`
- **사용량 모니터링**: 80% 초과 시 Claude로 전환
- **WSL 사용자**: PowerShell 래퍼 별칭 활용
