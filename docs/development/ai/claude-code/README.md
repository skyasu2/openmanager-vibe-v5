---
id: claude-code-features
title: Claude Code 전용 기능
keywords: [claude-code, subagent, task, cli, automation]
priority: high
ai_optimized: true
related_docs:
  - 'subagents-complete-guide.md'
  - '../common/workflow.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# Claude Code 전용 기능

Claude Code CLI의 고유 기능 (서브에이전트 등)

## 문서 목록

| 문서 | 설명 |
|------|------|
| [subagents-complete-guide.md](./subagents-complete-guide.md) | 9개 서브에이전트 완전 가이드 |
| [weekly-subagent-reminder.md](./weekly-subagent-reminder.md) | 주간 서브에이전트 리마인더 |

## 빠른 참조

```bash
# 서브에이전트 호출
Task code-review-specialist "변경사항 리뷰"
Task debugger-specialist "버그 근본 원인 분석"
Task security-specialist "보안 감사"
Task test-automation-specialist "테스트 실행"
```

---

**관련**: [공통 가이드](../common/) | [AI Registry](../../../../config/ai/registry-core.yaml)
