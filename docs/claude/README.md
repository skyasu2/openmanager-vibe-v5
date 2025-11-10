---
category: claude-code
purpose: claude_code_development_guidelines_and_configuration
ai_optimized: true
query_triggers:
  - 'Claude Code 설정'
  - '개발 가이드라인'
  - 'Multi-AI 전략'
  - 'MCP 서버 설정'
  - '코딩 표준'
  - 'Git 규칙'
  - 'Vercel 배포'
  - '테스트 전략'
related_docs:
  - 'CLAUDE.md'
  - 'config/ai/registry-core.yaml'
  - 'docs/ai/'
  - 'docs/development/'
last_updated: '2025-10-17'
---

# 📚 Claude Code 개발 가이드

**Claude Code 전용 개발 문서** - 설정, 표준, 워크플로우, AI 통합

---

## 📂 디렉토리 구조

```
claude/
├── architecture/        (3개) - AI 교차검증, Mock/Simulation, 시스템 개요
├── deployment/          (2개) - Vercel 최적화, 무료 티어 운영
├── environment/         (15개) - Multi-AI, MCP 설정, WSL 최적화
│   └── mcp/            (10개) - MCP 서버 상세 가이드
├── history/            (README + 3개 디렉토리) - AI 검증 기록, 의사결정 히스토리
├── standards/           (4개) - TypeScript, Git, 커밋 규칙, 파일 구조
├── testing/             (2개) - Vercel 우선 전략, E2E Playwright
└── workflows/           (2개) - AI 교차검증, 일반 작업 워크플로우
```

**총 28개 이상 문서** (environment/mcp/ 포함)

---

## 🎯 핵심 카테고리

### 1. architecture/ - AI 교차검증 및 시스템 설계

**AI Query**: "AI 교차검증 시스템", "Mock/Simulation 아키텍처"

**문서**:

- `ai-cross-verification.md` - 3-AI 교차검증 시스템 (Codex/Gemini/Qwen)
- `mock-simulation.md` - Mock/Simulation 시스템 설계
- `system-overview.md` - 전체 시스템 개요

**관련**: docs/quality/, config/ai/registry-core.yaml

---

### 2. deployment/ - Vercel 최적화 및 무료 운영

**AI Query**: "Vercel 최적화", "무료 티어 운영", "Zero Cost"

**문서**:

- `vercel-optimization.md` - Vercel 플랫폼 최적화 전략
- `zero-cost-operations.md` - 월 $0 운영 가이드

**관련**: docs/deploy/, MCP Vercel 서버

---

### 3. environment/ - 개발 환경 설정 (⭐ 핵심)

**AI Query**: "Multi-AI 설정", "MCP 서버", "WSL 최적화", "Claude Code Hooks"

**루트 문서 (5개)**:

- `multi-ai-strategy.md` ⭐ - Multi-AI 협업 전략 (Codex/Gemini/Qwen)
- `workflows.md` - 일일 개발 워크플로우
- `wsl-optimization.md` - WSL 환경 최적화
- `ai-tools-setup.md` - AI CLI 도구 설치 및 설정
- `claude-code-hooks-guide.md` - Claude Code Hooks 활용

**mcp/ 하위 디렉토리 (10개) - MCP 서버 완전 가이드**:

- `README.md` - MCP 서버 개요
- `setup-guide.md` - 9개 MCP 서버 설정 (완전 가이드)
- `mcp-configuration.md` - 설정 파일 및 인증
- `mcp-priority-guide.md` ⭐ - MCP 우선순위 전략 (85% 토큰 절약, @-mention 포함)
- `servers.md` - 서버별 상세 설명
- `tools.md` - MCP 도구 활용법
- `integration.md` - MCP 통합 패턴
- `advanced.md` - 고급 활용
- `serena-tools-comprehensive-guide.md` - Serena MCP 완전 가이드
- `serena-subagent-integration-plan.md` - Serena 서브에이전트 통합

**관련**: config/ai/registry-core.yaml, docs/ai/, scripts/ai-subagents/

---

### 4. history/ - AI 검증 기록 및 의사결정 히스토리

**AI Query**: "AI 검증 기록", "Phase 3 롤백", "의사결정 히스토리"

**구조**:

- `README.md` - History 디렉토리 개요
- `ai-verifications/` - AI 교차검증 기록 (18개 문서)
- `reports/` - 종합 리포트
- `subagent-analysis/` - 서브에이전트 분석

