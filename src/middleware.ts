import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🚀 OpenManager Vibe v5 - API 추적 미들웨어
 * 
 * 모든 API 호출을 자동으로 추적하여 실시간 메트릭 수집
 */

export function middleware(request: NextRequest) {
    const startTime = Date.now();

    // API 경로만 추적
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

export const config = {
    matcher: '/api/:path*'
}; 