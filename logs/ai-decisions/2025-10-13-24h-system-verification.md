# 24시간 고정 데이터 시스템 검증 - AI 교차검증

**날짜**: 2025-10-13
**상황**: 랜덤 메트릭 생성 → 24시간 고정 데이터 시스템 전환 후 실무/아키텍처/성능 측면 검증
**참고**: `logs/ai-decisions/2025-10-13-before-after-comparison.md`

---

## 🤖 AI 의견 요약

### 📊 Codex (실무 관점) - 91초

**핵심 주장**: 3개 치명적 버그 발견, 프로덕션 환경에서 데이터 손실 가능

**버그 1**: `src/data/fixed-24h-metrics.ts:254` - 뫼비우스 순환 버그
- **문제**: `count`가 144를 넘으면 `targetIndex`가 -144 이하로 내려가는데, 한 번만 144를 더해도 여전히 음수
- **결과**: `dataset.data[targetIndex]`가 `undefined` 반환, 데이터 손실
- **해결**: 모듈러 연산 필요 (`targetIndex = ((currentSlotIndex - i) % 144 + 144) % 144`)

**버그 2**: `src/utils/kst-time.ts:13` - KST 이중 보정 버그
- **문제**: `now.getTime()` 자체가 UTC인데 `getTimezoneOffset()`을 추가로 더해 KST 계산 시 이중 보정
- **결과**: 서버 타임존이 UTC가 아니면 최대 수 시간 오차 발생
- **해결**: `getTimezoneOffset()` 제거하거나, UTC 기준으로 직접 계산

**버그 3**: `src/data/fixed-24h-metrics.ts:41` - ±5% 주석 불일치
- **문제**: 주석은 ±5% 변동이지만 `(Math.random() - 0.5) * 10`은 절대 ±5pt 조정
- **결과**: baseline 20일 때 ±25%까지 흔들려 "고정" 데이터 요건 위반
- **해결**: 퍼센트 기반 계산 (`value * (1 + (Math.random() - 0.5) * 0.1)`)

**추천 사항**: 즉시 수정 필요 (특히 버그 1, 2는 데이터 무결성 직결)

---

### 📐 Gemini (아키텍처 관점) - 61초

**핵심 주장**: 현재 아키텍처는 데이터 중복 처리와 컴포넌트 간 강한 결합 문제

**개선 1**: Provider 패턴 도입 (React Context API) - **최우선**
- **근거**: 각 컴포넌트가 `useFixed24hMetrics`를 독립적으로 호출하여 50KB 데이터를 중복 로드
- **방안**: `Fixed24hMetricsContext` 생성 → 최상위에서 단 한 번만 조회 → Context로 공유
- **ROI**:
  - 성능 향상: 중복 연산 완전 제거
  - 메모리 효율: 50KB × N개 컴포넌트 → 50KB × 1 (N배 절약)
  - 상태 관리 중앙화: 예측 가능, 디버깅 용이
- **비용**: Medium (Provider 생성 + 기존 컴포넌트 수정)

**개선 2**: SRP 원칙에 따른 훅 분리 - **높은 우선순위**
- **근거**: `useFixed24hMetrics`가 데이터 조회, 미세 변동, 히스토리 관리 등 3가지 책임 (SRP 위반)
- **방안**:
  - `getFixed24hRawData()`: 순수 데이터 조회
  - `useMetricFluctuations()`: 미세 변동 로직
  - `useMetricHistory()`: 히스토리 관리
- **ROI**:
  - 테스트 용이성: 각 로직 독립 테스트
  - 재사용성/유지보수성: 책임 명확 분리
  - SOLID 준수: 견고한 아키텍처
- **비용**: Low (내부 리팩토링)

**개선 3**: DIP 적용 - 데이터 소스 추상화 - **권장**
- **근거**: `FIXED_24H_DATASETS` 정적 데이터에 강하게 결합, 미래 변경 시 전체 수정 필요
- **방안**: 데이터 제공자 인터페이스 주입
  - 프로덕션: `() => Promise.resolve(FIXED_24H_DATASETS)`
  - 테스트: `() => Promise.resolve(MOCK_DATASETS)`
  - 미래 API: `() => fetch('/api/metrics')`