**관련**: docs/quality/ai-verifications/, logs/ai-decisions/

---

### 5. standards/ - 코딩 표준 및 규칙

**AI Query**: "TypeScript 규칙", "Git 커밋 규칙", "파일 구조"

**문서**:

- `typescript-rules.md` - TypeScript strict mode 규칙 (any 금지)
- `commit-conventions.md` - Git 커밋 메시지 규칙
- `git-hooks-best-practices.md` - Git Hooks 베스트 프랙티스
- `file-organization.md` - 파일 및 디렉토리 구조

**관련**: CLAUDE.md, .git/hooks/

---

### 6. testing/ - 테스트 전략

**AI Query**: "Vercel 우선 테스트", "E2E Playwright"

**문서**:

- `vercel-first-strategy.md` ⭐ - Vercel 프로덕션 우선 테스트 전략
- `e2e-playwright.md` - Playwright E2E 테스트 가이드

**관련**: docs/testing/, tests/e2e/

---

### 7. workflows/ - 워크플로우

**AI Query**: "AI 교차검증 워크플로우", "일반 작업 워크플로우"

**문서**:

- `ai-cross-verification-workflow.md` - 3-AI 교차검증 실행 가이드
- `common-tasks.md` - 자주 사용하는 작업 패턴

**관련**: docs/ai/, scripts/ai-subagents/

---

## 💡 Document Index (AI Query Guide)

### 필수 참조 문서 (⭐)

**Multi-AI 통합**:

- `environment/multi-ai-strategy.md` - Multi-AI 협업 전략
- `architecture/ai-cross-verification.md` - 교차검증 시스템
- `workflows/ai-cross-verification-workflow.md` - 실행 가이드

**MCP 서버 설정**:

- `environment/mcp/setup-guide.md` - 9개 서버 완전 설정
- `environment/mcp/mcp-priority-guide.md` - 우선순위 전략 (85% 절약)
- `environment/mcp/mcp-configuration.md` - 설정 파일

**코딩 표준**:

- `standards/typescript-rules.md` - TypeScript strict mode
- `standards/commit-conventions.md` - Git 커밋 규칙

**배포 전략**:

- `deployment/vercel-optimization.md` - Vercel 최적화
- `testing/vercel-first-strategy.md` - Vercel 우선 테스트

### 상황별 문서 참조

**AI 교차검증 필요 시**:
→ `architecture/ai-cross-verification.md` + `workflows/ai-cross-verification-workflow.md`

**MCP 서버 문제 시**:
→ `environment/mcp/setup-guide.md` + `environment/mcp/servers.md`

**TypeScript 에러 시**:
→ `standards/typescript-rules.md`

**배포 실패 시**:
→ `deployment/vercel-optimization.md` + `testing/vercel-first-strategy.md`

**WSL 환경 문제 시**:
→ `environment/wsl-optimization.md`

**의사결정 히스토리 확인**:
→ `history/ai-verifications/` + `docs/quality/ai-verifications/`

---

## 🔗 관련 문서

**프로젝트 루트**:

- **CLAUDE.md** - 메인 프로젝트 메모리 (빠른 참조)
- **config/ai/registry-core.yaml** - AI 도구 SSOT

**다른 docs/ 디렉토리**:

- **docs/ai/** - AI 시스템 상세 문서
- **docs/development/** - 개발 환경 가이드
- **docs/quality/** - AI 검증 기록
- **docs/testing/** - 테스트 전략

**스크립트**:

- **scripts/ai-subagents/** - Bash Wrapper 구현
- **.git/hooks/** - Pre-commit hooks

---

## 🎯 핵심 철학

> **"Claude Code 메인 + 3-AI 교차검증 + MCP 85% 토큰 절약"**

**개발 원칙**:

- ✅ Type-First: 타입 정의 → 구현 → 리팩토링
- ✅ any 금지: TypeScript strict mode 100%
- ✅ Vercel 중심: 실제 환경 우선 테스트
- ✅ MCP 우선: 85% 토큰 절약 (MCP 82% + @-mention 3%)
- ✅ Multi-AI: 교차검증으로 품질 4배 향상

**AI 역할 분담**:

- **Claude Code**: 메인 개발자 (모든 개발 전담)
- **Codex/Gemini/Qwen**: 검증 전문가 (사용자 명시 시만)

---

**Last Updated**: 2025-10-17 by Claude Code
**핵심 철학**: "AI-First Development with Claude Code"
