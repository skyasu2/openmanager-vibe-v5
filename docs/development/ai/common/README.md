# AI 공통 문서

> **최종 갱신**: 2025-12-31
> **문서 수**: 4개 (9개에서 통합)

---

## Quick Start

```bash
# 자동 코드 리뷰 (커밋 시)
git commit -m "feat: 기능"  # → 3-AI 순환

# 수동 래퍼 호출
Task codex-wrapper "실무 검토"
Task gemini-wrapper "아키텍처 분석"
Task qwen-wrapper "성능 최적화"
```

---

## Document Index

| 문서 | 설명 | 내용 |
|------|------|------|
| [ai-standards.md](./ai-standards.md) | 코딩 규칙 + DO/DON'T | 표준, 가이드라인 통합 |
| [ai-cli-guide.md](./ai-cli-guide.md) | CLI 명령어 + 벤치마크 | 래퍼, 검증, 성능 통합 |
| [ai-workflow.md](./ai-workflow.md) | 협업 워크플로우 + 성공 사례 | 아키텍처, 케이스 통합 |
| [ai-wrappers-guide.md](./ai-wrappers-guide.md) | 래퍼 스크립트 상세 | 기술 레퍼런스 |

---

## AI 역할 요약

| AI 도구 | 주 역할 | 호출 방법 |
|---------|---------|-----------|
| **Claude Code** | 메인 개발, 최종 결정 | 직접 |
| **Codex (GPT-5)** | 실무 검증, 호환성 | `Task codex-wrapper` |
| **Gemini 2.5** | 시스템 분석, 아키텍처 | `Task gemini-wrapper` |
| **Qwen 2.5** | 알고리즘, 성능 최적화 | `Task qwen-wrapper` |

---

## Archived Documents

통합된 문서들은 `docs/archive/ai/`로 이동:

- `ai-coding-standards.md` → ai-standards.md로 통합
- `ai-usage-guidelines.md` → ai-standards.md로 통합
- `cli-strategy.md` → ai-cli-guide.md로 통합
- `verification.md` → ai-cli-guide.md로 통합
- `ai-benchmarks.md` → ai-cli-guide.md로 통합
- `workflow.md` → ai-workflow.md로 통합
- `ai-collaboration-architecture.md` → ai-workflow.md로 통합

---

## Related

- [Claude Code](../claude-code/) - Claude 설정
- [Codex](../codex/) - Codex 설정
- [Gemini](../gemini/) - Gemini 설정
- [Qwen](../qwen/) - Qwen 설정

---

**핵심 철학**: "각 AI의 강점을 활용한 교차 검증으로 품질 보장"
