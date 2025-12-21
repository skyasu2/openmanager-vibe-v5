# AI Tools Usage Rules

## MCP Servers (9개)
| MCP | 용도 | 우선순위 |
|-----|------|---------|
| `serena` | 코드 검색, 심볼 분석, 메모리 | 높음 |
| `context7` | 라이브러리 공식 문서 | 높음 |
| `supabase` | PostgreSQL 관리 | 중간 |
| `vercel` | 배포 상태 확인 | 중간 |
| `playwright` | E2E 테스트 | 중간 |
| `github` | 저장소/PR 관리 | 중간 |
| `brave-search` | 팩트체크, 버전 확인 | 낮음 |
| `tavily` | 심층 리서치 | 낮음 |
| `figma` | Design-to-Code (6회/월 제한) | 낮음 |

## Skills (8개)
```bash
Skill ai-code-review          # 멀티 AI 코드 리뷰 (codex→gemini→qwen)
Skill lint-smoke              # Lint + 테스트 스모크
Skill security-audit-workflow # 보안 감사 (OWASP Top 10)
Skill validation-analysis     # 검증 결과 분석
Skill playwright-triage       # E2E 테스트 실패 분류
Skill next-router-bottleneck  # 라우터 성능 분석
Skill ai-report-export        # AI 리포트 생성
Skill mermaid-diagram         # 다이어그램 생성
```

## CLI Tools (WSL)
- `claude`: 코드 생성/수정
- `codex`: 코드 리뷰 (3-AI 로테이션)
- `gemini`: 로직 검증
- `qwen`: 보조 리뷰

## Built-in Subagents (5개)
- `Explore`: 코드베이스 탐색
- `Plan`: 구현 계획 설계
- `general-purpose`: 범용 리서치
- `claude-code-guide`: Claude Code 문서
- `statusline-setup`: 상태라인 설정
