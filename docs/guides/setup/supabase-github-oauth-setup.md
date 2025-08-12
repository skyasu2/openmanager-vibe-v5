# 🔐 Supabase GitHub OAuth 설정 가이드

## 1단계: 개발 서버 재시작

환경변수가 이미 설정되어 있으므로, 개발 서버를 재시작하세요:

```bash
# 개발 서버 시작
npm run dev
```

## 2단계: Supabase 대시보드에서 GitHub OAuth 활성화

### 1. Supabase 대시보드 접속
- https://supabase.com/dashboard/project/vnswjnltnhpsueosfhmw 접속
- Authentication → Providers 메뉴 선택

### 2. GitHub Provider 설정
- GitHub 토글 활성화
- GitHub OAuth App 생성이 필요합니다

## 3단계: GitHub OAuth App 생성

### 1. GitHub에서 OAuth App 생성
1. https://github.com/settings/developers 접속
2. "OAuth Apps" 탭 선택
3. "New OAuth App" 클릭

### 2. OAuth App 설정값
```
Application name: OpenManager Vibe v5 Local
Homepage URL: http://localhost:3000
Authorization callback URL: https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback
```

⚠️ **중요**: callback URL은 반드시 위와 같이 설정하세요!

### 3. Client ID와 Secret 복사
- 생성 후 나타나는 Client ID 복사
- "Generate a new client secret" 클릭 후 Secret 복사

## 4단계: Supabase에 GitHub OAuth 정보 입력

### 1. Supabase 대시보드로 돌아가기
- Authentication → Providers → GitHub

### 2. GitHub OAuth 정보 입력
- **Client ID**: GitHub에서 복사한 Client ID
- **Client Secret**: GitHub에서 복사한 Client Secret

### 3. 저장
- "Save" 버튼 클릭

## 5단계: 프로덕션 환경 설정 (Vercel)

프로덕션용 별도 OAuth App 생성:

```
Application name: OpenManager Vibe v5 Production
Homepage URL: https://openmanager-vibe-v5.vercel.app
Authorization callback URL: https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback
```

## 테스트 방법

1. http://localhost:3000 접속
2. GitHub 로그인 버튼 클릭
3. GitHub 인증 페이지로 리다이렉트
4. 승인 후 앱으로 돌아오기

## 자주 발생하는 문제

### 1. "redirect_uri_mismatch" 에러
- GitHub OAuth App의 callback URL이 정확한지 확인
- 반드시: `https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback`

### 2. "더미 수파베이스" 에러
- 개발 서버 재시작 필요
- `.env.local` 파일 확인

### 3. 로그인 후 세션이 유지되지 않음
- 브라우저 쿠키 설정 확인
- localStorage 초기화: `localStorage.clear()`

## 디버깅 팁

브라우저 콘솔에서:

```javascript
// Supabase 클라이언트 확인
console.log(window.supabase)

// 현재 세션 확인
const { data: { session } } = await window.supabase.auth.getSession()
console.log(session)
```

## 완료 체크리스트

- [ ] 개발 서버 재시작함
- [ ] Supabase에서 GitHub Provider 활성화
- [ ] GitHub OAuth App 생성 (로컬용)
- [ ] Callback URL 정확히 설정
- [ ] Client ID/Secret을 Supabase에 입력
- [ ] 저장 버튼 클릭
- [ ] 테스트 성공