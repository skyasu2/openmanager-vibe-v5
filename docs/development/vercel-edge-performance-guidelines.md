# Vercel Edge Runtime 성능 가이드라인

## 🎯 Edge Runtime 특성 이해

### Edge Runtime vs Node.js Runtime 차이점
```typescript
// Edge Runtime 제약사항
- 메모리: 128MB 제한
- CPU: 엄격한 실행 시간 제한  
- I/O: 제한된 파일 시스템 접근
- 타이머: 빈번한 setInterval 성능 영향
```

## ⚠️ 금지 패턴 (Edge Runtime에서 문제 발생)

### 1. 빈번한 타이머 사용
```typescript
// ❌ 절대 금지
setInterval(callback, 1000);   // 1초 간격
setInterval(callback, 500);    // 0.5초 간격

// ✅ 권장
setInterval(callback, 30000);  // 30초 이상
setInterval(callback, 300000); // 5분 권장
```

### 2. 과도한 localStorage 접근
```typescript
// ❌ 매초 접근
setInterval(() => {
  localStorage.getItem('key'); // I/O 오버헤드
}, 1000);

// ✅ 필요시에만 접근 + 캐싱
let cachedValue = null;
const getCachedValue = () => {
  if (!cachedValue) {
    cachedValue = localStorage.getItem('key');
  }
  return cachedValue;
};
```

### 3. 동시 다중 타이머
```typescript
// ❌ 독립 타이머 다수 생성
const timer1 = setInterval(fn1, 1000);
const timer2 = setInterval(fn2, 1000);
const timer3 = setInterval(fn3, 5000);

// ✅ 통합 타이머 패턴
const unifiedTimer = useUnifiedTimer();
unifiedTimer.registerTask('task1', 30000, fn1);
unifiedTimer.registerTask('task2', 30000, fn2);
unifiedTimer.registerTask('task3', 300000, fn3);
```

## ✅ 권장 패턴

### 1. 통합 타이머 시스템
```typescript
// src/hooks/useUnifiedTimer.ts 활용
export function useOptimizedComponent() {
  const timer = useUnifiedTimer(5000); // 5초 베이스
  
  useEffect(() => {
    timer.registerTask({
      id: 'auth-check',
      interval: 30000, // 30초마다 실행
      callback: checkAuthStatus
    });
    
    return () => timer.unregisterTask('auth-check');
  }, []);
}
```

### 2. 지연 로딩 패턴
```typescript
// 초기 로드 지연으로 Edge 리소스 절약
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

### 3. 메모이제이션 활용
```typescript
// 계산 비용 높은 작업 캐싱
const expensiveValue = useMemo(() => {
  return computeHeavyOperation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  // 리렌더링 시 함수 재생성 방지
}, [dependencies]);
```

## 🔍 Edge Runtime 디버깅

### 성능 모니터링 코드
```typescript
// 개발 환경에서 성능 추적
if (process.env.NODE_ENV === 'development') {
  const performanceMonitor = () => {
    console.log({
      memory: (performance as any).memory,
      timing: performance.now(),
      activeTimers: getActiveTimers().length
    });
  };
  
  // 30초마다 성능 체크
  setInterval(performanceMonitor, 30000);
}
```

### Edge Runtime 환경 감지
```typescript
const isEdgeRuntime = () => {
  try {
    return process.env.NEXT_RUNTIME === 'edge';
  } catch {
    return false;
  }
};

// Edge Runtime에서 다른 전략 사용
if (isEdgeRuntime()) {
  // 경량 로직 사용
  useOptimizedStrategy();
} else {
  // 일반 로직 사용
  useStandardStrategy();
}
```

## 📊 성능 기준선

### 타이머 간격 가이드
- **실시간 필요**: 10초 이상
- **준실시간**: 30초 이상  
- **일반 업데이트**: 5분 이상
- **배경 작업**: 15분 이상

### 메모리 사용량 체크
```typescript
// 메모리 사용량 모니터링
const checkMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      if (usedMB > 100) {
        console.warn('높은 메모리 사용량 감지:', usedMB, 'MB');
      }
    }
  }
};
```

## ⚡ 최적화 체크리스트

### 배포 전 필수 점검
- [ ] 1-5초 간격 타이머 없음
- [ ] localStorage 과도한 접근 없음  
- [ ] 통합 타이머 시스템 적용
- [ ] 메모이제이션 적용 확인
- [ ] Edge Runtime 테스트 완료
- [ ] 성능 모니터링 코드 추가

### Vercel 배포 시 주의사항
```bash
# 배포 전 성능 테스트
npm run build && npm run start
# → 프로덕션 모드에서 타이머 동작 확인

# Edge Runtime 시뮬레이션
NEXT_RUNTIME=edge npm run dev
# → Edge 환경 시뮬레이션 테스트
```

## 🚨 긴급 대응 방안

### 프로덕션 문제 발생 시
1. **즉시 롤백**: 이전 안정 버전으로 복구
2. **타이머 비활성화**: 문제 타이머 즉시 중단
3. **Edge Runtime 우회**: Node.js Runtime으로 임시 전환
4. **모니터링 강화**: 실시간 성능 추적 활성화

### 예방적 모니터링
```typescript
// 프로덕션 환경 자동 모니터링
if (process.env.NODE_ENV === 'production') {
  // 5분마다 성능 체크
  setInterval(() => {
    fetch('/api/performance-check', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        performance: performance.now()
      })
    });
  }, 300000);
}
```

## 📚 참고 자료

- [Vercel Edge Runtime 공식 문서](https://vercel.com/docs/concepts/functions/edge-functions)
- [Next.js 성능 최적화 가이드](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React 성능 최적화 패턴](https://react.dev/reference/react/useMemo)