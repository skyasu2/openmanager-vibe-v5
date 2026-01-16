# 프로젝트 현재 상태

**마지막 업데이트**: 2026-01-14

---

## 🏗️ Technical Stack (v5.87.0)

**Core Frameworks** (2025 Standard)
- **Next.js**: `v16.1.1` (App Router, Server Components)
- **React**: `v19.2.3` (RSC, Actions, useOptimistic)
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

**총 문서 수**: 34개 (경량화 완료, 122개→34개)
- **Reference**: 18개 (아키텍처, AI, API)
- **Guides**: 12개 (AI 도구, MCP, 테스팅, 표준)
- **Troubleshooting**: 2개 (문제 해결)
- **Root**: 4개 (README, QUICK-START, DEVELOPMENT, status)

**최근 최적화 (2026-01-14)**:
- 문서 경량화: 122개 → 34개 (72% 감소)
- 레거시 문서 → `reports/history/` 이동
- CHANGELOG 통합 (중복 제거)
- 버전 표기 통일 (v5.87.0)
- **State Mgmt**: Zustand `v5.0.9`
- **Data Fetching**: TanStack Query `v5.90.11`
- **Backend/DB**: Supabase JS `v2.87.1` (SSR `v0.8.0`)
- **Utility**: tailwind-merge `v3.4.0`

**AI Ecosystem**
- **SDK**: Vercel AI SDK `v5.0.102` (`@ai-sdk/*` 패키지 포함)
- **Models**: Tri-provider 전략 (Rate limit 최적화, 2026-01-16)
  - Cerebras llama-3.3-70b: Orchestrator, NLQ (1M tokens/day, 60K TPM)
  - Groq llama-3.3-70b: Analyst, Reporter (~1K requests/day, 12K TPM)
  - Mistral Small 2506 (24B): Advisor, Verifier (Limited free tier)
- **Agents**: 5개 Multi-Agent (Orchestrator → NLQ/Analyst/Reporter/Advisor)
- **Tools**: MCP (Model Context Protocol) 9/9 Server Connected
- **Web Search**: Tavily API (Reporter Agent)
- **Rate Limit**: Pre-emptive Fallback (80% 임계값 도달 시 사전 전환)
- **Note**: Provider 장애 시 자동 폴백 (Cerebras→Groq→Mistral)

**AI CLI Tools** (2026-01-16 기준)
- **Claude Code**: `v2.1.7` (Interactive Development)
- **Codex CLI**: `v0.85.0` (Code Review - 2-AI Rotation)
- **Gemini CLI**: `v0.24.0` (Code Review - 2-AI Rotation)

**Quality Control**
- **Test**: Vitest `v4.0.15`, Playwright `v1.57.0`
- **Lint/Format**: Biome `v2.3.8`

---

## 🔧 최근 유지보수 (2025-12-09 ~ 2026-01-10)

**AI SDK v5 Zod Schema 호환성 수정 (2026-01-10)**
- **문제**: 연속 NLQ 쿼리 시 400 에러 발생
  - 첫 쿼리는 성공 (text parts만 포함)
  - 두 번째부터 실패 (source, step-start 등 추가 parts 포함)
- **원인**: `z.discriminatedUnion`이 알 수 없는 part 타입에서 실패
- **해결**: `z.union`으로 변경 + fallback 패턴 추가
  ```typescript
  // Before: discriminatedUnion (엄격, 알 수 없는 타입 거부)
  // After: union + fallback (유연, AI SDK 업데이트 대응)
  z.object({ type: z.string() }).passthrough() // fallback
  ```
- **변경 파일**: `schemas.ts`, `stream/route.ts`
- **검증**: Vercel Production 4개 연속 NLQ 테스트 통과

**NLP Intent Classification 개선 + Streaming SSE (2026-01-09)**
- **Infrastructure Context Gating**: False Positive 감소를 위한 2단계 패턴 매칭
  - `multiAgentPatterns`: 항상 Multi-Agent 트리거 (보고서, 해결방법, 용량계획)
  - `contextGatedPatterns`: 인프라 컨텍스트 필수 (왜+메트릭, 예측/트렌드, 비교/대비)
  - `infraContext` 게이팅: `/서버|인프라|시스템|모니터링|cpu|메모리|디스크|트래픽|네트워크/i`
