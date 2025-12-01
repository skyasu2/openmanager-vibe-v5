---
category: environment
purpose: local_development_environment_setup
ai_optimized: true
query_triggers:
  - '개발 환경 설정'
  - 'WSL 설정'
  - 'AI 도구 설정'
related_docs:
  - 'docs/development/README.md'
  - 'docs/environment/wsl/wsl-optimization.md'
last_updated: '2025-12-01'
---

# 💻 Environment 문서 (개발 환경)

**로컬에서 개발하기 위한 환경 설정 및 도구 문서**

## 🎯 목적

이 디렉터리는 **개발자가 로컬에서 개발하기 위한 모든 설정**에 관한 문서를 포함합니다.

- WSL, Node.js 환경 설정
- Claude Code, AI 도구 (Codex, Gemini, Qwen)
- 개발 워크플로우 및 트러블슈팅

## 📂 디렉터리 구조

```
environment/
├── wsl/                   # WSL 설정
├── tools/                 # 개발 도구 (Claude Code, MCP, AI CLI)
├── workflows/             # 개발 워크플로우
├── testing/               # 테스트 전략
├── troubleshooting/       # 문제 해결
└── guides/                # 개발 가이드
```

## 📚 주요 문서

### WSL 환경 (wsl/)
- **[WSL Optimization](./wsl/wsl-optimization.md)**: WSL 최적화 가이드
- **[WSL Monitoring](./wsl/wsl-monitoring-guide.md)**: WSL 모니터링

### 개발 도구 (tools/)
- **[Claude Code](./tools/claude-code/claude-code-v2.0.31-best-practices.md)**: Claude Code 베스트 프랙티스
- **[MCP Setup](./tools/mcp/README.md)**: MCP 서버 설정 가이드
- **[AI Tools](./tools/ai-tools/README.md)**: AI 시스템 전체 개요

### 개발 워크플로우 (workflows/)
- **[Build & Test Strategy](./workflows/build-test-strategy.md)**: 빌드 및 테스트 전략
- **[Performance Optimization](./workflows/performance-optimization-guide.md)**: 성능 최적화

## 💡 빠른 시작

1. **WSL 설정**: `wsl/wsl-optimization.md` 참조
2. **Claude Code 설정**: `tools/claude-code/` 참조
3. **AI 도구 설정**: `tools/ai-tools/README.md` 참조
4. **MCP 서버 설정**: `tools/mcp/README.md` 참조
