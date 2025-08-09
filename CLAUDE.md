# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

📚 **Claude Code 공식 문서**: https://docs.anthropic.com/en/docs/claude-code/overview

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징

- 100% 무료 티어로 운영 (Vercel + GCP + Supabase)
- 엔터프라이즈급 성능 (152ms 응답, 99.95% 가동률)
- Next.js 15 + App Router + React 18.3.1 + TypeScript strict mode

### 무료 티어 아키텍처

- **Frontend**: Vercel Edge Runtime (100GB 대역폭/월)
- **Backend API**: GCP Functions Python 3.11 (2백만 요청/월)
- **Database**: Supabase PostgreSQL (500MB)
- **Cache**: Memory-based LRU Cache (서버리스 최적화)
- **GCP VM Backend**: e2-micro VM에서 Google AI MCP 서버 + AI API + 백엔드 서비스 실행 중

### 주요 기능

- 📊 **실시간 모니터링**: CPU, Memory, Disk, Network (15초 간격)
- 🤖 **AI 분석**: 이상 징후 감지, 성능 예측, 자연어 질의
- 🔐 **인증**: GitHub OAuth 기반 접근 제어
- 📈 **대시보드**: 반응형 UI, 실시간 차트, 알림 시스템

### 🚀 CI/CD 파이프라인 (2025 표준 - 70% 속도 향상)

**핵심 원칙**: "배포를 막지 마라" - 필수 검증만 실제 차단, 나머지는 경고

- **Fast Track 배포**: `[skip ci]` 또는 `[build-skip]` 플래그로 2-7분 내 배포
- **CI/CD Lightweight**: 필수 검증만 실패 처리, TypeScript는 경고만
- **GitHub Actions 최적화**: 불필요한 "항상 성공" 처리 제거, 실질적 검증 중심
- **성능**: 70% 속도 향상 (이전 15분 → 현재 2-10분)
- **개발자 경험**: commit early, commit often 가능, `HUSKY=0`로 모든 검사 스킵 가능

#### 🪝 Git Hooks 최적화 (2025 베스트 프랙티스)

- **Pre-commit**: 8-18초 → 2-5초 (70% 단축)
  - 핵심만 유지: lint-staged + 하드코딩 시크릿 검사
  - TDD/Storybook/문서 시크릿 검사 제거
- **Pre-push**: 5-10초 → 2-3초 (60% 단축)
  - 간단한 대화형 옵션만 유지
  - 복잡한 에러 처리 및 서브에이전트 추천 제거

## 🛠️ 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **Package Manager**: npm
- **언어**: 한국어 우선 (기술 용어는 영어 병기)
- **Python**: 3.11 (GCP Functions)
- **Claude Code**: Max 20x 구독 ($200/월), Opus 4.1 모델
  - **사용량**: 5시간마다 200-800개 프롬프트
  - **주간 사용량**: Sonnet 4 240-480시간 + Opus 4.1 24-40시간
  - **프로젝트 설정**: 독립적 설정 사용

## 📂 프로젝트 구조

```
openmanager-vibe-v5/
├── src/             # 소스 코드
│   ├── app/         # Next.js 15 App Router
│   ├── services/    # 비즈니스 로직 (AI, Auth, MCP)
│   ├── components/  # React 컴포넌트
│   └── lib/         # 유틸리티
├── docs/            # 상세 문서 (100+개)
├── scripts/         # 자동화 스크립트
├── gcp-functions/   # Python 3.11 서버리스 (무료 티어)
│   ├── enhanced-korean-nlp/    # 한국어 처리
│   ├── ml-analytics-engine/    # ML 분석
│   └── unified-ai-processor/   # AI 통합 처리
└── tests/           # 테스트 코드
```

## 🚀 자주 사용하는 명령어

```bash
# 개발
npm run dev              # http://localhost:3000
npm run build            # 프로덕션 빌드
npm run lint:fix         # ESLint 자동 수정
npm run type-check       # TypeScript 검사

# 테스트
npm test                 # Vitest 실행
npm run test:e2e         # Playwright E2E
npm run test:coverage    # 커버리지 (목표: 70%+)
npm run test:quick       # 핵심 테스트만 (22ms)

# 검증
npm run validate:all     # 린트 + 타입 + 테스트

# 모니터링
npx ccusage@latest blocks --live    # Claude 사용량 실시간
npm run health:check                 # API 상태 확인

# Fast Track 배포 (2025 표준)
git commit -m "feat: 기능 추가"           # 표준 배포 (8-10분)
git commit -m "feat: 기능 추가 [build-skip]" # 빌드 체크 스킵 (5-7분)
git commit -m "fix: 긴급 수정 [skip ci]"   # 완전 CI 스킵 (2-3분)
```

