# 🔍 Vercel GitHub OAuth 디버깅 가이드

## 🚨 현재 발생 중인 문제

1. GitHub 로그인 시도 → 인증 과정 → 다시 로그인 화면으로 리다이렉트
2. 콘솔에 "👤 사용자 정보 로드: Object" 무한 반복

## 🔧 즉시 확인해야 할 사항

### 1. Vercel 환경변수 확인

Vercel Dashboard > Settings > Environment Variables에서 다음 확인:

```bash
# 필수 환경변수
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# ⚠️ 주의: NEXT_PUBLIC_ 접두사 필수!
```

### 2. Supabase Dashboard 설정

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Site URL** (가장 중요!):

   ```
   https://openmanager-vibe-v5.vercel.app
   ```

   - ⚠️ 끝에 슬래시(/) 없음
   - ⚠️ http가 아닌 https

3. **Redirect URLs** (모두 추가):
   ```
   https://openmanager-vibe-v5.vercel.app/auth/callback
   https://openmanager-vibe-v5-*.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 3. GitHub OAuth App 설정

1. GitHub → Settings → Developer settings → OAuth Apps
2. 해당 OAuth App 선택
3. **Authorization callback URL** (정확히 입력):
   ```
   https://[your-project].supabase.co/auth/v1/callback
   ```

   - ⚠️ Vercel URL이 아닌 Supabase URL!
   - ⚠️ /auth/v1/callback 경로 정확히 입력

### 4. Supabase GitHub Provider 설정

1. Supabase Dashboard → Authentication → Providers
2. GitHub 활성화 확인
3. Client ID와 Client Secret 정확히 입력되었는지 확인

## 🐛 디버깅 단계별 체크리스트

### Step 1: 브라우저 준비

- [ ] 모든 쿠키와 로컬 스토리지 삭제
- [ ] 시크릿 브라우징 모드로 열기
- [ ] 개발자 도구 > Network 탭 열기

### Step 2: 로그인 시도

- [ ] GitHub 로그인 버튼 클릭
- [ ] Network 탭에서 다음 요청 확인:
  - `https://[your-project].supabase.co/auth/v1/authorize?provider=github`
  - GitHub으로 리다이렉트
  - GitHub 인증 후 Supabase callback
  - 최종적으로 `/auth/callback` 페이지

### Step 3: 콘솔 로그 확인

- [ ] 다음 로그 메시지 확인:
  ```
  🔐 OAuth 콜백 처리: {code: "exists", redirect: "/main"}
  ✅ OAuth 인증 성공: {userId: "...", email: "..."}
  🔄 리다이렉트 시도: /main
  ```

### Step 4: 실패 시 에러 확인

- [ ] Network 탭에서 실패한 요청의 Response 확인
- [ ] Console 탭에서 에러 메시지 확인
- [ ] Vercel Functions 로그 확인

## 🔥 긴급 수정 사항

### 옵션 1: 세션 확인 로직 개선

`src/middleware.ts`에 다음 추가:

```typescript
// OAuth 콜백 처리 개선
if (pathname === '/auth/callback') {
  console.log('✅ OAuth 콜백 페이지 - 미들웨어 통과');
  return response;
}

// 세션 생성 대기 시간 추가
if (referer?.includes('/auth/callback')) {
  console.log('⏳ OAuth 콜백 직후 - 3초 대기');
  await new Promise(resolve => setTimeout(resolve, 3000));
}
```

### 옵션 2: 클라이언트 리다이렉트 지연

`src/app/auth/callback/page.tsx`에서:

```typescript
// 세션 저장 대기 시간 증가
await new Promise(resolve => setTimeout(resolve, 2000)); // 1초 → 2초

// 리다이렉트 전 추가 확인
const finalCheck = await supabase.auth.getSession();
if (!finalCheck.data.session) {
  console.error('❌ 최종 세션 확인 실패');
  // 재시도 로직
}
```

## 📊 로그 분석 포인트

1. **무한 루프 원인**:
   - middleware.ts에서 세션이 없다고 판단 → /login으로 리다이렉트
   - 하지만 OAuth는 성공했으므로 계속 시도
   - 세션이 제대로 저장되지 않는 문제

2. **가능한 원인들**:
   - 쿠키 도메인 불일치
   - Supabase 세션 토큰 만료 시간 설정
   - Vercel Edge Runtime과 쿠키 처리 충돌

## 🚀 즉시 시도할 수 있는 해결책

### 1. 환경변수 재배포

```bash
# Vercel CLI 사용
vercel env pull
# 환경변수 확인 후
vercel --prod
```

### 2. Supabase 세션 설정 확인

Supabase Dashboard → Settings → Auth → Session Lifetime 확인

### 3. 강제 세션 새로고침

`src/app/auth/callback/page.tsx`에 추가:

```typescript
// 세션 강제 새로고침
await supabase.auth.refreshSession();
```

## 🆘 그래도 안 되면?

1. Vercel Support 티켓 생성
2. Supabase Support 문의
3. 임시 해결책: 게스트 모드만 사용

---

**최종 업데이트**: 2025-01-22
**문제 상태**: 해결 중