- **ROI**:
  - 유연성/확장성: 데이터 소스 교체만으로 변경 완료
  - 테스트 용이성: Mock 데이터 쉽게 주입
  - DIP 준수: 고수준 모듈이 저수준 모듈에 의존 제거
- **비용**: Low (데이터 조회 함수화 + Provider 주입)

**추천 순서**: 1) Provider 패턴 → 2) 훅 분리 → 3) DIP 적용 (시너지 극대화)

---

### ⚡ Qwen (성능 관점) - 547초

**핵심 주장**: 메모리 트레이드오프는 합리적, 3가지 최적화로 추가 개선 가능

**최적화 1**: Map 기반 O(1) 조회 - **70% 개선**
- **근거**: `getServer24hData()`가 `find()` 선형 탐색 (O(n)), 15개 서버 평균 7.5회 비교
- **방안**:
  ```typescript
  const SERVER_MAP = new Map(FIXED_24H_DATASETS.map(ds => [ds.serverId, ds]));

  export function getServer24hData(serverId: string) {
    return SERVER_MAP.get(serverId);
  }
  ```
- **측정 가능한 개선**: ~70% 조회 시간 단축 (O(7.5) → O(1))

**최적화 2**: useMemo 의존성 배열 축소 - **40-60% 개선**
- **근거**: `useMemo` 의존성이 `[currentMetrics, historyData, dataset, refreshMetrics]`로 과다
- **방안**: 필수 값만 포함 (`[currentMetrics]` 또는 `[currentMetrics, dataset]`)
- **측정 가능한 개선**: 40-60% 재렌더링 감소 (60초 업데이트 주기)

**최적화 3**: React Virtualization - **60-80% 개선**
- **근거**: 15개 서버 카드 동시 렌더링, 1분마다 전체 업데이트 시 레이아웃 스래싱
- **방안**: `react-window` 라이브러리로 windowing
  ```typescript
  import { FixedSizeList as List } from 'react-window';

  <List height={600} itemCount={15} itemSize={200}>
    {ServerCard}
  </List>
  ```
- **측정 가능한 개선**:
  - 60-80% DOM 노드 감소
  - 40-50% 렌더링 성능 향상
  - 메인 스레드 블로킹 제거

**추천 사항**: 최적화 1은 즉시 적용 (간단 + 효과 큼), 2/3은 성능 이슈 발생 시

---

## ⚖️ 합의점과 충돌점

### ✅ 합의 (3-AI 모두 동의)

1. **전환 결정은 올바름**: 재현 가능성, AI 분석, 테스트 용이성 측면에서 명백한 이득
2. **메모리 50KB는 수용 가능**: 1인 개발, 15개 서버 기준으로 과도하지 않음 (1000개 서버 시 3.3MB도 현대 브라우저에서 문제없음)
3. **코드 품질 개선 필요**: 실무 버그 3개 + 아키텍처 개선 필요 + 성능 최적화 여지

### ⚠️ 충돌

1. **개선 우선순위**:
   - Codex: "버그 수정 최우선 (데이터 무결성)"
   - Gemini: "Provider 패턴 최우선 (아키텍처 품질)"
   - Qwen: "Map 조회 최우선 (성능 개선)"

   → **각 관점에서 모두 타당**, 동시 진행 또는 순차 적용 필요

2. **Provider 패턴 도입 필요성**:
   - Gemini: "최우선, 성능/메모리 문제 해결"
   - Qwen: "선택 사항, 현재 15개 서버는 큰 문제 없음"

   → **규모 확장 시점**에 따라 판단 (현재는 선택, 100개 서버 이상 시 필수)

3. **트레이드오프 평가**:
   - Codex: "버그 때문에 리스크 존재, 즉시 수정 필요"
   - Gemini: "아키텍처 품질은 만족스럽지 않음, 리팩토링 필요"
   - Qwen: "성능 트레이드오프는 합리적, 최적화는 선택 사항"

   → **버그 수정 후**, 아키텍처/성능은 점진적 개선

---

## 🎯 Claude Code 최종 판단

### 채택된 방안: "3단계 점진적 개선"

**Phase 1**: 버그 수정 (즉시) - **Codex 제안 채택**
- ✅ 뫼비우스 순환 모듈러 연산 수정
- ✅ KST 이중 보정 제거
- ✅ ±5% 변동 퍼센트 기반 계산

