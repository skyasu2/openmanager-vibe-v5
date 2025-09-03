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
import debug from '@/utils/debug';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const startTime = performance.now();

      try {
        debug.log('🔐 OAuth 콜백 페이지 로드...');
        debug.log(
          '⚡ Supabase가 자동으로 PKCE 처리합니다 (detectSessionInUrl: true)'
        );
        debug.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          isVercel: window.location.origin.includes('vercel.app'),
        });

        // URL에서 에러 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
          debug.error('❌ OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          const _errorMessage = errorDescription || error;

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

        debug.log('🔑 Supabase 자동 PKCE 처리 대기 중...');

        // 쿠키 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=/main; path=/; max-age=60; SameSite=Lax`;

        // Supabase가 URL에서 코드를 감지하고 처리할 시간 증가 (Vercel 환경 대응)
        const isVercel = window.location.origin.includes('vercel.app');
        const initialWait = isVercel ? 2000 : 1500; // Vercel에서 더 긴 대기
        await new Promise((resolve) => setTimeout(resolve, initialWait));

        // 세션 확인 (개선된 재시도 로직 - 점진적 대기 시간)
        let session = null;
        let sessionError = null;
        let attempts = 0;
        const maxAttempts = 7; // 더 많은 재시도 (최대 7회)

        do {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          sessionError = result.error;

          if (!session && attempts < maxAttempts - 1) {
            const retryDelay = Math.min(1000 + (attempts * 500), 3000); // 점진적 증가 (1초→1.5초→2초→2.5초→3초)
            debug.log(`🔄 세션 확인 재시도 ${attempts + 1}/${maxAttempts} (${retryDelay}ms 대기)`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          attempts++;
        } while (!session && !sessionError && attempts < maxAttempts);

        debug.log('📊 세션 상태:', {
          hasSession: !!session,
          sessionError: sessionError?.message,
          user: session?.user?.email,
          attempts,
        });

        if (session?.user) {
          debug.log('✅ 세션 확인됨:', session.user.email);
          debug.log(
            `⏱️ 콜백 처리 시간: ${(performance.now() - startTime).toFixed(0)}ms`
          );

          // auth_verified 쿠키 설정 (Vercel HTTPS 환경 대응)
          const isProduction = window.location.protocol === 'https:';
          document.cookie = `auth_verified=true; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${isProduction ? '; Secure' : ''}`;

          // 바로 메인으로 이동
          debug.log('🚀 메인 페이지로 이동!');

          // 세션 완전 설정 대기 (환경별 최적화)
          const sessionWait = isVercel ? 1500 : 1000; // Vercel에서 더 긴 대기
          await new Promise((resolve) => setTimeout(resolve, sessionWait));

          // 세션 쿠키 설정 확인 및 검증
          const cookies = document.cookie.split(';').map((c) => c.trim());
          const hasAuthToken = cookies.some(
            (c) => c.startsWith('sb-') && c.includes('auth-token')
          );
          
          // 추가 세션 유효성 검증
          const finalSessionCheck = await supabase.auth.getSession();
          const sessionValid = !!finalSessionCheck.data.session?.access_token;
          
          debug.log('🍪 세션 완전성 검증:', {
            hasAuthToken,
            sessionValid,
            userId: finalSessionCheck.data.session?.user?.id,
            environment: isVercel ? 'Vercel' : 'Local'
          });

          // 검증 통과 후 리다이렉트
          if (hasAuthToken && sessionValid) {
            window.location.href = '/main';
          } else {
            debug.log('⚠️ 세션 검증 실패 - 추가 대기 후 리다이렉트');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            window.location.href = '/main'; // 실패해도 진행 (클라이언트에서 재처리)
          }
        } else {
          // 세션이 없는 경우
          if (sessionError) {
            debug.error('❌ 세션 에러:', sessionError.message);

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
            debug.log('⏳ PKCE 처리 중, 최종 재시도...');

            // 최종 재시도 대기 시간 (환경별 최적화)
            const finalRetryWait = isVercel ? 4000 : 3000; // 더 긴 대기 시간
            await new Promise((resolve) => setTimeout(resolve, finalRetryWait));

            // 최종 세션 확인 (더 엄격한 검증)
            const finalCheck = await supabase.auth.getSession();
            const finalSession = finalCheck.data.session;
            
            debug.log('🔍 최종 세션 검증:', {
              hasSession: !!finalSession,
              hasAccessToken: !!finalSession?.access_token,
              hasUser: !!finalSession?.user?.id,
              userEmail: finalSession?.user?.email,
              expiresAt: finalSession?.expires_at
            });
            
            if (finalSession?.access_token && finalSession?.user) {
              debug.log('✅ 최종 세션 검증 성공!');
              
              // 세션 유효성 재확인 후 리다이렉트
              await new Promise((resolve) => setTimeout(resolve, 500));
              window.location.href = '/main';
            } else {
              debug.log('⚠️ 최종 세션 생성 실패 - 관리자 모드 안내');
              router.push('/login?error=session_timeout&message=' + 
                encodeURIComponent('세션 생성 시간 초과. 관리자 모드(4231)를 이용하거나 다시 시도해주세요.'));
            }
          }
        }
      } catch (error) {
        debug.error('❌ OAuth 콜백 처리 오류:', error);
        router.push('/login?error=callback_failed');
      }
    };

    void handleCallback();
  }, [router]); // router 함수 의존성 복구

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
