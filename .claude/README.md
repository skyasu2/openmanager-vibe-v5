# 📁 .claude 폴더 구조 가이드

> **Claude Code 공식 표준 준수** (2026-01-22 업데이트)
> 공식 문서: https://docs.anthropic.com/en/docs/claude-code/settings
> 상세 가이드: `docs/vibe-coding/claude-code.md`

## 🎯 폴더 구조

```
.claude/
├── settings.json          # 프로젝트 공유 설정 (hooks)
├── settings.local.json    # 로컬 권한 설정 (gitignore)
├── rules/                 # 자동 로드 규칙
│   ├── code-style.md
│   ├── architecture.md
│   ├── ai-tools.md
│   ├── testing.md
│   └── deployment.md
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

## 🛠️ 커스텀 스킬 (11개)

| 스킬 | 버전 | 용도 |
|------|------|------|
| `review` | v1.0.0 | 검증 결과 요약 확인 (`/review`) |
| `ai-code-review` | v3.1.0 | Multi-AI 코드 리뷰 분석 + 개선 실행 |
| `validation-analysis` | v1.3.0 | 검증 결과 분석 + 이슈 트래킹 |
| `lint-smoke` | v1.1.0 | Lint + 테스트 스모크 체크 |
| `ai-report-export` | v1.1.0 | 2-AI 검증 결과 문서화 |
| `mermaid-diagram` | v1.0.0 | Mermaid 다이어그램 생성/검증 |
| `next-router-bottleneck` | v1.1.0 | Next.js 라우터 성능 분석 |
| `playwright-triage` | v1.2.0 | E2E 테스트 실패 분류 |
| `security-audit-workflow` | v1.1.0 | 보안 감사 워크플로우 |
| `cloud-run-deploy` | v1.0.0 | Cloud Run AI Engine 배포 |
| `commit-commands` | v1.0.0 | Git 커밋 워크플로우 (commit, commit-push-pr, clean_gone) |

## 📊 MCP 서버 (8개)

| MCP 서버 | 주요 기능 | 우선순위 |
|----------|----------|---------|
| **serena** | 코드 검색, 심볼 분석, 메모리 | 높음 |
| **context7** | 라이브러리 공식 문서 | 높음 |
| **sequential-thinking** | 복잡한 리팩토링, 아키텍처 설계 | 높음 |
| **supabase** | PostgreSQL 관리 | 중간 |
| **vercel** | 배포 관리 | 중간 |
| **playwright** | E2E 테스트 | 중간 |
| **github** | 저장소 관리 | 중간 |
| **tavily** | 웹 검색 (심층 리서치) | 낮음 |

## ⚡ Hooks 설정

### PostToolUse (Write/Edit 후)
- Biome 자동 포맷팅 적용

### PreToolUse (Bash 전)
- 명령어 로깅 (`logs/claude-bash-commands.log`)

## 📝 Custom Commands

`.claude/commands/` 디렉토리에 슬래시 명령어 정의:

| 명령어 | 파일 | 설명 |
|--------|------|------|
| `/review` | `review.md` | AI 코드 리뷰 결과 확인 |

### 명령어 생성 방법

```markdown
<!-- .claude/commands/my-command.md -->
# /my-command 설명

실행할 작업 내용...
```

## 💡 활용 방법

```bash
# 스킬 목록 확인
ls .claude/skills/

# 스킬 실행 (Skill 도구 사용)
Skill ai-code-review
Skill validation-analysis
Skill lint-smoke

# 슬래시 명령어
/review              # 검증 결과 분석
/commit              # Git 커밋 (AI 리뷰 포함)
/commit-push-pr      # 커밋 → 푸시 → PR

# MCP 상태 확인
claude mcp list
```

## 🔧 권한 관리

`settings.local.json`은 와일드카드 패턴으로 최적화됨:
- `Bash(npm:*)` - npm 명령어 전체
- `Bash(git:*)` - git 명령어 전체
- `mcp__*` - 모든 MCP 서버 도구
- `WebFetch(domain:*.vercel.app)` - Vercel 도메인 전체

## 📚 참고 문서

- [Claude Code 설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)
- [서브에이전트 가이드](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [MCP 서버 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp-servers)
