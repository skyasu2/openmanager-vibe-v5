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
  '/about',  // about 페이지 추가
  '/notes',  // notes 페이지 추가 (공개 페이지인 경우)
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