## 📝 개발 규칙 (필수)

1. **TypeScript**: `any` 타입 절대 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **코드 재사용**: 기존 코드 검색 후 작성 (`@codebase` 활용)
4. **커밋**: 매 커밋마다 CHANGELOG.md 업데이트
5. **문서**: 루트에는 핵심 문서 6개만 유지
   - README.md, CHANGELOG.md, CHANGELOG-LEGACY.md, CLAUDE.md, GEMINI.md, AGENTS.md
   - 기타 문서는 종류별로 분류: `docs/`, `reports/`
6. **사고 모드**: "think hard" 항상 활성화
7. **SOLID 원칙**: 모든 코드에 적용

## 🧪 테스트 시스템 (3단계 전략)

### 현재 테스트 구성

- **총 40개 테스트** (이전 204개에서 최적화)
- **3단계 전략**: minimal(22ms) → smart → full
- **자동화 도구**: 스마트 선택기, 메타데이터 추적, TDD 자동화

### 핵심 테스트 명령어

```bash
# 빠른 검증 (22ms)
npm run test:quick      # 커밋/푸시 전 초고속 검증

# 스마트 선택 (변경 기반)
npm run test:smart      # 변경된 파일만 테스트
npm run test:smart:branch  # 브랜치 전체 변경사항

# 전체 테스트
npm test               # 모든 테스트 실행
npm run test:coverage  # 커버리지 리포트 (목표: 70%+)

# TDD 워크플로우
npm run test:tdd-check    # @tdd-red 상태 확인
npm run test:tdd-cleanup  # RED → GREEN 자동 정리
```

### 테스트 자동화 도구

- **스마트 테스트 선택기**: Git diff 기반 영향 분석 → 80% 시간 절약
- **메타데이터 추적**: 실행 시간, 성공률, flakiness 모니터링
- **서브에이전트 협업**: `test-first-developer`, `test-automation-specialist`

### Vitest 설정 최적화

- **Pool 설정**: `threads` 사용 (vmThreads는 isolate:false와 호환 불가)
- **환경 분리**: Node 환경과 DOM 환경 테스트 분리
- **Mock 조건부 로드**: 환경에 따른 브라우저 Mock 선택적 로드
- **성능**: isolate:false로 4x 성능 향상

상세 가이드: [`/docs/testing-system-guide.md`](/docs/testing-system-guide.md)

## 🔒 포트폴리오 보안 정책

**중요**: 이 프로젝트는 포트폴리오/데모용으로 **기본적인 보안**만 적용합니다.

### 현재 보안 설정

- **AI 보안**: `enableStrictMode: false` (포트폴리오 수준)
- **API 보호**: 민감한 엔드포인트만 (`/api/admin`, `/api/database`, `/api/ai`)
- **시크릿 관리**: 환경변수 사용, 하드코딩 방지 (Husky 검사)
- **보안 에이전트**: 기본 보안만 검사 (과도한 엔터프라이즈 보안 제거)

### 보안 체크리스트

- ✅ 하드코딩된 시크릿 없음
- ✅ 환경변수로 설정 관리
- ✅ 기본 API 인증
- ❌ 복잡한 보안 패턴 (불필요)
- ❌ 엔터프라이즈급 감사 (과도함)

### 🔐 시크릿 관리 (중요!)

- **절대 하드코딩 금지**: API 키, 토큰은 반드시 환경변수 사용
- **문서 마스킹**: 예시에서도 `[환경변수에서 설정]` 또는 `ghp_XXXXX` 형태 사용
- **자동 검사**: Pre-commit 훅이 시크릿 노출 자동 차단
- **상세 가이드**: [`/docs/security-management-guide.md`](/docs/security-management-guide.md)

자세한 내용: [`/docs/portfolio-security-guide.md`](/docs/portfolio-security-guide.md)

### 타입 안전성 유틸리티

타입 안전성을 위한 유틸리티 함수들이 `src/types/type-utils.ts`와 `src/types/react-utils.ts`에 정의되어 있습니다. getErrorMessage, safeArrayAccess, useSafeEffect 등을 활용하세요.

## 🔧 Next.js 15 App Router 모범 사례

### 프로덕션 최적화 (2024)

#### 1. 캐싱 전략 변경

- **중요**: Next.js 15부터 GET Route Handlers와 Client Router Cache가 기본적으로 **uncached**로 변경
- **이전**: 기본 캐시 → **현재**: 기본 비캐시
- **성능 영향**: 명시적 캐싱 전략 필요

