# 📁 .claude 폴더 구조 가이드

> **Claude Code 공식 표준 준수** (2025-12-21 업데이트)
> 공식 문서: https://docs.anthropic.com/en/docs/claude-code/settings

## 🎯 폴더 구조

```
.claude/
├── settings.json          # 프로젝트 공유 설정 (hooks)
├── settings.local.json    # 로컬 권한 설정 (gitignore)
├── skills/                # 커스텀 스킬 정의
│   └── */skill.md
└── commands/              # 커스텀 슬래시 명령어
    └── *.md
```

## 🚀 Claude Code 기본 서브에이전트 (5개)

| 서브에이전트 | 용도 |
|-------------|------|
| `general-purpose` | 범용 리서치, 코드 검색, 멀티스텝 작업 |
| `Explore` | 코드베이스 빠른 탐색 (파일 패턴, 키워드 검색) |
| `Plan` | 구현 계획 설계, 아키텍처 분석 |
| `claude-code-guide` | Claude Code/Agent SDK/API 문서 안내 |
| `statusline-setup` | Claude Code 상태라인 설정 |

## 🛠️ 커스텀 스킬 (8개)

| 스킬 | 용도 |
|------|------|
| `ai-code-review` | Multi-AI 코드 리뷰 (Codex, Gemini, Claude) |
| `ai-report-export` | 3-AI 검증 결과 문서화 |
| `lint-smoke` | Lint + 테스트 스모크 체크 |
| `mermaid-diagram` | Mermaid 다이어그램 생성/검증 |
| `next-router-bottleneck` | Next.js 라우터 성능 분석 |
| `playwright-triage` | E2E 테스트 실패 분류 |
| `security-audit-workflow` | 보안 감사 워크플로우 |
| `validation-analysis` | 검증 결과 분석 |

## 📊 MCP 서버 (9개)

| MCP 서버 | 주요 기능 |
|----------|----------|
| **serena** | 코드 검색, 심볼 분석, 메모리 |
| **context7** | 라이브러리 공식 문서 |
| **vercel** | 배포 관리 |
| **supabase** | PostgreSQL 관리 |
| **playwright** | E2E 테스트 |
| **figma** | Design-to-Code |
| **github** | 저장소 관리 |
| **tavily** | 웹 검색 (심층 리서치) |
| **brave-search** | 웹 검색 (팩트체크) |

## 💡 활용 방법

```bash
# 스킬 목록 확인
ls .claude/skills/

# 슬래시 명령어 확인
ls .claude/commands/

# MCP 상태 확인
claude mcp list
```

## 📚 참고 문서

- [Claude Code 설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)
- [서브에이전트 가이드](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
