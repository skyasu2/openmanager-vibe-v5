# ⚡ 성능 우선 개발 체크리스트

**베르셀 대시보드 문제 재발 방지를 위한 필수 점검 사항**

## 🚫 절대 금지 사항

### ❌ 위험한 타이머 패턴
```typescript
// 🚨 절대 사용 금지
setInterval(callback, 1000);    // 1초 간격
setInterval(callback, 500);     // 0.5초 간격
setTimeout(callback, 100);      // 100ms 간격

// 🚨 다중 독립 타이머 금지
const timer1 = setInterval(fn1, 5000);
const timer2 = setInterval(fn2, 5000);
const timer3 = setInterval(fn3, 10000);
```

### ❌ localStorage 과도한 접근
```typescript
// 🚨 루프나 타이머 내 직접 접근 금지
setInterval(() => {
  localStorage.getItem('key');  // I/O 과부하
  localStorage.setItem('key', value);
}, 1000);
```

## ✅ 필수 사용 패턴

### ✅ 통합 타이머 시스템
```typescript
import { useUnifiedTimer } from '@/hooks/useUnifiedTimer';

const timer = useUnifiedTimer();
timer.registerTask({
  id: 'auth-check',
  interval: 30000, // 최소 30초
  callback: checkAuth
});
```

### ✅ 캐시된 localStorage
```typescript
import { PerformanceUtils } from '@/hooks/usePerformanceGuard';

const authCache = PerformanceUtils.createCachedLocalStorage('auth_data', null, 60000);
const authData = authCache.get(); // 캐시된 접근
```

## 📋 개발 전 체크리스트

### 🔍 코드 작성 전
- [ ] 타이머 사용 시 최소 5초 이상 간격 설정
- [ ] localStorage 접근 시 캐싱 방식 적용
- [ ] Edge Runtime 환경 영향 고려
- [ ] 성능 가드 훅 적용 검토

### 🧪 로컬 테스트
- [ ] `npm run lint:performance` 통과
- [ ] usePerformanceGuard 경고 없음
- [ ] 개발자 도구에서 메모리 사용량 확인
- [ ] 콘솔에 성능 경고 없음

### 🚀 배포 전 검증
- [ ] `npm run build:prod` 성공
- [ ] `npm run lint:performance` 에러 없음
- [ ] Edge Runtime 시뮬레이션 테스트
- [ ] 프로덕션 모드 로컬 테스트

## ⚡ 빠른 성능 점검 명령어

```bash
# 성능 규칙 검사
npm run lint:performance

# 성능 가드와 함께 개발 서버 실행
npm run dev

# 프로덕션 모드 빌드 테스트
npm run build:prod && npm run start

# 메모리 사용량 추적 빌드
npm run build:memory
```

## 🎯 타이머 간격 가이드

| 용도 | 권장 간격 | 최소 허용 | 사용 예 |
|------|-----------|-----------|---------|
| **인증 상태 체크** | 30초+ | 10초 | useAutoLogout |
| **시간 표시 업데이트** | 30초+ | 5초 | useSystemAutoShutdown |
| **서버 상태 체크** | 5분+ | 1분 | useSystemStatus |
| **UI 새로고침** | 10분+ | 5분 | 대시보드 데이터 |

## 🚨 즉시 대응 방안

### 프로덕션에서 성능 문제 발견 시
1. **즉시 롤백**: `git revert [commit-hash]`
2. **문제 타이머 확인**: 개발자 도구 → Performance 탭
3. **임시 해결**: 타이머 간격 5배 증가
4. **근본 해결**: 통합 타이머로 교체

### 로컬에서 성능 경고 발생 시
```bash
# 성능 가드 리포트 확인
console.log('Performance issues detected');

# 자동 수정 실행
npm run lint:performance:fix

# 수동 확인 후 재테스트
npm run dev
```

## 💡 개발 팁

### 🔧 디버깅 도구
```typescript
// 개발 환경에서 성능 모니터링
if (process.env.NODE_ENV === 'development') {
  const { generateReport } = usePerformanceGuard();
  
  // 5분마다 성능 리포트
  setTimeout(() => {
    generateReport();
  }, 300000);
}
```

### 📊 메모리 사용량 체크
```typescript
// 메모리 사용량 확인
const checkMemory = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', Math.round(memory.usedJSHeapSize / 1024 / 1024), 'MB');
  }
};
```

## 🎓 학습 리소스

- [Vercel Edge Runtime 제약사항](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [React 성능 최적화 패턴](https://react.dev/reference/react/useMemo)
- [JavaScript 타이머 최적화](https://developer.mozilla.org/en-US/docs/Web/API/setInterval)

---

**⚠️ 중요**: 이 체크리스트를 매번 확인하여 베르셀 성능 문제 재발을 방지하세요!