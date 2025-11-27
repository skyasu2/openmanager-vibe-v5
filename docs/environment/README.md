# 💻 Environment 문서 (개발 환경)

**로컬에서 개발하기 위한 환경 설정 및 도구 문서**

---

## 🎯 목적

이 디렉터리는 **개발자가 로컬에서 개발하기 위한 모든 설정**에 관한 문서를 포함합니다.

- WSL, Node.js 환경 설정
- Claude Code, AI 도구 (Codex, Gemini, Qwen)
- 개발 워크플로우 및 트러블슈팅

---

## 📂 디렉터리 구조

```
environment/
├── wsl/                   # WSL 설정 (2개 파일)
├── tools/                 # 개발 도구
│   ├── claude-code/      # Claude Code (3개 파일)
│   ├── mcp/              # MCP 서버
│   └── ai-tools/         # AI CLI 도구 (15개 파일)
│
├── workflows/             # 개발 워크플로우 (3개 파일)
├── testing/               # 테스트 전략
├── troubleshooting/       # 문제 해결
├── guides/                # 개발 가이드
└── claude/                # Claude Code 환경
```

---

## 🖥️ WSL 환경 (wsl/)

**Windows Subsystem for Linux 설정**

- **wsl-optimization.md** - WSL 최적화 가이드
- **wsl-monitoring-guide.md** - WSL 모니터링

---

## 🔧 개발 도구 (tools/)

### Claude Code (tools/claude-code/)

- **claude-code-v2.0.31-best-practices.md** - Claude Code 베스트 프랙티스
- **claude-code-hooks-guide.md** - Hooks 가이드
- **claude-workflow-guide.md** - 워크플로우 가이드

### MCP 서버 (tools/mcp/)

- **README.md** - MCP 서버 설정 가이드
- **mcp-priority-guide.md** - MCP 우선순위 가이드
- 기타 MCP 설정 파일들

### AI 도구 (tools/ai-tools/)

**Codex, Gemini, Qwen, Claude AI 시스템**

- **README.md** - AI 시스템 전체 개요
- **subagents-complete-guide.md** - 서브에이전트 가이드
- **ai-coding-standards.md** - AI 코딩 규칙
- **ai-benchmarks.md** - AI 벤치마크
- **ai-usage-guidelines.md** - AI 사용 가이드
- 기타 AI 관련 문서 (15개)

---

## 🔄 개발 워크플로우 (workflows/)

**로컬 개발 프로세스**

- **build-test-strategy.md** - 빌드 및 테스트 전략
- **progressive-lint-guide.md** - 린트 가이드
- **performance-optimization-guide.md** - 성능 최적화

---

## 🧪 테스트 & 트러블슈팅

### testing/

- 테스트 전략 (Vitest, Playwright, E2E)
- 테스트 철학 및 상세 가이드

### troubleshooting/

- 문제 해결 가이드
- 일반적인 이슈 및 해결책

### guides/

- 개발 가이드 모음

### claude/

- Claude Code 환경 설정 및 워크플로우

---

## 💡 빠른 시작

1. **WSL 설정**: `wsl/wsl-optimization.md` 참조
2. **Claude Code 설정**: `tools/claude-code/` 참조
3. **AI 도구 설정**: `tools/ai-tools/README.md` 참조
4. **MCP 서버 설정**: `tools/mcp/README.md` 참조

---

**Last Updated**: 2025-11-27
**용도**: 로컬 개발 환경 설정
