# GitHub OAuth 로그인 무한 루프 해결 가이드

## 문제 설명

Vercel 배포 환경에서 GitHub OAuth 로그인 후 로그인 페이지로 계속 리다이렉트되는 무한 루프 발생

## 근본 원인

1. **HTTPS 환경에서 쿠키 설정 실패**
   - `Secure` 속성 누락으로 HTTPS에서 쿠키가 설정되지 않음
   - Vercel은 HTTPS 필수, 로컬은 HTTP 사용

2. **세션 동기화 타이밍 문제**
   - 클라이언트에서 세션 설정 → 서버에서 즉시 확인
   - Vercel Edge Runtime의 분산 처리로 인한 지연

3. **미들웨어 세션 검증 로직**
   - `auth_verified` 쿠키를 확인하지만 즉시 통과시키지 않음

## 적용된 해결책

### 1. 쿠키 설정 개선

```typescript
// auth/callback/page.tsx - HTTPS 환경 대응
const isProduction = window.location.protocol === 'https:';
document.cookie = `auth_verified=true; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${isProduction ? '; Secure' : ''}`;

// LoginClient.tsx - 게스트 로그인도 동일하게 처리
const secureFlag = isProduction ? '; Secure' : '';
document.cookie = `guest_session_id=${guestSession.sessionId}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax${secureFlag}`;
```

### 2. 미들웨어 임시 통과 로직

```typescript
// middleware.ts - auth_verified 쿠키 발견 시 즉시 통과
if (authVerifiedCookie) {
  console.log('✅ OAuth 인증 확인됨 (auth_verified 쿠키)');
  return response;  // 세션 동기화 대기 없이 즉시 통과
}
```

## 추가 권장사항

### 단기 개선사항

1. **Supabase 콜백 URL 확인**
   - Supabase 대시보드에서 Redirect URLs에 다음 추가:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-custom-domain.com/auth/callback`

2. **환경변수 확인**
   - Vercel 대시보드에서 다음 환경변수 설정:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXTAUTH_URL` (프로덕션 URL로 설정)

### 장기 개선사항

1. **서버 컴포넌트로 마이그레이션**
   - `/auth/callback`을 서버 컴포넌트로 변경
   - 서버에서 PKCE 플로우 완전 처리

2. **Memory Cache 세션 캐싱**
   - Upstash Memory Cache로 세션 상태 중앙화
   - 분산 환경에서 세션 일관성 보장

3. **모니터링 추가**
   - OAuth 성공/실패율 추적
   - 콜백 → 메인 페이지 이동 시간 측정

## 테스트 방법

1. **로컬 테스트**
   ```bash
   npm run dev
   # http://localhost:3000에서 GitHub 로그인 테스트
   ```

2. **Vercel Preview 테스트**
   - PR 생성 후 Preview URL에서 테스트
   - 브라우저 개발자 도구에서 쿠키 확인

3. **프로덕션 테스트**
   - 배포 후 실제 도메인에서 테스트
   - 네트워크 탭에서 쿠키 `Secure` 속성 확인

## 디버깅 팁

1. **쿠키 확인**
   - 개발자 도구 → Application → Cookies
   - `auth_verified`, `sb-*` 쿠키 존재 여부 확인

2. **콘솔 로그 확인**
   - 미들웨어 로그: Vercel Functions 로그에서 확인
   - 클라이언트 로그: 브라우저 콘솔에서 확인

3. **네트워크 분석**
   - `/auth/callback` → `/main` 리다이렉트 체인 확인
   - 각 요청의 쿠키 헤더 확인

## 관련 파일

- `/src/app/auth/callback/page.tsx` - OAuth 콜백 처리
- `/src/app/login/LoginClient.tsx` - 로그인 페이지
- `/src/middleware.ts` - 인증 검증 미들웨어
- `/src/lib/supabase-auth.ts` - Supabase 인증 유틸리티

---

마지막 업데이트: 2025-08-03