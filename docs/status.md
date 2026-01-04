# 프로젝트 현재 상태

**마지막 업데이트**: 2026-01-04

---

## 🏗️ Technical Stack (v5.83.14)

**Core Frameworks** (2025 Standard)
- **Next.js**: `v16.1.1` (App Router, Server Components)
- **React**: `v19.2.1` (RSC, Actions, useOptimistic)
- **TypeScript**: `v5.9.3` (Strict Mode)
- **Node.js**: `v22.x` (LTS Fixed, engines: >=22.0.0 <23.0.0)

**UI & Styling**
- **Tailwind CSS**: `v4.1.17` (PostCSS optimized)
- **Component Lib**: Radix UI (Latest), Lucide React `v0.562.0`
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
- **Models**: Quad-provider 전략 (Rate limit 최적화, 2026-01-04)
  - Cerebras llama-3.3-70b: Orchestrator, NLQ (1M tokens/day, 60K TPM)
  - Groq llama-3.3-70b: Analyst, Reporter (~1K requests/day, 12K TPM)
  - Mistral Small 2506 (24B): Advisor, Verifier (Limited free tier)
  - OpenRouter Free: Summarizer (qwen-2.5-7b, llama-3.1-8b, 50 RPD)
- **Agents**: 6개 Multi-Agent (Orchestrator → NLQ/Analyst/Reporter/Advisor/Summarizer)
- **Tools**: MCP (Model Context Protocol) 9/9 Server Connected
- **Web Search**: Tavily API (Reporter Agent)
- **Note**: Provider 장애 시 자동 폴백 (Cerebras→Groq, Mistral→OpenRouter)

**AI CLI Tools** (2026-01-01 기준)
- **Claude Code**: `v2.0.76` (Interactive Development)
- **Codex CLI**: `v0.77.0` (Code Review - 3-AI Rotation)
- **Gemini CLI**: `v0.22.4` (Code Review - 3-AI Rotation)
- **Qwen CLI**: `v0.6.0` (Code Review - 3-AI Rotation)

**Quality Control**
- **Test**: Vitest `v4.0.15`, Playwright `v1.57.0`
- **Lint/Format**: Biome `v2.3.8`

---

## 🔧 최근 유지보수 (2025-12-09 ~ 12-30)

**AI Engine 안정성 개선 + Job Queue 최적화 (2025-12-30)**
- **Phase 1: Message Format 통합**
  - `extractTextFromMessage()` 중복 제거 → `src/lib/ai/utils/message-normalizer.ts`
  - AI SDK v5 parts[] + 레거시 content 하이브리드 지원
- **Phase 2: Circuit Breaker + Fallback**
  - `executeWithCircuitBreakerAndFallback()` 래퍼 추가 → `src/lib/ai/circuit-breaker.ts`
  - `createFallbackResponse()` 폴백 핸들러 → `src/lib/ai/fallback/ai-fallback-handler.ts`
  - 적용 API: supervisor, intelligent-monitoring, incident-report, approval
- **Phase 3: Response Caching**
  - `withAICache()` 캐시 래퍼 → `src/lib/ai/cache/ai-response-cache.ts`
  - Memory → Redis 2단계 캐싱, TTL 정책 적용
- **Job Queue SSE 진행률 개선**
  - Redis 초기 상태 저장 (pending, 5% progress) → Job 생성 즉시 SSE 진행률 표시
  - SSE 스트림에서 pending/null 상태 처리 개선
  - Redis 장애 시 Graceful Degradation (Supabase 기반 폴백)
- **신규 컴포넌트**:
  - `src/components/error/AIErrorBoundary.tsx` - AI 에러 바운더리
  - `src/domains/ai-sidebar/components/JobProgressIndicator.tsx` - 진행률 UI
  - `src/hooks/ai/useHybridAIQuery.ts` - Streaming/Job Queue 하이브리드 훅
  - `src/lib/utils/retry.ts` - Exponential Backoff Retry 유틸리티

**LangGraph 최적화 + RCA/Capacity Agent (2025-12-28)**
- **RCA Agent 추가**: 장애 타임라인 구축, 메트릭 상관관계 분석, 근본 원인 추론
- **Capacity Agent 추가**: 리소스 소진 예측, 스케일링 권장사항 생성
- **Agent Dependency System**: RCA/Capacity는 NLQ+Analyst 결과 필수 (SharedContext 기반)
- **Workflow 캐싱**: 5분 TTL로 초기화 오버헤드 감소
- **Dead Code 제거**: NLQ SubGraph 삭제 (~1,000 lines) - `getServerMetricsAdvanced`로 대체
- **Recursion Limit**: 8 → 10 (4-agent 체인 + retry 버퍼)
- **Web Search 교체**: DuckDuckGo → Tavily API
- **검증**: Cloud Run ai-engine-00064 배포 완료, Health Check 정상

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

## 🐳 Infrastructure Status (2026-01-04)

**Cloud Run AI Engine**
- **Service URL**: `https://ai-engine-490817238363.asia-northeast1.run.app`
- **Active Revision**: `ai-engine-00086-lhj` (2026-01-04 deployed)
- **Health**: ✅ All providers connected (Supabase, Upstash, Groq, Mistral, Cerebras, Tavily, OpenRouter)

**Container Registry (GCR)**
- **Images**: 2개 유지 (latest + rollback)
  - `v-20260104-120205-6c36e5964` (최신)
  - `v-20260104-115233-6c36e5964` (롤백용)

**GCS Storage**
- **Cloud Build**: ~700KB (최적화 완료)
- **Run Sources**: ~2.5MB
- **정리 정책**: 최신 2개 빌드만 유지

---

## 💰 리소스 효율

- **비용**: 월 $0 유지 (Free Tier 활용 최적화)
- **Token**: Context Caching & MCP 필터링으로 85% 절감
- **Performance**:
  - Dev Server: ~22s startup
  - Test Suite: ~21s execution
