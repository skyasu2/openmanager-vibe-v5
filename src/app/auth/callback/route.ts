/**
 * 🔐 OAuth Callback Route Handler (Server-side PKCE)
 *
 * Supabase OAuth 콜백을 서버에서 처리
 * - PKCE code_verifier가 쿠키에서 읽혀짐
 * - 코드 교환 후 세션 쿠키 설정
 * - 메인 페이지로 리다이렉트
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  logger.info('🔐 OAuth 콜백 수신 (Server-side):', {
    hasCode: !!code,
    hasError: !!error,
    origin: requestUrl.origin,
  });

  // OAuth 에러 처리
  if (error) {
    logger.error('❌ OAuth 에러:', error, errorDescription);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error);
    if (errorDescription) {
      loginUrl.searchParams.set('message', errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 코드가 없으면 로그인 페이지로
  if (!code) {
    logger.info('⚠️ 인증 코드 없음 - 로그인 페이지로 이동');
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  try {
    const cookieStore = await cookies();
    // trim()으로 환경 변수의 불필요한 공백/줄바꿈 제거
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

    if (!supabaseUrl || !supabaseKey) {
      logger.error('❌ Supabase 환경 변수 누락');
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'config_error');
      return NextResponse.redirect(loginUrl);
    }

    // 응답 객체 생성 (쿠키 설정용)
    const response = NextResponse.redirect(new URL('/main', requestUrl.origin));

    // 서버 클라이언트 생성 (쿠키 읽기/쓰기 가능)
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // PKCE 코드 교환
    logger.info('🔑 PKCE 코드 교환 시작...');
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logger.error('❌ 코드 교환 실패:', exchangeError.message);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'exchange_failed');
      loginUrl.searchParams.set('message', exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    if (!data.session) {
      logger.error('❌ 세션 생성 실패');
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'no_session');
      return NextResponse.redirect(loginUrl);
    }

    logger.info('✅ OAuth 로그인 성공:', {
      userId: data.session.user.id,
      email: data.session.user.email,
      provider: data.session.user.app_metadata?.provider,
    });

    // 게스트 쿠키 정리
    response.cookies.delete('guest_session_id');
    response.cookies.delete('auth_session_id');
    response.cookies.delete('auth_type');

    return response;
  } catch (error) {
    logger.error('❌ 콜백 처리 예외:', error);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'callback_exception');
    return NextResponse.redirect(loginUrl);
  }
}
