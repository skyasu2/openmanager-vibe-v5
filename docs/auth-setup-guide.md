# OpenManager VIBE v5 인증 시스템 통합 가이드 (2025년 1월 업데이트)

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

### ⚠️ 중요 변경사항 (2025년 1월)

- `@supabase/auth-helpers-nextjs` 패키지 제거
- 자체 싱글톤 패턴 구현으로 Multiple Client 오류 해결
- Vercel 배포 시 와일드카드 Redirect URL 설정 필수

---

## 🔧 필수 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```bash
# ========================================
# 🗄️ Supabase 데이터베이스 설정 (필수)
# ========================================
# Supabase 프로젝트 URL (예: https://vnswjnltnhpsueosf.supabase.co)
SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Key (공개 가능한 키)
# Dashboard → Settings → API → Project API keys → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Service Role Key (서버 사이드 전용, 절대 노출 금지!)
# Dashboard → Settings → API → Project API keys → service_role secret
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# ========================================
# 🌐 앱 URL 설정 (필수)
# ========================================
# 개발 환경
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 프로덕션 환경 (Vercel 배포 시)
# NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app
# NEXT_PUBLIC_SITE_URL=https://openmanager-vibe-v5.vercel.app

# ========================================
# 🐙 GitHub OAuth 설정 (선택사항)
# ========================================
# GitHub OAuth App에서 발급받은 ID와 Secret
# https://github.com/settings/developers
GITHUB_CLIENT_ID=Ov23liFnUsRO0ttNegju  # 예시
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 환경 변수 확인 방법

1. **Supabase Dashboard 접속**

   ```
   https://app.supabase.com/project/[your-project-ref]
   ```

2. **프로젝트 선택** → **Settings** → **API**

3. **필요한 값 복사**:
   - Project URL: `https://vnswjnltnhpsueosf.supabase.co` 형태
   - anon (public) key: `eyJ...` 형태의 긴 문자열
   - service_role (secret) key: 서버 사이드 전용

---

## 🗄️ Supabase 프로젝트 설정

### 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   ```
   Name: openmanager-vibe-v5
   Database Password: 강력한 비밀번호 설정
   Region: Asia Northeast (Seoul) 추천
   ```

### 2. Authentication 설정

1. 좌측 메뉴에서 **Authentication** 클릭
2. **Providers** 탭으로 이동
3. **Email** 비활성화 (사용하지 않음)
4. **GitHub** 활성화 준비

### 3. Redirect URLs 설정 (중요!)

Authentication → URL Configuration에서:

```bash
# Site URL (기본 리다이렉트 URL)
https://openmanager-vibe-v5.vercel.app

# Additional Redirect URLs (모두 추가 필수!)
http://localhost:3000/**                        # 로컬 개발
https://*.vercel.app/**                        # Vercel 프리뷰 (전체)
https://*-skyasus-projects.vercel.app/**       # Vercel 프로젝트별 프리뷰
https://openmanager-vibe-v5.vercel.app/**      # 프로덕션
```

**⚠️ 중요**: 와일드카드(`*`, `**`)를 사용하여 Vercel의 동적 프리뷰 URL을 모두 포함시켜야 합니다.

---

## 🐙 GitHub OAuth 설정

### 1. GitHub OAuth App 생성

1. GitHub 로그인
2. Settings → Developer settings → OAuth Apps
3. **New OAuth App** 클릭
4. 다음 정보 입력:

```bash
# Application name
OpenManager Vibe V5

# Homepage URL
https://openmanager-vibe-v5.vercel.app

# Authorization callback URL (중요!)
# Supabase Dashboard에서 복사한 정확한 URL 사용
https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
```

**⚠️ 중요**:

- Callback URL은 반드시 Supabase의 URL이어야 함 (앱 URL 아님!)
- 형식: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → GitHub에서 확인 가능

5. **Register application** 클릭
6. **Client ID** 복사 (예: `Ov23liFnUsRO0ttNegju`)
7. **Generate a new client secret** 클릭
8. **Client Secret** 복사 (한 번만 표시됨!)

### 2. Supabase에 GitHub 정보 입력

1. Supabase Dashboard로 돌아가기
2. Authentication → Providers → GitHub
3. 다음 정보 입력:
   ```
   Client ID: [GitHub에서 복사한 Client ID]
   Client Secret: [GitHub에서 복사한 Client Secret]
   ```
4. **Save** 클릭

---

## 💻 클라이언트 측 구현

### 1. Supabase 싱글톤 클라이언트 (`/src/lib/supabase.ts`)

```typescript
// 싱글톤 패턴으로 Multiple Client 오류 방지
import { getSupabaseClient } from './supabase-singleton';

// 기본 export (레거시 호환성)
export const supabase = getSupabaseClient();

