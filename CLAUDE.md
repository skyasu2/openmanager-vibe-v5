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
18. [🛠️ MCP 3-Tier 아키텍처](#mcp-model-context-protocol-도구-통합)
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

### 📦 MCP 도구 빠른 참조

**올바른 3-Tier MCP 아키텍처** (2025.07 업데이트):

- 🏠 **로컬 (개발 도구)**: filesystem, github, memory, sequential-thinking, playwright
- ☁️ **GCP VM (AI 보조)**: context7, tavily-mcp, supabase, serena - 자연어 질의, RAG, NLP 보조 역할
- 🚀 **Vercel (API)**: `/api/mcp` 엔드포인트로 GCP MCP 서버 상태 확인

**역할 분리 원칙**:

- 개발용 MCP는 로컬에서만 실행 (코딩 작업 지원)
- AI 보조용 MCP는 GCP VM에서만 실행 (Google AI 모드 지원)
- CloudContextLoader가 GCP MCP 서버와 원격 통신

**필수 문서**: `docs/mcp-unified-architecture-guide.md`

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

환경변수를 안전하게 백업하고 복원할 수 있는 간단한 도구가 제공됩니다:

```bash
# 환경변수 백업 (민감한 정보는 자동 암호화)
npm run env:backup

# 환경변수 복원 (새 컴퓨터나 환경에서)
npm run env:restore

# 도움말 보기
npm run env:help
```

**특징:**

- 민감한 정보(토큰, 시크릿 등)는 자동으로 암호화
- 일반 환경변수는 평문으로 저장
- GitHub에 안전하게 업로드 가능
- 다른 개발 환경에서 쉽게 복원

**백업 파일 위치:** `config/env-backup.json`
**상세 가이드:** `ENV-BACKUP-GUIDE.md`

**⚠️ 주의사항:**

- 이 도구는 개발 환경 전용입니다
- 프로덕션에서는 적절한 시크릿 관리 시스템을 사용하세요
- `encrypted-env-config.ts`는 런타임 설정 파일이며 백업 도구가 아닙니다

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

## 🤖 Claude Code Sub Agents - 차세대 AI 협업 시스템

### 🎯 Sub Agents 소개

Claude Code의 Sub Agents는 특정 작업에 특화된 AI 에이전트로, 작업을 효율적으로 위임하여 처리합니다.

#### 현재 활성 Sub Agents (개발팀 직무 역할)

1. **👨‍💻 Senior Code Architect** (`gemini-cli-collaborator`) - 시니어 코드 아키텍트
   - 레거시 코드 분석 및 리팩토링 전략 수립
   - SOLID 원칙 기반 아키텍처 검증
   - TypeScript 타입 안전성 및 최적화
   - 기술 문서 검토 및 코드베이스 인사이트 제공

2. **🔍 Security & Performance Engineer** (`code-review-specialist`) - 보안/성능 엔지니어
   - 보안 취약점 스캐닝 및 패치 제안
   - 성능 병목 구간 분석 및 최적화
   - 코딩 컨벤션 및 베스트 프랙티스 검증
   - 프로덕션 배포 전 최종 검수

3. **🧪 QA Lead Engineer** (`test-automation-specialist`) - QA 리드 엔지니어
   - 자동화 테스트 스위트 설계 및 구현
   - 실패한 테스트 근본 원인 분석
   - 테스트 커버리지 90% 이상 유지
   - CI/CD 파이프라인 테스트 자동화

4. **📚 Technical Writer Lead** (`doc-structure-guardian`) - 테크니컬 라이터 리드
   - API 문서 및 개발 가이드 작성
   - 문서 표준화 및 일관성 유지
   - 릴리즈 노트 및 마이그레이션 가이드
   - 개발자 온보딩 문서 관리

5. **📋 Product Manager** (`planner-spec`) - 프로덕트 매니저
   - 비즈니스 요구사항을 기술 명세로 변환
   - 스프린트 계획 및 백로그 관리
   - 사용자 스토리 및 수락 기준 정의
   - 개발 우선순위 및 일정 조율

6. **🚨 DevOps Engineer** (`issue-summary`) - 데브옵스 엔지니어
   - 24/7 시스템 모니터링 및 알림 관리
   - 인시던트 대응 및 사후 분석 리포트
   - 리소스 사용량 및 비용 최적화
   - SLA 99.9% 유지 및 장애 대응

7. **🛠️ Infrastructure Engineer** (`mcp-server-admin`) - 인프라 엔지니어
   - 개발/스테이징/프로덕션 환경 관리
   - 컨테이너 및 오케스트레이션 설정
   - CI/CD 파이프라인 구축 및 유지보수
   - 개발 도구 및 서버 프로비저닝

8. **🎨 Frontend UX Engineer** (`ux-performance-optimizer`) - 프론트엔드 UX 엔지니어
   - Core Web Vitals 최적화 (LCP, CLS, FID, INP)
   - 모바일 반응성 및 접근성 개선 (WCAG 2.1 AA)
   - Next.js 번들 크기 최적화 및 성능 분석
   - Vercel 무료 티어 최적화 및 사용자 경험 향상

9. **🤖 AI Systems Engineer** (`ai-systems-engineer`) - AI 시스템 엔지니어
   - AI 아키텍처 설계 및 최적화 (Local AI ↔ Google AI)
   - 자연어 질의 시스템 성능 최적화
   - AI 사이드바 엔진 관리 및 통합
   - Vercel-GCP AI 파이프라인 최적화

10. **🗄️ Database Administrator** (`database-administrator`) - 데이터베이스 관리자
    - Supabase PostgreSQL 및 pgvector 최적화
    - Upstash Redis 캐싱 전략 설계
    - 무료 티어 리소스 최적화
    - ML/RAG 시스템을 위한 데이터 파이프라인 관리

### 💡 사용 방법

#### 1. **자동 위임**

Claude Code가 작업 내용을 분석해 적절한 sub agent에 자동 할당:

```
"내 코드의 보안 취약점을 검토해줘"
"모든 테스트 실행하고 실패하는 것들 수정해줘"
```

#### 2. **명시적 요청**

특정 sub agent를 직접 지정:

```
"Senior Code Architect를 사용해서 auth 모듈 아키텍처 검토해줘"
"Senior Code Architect로 SOLID 원칙 위반 검사해줘"
```

### 🔧 Custom Sub Agents 생성

```bash
# Sub Agents 확인 및 생성
/agents
```

`.claude/agents/` 디렉토리에 저장하여 팀원과 공유 가능합니다.

### 📊 Senior Code Architect 활용 예시

1. **아키텍처 리뷰**

   ```
   "src/services 디렉토리의 전체 아키텍처를 분석하고 개선점 제안해줘"
   ```

2. **SOLID 원칙 검증**

   ```
   "AI 엔진 통합 코드가 SOLID 원칙을 준수하는지 검증하고 리팩토링 방안 제시해줘"
   ```

3. **기술 부채 분석**
   ```
   "레거시 코드의 기술 부채를 분석하고 단계별 개선 로드맵 작성해줘"
   ```

### 🤖 AI Systems Engineer 활용 예시

1. **자연어 질의 시스템 최적화**

   ```
   "SimplifiedQueryEngine의 응답 속도가 느린데 성능 최적화 방안 제시해줘"
   ```

2. **AI 모드 전환 구현**

   ```
   "Local AI와 Google AI 모드 간 자동 전환 로직을 설계해줘"
   ```

3. **AI 파이프라인 최적화**

   ```
   "Vercel-GCP AI 파이프라인의 병목 구간을 분석하고 개선 방안 제시해줘"
   ```

### 🗄️ Database Administrator 활용 예시

1. **벡터 검색 최적화**

   ```
   "Supabase의 pgvector 검색이 느린데 인덱스 최적화 방안을 제시해줘"
   ```

2. **캐싱 전략 설계**

   ```
   "Redis 캐싱 TTL을 데이터 타입별로 최적화해줘"
   ```

3. **무료 티어 관리**

   ```
   "Supabase 스토리지가 한계에 다다랐는데 최적화 전략을 수립해줘"
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

### 🔧 Sub Agent 활용 팁

1. **전문성 활용**: 각 에이전트의 전문 영역에 맞는 작업 위임
2. **협업 시너지**: 여러 에이전트를 순차적으로 활용하여 품질 향상
3. **컨텍스트 공유**: 명확한 지시로 프로젝트 컨텍스트 전달
4. **결과 통합**: 각 에이전트의 피드백을 종합하여 최종 솔루션 도출
