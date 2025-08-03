import { getCachedUser, setCachedUser } from '@/lib/auth-cache';
import { updateSession } from '@/utils/supabase/middleware';
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
  // '/'는 제거 - 별도로 /main으로 리다이렉트 처리
  '/main', // 메인 페이지는 인증 필요
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

  console.log('🔍 미들웨어 실행:', pathname);

  // updateSession을 먼저 호출하여 PKCE 플로우 자동 처리
  const response = await updateSession(request);

  console.log('🔄 updateSession 완료');

  // 프로덕션에서 개발/테스트 API 차단
  if (process.env.NODE_ENV === 'production') {
    const isDevAPI = DEV_ONLY_PATTERNS.some((pattern) =>
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

  // auth 관련 경로는 보호하지 않음 (세션 설정 중)
  if (pathname.startsWith('/auth/')) {
    console.log('✅ Auth 경로 접근 허용:', pathname);
    return response;
  }

  // 루트 경로는 세션 체크 없이 바로 /main으로 리다이렉트
  if (pathname === '/') {
    console.log('🏠 루트 경로 접근, /main으로 리다이렉트');
    return NextResponse.redirect(new URL('/main', request.url));
  }

  // 보호된 경로 체크
  const isProtectedPath = PROTECTED_PATHS.some((path) => {
    return pathname === path || pathname.startsWith(path + '/');
  });

  if (isProtectedPath) {
    try {
      // 🎯 게스트 세션 쿠키 확인 (우선순위)
      const guestSessionCookie = request.cookies.get('guest_session_id');
      const authTypeCookie = request.cookies.get('auth_type');
      const authVerifiedCookie = request.cookies.get('auth_verified');

      if (
        guestSessionCookie &&
        (authTypeCookie && typeof authTypeCookie === 'object' && 'value' in authTypeCookie ? (authTypeCookie as any).value : '') === 'guest'
      ) {
        console.log(
          '✅ 게스트 세션 확인됨, 접근 허용:',
          guestSessionCookie && typeof guestSessionCookie === 'object' && 'value' in guestSessionCookie ? (guestSessionCookie as any).value : ''
        );
        return response;
      }

      // 🔐 OAuth 인증 직후 확인 (auth_verified 쿠키)
      if (authVerifiedCookie) {
        console.log('✅ OAuth 인증 확인됨 (auth_verified 쿠키)');
        // auth_verified가 있으면 세션이 곧 활성화될 것으로 간주
      }

      // updateSession에서 반환된 response의 쿠키를 읽어야 함
      // 새로운 클라이언트를 생성하면 안됨!
      const { createServerClient } = await import('@supabase/ssr');

      // response의 쿠키를 포함한 새로운 Request 생성
      const _requestWithCookies = new Request(request.url, {
        headers: request.headers,
      });

      // response에서 설정한 쿠키를 request에 추가
      const responseCookies = response.headers.get('set-cookie');
      if (responseCookies) {
        console.log('🍪 Response 쿠키 발견, 동기화 중...');
      }

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              // response의 쿠키는 NextResponse에서 직접 접근할 수 없음
              // request의 쿠키만 확인

              const cookie = request.cookies.get(name);
              return cookie && typeof cookie === 'object' && 'value' in cookie ? (cookie as any).value : undefined;
            },
            set() {
              // Response에서 이미 설정되었으므로 무시
            },
            remove() {
              // Response에서 이미 설정되었으므로 무시
            },
          },
        }
      );

      // 모든 쿠키 로그
      const cookies = Array.from(request.cookies.entries()).map(
        ([name, value]) => ({ name, value })
      );
      console.log(
        '🍪 미들웨어 쿠키 목록:',
        cookies.map((c) => c.name)
      );

      // 🔧 OAuth 콜백 직후인지 확인 (세션 안정화 시간 필요)
      const referer = request.headers.get('referer') || '';
      const isFromAuthCallback = referer.includes('/auth/callback');
      const isFromAuthSuccess = referer.includes('/auth/success');
      const isFromAuth = isFromAuthCallback || isFromAuthSuccess;

      // Vercel 환경 감지 (더 정확한 방법)
      const hostname = request.headers.get('host') || '';
      const isVercel =
        hostname.includes('vercel.app') ||
        hostname.includes('.vercel.app') ||
        process.env.VERCEL === '1' ||
        process.env.VERCEL_ENV !== undefined ||
        request.headers.get('x-vercel-id') !== null;

      // 🔄 OAuth 플로우 중인지 확인 (쿠키에서 확인)
      const hasAuthRedirect = request.cookies.get('auth_redirect_to');
      const authInProgress = request.cookies.get('auth_in_progress');
      const isInAuthFlow = isFromAuth || hasAuthRedirect || authInProgress;

      console.log('🌍 미들웨어 환경:', {
        isVercel,
        hostname,
        isFromAuth,
        isInAuthFlow,
        referer: referer.substring(0, 50) + '...',
        hasAuthRedirect: !!hasAuthRedirect,
        authInProgress: !!authInProgress,
      });

      // 🔐 보안 강화: getUser()를 사용하여 토큰 재검증
      let user = null;
      let userError = null;
      let attempts = 0;

      // 먼저 세션 ID로 캐시 확인 (성능 최적화)
      const sessionResult = await supabase.auth.getSession();
      const sessionId = sessionResult.data.session?.access_token;

      console.log('🔐 미들웨어 세션 체크:', {
        hasSession: !!sessionResult.data.session,
        sessionError: sessionResult.error?.message,
        userEmail: sessionResult.data.session?.user?.email,
        path: pathname,
      });

      if (sessionId) {
        // 캐시된 사용자 정보 확인
        const cachedUser = getCachedUser(sessionId);
        if (cachedUser !== undefined) {
          console.log('✅ 캐시에서 사용자 정보 조회됨');
          user = cachedUser;
        } else {
          // 캐시 미스 - Auth 서버에서 검증
          console.log('🔍 Auth 서버에서 사용자 정보 검증 중...');

          // Vercel 및 OAuth 플로우 중이라면 더 많은 재시도와 긴 대기시간 적용
          const maxAttempts = isVercel
            ? isInAuthFlow
              ? 8 // Vercel + Auth 플로우: 최대 8회 시도
              : 3
            : isInAuthFlow
              ? 5 // 로컬 + Auth 플로우: 최대 5회 시도
              : 1;
          const waitTime = isVercel
            ? isInAuthFlow
              ? 2000 // Vercel + Auth 플로우: 2초 대기
              : 800
            : isInAuthFlow
              ? 1000 // 로컬 + Auth 플로우: 1초 대기
              : 300;

          // getUser()로 토큰 검증 (재시도 로직 포함)
          do {
            const result = await supabase.auth.getUser();
            user = result.data.user;
            userError = result.error;

            if (!user && attempts < maxAttempts - 1) {
              console.log(
                `🔄 미들웨어 사용자 검증 재시도 ${attempts + 1}/${maxAttempts} (Vercel: ${isVercel}, AuthFlow: ${isInAuthFlow})`
              );

              // 대기
              await new Promise((resolve) => setTimeout(resolve, waitTime));

              // 세션 새로고침 시도 (중간 지점에서)
              if (attempts === Math.floor(maxAttempts / 2)) {
                try {
                  console.log('🔄 미들웨어에서 세션 새로고침 시도...');
                  const refreshResult = await supabase.auth.refreshSession();
                  if (refreshResult.data.session) {
                    console.log('✅ 미들웨어에서 세션 새로고침 성공');
                    // 새로고침 후 다시 getUser() 시도
                    continue;
                  }
                } catch (refreshError) {
                  console.log('⚠️ 세션 새로고침 실패:', refreshError);
                }
              }

              // Auth 플로우 중이라면 추가 세션 확인
              if (isInAuthFlow && attempts === maxAttempts - 2) {
                console.log('🔄 Auth 플로우 - 추가 세션 확인...');
                const additionalSessionCheck = await supabase.auth.getSession();
                if (additionalSessionCheck.data.session) {
                  console.log('✅ 추가 세션 확인 성공');
                  continue;
                }
              }
            }
            attempts++;
          } while (!user && !userError && attempts < maxAttempts);

          // 캐시에 저장
          if (sessionId && !userError) {
            setCachedUser(sessionId, user);
          }
        }
      } else {
        console.log('❌ 세션 토큰이 없음');
      }

      console.log('🔐 미들웨어 사용자 검증:', {
        path: pathname,
        hasUser: !!user,
        error: userError?.message,
        userEmail: user?.email,
        attempts,
        cached: getCachedUser(sessionId || '') !== undefined,
      });

      if (userError || !user) {
        // 이미 로그인 페이지에 있다면 리디렉션하지 않음 (무한 루프 방지)
        if (pathname === '/login') {
          return response;
        }

        // auth_verified 쿠키가 있다면 세션이 곧 활성화될 것으로 간주
        if (authVerifiedCookie) {
          console.log(
            '⚠️ auth_verified 쿠키 있음 - 세션 활성화 대기 중, 통과 허용'
          );
          return response;
        }

        // Auth 플로우 중이라면 더 관대하게 처리 (한 번 더 기회)
        if (isInAuthFlow && !userError) {
          console.log('⚠️ Auth 플로우 중 - 세션 없음이지만 통과 허용');
          return response;
        }

        console.log('❌ 미들웨어: 세션 없음, 로그인 페이지로 리다이렉트', {
          userError: userError?.message,
          hasUser: !!user,
          isInAuthFlow,
          hasAuthVerified: !!authVerifiedCookie,
        });

        // GitHub 인증이 없으면 로그인 페이지로 리다이렉트
        const redirectUrl = new URL('/login', request.url);
        // 현재 경로를 redirectTo 파라미터로 설정
        redirectUrl.searchParams.set('redirectTo', pathname);
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
     * - login (로그인 페이지)
     * - api/health, api/ping (헬스체크)
     *
     * 주의: auth/callback과 auth/success는 PKCE 처리를 위해 미들웨어를 통과해야 함
     * api/auth는 제외하지 않음 (보호된 경로)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/health|api/ping).*)',
  ],
};