// Named exports
export { getSupabaseClient };
```

### 2. 로그인 페이지 (`/src/app/login/LoginClient.tsx`)

```typescript
// GitHub OAuth 로그인 함수
export async function signInWithGitHub() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
      scopes: 'read:user user:email',
    },
  });

  return { data, error };
}
```

### 3. OAuth 콜백 페이지 (`/src/app/auth/callback/page.tsx`)

```typescript
'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // URL에서 코드 추출
      const code = searchParams?.get('code');

      if (!code) {
        router.push('/login?error=no_code');
        return;
      }

      // Supabase가 자동으로 세션을 설정
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push('/main');
      } else {
        router.push('/login?error=no_session');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return <div>인증 처리 중...</div>;
}

// Suspense boundary로 useSearchParams 에러 해결
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
```

---

## 🛡️ 서버 측 구현

### 1. Middleware 설정 (`/src/middleware.ts`)

**⚠️ 중요 변경사항**: `@supabase/auth-helpers-nextjs` 대신 자체 싱글톤 구현 사용

```typescript
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware';

// 보호된 경로들
const PROTECTED_PATHS = [
  '/', // 홈페이지도 인증 필요
  '/main', // 메인 페이지
  '/dashboard',
  '/admin',
  '/system-boot',
  '/api/dashboard',
  '/api/admin',
  '/api/ai',
  '/api/servers',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 체크
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 보호된 경로 체크
  if (isProtectedPath(pathname)) {
    // 싱글톤 클라이언트 사용
    const supabase = createMiddlewareSupabaseClient(request, response);
    const { session } = await getMiddlewareSession(supabase, request);

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### 2. API Route 보호

```typescript
// 자체 싱글톤 사용
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 인증된 사용자만 접근 가능한 로직
}
```

---

## 📊 세션 관리

### 1. Supabase 세션 (GitHub OAuth)

```typescript
// 세션 상태 변경 감지
import { supabase } from '@/lib/supabase';

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('사용자 로그인:', session?.user.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('사용자 로그아웃');
  }
});
```

### 2. 로그아웃 처리

```typescript
const handleLogout = async () => {
  // Supabase 로그아웃
  await supabase.auth.signOut();

  // 게스트 세션 정리
  localStorage.removeItem('auth_session_id');
  localStorage.removeItem('auth_type');
  localStorage.removeItem('auth_user');

  router.push('/login');
};
```

---

## 🔍 문제 해결 가이드

### 1. "Multiple GoTrueClient instances detected" 오류

**원인**: 여러 Supabase 클라이언트 인스턴스 생성

**해결책**:

- 싱글톤 패턴 사용 확인
- `@supabase/auth-helpers-nextjs` 제거
- 전역 변수로 인스턴스 관리

### 2. GitHub 로그인 후 리다이렉트 실패

**확인 사항**:

```bash
# 1. Supabase Redirect URLs 확인
https://*.vercel.app/**
https://*-skyasus-projects.vercel.app/**

# 2. GitHub OAuth Callback URL 확인
https://[your-project-ref].supabase.co/auth/v1/callback

# 3. 환경변수 확인
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Vercel 배포 시 401 오류

**원인**: Vercel Protection(SSO) 활성화

**해결책**:

1. Vercel Dashboard → Settings → Security
2. Protection 비활성화
3. 또는 팀 멤버 추가

### 4. 세션 유지 문제

```typescript
// 디버깅 코드
const checkSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Error:', error);

  // 쿠키 확인
  console.log('Auth Cookie:', document.cookie.includes('sb-'));
};
```

---

## 🚀 빠른 시작 가이드

### 1. 환경 변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 환경변수 입력
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. Supabase 설정

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. Authentication → Providers → GitHub 활성화
3. URL Configuration에서 Redirect URLs 추가:
   ```
   http://localhost:3000/**
   https://*.vercel.app/**
   https://*-skyasus-projects.vercel.app/**
   ```

### 3. GitHub OAuth App 설정

1. [GitHub OAuth Apps](https://github.com/settings/developers) 생성
2. Callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
3. Client ID/Secret을 Supabase에 입력

### 4. 개발 서버 시작

```bash
npm run dev
# http://localhost:3000/login 접속
```

### 5. 프로덕션 배포 (Vercel)

```bash
# Vercel 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 배포
vercel --prod
```

---

## 📚 부록: 레거시 시스템

### NextAuth 시스템 (현재 사용하지 않음)

프로젝트에는 NextAuth 관련 코드가 일부 남아있으나, 현재는 Supabase Auth로 완전히 전환되었습니다.

### 관리자 인증 시스템

`/src/lib/auth.ts`의 `AuthManager`는 관리자 페이지 전용 독립 인증 시스템으로, Supabase Auth와는 별개로 운영됩니다.

---

## 📞 지원 및 문의

- Supabase 문서: https://supabase.com/docs/guides/auth
- GitHub OAuth 문서: https://docs.github.com/en/apps/oauth-apps
- 프로젝트 이슈: GitHub Issues에 문의

---

## 🔄 변경 이력

- **2025년 1월**: 싱글톤 패턴 구현, Vercel 와일드카드 URL 추가
- **2024년 12월**: Supabase Auth 초기 구현
