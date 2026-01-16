# 개발용 AI 도구

> **최종 갱신**: 2026-01-08
> **Note**: Qwen 제거 (2026-01-07) - 2-AI 시스템으로 단순화

개발 시 사용하는 AI 도구 및 방법론

## 디렉토리 구조

```
docs/guides/ai/
├── claude-code/           # Claude Code 기능 가이드
│   └── README.md          # 기본 서브에이전트 + 스킬 + MCP
│
├── common/                # 공통/Multi-AI
│   ├── ai-standards.md    # 코딩 규칙 통합
│   ├── ai-cli-guide.md    # CLI + 벤치마크 통합
│   ├── ai-workflow.md     # 워크플로우 통합
│   └── ai-wrappers-guide.md
│
└── README.md              # 이 파일
```

## 도구별 가이드

| 도구 | 버전 | 역할 | 가이드 |
|------|------|------|--------|
| Claude Code | v2.1.7 | Lead + MCP + 스킬 | [claude-code/](./claude-code/) |
| Codex | v0.85.0 | 2-AI 순환 (Primary) | [common/](./common/) |
| Gemini | v0.24.0 | 2-AI 순환 (Secondary) | [common/](./common/) |

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

**관련**: [배포용 AI](../../reference/ai/) | [AI Registry](../../../config/ai/registry-core.yaml)
