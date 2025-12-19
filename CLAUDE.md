# CLAUDE.md - OpenManager VIBE v5.83.1

**한국어로 우선 대화, 기술용어는 영어 사용 허용**

## 📦 프로젝트 개요
**OpenManager VIBE** (v5.83.1) - AI Native Server Monitoring Platform
- **Frontend/BFF**: Next.js 16, React 19 (Vercel Edge Runtime)
- **AI Engine**: LangGraph Multi-Agent (Google Cloud Run)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Environment**: WSL + Claude Code + Multi-LLM Review

---

## 🚀 워크플로우 (Quick Start)

### 1. 개발 및 검증
```bash
npm run dev:network         # 개발 서버 (WSL 외부 접속 가능)
npm run validate:all        # 전체 검증 (Lint + Type + Test)
npm run test:vercel:e2e     # E2E 테스트 (Cloud Run 통합 검증)
```

### 2. 버전 관리 (Lock-Step Versioning)
`.versionrc` 설정을 통해 **Next.js Root와 Cloud Run AI Engine 패키지 버전이 자동 동기화**됩니다.
```bash
npm run release:patch       # 버그 수정 (예: 5.83.1 -> 5.83.2)
npm run release:minor       # 기능 추가 (예: 5.83.1 -> 5.84.0)
git push --follow-tags      # 태그 푸시 -> 배포 파이프라인 트리거
```

### 3. 배포 (Deployment)
- **Frontend**: `git push` 시 Vercel 자동 배포
- **AI Engine**: Tag 생성(`v5.xx.x`) 시 Cloud Run 자동 빌드/배포 (설정 예정/수동)

---

## 💡 핵심 원칙 (Core Principles)

1.  **Hybrid Architecture**:
    - UI/Interactive: **Vercel** (Speed, Edge)
    - AI Computation: **Cloud Run** (Heavy Lifting, LangGraph)
2.  **Type-First & Safety**:
    - `any` 사용 절대 금지, `TypeScript strict` 준수.
    - AI 엔진 장애 시에도 UI가 멈추지 않는 **Graceful Degradation** 필수.
3.  **Production Resilience**:
    - Circuit Breaker, Failover 로직(Key/Model) 유지.
4.  **Efficiency**:
    - 중복 코드 지양, MCP와 AI CLI 도구를 적극 활용하여 효율 극대화.

---

## 🤖 AI 협업 가이드 (AI Native)

### 서브에이전트 & MCP 활용
- **코드/구조 파악**: `@serena "이 기능 구현된 파일 찾아줘"`
- **최신 스펙 확인**: `@context7 "Next.js 16 Server Actions 문서"`
- **외부 리서치**: `@brave-search` / `@tavily`

### CLI 도구 활용 (WSL)
- **코드 자동 생성/수정**: `claude "기능 구현해줘"`
- **로직 교차 검증**: `cat file.ts | gemini "잠재적 버그 리뷰"`
- **명령어 실행**: `npm run` 등은 권한 허용됨, 적극적 실행.

---

## 📂 주요 참조 (References)
- **프로젝트 상태**: `@docs/status.md`
- **AI 레지스트리**: `@config/ai/registry-core.yaml`
- **투두 리스트**: `@reports/planning/TODO.md`

_Last Updated: 2025-12-17_
