# 🔧 GitHub OAuth 로그인 오류 해결 가이드

## 🚨 문제 상황
"사이트에 연결할 수 없음. localhost에서 연결을 거부했습니다"

## 🎯 원인
GitHub OAuth 앱의 콜백 URL이 localhost로 설정되어 있어, 배포 환경에서 인증 후 localhost로 리다이렉트되는 문제

## ✅ 해결 방법

### 1. GitHub OAuth 앱 설정 수정

1. [GitHub 설정](https://github.com/settings/developers) 접속
2. OAuth Apps 클릭
3. 해당 앱 선택 (OpenManager 관련)
4. 다음 설정 확인 및 수정:

```
Homepage URL: https://your-app-domain.vercel.app
Authorization callback URL: https://your-app-domain.vercel.app/auth/callback
```

### 2. 로컬 개발 + 배포 환경 동시 지원

#### 방법 A: 두 개의 OAuth 앱 사용 (권장)

**개발용 OAuth 앱**
```
App Name: OpenManager Dev
Homepage URL: http://localhost:3000
Callback URL: http://localhost:3000/auth/callback
```

**프로덕션용 OAuth 앱**
```
App Name: OpenManager
Homepage URL: https://your-app-domain.vercel.app
Callback URL: https://your-app-domain.vercel.app/auth/callback
```

#### 방법 B: 멀티 콜백 URL 사용
```
Authorization callback URLs:
- http://localhost:3000/auth/callback
- https://your-app-domain.vercel.app/auth/callback
```

### 3. 환경 변수 설정

**.env.local (로컬 개발)**
```env
GITHUB_CLIENT_ID=dev_app_client_id
GITHUB_CLIENT_SECRET=dev_app_client_secret
NEXTAUTH_URL=http://localhost:3000
```

**Vercel 환경 변수 (프로덕션)**
```env
GITHUB_CLIENT_ID=prod_app_client_id
GITHUB_CLIENT_SECRET=prod_app_client_secret
NEXTAUTH_URL=https://your-app-domain.vercel.app
```

### 4. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. Authentication → Providers → GitHub
3. 다음 설정 입력:
   - Client ID: GitHub OAuth 앱의 Client ID
   - Client Secret: GitHub OAuth 앱의 Client Secret
   - Redirect URL 확인 (자동 생성됨)

### 5. 임시 해결책 (즉시 사용 가능)

로그인 페이지에 이미 구현된 **게스트 로그인** 사용:
- GitHub 인증 없이 기본 기능 사용 가능
- 개인화 설정은 제한됨

## 🔍 디버깅 체크리스트

- [ ] GitHub OAuth 앱의 콜백 URL 확인
- [ ] 환경 변수 NEXTAUTH_URL 값 확인
- [ ] Supabase 프로젝트의 GitHub Provider 설정 확인
- [ ] 브라우저 개발자 도구에서 리다이렉트 URL 확인

## 💡 추가 팁

1. **로컬 테스트 시**
   ```bash
   npm run dev
   # http://localhost:3000 에서 테스트
   ```

2. **Vercel 미리보기 배포**
   - Vercel은 각 PR마다 고유 URL 생성
   - 게스트 로그인으로 테스트 권장

3. **환경별 디버깅**
   ```typescript
   console.log('Current Origin:', window.location.origin);
   console.log('Callback URL:', `${window.location.origin}/auth/callback`);
   ```