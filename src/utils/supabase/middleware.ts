import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

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
          return cookie;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // 응답 쿠키에만 설정 (request.cookies는 읽기 전용)
          // Next.js 15에서는 NextResponse.cookies 대신 headers 사용
          const cookieValue = `${name}=${value}; Path=/; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`;
          supabaseResponse.headers.set('Set-Cookie', cookieValue);
        },
        remove(name: string, options: Record<string, unknown>) {
          // 응답 쿠키에서만 제거 (request.cookies는 읽기 전용)
          // Next.js 15에서는 NextResponse.cookies 대신 headers 사용
          const cookieValue = `${name}=; Path=/; Max-Age=0; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`;
          supabaseResponse.headers.set('Set-Cookie', cookieValue);
        },
      },
    }
  );

  // OAuth 콜백 처리는 클라이언트 사이드에서 수행하도록 변경
  // detectSessionInUrl: true 설정으로 Supabase가 자동으로 처리함
  const _pathname = request.nextUrl.pathname;

  // 세션 업데이트 - getSession을 먼저 호출하여 쿠키를 새로고침
  const {
    data: { session },
    error,
  } = await (supabase as SupabaseClient).auth.getSession();

  if (session) {
    console.log('✅ updateSession: 세션 복원됨', session.user.email);

    // 세션이 있으면 사용자 정보도 확인 (토큰 유효성 검증)
    const {
      data: { user },
    } = await (supabase as SupabaseClient).auth.getUser();
    if (user) {
      console.log('✅ updateSession: 사용자 확인됨', user.email);
    }
  } else {
    console.log('⚠️ updateSession: 세션 없음', error?.message);
  }

  return supabaseResponse;
}
