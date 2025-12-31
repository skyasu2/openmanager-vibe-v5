# Claude Code 기능 가이드

Claude Code CLI의 주요 기능과 활용법

## 핵심 기능

### 1. 기본 서브에이전트 (5개)

| 서브에이전트 | 용도 |
|-------------|------|
| `general-purpose` | 범용 리서치, 코드 검색 |
| `Explore` | 코드베이스 탐색 |
| `Plan` | 구현 계획 설계 |
| `claude-code-guide` | Claude Code 문서 안내 |
| `statusline-setup` | 상태라인 설정 |

### 2. 커스텀 스킬 (8개)

```bash
# 스킬 목록 확인
ls .claude/skills/
```

주요 스킬: `ai-code-review`, `lint-smoke`, `security-audit-workflow`, `validation-analysis`

### 3. MCP 서버 (9개)

```bash
# MCP 상태 확인
claude mcp list
```

주요 서버: serena, context7, vercel, supabase, playwright, figma, github, tavily, brave-search

---

**관련**: [공통 가이드](../common/) | [AI Registry](../../../../config/ai/registry-core.yaml)
