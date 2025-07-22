# GitHub OAuth 설정 가이드

## 🔍 문제 해결 완료

### 발견된 문제점

1. **잘못된 redirectTo 구현**: `useSupabaseSession.ts`의 `signIn` 함수가 OAuth flow를 무시하고 직접 리다이렉트
2. **OAuth Callback 미사용**: Supabase는 반드시 `/auth/callback`을 거쳐야 하는데 이를 우회
3. **중복된 구현**: 올바른 구현이 있었지만 사용되지 않음

### 적용된 해결책

1. `useSupabaseSession.ts`의 `signIn` 함수 수정
   - redirectTo를 `/auth/callback?redirect=/main` 형식으로 변경
   - OAuth flow를 올바르게 따르도록 수정

2. `GitHubLoginButton.tsx`의 기본 callbackUrl을 `/main`으로 변경

3. OAuth 디버깅 엔드포인트 추가 (`/api/auth/debug`)

## 📋 Supabase 대시보드 설정 체크리스트

### 1. GitHub Provider 활성화

- Supabase 대시보드 → Authentication → Providers → GitHub 활성화

### 2. Site URL 설정

- Authentication → URL Configuration
- Site URL: `https://openmanager-vibe-v5.vercel.app` (프로덕션)

### 3. Redirect URLs 추가

반드시 다음 URL들을 모두 추가:

```
http://localhost:3000/auth/callback
https://openmanager-vibe-v5.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

### 4. 환경변수 확인

Vercel 대시보드에서 다음 환경변수가 설정되어 있는지 확인:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔄 OAuth Flow

1. 사용자가 GitHub 로그인 버튼 클릭
2. `signIn('github', { callbackUrl: '/main' })` 호출
3. Supabase가 GitHub OAuth 페이지로 리다이렉트
4. GitHub 인증 완료 후 `/auth/callback?redirect=/main`으로 리턴
5. Callback 라우트에서 세션 생성 후 `/main`으로 최종 리다이렉트

## 🐛 디버깅

### OAuth 상태 확인

```bash
# 로컬
curl http://localhost:3000/api/auth/debug

# 프로덕션
curl https://openmanager-vibe-v5.vercel.app/api/auth/debug
```

### 일반적인 오류 해결

#### "Invalid redirect_uri" 오류

- Supabase 대시보드의 Redirect URLs 확인
- 와일드카드 URL 추가 확인

#### 로그인 후 리다이렉트 실패

- `/auth/callback` 라우트가 올바르게 구현되어 있는지 확인
- URL 파라미터 처리 로직 확인

#### 세션이 생성되지 않음

- Supabase URL과 Anon Key가 올바른지 확인
- 네트워크 요청에서 에러 응답 확인

## 🚀 재발 방지

1. **코드 리뷰**: OAuth 관련 코드 변경 시 반드시 전체 flow 확인
2. **테스트**: 로컬과 프로덕션 환경 모두에서 테스트
3. **문서화**: 이 가이드를 참고하여 설정 유지
4. **모니터링**: `/api/auth/debug` 엔드포인트로 정기적인 상태 확인

## 📞 추가 지원

문제가 지속되면 다음을 확인:

1. Supabase 대시보드 로그
2. Vercel 함수 로그
3. 브라우저 네트워크 탭에서 OAuth 요청/응답