**Phase 2**: 성능 최적화 (1주 내) - **Qwen 제안 채택**
- ✅ Map 기반 O(1) 조회 (간단 + 효과 큼)
- ⏳ useMemo 의존성 축소 (필요 시)

**Phase 3**: 아키텍처 리팩토링 (필요 시) - **Gemini 제안 보류**
- ⏳ Provider 패턴 (100개 서버 이상 확장 시)
- ⏳ SRP 훅 분리 (유지보수 복잡도 증가 시)
- ⏳ DIP 적용 (API 전환 계획 시)

### 선택 근거

**1. 버그 수정 최우선 (Codex)**
- **이유**: Codex가 지적한 3개 버그는 **데이터 무결성 직결**
  - 버그 1: `count > 144` 시 데이터 손실 (히스토리 차트 빈 공백)
  - 버그 2: 비UTC 환경에서 수 시간 오차 (시간 동기화 실패)
  - 버그 3: 변동률 불일치 (AI 분석 혼란)
- **ROI**: 수정 비용 낮음 (3줄 코드), 리스크 제거 효과 큼
- **Claude 평가**: **즉시 수정 필수**

**2. Map 조회 최적화 채택 (Qwen)**
- **이유**: 간단한 수정 (5줄)으로 70% 개선 (O(n) → O(1))
- **ROI**: 비용 최소, 효과 즉각적
- **Claude 평가**: **1주 내 적용 권장**

**3. Provider 패턴 보류 (Gemini)**
- **이유**:
  - 현재 15개 서버에서는 성능 이슈 미미 (Qwen 분석)
  - 리팩토링 비용 Medium (Provider + 전체 컴포넌트 수정)
  - **1인 개발 환경**에서 ROI 낮음 (복잡도 증가 > 이득)
- **전환 시점**: 100개 서버 이상 확장 시 재검토
- **Claude 평가**: **현재는 과도한 엔지니어링 (Over-Engineering)**

### 기각된 의견

- **Gemini 개선 2/3 (SRP 분리, DIP 적용)**: 현재 아키텍처 복잡도 대비 실질적 이득 미미
  - SRP 분리: 훅 3개로 분리 시 오히려 가독성 저하 (현재 251줄 훅은 관리 가능)
  - DIP 적용: API 전환 계획 없으면 불필요한 추상화 레이어
- **Qwen 최적화 3 (Virtualization)**: 15개 서버에서는 과도, 1000개 이상 시 재검토

---

## 💡 최종 결론

### 핵심 질문: 랜덤 → 고정 데이터 전환이 올바른 선택인가?

**답변**: ✅ **올바른 선택이지만, 3개 버그 수정 필수**

**트레이드오프 재평가**:

| 항목 | 이전 (랜덤) | 현재 (고정) | Claude 판단 |
|------|-------------|-------------|-------------|
| **재현 가능성** | 0% | 100% | ✅ 핵심 이득 |
| **AI 분석 가능** | 불가능 | 6개 패턴 | ✅ 프로젝트 가치 |
| **테스트 용이성** | 낮음 | 높음 | ✅ 개발 속도 향상 |
| **메모리 사용** | 1KB | 50KB (+49배) | ✅ 수용 가능 (현대 브라우저) |
| **코드 복잡도** | 200줄 | 1061줄 (+430%) | ⚠️ 관리 가능 (모듈화 잘됨) |
| **버그 리스크** | 낮음 | **높음 (3개 버그)** | ❌ **즉시 수정 필요** |

**합의 요청 답변**:

1. **현재 트레이드오프가 합리적인가?** → ✅ **네, 버그 수정 후에는 합리적**
   - 메모리 50KB는 무시 가능 수준
   - 코드 복잡도는 모듈화로 해결됨
   - 재현 가능성 이득이 압도적

2. **메모리 50KB는 수용 가능한가?** → ✅ **예, 1000개 서버(3.3MB)도 문제없음**
   - 현대 브라우저는 수백 MB 메모리 처리 가능
   - 이미지 1장(~1MB)보다 작은 수준

3. **추가 최적화가 필요한가?** → ⚠️ **Map 조회만 즉시, 나머지는 점진적**
   - Map O(1) 조회: 간단 + 효과 큼 → **즉시 적용**
   - Provider 패턴: ROI 낮음 → **100개 서버 이상 시 재검토**
   - Virtualization: 과도 → **1000개 서버 이상 시**

