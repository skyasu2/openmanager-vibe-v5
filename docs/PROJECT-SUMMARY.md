# OpenManager VIBE v5 — Project Summary (간단 요약)

목적

- AI 중심의 포트폴리오형 플랫폼(Claude Code + MCP 통합) 개발용 레포지토리

핵심 기술 스택

- Frontend: Next.js 15 (App Router), React 18, TypeScript(strict), Tailwind
- Backend: Edge runtime, GCP Functions, Supabase(Postgres + pgVector)
- AI: Claude Code 중심, Google/Gemini, Qwen 등 보조 에이전트

개발 환경(권장)

- WSL2 (Ubuntu 24.04)에서 주 개발. Windows IDE로 병행 가능.
- Node >= 20 (권장: 22.18.0+), npm 10+

중요한 루트 파일/폴더

- `package.json` — 스크립트/의존성/엔진 요구
- `README.md`, `docs/QUICK-START.md` — 시작 가이드
- `docs/` — 프로젝트 문서(시스템/AI/MCP/가이드 등)
- `.claude/` — Claude Code 에이전트·설정(IDE AI용 컨텍스트)
- `.mcp.json` — MCP 설정(모델 컨텍스트 프로토콜)
- `scripts/`, `local-dev/` — 실행·배포·개발 보조 스크립트

주요 개발 스크립트(자주 사용)

- `npm install`
- `npm run dev` (로컬 개발)
- `npm run build` / `npm run start:prod`
- `npm run test:quick` (테스트 빠르게 실행)

IDE/AI(예: Copilot, Claude)에게 권장할 학습 포인트

1. 먼저 `docs/PROJECT-SUMMARY.md`, `README.md`, `package.json`, `docs/QUICK-START.md`를 읽게 하세요.
2. `.claude/`와 `.mcp.json`(있다면)에서 에이전트·컨텍스트 규칙을 확인하게 하세요.
3. `scripts/` 폴더를 인덱싱해 자주 쓰는 실행 흐름(automation, deployment, wsl setup)을 파악하게 하세요.

간단 자동화 제안

- 저장소 루트에 `project-structure.txt` (또는 `project-index.json`)를 정기 생성하여 IDE AI가 최신 트리를 받아 보게 하세요.

권장 다음 작업

1. IDE/AI가 인덱스로 참조할 `project-structure.txt` 생성(WSL에서 `tree -L 3 > project-structure.txt`)
2. `.vscode/ai-context` 또는 `.claude/context.md` 같은 위치에 추가 요약·필터링 규칙 생성
3. (옵션) `scripts/generate-ai-index.sh`를 추가해 자동 갱신 파이프라인 구성

이 파일은 요약용이고 AI/IDE가 우선적으로 읽을 항목을 정리했습니다. 다음으로 원하시면 `project-structure.txt`를 생성하거나 `.vscode/ai-context` 템플릿을 추가하겠습니다.
