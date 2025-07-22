# 🔐 Vercel GitHub OAuth 설정 가이드

## 📌 문제 상황

- GitHub 로그인 시도 시 인증 후 다시 로그인 페이지로 리다이렉트
- 콘솔에 "👤 사용자 정보 로드" 메시지가 무한 반복

## 🎯 해결된 문제들

1. **무한 루프 버그**: `useProfileAuth.ts`의 useEffect 의존성 배열에서 `session` 제거
2. **미들웨어 개선**: OAuth 콜백 직후 세션 설정 대기 시간 추가

## ⚙️ Vercel 환경변수 설정 확인

### 1. Supabase 설정 (필수)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Dashboard 설정

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. Authentication > URL Configuration 이동
3. **Site URL** 설정:
   - Production: `https://openmanager-vibe-v5.vercel.app`
   - Preview: `https://openmanager-vibe-v5-*.vercel.app`

4. **Redirect URLs** 추가:
   ```
   https://openmanager-vibe-v5.vercel.app/auth/callback
   https://openmanager-vibe-v5-*.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 3. GitHub OAuth App 설정

1. GitHub > Settings > Developer settings > OAuth Apps
2. **Authorization callback URL**:

   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

   ⚠️ 주의: Vercel URL이 아닌 Supabase URL 사용

3. **Homepage URL**: `https://openmanager-vibe-v5.vercel.app`

### 4. Supabase에서 GitHub Provider 활성화

1. Supabase Dashboard > Authentication > Providers
2. GitHub 활성화
3. GitHub OAuth App의 Client ID와 Client Secret 입력

## 🧪 테스트 체크리스트

- [ ] Vercel 환경변수 설정 확인
- [ ] Supabase URL Configuration 확인
- [ ] GitHub OAuth App callback URL 확인
- [ ] 브라우저 개발자 도구에서 네트워크 탭 확인
- [ ] 콘솔 로그에서 OAuth 리다이렉트 URL 확인

## 🔍 디버깅 팁

1. 브라우저 쿠키 및 로컬 스토리지 모두 삭제 후 재시도
2. 시크릿 브라우징 모드에서 테스트
3. Vercel 함수 로그 확인: Vercel Dashboard > Functions 탭

## 📝 추가 수정사항

- `useProfileAuth.ts`: useEffect 의존성 배열에서 `session` 제거
- `middleware.ts`: OAuth code 파라미터 체크 추가