```typescript
// app/api/servers/route.ts
export async function GET() {
  // Next.js 15: 명시적 캐싱 필요
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

#### 2. Runtime 설정 업데이트

```typescript
// ❌ 구버전 (deprecated)
export const runtime = 'experimental-edge';

// ✅ Next.js 15
export const runtime = 'edge';
```

#### 3. 번들 최적화

```javascript
// next.config.js
module.exports = {
  // 자동 외부 패키지 번들링 (Pages Router)
  bundlePagesRouterDependencies: true,

  // 특정 패키지 번들링 제외
  serverExternalPackages: ['sharp'],

  // ESLint 9 지원
  eslint: {
    ignoreDuringBuilds: false,
  },
};
```

#### 4. 성능 모니터링

```typescript
// app/layout.tsx - Core Web Vitals 추적
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

## 💡 핵심 시스템

### AI 엔진

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **엔진**: Google AI, Supabase RAG, Korean NLP
- **자동 폴백**: 실패 시 다른 엔진으로 자동 전환

### GCP Functions (서버리스)

- **enhanced-korean-nlp**: 한국어 자연어 처리
- **ml-analytics-engine**: ML 기반 분석
- **unified-ai-processor**: 통합 AI 처리
- **배포**: `scripts/deployment/deploy-all.sh`

### 인증

- **Supabase Auth**: GitHub OAuth
- **세션 관리**: JWT + Refresh Token

### 데이터베이스

- **PostgreSQL**: Supabase (500MB 무료)
  - 공식 문서: https://supabase.com/docs
  - **전담 관리**: `database-administrator` 서브 에이전트
- **Cache**: Memory-based LRU Cache (서버리스 최적화)
  - 메모리 기반 캐싱: 네트워크 지연 제거
  - TTL 지원: 자동 만료 및 정리
  - **구현**: cache-helper.ts 라이브러리
- **Vector DB**: pgvector 확장 (Supabase 내)

## 🧠 Memory-based 캐싱 시스템

**무료 티어 최적화**: 메모리 기반 캐싱으로 네트워크 지연 시간을 0에 가깝게 줄였습니다.

### 핵심 특징

- ✅ **네트워크 지연 없음**: 메모리 직접 액세스로 초고속 응답
- ✅ **서버리스 최적화**: Vercel Edge Runtime에 완벽 최적화
- ✅ **LRU 캐시**: 1000개 아이템 제한, 자동 정리
- ✅ **TTL 지원**: 5분 간격 자동 만료 및 정리
- ✅ **통계 추적**: 히트율, 메모리 사용량 모니터링

### 핵심 사용 패턴

#### 1. 캐싱 헬퍼 사용

```typescript
// lib/cache-helper.ts 활용
import { getCachedData, setCachedData } from '@/lib/cache-helper';

export async function getServerMetrics(serverId: string) {
  return getCachedData(
    `server:${serverId}:metrics`,
    () => fetchServerMetrics(serverId),
    60 // 1분 TTL
  );
}
```

#### 2. 메모리 기반 세션 관리

```typescript
// 메모리 기반 세션 (system/status API 참조)
class MemorySessionManager {
  private sessions = new Map<string, SessionData>();

  create(userId: string, data: any): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      ...data,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
    return sessionId;
  }

  get(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }
}
```

#### 3. AI 로그 스트리밍 (메모리 기반)

```typescript
// api/ai/logging/stream/route.ts 참조
class MemoryLogStorage {
  private logs: AILogEntry[] = [];
  private maxSize = 1000;

  addLog(log: AILogEntry): void {
    this.logs.unshift(log);
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(0, this.maxSize);
    }
  }

  getLogs(count: number, level?: string): AILogEntry[] {
    return this.logs
      .filter((log) => !level || log.level === level)
      .slice(0, count);
  }
}
```

### 성능 특징

| 항목      | Memory Cache | 특징         |
| --------- | ------------ | ------------ |
| 응답 시간 | <1ms         | 🚀 초고속    |
| 네트워크  | 불필요       | 📡 지연 없음 |
| 의존성    | 내장         | 🔧 단순함    |
| 비용      | $0           | 💰 완전 무료 |

상세 구현: [`/src/lib/cache-helper.ts`](/src/lib/cache-helper.ts)

## 🟢 Supabase RLS 보안

데이터베이스 Row Level Security (RLS) 정책으로 데이터 보안을 강화합니다.

- **필수 설정**: 모든 테이블에 RLS 활성화
- **정책 패턴**: 사용자별 격리, 팀 기반 접근, 역할 기반 권한
- **성능 최적화**: RLS 정책 컬럼에 인덱스 필수
- **JWT 보안**: `app_metadata` 사용 (서버 전용)

