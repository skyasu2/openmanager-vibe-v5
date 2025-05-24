import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // 시작 시간 기록 (성능 모니터링)
  const startTime = Date.now();

  try {
    // 1. API 경로는 절대 건드리지 않음 - 최우선 처리
    if (pathname.startsWith('/api/')) {
      // MIDDLEWARE_INVOCATION_FAILED (500) 방지
      console.log(`[Middleware] API route passed: ${pathname}`);
      return NextResponse.next();
    }

    // 2. Next.js 내부 리소스들은 통과
    if (pathname.startsWith('/_next/') || 
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/__next') ||
        pathname.includes('/_next') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.json') ||
        pathname.endsWith('.xml') ||
        pathname.endsWith('.txt')) {
      return NextResponse.next();
    }

    // 3. 정적 파일들 (.html 포함) 통과
    if (pathname.includes('.') && !pathname.endsWith('/')) {
      return NextResponse.next();
    }

    // 4. 루트 경로 접근 시 index.html로 리다이렉션
    if (pathname === '/') {
      url.pathname = '/index.html';
      console.log(`[Middleware] Root redirect: / -> /index.html`);
      return NextResponse.redirect(url);
    }

    // 5. 대시보드 접근 제어
    if (pathname === '/dashboard') {
      // URL 쿼리 파라미터에서 인증 확인
      const authParam = request.nextUrl.searchParams.get('auth');
      const timestamp = request.nextUrl.searchParams.get('t');
      
      // 인증된 접근인지 확인
      if (authParam === 'authorized' && timestamp) {
        const now = Date.now();
        const authTime = parseInt(timestamp);
        const timeDiff = now - authTime;
        
        // 5분 이내 인증 토큰만 허용
        if (timeDiff <= 5 * 60 * 1000) {
          console.log(`[Middleware] Dashboard access authorized`);
          return NextResponse.next();
        }
      }
      
      // 미인증 시 index.html로 리다이렉션
      url.pathname = '/index.html';
      console.log(`[Middleware] Dashboard unauthorized redirect`);
      return NextResponse.redirect(url);
    }

    // 6. 데모 페이지는 허용
    if (pathname === '/demo') {
      return NextResponse.next();
    }

    // 7. 문서 페이지 허용
    if (pathname.startsWith('/docs')) {
      return NextResponse.next();
    }

    // 8. 기타 모든 Next.js 라우트는 index.html로 리다이렉션
    url.pathname = '/index.html';
    console.log(`[Middleware] Other route redirect: ${pathname} -> /index.html`);
    return NextResponse.redirect(url);

  } catch (error) {
    // 오류 발생 시 안전한 fallback
    console.error(`[Middleware] Error processing ${pathname}:`, error);
    
    // API 경로라면 그대로 통과
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // 그외는 index.html로 리다이렉션
    url.pathname = '/index.html';
    return NextResponse.redirect(url);
  } finally {
    // 성능 로깅
    const duration = Date.now() - startTime;
    if (duration > 100) { // 100ms 이상 걸리면 경고
      console.warn(`[Middleware] Slow processing: ${pathname} took ${duration}ms`);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 