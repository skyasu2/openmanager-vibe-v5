import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withDefault } from '@/types/type-utils';
import { getCookieValue } from '@/utils/cookies/safe-cookie-utils';

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
    withDefault(process.env.NEXT_PUBLIC_SUPABASE_URL, ''),
    withDefault(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, ''),
    {
      cookies: {
        get(name: string) {
          // ✅ 타입 안전 유틸리티 사용 (Issue #001 근본 해결)
          return getCookieValue(request, name);
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // ✅ 개선: 여러 쿠키 공존을 위해 response.cookies.set 사용
          try {
            (supabaseResponse as any).cookies.set(name, value, { // 🔧 수정: 타입 단언 (Next.js 호환)
              path: '/',
              ...options,
            });
          } catch (error) {
            // Fallback: Headers.append 사용 (여러 쿠키 지원)
            const cookieValue = `${name}=${value}; Path=/; ${Object.entries(
              options
            )
              .map(
                ([k, v]) =>
                  `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`
              )
              .join('; ')}`;
            supabaseResponse.headers.append('Set-Cookie', cookieValue);
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          // ✅ 개선: 여러 쿠키 공존을 위해 response.cookies.set 사용
          try {
            (supabaseResponse as any).cookies.set(name, '', { // 🔧 수정: 타입 단언 (Next.js 호환)
              path: '/',
              maxAge: 0,
              ...options,
            });
          } catch (error) {
            // Fallback: Headers.append 사용 (여러 쿠키 지원)
            const cookieValue = `${name}=; Path=/; Max-Age=0; ${Object.entries(
              options
            )
              .map(
                ([k, v]) =>
                  `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`
              )
              .join('; ')}`;
            supabaseResponse.headers.append('Set-Cookie', cookieValue);
          }
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
    // ✅ 보안 개선: 이메일 로깅 제거, 세션 존재 여부만 기록
    console.log('✅ updateSession: 세션 복원됨', 'userId:', session.user.id);

    // 세션이 있으면 사용자 정보도 확인 (토큰 유효성 검증)
    const {
      data: { user },
    } = await (supabase as SupabaseClient).auth.getUser();
    if (user) {
      console.log('✅ updateSession: 사용자 확인됨', 'userId:', user.id);
    }
  } else {
    console.log('⚠️ updateSession: 세션 없음', error?.message);
  }

  return supabaseResponse;
}
