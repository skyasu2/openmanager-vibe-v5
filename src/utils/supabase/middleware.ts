import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔐 Supabase 미들웨어 세션 업데이트 함수
 *
 * PKCE 플로우를 자동으로 처리하고 쿠키를 관리합니다.
 * Server Components가 쿠키를 쓸 수 없으므로 미들웨어에서 처리합니다.
 */
export async function updateSession(
  request: NextRequest,
  response?: NextResponse
) {
  // response가 없으면 새로 생성
  const supabaseResponse = response || NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          if (!cookie) return undefined;
          return typeof cookie === 'string'
            ? cookie
            : String((cookie as any).value);
        },
        set(name: string, value: string, options: any) {
          // 응답 쿠키에만 설정 (request.cookies는 읽기 전용)
          try {
            if (supabaseResponse && 'cookies' in supabaseResponse) {
              (supabaseResponse as any).cookies.set({
                name,
                value,
                ...options,
              });
            }
          } catch (e) {
            console.warn('Cookie set failed:', e);
          }
        },
        remove(name: string, options: any) {
          // 응답 쿠키에서만 제거 (request.cookies는 읽기 전용)
          try {
            if (supabaseResponse && 'cookies' in supabaseResponse) {
              (supabaseResponse as any).cookies.set({
                name,
                value: '',
                maxAge: 0,
                ...options,
              });
            }
          } catch (e) {
            console.warn('Cookie remove failed:', e);
          }
        },
      },
    }
  );

  // OAuth 콜백 처리를 먼저 수행 (PKCE 자동 처리)
  const pathname = request.nextUrl.pathname;
  if (pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    console.log('🔐 미들웨어: OAuth 콜백 처리', {
      hasCode: !!code,
      hasError: !!error,
    });

    if (code && !error) {
      // getUser()를 호출하여 PKCE 플로우 자동 처리
      console.log('🔄 미들웨어: PKCE 코드 교환 처리 중...');
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        console.log('✅ 미들웨어: PKCE 처리 성공', user.email);

        // Phase 3 최적화: 바로 메인으로 리다이렉트 옵션
        const skipSuccessPage = true;

        if (skipSuccessPage) {
          const redirectTo = new URL(request.nextUrl.href);
          redirectTo.pathname = '/main';
          redirectTo.searchParams.delete('code');
          redirectTo.searchParams.delete('error');
          redirectTo.searchParams.delete('error_description');

          return NextResponse.redirect(redirectTo);
        } else {
          // 기존 플로우: success 페이지로
          const redirectTo = new URL(request.nextUrl.href);
          redirectTo.pathname = '/auth/success';
          redirectTo.searchParams.delete('code');

          return NextResponse.redirect(redirectTo);
        }
      } else {
        console.log('⚠️ 미들웨어: PKCE 처리 진행 중...', userError?.message);
      }
    }
  } else {
    // 다른 경로에서는 일반적인 세션 업데이트
    await supabase.auth.getUser();
  }

  return supabaseResponse;
}
