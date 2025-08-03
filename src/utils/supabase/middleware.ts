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

  // OAuth 콜백 처리는 클라이언트 사이드에서 수행하도록 변경
  // detectSessionInUrl: true 설정으로 Supabase가 자동으로 처리함
  const pathname = request.nextUrl.pathname;

  // 모든 경로에서 세션 업데이트 (Supabase가 자동으로 PKCE 처리)
  await supabase.auth.getUser();

  return supabaseResponse;
}
