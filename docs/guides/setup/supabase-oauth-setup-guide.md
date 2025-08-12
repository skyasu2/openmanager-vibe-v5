# 🔐 Supabase OAuth 설정 가이드

## 문제 상황

GitHub 로그인 후 다시 로그인 화면으로 돌아가는 문제 해결

## 1. Supabase 대시보드 설정 확인

### 1.1 Redirect URLs 설정

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** → **URL Configuration** 이동
4. **Redirect URLs** 섹션에서 다음 URL들이 모두 추가되어 있는지 확인:

```
# Vercel 프로덕션 (실제 도메인으로 변경)
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app

# Vercel 프리뷰 (와일드카드 허용)
https://*.vercel.app/auth/callback
https://*.vercel.app

# 로컬 개발
http://localhost:3000/auth/callback
http://localhost:3000
```

### 1.2 Site URL 설정

- **Site URL**: `https://your-app.vercel.app` (실제 도메인으로 변경)
- 이 URL은 이메일 템플릿에서 사용됩니다

## 2. GitHub OAuth App 설정 확인

### 2.1 GitHub OAuth App 설정

1. GitHub → Settings → Developer settings → OAuth Apps
2. 해당 OAuth App 선택
3. **Authorization callback URL** 확인:

   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```

   - `[YOUR_SUPABASE_PROJECT_REF]`는 Supabase 프로젝트 ID

### 2.2 Homepage URL

- **Homepage URL**: `https://your-app.vercel.app`

## 3. 환경 변수 확인

### 3.1 Vercel 환경 변수

Vercel 대시보드에서 다음 환경 변수가 설정되어 있는지 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# GitHub OAuth (Supabase가 관리하므로 직접 설정 불필요)
# GITHUB_CLIENT_ID와 GITHUB_CLIENT_SECRET는 Supabase에서 관리
```

### 3.2 로컬 개발 환경 (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

## 4. 디버깅 체크리스트

### 4.1 브라우저 개발자 도구

1. Network 탭에서 OAuth 플로우 확인:
   - `/auth/v1/authorize` 요청
   - GitHub로 리다이렉트
   - `/auth/callback` 응답
   - 최종 리다이렉트 위치

2. Application → Cookies 확인:
   - `sb-[project-ref]-auth-token` 쿠키 존재 여부
   - 쿠키 도메인과 경로 확인

### 4.2 콘솔 로그 확인

```javascript
// 다음 로그들을 확인:
🔐 GitHub OAuth 로그인 시작...
🌍 현재 환경: { origin, supabaseUrl, isLocal, isVercel }
🔐 OAuth 콜백 페이지 로드...
✅ 세션 확인됨: [user-email]
```

## 5. 일반적인 문제와 해결 방법

### 5.1 "Invalid Redirect URL" 에러

- **원인**: Supabase에 Redirect URL이 등록되지 않음
- **해결**: 위 1.1 섹션의 URL들을 모두 추가

### 5.2 세션이 생성되지 않음

- **원인**: 쿠키 도메인 불일치
- **해결**:
  - Vercel 도메인과 Supabase URL이 일치하는지 확인
  - HTTPS 사용 확인 (프로덕션)

### 5.3 무한 리다이렉트

- **원인**: 미들웨어 세션 검증 실패
- **해결**: 이 가이드의 코드 수정사항 적용

## 6. 테스트 방법

1. 브라우저 시크릿 모드 사용 (쿠키 충돌 방지)
2. `/login` 페이지 접속
3. GitHub 로그인 클릭
4. GitHub 인증 완료
5. `/main`으로 정상 리다이렉트 확인

## 7. 추가 도움말

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Vercel 환경 변수 설정](https://vercel.com/docs/environment-variables)
