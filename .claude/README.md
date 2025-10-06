# 📁 .claude 폴더 구조 가이드

> **Claude Code 공식 표준 준수** (2025-08-18 개선)  
> 공식 문서: https://docs.anthropic.com/en/docs/claude-code/settings

## 🎯 올바른 폴더 구조

```
.claude/
├── agents/                 # ✅ 서브에이전트 정의 (프로젝트 전용)
│   ├── *.md               # Markdown + YAML frontmatter 형식
│   └── ...
├── settings.json          # ✅ 프로젝트 공유 설정
├── settings.local.json    # ✅ 개인 설정 (Git 제외)
└── backup/                # 🗂️ 마이그레이션 백업
    └── agents-migration-*/
```

## 🚀 서브에이전트 파일 형식

각 `.md` 파일은 다음 형식을 따릅니다:

```markdown
---
name: agent-name
description: 에이전트 설명
tools: Read, Write, Edit, Bash  # 선택사항
---

# 에이전트 제목

시스템 프롬프트와 상세 설명...
```

## 📊 현재 구성 (12개 서브에이전트)

| 에이전트 | 역할 | MCP 도구 |
|----------|------|----------|
| **code-review-specialist** | 통합 코드 품질 검토 + 디버깅 | Serena, Memory, Context7 |
| **database-administrator** | Supabase PostgreSQL 전문 | Supabase (완전 활용) |
| **debugger-specialist** | 근본 원인 분석 및 버그 해결 | Serena, Memory |
| **dev-environment-manager** | WSL 최적화, Node.js 버전 관리 | Memory, Time, Serena |
| **documentation-manager** | AI 친화적 문서 관리 (JBGE) | Memory, Context7, Serena |
| **gcp-cloud-functions-specialist** | GCP Cloud Functions 관리 | Serena, Bash (gcloud CLI) |
| **multi-ai-verification-specialist** | 3-AI 교차검증 (Codex+Gemini+Qwen) | Multi-AI MCP (v3.0) |
| **security-specialist** | 종합 보안 전문가 (auditor+reviewer 통합) | Supabase, Serena |
| **structure-refactor-specialist** | 아키텍처 리팩토링 | Serena (완전 활용) |
| **test-automation-specialist** | Vitest + Playwright E2E 테스트 | Playwright, Serena |
| **ui-ux-specialist** | 내장 UI/UX 전문가 | Shadcn-ui, Serena |
| **vercel-platform-specialist** | Vercel 플랫폼 완전 관리 | Vercel MCP (완전 활용) |

### 10개 MCP 서버 통합

| MCP 서버 | 상태 | 주요 기능 |
|----------|------|----------|
| **memory** | ✅ | 지식 그래프 저장 |
| **multi-ai** | ✅ | 3-AI 교차검증 (v3.0) |
| **shadcn-ui** | ✅ | UI 컴포넌트 (v4) |
| **time** | ✅ | 시간대 변환 |
| **sequential-thinking** | ✅ | 단계별 분석 |
| **context7** | ✅ | 라이브러리 문서 |
| **serena** | ✅ | 코드 구조 분석 |
| **vercel** | ✅ | 배포 관리 |
| **supabase** | ✅ | PostgreSQL 관리 |
| **playwright** | ✅ | E2E 테스트 |

## 🔧 마이그레이션 히스토리

**2025-10-06**: 서브에이전트 최적화 (13개 → 12개)
- ❌ 제거: `spec-driven-specialist` (역할 중복)
- ✅ 대체: documentation-manager가 계획/결과 분석 담당
- 📊 간소화: multi-ai-verification-specialist (533줄 → 217줄)

**2025-08-18**: Claude Code 공식 표준 준수
- ❌ 제거: `subagents/` 폴더 (비공식 구조)
- ✅ 유지: `agents/` 폴더 (공식 구조)
- 📦 백업: `.claude/backup/agents-migration-*/`

## 💡 활용 방법

```bash
# 에이전트 관리 (대화형)
/agents

# 설정 확인
claude config list

# 프로젝트별 에이전트 확인
ls .claude/agents/
```

## 📚 참고 문서

- [Claude Code 설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)
- [서브에이전트 가이드](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [프로젝트 문서](../docs/claude/sub-agents-comprehensive-guide.md)