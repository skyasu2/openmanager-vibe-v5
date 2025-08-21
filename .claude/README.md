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

## 📊 현재 구성 (19개 에이전트)

| 에이전트 | 역할 |
|----------|------|
| **central-supervisor** | 서브에이전트 오케스트레이터 |
| **ai-systems-specialist** | AI 시스템 최적화 |
| **database-administrator** | Supabase PostgreSQL 관리 |
| **dev-environment-manager** | WSL 최적화, Node.js 관리 |
| **gcp-vm-specialist** | GCP VM 백엔드 관리 |
| **mcp-server-administrator** | 12개 MCP 서버 관리 |
| **security-auditor** | 기본 보안 검사 |
| **test-automation-specialist** | Vitest/Playwright 테스트 |
| **documentation-manager** | docs 폴더 관리 |
| **git-cicd-specialist** | Git 워크플로우 |
| **structure-refactor-specialist** | 코드 구조 개선 |
| **code-review-specialist** | 코드 품질 검토 |
| **debugger-specialist** | 버그 해결 |
| **quality-control-specialist** | 프로젝트 규칙 감시 |
| **ux-performance-specialist** | 성능 최적화 |
| **vercel-platform-specialist** | Vercel 배포 최적화 |
| **codex-agent** | ChatGPT Codex 병렬 개발 |
| **gemini-agent** | Google Gemini 병렬 개발 |
| **qwen-agent** | Qwen CLI 병렬 개발 |

## 🔧 마이그레이션 히스토리

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