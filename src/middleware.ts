import { createMiddlewareClient } from '@/lib/supabase-ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

      // 🔧 OAuth 콜백 직후인지 확인 (세션 안정화 시간 필요)
      const isFromAuthCallback = request.headers
        .get('referer')
        ?.includes('/auth/');
      const isFromAuthSuccess = request.headers
        .get('referer')
        ?.includes('/auth/success');

      // Vercel 환경 감지 (더 정확한 방법)
      const hostname = request.headers.get('host') || '';
      const isVercel =
        hostname.includes('vercel.app') ||
        hostname.includes('.vercel.app') ||
        process.env.VERCEL === '1' ||
        process.env.VERCEL_ENV !== undefined ||
        request.headers.get('x-vercel-id') !== null;

      console.log('🌍 미들웨어 환경:', {
        isVercel,
        hostname,
        isFromAuth: isFromAuthCallback || isFromAuthSuccess,
      });

      // 세션 확인 (재시도 로직 포함)
      let session = null;
      let sessionError = null;
      let attempts = 0;

      // Vercel 및 OAuth 콜백 직후라면 더 많은 재시도와 긴 대기시간 적용
      const isAuthFlow = isFromAuthCallback || isFromAuthSuccess;
      const maxAttempts = isVercel ? (isAuthFlow ? 8 : 5) : isAuthFlow ? 5 : 2;
      const waitTime = isVercel
        ? isAuthFlow
          ? 2000
          : 1000
        : isAuthFlow
          ? 1000
          : 500;

      // 세션 확인을 최대 재시도 (OAuth 콜백 직후 타이밍 이슈 해결)
      do {
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;

        if (!session && attempts < maxAttempts - 1) {
          console.log(
            `🔄 미들웨어 세션 재시도 ${attempts + 1}/${maxAttempts} (Vercel: ${isVercel}, OAuth: ${isAuthFlow})`
          );

          // 대기
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // 세션 새로고침 시도 (중간 지점에서)
          if (attempts === Math.floor(maxAttempts / 2) || attempts === 1) {
            try {
              const refreshResult = await supabase.auth.refreshSession();
              if (refreshResult.data.session) {
                console.log('✅ 미들웨어에서 세션 새로고침 성공');
                session = refreshResult.data.session;
                break;
              }
            } catch (refreshError) {
              console.log('⚠️ 세션 새로고침 실패:', refreshError);
            }
          }

          // Vercel 환경에서 추가 시도
          if (isVercel && attempts === maxAttempts - 2) {
            console.log('🔄 Vercel 환경 - 추가 새로고침 시도');
            try {
              await supabase.auth.refreshSession();
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {
              // 무시
            }
          }
        }
        attempts++;
      } while (!session && !sessionError && attempts < maxAttempts);

      console.log('🔐 미들웨어 세션 체크:', {
        path: pathname,
        hasSession: !!session,
        error: sessionError?.message,
        userEmail: session?.user?.email,
        attempts,
      });

      if (sessionError || !session) {
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
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/success|login|api/auth|api/health|api/ping).*)',
  ],
};
