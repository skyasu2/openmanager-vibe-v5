# CLAUDE.md - OpenManager VIBE v7.0.1

**한국어로 우선 대화, 기술용어는 영어 사용 허용**

## 📦 프로젝트 개요
**OpenManager VIBE** - AI Native Server Monitoring Platform
- **Stack**: Next.js 16.1.1, React 19, Supabase, Vercel AI SDK v6
- **Architecture**: Vercel (Frontend) + Cloud Run (AI Engine)
- **AI Engine**: @ai-sdk-tools/agents 기반 Multi-Agent
- **Environment**: WSL + Claude Code + Multi-LLM Review

## 🚀 Quick Commands
```bash
npm run dev:network         # 개발 서버
npm run validate:all        # 전체 검증
npm run release:patch       # 버전 릴리스
```

## 📋 Rules (자동 로드)
상세 규칙은 `.claude/rules/`에서 자동으로 로드됩니다:
- `code-style.md` - 코드 스타일, TypeScript 규칙
- `architecture.md` - 하이브리드 아키텍처
- `ai-tools.md` - MCP, Skills, CLI 도구
- `testing.md` - 테스트 전략
- `deployment.md` - 배포 워크플로우
- `env-sync.md` - 환경변수 동기화

## 📂 참조
- **상태**: `docs/status.md`
- **문서**: `docs/` (46개 파일)
- **AI 설정**: `config/ai/registry-core.yaml`
- **TODO**: `reports/planning/TODO.md`

_Last Updated: 2026-01-26_
