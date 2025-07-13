import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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
  '/about',
  '/notes',
];

// 정확한 경로 매칭을 위한 헬퍼 함수
function isExactPathMatch(pathname: string, paths: string[]): boolean {
  return paths.some(path => {
    // 정확한 매칭 또는 하위 경로 매칭
    return pathname === path || pathname.startsWith(path + '/');
  });
}

// GitHub 인증이 필요한 경로들
const PROTECTED_PATHS = [
  '/',  // 홈페이지도 인증 필요
  '/dashboard',
  '/admin',
  '/system-boot',
  '/api/dashboard',
  '/api/admin',
  '/api/ai',  // AI 기능은 인증 필요
  '/api/servers',  // 서버 관리 API
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

  // 먼저 공개 경로인지 확인 (무한 리디렉션 방지)
  const isPublicPath = isExactPathMatch(pathname, PUBLIC_PATHS);

  // 공개 경로는 인증 체크 없이 통과
  if (isPublicPath) {
    return response;
  }

  // 보호된 경로 체크
  const isProtectedPath = isExactPathMatch(pathname, PROTECTED_PATHS);

  if (isProtectedPath) {
    try {
      // Supabase 클라이언트 생성
      const supabase = createMiddlewareClient({ req: request, res: response });
      
      // 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // 이미 로그인 페이지에 있다면 리디렉션하지 않음 (무한 루프 방지)
        if (pathname === '/login') {
          return response;
        }
        
        // GitHub 인증이 없으면 로그인 페이지로 리다이렉트
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }
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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