상세 가이드: [`/docs/supabase-rls-security-guide.md`](/docs/supabase-rls-security-guide.md)

## 🔌 주요 API 엔드포인트

- `/api/servers/*` - 서버 메트릭 CRUD
- `/api/ai/*` - AI 분석 및 예측
- `/api/auth/*` - 인증/인가
- `/api/realtime/*` - 실시간 데이터 스트림
- `/api/admin/*` - 관리자 기능

## 🕐 Time MCP 활용 (필수)

**문서 작성 시 정확한 시간 기록:**

```typescript
// ❌ 잘못된 방법
const now = new Date(); // 서버 타임존에 의존

// ✅ 올바른 방법
const timeInfo = await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
```

**주요 활용처:**

- 문서 헤더 타임스탬프
- CHANGELOG 엔트리
- 이슈 리포트 생성
- 배포 로그 기록
- 서버 메트릭 수집

상세 가이드: [Time MCP 활용 가이드](/docs/time-mcp-usage-guide.md)

## 🔧 MCP 서버 시스템 - 두 가지 독립적인 MCP 아키텍처

### 📍 MCP 시스템 구분

1. **Claude Code MCP (로컬)**: Windows WSL에서 실행되는 11개 개발 도구 서버
2. **GCP VM MCP (클라우드)**: GCP VM에서 실행되는 Google AI 자연어 질의용 서버

### Claude Code MCP 서버 (WSL 로컬) - 11개 활성화 (2025.8.7 기준)

| 서버명                | 상태         | 용도                   | 패키지                                                    |
| --------------------- | ------------ | ---------------------- | --------------------------------------------------------- |
| `filesystem`          | ✅ Connected | 파일 시스템 작업       | `@modelcontextprotocol/server-filesystem@latest`          |
| `memory`              | ✅ Connected | 지식 그래프 관리       | `@modelcontextprotocol/server-memory@latest`              |
| `github`              | ✅ Connected | GitHub 저장소 관리     | `@modelcontextprotocol/server-github@latest`              |
| `supabase`            | ✅ Connected | 데이터베이스 작업      | `@supabase/mcp-server-supabase@latest`                    |
| `tavily-remote`       | ✅ Connected | 웹 검색 및 콘텐츠 추출 | `mcp-remote` (URL 기반)                                   |
| `sequential-thinking` | ✅ Connected | 복잡한 문제 해결       | `@modelcontextprotocol/server-sequential-thinking@latest` |
| `playwright`          | ✅ Connected | 브라우저 자동화        | `@playwright/mcp@latest`                                  |
| `time`                | ✅ Connected | 시간/시간대 변환       | `mcp-server-time` (Python)                                |
| `context7`            | ✅ Connected | 라이브러리 문서 검색   | `@upstash/context7-mcp@latest`                            |
| `serena`              | ✅ Connected | 고급 코드 분석         | `git+https://github.com/oraios/serena` (Python)           |
| `shadcn-ui`           | ✅ Connected | UI 컴포넌트 개발       | `@jpisnice/shadcn-ui-mcp-server@latest`                   |

### GCP VM MCP 서버 (클라우드) - Google AI 연동

| 구분            | 설명                                       |
| --------------- | ------------------------------------------ |
| **위치**        | GCP e2-micro VM (104.154.205.25)           |
| **포트**        | 10000 (MCP), 10001 (AI API)                |
| **용도**        | Google AI API 자연어 질의 처리             |
| **관련 서비스** | AI 백엔드 API, 캐싱 레이어, 스케줄러       |
| **환경변수**    | `GCP_MCP_SERVER_URL`, `GCP_AI_BACKEND_URL` |

### MCP 서버 설치 방법 (최신)

**중요**: Claude Code v1.16.0부터 MCP 설정이 CLI 기반으로 변경되었습니다.

#### 1. 기본 설치 명령어

```bash
# Node.js 기반 서버
claude mcp add <서버명> npx -- -y <패키지명>@latest

# Python 기반 서버
claude mcp add <서버명> uvx -- <패키지명 또는 git URL>

# 환경변수가 필요한 경우
claude mcp add <서버명> npx -e KEY=value -- -y <패키지명>@latest
```

#### 2. 실제 설치 예시

