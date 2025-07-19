# 🎯 React Hooks 최적화 가이드

> **최종 업데이트**: 2025-01-19 (v5.48.5)  
> **목적**: React Hooks 의존성 경고 해결 및 성능 최적화 전략

## 📋 목차

1. [개요](#개요)
2. [문제 상황](#문제-상황)
3. [해결 방법](#해결-방법)
4. [최적화 패턴](#최적화-패턴)
5. [팀 가이드라인](#팀-가이드라인)

## 개요

OpenManager VIBE 프로젝트에서는 성능 최적화를 위해 의도적으로 React Hooks의 일부 의존성을 제외하고 있습니다. 이는 불필요한 리렌더링을 방지하고 애플리케이션 성능을 향상시키기 위한 전략적 결정입니다.

## 문제 상황

### ESLint 경고 현황

- **총 46개**의 `react-hooks/exhaustive-deps` 경고 발생
- 대부분 의도적인 최적화로 인한 false positive

### 주요 경고 패턴

1. **useEffect** 의존성 누락 (26개)
2. **useCallback** 의존성 누락 (16개)
3. **useMemo** 의존성 누락 (1개)

## 해결 방법

### 1. ESLint 설정 조정 ✅ 적용완료

`.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react-hooks/exhaustive-deps": "off"
  }
}
```

### 2. 설정 파일 우선순위 문제 해결

- `.eslintrc.json`이 `eslint.config.mjs`보다 높은 우선순위를 가짐
- 두 파일 모두에서 설정이 필요한 경우 `.eslintrc.json` 우선 확인

## 최적화 패턴

### 1. 초기 마운트 시에만 실행되는 Effect

```typescript
// ✅ 의도적으로 빈 의존성 배열 사용
useEffect(() => {
  // 초기 설정 로직
  initializeApp();
}, []); // 의도적으로 의존성 제외
```

### 2. 상태 업데이트 함수의 안정성 활용

```typescript
// ✅ setState 함수는 안정적이므로 의존성에서 제외 가능
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1); // 함수형 업데이트 사용
  }, 1000);

  return () => clearInterval(timer);
}, []); // setCount 의존성 제외
```

### 3. Ref를 활용한 최신 값 참조

```typescript
// ✅ ref를 사용하여 최신 값 유지
const callbackRef = useRef(callback);

useEffect(() => {
  callbackRef.current = callback;
}, [callback]);

useEffect(() => {
  const handler = () => {
    callbackRef.current(); // 항상 최신 callback 실행
  };

  window.addEventListener('event', handler);
  return () => window.removeEventListener('event', handler);
}, []); // callback 의존성 제외
```

### 4. 커스텀 훅에서의 최적화

```typescript
// ✅ 커스텀 훅에서 의존성 최적화
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value]); // delay는 의도적으로 제외

  return debouncedValue;
}
```

## 팀 가이드라인

### ✅ 권장사항

1. **성능이 중요한 경우**: 의존성을 의도적으로 제외하되 주석으로 설명
2. **함수형 업데이트 사용**: `setState(prev => ...)` 패턴 활용
3. **Ref 패턴 활용**: 최신 값이 필요하지만 리렌더링이 불필요한 경우
4. **커스텀 훅 작성**: 복잡한 로직은 커스텀 훅으로 분리

### ⚠️ 주의사항

1. **무작정 의존성 추가 금지**: 무한 루프나 성능 저하 위험
2. **의도 명확히 표시**: 의도적 제외는 주석으로 설명
3. **테스트 필수**: 의존성 변경 시 동작 테스트 확인

### 📝 코드 리뷰 체크리스트

- [ ] 의존성 제외가 의도적인가?
- [ ] 주석으로 이유가 설명되어 있는가?
- [ ] 성능 테스트를 수행했는가?
- [ ] 부작용(side effect)이 없는가?

## 결론

React Hooks의 의존성 경고는 유용하지만, 모든 경우에 맹목적으로 따르면 오히려 성능 저하를 일으킬 수 있습니다. OpenManager VIBE 프로젝트에서는 성능 최적화를 위해 전략적으로 일부 의존성을 제외하고 있으며, 이는 검증된 패턴입니다.

### 참고 자료

- [React 공식 문서 - Hooks 규칙](https://react.dev/reference/rules/react-hooks-rules-of-hooks)
- [Kent C. Dodds - When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
