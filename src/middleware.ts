import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🚀 OpenManager Vibe v5 - API 추적 미들웨어
 *
 * 모든 API 호출을 자동으로 추적하여 실시간 메트릭 수집
 * 🚨 개발 환경에서는 Vercel 과금 방지를 위해 비활성화
 */

export function middleware(request: NextRequest) {
  // 🚨 개발 환경에서는 미들웨어 비활성화 (Vercel Edge Middleware 과금 방지)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isMonitoringDisabled =
    process.env.PERFORMANCE_MONITORING_ENABLED === 'false';

  if (isDevelopment || isMonitoringDisabled) {
    // 개발 환경에서는 미들웨어 처리 생략
    return NextResponse.next();
  }

  const startTime = Date.now();

  // API 경로만 추적 (프로덕션 환경)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 응답 후 메트릭 기록을 위한 헤더 추가
    const response = NextResponse.next();

    // 메트릭 수집을 위한 정보를 헤더에 추가
    response.headers.set('x-start-time', startTime.toString());
    response.headers.set('x-endpoint', request.nextUrl.pathname);
    response.headers.set('x-method', request.method);

    return response;
  }

  return NextResponse.next();
}

// 🚨 Next.js는 config.matcher에서 런타임 조건부 표현식을 지원하지 않음
// 개발 환경에서는 middleware 함수 내부에서 early return으로 처리
export const config = {
  matcher: '/api/:path*', // 모든 환경에서 동일하게 설정하되, 함수 내부에서 처리
};
