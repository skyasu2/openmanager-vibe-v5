# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.80.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.8 (Vercel OAuth 개선) + Multi-AI 협업
**스택**: Next.js 15, React 18.3, TypeScript strict, Vercel + Supabase

---

## 🚀 빠른 시작

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # 린트+타입+테스트

# 테스트 (Vercel 중심)
npm run test:vercel:e2e     # Vercel E2E (권장)
npm run test:super-fast     # 11초 빠른 테스트

# 배포
git push                    # Vercel 자동 배포

# Claude Code v2.0
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석
npx ccstatusline@latest     # Status Line 설정
Esc Esc                     # 빠른 복원
```

---

## 💡 핵심 원칙

1. **Type-First**: 타입 정의 → 구현 → 리팩토링
2. **any 금지**: TypeScript strict mode 100%
3. **Vercel 중심**: 실제 환경 우선 테스트
4. **MCP 우선**: 82% 토큰 절약 (Read → Serena, WebSearch → Context7)
5. **Side-Effect First**: 테스트/문서/의존성 동시 수정

---

## 🤖 Multi-AI 사용 (2025-10-06 최적화)

### MCP 도구 우선 (최우선 권장) ⭐

```typescript
// 개별 AI 쿼리 (MCP v3.0)
mcp__multi-ai__queryCodex({ query: "버그 분석 및 실무적 해결책" })
mcp__multi-ai__queryGemini({ query: "SOLID 원칙 검토 및 아키텍처 분석" })
mcp__multi-ai__queryQwen({ query: "성능 최적화 및 병목점 분석", planMode: true })

// 히스토리 조회
mcp__multi-ai__getBasicHistory({ limit: 10 })
```

**참고**: Multi-AI Verification Specialist 서브에이전트가 3-AI 교차검증을 자동 수행합니다.

**타임아웃 (v3.0)**:
- Codex: 60s/90s/**180s** (complex)
- Gemini: **300s** (5분)
- Qwen: **120s** (normal) / **300s** (plan mode)
- MCP 전체: **360s** (6분)

### Bash CLI 대안 (MCP 불가 시만)

```bash
# Wrapper 스크립트 (타임아웃 보호)
./scripts/ai-subagents/codex-wrapper.sh
./scripts/ai-subagents/gemini-wrapper.sh
./scripts/ai-subagents/qwen-wrapper.sh -p  # Plan Mode
```

---

## 🎭 서브에이전트 활용 (12개 전문가)

### 호출 방법
```bash
Task [에이전트명] "[작업 요청]"
```

### 12개 전문 서브에이전트
- **code-review-specialist**: 코드 품질 검토, TypeScript strict 모드
- **database-administrator**: PostgreSQL 관리, RLS 정책, 쿼리 최적화
- **debugger-specialist**: 근본 원인 분석, 버그 해결
- **dev-environment-manager**: WSL 최적화, Node.js 버전 관리
- **documentation-manager**: AI 친화적 문서 관리 (JBGE 원칙)
- **gcp-cloud-functions-specialist**: GCP Cloud Functions 배포 및 최적화
- **multi-ai-verification-specialist**: 3-AI 교차검증 (Codex+Gemini+Qwen)
- **security-specialist**: 종합 보안 감사, 취약점 스캔
- **structure-refactor-specialist**: 아키텍처 리팩토링, 모듈화
- **test-automation-specialist**: Vitest + Playwright E2E 테스트
- **ui-ux-specialist**: UI/UX 개선, 디자인 시스템 구축
- **vercel-platform-specialist**: Vercel 플랫폼 완전 관리

### 사용 예시
```bash
# 코드 리뷰
Task code-review-specialist "LoginClient.tsx 타입 안전성 검토"

# 데이터베이스 최적화
Task database-administrator "users 테이블 RLS 정책 분석 및 개선"

# 아키텍처 검토
Task structure-refactor-specialist "src/components 구조 개선 방안 제시"
```

**참고**: 상세 정보는 `.claude/agents/` 및 `docs/ai/subagents-complete-guide.md` 참조

---

## 📐 코딩 표준 (엄격)

```typescript
// ✅ 올바른 타입
interface ServerData {
  id: string;
  status: 'online' | 'offline';
  metrics: ServerMetrics;
}

// ❌ any 절대 금지
function getData(id: any): any { }  // 절대 금지
```

**파일 크기**: 500줄 권장, 1500줄 최대
**커밋**: ✨ feat | 🐛 fix | ♻️ refactor

---

## 🧪 테스트 전략

**우선순위**:
1. 🔴 **Vercel E2E** (실제 환경) - 98.2% 통과율
2. 🟡 **API Routes** (성능 측정)
3. 🔵 **Unit 테스트** (필요 시만)

```bash
npm run test:vercel:full    # 종합 검증
npm run test:super-fast     # 11초
npm run test:fast           # 21초 (44% 개선)
```

---

## 🛠️ 개발 환경

**WSL 최적화**:
- 메모리: 20GB 할당
- .wslconfig: `dnsTunneling=true`, `autoProxy=true` (필수)
- MCP 상태: 10/10 완벽 연결

**MCP 서버** (10/10 완벽 연결):
- ✅ vercel (OAuth 안정화, v2.0.5+ 패치)
- ✅ serena, supabase, context7, playwright
- ✅ memory, time, sequential-thinking, shadcn-ui
- ✅ **multi-ai** (프로젝트 전용)

**MCP 우선순위 (82% 토큰 절약)**:
- 코드 분석: **Serena** (Read 대신)
- Vercel 조회: **Vercel MCP** (CLI 대신, 89배 빠름)
- 라이브러리 문서: **Context7** (WebSearch 대신)
- UI 컴포넌트: **Shadcn-ui MCP**

### MCP 실사용 예시

```typescript
// 1. Serena: 코드 구조 분석 (Read 대신 3-5배 빠름)
mcp__serena__get_symbols_overview("src/components/DashboardClient.tsx")
mcp__serena__find_symbol("handleSubmit", {
  relative_path: "src/components/DashboardClient.tsx",
  include_body: true
})

