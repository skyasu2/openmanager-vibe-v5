/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * 미들웨어가 PKCE 플로우를 완전히 처리한 후 세션 확인
 * URL code 파라미터 검증 없이 세션 상태만 확인하여 타이밍 이슈 해결
 */

'use client';

import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const startTime = performance.now();

      try {
        console.log('🔐 OAuth 콜백 페이지 로드...');
        console.log(
          '⚡ Supabase가 자동으로 PKCE 처리합니다 (detectSessionInUrl: true)'
        );
        console.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          isVercel: window.location.origin.includes('vercel.app'),
        });

        // URL에서 에러 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
          console.error('❌ OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          const errorMessage = errorDescription || error;

          // 더 자세한 에러 메시지
          let userMessage = 'GitHub 로그인에 실패했습니다.';
          if (error === 'access_denied') {
            userMessage = 'GitHub 인증이 취소되었습니다.';
          } else if (error === 'server_error') {
            userMessage =
              '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          } else if (error === 'temporarily_unavailable') {
            userMessage = '일시적으로 서비스를 사용할 수 없습니다.';
          }

          router.push(
            `/login?error=${error}&message=${encodeURIComponent(userMessage)}`
          );
          return;
        }

        console.log('🔑 Supabase 자동 PKCE 처리 대기 중...');

        // 쿠키 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=/main; path=/; max-age=60; SameSite=Lax`;

        // Supabase가 URL에서 코드를 감지하고 처리할 시간을 줌
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 세션 확인 (재시도 로직 포함)
        let session = null;
        let sessionError = null;
        let attempts = 0;
        const maxAttempts = 5; // 더 많은 재시도 허용

        do {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          sessionError = result.error;

          if (!session && attempts < maxAttempts - 1) {
            console.log(`🔄 세션 확인 재시도 ${attempts + 1}/${maxAttempts}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          attempts++;
        } while (!session && !sessionError && attempts < maxAttempts);

        console.log('📊 세션 상태:', {
          hasSession: !!session,
          sessionError: sessionError?.message,
          user: session?.user?.email,
          attempts,
        });

        if (session?.user) {
          console.log('✅ 세션 확인됨:', session.user.email);
          console.log(
            `⏱️ 콜백 처리 시간: ${(performance.now() - startTime).toFixed(0)}ms`
          );

          // auth_verified 쿠키 설정
          document.cookie = `auth_verified=true; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

          // 바로 메인으로 이동
          console.log('🚀 메인 페이지로 이동!');

          // 세션이 완전히 설정될 때까지 잠시 대기
          await new Promise((resolve) => setTimeout(resolve, 200));

          // 하드 리다이렉트로 쿠키가 제대로 전송되도록 보장
          window.location.href = '/main';
        } else {
          // 세션이 없는 경우
          if (sessionError) {
            console.error('❌ 세션 에러:', sessionError.message);

            // 더 친화적인 에러 메시지
            let userMessage = '인증 처리 중 오류가 발생했습니다.';
            if (sessionError.message.includes('invalid_grant')) {
              userMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
            } else if (sessionError.message.includes('network')) {
              userMessage =
                '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }

            router.push(
              '/login?error=session_failed&message=' +
                encodeURIComponent(userMessage)
            );
          } else {
            console.log('⏳ PKCE 처리 중, 추가 대기...');

            // Vercel 환경에서는 더 긴 대기
            const isVercel = window.location.origin.includes('vercel.app');
            await new Promise((resolve) =>
              setTimeout(resolve, isVercel ? 3000 : 2000)
            );

            // 한 번 더 세션 확인
            const finalCheck = await supabase.auth.getSession();
            if (finalCheck.data.session) {
              console.log('✅ 최종 세션 확인 성공!');
              window.location.href = '/main';
            } else {
              console.log('⚠️ 세션 생성 실패, 로그인 페이지로 이동');
              router.push('/login?error=no_session&warning=no_session');
            }
          }
        }
      } catch (error) {
        console.error('❌ OAuth 콜백 처리 오류:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">인증 처리 중...</h1>
        <p className="text-gray-400">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
