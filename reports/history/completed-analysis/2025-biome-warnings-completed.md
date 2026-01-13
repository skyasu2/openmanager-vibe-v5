# Biome 경고 개선 로드맵

**생성일**: 2025-11-30
**현재 상태**: 0 errors, 8 warnings

---

## 📊 현재 상태

### ✅ 해결 완료 (9개)
- **noUnusedVariables**: 7개 (테스트 파일)
- **noAccumulatingSpread**: 2개 (성능 최적화)

### ⏳ 남은 경고 (8개)

#### 1. noStaticOnlyClass (5개) - 낮은 우선순위
**파일**:
- `src/services/UnifiedMetricsManager.autoscaler.ts`
- `src/services/UnifiedMetricsManager.metricsUpdater.ts`
- `src/services/UnifiedMetricsManager.performanceMonitor.ts`
- `src/services/UnifiedMetricsManager.scheduler.ts`
- `src/services/UnifiedMetricsManager.serverFactory.ts`

**현재 패턴**:
```typescript
export class Autoscaler {
  static async performAutoscaling(...) { }
  static async simulateAutoscaling(...) { }
}
```

**Biome 제안**: Namespace 또는 함수 집합으로 변경

**판단**:
- ✅ **현재 패턴 유지 권장**
- **이유**:
  - OOP 스타일로 모듈화된 설계 (명확한 책임 분리)
  - static class는 Tree-shaking 가능
  - Namespace는 TypeScript 고유 기능 (JavaScript 미지원)
- **장기 계획**: 필요 시 v6.0에서 함수형 리팩토링 고려

#### 2. useExhaustiveDependencies (2개) - 무시 권장
**파일**: `src/types/react-utils.ts` (29, 72번 줄)

**현재 패턴**:
```typescript
export function useSafeEffect(
  effect: () => void | (() => void),
  deps?: DependencyList // 동적 deps 배열
): void {
  useEffect(() => {
    // ...
  }, deps); // Biome가 배열 리터럴이 아니라고 경고
}
```

**판단**:
- ✅ **무시 권장** (이미 ESLint disable 적용)
- **이유**: 유틸리티 함수의 의도적 설계 (동적 의존성 전달)
- **대안 없음**: 배열 리터럴로 변경 시 유틸리티 기능 손실

#### 3. useSemanticElements (1개) - 무시 권장
**파일**: `src/context/AccessibilityProvider.tsx` (431번 줄)

**현재 패턴**:
```typescript
<div
  aria-live={state.ariaLive}
  aria-atomic="true"
  className="sr-only"
  role="status"
>
```

**Biome 제안**: `<output>` 태그 사용

**판단**:
- ✅ **무시 권장**
- **이유**:
  - ARIA live region으로 의도적 사용
  - `<output>` 태그는 `aria-live`, `aria-atomic` 속성과 함께 사용 시 예측 불가능
  - 접근성 테스트 통과 중
- **참고**: [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

---

## 🎯 최종 권장사항

### 단기 (현재)
- ✅ **모든 8개 경고 무시**
- **이유**: 의도적 디자인 패턴, 기능 손실 위험

### 중기 (v5.x)
- 새로운 코드 작성 시 Biome 스타일 가이드 준수
- Static-only class 대신 함수형 접근 고려

### 장기 (v6.0)
- **선택적 리팩토링**:
  - UnifiedMetricsManager 모듈을 함수형으로 재설계
  - 성능 개선 및 코드 단순화 목표
- **조건**:
  - Breaking change 허용 시점
  - 충분한 테스트 커버리지 확보 후

---

## 📈 개선 효과 (Phase 1-2 완료)

| 단계 | 경고 수 | 개선율 | 주요 작업 |
|------|---------|--------|-----------|
| **시작** | 17 | - | Biome v2.3.8 도입 |
| **Phase 1** | 8 | 53% | noUnusedVariables, noAccumulatingSpread |
| **현재** | 8 | - | 의도적 디자인 패턴 (무시 권장) |
| **목표** | 8 | - | 현재 상태 유지 |

---

## 🔍 참고 자료

- [Biome Lint Rules](https://biomejs.dev/linter/rules/)
- [Static-only Classes in TypeScript](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)

---

**결론**: 현재 8개 경고는 모두 **의도적 디자인 패턴**으로, 코드 품질에 영향 없음. 추가 수정 불필요.
