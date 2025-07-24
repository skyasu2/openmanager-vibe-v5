/**
 * 🔐 OAuth 콜백 라우트 핸들러
 *
 * 서버 사이드에서 OAuth 콜백을 처리하여 세션 안정성 향상
 * Supabase가 자동으로 URL의 코드를 감지하고 세션을 설정
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/auth/success';

  console.log('🔐 OAuth 콜백 라우트 핸들러:', {
    hasCode: !!code,
    next,
    origin: requestUrl.origin,
  });

  if (code) {
    // Supabase 클라이언트 생성 (쿠키 기반)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      // 코드를 세션으로 교환
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ 코드 교환 실패:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_callback_failed&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      console.log('✅ 코드 교환 성공');

      // 세션 확인 (즉시)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ 세션 생성 실패:', sessionError);

        // 잠시 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));

        const {
          data: { session: retrySession },
        } = await supabase.auth.getSession();
        if (!retrySession) {
          return NextResponse.redirect(
            `${requestUrl.origin}/login?error=no_session&warning=no_session`
          );
        }
      }

      console.log('✅ 세션 확인됨:', session?.user?.email);

      // 세션 새로고침 (쿠키 갱신)
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('⚠️ 세션 새로고침 실패:', refreshError);
      } else {
        console.log('✅ 세션 새로고침 성공');
      }

      // Vercel 환경에서 추가 대기
      const isVercel =
        process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
      if (isVercel) {
        console.log('⏳ Vercel 환경 - 쿠키 동기화 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 성공 페이지로 리다이렉트
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } catch (error) {
      console.error('❌ OAuth 콜백 처리 오류:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=unexpected&message=${encodeURIComponent('예상치 못한 오류가 발생했습니다')}`
      );
    }
  }

  // 코드가 없으면 로그인 페이지로
  console.error('❌ OAuth 콜백: 인증 코드 없음');
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
}
