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
        console.log('⚡ 미들웨어가 PKCE 처리를 담당합니다');

        // URL에서 에러 파라미터만 확인 (미들웨어가 PKCE를 이미 처리했으므로 code 검증 불필요)
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
          console.error('❌ OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          router.push(`/login?error=${error}&description=${errorDescription}`);
          return;
        }

        console.log('🔑 미들웨어가 PKCE 처리 완료, 세션 확인 중...');

        // 쿠키 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=/main; path=/; max-age=60; SameSite=Lax`;

        // 미들웨어가 PKCE 세션 처리할 시간을 충분히 대기
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 미들웨어가 처리한 세션 확인 (재시도 로직 포함)
        let session = null;
        let sessionError = null;
        let attempts = 0;
        const maxAttempts = 3;

        do {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          sessionError = result.error;

          if (!session && attempts < maxAttempts - 1) {
            console.log(`🔄 세션 확인 재시도 ${attempts + 1}/${maxAttempts}`);
            await new Promise((resolve) => setTimeout(resolve, 500));
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

          // Phase 3 옵션: 바로 메인으로 가기
          const skipSuccessPage = true;

          if (skipSuccessPage) {
            console.log('🚀 Phase 3: success 페이지 건너뛰고 메인으로!');
            window.location.href = '/main';
          } else {
            router.push('/auth/success');
          }
        } else {
          // 미들웨어 PKCE 처리가 완료되지 않은 경우
          if (sessionError) {
            console.error('❌ 세션 에러:', sessionError.message);
            router.push(
              '/login?error=session_failed&message=' +
                encodeURIComponent(sessionError.message)
            );
          } else {
            console.log(
              '⏳ 미들웨어 PKCE 처리 미완료, success 페이지에서 추가 처리...'
            );
            router.push('/auth/success');
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