```bash
# filesystem 서버 (작업 디렉토리 지정)
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5

# GitHub 서버 (토큰 필요)
claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx -- -y @modelcontextprotocol/server-github@latest

# Supabase 서버 (프로젝트 ID 필수)
claude mcp add supabase npx -e SUPABASE_URL=https://xxxxx.supabase.co -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... -- -y @supabase/mcp-server-supabase@latest --project-ref=xxxxx

# Serena 서버 (프로젝트 경로 필요)
claude mcp add serena uvx -- --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project /mnt/d/cursor/openmanager-vibe-v5

# Tavily Remote 서버 (API 키 포함 URL)
claude mcp add tavily-remote npx -- -y mcp-remote https://mcp.tavily.com/mcp/?tavilyApiKey=tvly-dev-xxxxxx

# shadcn-ui 서버 (UI/UX 개발)
claude mcp add shadcn-ui npx -- -y @jpisnice/shadcn-ui-mcp-server@latest
# GitHub 토큰으로 API 제한 완화 (선택사항)
claude mcp add shadcn-ui npx -- -y @jpisnice/shadcn-ui-mcp-server@latest --github-api-key ghp_xxxxx
```

### MCP 서버 관리

```bash
# 서버 목록 및 상태 확인
claude mcp list

# 서버 제거
claude mcp remove <서버명>

# 서버 상세 정보
claude mcp get <서버명>

# Claude API 재시작 (설정 반영)
claude api restart
```

### 설정 위치

- **CLI 설정**: `~/.claude.json`의 projects 섹션
- **구 파일 설정**: `.claude/mcp.json` (더 이상 사용하지 않음)

⚠️ **중요**:

- MCP 서버 설정 후 Claude Code 재시작 필요
- 환경변수는 `-e` 옵션으로 전달
- Python 서버는 `uvx` 명령어 사용

### 문제 해결 가이드

#### MCP 서버 연결 실패 시

1. **패키지 버전 확인**: `@latest` 태그 사용 권장
2. **환경변수 확인**: 토큰이나 API 키가 올바른지 확인
3. **Python 서버**: `uvx --version` 확인 (0.8.0+ 필요)
4. **재시작**: `claude api restart` 실행

#### 자주 발생하는 문제

- **"No MCP servers configured"**: CLI 설정으로 마이그레이션 필요
- **"Failed to connect"**: 패키지가 npm에 없거나 권한 문제
- **환경변수 인식 안됨**: `-e` 옵션으로 직접 전달 필요

## 🤖 유용한 Sub Agents - 프로젝트 로컬 설정

복잡한 작업 시 Task 도구로 서브 에이전트 활용:

| 작업 유형             | 추천 Agent                   | 용도                                            |
| --------------------- | ---------------------------- | ----------------------------------------------- |
| 복잡한 작업           | `central-supervisor`         | 마스터 오케스트레이터                           |
| 코드 로직 품질        | `code-review-specialist`     | 함수 복잡도, 버그 패턴, 성능 이슈               |
| 프로젝트 규칙         | `quality-control-checker`    | CLAUDE.md 준수, 파일 크기, SOLID                |
| 구조 설계             | `structure-refactor-agent`   | 중복 검출, 모듈 구조, 리팩토링                  |
| 보안 검사             | `security-auditor`           | 포트폴리오 수준 보안 검사                       |
| DB 최적화             | `database-administrator`     | Supabase PostgreSQL 전문 관리                   |
| 성능 개선             | `ux-performance-optimizer`   | Core Web Vitals                                 |
| 테스트                | `test-automation-specialist` | 테스트 작성/수정                                |
| 개발 환경             | `dev-environment-manager`    | tmux, 테스트 서버, 빌드 관리                    |
| GCP VM 관리           | `gcp-vm-specialist`          | GCP VM 통합 백엔드 (MCP + AI API + 서비스) 관리 |
| AI 시스템             | `ai-systems-engineer`        | AI 어시스턴트 개발                              |
| 문서 관리             | `documentation-manager`      | 문서 작성, 구조 관리, JBGE 원칙                 |
| 디버깅                | `debugger-specialist`        | 오류 분석, 근본 원인 파악                       |
| 플랫폼 전문 분석      | `vercel-platform-specialist` | Vercel 아키텍처, 성능 최적화                    |
| MCP 관리              | `mcp-server-admin`           | MCP 에러 감지 및 자동 복구                      |
| Gemini 개발 파트너    | `gemini-cli-collaborator`    | 전체 코드 생성/리팩토링, 1M 토큰 활용           |
| Codex 알고리즘 전문가 | `codex-cli-partner`          | 고급 알고리즘, 성능 최적화, GPT-5               |
| Git/CI/CD             | `git-cicd-specialist`        | Git 워크플로우, CI/CD 자동화                    |

### 📁 서브 에이전트 설정 위치

- **프로젝트 로컬 설정**: `.claude/agents/` (18개 에이전트 .md 파일)
- **MCP 서버 설정**: `~/.claude.json` (CLI로 관리)
- **매핑 가이드**: `/docs/sub-agents-mcp-mapping-guide.md`
- **글로벌 설정과의 관계**: 프로젝트별로 독립적으로 관리됨

