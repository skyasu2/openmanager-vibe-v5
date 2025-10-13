# 서버 메트릭 데이터 구조 개선 - AI 교차검증 의사결정

**날짜**: 2025-10-13
**상황**: 서버 메트릭 실시간 업데이트 및 히스토리 데이터 구현 분석 요청
**AI 성공률**: 2/3 (Codex ✅, Gemini ✅, Qwen ❌ 타임아웃)

---

## 🔍 분석 대상

### 1. 실시간 메트릭 업데이트 (ImprovedServerCard.tsx)
- **업데이트 주기**: 45초 + index * 1000ms (서버별 지연)
- **메트릭 생성**: `generateSafeMetricValue()` 호출
- **정리 로직**: `clearInterval`만 사용, `isMountedRef` 활용

### 2. 히스토리 데이터 생성 (ServerMetricsLineChart.tsx)
- **초기 데이터**: `generateHistoricalData()` - 10분간 11개 포인트 (1분 간격)
- **업데이트 주기**: 60초마다
- **데이터 생성 방식**: 현재값 기준 역산 (사인파 + 랜덤 노이즈 + 트렌드)

### 3. 메트릭 검증 (metricValidation.ts)
- `validateMetricValue()`: 0-100 범위 클램핑, NaN/Infinity 처리
- `generateSafeMetricValue()`: ±maxVariation 범위 내 랜덤 생성
- `validateServerMetrics()`: 전체 메트릭 객체 검증

---

## 🤖 AI 의견 요약

### 📊 Codex (실무 관점) - ✅ 성공 (170초)

#### 핵심 주장
**setInterval 클로저 버그 + 업데이트 주기 불일치 + 언마운트 가드 누락**

#### 근거
1. `setInterval` 클로저가 최신 props를 캡처하지 못해 서버 전환 시 초기값이 고착됨
2. Card(45초)와 Chart(60초) 주기가 엇갈려 UI 일관성이 깨짐
3. 언마운트 직전 setState 호출로 React 경고 발생 가능

#### 추천 사항 (우선순위 순)
1. **useEffect 의존성 배열 수정** (ImprovedServerCard.tsx:179, ServerMetricsLineChart.tsx:231)
   - `server.id`, `safeServer.cpu`, `value`, `type` 등을 deps에 추가
   - 변화 시 타이머 재시작으로 최신 값 반영
2. **업데이트 주기 통일** (ImprovedServerCard.tsx:234, ServerMetricsLineChart.tsx:261)
   - 45초와 60초를 동일한 주기로 변경
   - 또는 상위에서 단일 타이머로 값을 내려주기
3. **언마운트 가드 강화** (ServerMetricsLineChart.tsx:231)
   - `let cancelled = false` 패턴 도입
   - cleanup에서 `cancelled = true` 후 `if (cancelled) return prev;`로 setState 차단

---

### 📐 Gemini (아키텍처 관점) - ✅ 성공 (43초)

#### 핵심 주장
**분산 상태 관리로 인한 데이터 불일치 + SRP 위반 + 높은 결합도**

#### 근거
1. Card와 Chart가 독립적으로 상태를 관리하여 데이터 동기화 불가
2. UI 컴포넌트 내에 데이터 생성 로직이 직접 포함되어 SRP 위반
3. 구체적인 데이터 생성 방식에 직접 의존하여 결합도가 높음

#### 추천 사항 (우선순위 순)
1. **중앙 집중식 상태 관리 도입** (Single Source of Truth)
   - `useServerMetrics` 커스텀 훅으로 실시간 메트릭 + 히스토리 데이터 통합 관리
   - 15초 주기로 새 메트릭 수집, 모든 컴포넌트에 일관된 데이터 제공
   - 현재값 기반 부정확한 히스토리 생성 로직 제거 (문제 3 해결)
2. **데이터 로직과 UI 분리** (Separation of Concerns)
   - 데이터 페칭/업데이트/히스토리 관리를 커스텀 훅으로 완전 분리
   - UI 컴포넌트는 'Dumb Component'로 렌더링만 담당
   - 테스트 용이성 및 재사용성 확보
3. **Provider 패턴 적용** (의존성 역전 원칙)
   - `ServerMetricsProvider` 컴포넌트로 Context API 활용
   - 하위 컴포넌트는 `useContext`로 데이터 소비만
   - 데이터 소스 변경 시 UI 수정 없이 Provider만 변경 가능 (DIP)

---

### ⚡ Qwen (성능 관점) - ❌ 타임아웃

**상태**: Wrapper가 600초(10분) 타임아웃 전에 응답 없음
**원인**: 복잡한 코드 분석으로 추정 (Qwen v2.3.0 YOLO Mode에도 불구하고 실패)

---

## ⚖️ 합의점과 충돌점

### ✅ 합의
- **업데이트 주기 불일치 문제 심각**: Codex(실무)와 Gemini(아키텍처) 모두 지적
- **독립 상태 관리의 위험성**: 데이터 불일치 및 동기화 문제 발생
- **구조적 개선 필요**: 현재 구조는 유지보수성과 확장성 측면에서 취약

### ⚠️ 충돌
- **즉각적 수정 vs 구조적 리팩토링**
  - Codex: 빠른 버그 수정 우선 (의존성 배열, 가드 추가)
  - Gemini: 근본적 아키텍처 개선 (Provider 패턴, 커스텀 훅 분리)
