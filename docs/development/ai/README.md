---
category: development-ai
purpose: development_ai_tools
last_updated: '2025-12-08'
---

# 개발용 AI (Claude, Codex, Gemini, Qwen)

개발 시 사용하는 AI 도구 및 방법론

## 필수 문서

| 문서 | 설명 | 중요도 |
|------|------|--------|
| [subagents-complete-guide.md](./subagents-complete-guide.md) | 9개 서브에이전트 활용법 | HIGH |
| [ai-coding-standards.md](./ai-coding-standards.md) | AI 코딩 규칙 통합 | HIGH |
| [ai-usage-guidelines.md](./ai-usage-guidelines.md) | AI 사용 가이드라인 | HIGH |

## 도구별 가이드

| 문서 | 설명 |
|------|------|
| [ai-wrappers-guide.md](./ai-wrappers-guide.md) | Codex/Gemini/Qwen 래퍼 가이드 |
| [ai-benchmarks.md](./ai-benchmarks.md) | AI 도구 성능 비교 |
| [qwen-timeout-analysis-and-fix.md](./qwen-timeout-analysis-and-fix.md) | Qwen 타임아웃 문제 해결 |
| [cli-strategy.md](./cli-strategy.md) | CLI 전략 |

## 워크플로우

| 문서 | 설명 |
|------|------|
| [ai-collaboration-architecture.md](./ai-collaboration-architecture.md) | Multi-AI 협업 방법론 |
| [workflow.md](./workflow.md) | 개발 워크플로우 |
| [verification.md](./verification.md) | 검증 시스템 |
| [weekly-subagent-reminder.md](./weekly-subagent-reminder.md) | 주간 리마인더 |

---

## 빠른 참조

```bash
# 서브에이전트 호출
Task code-review-specialist "변경사항 리뷰"
Task debugger-specialist "버그 근본 원인 분석"

# CLI 도구
codex exec "코드 리뷰"
gemini "아키텍처 검토"
qwen -p "성능 분석"
```

---

**관련**: [배포용 AI](../../core/ai/) | [AI Registry](../../../config/ai/registry-core.yaml)
