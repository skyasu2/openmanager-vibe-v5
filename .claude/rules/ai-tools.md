# AI Tools Usage Rules

## MCP Servers (9개)

| MCP | 용도 | 우선순위 |
|-----|------|:-------:|
| `serena` | 코드 검색, 심볼 분석, 메모리 | 높음 |
| `context7` | 라이브러리 공식 문서 | 높음 |
| `sequential-thinking` | 복잡한 리팩토링, 아키텍처 설계 | 높음 |
| `stitch` | Google Stitch AI UI 디자인 | 중간 |
| `supabase` | PostgreSQL 관리 | 중간 |
| `vercel` | 배포 상태 확인 | 중간 |
| `playwright` | E2E 테스트 | 중간 |
| `github` | 저장소/PR 관리 | 중간 |
| `tavily` | 심층 리서치, 팩트체크 | 낮음 |

## Skills (10개)

### 코드 품질
| Skill | 설명 |
|-------|------|
| `review` | 코드 품질 체크 (lint + type-check) |
| `lint-smoke` | Lint + 테스트 스모크 |

### 분석/진단
| Skill | 설명 |
|-------|------|
| `security-audit-workflow` | OWASP Top 10 보안 감사 |
| `playwright-triage` | E2E 테스트 실패 분류 |
| `next-router-bottleneck` | 라우터 성능 분석 |
| `observability-check` | AI 모니터링 (Langfuse + Sentry) |

### 배포/Git/비용
| Skill | 설명 |
|-------|------|
| `cloud-run-deploy` | Cloud Run AI Engine 배포 |
| `gcp-cost-check` | GCP 비용 조회, Free Tier 사용량 분석 |
| `commit-commands` | Git 커밋 워크플로우 (commit, commit-push-pr, clean_gone) |

### 문서
| Skill | 설명 |
|-------|------|
| `mermaid-diagram` | 다이어그램 생성 |

## CLI Tools (WSL)

| CLI | 용도 | 비고 |
|-----|------|------|
| `claude` | 코드 생성/수정/리뷰 | 현재 세션 |

## Built-in Subagents (5개)

| Agent | 용도 |
|-------|------|
| `Explore` | 코드베이스 탐색 (quick/medium/thorough) |
| `Plan` | 구현 계획 설계 |
| `general-purpose` | 범용 리서치 |
| `claude-code-guide` | Claude Code 공식 문서 |
| `statusline-setup` | 상태라인 설정 |

## Permission Pattern (Best Practice)

```json
{
  "permissions": {
    "allow": [
      "Bash(command:*)",
      "Skill(skill-name)",
      "MCP-Server:*",
      "mcp__server__*"
    ]
  }
}
```

- Bash: 와일드카드 패턴 사용 (`npm:*`, `git:*`)
- MCP: 서버별 와일드카드 (`mcp__serena__*`)
- API Key: 환경변수 사용, 하드코딩 금지

---

**See Also**: 상세 문서 → `docs/vibe-coding/` (mcp-servers.md, skills.md, ai-tools.md)
