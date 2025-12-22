# 프로젝트 현재 상태

**마지막 업데이트**: 2025-12-22

---

## 🏗️ Technical Stack (v5.83.9)

**Core Frameworks** (2025 Standard)
- **Next.js**: `v16.0.10` (App Router, Server Components, Security Patch)
- **React**: `v19.2.1` (RSC, Actions, useOptimistic)
- **TypeScript**: `v5.9.3` (Strict Mode)
- **Node.js**: `v22.21.1` (LTS Fixed)

**UI & Styling**
- **Tailwind CSS**: `v4.1.17` (PostCSS optimized)
- **Component Lib**: Radix UI (Latest), Lucide React `v0.556.0`
- **Animation**: Framer Motion (via `tailwindcss-animate`)

**State & Data**
- **Zustand**: Global client state
- **React Query**: Server state synchronization
- **Supabase**: PostgreSQL + Realtime + Auth
- **GraphRAG**: Knowledge Graph + Vector Search Hybrid (pgvector 기반)
- **Code Interpreter**: Browser-based Python (Pyodide WebAssembly)

## 📚 Documentation Status

**총 문서 수**: 184개 (최적화 완료)
- **Core**: 55개 (아키텍처, AI, 성능, 보안, 플랫폼)
- **Development**: 71개 (AI 도구, MCP, 테스팅, 표준, 워크플로우)
- **Environment**: 14개 (WSL, Docker, 트러블슈팅)
- **Planning**: 17개 (분석, 템플릿)
- **Archive**: 22개 (정리 완료)
- **API**: 1개 (통합 완료)
- **Root**: 4개 (README, QUICK-START 등)

**최근 최적화**:
- 중복 문서 제거: 42개 (아카이브) + 16개 (일반)
- 통합 완료: MCP, Docker, AI 도구, 아키텍처
- 구조 정리: design→architecture, specs→planning
- **State Mgmt**: Zustand `v5.0.9`
- **Data Fetching**: TanStack Query `v5.90.11`
- **Backend/DB**: Supabase JS `v2.87.1` (SSR `v0.8.0`)
- **Utility**: tailwind-merge `v3.4.0`

**AI Ecosystem**
- **SDK**: Vercel AI SDK `v5.0.102` (`@ai-sdk/*` 패키지 포함)
- **Models**: Google Gemini 2.5 Flash (Primary), Claude 3.5 Sonnet (Fallback)
- **Tools**: MCP (Model Context Protocol) 9/9 Server Connected

**AI CLI Tools** (2025-12-17 기준)
- **Claude Code**: `v2.0.71` (Interactive Development)
- **Codex CLI**: `v0.73.0` (Code Review - 3-AI Rotation)
- **Gemini CLI**: `v0.21.0` (Code Review - 3-AI Rotation)
- **Qwen CLI**: `v0.5.0` (Code Review - 3-AI Rotation)
- **Kiro CLI**: `v1.22.0` (Terminal Multi-Agent Orchestrator)

**Quality Control**
- **Test**: Vitest `v4.0.15`, Playwright `v1.57.0`
- **Lint/Format**: Biome `v2.3.8`

---

## 🔧 최근 유지보수 (2025-12-09 ~ 12-22)

**AI 어시스턴트 스트리밍 수정 (v5.83.9, 2025-12-22)**
- **문제 1**: AI SDK v5가 `parts` 배열 형식으로 메시지 전송 → Cloud Run 503 에러
  - 해결: `normalizeMessagesForCloudRun()` 함수 추가 (parts → content 변환)
- **문제 2**: `DefaultChatTransport`가 SSE JSON 기대 → Cloud Run plain text 스트림과 불일치
  - 해결: `TextStreamChatTransport`로 변경 (plain text 스트림 처리)
- **변경 파일**:
  - `src/domains/ai-sidebar/components/AISidebarV4.tsx`
  - `src/app/api/ai/supervisor/route.ts`
- **검증**: Vercel 프로덕션에서 브라우저 테스트 통과

**기술 부채 검토 완료 (v5.81.0)**
- **Next.js 보안 패치**: 16.0.7 → 16.0.10 (CVE 대응)
- **핵심 로직 테스트**: AuthStateManager, LangGraph Supervisor 테스트 추가
- **패키지 최적화**: react-markdown 제거 (미사용, 78개 의존성 정리)
- **메이저 업그레이드**: tailwind-merge v3, @faker-js/faker v10

**패키지 전체 업그레이드 완료 (v5.80.0)**
- Next.js 15 → 16, React 18 → 19, TS 5.7 → 5.9 마이그레이션 완료.
- **Critical Fix**: Node.js `global` 객체 이슈 (`global` -> `globalThis`) 해결.

**코드 리뷰 시스템 (v6.9.0)**
- **구조**: 3-AI 순환 (Codex → Gemini → Qwen) + 상호 폴백 시스템.

---

## 📊 품질 지표 (2025-12-17 기준)

| Metric | Status | Detail |
|:---:|:---:|---|
| **Build** | ✅ Passing | `npm run build` (Next.js 16.0.10) 성공 |
| **Test** | ✅ 100% | 92/92 Tests Passing (Super-fast mode) |
| **Lint** | ✅ Clean | Biome Check Pass (No Errors) |
| **E2E** | ✅ 100% | 30/30 Scenarios Passing (Playwright) |
| **MCP** | ✅ 9/9 | 모든 MCP 서버 정상 연결 (Figma 포함) |
| **Vercel** | ✅ Deployed | Production 배포 정상 |

---

## 📝 문서 관리 현황

**최적화 진행 (JBGE 원칙)**
- 문서 수: 184개 (최적화 완료)
- 관리 원칙: 400줄 이하 유지, 관련 내용 통합, 중복 제거.
- **Key Docs**:
  - `README.md`: 프로젝트 개요
  - `docs/status.md`: 기술 스택 및 상태 대시보드 (본 문서)
  - `config/ai/registry-core.yaml`: AI 설정 SSOT

---

## 💰 리소스 효율

- **비용**: 월 $0 유지 (Free Tier 활용 최적화)
- **Token**: Context Caching & MCP 필터링으로 85% 절감
- **Performance**:
  - Dev Server: ~22s startup
  - Test Suite: ~21s execution
