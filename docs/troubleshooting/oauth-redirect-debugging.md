# OAuth 리다이렉트 디버깅 가이드

## 🐛 문제 상황

GitHub OAuth 로그인 후 `/main`으로 리다이렉트되지 않고 다시 로그인 페이지로 이동하는 문제

## 📋 체크리스트

### 1. 브라우저 개발자 도구 확인

```javascript
// 콘솔에서 다음 로그 확인:
'🔐 OAuth 콜백 처리'; // 콜백 페이지 진입
'✅ OAuth 인증 성공'; // 세션 생성 확인
'🔄 리다이렉트 시도: /main'; // 리다이렉트 시작
'🔐 미들웨어 세션 체크'; // 미들웨어 동작 확인
```

### 2. 쿠키 확인

- 개발자 도구 > Application > Cookies
- `sb-` 로 시작하는 쿠키들이 있는지 확인
- 특히 `sb-access-token`, `sb-refresh-token` 확인

### 3. 네트워크 탭 확인

- `/auth/callback` → `/main` 리다이렉트 확인
- 302/303 상태 코드 확인
- `/main` 요청이 다시 `/login`으로 리다이렉트되는지 확인

## 🔧 임시 해결책

### 방법 1: 브라우저 캐시 및 쿠키 초기화

```bash
# 브라우저에서
1. 개발자 도구 열기 (F12)
2. Application > Storage > Clear site data
3. 다시 로그인 시도
```

### 방법 2: 직접 접근

```bash
# OAuth 로그인 성공 후
1. 주소창에 직접 /main 입력
2. 이미 세션이 있다면 접근 가능
```

## 🚀 개선 사항 (이미 적용됨)

### 1. OAuth 콜백 페이지 개선

- `window.location.replace()` 사용으로 더 강력한 리다이렉트
- 라우터 캐시 갱신 (`router.refresh()`)
- 충분한 대기 시간 확보

### 2. 미들웨어 개선

- 세션 확인 재시도 로직 (2회)
- OAuth 콜백 직후 추가 대기

## 🎯 근본적 해결 방안

### 옵션 1: 중간 페이지 추가

```typescript
// /auth/success 페이지 생성
// OAuth 성공 후 여기로 리다이렉트
// 세션 확인 후 /main으로 이동
```

### 옵션 2: 클라이언트 사이드 검증

```typescript
// /main 페이지에서 클라이언트 측 세션 확인
// 세션이 없으면 잠시 대기 후 재확인
// 여전히 없으면 로그인으로 이동
```

### 옵션 3: 쿠키 도메인/경로 명시

```typescript
// supabase-ssr.ts에서 쿠키 옵션 개선
{
  domain: process.env.NEXT_PUBLIC_DOMAIN,
  path: '/',
  sameSite: 'lax',
  secure: true
}
```

## 📞 지원 요청 시 제공할 정보

1. 브라우저 콘솔 로그 (전체)
2. 네트워크 탭 스크린샷
3. 쿠키 목록 스크린샷
4. 사용 중인 브라우저 및 버전
5. 개발/프로덕션 환경 여부
