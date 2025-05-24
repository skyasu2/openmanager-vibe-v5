import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`[Middleware] Processing: ${pathname}`);
  
  // API 경로와 Next.js 내부 파일들은 그대로 통과
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    console.log(`[Middleware] Passing through: ${pathname}`);
    return NextResponse.next();
  }

  // 루트 경로는 index.html로 리다이렉션
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/index.html';
    console.log(`[Middleware] Root redirect: / -> /index.html`);
    return NextResponse.redirect(url);
  }

  // 대시보드 접근 제어
  if (pathname === '/dashboard') {
    const authParam = request.nextUrl.searchParams.get('auth');
    const timestamp = request.nextUrl.searchParams.get('t');
    
    if (authParam === 'authorized' && timestamp) {
      const now = Date.now();
      const authTime = parseInt(timestamp);
      if (now - authTime <= 5 * 60 * 1000) {
        console.log(`[Middleware] Dashboard access authorized`);
        return NextResponse.next();
      }
    }
    
    const url = request.nextUrl.clone();
    url.pathname = '/index.html';
    console.log(`[Middleware] Dashboard unauthorized redirect`);
    return NextResponse.redirect(url);
  }

  // 허용된 경로들
  if (pathname === '/demo' || pathname.startsWith('/docs')) {
    console.log(`[Middleware] Allowed path: ${pathname}`);
    return NextResponse.next();
  }

  // 기타 모든 경로는 index.html로 리다이렉션
  const url = request.nextUrl.clone();
  url.pathname = '/index.html';
  console.log(`[Middleware] General redirect: ${pathname} -> /index.html`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * API 경로와 정적 파일을 완전히 제외한 모든 경로에 적용
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 