# 🤖 Claude Code 서브에이전트 완전 가이드

**OpenManager VIBE 프로젝트 전용** | 최종 업데이트: 2025-12-07

> 이 문서는 Claude Code에서 사용하는 9개 전문 서브에이전트의 활용법을 다룹니다.

---

## 📑 목차

1. [빠른 시작](#-빠른-시작)
2. [상황별 에이전트 선택](#-상황별-에이전트-선택)
3. [핵심 에이전트 구성 (9개)](#-핵심-에이전트-구성-9개)
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
| 🚀 배포 이슈 | vercel-platform-specialist |
| 🧪 테스트 | test-automation-specialist |
| 📊 성능 최적화 | performance-specialist |
| 🎨 UI/UX | ui-ux-specialist |
| 🗄️ DB 작업 | database-administrator |
| 📚 문서화 | documentation-manager |

---

## 🎯 상황별 에이전트 선택

| 상황 | 1순위 | 2순위 | 설명 |
|------|-------|-------|------|
| 🐛 버그 수정 | debugger-specialist | code-review-specialist | RCA + 5 Whys 분석 |
| 🚀 성능 개선 | performance-specialist | debugger-specialist | Core Web Vitals 최적화 |
| 🔒 보안 강화 | security-specialist | code-review-specialist | OWASP Top 10 검증 |
| 📱 UI 개선 | ui-ux-specialist | documentation-manager | shadcn/ui 연동 |
| 🧪 테스트 | test-automation-specialist | debugger-specialist | Vitest + Playwright |
| 🚀 배포 | vercel-platform-specialist | security-specialist | Edge 최적화 |

---

## 🎯 핵심 에이전트 구성 (9개)

### CRITICAL 우선순위

#### security-specialist
**종합 보안 전문가** - 취약점 스캔, 인증/인가 검증, 배포 전 필수 보안 감사

- **도구**: Grep, Bash, Glob, mcp__supabase, mcp__serena, mcp__tavily
- **특화**: OWASP Top 10, RLS 정책 검증, SLA 99.9% 보장
- **호출**: `Task security-specialist "보안 감사 실행"`

### HIGH 우선순위

#### debugger-specialist
**버그 분석 및 근본 원인 추적 전문가**

- **도구**: Read, Grep, Bash, mcp__serena (심볼 분석)
- **특화**: RCA, 5 Whys, 스택 트레이스 분석
- **호출**: `Task debugger-specialist "에러 근본 원인 분석"`

#### code-review-specialist
**통합 코드 품질 검토 전문가** (v2.0.0)

- **도구**: Read, Write, Grep, Glob, Bash, TodoWrite, Edit, mcp__serena
- **특화**: 일반 리뷰 + Codex 자동 리뷰 + Multi-AI 교차검증
- **호출**: `Task code-review-specialist "PR 코드 리뷰"`

#### test-automation-specialist
**Vitest + Playwright E2E 테스트 전문가**

- **도구**: Read, Write, Edit, Bash, mcp__playwright, mcp__serena
- **특화**: 테스트 커버리지, E2E 시나리오, 실패 분류
- **호출**: `Task test-automation-specialist "테스트 커버리지 분석"`

#### database-administrator
**Supabase PostgreSQL 전문가**

- **도구**: mcp__supabase (execute_sql, list_tables, apply_migration)
- **특화**: 쿼리 최적화, RLS 정책, 마이그레이션 자동화
- **호출**: `Task database-administrator "쿼리 성능 최적화"`

#### vercel-platform-specialist
**Vercel 플랫폼 최적화 전문가**

- **도구**: Read, Write, Edit, Bash, mcp__vercel (배포, 프로젝트 관리)
- **특화**: Edge Functions, 배포 설정, 무료 티어 관리
- **호출**: `Task vercel-platform-specialist "배포 상태 확인"`

#### performance-specialist 🆕
**Core Web Vitals 및 번들 최적화 전문가**

- **도구**: Read, Write, Edit, Bash, mcp__serena, mcp__playwright
- **특화**: FCP/LCP/CLS 최적화, 번들 분석, 렌더링 성능
- **호출**: `Task performance-specialist "Core Web Vitals 분석"`

### MEDIUM 우선순위

#### documentation-manager
**JBGE 원칙 기반 문서 관리 전문가**

- **도구**: Read, Write, Edit, Glob, Grep, mcp__memory, mcp__serena
- **특화**: 루트 파일 정리, docs 폴더 체계화, Mermaid 다이어그램
- **호출**: `Task documentation-manager "문서 구조 정리"`

#### ui-ux-specialist
**UI/UX 전문가 - shadcn/ui 연동**

- **도구**: Read, Write, Edit, mcp__shadcn-ui, mcp__memory, mcp__serena
- **특화**: 사용자 인터페이스 개선, 디자인 시스템, 데이터 시각화
- **호출**: `Task ui-ux-specialist "컴포넌트 UI 개선"`

---

## 🔧 외부 AI CLI 도구

서브에이전트가 아닌 외부 CLI 도구입니다. 코드 리뷰 시스템에서 자동 사용됩니다.

| 도구 | 버전 | 역할 |
|------|------|------|
| Codex CLI | v0.63.0 | Primary 순환 (1:1:1) |
| Gemini CLI | v0.19.1 | Primary 순환 (1:1:1) |
| Claude CLI | v2.0.60 | Primary 순환 (1:1:1) |
| Qwen CLI | v0.4.0 | Fallback 전용 |

**사용법** (Wrapper 스크립트):
```bash
bash scripts/ai-subagents/codex-wrapper.sh "리뷰 요청"
bash scripts/ai-subagents/gemini-wrapper.sh "리뷰 요청"
bash scripts/ai-subagents/qwen-wrapper.sh "리뷰 요청"
```

**자동 코드 리뷰**: `scripts/code-review/auto-ai-review.sh` (v6.7.0)
- Primary 1:1:1 순환: Codex → Gemini → Claude
- Fallback: Primary → Qwen → Claude Code

---

## 🗑️ 아카이브된 에이전트

2025-12-01 최적화로 아카이브 처리됨:

| 에이전트 | 아카이브 이유 |
|----------|---------------|
| dev-environment-manager | Claude 기본 기능으로 충분 |
| structure-refactor-specialist | code-review-specialist에 통합 |
| gcp-cloud-functions-specialist | Vercel이 주 플랫폼 |

---

## 📚 관련 문서

- **[CLAUDE.md](../../CLAUDE.md)** - 메인 프로젝트 가이드
- **[registry-core.yaml](../../config/ai/registry-core.yaml)** - AI Registry SSOT
- **[MCP 가이드](../claude/environment/mcp/mcp-priority-guide.md)** - MCP 서버 활용

---

💡 **핵심**: 서브에이전트는 `Task [에이전트명] "[작업]"` 형식으로 호출하세요.
