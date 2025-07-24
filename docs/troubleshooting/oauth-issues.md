# 🔐 OAuth 인증 문제 해결 가이드

## 🎉 최근 해결 완료 (2025-01-24)

**GitHub OAuth 리다이렉트 루프 문제가 성공적으로 해결되었습니다!**

- ✅ Vercel 환경에서 안정적인 GitHub 로그인 구현
- ✅ 쿠키 동기화 지연 문제 해결
- ✅ 미들웨어 Auth Flow 감지 및 관대한 처리 구현
- 📊 **상세 분석**: [OAuth 성공 분석 문서](../oauth-success-analysis.md) 참조

## 📋 목차

1. [GitHub OAuth 리다이렉트 루프](#github-oauth-리다이렉트-루프)
2. [Vercel 환경 세션 동기화](#vercel-환경-세션-동기화)
3. [일반적인 OAuth 문제들](#일반적인-oauth-문제들)

## GitHub OAuth 리다이렉트 루프

### 🚨 증상 (해결됨 ✅)

- GitHub 로그인 버튼 클릭 시 OAuth 페이지로 이동
- 인증 완료 후 다시 로그인 페이지로 리다이렉트
- 브라우저 콘솔에 "✅ 사용자 인증 완료" 후 리다이렉트 실패

**현재 상태**: ✅ **해결 완료** (2025-01-24)

### 🔍 원인 분석

1. **잘못된 콜백 URL**: 애플리케이션 URL 대신 Supabase URL 사용해야 함
2. **쿠키 동기화 지연**: Vercel 환경에서 세션 쿠키 전파 시간 필요
3. **미들웨어 타이밍**: 인증 플로우 중 너무 엄격한 세션 검증

### ✅ 해결 방법

#### 1. OAuth 콜백 URL 수정

```typescript
// ❌ 잘못된 방법
const callbackUrl = `${baseUrl}/auth/callback`;

// ✅ 올바른 방법
const redirectTo = `${baseUrl}/auth/success`;
// GitHub OAuth 앱 설정: https://your-project.supabase.co/auth/v1/callback
```

#### 2. 세션 확인 로직 개선

```typescript
// 재시도 로직 추가
let session = null;
let attempts = 0;
const maxAttempts = isVercel ? 8 : 5;

while (!session && attempts < maxAttempts) {
  const { data } = await supabase.auth.getSession();
  session = data.session;

  if (!session && attempts < maxAttempts - 1) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  attempts++;
}
```

#### 3. 미들웨어 Auth 플로우 감지

```typescript
// 인증 진행 상태 추적
const authInProgress = request.cookies.get('auth_in_progress');
const isInAuthFlow = isFromAuth || authInProgress;

// 관대한 처리
if (isInAuthFlow && !userError) {
  console.log('⚠️ Auth 플로우 중 - 세션 없음이지만 통과 허용');
  return response;
}
```

## Vercel 환경 세션 동기화

### 🚨 증상 (해결됨 ✅)

- 로컬에서는 정상 작동하지만 Vercel에서 실패
- "쿠키 동기화 대기 중..." 후 로그인 페이지로 리다이렉트

**현재 상태**: ✅ **해결 완료** (2025-01-24)

### ✅ 해결 방법

#### 1. 환경별 대기 시간 조정

```typescript
const cookieWait = isVercel ? 6000 : 2500;
console.log(`⏳ 쿠키 동기화 대기 중... (${cookieWait}ms)`);
await new Promise(resolve => setTimeout(resolve, cookieWait));
```

#### 2. 상태 추적 쿠키 설정

```typescript
// 인증 진행 상태 표시
document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
```

#### 3. 미들웨어 재시도 로직

```typescript
const maxAttempts = isVercel
  ? isInAuthFlow
    ? 8
    : 3 // Vercel: Auth 플로우 시 8회
  : isInAuthFlow
    ? 5
    : 1; // 로컬: Auth 플로우 시 5회

const waitTime = isVercel
  ? isInAuthFlow
    ? 2000
    : 800 // Vercel: 2초 대기
  : isInAuthFlow
    ? 1000
    : 300; // 로컬: 1초 대기
```

## 일반적인 OAuth 문제들

### 1. GitHub OAuth 앱 설정 오류

**확인 사항:**

- Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
- Client ID와 Secret이 환경변수에 정확히 설정됨

### 2. Supabase 설정 오류

**확인 사항:**

- Authentication → Providers → GitHub 활성화
- Site URL: 프로덕션 도메인 설정
- Redirect URLs: 성공 페이지 URL 추가

### 3. 환경변수 누락

**필수 환경변수:**

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. CORS 문제

**해결 방법:**

```typescript
// Supabase 클라이언트 설정 시
const supabase = createClient(url, key, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

## 🔧 디버깅 도구

### 1. 브라우저 개발자 도구

- Network 탭에서 OAuth 요청 확인
- Application 탭에서 쿠키 상태 확인
- Console에서 인증 플로우 로그 확인

### 2. Vercel 로그

```bash
vercel logs --follow
```

### 3. Supabase 대시보드

- Authentication → Users에서 사용자 생성 확인
- Authentication → Logs에서 OAuth 요청 확인

## 📚 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [GitHub OAuth 앱 설정](https://docs.github.com/en/apps/oauth-apps)
- [Vercel 환경변수 설정](https://vercel.com/docs/projects/environment-variables)

---

**마지막 업데이트**: 2025-01-24  
**검증 환경**: OpenManager Vibe v5 - Vercel Production