- **SSE Streaming 안정화**: AI Code Review 피드백 반영
  - Vercel → Cloud Run 스트리밍 프로토콜 개선
  - Response normalization 강화
- **Docker Artifact Registry 마이그레이션**: gcr.io → asia-northeast1-docker.pkg.dev
- **NLP 아키텍처 문서화**: `docs/ai-model-policy.md` 의도 분류 섹션 추가

**Agent SSOT 리팩토링 + Langfuse 무료 티어 보호 (2026-01-07)**
- **SSOT 패턴 적용**: Agent 설정 중앙화
  - `agents/config/agent-configs.ts`: Single Source of Truth
  - 5개 Agent Instructions 분리 (`instructions/*.ts`)
  - 코드 66-75% 감소 (872 → 249 lines, -404 lines)
  - orchestrator.ts 중복 AGENT_CONFIGS 제거 (~180 lines)
- **Provider 캐싱**: `checkProviderStatus()` 결과 캐싱 추가
  - API 키 체크 중복 호출 방지
  - `toggleProvider()` 시 캐시 무효화
- **Langfuse 무료 티어 보호 시스템**:
  - 10% 샘플링 기본 (월 ~450K 쿼리 지원)
  - 90% 임계값 자동 비활성화 (45K events)
  - 70%, 80% 경고 로그
  - 테스트 모드 지원 (100% 트레이싱)
  - `/monitoring/traces` 엔드포인트 추가
- **Cloud Run 무료 티어 최적화**:
  - CPU: 2 → 1 vCPU, Memory: 1Gi → 512Mi
  - Max Instances: 10 → 3
  - BuildKit 문법 제거 (Cloud Build 호환)
- **신규 Skill**: `cloud-run-deploy` (토큰 65% 절감)

**AI 분석 순수 메트릭 기반 전환 (2026-01-06)**
- **시나리오 힌트 제거**: AI가 사전 정의된 힌트 대신 원시 메트릭으로 분석
  - `rca-analysis.ts`: `getScenariosByServer` 제거, 메트릭 임계값 기반 가설 생성
  - `incident-report-tools.ts`: cascade 감지 및 타임라인을 메트릭 기반으로 변경
- **메트릭 기반 로그 생성**: 서버 타입별 로그 템플릿 추가
  - `fixed-24h-metrics.ts`: `generateMetricLogs()` 함수 추가
  - 서버 타입: web, database, cache, application, loadbalancer, storage
- **네트워크 메트릭 누락 수정**: `generateIncidentReport`에 Network 임계값 체크 추가
- **산업 표준 검증**: Prometheus, Datadog, Grafana 메트릭 호환성 확인

**Tavily Best Practices + P0 단위 테스트 (2026-01-04)**
- **Web Search 베스트 프랙티스 적용**:
  - Timeout: 10초 (무한 대기 방지)
  - Retry: 최대 2회 (transient errors 대응)
  - Cache: 5분 TTL (반복 쿼리 비용 절감)
  - Failover: Primary → Backup Key 자동 전환
- **P0 단위 테스트 추가** (AI Engine):
  - `config-parser.test.ts`: API 키 관리 18개 테스트
  - `reporter-tools.test.ts`: Web Search 9개 테스트
  - `orchestrator.test.ts`: Mock 수정 (`searchWeb` 추가)
- **총 테스트**: 92개 통과 (32+18+9+14+10+9)

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

**코드 리뷰 시스템 (v7.0.0)**
- **구조**: 2-AI 순환 (Codex ↔ Gemini) + 상호 폴백 시스템.
- **Note**: Qwen 제거 (2026-01-07) - 평균 201초 응답, 13.3% 실패율로 인한 단순화.

---

## 📊 품질 지표 (2026-01-04 기준)

| Metric | Status | Detail |
|:---:|:---:|---|
| **Build** | ✅ Passing | `npm run build` (Next.js 16.1.1) 성공 |
| **Test** | ✅ 100% | 92/92 Tests Passing (AI Engine P0 포함) |
| **Lint** | ✅ Clean | Biome Check Pass (No Errors) |
| **E2E** | ✅ 100% | 30/30 Scenarios Passing (Playwright) |
| **MCP** | ✅ 9/9 | 모든 MCP 서버 정상 연결 |
| **Vercel** | ✅ Deployed | Production 배포 정상 |

