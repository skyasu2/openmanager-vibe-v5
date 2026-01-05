# Static Analysis Report

**분석일**: 2026-01-05
**버전**: v5.83.14
**분석 도구**: TypeScript strict, ESLint, Symbol Analysis (Serena)

---

## 1. 요약

| 영역 | 파일 수 | 코드 라인 | 점수 | 상태 |
|------|---------|----------|------|------|
| Frontend (Vercel) | 760+ | ~50,000+ | **85/100** | ✅ 양호 |
| Backend (Cloud Run) | 63 | ~18,700 | **87/100** | ✅ 양호 |

---

## 2. Frontend 분석 (Next.js + React)

### 2.1 구조 현황

| 항목 | 값 |
|------|-----|
| TSX 컴포넌트 | 217개 |
| TS 파일 | 543개 |
| React 컴포넌트 | 168개 |
| Custom Hooks | 61개 |
| API Routes | 71개 |
| Zustand Stores | 11개 |
| 의존성 패키지 | 47개 |

### 2.2 `any` 타입 분석 (17개)

| 파일 | 개수 | 판정 | 사유 |
|------|------|------|------|
| `polyfills.ts` | 13 | ✅ 유지 | 브라우저 호환성 (ResizeObserver 등) |
| `development-only.ts` | 1 | ✅ 유지 | biome-ignore 의도적 사용 |
| `seed-logs-supabase-standalone.ts` | 1 | ✅ 유지 | 스크립트 (프로덕션 미포함) |
| `recharts.d.ts` | 2 | ✅ 유지 | 외부 라이브러리 타입 정의 |

**결론**: 17개 모두 의도적/필수 사용 - 수정 불필요

### 2.3 대형 컴포넌트 분석 (500줄 이상, 5개)

| 파일 | 라인 | 구조 분석 | 판정 |
|------|------|----------|------|
| `AutoReportPage.tsx` | 940 | 인터페이스 + 헬퍼 함수, 단일 페이지 | ✅ 유지 |
| `SystemChecklist.tsx` | 774 | 디버그 도구 + 인터페이스 포함 | ✅ 유지 |
| `DashboardClient.tsx` | 676 | Dynamic imports 활용, 잘 구조화 | ✅ 유지 |
| `AnalysisResultsCard.tsx` | 667 | 내부 서브 컴포넌트로 분리됨 | ✅ 유지 |
| `FeatureCardModal.tsx` | 656 | 데이터 상수 + 렌더 헬퍼 포함 | ✅ 유지 |

**결론**: 5개 모두 내부 구조 양호 - 분리 불필요

### 2.4 Frontend 점수 상세

| 지표 | 점수 | 비고 |
|------|------|------|
| 타입 안전성 | 9/10 | `any` 모두 의도적 |
| 컴포넌트 구조 | 8/10 | 대형 파일 있으나 잘 정리됨 |
| 코드 분할 | 9/10 | Dynamic imports 활용 |
| 상태 관리 | 9/10 | Zustand + React Query |
| **종합** | **85/100** | A- |

---

## 3. Backend 분석 (Cloud Run AI Engine)

### 3.1 구조 현황

| 항목 | 값 |
|------|-----|
| TypeScript 파일 | 63개 |
| 총 코드 라인 | ~18,700줄 |
| AI Agents | 5개 (advisor, analyst, nlq, reporter, summarizer) |
| AI Tools 모듈 | 4개 (analyst, reporter, server-metrics, rca) |
| 의존성 패키지 | 22개 |
| 테스트 파일 | 5개 |

### 3.2 `any` 타입 분석 (5개)

| 파일 | 개수 | 판정 | 사유 |
|------|------|------|------|
| `model-provider.ts` | 4 | ✅ 유지 | AI SDK 버전 불일치 (V3→V2) |
| `langfuse.ts` | 1 | ✅ 유지 | 선택적 모듈 동적 import |

**결론**: 5개 모두 eslint-disable 주석으로 의도적 사용 명시 - 수정 불필요

### 3.3 대형 파일 분석 (500줄 이상, 12개)

| 파일 | 라인 | 구조 분석 | 판정 |
|------|------|----------|------|
| `supervisor.ts` | 860 | 10 functions, 6 interfaces | ✅ 적절 |
| `analyst-tools.ts` | 822 | 7 AI tools, 3 helpers | ✅ 적절 |
| `UnifiedAnomalyEngine.ts` | 818 | 1 class (24 methods), 4 interfaces | ✅ 적절 |
| `analytics.ts` | 705 | Hono 라우터 + 헬퍼 | ✅ 적절 |
| `reporter-tools.ts` | 637 | AI tool 정의 | ✅ 적절 |
| `llamaindex-rag-service.ts` | 599 | RAG 서비스 로직 | ✅ 적절 |
| `server-metrics.ts` | 594 | 메트릭 수집 도구 | ✅ 적절 |
| `precomputed-state.ts` | 590 | 데이터 상태 관리 | ✅ 적절 |
| `model-provider.ts` | 578 | 모델 프로바이더 팩토리 | ✅ 적절 |
| `approval-store.ts` | 573 | 승인 상태 저장소 | ✅ 적절 |
| `orchestrator.ts` | 555 | Multi-Agent 조율 | ✅ 적절 |
| `AdaptiveThreshold.ts` | 527 | 적응형 임계값 알고리즘 | ✅ 적절 |

**결론**: 12개 모두 명확한 단일 책임 원칙 준수 - 분리 불필요

### 3.4 Backend 점수 상세

| 지표 | 점수 | 비고 |
|------|------|------|
| 타입 안전성 | 9/10 | `any` 5개 (모두 의도적) |
| 코드 구조 | 9/10 | 명확한 모듈화 |
| 테스트 커버리지 | 7/10 | 5개 테스트 파일 |
| TypeScript strict | 10/10 | PASS |
| **종합** | **87/100** | A- |

---

## 4. 검증 결과

| 검증 항목 | Frontend | Backend |
|----------|----------|---------|
| TypeScript strict | ✅ PASS | ✅ PASS |
| ESLint | ✅ 0 errors | N/A |
| Build | ✅ PASS | ✅ PASS |

---

## 5. 권장 사항

### 즉시 조치 필요: 없음

모든 지적 항목이 의도적 설계로 확인됨

### 향후 개선 고려 (선택)

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| Backend 테스트 확대 | 낮음 | 현재 5개 → 주요 모듈 추가 |
| E2E 테스트 보강 | 낮음 | Playwright 시나리오 추가 |

---

_Generated: 2026-01-05_
