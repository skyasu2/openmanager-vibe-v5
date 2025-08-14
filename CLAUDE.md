# CLAUDE.md

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.anthropic.com/en/docs/claude-code)

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼
- **아키텍처**: Next.js 15 + TypeScript (strict) + Vercel Edge + Supabase
- **무료 티어**: 100% 무료로 운영 (Vercel 100GB/월, GCP 2M req/월, Supabase 500MB)
- **성능**: 152ms 응답, 99.95% 가동률

## 🚀 빠른 시작

```bash
# 개발
npm run dev              # localhost:3000
npm run build            # 프로덕션 빌드
npm run test:quick       # 빠른 테스트 (22ms)

# 검증
npm run validate:all     # 린트 + 타입 + 테스트
npm run git:status       # Git 상태 확인

# Claude 사용량
npx ccusage blocks --live    # 실시간 모니터링
```

## 💡 개발 철학

### 1. 🎨 타입 우선 개발 (Type-First)
**타입 정의 → 구현 → 리팩토링** 순서로 개발

```typescript
// 1️⃣ 타입 먼저 정의
interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  metadata?: { lastLogin: Date };
}

// 2️⃣ 타입 기반 구현
const updateUser = (id: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  // IDE 자동완성 100% 활용
  return db.users.update(id, data);
};
```

### 2. 🧪 TDD (Test-Driven Development)
**Red → Green → Refactor** 사이클 준수

```typescript
// @tdd-red @created-date: 2025-01-14
it('should calculate total with tax', () => {
  expect(calculateTotalWithTax(100, 0.1)).toBe(110); // RED: 함수 미구현
});

// GREEN: 구현
const calculateTotalWithTax = (amount: number, tax: number) => amount * (1 + tax);

// REFACTOR: 개선
const calculateTotalWithTax = (amount: number, taxRate: number): number => {
  if (taxRate < 0) throw new Error('Tax rate cannot be negative');
  return amount * (1 + taxRate);
};
```

### 3. 📝 커밋 컨벤션 (이모지 필수)

| 타입 | 이모지 | 설명 | 예시 |
|------|--------|------|------|
| feat | ✨ | 새 기능 | `✨ feat: 사용자 인증 추가` |
| fix | 🐛 | 버그 수정 | `🐛 fix: 로그인 오류 해결` |
| refactor | ♻️ | 리팩토링 | `♻️ refactor: API 구조 개선` |
| test | 🧪 | 테스트 | `🧪 test: 인증 테스트 추가` |
| docs | 📚 | 문서 | `📚 docs: API 문서 업데이트` |
| perf | ⚡ | 성능 | `⚡ perf: 쿼리 최적화` |

## 📐 핵심 규칙

1. **TypeScript**: `any` 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: 커버리지 70%+, TDD 적용
4. **문서**: 루트 6개 제한 (README, CHANGELOG, CLAUDE, GEMINI, QWEN)
5. **커밋**: 이모지 + 간결한 메시지

## 🏗️ Next.js 15 특징

### App Router + React 19
```typescript
// app/api/servers/route.ts
export async function GET() {
  // 기본 uncached (변경됨!)
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60' }
  });
}

// app/layout.tsx - async component
export default async function RootLayout({ children }) {
  const data = await fetch('...'); // 서버 컴포넌트에서 직접 fetch
  return <html>{children}</html>;
}
```

### Turbopack (기본 번들러)
```json
{
  "scripts": {
    "dev": "next dev --turbo",  // Turbopack 자동 사용
    "build": "next build"        // 프로덕션도 Turbopack
  }
}
```

## 🔧 MCP 서버 (11개)

### 필수 MCP 서버
```bash
# 설치 (Windows)
./scripts/install-all-mcp-servers.ps1

# 환경변수 설정 (.env.local)
TAVILY_API_KEY=tvly-...
SUPABASE_ACCESS_TOKEN=sbp_...
```

### 주요 MCP 활용 예제

#### 1. 파일 시스템 + GitHub 연동
```typescript
// 파일 검색 → GitHub 커밋
await mcp__filesystem__search_files({ pattern: "*.test.ts" });
await mcp__github__create_pull_request({
  owner: "user",
  repo: "project",
  title: "✨ feat: 테스트 추가"
});
```

