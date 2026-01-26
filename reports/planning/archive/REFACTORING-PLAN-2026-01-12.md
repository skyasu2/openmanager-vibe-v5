# AI 코드베이스 리팩토링 계획서

**작성일**: 2026-01-12
**목표**: 과도하게 복잡한 AI 관련 코드 단순화 및 책임 분리
**예상 절감**: ~2,500줄 (3,129줄 → ~600줄)

---

## Phase 1: Circuit Breaker 단순화

### 현황
- **파일**: `src/lib/ai/circuit-breaker.ts`
- **현재**: 798줄
- **목표**: 300줄 이하

### 분석 결과
| 요소 | 사용 여부 | 조치 |
|------|----------|------|
| `executeWithCircuitBreakerAndFallback` | ✅ 3개 API | 유지 |
| `getAIStatusSummary` | ✅ status API | 유지 |
| `circuitBreakerEvents` | ✅ status API | 유지 |
| `setDistributedStateStore` | ✅ Redis 연동 | 유지 |
| `executeWithCircuitBreaker` | ❌ 주석만 존재 | 삭제 |
| `emitKeyFailoverEvent` | ⚠️ 검증 필요 | 검증 후 결정 |
| `emitModelFailoverEvent` | ⚠️ 검증 필요 | 검증 후 결정 |
| `AICircuitBreakerManager` | ⚠️ 검증 필요 | 검증 후 결정 |

### 작업 내용
1. 미사용 함수 식별 및 삭제
2. 과도한 이벤트 히스토리 로직 단순화
3. 중복 상태 관리 코드 정리

### 예상 결과
- 798줄 → 300줄 (498줄 절감)

---

## Phase 2: AnalysisResultsCard 컴포넌트 분할

### 현황
- **파일**: `src/components/ai/AnalysisResultsCard.tsx`
- **현재**: 667줄
- **목표**: 메인 200줄 + 서브컴포넌트 분리

### 내부 함수 (추출 대상)
| 함수 | 예상 줄 수 | 추출 위치 |
|------|-----------|----------|
| `AnomalyCard` | ~50줄 | `./analysis/AnomalyCard.tsx` |
| `AnomalySection` | ~80줄 | `./analysis/AnomalySection.tsx` |
| `TrendCard` | ~40줄 | `./analysis/TrendCard.tsx` |
| `TrendSection` | ~60줄 | `./analysis/TrendSection.tsx` |
| `InsightSection` | ~50줄 | `./analysis/InsightSection.tsx` |
| `ServerResultCard` | ~60줄 | `./analysis/ServerResultCard.tsx` |
| `MultiServerResults` | ~80줄 | `./analysis/MultiServerResults.tsx` |
| `SingleServerResults` | ~40줄 | `./analysis/SingleServerResults.tsx` |
| `SystemSummarySection` | ~50줄 | `./analysis/SystemSummarySection.tsx` |

### 작업 내용
1. `src/components/ai/analysis/` 폴더 생성
2. 각 서브컴포넌트 파일 분리
3. 메인 컴포넌트에서 import로 조합
4. 공통 타입/상수 `types.ts`, `constants.ts`로 분리

### 예상 결과
- 667줄 → 200줄 메인 + 500줄 분산 (책임 분리, 재사용성 향상)

---

## Phase 3: AI 타입 정의 통합

### 현황
| 파일 | 줄 수 | 내용 |
|------|-------|------|
| `types/ai-types.ts` | 342줄 | 일반 AI 타입 |
| `types/ai-service-types.ts` | 440줄 | 서비스 타입 |
| `types/ai-jobs.ts` | 156줄 | 작업 큐 타입 |
| `types/ai-thinking.ts` | 99줄 | 사고 과정 타입 |
| **합계** | **1,037줄** | |

### 문제점
- 타입 중복 가능성
- import 경로 복잡
- 연관 타입이 분산됨

### 작업 내용
1. 중복 타입 식별 및 제거
2. 도메인별 논리적 그룹화:
   - `types/ai/core.ts` - 핵심 AI 타입
   - `types/ai/chat.ts` - 채팅 관련
   - `types/ai/analysis.ts` - 분석 관련
   - `types/ai/jobs.ts` - 작업 큐 (유지)
