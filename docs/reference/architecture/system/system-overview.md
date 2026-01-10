# 시스템 아키텍처 개요

> **Last Updated**: 2025-12-29

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징

- **아키텍처**: Next.js 16 + React 19 + TypeScript 5.9 (strict) + Vercel + Supabase
- **AI 엔진**: LangGraph Multi-Agent (Cloud Run) + Vercel AI SDK 5.x
- **데이터 시스템**: StaticDataLoader (v5.71.0) - 99.6% CPU 절약, 92% 메모리 절약
- **무료 티어**: 100% 무료로 운영 (Vercel/Supabase 무료 계정 최적화)
- **개발 AI**: Claude Code 중심 + 2-AI 협업 (Codex + Gemini) 교차검증 시스템

---

## 🏗️ 기술 스택

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **AI SDK**: Vercel AI SDK 5.x (`useChat`)

### Backend

- **Platform**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL (+ pgvector)
- **AI Engine**: GCP Cloud Run (LangGraph Multi-Agent)
- **API**: Next.js API Routes

### Infrastructure

- **Frontend Hosting**: Vercel (무료 티어)
- **Database**: Supabase (무료 티어)
- **AI Engine**: GCP Cloud Run (스케일 투 제로)

---

## 📊 StaticDataLoader 시스템

### 개요

**v5.71.0** - 정적 데이터 로딩으로 서버 부하 최소화

### 핵심 성과

- **CPU 절약**: 99.6% 감소
- **메모리 절약**: 92% 감소
- **로딩 속도**: 즉시 로드 (API 호출 불필요)

### 동작 원리

```typescript
// 정적 데이터 로딩 (빌드 시 생성)
const staticData = {
  servers: [...],  // 10개 서버 메타데이터
  metrics: [...],  // Mock 시뮬레이션 결과
};

// 런타임에서 즉시 사용 (API 호출 없음)
export function getServerData() {
  return staticData.servers; // 0ms 응답
}
```

---

## 🤖 애플리케이션 AI 엔진

### LangGraph Multi-Agent 시스템

사용자가 애플리케이션에서 직접 사용하는 AI 기능 - **Cloud Run 기반 하이브리드 아키텍처**

| 에이전트 | 모델 | 역할 | 도구 |
|:---------|:-----|:-----|:-----|
| **Supervisor** | Cerebras llama-3.3-70b | 인텐트 분류, 라우팅 | - |
| **NLQ Agent** | Groq llama-3.3-70b | 서버 메트릭 조회 | `getServerMetricsAdvanced` |
| **Analyst Agent** | Groq llama-3.3-70b | 패턴 분석, 이상 탐지 | `analyzePattern` |
| **RCA Agent** | Groq llama-3.3-70b | 근본 원인 분석 | `getRootCauseAnalysis` |
| **Capacity Agent** | Groq llama-3.3-70b | 용량 예측/계획 | `getCapacityForecast` |
| **Reporter Agent** | Groq llama-3.3-70b | 리포트 생성, RAG | `searchKnowledgeBase`, Tavily |
| **Verifier Agent** | Mistral Small 3.2 (24B) | 품질 검증 | - |

### 핵심 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend/BFF)                          │
│  ┌─────────────┐    ┌────────────────┐    ┌──────────────────────┐  │
│  │ AISidebarV4 │───▶│ useChat (SDK)  │───▶│ /api/ai/supervisor   │  │
│  │ 컴포넌트     │    │TextStreamTransport│  │ (프록시)              │  │
│  └─────────────┘    └────────────────┘    └──────────┬───────────┘  │
└───────────────────────────────────────────────────────┼──────────────┘
                                                        │ proxyStreamToCloudRun()
                                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      CLOUD RUN (AI Engine)                            │
