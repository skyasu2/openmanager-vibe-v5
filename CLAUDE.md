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

# Git 상태 확인
npm run git:status       # Git 푸시 상태 상세 점검
npm run git:check        # Git 동기화 상태 확인

# Fast Track 배포 (2025 표준)
git commit -m "feat: 기능 추가"           # 표준 배포 (8-10분)
git commit -m "feat: 기능 추가 [build-skip]" # 빌드 체크 스킵 (5-7분)
git commit -m "fix: 긴급 수정 [skip ci]"   # 완전 CI 스킵 (2-3분)

# 백그라운드 명령어 (Claude Code v1.0.72+)
# Bash 도구의 run_in_background: true 파라미터 사용
# BashOutput 도구로 백그라운드 작업 모니터링 가능
```

### 🔄 백그라운드 명령어 기능 (v1.0.72+)

Claude Code는 백그라운드에서 명령어를 실행할 수 있는 기능을 제공합니다:

```bash
# 백그라운드 실행: run_in_background: true
# 장시간 실행되는 작업을 백그라운드에서 처리
# 여러 작업 동시 실행 가능 (bash_1, bash_2, bash_3...)
# BashOutput 도구로 진행 상황 모니터링
```

**활용 예시:**
- 개발 서버 백그라운드 실행 (`npm run dev`)
- 빌드 프로세스 병렬 처리
- 테스트 실행과 동시에 다른 작업 수행
- 로그 모니터링 및 실시간 작업

### 📊 상태표시줄 기능 (Beta)

Claude Code 상태표시줄에 실시간 사용량 통계를 표시할 수 있습니다:

```json
// ~/.claude/settings.json에 추가
{
  "statusLine": {
    "type": "command",
    "command": "bun x ccusage statusline",
    "padding": 0
  }
}
```

**표시 정보:**
- 🤖 활성 모델 (Opus, Sonnet 등)
- 💰 세션/일일/블록별 비용
- ⏱️ 남은 블록 시간 (5시간 단위)
- 🔥 토큰 소모율 (burn rate)

**예시 출력:**
```
🤖 Opus | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr
```

**Burn Rate 색상:**
- 🟢 정상 (< 2,000 토큰/분)
- 🟡 보통 (2,000-5,000 토큰/분) 
- 🔴 높음 (> 5,000 토큰/분)

### 🛡️ 자동 보안 점검 (v1.0.72+)

Claude Code 내장 보안 검토 기능으로 SQLi, 인증, 데이터 처리 취약점을 자동 탐지:

```bash
# 프로젝트 전체 보안 점검
claude /security-review

# API 라우트 집중 검사
claude /security-review --path src/app/api

# 종합 보안 검사 (NPM + 코드)
npm run security:audit
```

**자동 탐지 항목:**
- SQL Injection, XSS, CSRF 취약점
- 하드코딩된 API 키/시크릿
- 인증/인가 누락
- 취약한 암호화 패턴

**GitHub Action 통합**: PR마다 자동 보안 검토 실행

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

## 📋 타입 안전성 유틸리티

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

## 🔧 MCP 서버 시스템

### 📍 현재 활성 MCP 서버 (11개)

**2025년 8월 10일 기준**: 모든 서버 정상 연결 ✅

| 서버명 | 용도 | 타입 |
|--------|------|------|
| `filesystem` | 파일 시스템 작업 | Node.js |
| `memory` | 지식 그래프 관리 | Node.js |
| `github` | GitHub 저장소 관리 | Node.js |
| `supabase` | PostgreSQL 데이터베이스 ✅ **공식 버전** | Node.js |
| `tavily-remote` | 웹 검색 및 콘텐츠 추출 | Remote |
| `sequential-thinking` | 복잡한 문제 해결 | Node.js |
| `playwright` | 브라우저 자동화 | Node.js |
| `time` | 시간/시간대 변환 | Python |
| `context7` | 라이브러리 문서 검색 | Node.js |
| `serena` | 고급 코드 분석 (LSP) | Python |
| `shadcn-ui` | UI 컴포넌트 개발 | Node.js |

### 빠른 시작

```bash
# MCP 서버 상태 확인
claude mcp list

# 서버 추가/제거
claude mcp add <서버명> <명령어>
claude mcp remove <서버명>

