# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.80.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.53 + Codex v0.63.0 리뷰
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

# Claude Code v2.0.31+ 🆕
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석
Esc Esc                     # 빠른 복원

# Extended Thinking (v2.0.31+)
Tab 키 토글 | ultrathink 키워드 | Token Budget: think(4K) < think hard(10K) < ultrathink(32K)

# @-mention 서버 필터링 (v2.0.10+) 🔥
@serena "코드 검색"             # Serena만 활성화 → 10-18% 추가 절약
@filesystem "파일 작업"        # filesystem만 활성화
@context7 "Next.js 15 문서"    # Context7만 활성화
@vercel "배포 상태 확인"       # Vercel만 활성화
```

---

## 📊 주간 메트릭 (logs/feedback/week1-checklist.md)

- MCP 활용도: 65% → 90% 목표
- 코드 리뷰: **Codex → Gemini → Qwen → Claude Code** (auto-ai-review.sh v5.0.0) 🆕
  - 1:1:1:1 균등 분배 (각 25%, 순환적 선택)
  - Rate limit 자동 감지 및 폴백
  - **Wrapper 버전**: Codex v3.0.0, Gemini v3.0.0, Qwen v3.0.0 ✅
  - **견고성**: stderr 분리 + trap + 공백 감지 (2025-11-21 통일)
  - 최종 폴백: Claude Code 서브에이전트 (code-review-specialist)
  - 리뷰 파일: `review-{AI}-{DATE}-{TIME}.md`
  - 99.99% 가용성 보장 (Codex OR Gemini OR Qwen OR Claude) 🆕
  - Codex 의존도 감소: 80% → 25% (Rate Limit 위험 감소)
- 토큰 효율: 45토큰 목표 (MCP 82% + @-mention 3%)

---

## 💡 핵심 원칙

1. **Type-First**: 타입 정의 → 구현 → 리팩토링
2. **any 금지**: TypeScript strict mode 100%
3. **Vercel 중심**: 실제 환경 우선 테스트
4. **MCP 필요시 사용**: 복잡한 작업 시 MCP 서버 활용 (85% 토큰 절약 가능)
5. **Side-Effect First**: 테스트/문서/의존성 동시 수정
6. **UX Obsession**: 사용자 경험 최우선 (Premium Quality)
7. **Simplicity**: 코드는 읽기 쉽고 단순하게 유지 (KISS)

### 🤖 AI Collaboration Philosophy

**"Trust but Verify"**

- **Role**: Claude (Lead) ↔ Gemini (Partner/Reviewer)
- **Cross-Check**: 중요한 아키텍처 결정이나 복잡한 로직 구현 시 Gemini에게 "Second Opinion" 요청
- **Context Sharing**: 작업 전 핵심 컨텍스트(목표, 제약사항)를 명확히 공유

### 🔍 작업 전 필수 체크

**새 작업 시작 전**:

1. 중복 기능 검색 (@serena)
2. 레거시 코드 정리
3. 영향 범위 분석
4. AI Cross-Check (Gemini)

**상세**: @docs/ai/ai-coding-standards.md (Pre-Development Checklist)

### 🎯 구현 시 필수 작업

**코드 수정 시 동시 진행**:

1. 문서 업데이트 (README, API, JSDoc)
2. 테스트 관리 (수정/생성/제거)
3. Side-Effect 처리 (의존성, 환경변수, 타입, DB)

**상세**: @docs/ai/ai-coding-standards.md (Implementation Checklist)

---

## ⚡ 토큰 최적화 전략

### @-mention 사용법

특정 MCP 서버만 활성화: `@serena "코드 분석"`, `@context7 "문서 조회"`, `@vercel "배포 확인"`
**효과**: 10-18% 추가 절약, Cache Read 90%+ 달성

### 외부 문서 참조 가이드

| 문서                     | 언제 참조         | 핵심 내용                     |
| ------------------------ | ----------------- | ----------------------------- |
| subagents-complete-guide | 전문 작업 필요 시 | 12개 에이전트, 호출 방법      |
| mcp-priority-guide.md    | MCP 도구 선택 시  | 작업별 우선순위, Before/After |

**원칙**: 500줄+ 문서는 직접 참조 최소화, 1-2줄 요약으로 빠른 판단

---

## 🎭 서브에이전트 (12개)

**호출**: `Task [에이전트명] "[작업]"`

**핵심**: codex-specialist, code-review, vercel-platform, security, test-automation

**상세**: @docs/ai/subagents-complete-guide.md (371줄, 전체 목록)
**설정**: @config/ai/registry-core.yaml (SSOT)

### ⚡ 서브에이전트 활용 가이드

**핵심 명령어**:

- 🐛 버그: `Task debugger-specialist "근본 원인 분석"`
- 🚨 보안: `Task security-specialist "긴급 보안 스캔"`
- 🧪 테스트: `Task test-automation-specialist "전체 테스트 진단"`
- 🚀 배포: `Task vercel-platform-specialist "배포 최적화 검증"`
- 📝 리뷰: `codex exec "변경사항 리뷰"`

**상세 가이드**: @docs/ai/subagents-complete-guide.md (12개 에이전트, 활용 전략)

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
- MCP 상태: 9/9 연결 (완벽 연결!)

**MCP 연결**: 11/11 완벽 (100% 가동률) ✅

**MCP 필요시 활용**: 복잡한 작업 시 전문 서버 사용

- **주요 서버**: serena (코드 검색), filesystem (파일 작업), vercel (배포), context7 (문서), shadcn-ui (UI), github (저장소)
- **토큰 절약 효과**: 최대 85% (MCP 82% + @-mention 3%)
- **전체 서버**: vercel, serena, supabase, context7, playwright, shadcn-ui, memory, time, sequential-thinking, filesystem, github

**상세**: @docs/claude/environment/mcp/mcp-priority-guide.md (514줄, Before/After 예시)

---

## 🎯 현재 상태

**상세**: @docs/status.md (종합 평가: 9.2/10)

---

## 🛠️ 핵심 스크립트

**자동 실행 (5개)**: Git hook, auto-ai-review.sh, AI wrappers (Codex/Gemini/Qwen)
**주간 관리 (2개)**: MCP 헬스체크, AI 도구 확인
**개발 워크플로우 (10개)**: dev-server-manager, git-push-safe, run-tests

**상세**: @docs/claude/1_workflows.md (스크립트 전체 목록 및 사용법)

---

## 🔧 트러블슈팅

**TypeScript**: `npm run type-check`
**Vercel 배포**: `npm run build` → Vercel 로그 확인
**AI 도구**: `"dev-environment-manager야, AI 도구 헬스 체크해줘"`
**MCP**: `claude mcp list` 또는 `./scripts/mcp/mcp-health-check.sh`

**상세**: @docs/claude/1_workflows.md (트러블슈팅 가이드)

---

## 📚 상세 문서

**필요시 참조**: docs/claude/ (아키텍처, 환경, 표준, 테스트, 배포)
**핵심**: 1_workflows.md (통합 워크플로우), mcp-priority-guide.md (MCP 활용)

---

## 🎓 AI 시스템 파일 구분

- **CLAUDE.md** (이 파일): Claude Code Project Memory (빠른 참조)
- **AGENTS.md**: Codex CLI 환경 가이드
- **docs/claude/**: 상세 문서 (필요 시 참조)

### 🆕 v4.0 AI 시스템 변경 (2025-11-26)

**AI 모드 선택 UI 완전 제거** - 자동 라우팅 전환

- AIMode 타입 단순화 (`UNIFIED` 단일 값)
- 4개 UI 컴포넌트 제거 (~1,196줄)
- 완전한 하위 호환성 유지

**상세**: @docs/ai/MODE-SELECTION-REMOVAL.md

---

## ⚡ Quick Reference

**통합 워크플로우**: @docs/claude/1_workflows.md ✅ (일일 루틴 + Codex 리뷰 + 서브에이전트 + MCP 우선순위)
**상세 가이드**: @docs/claude/environment/mcp/mcp-priority-guide.md

---

💡 **핵심**: Type-First + MCP 필요시 사용 + Vercel 중심 + any 금지

⚠️ **주의**:

- **작업 전**: 중복 기능 검색 → 레거시 정리 → 영향 범위 분석
- **작업 중**: 문서 + 테스트 + Side-Effect 동시 처리
- **검증 후**: Vercel E2E 우선 테스트

📖 **상세**: docs/claude/ 문서 참조 (필요 시 @path/to/file.md)

---

**Important Instructions**:

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (\*.md) or README files
- Only create documentation files if explicitly requested by the User