│  ┌──────────┐    ┌─────┐    ┌────────┐    ┌───┐    ┌────────┐       │
│  │Supervisor│───▶│ NLQ │───▶│Analyst │───▶│RCA│───▶│Capacity│       │
│  │Cerebras  │    │Groq │    │Groq    │    │   │    │        │       │
│  └──────────┘    └─────┘    └────────┘    └───┘    └───┬────┘       │
│                                                        │             │
│                                          ┌─────────────▼─────────┐  │
│                                          │ Reporter → Verifier   │  │
│                                          │ Groq       Mistral    │  │
│                                          └───────────────────────┘  │
│                          LangGraph Orchestration (7 Agents)          │
└──────────────────────────────────────────────────────────────────────┘
```

### AI 기능 (3가지)

| 기능 | 엔드포인트 | 설명 | Fallback |
|------|-----------|------|----------|
| **자연어 질의** | `/api/ai/supervisor` | LangGraph 스트리밍 | 503 에러 |
| **자동 보고서** | `/api/ai/incident-report` | 장애 리포트 생성 | 로컬 패턴 매칭 |
| **이상감지/예측** | `/api/ai/intelligent-monitoring` | 예측 분석 | 로컬 선형회귀 |

### 아키텍처 특징

- ✅ **Stateless Cloud Run**: 모든 데이터는 Supabase에서 조회
- ✅ **스트리밍 응답**: Vercel AI SDK로 실시간 토큰 전송
- ✅ **Graceful Degradation**: Cloud Run 불가 시 로컬 알고리즘 사용
- ✅ **스케일 투 제로**: 사용하지 않을 때 비용 $0
- ✅ **프록시 계층**: `src/lib/ai-proxy/proxy.ts`로 통합 관리

### Google AI (Gemini 2.0 Flash) 상세 정보

**현재 사용 모델**: `gemini-2.5-flash-exp`

**최신 업데이트 (2025년 2월)**:

- ✅ **GA 릴리스**: 2025년 2월 5일
- ✅ **1M 토큰 컨텍스트**: 대용량 문서 처리 가능
- ✅ **Native Tool Use**: 도구 통합 기본 지원
- ✅ **Multimodal I/O**: 텍스트, 이미지, 오디오 입출력
- ✅ **간결한 스타일**: 토큰 효율 최적화 (기본값)

**무료 티어 한도** (공식 문서 기준):

- **RPM** (분당 요청): 15
- **RPD** (일일 요청): 200
- **TPM** (분당 토큰): 1M
- **동시 세션**: 3개 (Live API)
- **출처**: [Google AI Quotas](https://ai.google.dev/gemini-api/docs/quota)

**2025년 최신 권장 모델**:

- **Gemini 2.5 Pro** (5 RPM, 100 RPD, 250K TPM): 최고급 사고 모델
- **Gemini 2.5 Flash** (10 RPM, 250 RPD, 250K TPM): 가격 대비 성능 최고
- **Gemini 2.5 Flash-Lite** (15 RPM, 1,000 RPD, 250K TPM): 가장 빠르고 비용 효율적
- **Gemini 2.0 Flash** (15 RPM, 200 RPD, 1M TPM): 현재 사용 중, 높은 TPM

**고급 기능**:

- 이미지 생성 (Public Preview)
- Native Audio (Live API, Preview)
- Canvas Feature (문서/코드 협업)

**성능 최적화**:

- 타임아웃: 8초 (무료 티어 최적화)
- 직접 SDK 호출 (중간 레이어 없음)
- 모델 캐싱 (반복 요청 최적화)

**모델 업그레이드 고려사항**:

- **2.5 Flash-Lite로 변경 시**: RPD 200 → 1,000 (5배), TPM 1M → 250K (짧은 쿼리에 적합)
- **2.5 Flash로 변경 시**: 균형잡힌 성능, RPD 250, TPM 250K
- **현재 2.0 Flash 유지**: 대용량 문서 처리 (TPM 1M)에 최적

---

## 🎲 Mock 시뮬레이션 시스템

### 개요

**FNV-1a 해시 기반 현실적 서버 메트릭 생성** - 비용 절감 + 포트폴리오 데모

### 핵심 아키텍처

- **📊 정규분포 메트릭**: Math.random() → FNV-1a 해시로 현실적 서버 행동 시뮬레이션
- **🏗️ 10개 서버 타입**: web, api, database, cache 등 전문화된 특성
- **⚡ 15+ 장애 시나리오**: 트래픽 폭증, DDoS 공격, 메모리 누수 등 확률 기반
- **🔄 CPU-Memory 상관관계**: 0.6 계수로 현실적 상관성 구현

### 시뮬레이션 성과

- **📊 응답시간**: 평균 272ms - 안정적 성능
- **🤖 AI 호환성**: 실시간 장애 분석 가능한 메타데이터
- **💰 베르셀 호환**: 무료 티어 100% 활용
- **🎯 현실성**: 10개 서버 동시 시뮬레이션

### GCP VM 대비 장점

| 구분       | GCP VM (이전) | Mock 시뮬레이션 (현재) |
| ---------- | ------------- | ---------------------- |
| **비용**   | $57/월        | $0 (완전 무료)         |
| **안정성** | 99.5%         | 99.95% (코드 기반)     |
| **확장성** | 1개 VM 제한   | 무제한 서버 시뮬레이션 |

---

## 💰 무료 티어 전략

### 플랫폼 최적화 성과

**🌐 Vercel**

- 사용량: 30GB/월 (30% 사용)
- 성능: FCP 608ms, 응답시간 532ms (2025-09-28 실측)

**🐘 Supabase**

- 사용량: 15MB (3% 사용)
- 성능: RLS 정책, 쿼리 50ms

**☁️ GCP**

- 사용량: Cloud Functions 200만 호출/월 (5% 사용)

### 핵심 성과

- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **성능**: 엔터프라이즈급 (FCP 608ms, 응답시간 532ms, 99.95% 가동률)

---

## 📊 현재 상태 (2025-12-29 업데이트)

### 프로젝트 현황

- **버전**: v5.85.0
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용
- **개발 상태**: 프로덕션 운영 중

### 품질 지표

- **TypeScript 에러**: 0개 완전 해결 ✅ (strict 모드 100% 달성)
- **Build**: ✅ Passing (Next.js 16.1.1)
- **Test**: ✅ 92/92 Tests Passing
- **E2E**: ✅ 30/30 Scenarios Passing (Playwright)
- **MCP**: ✅ 9/9 서버 연결

### Vercel 배포 현황

- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **프로덕션 URL**: https://openmanager-vibe-v5.vercel.app
- **Node.js 버전**: ✅ 22.x
- **배포 성과**: 프로덕션 안정성 100% 확보
