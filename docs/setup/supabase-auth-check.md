# Supabase GitHub OAuth 설정 체크리스트

## 1. Supabase 대시보드 확인 사항

1. **Authentication → Providers → GitHub**에서:
   - GitHub OAuth가 활성화되어 있는지 확인
   - Client ID: `Ov23liFnUsRO0ttNegju`
   - Client Secret: `e696b1911a31d283d829aca73eb3fea8abbe7291`

2. **Authentication → URL Configuration**에서:
   - Site URL: `https://openmanager-vibe-v5.vercel.app`
   - Redirect URLs에 다음이 포함되어 있는지 확인:
     - `https://openmanager-vibe-v5.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (개발용)

## 2. GitHub OAuth 앱 설정 확인

GitHub OAuth 앱에서 Authorization callback URL이 다음과 같이 설정되어 있어야 합니다:
- `https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback`

## 3. 현재 문제 분석

로그를 보면:
- 인증 자체는 성공하고 있음 (`✅ 사용자 인증 완료: skyasu@naver.com`)
- 세션도 정상적으로 생성됨
- 하지만 GitHub 로그인 버튼 클릭 시 다시 로그인 페이지로 리다이렉트됨

이는 GitHub OAuth 앱의 callback URL이 Supabase가 아닌 애플리케이션으로 설정되어 있을 가능성이 높습니다.