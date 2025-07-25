# GitHub OAuth 로그인 최적화 가이드

## 🔍 현재 상태 분석

### 📊 단계별 소요 시간 (2025.07.25 기준)

#### 전체 플로우

```
[로그인 페이지] → [GitHub OAuth] → [콜백] → [성공 페이지] → [메인 페이지]
     0초               외부            0.5초      8.5~14.5초        완료
```

#### 상세 시간 분석

| 단계             | 로컬 환경 | Vercel 환경 | 설명             |
| ---------------- | --------- | ----------- | ---------------- |
| OAuth 리다이렉트 | 즉시      | 즉시        | GitHub로 이동    |
| 콜백 처리        | 0.5초     | 0.5초       | 코드→세션 교환   |
| **성공 페이지**  | **8.5초** | **14.5초**  | **주요 병목**    |
| - 초기 대기      | 2.5초     | 4초         | 세션 안정화 대기 |
| - 세션 새로고침  | 1.5초     | 7.5초 (3회) | refreshSession() |
| - 쿠키 동기화    | 2.5초     | 6초         | 쿠키 전파 대기   |
| - 최종 검증      | 2초       | 2초         | getUser() 확인   |

### 🚨 문제점

1. **과도한 대기 시간**: Vercel에서 최대 14.5초
2. **불필요한 재시도**: 세션이 이미 생성되었는데도 반복
3. **하드코딩된 지연**: 실제 필요 여부와 관계없이 고정 대기

## 🚀 최적화 전략

### 1단계: 즉시 적용 가능한 개선 (50% 단축)

```typescript
// success/page.tsx 최적화

// 1. 환경별 대기 시간 단축
const initialWait = isVercel ? 2000 : 1000; // 4000 → 2000ms
const retryWait = isVercel ? 1500 : 1000; // 2500 → 1500ms
const cookieWait = isVercel ? 3000 : 1500; // 6000 → 3000ms

// 2. 불필요한 재시도 제거
const maxRetries = isVercel ? 3 : 2; // 5 → 3회

// 3. 병렬 처리
await Promise.all([
  supabase.auth.refreshSession(),
  new Promise(resolve => setTimeout(resolve, 1000)),
]);
```

**예상 결과**:

- 로컬: 8.5초 → 4.5초
- Vercel: 14.5초 → 7.5초

### 2단계: 구조적 개선 (70% 단축)

```typescript
// 1. 폴링 대신 이벤트 기반 처리
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    router.push('/main');
  }
});

// 2. 세션 검증 최소화
const {
  data: { session },
} = await supabase.auth.getSession();
if (session?.user) {
  // 즉시 리다이렉트, getUser() 생략
  router.push('/main');
}

// 3. 쿠키 대기 제거
// SameSite=Lax는 즉시 적용됨
```

**예상 결과**:

- 로컬: 4.5초 → 2초
- Vercel: 7.5초 → 3초

### 3단계: 근본적 재설계 (90% 단축)

```typescript
// callback/page.tsx에서 직접 리다이렉트
export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const { data } = await supabase.auth.exchangeCodeForSession(code);

      if (data.session) {
        // success 페이지 건너뛰고 바로 이동
        router.push('/main');
      }
    };
  }, []);
}
```

**예상 결과**:

- 전체 플로우: 1초 미만

## 📝 단계별 구현 가이드

### Phase 1: Quick Win (즉시 적용)

1. `success/page.tsx`의 대기 시간 상수 조정
2. 불필요한 세션 새로고침 횟수 감소
3. 병렬 처리로 순차 대기 제거

### Phase 2: 미들웨어 최적화

1. 미들웨어에서 세션 검증 강화
2. success 페이지 의존도 감소
3. 쿠키 기반 인증 상태 관리 개선

### Phase 3: 플로우 재설계

1. success 페이지 제거 검토
2. 콜백에서 직접 리다이렉트
3. 클라이언트 사이드 세션 관리 최소화

## 🔧 즉시 적용 가능한 코드

```typescript
// src/app/auth/success/page.tsx 수정 예시

// 기존 코드
const initialWait = isVercel ? 4000 : 2500;

// 최적화된 코드
const initialWait = isVercel ? 2000 : 1000;

// Progressive Enhancement: 세션 확인되면 즉시 진행
const checkSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    return true;
  }
  return false;
};

// 폴링 대신 Promise.race 사용
const sessionReady = await Promise.race([
  checkSession(),
  new Promise(resolve => setTimeout(() => resolve(false), initialWait)),
]);

if (sessionReady) {
  router.push('/main');
  return;
}
```

## 📊 성능 목표

| 환경   | 현재   | 1단계 목표 | 2단계 목표 | 최종 목표 |
| ------ | ------ | ---------- | ---------- | --------- |
| 로컬   | 8.5초  | 4.5초      | 2초        | < 1초     |
| Vercel | 14.5초 | 7.5초      | 3초        | < 2초     |

## 🚦 구현 우선순위

1. **긴급** (오늘): Phase 1 대기 시간 단축
2. **중요** (이번 주): Phase 2 구조 개선
3. **계획** (다음 주): Phase 3 플로우 재설계

## 🔍 모니터링 포인트

```typescript
// 각 단계별 시간 측정
console.time('oauth-total');
console.time('oauth-callback');
console.time('oauth-success');
console.time('oauth-redirect');

// 성능 메트릭 수집
performance.mark('oauth-start');
performance.mark('oauth-session-created');
performance.mark('oauth-redirect-ready');
performance.mark('oauth-complete');
```

## 💡 추가 최적화 아이디어

1. **서비스 워커 활용**: 세션 사전 캐싱
2. **Optimistic UI**: 인증 성공 가정하고 UI 먼저 표시
3. **Edge Functions**: Vercel Edge에서 세션 검증
4. **WebSocket**: 실시간 세션 상태 전달

## 📞 문제 발생 시

1. 세션 생성 실패: 대기 시간을 점진적으로 증가
2. 쿠키 동기화 문제: localStorage 폴백
3. 리다이렉트 실패: 수동 링크 제공

---

작성일: 2025-07-25
작성자: Claude & Human
