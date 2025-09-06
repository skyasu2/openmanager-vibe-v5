import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 미들웨어 - 보안 및 환경별 접근 제어
 *
 * 주요 기능:
 * 1. 개발 환경 전용 경로 보호
 * 2. 테스트 파일 프로덕션 차단
 * 3. 보안 헤더 추가
 * 4. API 요청 검증
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isVercel = process.env.VERCEL === '1';

  // 🚫 프로덕션 환경에서 테스트/개발 도구 차단
  if (isProduction) {
    const blockedPaths = [
      '/test-', // test-*.html
      '/tests/', // /tests/* 디렉토리
      '/dev/', // /dev/* API 경로
      '/api/dev/', // /api/dev/* API 경로
      '/_dev/', // 내부 개발 도구
      '/debug/', // 디버그 도구
      '/.env', // 환경변수 파일
      '/config/', // 설정 파일
    ];

    const isBlocked = blockedPaths.some((path) => pathname.startsWith(path));

    if (isBlocked) {
      // 보안 로그 (프로덕션에서 접근 시도 기록)
      console.warn(
        `🚨 Security Alert: Blocked access to ${pathname} in production`,
        {
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          timestamp: new Date().toISOString(),
        }
      );

      // 404로 리다이렉트 (경로 존재 여부 숨김)
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  // 🔒 개발 환경 전용 경로 검증
  if (pathname.startsWith('/api/dev/')) {
    const hostname = request.headers.get('host') || '';
    const isLocalhost =
      hostname.includes('localhost') ||
      hostname.includes('127.0.0.1') ||
      hostname.includes('local');

    // 개발 환경이 아니거나 localhost가 아닌 경우 차단
    if (!isDevelopment || !isLocalhost) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message:
            'Development APIs are only available in local development environment',
          code: 'DEV_API_BLOCKED',
        },
        {
          status: 403,
          headers: {
            'X-Security-Policy': 'development-only',
            'X-Environment': process.env.NODE_ENV || 'unknown',
          },
        }
      );
    }
  }

  // 🛡️ 보안 헤더 추가
  const response = NextResponse.next();

  // 기본 보안 헤더
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 개발 환경 전용 헤더
  if (isDevelopment) {
    response.headers.set('X-Dev-Environment', 'true');
    response.headers.set('X-Test-Tools-Available', 'true');
  }

  // 프로덕션 환경 보안 강화
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    response.headers.set('X-Security-Level', 'production');
    response.headers.set('X-Test-Tools-Available', 'false');
  }

  // Vercel 환경 최적화
  if (isVercel) {
    response.headers.set('X-Vercel-Environment', 'true');
    response.headers.set('X-Edge-Runtime', 'middleware');
  }

  // 🚧 테스트 파일 접근 로깅 (개발 환경)
  if (
    isDevelopment &&
    (pathname.startsWith('/tests/') || pathname.includes('test-'))
  ) {
    console.log(`📋 Dev Tool Access: ${pathname}`, {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
    });
  }

  return response;
}

// Edge Runtime 활성화 (성능 최적화)
export const runtime = 'experimental-edge';

/**
 * 미들웨어 적용 경로 설정
 *
 * - 모든 경로에 적용하되 정적 파일은 제외
 * - API 경로는 포함하여 보안 검사 수행
 */
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청 경로에 적용:
     * - login, main 경로 (리다이렉트 루프 방지)
     * - api 경로가 아닌 내부 Next.js 파일 (_next)
     * - 정적 파일 (css, js, images 등)
     * - favicon.ico
     */
    '/((?!login|main|api|_next/static|_next/image|favicon.ico|.*\\.(?:css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2)$).*)',
  ],
};