- **해결 우선순위**
  - Codex: useEffect cleanup → 업데이트 주기 통일 → 의존성 배열
  - Gemini: 상태 관리 통합 → UI/로직 분리 → Provider 패턴

---

## 🎯 Claude Code 최종 판단

### 채택된 방안
**2단계 점진적 개선 전략 (Codex 즉시 수정 + Gemini 구조 개선)**

### 선택 근거
1. **ROI 극대화**: 1인 개발 환경에서 즉각적 버그 수정과 장기 구조 개선 모두 필요
2. **리스크 관리**: 한 번에 대규모 리팩토링보다 점진적 개선이 안전
3. **실무 우선순위**: Codex가 지적한 버그(useEffect 의존성, 언마운트 가드)는 즉시 수정 필요
4. **미래 대비**: Gemini의 아키텍처 제안은 다음 스프린트에서 구조 개선 시 적용

### 기각된 의견
- ~~Gemini 즉각 적용~~: Provider 패턴 도입은 시간 투자 대비 즉각적 효과가 적음 (ROI 낮음)
- ~~Codex만 적용 후 종료~~: 근본 원인 해결 없이 임시방편만 반복하면 기술 부채 누적

---

## 📝 실행 내역

### Phase 1: 즉시 실행 (Codex 제안)
- [ ] **ImprovedServerCard.tsx:179** - useEffect 의존성 배열 추가
  ```typescript
  useEffect(() => {
    // ...
  }, [showRealTimeUpdates, index, server.id, safeServer.cpu]); // 추가
  ```
- [ ] **ServerMetricsLineChart.tsx:231** - useEffect 의존성 배열 추가
  ```typescript
  useEffect(() => {
    // ...
  }, [showRealTimeUpdates, value, type]); // 추가
  ```
- [ ] **ServerMetricsLineChart.tsx:231** - 언마운트 가드 추가
  ```typescript
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      setHistoricalData((prev) => {
        if (cancelled) return prev; // 가드 추가
        // ...
      });
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showRealTimeUpdates, value, type]);
  ```
- [ ] **업데이트 주기 통일** - Card 45초 → 60초로 변경 (Chart와 일치)
  ```typescript
  // ImprovedServerCard.tsx:234
  60000 + index * 1000 // 45000 → 60000으로 변경
  ```

### Phase 2: 향후 계획 (Gemini 제안 - 다음 스프린트)
- [ ] **커스텀 훅 분리** - `useServerMetrics` 구현
  - 실시간 메트릭 + 히스토리 데이터 통합 관리
  - 단일 소스 오브 트루스 구축
- [ ] **Provider 패턴 도입** - `ServerMetricsProvider` 구현
  - Context API로 하위 컴포넌트에 데이터 제공
  - Props drilling 제거
- [ ] **Dumb Component 전환** - `ImprovedServerCard`, `ServerMetricsLineChart`
  - 데이터 로직 완전 제거
  - 렌더링만 담당하도록 리팩토링

### Phase 3: 검증
- [ ] **E2E 테스트 작성** - 메트릭 업데이트 동기화 확인
- [ ] **메모리 프로파일링** - 언마운트 후 메모리 릭 체크
- [ ] **Lighthouse 성능 측정** - 리렌더링 최적화 효과 검증

---

## 📊 성과 지표

### Phase 1 기대 효과
- **버그 수정**: useEffect 클로저 버그 완전 해결
- **UI 일관성**: Card와 Chart 동기화로 사용자 혼란 제거
- **안정성**: 언마운트 가드로 React 경고 0건 달성

### Phase 2 기대 효과 (추정)
- **유지보수성**: 30% 향상 (데이터 로직 분리)
- **테스트 커버리지**: 현재 98.2% → 99%+ (단위 테스트 추가 가능)
- **확장성**: 새로운 메트릭 추가 시 Provider만 수정

---

## 🔗 관련 파일

**수정 대상**:
- `/mnt/d/cursor/openmanager-vibe-v5/src/components/dashboard/ImprovedServerCard.tsx` (L179, L234)
- `/mnt/d/cursor/openmanager-vibe-v5/src/components/shared/ServerMetricsLineChart.tsx` (L231, L261)

**참고 자료**:
- `/mnt/d/cursor/openmanager-vibe-v5/src/utils/metricValidation.ts`
- `/mnt/d/cursor/openmanager-vibe-v5/src/hooks/useServerMetrics.ts`
- `/mnt/d/cursor/openmanager-vibe-v5/src/hooks/useServerMetricsHistory.ts`

**Decision Log**:
- 원본 AI 응답: `/tmp/codex-metrics-20251013_215741.txt`, `/tmp/gemini-metrics-20251013_215741.txt`

---

**💡 핵심 결론**:
- **즉시 수정**: Codex 제안 (의존성 배열, 가드, 주기 통일) → ROI 높음
- **장기 개선**: Gemini 제안 (Provider 패턴, 커스텀 훅) → 다음 스프린트
- **1인 개발 최적화**: 점진적 개선으로 리스크 최소화하며 품질 향상

**⚠️ 주의사항**:
- Phase 1 완료 후 E2E 테스트로 검증 필수
- Phase 2는 최소 2-3일 작업 시간 필요, 우선순위 조정 후 진행
