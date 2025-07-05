# 🔐 Google OAuth 인증 시스템 설정 가이드

## 📋 개요

OpenManager Vibe v5에서 Google OAuth 2.0 인증 시스템을 사용하기 위한 설정 가이드입니다.

## 🚀 Google Cloud Console 설정

### 1. Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID 기록

### 2. OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 다음 정보 입력:

#### 승인된 자바스크립트 원본

```
http://localhost:3000
https://your-domain.vercel.app
```

#### 승인된 리디렉션 URI

```
http://localhost:3000/api/auth/google/callback
https://your-domain.vercel.app/api/auth/google/callback
```

5. **만들기** 클릭
6. 생성된 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

### 3. OAuth 동의 화면 설정

1. **OAuth 동의 화면** 메뉴로 이동
2. 사용자 유형: **외부** 선택 (개인 개발자인 경우)
3. 다음 정보 입력:
   - **앱 이름**: OpenManager Vibe v5
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. **범위** 설정:
   - `email`
   - `profile`
   - `openid`

## 🔧 환경변수 설정

### 로컬 개발환경 (.env.local)

```bash
# Google OAuth 설정
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# 기존 환경변수들...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vercel 배포환경

Vercel 대시보드에서 다음 환경변수 설정:

```bash
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
open http://localhost:3000
```

### 2. 인증 플로우 확인

1. 메인 페이지 접속 → 자동으로 로그인 페이지로 리다이렉트
2. "Google로 로그인" 버튼 클릭
3. Google 로그인 화면에서 계정 선택
4. 권한 승인 후 대시보드로 리다이렉트 확인
5. 우측 상단 프로필 드롭다운 확인

### 3. 게스트 모드 테스트

1. 로그인 페이지에서 "일반사용자로 계속" 클릭
2. 대시보드 접속 확인
3. 프로필 드롭다운에서 "게스트" 표시 확인

## 🔍 문제 해결

### 일반적인 오류들

#### 1. "redirect_uri_mismatch" 오류

```
해결방법: Google Cloud Console에서 리디렉션 URI 확인
- 정확한 URL 입력 (http/https, 포트번호 포함)
- 끝에 슬래시(/) 없이 입력
```

#### 2. "access_denied" 오류

```
해결방법: OAuth 동의 화면 설정 확인
- 앱이 게시되었는지 확인
- 테스트 사용자 추가 (개발 모드인 경우)
```

#### 3. 환경변수 인식 안됨

```
해결방법: 
- .env.local 파일이 프로젝트 루트에 있는지 확인
- 서버 재시작 (npm run dev)
- 환경변수명 오타 확인
```

### 디버깅 로그 확인

브라우저 개발자 도구 콘솔에서 다음 로그들을 확인:

```javascript
// 성공적인 로그인
✅ Google OAuth 로그인 성공: User Name (user@example.com)

// 세션 생성
🔐 새 세션 생성: session_1234567890_abcdef

// 시스템 시작
🚀 시스템 자동 시작: 사용자 인증 완료
```

## 📊 보안 고려사항

### 1. 클라이언트 보안 비밀번호 보호

- `.env.local` 파일을 `.gitignore`에 추가
- 프로덕션에서는 환경변수로만 관리
- 정기적으로 키 로테이션

### 2. 세션 관리

- 세션 만료 시간: 1시간 (기본값)
- 자동 로그아웃: 10분 비활성 시
- 토큰 무효화: 로그아웃 시 Google 토큰 revoke

### 3. CSRF 보호

- OAuth state 파라미터 검증
- 세션 스토리지 기반 상태 관리

## 🔄 업그레이드 가이드

기존 시스템에서 새 인증 시스템으로 업그레이드:

### 1. 기존 사용자 데이터 마이그레이션

```bash
# 기존 세션 정리
localStorage.clear()

# 새 인증 시스템 사용
# 기존 "시스템 시작" → "Google로 로그인"
```

### 2. 호환성 확인

- 기존 95% 테스트 통과율 유지
- 모든 기능 정상 작동 확인
- 환경변수 암복호화 시스템 연동

## 📞 지원

문제가 발생하면 다음을 확인해주세요:

1. **환경변수 설정**: Google Client ID/Secret 올바른지 확인
2. **리디렉션 URI**: Google Cloud Console 설정과 일치하는지 확인  
3. **네트워크**: 방화벽이나 프록시 설정 확인
4. **브라우저**: 쿠키 및 로컬 스토리지 활성화 확인

추가 도움이 필요하면 프로젝트 이슈 트래커에 문의해주세요.