3. barrel export (`types/ai/index.ts`) 정리

### 예상 결과
- 1,037줄 → 600줄 (437줄 절감, 중복 제거)

---

## Phase 4: useAIChatCore Hook 책임 분리

### 현황
- **파일**: `src/hooks/ai/useAIChatCore.ts`
- **현재**: 627줄
- **목표**: 250줄 메인 + 서브훅 분리

### 현재 책임 (과다)
1. 채팅 메시지 관리
2. LocalStorage 영속성
3. 세션 트래킹
4. 피드백 수집
5. 재생성/재시도 로직
6. 스트리밍 처리

### 분리 계획
| 새 Hook | 책임 | 예상 줄 수 |
|---------|------|-----------|
| `useChatHistory.ts` | 메시지 히스토리 + LocalStorage | 100줄 |
| `useChatSession.ts` | 세션 관리 | 80줄 |
| `useChatActions.ts` | 재생성/재시도/피드백 | 100줄 |
| `useAIChatCore.ts` | 조합 및 스트리밍 | 250줄 |

### 예상 결과
- 627줄 → 530줄 (97줄 절감, 책임 분리로 유지보수성 향상)

---

## Phase 5: Cloud Run Anomaly Detection 통합 (선택적)

### 현황
| 파일 | 줄 수 | 역할 |
|------|-------|------|
| `UnifiedAnomalyEngine.ts` | 818줄 | 메인 오케스트레이터 |
| `HybridAnomalyDetector.ts` | 492줄 | 중간 래퍼 |
| `IsolationForestDetector.ts` | 436줄 | ML 디텍터 |
| `AdaptiveThreshold.ts` | 527줄 | 임계값 디텍터 |
| `TrendPredictor.ts` | 685줄 | 트렌드 분석 |
| `SimpleAnomalyDetector.ts` | 254줄 | 통계 폴백 |
| **합계** | **3,212줄** | |

### 문제점
- 중간 래퍼 클래스 불필요
- 실제 사용 알고리즘 불명확
- 레이어 과다

### 작업 내용 (Cloud Run 영역)
1. 실제 사용 알고리즘 프로파일링
2. HybridAnomalyDetector 제거 (직접 호출로 변경)
3. Strategy 패턴으로 단순화

### 예상 결과
- 3,212줄 → 1,500줄 (1,712줄 절감)
- ⚠️ Cloud Run 별도 배포 필요

---

## 실행 순서 및 우선순위

| 순서 | Phase | 난이도 | 영향도 | 예상 절감 |
|------|-------|--------|--------|----------|
| 1 | Circuit Breaker | 낮음 | 낮음 | 498줄 |
| 2 | AnalysisResultsCard | 중간 | 낮음 | 책임분리 |
| 3 | 타입 통합 | 낮음 | 중간 | 437줄 |
| 4 | useAIChatCore | 중간 | 중간 | 97줄 |
| 5 | Anomaly Detection | 높음 | 높음 | 1,712줄 |

---

## 검증 체크리스트

각 Phase 완료 시:
- [ ] TypeScript 컴파일 성공
- [ ] 기존 테스트 통과 (228개)
- [ ] 관련 API 동작 확인
- [ ] 빌드 성공

---

## 예상 총 결과

| 항목 | Before | After | 절감 |
|------|--------|-------|------|
| circuit-breaker.ts | 798줄 | 300줄 | 498줄 |
| AnalysisResultsCard.tsx | 667줄 | 200줄 | 467줄 (분산) |
| AI 타입 파일들 | 1,037줄 | 600줄 | 437줄 |
| useAIChatCore.ts | 627줄 | 530줄 | 97줄 |
| **Vercel 총합** | **3,129줄** | **1,630줄** | **~1,500줄** |

Cloud Run (Phase 5) 포함 시: **+1,712줄 추가 절감**

---

_작성자: Claude Opus 4.5_
