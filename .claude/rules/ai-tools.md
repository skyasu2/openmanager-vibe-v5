# AI Tools Usage Rules

## MCP Servers (9개)

| MCP | 용도 | 우선순위 | 비고 |
|-----|------|---------|------|
| `serena` | 코드 검색, 심볼 분석, 메모리 | 높음 | 필수 |
| `context7` | 라이브러리 공식 문서 | 높음 | 필수 |
| `sequential-thinking` | 복잡한 리팩토링, 아키텍처 설계 | 높음 | 단계별 사고 |
| `supabase` | PostgreSQL 관리 | 중간 | DB 작업시 |
| `vercel` | 배포 상태 확인 | 중간 | 배포시 |
| `playwright` | E2E 테스트 | 중간 | 테스트시 |
| `github` | 저장소/PR 관리 | 중간 | PR/이슈시 |
| `brave-search` | 팩트체크, 버전 확인 | 낮음 | 선택 |
| `tavily` | 심층 리서치 | 낮음 | 선택 |

## Skills (9개)

### 코드 품질
| Skill | 설명 | 트리거 예시 |
|-------|------|------------|
| `review` | 검증 결과 요약 확인 | `/review` |
| `ai-code-review` | 멀티 AI 코드 리뷰 | "ai code review" |
| `lint-smoke` | Lint + 테스트 스모크 | "quality check" |
| `validation-analysis` | 검증 결과 상세 분석 | "검증 결과 분석" |

### 분석/진단
| Skill | 설명 | 트리거 예시 |
|-------|------|------------|
| `security-audit-workflow` | OWASP Top 10 보안 감사 | "security audit" |
| `playwright-triage` | E2E 테스트 실패 분류 | "playwright failure" |
| `next-router-bottleneck` | 라우터 성능 분석 | "router bottleneck" |

### 문서/리포트
| Skill | 설명 | 트리거 예시 |
|-------|------|------------|
| `ai-report-export` | AI 리포트 생성 | "export report" |
| `mermaid-diagram` | 다이어그램 생성 | "mermaid diagram" |

## CLI Tools (WSL)

| CLI | 용도 | 버전 |
|-----|------|------|
| `claude` | 코드 생성/수정 (현재 세션) | v2.0.76 |
| `codex` | 코드 리뷰 (3-AI 로테이션) | v0.77.0 |
| `gemini` | 로직 검증 | v0.22.4 |
| `qwen` | 보조 리뷰 | v0.6.0 |

## Built-in Subagents (5개)

| Agent | 용도 |
|-------|------|
| `Explore` | 코드베이스 탐색 (quick/medium/thorough) |
| `Plan` | 구현 계획 설계 |
| `general-purpose` | 범용 리서치 |
| `claude-code-guide` | Claude Code 공식 문서 |
| `statusline-setup` | 상태라인 설정 |

## Permission Categories (settings.local.json)

```
Bash Commands     : npm, npx, node, git, docker, gcloud, gsutil, curl, etc.
MCP Servers       : Vercel, Serena, Supabase, Context7, Playwright, etc.
Skills            : review, ai-code-review, lint-smoke, etc.
WebFetch Domains  : anthropic.com, supabase.com, github.com, etc.
```