4. **놓친 버그나 이슈?** → ❌ **Codex가 3개 치명적 버그 발견**
   - 뫼비우스 순환, KST 이중 보정, 변동률 불일치
   - **즉시 수정 필수**

---

## 📝 실행 내역

### 즉시 실행 (Phase 1: 버그 수정)

- [ ] **버그 1 수정**: `src/data/fixed-24h-metrics.ts:254` 모듈러 연산
  ```typescript
  // Before
  if (targetIndex < 0) {
    targetIndex = 144 + targetIndex;
  }

  // After
  targetIndex = ((currentSlotIndex - i) % 144 + 144) % 144;
  ```

- [ ] **버그 2 수정**: `src/utils/kst-time.ts:10-18` KST 계산 수정
  ```typescript
  // Before
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstTime = new Date(utcTime + 9 * 60 * 60 * 1000);

  // After
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  ```

- [ ] **버그 3 수정**: `src/data/fixed-24h-metrics.ts:40-43` 퍼센트 기반 변동
  ```typescript
  // Before
  const variation = (Math.random() - 0.5) * 10; // ±5pt 절대값

  // After
  const variation = value * (Math.random() - 0.5) * 0.1; // ±5% 상대값
  ```

- [ ] **검증 스크립트 실행**: 버그 수정 후 검증
  ```bash
  npm run type-check
  npm run test:super-fast
  ```

### 1주 내 실행 (Phase 2: 성능 최적화)

- [ ] **Map 조회 최적화**: `src/data/fixed-24h-metrics.ts:209-211`
  ```typescript
  const SERVER_MAP = new Map(FIXED_24H_DATASETS.map(ds => [ds.serverId, ds]));

  export function getServer24hData(serverId: string) {
    return SERVER_MAP.get(serverId);
  }
  ```

- [ ] **성능 측정**: 최적화 전후 비교
  ```bash
  # Chrome DevTools Performance 프로파일링
  # 조회 시간 70% 단축 확인
  ```

### 향후 계획 (Phase 3: 아키텍처 리팩토링)

- [ ] **Provider 패턴 도입** (100개 서버 이상 확장 시)
  - `Fixed24hMetricsContext` 생성
  - 최상위 Provider 적용
  - 컴포넌트 `useContext` 전환

- [ ] **Virtualization** (1000개 서버 이상 시)
  - `react-window` 도입
  - 서버 리스트 windowing 적용

- [ ] **SRP 훅 분리** (유지보수 복잡도 증가 시)
  - `getFixed24hRawData()`
  - `useMetricFluctuations()`
  - `useMetricHistory()`

---

## 📊 3-AI 실행 통계

| AI | 응답 시간 | Exit Code | 핵심 제안 수 | 품질 |
|----|----------|-----------|-------------|------|
| **Codex** | 91초 (재시도) | 0 | 3개 버그 | ⭐⭐⭐⭐⭐ 치명적 버그 발견 |
| **Gemini** | 61초 | 0 | 3개 개선점 | ⭐⭐⭐⭐⭐ ROI 분석 우수 |
| **Qwen** | 547초 | 0 | 3개 최적화 | ⭐⭐⭐⭐ 측정 가능한 지표 |

**총 소요 시간**: 699초 (~11.6분, 병렬 547초)
**성공률**: 100% (3/3 AI)

---

## 🔗 관련 문서

- `logs/ai-decisions/2025-10-13-before-after-comparison.md` - 이전 vs 현재 비교
- `logs/ai-decisions/2025-10-13-server-metrics-architecture.md` - 이전 AI 교차검증
- `src/utils/kst-time.ts` - 한국 시간 유틸리티
- `src/hooks/useFixed24hMetrics.ts` - 고정 데이터 훅
- `src/data/fixed-24h-metrics.ts` - 24시간 데이터셋
- `src/data/scenarios.ts` - 장애 시나리오

---

**💡 핵심**: 전환 결정은 올바르나, Codex 발견 3개 버그 즉시 수정 필수. 아키텍처 리팩토링은 ROI 낮아 보류.

**🚀 다음 단계**: Phase 1 버그 수정 → Phase 2 Map 최적화 → Phase 3 보류 (확장 시 재검토)
