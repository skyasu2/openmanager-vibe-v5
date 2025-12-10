# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

<!-- Version: 1.0.0 | Author: Antigravity -->

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.80.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.61 + Codex v0.66.0 리뷰
**스택**: Next.js 16, React 19, TypeScript 5.9 strict, Vercel + Supabase

---

## 🚀 빠른 시작

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # Biome+타입+테스트

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
@tavily "웹 검색"              # Tavily만 활성화
@context7 "Next.js 15 문서"    # Context7만 활성화
@vercel "배포 상태 확인"       # Vercel만 활성화
```

---

## 📊 주간 메트릭 (logs/feedback/week1-checklist.md)

- MCP 활용도: 65% → 90% 목표
- 코드 리뷰: **Primary 1:1:1 순환** (v6.4.0) → Qwen 폴백 → Claude Code 최종
  - 상세: @docs/status.md (코드 리뷰 시스템 상태)
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

**상세**: <!-- Imported from: docs/development/standards/git-hooks-best-practices.md --> (Pre-Development Checklist)

### 🎯 구현 시 필수 작업

**코드 수정 시 동시 진행**:

1. 문서 업데이트 (README, API, JSDoc)
2. 테스트 관리 (수정/생성/제거)
3. Side-Effect 처리 (의존성, 환경변수, 타입, DB)

**상세**: <!-- Imported from: docs/development/standards/typescript-rules.md --> (Implementation Checklist)

---

## ⚡ 토큰 최적화 전략

### @-mention 사용법

특정 MCP 서버만 활성화: `@serena "코드 분석"`, `@context7 "문서 조회"`, `@vercel "배포 확인"`
**효과**: 10-18% 추가 절약, Cache Read 90%+ 달성

### 외부 문서 참조 가이드

| 문서                  | 언제 참조        | 핵심 내용                     |
| --------------------- | ---------------- | ----------------------------- |
| mcp-priority-guide.md | MCP 도구 선택 시 | 작업별 우선순위, Before/After |
| 1_workflows.md        | 워크플로우 확인  | 일일 루틴, 스크립트 사용법    |

**원칙**: 500줄+ 문서는 직접 참조 최소화, 위 테이블로 빠른 판단

---

## 🎭 서브에이전트 & Skills

### 서브에이전트 (8개 활성)

**호출**: `Task [에이전트명] "[작업]"`

| 우선순위 | 에이전트 | 용도 |
|----------|----------|------|
| CRITICAL | security-specialist | 보안 감사, 취약점 스캔 |
| HIGH | debugger-specialist | 버그 분석, 근본 원인 추적 |
| HIGH | architecture-specialist | 아키텍처 설계, 모듈화/리팩토링 |
| HIGH | code-review-specialist | 통합 코드 품질 검토 |
| HIGH | test-automation-specialist | Vitest + Playwright 테스트 |
| HIGH | performance-specialist | Core Web Vitals, 번들 최적화 |
| HIGH | ui-ux-specialist | UI/UX, React 19 호환성 |
| MEDIUM | documentation-manager | JBGE 문서 관리 |

### 🔄 자율 활용 원칙

**Claude Code가 자동으로 서브에이전트 호출**:

| 상황 | 서브에이전트 |
|------|-------------|
| **커밋/푸시 시** 보안 파일 변경 (auth, env, api) | `security-specialist` |
| **커밋/푸시 시** 소스 코드 변경 | `test-automation-specialist` |
| 아키텍처/구조 변경 | `architecture-specialist` |
| 복잡한 로직, 중요 PR | `code-review-specialist` |
| 버그 분석/디버깅 | `debugger-specialist` |
| 성능 이슈 의심 | `performance-specialist` |
| UI 컴포넌트 작업 | `ui-ux-specialist` |
| 문서 정리 필요 시 | `documentation-manager` |

**빠른 예시**:
```bash
Task security-specialist "staged 파일 보안 점검"
Task test-automation-specialist "변경 파일 테스트 커버리지 확인"
Task debugger-specialist "근본 원인 분석"
```

### Skills (7개, 평균 72% 토큰 절약)

**호출**: `Skill [스킬명]`

| 스킬 | 용도 | 절약률 |
|------|------|--------|
| lint-smoke | 린트 + 테스트 자동화 | 62% |
| playwright-triage | E2E 테스트 실패 분류 | 77% |
| ai-report-export | AI 리뷰 결과 문서화 | 78% |
| next-router-bottleneck | Next.js 라우팅 성능 진단 | 75% |
| security-audit-workflow | 배포 전 보안 감사 | 70% |
| validation-analysis | 커밋 후 검증 분석 | - |
| ai-code-review | AI 코드 리뷰 오케스트레이션 | 70% |

**빠른 예시**:
```bash
Skill lint-smoke              # 코드 품질 검증
Skill playwright-triage       # E2E 실패 분석
Skill security-audit-workflow # 보안 스캔
```

**설정**: @config/ai/registry-core.yaml (SSOT)

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
- MCP 상태: 12/12 연결 (완벽 연결!)

**MCP 연결**: 12/12 완벽 (100% 가동률) ✅

**MCP 필요시 활용**: 12/12 서버 연결, 토큰 85% 절약 가능

- **서버 목록/역할**: @config/ai/registry-core.yaml (SSOT)
- **활용 가이드**: @docs/development/setup/mcp-priority-guide.md

---

## 🎨 Mermaid CLI (v11.12.0)

**아키텍처 다이어그램 자동 생성**:

```bash
# 자동화 스크립트 (권장)
./scripts/generate-diagrams.sh                    # docs/ 전체 .mmd 파일 변환
./scripts/generate-diagrams.sh docs/core/architecture/flow.mmd # 특정 파일만 변환

# 수동 사용
mmdc -i diagram.mmd -o output.png    # PNG 생성
mmdc -i diagram.mmd -o output.svg    # SVG (벡터)
mmdc -i diagram.mmd -o output.png -b white -t neutral  # 옵션
```

**활용 시나리오**:
- 시스템 아키텍처 시각화 (documentation-manager 연동)
- API 플로우차트 자동 생성
- DB 스키마 ER 다이어그램
- 시퀀스 다이어그램 (API 호출 흐름)

**저장 위치**: `docs/core/architecture/*.mmd` → PNG/SVG 변환

---

## 🎯 현재 상태

**상세**: @docs/status.md (종합 평가: 9.0/10)

---

## 🛠️ 핵심 스크립트

**자동 실행 (5개)**: Git hook, auto-ai-review.sh, AI wrappers (Codex/Gemini/Qwen)
**주간 관리 (2개)**: MCP 헬스체크, AI 도구 확인
**개발 워크플로우 (10개)**: dev-server-manager, git-push-safe, run-tests

**상세**: @docs/development/workflows/1_workflows.md (스크립트 전체 목록 및 사용법)

---

## 🔧 트러블슈팅

**TypeScript**: `npm run type-check`
**Vercel 배포**: `npm run build` → Vercel 로그 확인
**MCP/AI 도구**: `claude mcp list` 또는 `./scripts/mcp/mcp-health-check.sh`

**상세**: @docs/development/workflows/1_workflows.md (트러블슈팅 가이드)

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

**상세**: <!-- Imported from: docs/core/ai/MODE-SELECTION-REMOVAL.md -->

---

## ⚡ Quick Reference

**워크플로우**: @docs/development/workflows/1_workflows.md (일일 루틴, 스크립트)
**MCP 가이드**: @docs/development/setup/mcp-priority-guide.md

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
