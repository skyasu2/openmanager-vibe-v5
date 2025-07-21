/**
 * 🔐 Supabase Auth 콜백 핸들러
 *
 * GitHub OAuth 로그인 후 Supabase가 이 엔드포인트로 리다이렉트합니다.
 * 인증 코드를 처리하고 적절한 페이지로 리다이렉트합니다.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/main';

  // 리다이렉트 URL 검증 (보안)
  const allowedRedirects = ['/main', '/dashboard', '/'];
  const finalRedirect = allowedRedirects.includes(redirect)
    ? redirect
    : '/main';

  console.log('🔐 Auth 콜백 처리:', {
    code: code ? 'exists' : 'missing',
    redirect,
    origin: requestUrl.origin,
    fullUrl: request.url,
    isVercel: requestUrl.origin.includes('vercel.app'),
    timestamp: new Date().toISOString(),
  });

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // 인증 코드를 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ 세션 교환 실패:', error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_failed`
        );
      }

      console.log('✅ 세션 교환 성공, 리다이렉트:', redirect);

      // 세션 정보 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('🔐 생성된 세션:', {
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
      });
    } catch (error) {
      console.error('❌ 콜백 처리 중 오류:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=callback_error`
      );
    }
  } else {
    console.warn('⚠️ 인증 코드가 없습니다');
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
  }

  // 성공 시 지정된 페이지로 리다이렉트
  console.log('🎯 최종 리다이렉트:', finalRedirect);
  return NextResponse.redirect(`${requestUrl.origin}${finalRedirect}`);
}
