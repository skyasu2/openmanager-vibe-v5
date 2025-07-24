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
  const supabaseResponse =
    response ||
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // 요청 쿠키와 응답 쿠키 모두에 설정
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          // 요청 쿠키와 응답 쿠키 모두에서 제거
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // OAuth 콜백 처리를 먼저 수행
  const pathname = request.nextUrl.pathname;
  if (pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code');

    if (code) {
      console.log('🔐 OAuth 콜백 처리 중 - 코드 교환 시작');

      try {
        // exchangeCodeForSession을 명시적으로 호출하여 세션 생성
        const {
          data: { session },
          error,
        } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ 코드 교환 실패:', error);
          const errorUrl = request.nextUrl.clone();
          errorUrl.pathname = '/login';
          errorUrl.searchParams.set('error', 'code_exchange_failed');
          return NextResponse.redirect(errorUrl);
        }

        if (session) {
          console.log('✅ OAuth 세션 생성 성공:', session.user?.email);

          // 세션이 생성되었으므로 성공 페이지로 리다이렉트
          const redirectTo = request.nextUrl.clone();
          redirectTo.pathname = '/auth/success';
          redirectTo.searchParams.delete('code');

          return NextResponse.redirect(redirectTo);
        }
      } catch (error) {
        console.error('❌ OAuth 처리 중 오류:', error);
      }
    }
  }

  // 일반적인 세션 업데이트 처리
  await supabase.auth.getUser();

  return supabaseResponse;
}
