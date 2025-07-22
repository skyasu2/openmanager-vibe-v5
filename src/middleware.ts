import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-ssr';

// 개발 환경에서만 허용하는 API 패턴들
const DEV_ONLY_PATTERNS = [
  '/api/test-',
  '/api/dev/',
  '/api/debug/',
  '/api/ai/test-',
];

// 인증이 필요 없는 경로들 (matcher에서 제외되어 더 이상 사용하지 않음)
// const PUBLIC_PATHS = [...]

// GitHub 인증이 필요한 경로들
const PROTECTED_PATHS = [
  '/', // 홈페이지도 인증 필요
  '/main', // 메인 페이지도 인증 필요
  '/dashboard',
  '/admin',
  '/system-boot',
  '/api/dashboard',
  '/api/admin',
  '/api/ai', // AI 기능은 인증 필요
  '/api/servers', // 서버 관리 API
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 프로덕션에서 개발/테스트 API 차단
  if (process.env.NODE_ENV === 'production') {
    const isDevAPI = DEV_ONLY_PATTERNS.some(pattern =>
      pathname.startsWith(pattern)
    );

    if (isDevAPI) {
      return NextResponse.json(
        {
          error: 'Development/Test endpoints are disabled in production',
          status: 'blocked',
          path: pathname,
        },
        { status: 403 }
      );
    }
  }

  // 공개 경로는 matcher에서 이미 제외되었으므로 간단히 체크
  const isPublicAPI = pathname.startsWith('/api/servers/all');
  if (isPublicAPI) {
    return response;
  }

  // 보호된 경로 체크
  const isProtectedPath = PROTECTED_PATHS.some(path => {
    return pathname === path || pathname.startsWith(path + '/');
  });

  if (isProtectedPath) {
    try {
      // 🎯 게스트 세션 쿠키 확인 (우선순위)
      const guestSessionCookie = request.cookies.get('guest_session_id');
      const authTypeCookie = request.cookies.get('auth_type');

      if (guestSessionCookie && authTypeCookie?.value === 'guest') {
        console.log(
          '✅ 게스트 세션 확인됨, 접근 허용:',
          guestSessionCookie.value
        );
        return response;
      }

      // Supabase SSR 클라이언트 사용
      const supabase = createMiddlewareClient(request, response);

      // 모든 쿠키 로그
      const cookies = request.cookies.getAll();
      console.log(
        '🍪 미들웨어 쿠키 목록:',
        cookies.map(c => c.name)
      );

      // 세션 확인
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log('🔐 미들웨어 세션 체크:', {
        path: pathname,
        hasSession: !!session,
        error: error?.message,
        userEmail: session?.user?.email,
      });

      if (error || !session) {
        // 이미 로그인 페이지에 있다면 리디렉션하지 않음 (무한 루프 방지)
        if (pathname === '/login') {
          return response;
        }

        console.log('❌ 미들웨어: 세션 없음, 로그인 페이지로 리다이렉트');
        // GitHub 인증이 없으면 로그인 페이지로 리다이렉트
        const redirectUrl = new URL('/login', request.url);
        // 루트 경로(/)는 /main으로 리다이렉트하도록 설정
        const redirectPath = pathname === '/' ? '/main' : pathname;
        redirectUrl.searchParams.set('redirectTo', redirectPath);
        return NextResponse.redirect(redirectUrl);
      }

      console.log('✅ 미들웨어: 세션 확인됨, 접근 허용');
    } catch (error) {
      console.error('Middleware auth check error:', error);

      // 이미 로그인 페이지에 있다면 리디렉션하지 않음 (무한 루프 방지)
      if (pathname === '/login') {
        return response;
      }

      // 에러 발생 시 안전하게 로그인 페이지로
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (OAuth callback)
     * - login (로그인 페이지)
     * - api/auth (인증 API)
     * - api/health, api/ping (헬스체크)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|login|api/auth|api/health|api/ping).*)',
  ],
};