// 2. Context7: 라이브러리 문서 조회 (100% 정확)
mcp__context7__resolve_library_id("Next.js")
mcp__context7__get_library_docs("/vercel/next.js", {
  topic: "server-actions",
  tokens: 2500
})

// 3. Vercel: 배포 정보 (CLI 대신 89배 빠름)
mcp__vercel__list_projects(teamId)
mcp__vercel__get_deployment(deploymentId, teamId)
```

### ⚡ Serena MCP 베스트 프랙티스 (필수)

**문제**: 프로젝트 루트에서 79,637개 파일 스캔 시도 → 180초 타임아웃

**해결**: `skip_ignored_files: true` 사용 → 1,639개만 스캔 (48배 빠름)

```typescript
// ❌ 잘못된 패턴 (타임아웃 발생)
mcp__serena__list_dir({ relative_path: ".", recursive: false })

// ✅ 올바른 패턴 (즉시 응답)
mcp__serena__list_dir({
  relative_path: ".",
  recursive: false,
  skip_ignored_files: true  // 필수!
})

// ✅ 특정 디렉토리 지정 (100배 빠름)
mcp__serena__find_file({
  file_mask: "*multi-ai*",
  relative_path: "packages"  // 범위 제한
})
```

**핵심 원칙**:
- 루트 작업 시 `skip_ignored_files: true` 필수
- 대규모 검색은 특정 디렉토리 지정 또는 Bash 사용
- 재귀 검색 시에도 `skip_ignored_files: true` 권장

---

## 🎯 현재 상태 (2025-10-06)

**품질**:
- TypeScript 에러: 0개 ✅
- E2E 테스트: 18개, 98.2% 통과
- 코드베이스: 226K줄, 873개 TS 파일

**성능**:
- 개발 서버: 22초 (35% 개선)
- 테스트: 21초 (44% 개선)
- FCP: 608ms, 응답: 532ms

**무료 티어**:
- 월 운영비: $0 (100% 무료)
- Vercel: 30% 사용
- Supabase: 3% 사용

---

## 🔧 트러블슈팅

**TypeScript 오류**:
```bash
npm run type-check
```

**Vercel 배포 실패**:
```bash
npm run build  # 로컬 테스트
# → Vercel 로그 확인
```

**MCP 문제**:
```bash
claude mcp list
./scripts/mcp-health-check.sh
```

---

## 📚 상세 문서 (Import)

### ⚡ 자동 로딩 (핵심 워크플로우)
- @docs/claude/environment/mcp/mcp-priority-guide.md - MCP 도구 우선순위 의사결정
- @docs/claude/environment/multi-ai-strategy.md - 3-AI 협업 시스템

### 📖 수동 참조 (필요시만)

**아키텍처**:
- docs/claude/architecture/system-overview.md
- docs/claude/architecture/ai-cross-verification.md

**개발 환경**:
- docs/claude/environment/wsl-optimization.md
- docs/claude/environment/ai-tools-setup.md
- docs/claude/environment/workflows.md
- docs/claude/environment/mcp/mcp-configuration.md

**코딩 표준**:
- docs/claude/standards/typescript-rules.md
- docs/claude/standards/commit-conventions.md
- docs/claude/standards/git-hooks-best-practices.md

**테스트/배포**:
- docs/claude/testing/vercel-first-strategy.md
- docs/claude/deployment/vercel-optimization.md

**워크플로우**:
- docs/claude/workflows/common-tasks.md

---

## 📏 CLAUDE.md 크기 관리

**현재 크기**: ~240줄 (적정)
**하드 리미트**: 350줄 절대 초과 금지
**목표 범위**: 200-300줄 유지

**새 내용 추가 시 규칙**:
- 50줄 이상 필요 → Import 문서로 분리
- 기존 내용 중 우선순위 낮은 것 → 수동 참조로 이동
- 예시 코드는 최소화, 핵심만 유지
- 분기별 리뷰 (3개월마다 점검)

---

## 🎓 AI 시스템 파일 구분

- **CLAUDE.md** (이 파일): Claude Code Project Memory (빠른 참조)
- **AGENTS.md**: Codex CLI 환경 가이드
- **docs/claude/**: 상세 문서 (2개 자동 로딩 + 14개 수동 참조)

---

💡 **핵심**: Type-First + MCP 우선 + Vercel 중심 + any 금지

⚠️ **주의**: 모든 수정 시 Side-Effect 분석 필수

📖 **상세**: docs/claude/ 문서 참조 (핵심 2개는 자동 로딩)

---

**Important Instructions**:
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the User
