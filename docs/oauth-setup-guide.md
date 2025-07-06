# 🔐 OAuth 설정 가이드

## 📋 개요

OpenManager Vibe v5에서 OAuth 인증을 설정하는 방법을 안내합니다.

## 🔑 필수 환경변수

### OAuth 설정

```bash
# OAuth 설정 (실제 값으로 교체)
OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_secret_here
OAUTH_PROJECT_ID=your-project

# OAuth 엔드포인트
OAUTH_AUTH_URI=https://accounts.google.com/o/oauth2/auth
OAUTH_TOKEN_URI=https://oauth2.googleapis.com/token

# 허용된 URI
OAUTH_REDIRECT_URIS=["https://localhost:3000/auth/callback"]
OAUTH_ORIGINS=["https://localhost:3000"]

# NextAuth 설정
NEXTAUTH_URL=https://localhost:3000
NEXTAUTH_SECRET=random-32-char-secret-key
```

## 🛠️ 설정 방법

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. OAuth 동의 화면 설정
4. 자격 증명 생성

### 2. 환경변수 설정

생성된 정보를 `.env.local`에 설정:

```bash
# 실제 값으로 교체
OAUTH_CLIENT_ID=실제_클라이언트_ID
OAUTH_CLIENT_SECRET=실제_시크릿
```

## 🔒 보안 주의사항

1. **실제 OAuth 정보는 GitHub에 커밋하지 마세요**
2. **환경변수 파일은 .gitignore에 포함되어야 합니다**
3. **정기적으로 OAuth 키를 로테이션하세요**

## 📚 관련 문서

- [OAuth 2.0 문서](https://oauth.net/2/)
- [NextAuth.js 가이드](https://next-auth.js.org/)
- [환경변수 관리](https://nextjs.org/docs/basic-features/environment-variables)
