# 🔐 Supabase OAuth 설정 가이드

## 📋 현재 설정 정보

### Supabase 프로젝트

- **URL**: https://vnswjnltnhpsueosf.supabase.co
- **프로젝트 ID**: vnswjnltnhpsueosf
- **환경**: Production

### 현재 도메인

- **로컬**: http://localhost:3000
- **Vercel**: https://openmanager-vibe-v5.vercel.app

## 🛠️ Supabase 대시보드 설정

### 1. Authentication → URL Configuration

#### Site URL 설정

```
Production: https://openmanager-vibe-v5.vercel.app
Development: http://localhost:3000
```

#### Redirect URLs 설정

다음 URL들을 모두 추가해야 합니다:

```
# Vercel 배포 환경
https://openmanager-vibe-v5.vercel.app/auth/callback
https://openmanager-vibe-v5.vercel.app/auth/success
https://openmanager-vibe-v5.vercel.app/

# 로컬 개발 환경
http://localhost:3000/auth/callback
http://localhost:3000/auth/success
http://localhost:3000/

# Supabase 기본 콜백 (필수)
https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
```

### 2. Authentication → Providers → GitHub

#### GitHub OAuth 설정

```
Enabled: ✅ 체크
Client ID: Ov23liFnUsRO0ttNegju
Client Secret: YOUR_GITHUB_CLIENT_SECRET
```

#### 추가 설정

```
Redirect URL: https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
Scopes: user:email (기본값)
```

## 🔧 GitHub OAuth App 설정

### GitHub Developer Settings

1. https://github.com/settings/developers 접속
2. OAuth Apps → "OpenManager Vibe v5" 선택

### 설정 값

```
Application name: OpenManager Vibe v5
Homepage URL: https://openmanager-vibe-v5.vercel.app
Application description: AI 서버 모니터링 시스템

Authorization callback URL:
https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
```

### Client Credentials

```
Client ID: Ov23liFnUsRO0ttNegju
Client Secret: YOUR_GITHUB_CLIENT_SECRET
```

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
npm run dev
# http://localhost:3000/login에서 GitHub 로그인 테스트
```

### 2. Vercel 배포 테스트

```bash
# 환경변수 설정
npm run vercel:env

# 배포
npm run deploy

# 테스트
# https://openmanager-vibe-v5.vercel.app/login
```

### 3. OAuth 플로우 확인

1. `/login` → GitHub 로그인 클릭
2. GitHub 인증 페이지 → 승인
3. Supabase 콜백 처리
4. `/auth/success` → 세션 확인
5. `/main` → 최종 리다이렉트

## 🔍 디버깅 방법

### 브라우저 개발자 도구

```javascript
// 콘솔에서 실행
console.log('현재 URL:', window.location.href);
console.log('쿠키:', document.cookie);
console.log('세션 스토리지:', sessionStorage.getItem('auth_redirect_to'));
```

### 네트워크 탭 확인

1. GitHub OAuth 요청
2. Supabase 콜백 응답
3. 세션 생성 확인
4. 리다이렉트 요청

### 일반적인 오류들

#### 1. "Invalid redirect URI"

```
원인: GitHub OAuth App의 콜백 URL이 잘못됨
해결: https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback 설정
```

#### 2. "Site URL not allowed"

```
원인: Supabase Site URL 설정 누락
해결: https://openmanager-vibe-v5.vercel.app 추가
```

#### 3. "Session not found"

```
원인: 세션 생성 실패 또는 쿠키 문제
해결: 브라우저 캐시 클리어 후 재시도
```

## 📊 현재 상태 체크리스트

### Supabase 설정

- [ ] Site URL: https://openmanager-vibe-v5.vercel.app
- [ ] Redirect URLs 모두 추가됨
- [ ] GitHub Provider 활성화됨
- [ ] Client ID/Secret 정확함

### GitHub OAuth 설정

- [ ] Callback URL: https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
- [ ] Homepage URL: https://openmanager-vibe-v5.vercel.app
- [ ] 앱 활성화 상태

### Vercel 환경변수

- [ ] NEXTAUTH_URL 설정됨
- [ ] SUPABASE_URL 설정됨
- [ ] GITHUB*CLIENT*\* 설정됨
- [ ] 모든 환경(prod/preview/dev)에 적용됨

### 코드 설정

- [ ] 환경 감지 로직 정확함
- [ ] 리다이렉트 로직 작동함
- [ ] 에러 핸들링 적절함

## 🚀 배포 후 확인

1. **환경변수 확인**: https://openmanager-vibe-v5.vercel.app/api/health
2. **OAuth 테스트**: https://openmanager-vibe-v5.vercel.app/login
3. **세션 지속성**: 로그인 후 페이지 새로고침
4. **로그아웃 테스트**: 세션 정리 확인

---

**작성일**: 2025-07-24  
**Supabase 프로젝트**: vnswjnltnhpsueosf  
**GitHub OAuth App**: OpenManager Vibe v5  
**상태**: 설정 진행 중
