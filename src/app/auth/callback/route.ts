/**
 * 🔐 서버 측 OAuth 콜백 Route Handler
 *
 * Supabase SSR을 사용하여 서버에서 PKCE 코드 교환을 처리합니다.
 * 이 방식은 브라우저의 "Invalid value" fetch 에러를 우회합니다.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  console.log('🔐 [Server] OAuth 콜백 수신:', {
    hasCode: !!code,
    hasError: !!error,
    origin,
    timestamp: new Date().toISOString(),
  });

  // OAuth 에러 처리
  if (error) {
    console.error('❌ [Server] OAuth 에러:', error, errorDescription);

    let userMessage = '인증에 실패했습니다.';
    if (error === 'access_denied') {
      userMessage = '인증이 취소되었습니다.';
    } else if (error === 'server_error') {
      userMessage = '서버 오류가 발생했습니다.';
    }

    return NextResponse.redirect(
      `${origin}/login?error=${error}&message=${encodeURIComponent(userMessage)}`
    );
  }

  // 코드가 없으면 클라이언트 측 페이지로 폴백 (implicit flow 지원)
  if (!code) {
    console.log('⚠️ [Server] 코드 없음 - 클라이언트 측 처리로 위임');
    // 클라이언트 측 page.tsx가 implicit flow 토큰을 처리하도록 허용
    // route.ts는 GET 요청에서 code가 없으면 기본 동작 허용
    return NextResponse.next();
  }

  // Supabase 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ [Server] Supabase 환경 변수 누락');
    return NextResponse.redirect(
      `${origin}/login?error=config_error&message=${encodeURIComponent('서버 설정 오류')}`
    );
  }

  // Response 객체 생성 (쿠키 설정용)
  const response = NextResponse.redirect(`${origin}/main`);

  try {
    // @supabase/ssr을 사용한 서버 클라이언트 생성
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    console.log('🔑 [Server] PKCE 코드 교환 시작...');

    // 서버에서 코드를 세션으로 교환
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ [Server] 코드 교환 실패:', exchangeError.message);

      let userMessage = '인증 코드 교환에 실패했습니다.';
      if (exchangeError.message.includes('invalid_grant')) {
        userMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
      } else if (exchangeError.message.includes('code_verifier')) {
        userMessage = 'PKCE 검증에 실패했습니다. 다시 로그인해주세요.';
      }

      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed&message=${encodeURIComponent(userMessage)}`
      );
    }

    if (!data.session) {
      console.error('❌ [Server] 세션 생성 실패: 세션이 null');
      return NextResponse.redirect(
        `${origin}/login?error=no_session&message=${encodeURIComponent('세션 생성에 실패했습니다.')}`
      );
    }

    console.log('✅ [Server] OAuth 로그인 성공:', {
      userId: data.session.user.id,
      email: data.session.user.email,
      provider: data.session.user.app_metadata?.provider,
    });

    // 리다이렉트 목적지 확인 (세션에 저장된 값이 있으면 사용)
    const redirectTo =
      request.cookies.get('auth_redirect_to')?.value || '/main';

    // 성공 시 리다이렉트
    const successResponse = NextResponse.redirect(
      `${origin}${decodeURIComponent(redirectTo)}`
    );

    // 쿠키 복사 (response에 설정된 쿠키를 successResponse로)
    response.cookies.getAll().forEach((cookie) => {
      successResponse.cookies.set(cookie.name, cookie.value);
    });

    // 임시 쿠키 정리
    successResponse.cookies.delete('auth_redirect_to');
    successResponse.cookies.delete('auth_in_progress');

    return successResponse;
  } catch (error) {
    console.error('❌ [Server] OAuth 콜백 처리 예외:', error);

    return NextResponse.redirect(
      `${origin}/login?error=server_error&message=${encodeURIComponent('서버 처리 중 오류가 발생했습니다.')}`
    );
  }
}
