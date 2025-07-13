# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **항상 깊이 있는 분석을 기반으로 한 통찰력 있는 답변 제공**

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

## MCP (Model Context Protocol) 도구 통합

Claude Code에는 7개의 MCP 서버가 설정되어 프로젝트 개발을 강력하게 지원합니다.

### 🛠️ 설정된 MCP 도구 목록

| 도구 | 설명 | 주요 기능 |
|------|------|-----------|
| **filesystem** | 파일시스템 접근 | 프로젝트 파일 읽기/쓰기/검색 |
| **github** | GitHub API 통합 | 이슈/PR 관리, 저장소 작업 |
| **brave-search** | 웹 검색 | 최신 기술 정보 및 문서 검색 |
| **memory** | 컨텍스트 메모리 | 프로젝트 지식 저장 및 검색 |
| **supabase** | 데이터베이스 통합 | Supabase DB 쿼리 및 관리 |
| **context7** | 문서 검색 | 라이브러리 문서 및 API 참조 |
| **gemini-cli-bridge** | Gemini CLI 브릿지 | 양방향 Claude ↔ Gemini 통합 |

### 🎯 MCP 도구 사용법

#### 파일 작업 (filesystem)
```
"src/app/page.tsx 파일의 인증 로직을 분석해주세요"
"components 폴더에 새로운 Button 컴포넌트를 만들어주세요"
```

#### GitHub 연동 (github)
```
"현재 프로젝트의 열린 이슈 목록을 가져와주세요"
"새로운 feature 브랜치를 만들고 PR을 생성해주세요"
```

#### 웹 검색 (brave-search)
```
"Next.js 15 App Router 최신 문서를 검색해주세요"
"TypeScript 5.6 새로운 기능을 찾아주세요"
```

#### 프로젝트 메모리 (memory)
```
"이 프로젝트는 AI 기반 서버 모니터링 플랫폼입니다"
"Vercel 무료 티어 최적화가 핵심 목표입니다"
```

#### 데이터베이스 (supabase)
```
"users 테이블의 구조를 확인해주세요"
"최근 7일간의 서버 메트릭을 조회해주세요"
```

#### 문서 검색 (context7)
```
"Next.js Image 컴포넌트 사용법을 찾아주세요"
"Supabase Auth 가이드를 검색해주세요"
```

#### Gemini CLI 브릿지 (gemini-cli-bridge v3.0)
```
"Gemini CLI로 코드 리뷰를 요청해주세요"
"현재 호출 컨텍스트 정보를 확인해주세요"

# v3.0 새로운 기능 - 작업별 최적화
"Python 정렬 방법?" → gemini_quick_answer (Flash + 헤드리스)
"이 함수 성능 분석해줘" → gemini_code_review (Pro 모델)
"복잡한 아키텍처 분석" → gemini_analyze (깊이 선택 가능)
```

## Gemini CLI 브릿지 v3.0 - 성능 및 지능형 개선

**v3.0 핵심**: 34% 성능 향상, 자동 모델 선택, 작업별 최적화 도구

### 🚀 주요 개선사항

- **--prompt 플래그**: echo 파이프 대신 직접 명령으로 성능 향상
- **지능형 모델 선택**: 프롬프트 분석으로 최적 모델 자동 선택
- **Pro → Flash 폴백**: 지연이나 실패 시 자동 전환 (95% 성공률)
- **작업별 도구**: quick_answer, code_review, analyze 특화 도구
- **배치 처리**: 여러 프롬프트 순차 실행 지원

### 💡 사용법

#### MCP를 통한 Gemini CLI 사용
```typescript
// 컨텍스트 정보 확인
mcp_gemini_cli_bridge_gemini_context_info()

// 기본 채팅
mcp_gemini_cli_bridge_gemini_chat("코드 리뷰 요청")

// Flash 모델 (빠름)
mcp_gemini_cli_bridge_gemini_chat_flash("간단한 질문")

// Pro 모델 (고품질)
mcp_gemini_cli_bridge_gemini_chat_pro("복잡한 분석 요청")

// 사용량 확인
mcp_gemini_cli_bridge_gemini_stats()
```

### 중요 차이점

- **Gemini CLI**: 로그인만 필요 (API 키 불필요), 로컬 개발 전용
- **Google AI API**: 프로덕션 AI 기능용, `GOOGLE_AI_API_KEY` 필요
- **MCP 브릿지**: Claude Code에서 Gemini CLI 기능을 직접 사용 가능

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

- **MCP 완전 가이드**: `docs/mcp-complete-guide.md`
- **Gemini CLI 브릿지 v3.0 개선사항**: `docs/gemini-cli-bridge-v3-improvements.md`
- **Gemini CLI 브릿지 v2.0**: `docs/gemini-cli-bridge-v2-guide.md`
- **Claude Code MCP 설정**: `docs/claude-code-mcp-setup.md`
- **개발 도구 통합**: `docs/development-tools.md`

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

### 🚀 Gemini CLI 직접 사용 (권장)

복잡한 도구 없이 터미널에서 바로 사용하세요:

#### 📋 기본 사용법
```bash
# 헬퍼 함수 설정 (최초 1회)
npm run gemini:setup

# 빠른 명령어들 (설정 후)
gc "TypeScript 에러 해결법"        # 빠른 채팅
gd                                  # git diff 자동 리뷰
gf src/app/page.tsx                # 파일 분석
ge "에러 메시지"                   # 에러 해결
gs                                  # 사용량 확인
gemini-daily                        # 일일 리포트

# npm 스크립트
npm run gemini:review              # Git 변경사항 리뷰
npm run gemini:stats               # 사용량 확인
npm run gemini:guide               # 사용법 안내
```

#### 🐧 WSL 환경에서 Windows Gemini CLI 사용
```bash
# ~/.bashrc에 추가된 별칭 사용
gemini --version         # 버전 확인
gp "안녕하세요"         # gemini -p 단축키
gs                      # gemini /stats 단축키  
gc                      # gemini /clear 단축키
gcomp                   # gemini /compress 단축키

# 파이프 사용 (특별 함수)
cat file.ts | gemini-pipe -p "코드 리뷰"
git diff | gemini-pipe -p "변경사항 요약"
```

⚠️ **WSL 주의사항**: Claude Code의 Bash 환경에서는 Gemini CLI 호출이 타임아웃될 수 있습니다. 사용자가 직접 터미널에서 실행하세요.

#### 📈 사용량 관리
```bash
gemini /stats      # 현재 사용량 확인 (일일 1,000회 제한)
gemini /compress   # 대화 압축으로 토큰 절약
gemini /clear      # 컨텍스트 초기화
```

#### 💡 효율적 사용 팁
- **간결한 프롬프트**: "3줄로 요약", "핵심만"
- **파이프라인 활용**: `echo "질문" | gemini -p "답변"`
- **사용량 모니터링**: 80% 초과 시 Claude로 전환
- **WSL 사용자**: PowerShell 래퍼 별칭 활용