### 🔍 MCP 서버 vs 서브 에이전트 차이점

#### MCP 서버 (Model Context Protocol)

- **정의**: 외부 도구 및 데이터 소스와 연결하는 프로토콜 서버
- **관리**: `claude mcp add/remove/list` CLI 명령어로 관리
- **위치**: `~/.claude.json`에 전역 설정
- **예시**: filesystem, github, supabase, time 등 (11개 운영)
- **역할**: 실제 도구 기능 제공 (파일 읽기, DB 쿼리, 웹 검색 등)

#### 서브 에이전트 (Sub Agents)

- **정의**: 특정 작업을 전문적으로 수행하는 AI 역할 정의
- **관리**: `.claude/agents/*.md` 파일로 프로젝트별 관리
- **위치**: 프로젝트 로컬 `.claude/agents/` 디렉토리
- **예시**: gcp-vm-specialist, database-administrator 등 (17개 운영)
- **역할**: Task 도구로 호출되어 전문 작업 수행

### 🚀 서브 에이전트 역할 분리 원칙

**중요**: 각 에이전트는 명확한 전문 영역만 담당합니다.

#### 코드 품질 전문가 그룹 (명확히 구분된 역할)

- **code-review-specialist**: 함수/메서드 레벨 분석 - 복잡도 계산, 버그 패턴, 성능 이슈, 타입 안전성
- **quality-control-checker**: 프로젝트 규칙 감시 - CLAUDE.md 준수, 파일 크기(500-1500줄), SOLID 원칙, 보안 정책
- **structure-refactor-agent**: 구조 설계 전문 - 중복 코드 검출/통합, 모듈 의존성, 안전한 리팩토링

#### 기타 전문가 그룹

- **central-supervisor**: 오케스트레이션만 - 작업 분배, 모니터링, 결과 통합
- **vercel-platform-specialist**: Vercel 플랫폼 아키텍처 전문 분석 - 배포 최적화, 성능 엔지니어링, 인프라 설계
- **debugger-specialist**: 디버깅만 - 오류 분석, 가설 수립, 최소 수정
- **documentation-manager**: 문서 관리 - 작성, 구조 관리, JBGE 원칙 (구 doc-structure-guardian + doc-writer-researcher 통합)
- **test-automation-specialist**: 테스트 자동화 - 테스트 작성, 수정, TDD 지원, 커버리지 관리
- **security-auditor**: 보안만 - 취약점 탐지, OWASP, 인증/인가

#### 협업 프로토콜

1. **순차 실행**: structure-refactor-agent → code-review-specialist → quality-control-checker
2. **병렬 가능**: code-review-specialist + structure-refactor-agent (독립적 분석)
3. **Memory MCP**: 분석 결과 공유로 중복 작업 방지

```typescript
// 권장 방식 - 작업 목표만 제시
Task({
  subagent_type: 'database-administrator',
  description: 'Supabase DB 최적화',
  prompt: 'Supabase PostgreSQL 쿼리 성능 분석 및 인덱스 최적화를 수행해주세요.',
});

// 병렬 처리 - 독립적인 작업은 동시 실행
Task({
  subagent_type: 'dev-environment-manager',
  prompt: '개발 환경 설정 및 테스트 서버 최적화',
});
Task({
  subagent_type: 'ux-performance-optimizer',
  prompt: '프론트엔드 성능 개선',
});
Task({
  subagent_type: 'database-administrator',
  prompt: 'Supabase RLS 정책 검토 및 pgvector 인덱스 최적화',
});
```

### 🚀 서브 에이전트 활용 패턴

- **협업 패턴**: central-supervisor가 작업을 분배하고 조율
- **병렬 처리**: 독립적인 작업은 동시 실행으로 30-40% 시간 단축
- **Memory MCP**: 비동기 정보 공유로 협업 효율 증대
- **서브에이전트 상세**: `.claude/agents/` 디렉토리 참조

## 📋 Claude Code 프로젝트 설정 구조

### 설정 파일 우선순위

1. `.claude/settings.local.json` (개인 로컬 설정)
2. `.claude/settings.json` (팀 공유 설정)
3. `~/.claude/settings.json` (사용자 전역 설정)

### MCP 서버 관리

- **MCP 설정**: CLI 명령어 (`claude mcp add/remove/list`)로 관리
- **서브에이전트**: `.claude/agents/*.md` 파일로 관리
- **독립성**: 각 프로젝트마다 독립적인 설정 유지

## ⚠️ 주의사항 및 트러블슈팅

### 환경 설정

