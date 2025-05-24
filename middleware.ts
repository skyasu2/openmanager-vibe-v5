import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();

  // API 경로는 그대로 통과
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Next.js 내부 경로들은 통과
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // 루트 경로 접근 시 index.html로 리다이렉션
  if (pathname === '/') {
    url.pathname = '/index.html';
    return NextResponse.redirect(url);
  }

  // 대시보드 접근 제어
  if (pathname === '/dashboard') {
    // URL 쿼리 파라미터에서 인증 확인
    const authParam = new URL(request.url).searchParams.get('auth');
    const timestamp = new URL(request.url).searchParams.get('t');
    
    // 인증된 접근인지 확인
    if (authParam === 'authorized' && timestamp) {
      // 타임스탬프가 5분 이내인지 확인 (보안)
      const now = Date.now();
      const authTime = parseInt(timestamp);
      const timeDiff = now - authTime;
      
      if (timeDiff <= 5 * 60 * 1000) { // 5분 이내
        return NextResponse.next();
      }
    }
    
    // 미인증 시 index.html로 리다이렉션
    url.pathname = '/index.html';
    return NextResponse.redirect(url);
  }

  // 데모 페이지는 허용
  if (pathname === '/demo') {
    return NextResponse.next();
  }

  // 기타 모든 Next.js 라우트는 index.html로 리다이렉션
  if (!pathname.includes('.')) {
    url.pathname = '/index.html';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}; 