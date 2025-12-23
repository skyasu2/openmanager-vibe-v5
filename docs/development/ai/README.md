# 개발용 AI 도구

개발 시 사용하는 AI 도구 및 방법론

## 디렉토리 구조

```
docs/development/ai/
├── claude-code/           # Claude Code 기능 가이드
│   └── README.md          # 기본 서브에이전트 + 스킬 + MCP
│
├── codex/                 # OpenAI Codex CLI
│   └── README.md
│
├── gemini/                # Google Gemini CLI
│   └── README.md
│
├── qwen/                  # Alibaba Qwen CLI
│   ├── qwen-timeout-analysis-and-fix.md
│   └── README.md
│
├── common/                # 공통/Multi-AI
│   ├── ai-coding-standards.md
│   ├── ai-collaboration-architecture.md
│   ├── ai-benchmarks.md
│   ├── ai-usage-guidelines.md
│   ├── ai-wrappers-guide.md
│   ├── cli-strategy.md
│   ├── verification.md
│   └── workflow.md
│
└── README.md              # 이 파일
```

## 도구별 가이드

| 도구 | 버전 | 역할 | 가이드 |
|------|------|------|--------|
| Claude Code | v2.0.71 | Lead + MCP + 스킬 | [claude-code/](./claude-code/) |
| Codex | v0.63.0 | Primary 3-AI 순환 | [codex/](./codex/) |
| Gemini | v0.19.1 | Primary 3-AI 순환 | [gemini/](./gemini/) |
| Qwen | v0.4.0 | Fallback 리뷰 | [qwen/](./qwen/) |

## 빠른 참조

```bash
# Claude Code 스킬
/review                   # AI 코드 리뷰 결과 확인
Skill ai-code-review      # Multi-AI 리뷰 실행

# CLI 도구
codex exec "코드 리뷰"
gemini "아키텍처 검토"
qwen -p "성능 분석"
```

---

**관련**: [배포용 AI](../../core/ai/) | [AI Registry](../../../config/ai/registry-core.yaml)
