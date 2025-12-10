# 🤖 Claude Code 서브에이전트 완전 가이드

**OpenManager VIBE 프로젝트 전용** | 최종 업데이트: 2025-12-10

> 이 문서는 Claude Code에서 사용하는 8개 전문 서브에이전트의 활용법을 다룹니다.

---

## 📑 목차

1. [빠른 시작](#-빠른-시작)
2. [상황별 에이전트 선택](#-상황별-에이전트-선택)
3. [핵심 에이전트 구성 (8개)](#-핵심-에이전트-구성-8개)
4. [외부 AI CLI 도구](#-외부-ai-cli-도구)
5. [아카이브된 에이전트](#-아카이브된-에이전트)

---

## 🚀 빠른 시작

### 호출 방법

```bash
# Task 도구 사용 (권장)
Task [에이전트명] "[작업 설명]"

# 예시
Task debugger-specialist "이 에러의 근본 원인 분석"
Task security-specialist "배포 전 보안 감사"
```

### ⚡ 5초 선택 가이드

| 상황 | 에이전트 |
|------|----------|
| 🐛 버그 해결 | debugger-specialist |
| 🔒 보안 감사 | security-specialist |
| 📝 코드 리뷰 | code-review-specialist |
| 🏛️ 구조 설계 | architecture-specialist |
| 🧪 테스트 | test-automation-specialist |
| 📊 성능 최적화 | performance-specialist |
| 🎨 UI/UX | ui-ux-specialist |
| 📚 문서화 | documentation-manager |

---

## 🎯 상황별 에이전트 선택

| 상황 | 1순위 | 2순위 | 설명 |
|------|-------|-------|------|
| 🐛 버그 수정 | debugger-specialist | code-review-specialist | RCA + 5 Whys 분석 |
| 🚀 성능 개선 | performance-specialist | debugger-specialist | Core Web Vitals 최적화 |
| 🏛️ 구조 설계 | architecture-specialist | code-review-specialist | 모듈화/리팩토링 |
| 🔒 보안 강화 | security-specialist | code-review-specialist | OWASP Top 10 검증 |
| 📱 UI 개선 | ui-ux-specialist | documentation-manager | shadcn/ui 연동 (High Priority) |
| 🧪 테스트 | test-automation-specialist | debugger-specialist | Vitest + Playwright |
| 🚀 배포 | security-specialist | performance-specialist | Vercel MCP 직접 사용 |

---

## 🎯 핵심 에이전트 구성 (8개)

### CRITICAL 우선순위

#### security-specialist
**종합 보안 전문가** - 취약점 스캔, 인증/인가 검증, 배포 전 필수 보안 감사

- **도구**: Grep, Bash, Glob, mcp__supabase, mcp__serena, mcp__tavily, mcp__brave-search
- **특화**: OWASP Top 10, RLS 정책 검증, SLA 99.9% 보장
- **호출**: `Task security-specialist "보안 감사 실행"`

### HIGH 우선순위

#### debugger-specialist
**버그 분석 및 근본 원인 추적 전문가**

- **도구**: Read, Grep, Bash, mcp__serena (심볼 분석), mcp__tavily, mcp__brave-search
- **특화**: RCA, 5 Whys, 스택 트레이스 분석
- **호출**: `Task debugger-specialist "에러 근본 원인 분석"`

#### architecture-specialist 🆕
**시스템 아키텍처 설계 및 구조 리팩토링 전문가**

- **도구**: Read, Write, Edit, Move, Glob, mcp__serena, mcp__sequential-thinking
- **특화**: 모듈화, 폴더 구조 최적화, 의존성 관리, 시스템 설계
- **호출**: `Task architecture-specialist "폴더 구조 리팩토링"`

#### code-review-specialist
**통합 코드 품질 검토 전문가** (v3.0.0)

- **도구**: Read, Write, Grep, Glob, Bash, TodoWrite, Edit, mcp__serena
- **특화**: 직접 코드 리뷰 + 코드리뷰 결과 분석 및 개선 방향 판단
- **호출**: `Task code-review-specialist "PR 코드 리뷰"`

#### test-automation-specialist
**Vitest + Playwright E2E 테스트 전문가**

- **도구**: Read, Write, Edit, Bash, mcp__playwright, mcp__serena
- **특화**: 테스트 커버리지, E2E 시나리오, 실패 분류, **리포트 생성** (직접 수정 안함)
- **호출**: `Task test-automation-specialist "테스트 커버리지 분석"`

#### performance-specialist
**Core Web Vitals 및 번들 최적화 전문가**

- **도구**: Read, Write, Edit, Bash, mcp__serena, mcp__playwright
- **특화**: FCP/LCP/CLS 최적화, 번들 분석, 렌더링 성능
- **호출**: `Task performance-specialist "Core Web Vitals 분석"`

### MEDIUM 우선순위

#### documentation-manager
**JBGE 원칙 기반 문서 관리 전문가**

- **도구**: Read, Write, Edit, Glob, Grep, mcp__memory, mcp__serena, mcp__context7
- **특화**: 루트 파일 정리, docs 폴더 체계화, Mermaid 다이어그램
- **호출**: `Task documentation-manager "문서 구조 정리"`

#### ui-ux-specialist (HIGH로 승격)
**UI/UX 및 프론트엔드 엔지니어링 전문가**

- **도구**: Read, Write, Edit, mcp__shadcn-ui, mcp__memory, mcp__serena, mcp__sequential-thinking
- **특화**: 사용자 인터페이스 개선, 디자인 시스템, 데이터 시각화, React 19 호환성
- **호출**: `Task ui-ux-specialist "컴포넌트 UI 개선"`

---

## 🔧 외부 AI CLI 도구

서브에이전트가 아닌 외부 CLI 도구입니다. 코드 리뷰 시스템에서 자동 사용됩니다.

| 도구 | 버전 | Wrapper 버전 | 역할 |
|------|------|-------------|------|
| Codex CLI | v0.66.0 | v3.2.0 | Primary 순환 (1:1:1) |
| Gemini CLI | v0.19.4 | v3.2.0 | Primary 순환 (1:1:1) |
| Qwen CLI | v0.4.0 | v3.2.0 | Primary 순환 (1:1:1) |

> **참고**: Claude CLI는 Claude Code 세션 내 자기 호출 충돌로 인해 v6.8.0부터 제거됨

**사용법** (Wrapper 스크립트):
```bash
bash scripts/ai-subagents/codex-wrapper.sh "리뷰 요청"
bash scripts/ai-subagents/gemini-wrapper.sh "리뷰 요청"
bash scripts/ai-subagents/qwen-wrapper.sh "리뷰 요청"
```

**자동 코드 리뷰**: `scripts/code-review/auto-ai-review.sh` (v6.9.0)
- Primary 3-AI 순환: Codex → Gemini → Qwen (last_ai 기반)
- 상호 폴백: 각 AI가 다른 두 AI로 순차 폴백

---

## 🗑️ 아카이브된 에이전트

2025-12-10 최적화로 제거됨 (12개 → 8개, 33% 최적화):

| 에이전트 | 제거 이유 |
|----------|-----------|
| dev-environment-manager | Claude 기본 기능으로 충분 |
| structure-refactor-specialist | code-review-specialist에 통합 |
| gcp-cloud-functions-specialist | Vercel이 주 플랫폼 |
| database-administrator | Supabase MCP로 대체 |
| vercel-platform-specialist | Vercel MCP로 대체 |

---

## 📚 관련 문서

- **[CLAUDE.md](../../CLAUDE.md)** - 메인 프로젝트 가이드
- **[registry-core.yaml](../../config/ai/registry-core.yaml)** - AI Registry SSOT
- **[MCP 가이드](../claude/environment/mcp/mcp-priority-guide.md)** - MCP 서버 활용

---

💡 **핵심**: 서브에이전트는 `Task [에이전트명] "[작업]"` 형식으로 호출하세요.
