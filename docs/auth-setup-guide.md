# OpenManager VIBE v5 인증 시스템 통합 가이드

## 📋 목차

1. [인증 시스템 개요](#-인증-시스템-개요)
2. [필수 환경 변수 설정](#-필수-환경-변수-설정)
3. [Supabase 프로젝트 설정](#-supabase-프로젝트-설정)
4. [GitHub OAuth 설정](#-github-oauth-설정)
5. [클라이언트 측 구현](#-클라이언트-측-구현)
6. [서버 측 구현](#-서버-측-구현)
7. [보호된 라우트 설정](#-보호된-라우트-설정)
8. [세션 관리](#-세션-관리)
9. [문제 해결 가이드](#-문제-해결-가이드)
10. [부록: 레거시 시스템](#-부록-레거시-시스템)

---

## 🔐 인증 시스템 개요

OpenManager VIBE v5는 **Supabase Auth**를 기반으로 한 통합 인증 시스템을 사용합니다. 주요 특징:

### 현재 사용 중인 인증 방식

1. **GitHub OAuth (권장)** - Supabase를 통한 GitHub 소셜 로그인
   - 모든 기능 접근 가능
   - 시스템 시작/정지 권한
   - AI 기능 사용
   - 서버 관리

2. **게스트 모드** - 로컬 세션 기반 임시 접근
   - 읽기 전용 접근
   - 메인 페이지 열람
   - 시스템 시작 불가
   - 제한된 기능만 사용 가능

### 아키텍처 구성

```
사용자 → 로그인 페이지 → Supabase Auth → GitHub OAuth
                    ↓
                게스트 모드 → LocalStorage 세션
```

---

## 🔧 필수 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# 앱 URL (필수)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 개발
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # 프로덕션
```

### 환경 변수 확인 방법

1. Supabase Dashboard 접속
2. 프로젝트 선택
3. Settings → API
4. Project URL과 `anon` public key 복사

---

## 🗄️ Supabase 프로젝트 설정

### 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `openmanager-vibe-v5`
   - Database Password: 강력한 비밀번호 설정
   - Region: 가장 가까운 지역 선택

### 2. Authentication 설정

1. 좌측 메뉴에서 **Authentication** 클릭
2. **Providers** 탭으로 이동
3. **Email** 비활성화 (사용하지 않음)
4. **GitHub** 찾아서 활성화 준비

---

## 🐙 GitHub OAuth 설정

### 1. GitHub OAuth App 생성

1. GitHub 로그인
2. Settings → Developer settings → OAuth Apps
3. **New OAuth App** 클릭
4. 다음 정보 입력:

```
Application name: OpenManager Vibe V5
Homepage URL: https://your-app-domain.com
Authorization callback URL: https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

**중요**: Callback URL은 Supabase Dashboard의 GitHub Provider 설정에서 확인 가능

5. **Register application** 클릭
6. Client ID 복사
7. **Generate a new client secret** 클릭
8. Client Secret 복사 (한 번만 표시됨!)

### 2. Supabase에 GitHub 정보 입력

1. Supabase Dashboard로 돌아가기
2. Authentication → Providers → GitHub
3. **Client ID**와 **Client Secret** 입력
4. **Save** 클릭

### 3. Redirect URLs 설정

Authentication → URL Configuration에서:

```
Site URL: https://your-app-domain.com
Redirect URLs:
- http://localhost:3000/auth/callback (개발)
- https://your-app-domain.com/auth/callback (프로덕션)
```

---

## 💻 클라이언트 측 구현

### 1. 로그인 페이지 (`/login`)

현재 구현된 로그인 페이지는 두 가지 인증 방식을 제공합니다:

```typescript
// GitHub OAuth 로그인
const handleGitHubLogin = async () => {
  const { error } = await signInWithGitHub();
  if (error) {
    console.error('GitHub 로그인 실패:', error);
  }
  // 성공 시 자동으로 OAuth 리다이렉트
};

// 게스트 로그인
const handleGuestLogin = async () => {
  const result = await authManager.authenticateGuest();
  if (result.success) {
    // 게스트 세션 생성 및 홈으로 이동
    router.push('/');
  }
};
```

### 2. 인증 상태 확인

```typescript
import { getCurrentUser, isGitHubAuthenticated } from '@/lib/supabase-auth';

// 컴포넌트에서 사용
const user = await getCurrentUser();
const isGitHub = await isGitHubAuthenticated();

if (isGitHub) {
  // GitHub 인증 사용자 - 모든 기능 사용 가능
} else if (user) {
  // 게스트 사용자 - 제한된 기능
} else {
  // 비인증 사용자
}
```

### 3. 인증 콜백 페이지 (`/auth/callback`)

OAuth 리다이렉트 후 처리:

```typescript
export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const { session, error } = await handleAuthCallback();
      if (session) {
        router.push('/'); // 홈으로 리다이렉트
      } else {
        router.push('/login'); // 실패 시 로그인으로
      }
    };
    handleCallback();
  }, []);
}
```

---

## 🛡️ 서버 측 구현

### 1. Middleware 설정 (`src/middleware.ts`)

현재 미들웨어는 보호된 경로에 대한 인증을 확인합니다:

```typescript
// 보호된 경로들
const PROTECTED_PATHS = [
  '/dashboard',
  '/admin',
  '/system-boot',
  '/api/dashboard',
  '/api/admin',
  '/api/ai',
  '/api/servers',
];

// Supabase 세션 확인
const supabase = createMiddlewareClient({ req: request, res: response });
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  // 로그인 페이지로 리다이렉트
  return NextResponse.redirect('/login');
}
```

### 2. API Route 보호

```typescript
// API 라우트에서 인증 확인
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 인증된 사용자만 접근 가능한 로직
}
```

---

## 🔒 보호된 라우트 설정

### 현재 보호된 경로

1. **관리자 페이지**
   - `/dashboard` - 대시보드
   - `/admin` - 관리자 설정
   - `/system-boot` - 시스템 부팅

2. **API 엔드포인트**
   - `/api/dashboard/*` - 대시보드 데이터
   - `/api/admin/*` - 관리자 기능
   - `/api/ai/*` - AI 기능
   - `/api/servers/*` - 서버 관리

### 접근 권한 체계

```typescript
// GitHub 인증 사용자
- 모든 페이지 접근 가능
- 시스템 시작/정지 권한
- AI 기능 사용
- 서버 관리

// 게스트 사용자
- 홈페이지 접근 가능
- 읽기 전용 기능
- 시스템 시작 불가
- AI 기능 제한
```

---

## 📊 세션 관리

### 1. Supabase 세션 (GitHub OAuth)

```typescript
// 세션 상태 변경 감지
const authListener = onAuthStateChange((session) => {
  if (session) {
    console.log('사용자 로그인:', session.user.email);
  } else {
    console.log('사용자 로그아웃');
  }
});

// 세션 새로고침
const { session } = await refreshSession();
```

### 2. 게스트 세션 (LocalStorage)

```typescript
// 게스트 세션은 브라우저 LocalStorage에 저장
localStorage.setItem('auth_session_id', sessionId);
localStorage.setItem('auth_type', 'guest');
localStorage.setItem('auth_user', JSON.stringify(user));
```

### 3. 로그아웃 처리

```typescript
const handleLogout = async () => {
  await signOut(); // Supabase 로그아웃
  
  // 게스트 세션 정리
  localStorage.removeItem('auth_session_id');
  localStorage.removeItem('auth_type');
  localStorage.removeItem('auth_user');
  
  router.push('/login');
};
```

---

## 🔍 문제 해결 가이드

### 1. GitHub 로그인이 작동하지 않는 경우

**확인 사항:**
- [ ] Supabase Dashboard에서 GitHub Provider 활성화 확인
- [ ] GitHub OAuth App의 Callback URL이 정확한지 확인
- [ ] Client ID와 Client Secret이 올바르게 입력되었는지 확인
- [ ] 환경변수 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 확인

**디버깅:**
```javascript
// 브라우저 콘솔에서 확인
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 2. 세션이 유지되지 않는 경우

**확인 사항:**
- [ ] 브라우저 쿠키가 차단되어 있지 않은지 확인
- [ ] Supabase Dashboard의 Auth 설정에서 세션 만료 시간 확인
- [ ] 미들웨어가 올바르게 설정되어 있는지 확인

**해결 방법:**
```typescript
// 세션 상태 확인
const { data: { session } } = await supabase.auth.getSession();
console.log('현재 세션:', session);

// 강제 세션 새로고침
await supabase.auth.refreshSession();
```

### 3. 리다이렉트 문제

**증상:** 로그인 후 홈페이지로 이동하지 않음

**해결:**
1. `/auth/callback` 페이지가 존재하는지 확인
2. Supabase Dashboard에서 Redirect URLs 설정 확인
3. 로그인 성공 후 리다이렉트 로직 확인

### 4. 환경별 설정

**개발 환경:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Redirect URL: http://localhost:3000/auth/callback
```

**프로덕션 환경 (Vercel):**
```bash
NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app
# Redirect URL: https://openmanager-vibe-v5.vercel.app/auth/callback
```

---

## 📚 부록: 레거시 시스템

### NextAuth 시스템 (현재 사용하지 않음)

프로젝트에는 NextAuth 관련 코드가 일부 남아있으나, 현재는 Supabase Auth로 완전히 전환되었습니다.

**레거시 파일들:**
- `/src/app/auth/signin/page.tsx` - NextAuth 로그인 페이지 (사용 안 함)
- `/src/lib/auth.ts` - 관리자 전용 인증 시스템 (독립적)

### 관리자 인증 시스템

`/src/lib/auth.ts`의 `AuthManager`는 관리자 페이지 전용 독립 인증 시스템으로, 다음 기능을 제공합니다:

- 다단계 인증 (2FA)
- IP 기반 차단
- 세션 관리
- 권한 레벨 관리

이는 Supabase Auth와는 별개로 운영되며, 고급 관리자 기능에만 사용됩니다.

---

## 🚀 빠른 시작 가이드

1. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 입력
   ```

2. **Supabase Dashboard에서 GitHub OAuth 활성화**

3. **GitHub OAuth App 생성 및 연동**

4. **개발 서버 시작**
   ```bash
   npm run dev
   ```

5. **http://localhost:3000/login 접속하여 테스트**

---

## 📞 지원 및 문의

- Supabase 문서: https://supabase.com/docs/guides/auth
- GitHub OAuth 문서: https://docs.github.com/en/apps/oauth-apps
- 프로젝트 이슈: GitHub Issues에 문의