# API 재시작
claude api restart
```

### 📚 상세 가이드

**통합 MCP 개발 가이드**: [`/docs/mcp-development-guide-2025.md`](/docs/mcp-development-guide-2025.md)
**Serena MCP 설정 가이드**: [`/docs/serena-mcp-setup-guide-2025.md`](/docs/serena-mcp-setup-guide-2025.md) ✨ NEW

이 문서에서 다루는 내용:
- 11개 MCP 서버별 상세 설치 및 사용법
- Serena MCP 고급 활용법 (코드 분석, 심볼 검색, 리팩토링)
- 환경변수 관리 및 보안
- 문제 해결 가이드
- Best Practices 및 성능 최적화

### 주요 특징

- **CLI 기반 관리**: v1.16.0부터 `claude mcp` 명령어로 통합 관리
- **프로젝트별 독립 설정**: 각 프로젝트마다 독립적인 MCP 구성
- **다양한 통합**: 파일 시스템, DB, 웹 검색, 브라우저 자동화, AI 분석 등

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
- **npm-global config mismatch**: [`/docs/npm-global-config-guide.md`](/docs/npm-global-config-guide.md) 참조

### 알려진 이슈 (Claude Code v1.0.72)

#### Config Mismatch 경고

```
⚠️ Config mismatch: running npm-global but config says unknown
```

- **영향**: 기능에 영향 없음 (cosmetic issue only)
- **원인**: Claude Code의 알려진 버그 ([#3915](https://github.com/anthropics/claude-code/issues/3915), [#4977](https://github.com/anthropics/claude-code/issues/4977))
- **대응**: 무시해도 안전함. 향후 버전에서 수정 예정
- **확인**: `bash scripts/check-claude-environment.sh` 실행하여 환경 검증

### 파일 읽기/쓰기 에러

```
Error: File has not been read yet. Read it first before writing to it
```

- **원인**: Claude Code는 기존 파일 수정 시 반드시 Read 도구 먼저 사용
- **해결**: Write/Edit 전에 항상 Read 도구 사용
- **주의**: Sub agents도 동일한 규칙 적용

### WSL 최적화 (Windows 사용자)

**성능 최적화 필수사항** (Microsoft 공식 문서 기반):

- **파일 시스템**: `/mnt/c/`는 WSL 네이티브 경로보다 30-50배 느림
  - ✅ 권장: WSL 파일시스템 사용 (`~/projects/`)
  - ❌ 비권장: Windows 경로 (`/mnt/c/`, `/mnt/d/`)
- **Node.js**: Linux 네이티브 버전 사용 (nvm 추천)
  - `which npm`이 `/usr/` 또는 `~/.nvm/`로 시작해야 함
  - `/mnt/c/Program Files/nodejs` 경로 사용 금지
- **WSL2 설정**: `~/.wslconfig` 파일로 성능 튜닝
  ```ini
  [wsl2]
  memory=8GB
  processors=4
  networkingMode=mirrored  # Windows 11 22H2+
  ```

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

Claude Code가 메인 개발을 주도하고, 사용자 요청 시 Gemini/Codex를 병렬 활용하는 유연한 협업 체계:

| 작업 접근법     | Claude Code (메인)   | Gemini CLI (요청 시) | Codex CLI (요청 시)  |
| -------------- | -------------------- | ------------------- | ------------------- |
| **기본 전략**   | ✅ 모든 개발 주도     | 사용자 요청 시만     | 사용자 요청 시만     |
| **활용 시점**   | 항상 활성화          | "Gemini로" 명시 시   | "Codex로" 명시 시    |
| **병렬 작업**   | 조율 및 통합 담당     | 독립적 기능 개발     | 독립적 기능 개발     |
| **주요 역할**   | 프로젝트 전체 관리    | 완전한 개발 도구     | 완전한 개발 도구     |
| **일반 개발**   | ✅ 모든 작업 가능     | ✅ 모든 작업 가능    | ✅ 모든 작업 가능    |
| **복잡한 작업** | ✅ 직접 처리 가능     | ✅ 병렬 개발 가능    | ✅ 병렬 개발 가능    |
| **비용 효율**   | $200/월 (메인)       | $0 (무료, Google)    | $20/월 (ChatGPT+)   |
| **토큰 제한**   | 5시간 블록           | 1000회/일, 60회/분   | 80메시지/3시간      |

### 🤖 AI 도구 활용 방법 (서브 에이전트 통한 체계적 활용)

#### 1. Claude Code 메인 개발 (기본)

```bash
# Claude Code가 모든 개발 작업 주도
# - 시스템 설계, 구현, 테스트, 배포까지 전체 워크플로우 관리
# - MCP 서버 11개 활용하여 프로젝트 통합 관리
```

#### 2. 제3자 시선이 필요할 때 (서브 에이전트 자동 활용)

```typescript
// 복잡한 구현 후 자동으로 검증
await Task({
  subagent_type: 'gemini-cli-collaborator',
  description: '구현 검증',
  prompt: '코드 품질 및 아키텍처 개선점 제안'
});

await Task({
  subagent_type: 'codex-cli-partner',
  description: '독립적 검토',
  prompt: '다른 관점에서 코드 검토 및 개선 방안'
});
```

#### 3. 병렬 작업이 필요할 때 (서브 에이전트 동시 실행)

```typescript
// 대규모 작업 시 자동 병렬 처리
Promise.all([
  Task({ subagent_type: 'gemini-cli-collaborator', ... }),  // 독립 모듈 개발
  Task({ subagent_type: 'codex-cli-partner', ... }),        // 다른 모듈 개발
  claude.implement()                                         // 메인 구현
]);
// 결과: 2-3x 속도 향상
```

#### 4. 사용자 직접 요청 시 (서브 에이전트 즉시 활용)

```bash
# 사용자: "Gemini로 전체 코드베이스 리팩토링 해줘"
# → gemini-cli-collaborator 서브 에이전트가 처리

# 사용자: "Codex로 이 알고리즘 최적화해줘"
# → codex-cli-partner 서브 에이전트가 처리

# 사용자: "3개 AI 모두 활용해서 성능 개선해줘"
# → 3개 서브 에이전트 병렬 실행
```

### 💡 AI 도구 활용 원칙

- **Claude Code**: 모든 개발의 메인 도구, 항상 활성화, 프로젝트 전체 관리
- **Gemini CLI**: 사용자가 "Gemini로" 명시적 요청 시만 활용 (완전한 개발 도구)
- **Codex CLI**: 사용자가 "Codex로" 명시적 요청 시만 활용 (완전한 개발 도구)

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
- MCP 서버: **Claude Code용 11개 모두 정상 연결** ✅ (Serena 포함)
- Gemini CLI 통합: WSL 터미널 직접 대화 지원, 1M 토큰 활용
