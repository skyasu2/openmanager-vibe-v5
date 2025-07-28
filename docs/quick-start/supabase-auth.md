# Supabase Auth 설정 가이드

> GitHub OAuth + RLS 보안 | 실무 코드 중심

## 🚀 빠른 시작

### 1. Supabase 프로젝트 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 서버 전용
```

### 2. GitHub OAuth 설정

**Supabase Dashboard → Authentication → Providers**

```
Client ID: GitHub에서 발급
Client Secret: GitHub에서 발급
Callback URL: https://[project-id].supabase.co/auth/v1/callback
```

### 3. 클라이언트 초기화

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## 🔐 인증 구현

### GitHub 로그인

```typescript
// app/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email' // 필요한 권한
      }
    });

    if (error) console.error('Login error:', error);
  };

  return (
    <button onClick={handleGitHubLogin}>
      GitHub로 로그인
    </button>
  );
}
```

### 콜백 처리

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
```

## 🛡️ RLS (Row Level Security)

### 사용자별 데이터 접근 제어

```sql
-- 사용자 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 자신의 데이터만 수정 가능
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### 성능 최적화: auth.uid() 인덱스

```sql
-- auth.uid() 사용하는 모든 테이블에 인덱스 추가
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_servers_user_id ON servers(user_id);
CREATE INDEX idx_metrics_server_id ON metrics(server_id);
```

## 🔄 세션 관리

### 서버 컴포넌트에서 세션 확인

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <div>안녕하세요, {user.email}님!</div>;
}
```

### 미들웨어로 보호된 라우트

```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트 체크
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

## 🚀 Security Definer 함수

복잡한 권한 처리를 위한 고급 패턴

```sql
-- 관리자만 실행 가능한 함수
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 현재 사용자가 관리자인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 사용자 데이터 삭제
  DELETE FROM servers WHERE user_id = target_user_id;
  DELETE FROM users WHERE id = target_user_id;
END;
$$;
```

## 📊 사용자 메타데이터

```typescript
// 사용자 정보 업데이트
const { error } = await supabase.auth.updateUser({
  data: {
    display_name: 'John Doe',
    avatar_url: 'https://github.com/johndoe.png',
  },
});

// GitHub 프로필 정보 가져오기
const {
  data: { user },
} = await supabase.auth.getUser();
const githubUsername = user?.user_metadata?.user_name;
const githubAvatar = user?.user_metadata?.avatar_url;
```

## 🔗 유용한 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [Auth 가이드](https://supabase.com/docs/guides/auth)
- [RLS 정책](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub OAuth 설정](https://supabase.com/docs/guides/auth/social-login/auth-github)

## 💡 실무 팁

1. **RLS 필수**: 모든 테이블에 RLS 활성화
2. **인덱스 최적화**: auth.uid() 컬럼에 인덱스 추가
3. **세션 유지**: SSR 환경에서 쿠키 기반 세션 관리
4. **무료 티어**: 50,000 MAU까지 무료

---

마지막 업데이트: 2025-07-28 | [전체 문서 보기](https://supabase.com/docs)
