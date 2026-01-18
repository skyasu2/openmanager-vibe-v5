# 개발용 AI 도구

> **최종 갱신**: 2026-01-18
> **Note**: Qwen 제거 (2026-01-07) - 2-AI 시스템으로 단순화

개발 시 사용하는 AI 도구 및 방법론

## 디렉토리 구조

```
docs/guides/ai/
├── common/                # 공통/Multi-AI
│   └── ai-standards.md    # 코딩 규칙 통합
└── README.md              # 이 파일
```

> **참고**: Claude Code 상세 가이드는 `.claude/rules/ai-tools.md` 참조

## 도구별 가이드

| 도구 | 버전 | 역할 | 가이드 |
|------|------|------|--------|
| Claude Code | v2.1.7 | Lead + MCP + 스킬 | [.claude/rules/ai-tools.md](../../../.claude/rules/ai-tools.md) |
| Codex | v0.85.0 | 2-AI 순환 (Primary) | [ai-standards.md](./common/ai-standards.md) |
| Gemini | v0.24.0 | 2-AI 순환 (Secondary) | [ai-standards.md](./common/ai-standards.md) |

## 빠른 참조

```bash
# Claude Code 스킬
/review                   # AI 코드 리뷰 결과 확인
Skill ai-code-review      # Multi-AI 리뷰 실행

# CLI 도구 (2-AI 순환)
codex exec "코드 리뷰"
gemini "아키텍처 검토"
```

---

**관련**: [AI Architecture](../../reference/architecture/ai/) | [AI Registry](../../../config/ai/registry-core.yaml)