1. **환경 변수**: `.env.local` 필수 (env.local.template 참조)
2. **무료 티어 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 섹션 참조
3. **Git Hooks**: Husky 자동 실행 (pre-commit, pre-push)

### 자주 발생하는 문제

- **MCP 연결 오류**: `bash scripts/mcp/reset.sh` 실행
- **타입 에러**: `npm run type-check` → `npm run lint:fix`
- **OAuth 실패**: `.env.local`의 GitHub 키 확인
- **빌드 실패**: Node.js 버전 확인 (v22.15.1 필수)

### 파일 읽기/쓰기 에러

```
Error: File has not been read yet. Read it first before writing to it
```

- **원인**: Claude Code는 기존 파일 수정 시 반드시 Read 도구 먼저 사용
- **해결**: Write/Edit 전에 항상 Read 도구 사용
- **주의**: Sub agents도 동일한 규칙 적용

### 메모리 관리

```bash
# 개발 환경
--max-old-space-size=8192  # 8GB

# 프로덕션
--max-old-space-size=4096  # 4GB
```

## 🚀 배포 및 무료 티어 전략

### Vercel (Frontend)

- **공식 문서**: https://vercel.com/docs
- **명령어**: `vercel --prod` (main 브랜치 자동 배포)
- **환경 변수**: Vercel 대시보드에서 설정
- **무료 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 참조

### GCP Functions (Backend API)

- **공식 문서**: https://cloud.google.com/docs
- **Python 함수**: `gcp-functions/` 디렉토리
- **배포**: `scripts/deployment/deploy-all.sh`
- **무료 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 참조

### 무료 티어 최적화 전략

- **캐싱**: 메모리 기반 캐시로 초고속 응답
- **Edge Runtime**: Vercel Edge로 서버 부하 감소
- **요청 배치**: 여러 요청을 하나로 묶어 처리
- **자동 스케일링**: 트래픽에 따라 자동 조절

### 무료 티어 환경변수 설정

환경변수 템플릿은 `.env.local.template` 파일을 참조하세요.

**필수 환경변수 그룹**:

- Next.js & Vercel 설정
- Supabase (PostgreSQL + Auth)
- GitHub OAuth
- GCP Functions
- Google AI (Gemini API)

**보안 원칙**:

- 절대 하드코딩 금지
- 서버 전용 키는 클라이언트에 노출 금지
- `NEXT_PUBLIC_` 접두사는 공개 가능한 키만 사용

상세 설정: [`/docs/environment-variables-guide.md`](/docs/environment-variables-guide.md)

## 💰 Claude + Gemini + Codex 3-way AI 협업 전략

Claude Code, Gemini CLI, Codex CLI 세 AI 개발 도구의 최적 협업 체계:

| 작업 유형     | Claude Code      | Gemini CLI     | Codex CLI        | 최적 활용 전략                             |
| ------------- | ---------------- | -------------- | ---------------- | ------------------------------------------ |
| 알고리즘 설계 | 기본 알고리즘    | 대규모 처리    | ✅ 고급 최적화   | 복잡한 알고리즘은 Codex (GPT-5)            |
| 코드 생성     | ✅ 포커스 작업   | ✅ 대규모 생성 | ✅ 정교한 구현   | 규모에 따라 선택, 복잡도는 Codex           |
| 리팩토링      | ✅ 부분 수정     | ✅ 전체 재구성 | 성능 최적화      | 전체는 Gemini(1M), 최적화는 Codex          |
| 성능 최적화   | 기본 개선        | 전체 분석      | ✅ 심층 최적화   | Codex로 O(n²)→O(n log n) 개선              |
| 시스템 설계   | ✅ 프로젝트 통합 | 대규모 구현    | ✅ 아키텍처 전문 | Codex 설계 → Gemini 구현 → Claude 통합     |
| 디버깅        | ✅ 특정 이슈     | ✅ 전체 추적   | 복잡한 분석      | 단순은 Claude, 전체는 Gemini, 복잡은 Codex |
| 테스트 작성   | ✅ 단위 테스트   | ✅ 통합 테스트 | 성능 벤치마크    | 기능별 분담, 성능 테스트는 Codex           |
| 보안 구현     | 기본 보안        | 전체 감사      | ✅ 암호화 구현   | 암호화/인증은 Codex 전문                   |
| AI/ML 구현    | 간단한 모델      | 대규모 처리    | ✅ 신경망 설계   | ML 알고리즘은 Codex가 전문                 |

### 🤖 3-way AI 도구 활용 방법

#### 1. 대규모 개발 작업 (Gemini 주도)

