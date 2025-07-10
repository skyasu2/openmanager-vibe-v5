import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 개발 환경에서만 허용하는 API 패턴들
const DEV_ONLY_PATTERNS = [
  '/api/test-',
  '/api/dev/',
  '/api/debug/',
  '/api/ai/test-',
  '/api/dev-tools/',
];

// 인증이 필요 없는 경로들
const PUBLIC_PATHS = [
  '/login',
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/api/health',
  '/api/ping',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // 인증 체크 (NextAuth 세션 또는 게스트 로그인)
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  if (!isPublicPath) {
    // NextAuth 세션 체크
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token');
    
    // 게스트 로그인 체크를 위한 커스텀 헤더 (클라이언트에서 설정)
    const isGuestAuth = request.headers.get('x-guest-auth') === 'true';
    
    // 세션도 없고 게스트 인증도 없으면 로그인 페이지로 리다이렉트
    if (!sessionToken && !isGuestAuth && pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
