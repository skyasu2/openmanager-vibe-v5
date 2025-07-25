/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * PKCE를 지원하는 클라이언트 사이드 OAuth 콜백 처리
 * Supabase가 자동으로 code_verifier를 처리합니다
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

        // URL에서 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('❌ OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          router.push(`/login?error=${error}&description=${errorDescription}`);
          return;
        }

        if (!code) {
          console.error('❌ OAuth 코드가 없습니다');
          router.push('/login?error=no_code');
          return;
        }

        console.log('🔑 OAuth 코드 확인됨, 미들웨어가 처리 중...');

        // 쿠키 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=/main; path=/; max-age=60; SameSite=Lax`;

        // 미들웨어가 세션을 처리할 시간을 주기 위해 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 500));

        // 세션 확인 (미들웨어가 이미 처리했는지 확인)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log('📊 세션 상태:', {
          hasSession: !!session,
          sessionError: sessionError?.message,
          user: session?.user?.email,
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
          // 세션이 없으면 success 페이지로 이동 (추가 처리 필요)
          console.log('⏳ 세션 미확인, success 페이지로 이동...');
          router.push('/auth/success');
        }
      } catch (error) {
        console.error('❌ OAuth 콜백 처리 오류:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
      <div className='text-center'>
        <div className='mb-8'>
          <Loader2 className='w-16 h-16 text-blue-500 animate-spin mx-auto' />
        </div>
        <h1 className='text-2xl font-bold text-white mb-2'>인증 처리 중...</h1>
        <p className='text-gray-400'>잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
