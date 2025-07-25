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

  // 이 부분이 중요: getUser()를 호출하면 토큰이 자동으로 새로고침되고
  // PKCE 플로우가 자동으로 처리됩니다
  await supabase.auth.getUser();

  // OAuth 콜백 처리
  const pathname = request.nextUrl.pathname;
  if (pathname === '/auth/callback') {
    // 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // 세션이 있으면 성공 페이지로 리다이렉트
      const redirectTo = request.nextUrl.clone();
      redirectTo.pathname = '/auth/success';
      redirectTo.searchParams.delete('code');

      return NextResponse.redirect(redirectTo);
    }
  }

  return supabaseResponse;
}