---

## 📈 Code Quality (2026-01-05)

| 영역 | 파일 수 | 코드 라인 | 점수 | 상태 |
|------|---------|----------|------|------|
| **Frontend** (Vercel) | 760+ | ~50,000+ | 85/100 | ✅ A- |
| **Backend** (Cloud Run) | 63 | ~18,700 | 87/100 | ✅ A- |

**분석 결과**:
- `any` 타입: Frontend 17개, Backend 5개 → 모두 의도적 사용 (브라우저 호환성, AI SDK 타입)
- 대형 파일: Frontend 5개, Backend 12개 → 모두 내부 구조 양호
- 코드량 분포: Frontend ~137,000 lines → 역할 대비 적정 (집중 영역 3곳 모두 정상)
- TypeScript strict: ✅ 양쪽 모두 PASS

**상세 보고서**: [`reports/planning/static-analysis-2026-01-05.md`](../reports/planning/static-analysis-2026-01-05.md)

---

## 📝 문서 관리 현황

**최적화 진행 (JBGE 원칙)**
- 문서 수: 130개 (최적화 완료)
- 관리 원칙: 400줄 이하 유지, 관련 내용 통합, 중복 제거.
- **Key Docs**:
  - `README.md`: 프로젝트 개요
  - `docs/status.md`: 기술 스택 및 상태 대시보드 (본 문서)
  - `config/ai/registry-core.yaml`: AI 설정 SSOT

---

## 🐳 Infrastructure Status (2026-01-09)

**Cloud Run AI Engine**
- **Service URL**: `https://ai-engine-490817238363.asia-northeast1.run.app`
- **Active Revision**: `ai-engine-00118-96v` (2026-01-09 deployed)
- **Health**: ✅ All providers connected (Supabase, Upstash, Groq, Mistral, Cerebras, Tavily, OpenRouter, Langfuse)
- **Observability**: Langfuse (10% sampling, 무료 티어 보호)
- **Features**: cpu-boost, session-affinity, gen2, 512Mi/1vCPU

**Artifact Registry** (gcr.io에서 마이그레이션 완료)
- **Repository**: `asia-northeast1-docker.pkg.dev/openmanager-free-tier/cloud-run/ai-engine`
- **Images**: 3개 유지 (최신 + 롤백)
  - `v-20260109-080312-49ba546d6` (최신 - NLP Context Gating)
  - `v-20260109-001908-345078884` (SSE Streaming)
- **정리 정책**: 최신 3개 이미지만 유지 (자동 정리)

**GCS Storage**
- **Cloud Build Sources**: ~2.5MB (최신 10개 유지)
- **정리 정책**: 빌드/배포 시 자동 정리

---

## 💰 리소스 효율

- **비용**: 월 $0 유지 (Free Tier 활용 최적화)
- **Token**: Context Caching & MCP 필터링으로 85% 절감
- **Performance**:
  - Dev Server: ~22s startup
  - Test Suite: ~21s execution

---

## 🎯 Development Methodology

**Zero to Production with Vibe Coding**

이 프로젝트는 **Claude Code**를 메인 개발 도구로 사용하여 처음부터 끝까지 구축한 Full-Stack AI Platform입니다.

| 구현 영역 | 기술 스택 | 상태 |
|----------|----------|------|
| Web UI | Next.js 16 + React 19 Dashboard | ✅ 완료 |
| AI Assistant | useChat + TextStreamChatTransport | ✅ 완료 |
| Multi-Agent | 5-Agent Orchestration (Cloud Run) | ✅ 완료 |
| Database | Supabase PostgreSQL + pgvector | ✅ 완료 |
| Cache | Upstash Redis | ✅ 완료 |
| Monitoring | Server Metrics + Real-time Updates | ✅ 완료 |

**개발 도구 체인**:
- **Primary**: Claude Code (Interactive Development)
- **Code Review**: Codex + Gemini 2-AI Rotation
- **MCP**: 9개 서버 연동 (Serena, Context7, Playwright 등)

**총 코드량**: ~169,000 Lines (Frontend 50K+ / Backend 18K+ / Config & Tests)