#### 2. Supabase DB 관리
```typescript
// RLS 정책 적용 및 쿼리 실행
await mcp__supabase__execute_sql({
  project_id: "xxx",
  query: "CREATE POLICY user_isolation ON users..."
});
```

#### 3. Tavily 웹 검색 + 크롤링
```typescript
// 최신 문서 검색 및 분석
const docs = await mcp__tavily-mcp__tavily-search({
  query: "Next.js 15 features",
  time_range: "week",
  search_depth: "advanced"
});
```

## 🤖 서브 에이전트 활용

### 효율적 작업 분배
```typescript
// 복잡한 작업은 central-supervisor가 조율
await Task({
  subagent_type: 'central-supervisor',
  prompt: '전체 리팩토링 작업 조율'
});

// 병렬 작업으로 속도 향상
await Promise.all([
  Task({ subagent_type: 'test-automation-specialist', prompt: '테스트 작성' }),
  Task({ subagent_type: 'ux-performance-optimizer', prompt: '성능 최적화' })
]);
```

### 주요 전문가 에이전트
- **database-administrator**: Supabase PostgreSQL 최적화
- **debugger-specialist**: 5단계 체계적 디버깅
- **test-automation-specialist**: 테스트 자동화 (TDD 지원)
- **security-auditor**: 포트폴리오 수준 보안 검사

## 📊 프로젝트 구조

```
openmanager-vibe-v5/
├── src/
│   ├── app/         # Next.js 15 App Router
│   ├── services/    # 비즈니스 로직
│   └── components/  # React 컴포넌트
├── docs/            # 상세 문서
├── scripts/         # 자동화 스크립트
└── .claude/         # Claude Code 설정
    ├── agents/      # 서브에이전트 정의
    └── commands/    # 커스텀 명령어
```

## 🚀 CI/CD 파이프라인

### Fast Track 배포 (2-7분)
```bash
# 긴급 배포
git commit -m "🚑 hotfix: 긴급 수정 [skip ci]"

# 검사 스킵
HUSKY=0 git commit -m "⚡ perf: 성능 개선"
```

### GitHub Actions 최적화
- 필수 검증만 실패 처리
- TypeScript 에러는 경고만
- 병렬 처리로 70% 속도 향상

## 🔐 환경 설정

### 필수 환경변수 (.env.local)
```bash
# Next.js
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# MCP 서버
TAVILY_API_KEY=tvly-...
SUPABASE_ACCESS_TOKEN=sbp_...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## 📚 추가 문서

### 핵심 가이드
- [타입 우선 개발 상세](/docs/claude/type-first-development-guide.md)
- [TDD 실전 가이드](/docs/claude/tdd-practical-guide.md)
- [MCP 서버 완전 가이드](/docs/claude/mcp-servers-complete-guide.md)
- [서브에이전트 종합 가이드](/docs/claude/sub-agents-comprehensive-guide.md)

### 기술 문서
- [Next.js 15 마이그레이션](/docs/claude/nextjs15-migration-guide.md)
- [Supabase RLS 보안](/docs/claude/supabase-rls-security-guide.md)
- [성능 최적화 전략](/docs/claude/performance-optimization-guide.md)

### 운영 문서
- [무료 티어 최적화](/docs/claude/free-tier-optimization-guide.md)
- [모니터링 대시보드](/docs/claude/monitoring-dashboard-guide.md)
- [트러블슈팅 가이드](/docs/claude/troubleshooting-guide.md)

## ⚡ Custom Commands

### 프로젝트 전용 명령어
```bash
# .claude/commands/에 정의
/commit         # 스마트 커밋 생성
/pr            # Pull Request 생성
/test-tdd      # TDD 테스트 생성
/refactor      # 코드 리팩토링
/security      # 보안 검사
```

## 🎯 현재 상태 (2025.01.14)

- **코드 품질**: TypeScript 382개 → 목표 0개
- **테스트**: 54/55 통과 (98.2%), 6ms 속도
- **CI/CD**: Push 성공률 99%, 평균 5분
- **MCP**: 11개 서버 100% 정상
- **무료 티어**: Vercel 30%, GCP 15%, Supabase 3%

---

💡 **핵심 원칙**: Type-First + TDD + 이모지 커밋 + MCP 활용

📖 **상세 내용**: `/docs` 폴더 참조