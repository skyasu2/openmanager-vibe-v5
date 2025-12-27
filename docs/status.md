# 프로젝트 현재 상태

**마지막 업데이트**: 2025-12-27

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
- **Upstash**: Serverless Redis (Caching & Rate Limiting)
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
- **Models**: Triple-provider 전략 (Rate limit 최적화, 2025-12-27)
  - Groq llama-3.3-70b: Supervisor (LangGraph handoff 필수)
  - Cerebras llama-3.3-70b: NLQ, Analyst, Reporter (24M 토큰/일)
  - Mistral Small 3.2 (24B): Verifier Agent
- **Tools**: MCP (Model Context Protocol) 9/9 Server Connected
- **Web Search**: DuckDuckGo (Reporter Agent, duck-duck-scrape)
- **Note**: Groq 한도 시 자동 Cerebras 폴백

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

## 🔧 최근 유지보수 (2025-12-09 ~ 12-27)

**Async Job Queue + SSE 실시간 알림 시스템 (2025-12-27)**
- **목적**: Vercel 120초 타임아웃 우회 (기존 111초 응답 → 즉시 반환)
- **아키텍처**: Store-and-Retrieve 패턴 (Upstash HTTP Redis 호환)
  - Vercel: Job 생성 → Cloud Run: 백그라운드 처리 → Redis: 결과 저장 → SSE: 실시간 전달
- **신규 파일**:
  - `cloud-run/ai-engine/src/routes/jobs.ts` - Cloud Run Job 처리 엔드포인트
  - `cloud-run/ai-engine/src/lib/job-notifier.ts` - Redis 결과 저장
  - `src/app/api/ai/jobs/[id]/stream/route.ts` - Vercel SSE 스트리밍
  - `src/hooks/ai/useAsyncAIQuery.ts` - Frontend React Hook
- **효율**: Redis 명령어 93% 절감 (폴링 90K → SSE 6K/월)
- **호환성**: 기존 `/api/ai/jobs/*` API 100% 호환 유지

**NLQ Agent SubGraph 아키텍처 + 모델 분배 최적화 (2025-12-26)**
- **NLQ SubGraph 구현**: 5노드 워크플로우 (parse→extract→validate→execute→format)
  - `getServerMetricsAdvancedTool`: 시간 범위/필터/집계 지원
  - 한국어 자연어 파싱 헬퍼 함수 (시간, 메트릭, 필터)
  - 21개 단위 테스트 추가
- **Dual-provider 전략**: Rate limit 분산 (~1M TPM 무료)
  - Groq: Supervisor, NLQ, Analyst, Reporter (LangGraph handoff 필수)
  - Mistral: Verifier (24B 품질 검증)
- **신규 파일**: `nlq-state.ts`, `nlq-subgraph.ts`, `nlq-state.test.ts`
- **검증**: Cloud Run ai-engine-00036 배포, Health Check 정상

**Mock System SSOT 통합 및 로그 시스템 개선 (v5.83.12, 2025-12-25)**
- **SSOT 통합**: 모든 Mock 데이터 소스를 한국 데이터센터 기반 15개 서버로 통일
  - 서버 ID 표준화: `web-nginx-icn-01`, `db-mysql-icn-primary` 등
  - 시나리오 파일 업데이트: `dbOverload.ts`, `cacheFailure.ts`, `networkBottleneck.ts`, `storageFull.ts`
- **AI Agent 로그 시스템 개선**: 시나리오 이름 노출 제거 (스포일러 방지)
  - 변경 전: `[CRITICAL] 심야 DB 디스크 풀 detected` (정답 직접 노출)
  - 변경 후: `[ERROR] mysqld: Disk full (errcode: 28)` (증상만 표시)
  - AI가 로그 패턴을 분석하여 원인을 추론해야 함
- **서버 타입별 실제 로그 템플릿 구현**: MySQL, Redis, Nginx, HAProxy, NFS 등
- **변경 파일**: 16개 파일 (1,699 추가 / 1,300 삭제)

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