```bash
# 전체 시스템 구현
gemini "Implement complete authentication system with JWT, OAuth, and 2FA"

# 프로젝트 전체 리팩토링
find . -name "*.ts" | xargs cat | gemini "Convert entire codebase from Redux to Zustand"

# 대규모 마이그레이션
gemini "Migrate this Next.js 13 app to Next.js 15 with app router"
```

#### 2. 페어 프로그래밍 (대화형 개발)

```bash
# 실시간 협업 개발
gemini  # 대화형 모드 시작
> "Let's build a real-time dashboard together"
> "Now add WebSocket for live updates"
> "Implement caching and optimize performance"
```

#### 3. Codex CLI 활용 방법 (고급 알고리즘 전문)

```bash
# 알고리즘 최적화
codex "Optimize this sorting algorithm from O(n²) to O(n log n) with cache-friendly design"

# 시스템 아키텍처 설계
codex "Design scalable microservices architecture with CQRS and event sourcing"

# 성능 분석 및 개선
cat src/services/*.ts | codex "Analyze performance bottlenecks and implement optimizations"

# 보안 구현
codex "Implement end-to-end encryption with AES-256-GCM and key management"
```

#### 4. Claude + Gemini + Codex 3-way 협업 예시

```bash
# 복잡한 시스템 구현 (최적 분담)
# 1단계: Codex로 아키텍처 설계 및 알고리즘 최적화
codex "Design distributed rate limiting algorithm with sliding window and Redis"

# 2단계: Gemini로 전체 시스템 구현 (1M 토큰 활용)
gemini "Implement the rate limiting system across all microservices"

# 3단계: Claude로 프로젝트 통합 및 MCP 연동
"rate limiting을 프로젝트에 통합하고 monitoring 추가해줘"

# 성능 최적화 파이프라인
# 1. Codex: 알고리즘 분석 및 최적화 전략
codex "Analyze all O(n²) or worse algorithms and provide optimization strategies"

# 2. Gemini: 전체 코드베이스 리팩토링
gemini "Refactor entire codebase with the optimizations from Codex"

# 3. Claude: 테스트 및 배포 관리
"최적화된 코드 테스트하고 배포 준비해줘"
```

### 💡 AI 도구 선택 가이드

- **Claude Code**: 프로젝트 인식, MCP 서버 연동, 빠른 반복 작업
- **Gemini CLI**: 1M 토큰 대규모 작업, 전체 프로젝트 리팩토링 (무료)
- **Codex CLI**: 고급 알고리즘, 성능 최적화, 시스템 설계 (Plus 구독)

### 📚 AI CLI 도구 상세 가이드

#### Gemini CLI

- **설치 및 설정**: `/docs/gemini-cli-wsl-setup-guide.md`
- **무료 티어**: 1,000회/일, 60회/분 (Gemini 2.5 Pro)

#### Codex CLI

- **설치**: WSL 터미널에서 ChatGPT Plus 구독 후 설치
- **명령어**: `codex` (WSL 터미널)
- **엔진**: GPT-5 (2025년 8월 출시, 94.6% AIME 정확도)

## 📚 추가 문서

### 프로젝트 문서

- 상세 가이드: `/docs` 폴더
- API 문서: `/docs/api`
- Gemini 협업: `GEMINI.md`
- **MCP 서버 완전 가이드**: `/docs/mcp-servers-complete-guide.md`
- 서브에이전트 정의: `.claude/agents/`

### aitmpl.com 템플릿 참조 문서

- **메인 참조 가이드**: `/docs/aitmpl-reference-guide.md` - aitmpl.com 시스템 전체 분석
- **비교 분석**: `/docs/aitmpl-comparison-analysis.md` - 우리 프로젝트와 상세 비교
- **활용 패턴**: `/docs/aitmpl-usage-patterns.md` - 실전 활용 방법 및 체크리스트

### Claude Code 공식 문서

- [Claude Code 개요](https://docs.anthropic.com/en/docs/claude-code/overview)
- [MCP (Model Context Protocol)](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [서브 에이전트](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화

📊 **프로젝트 현황** (2025.8.7 기준):

- 코드 품질: 475개 → 400개 문제 (15.8% 개선), Critical 에러 99% 해결
- CI/CD 성능: **70% 속도 향상**, Push 성공률 99%, GitHub Actions 항상 성공
- 무료 티어 사용률: Vercel 30%, GCP 15%, Supabase 3%
- GCP Functions: 3개 배포 완료, Python 3.11 최적화
- 서브에이전트: 17개 최적화 (gcp-vm-specialist, dev-environment-manager 추가)
- MCP 서버: Claude Code용 11개 (WSL) + GCP VM MCP (Google AI용) 안정 운영
- Gemini CLI 통합: WSL 터미널 직접 대화 지원, 1M 토큰 활용
