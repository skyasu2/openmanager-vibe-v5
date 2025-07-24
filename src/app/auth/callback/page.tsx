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
      try {
        console.log('🔐 OAuth 콜백 처리 시작...');

        // URL에서 code 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          console.error('❌ OAuth 코드가 없습니다');
          router.push('/login?error=no_code');
          return;
        }

        console.log('🔑 OAuth 코드 확인됨');

        // 미들웨어가 처리할 시간을 주되, 너무 오래 기다리지 않음
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 세션 확인 (여러 번 시도)
        let session = null;
        let attempts = 0;
        const maxAttempts = 8;

        while (!session && attempts < maxAttempts) {
          // getSession과 getUser 둘 다 시도
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData.session;

          if (!session) {
            // getUser로도 시도 (토큰 갱신 유도)
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              // 사용자가 있으면 세션 다시 확인
              const { data: retrySession } = await supabase.auth.getSession();
              session = retrySession.session;
            }
          }

          if (!session && attempts < maxAttempts - 1) {
            console.log(`🔄 세션 확인 재시도 ${attempts + 1}/${maxAttempts}`);

            // 중간에 세션 새로고침 시도
            if (attempts === 3) {
              console.log('🔄 세션 새로고침 시도...');
              try {
                await supabase.auth.refreshSession();
              } catch (refreshError) {
                console.warn('⚠️ 세션 새로고침 실패:', refreshError);
              }
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          attempts++;
        }

        if (!session) {
          console.error('❌ 세션 생성 실패 - 미들웨어 처리 문제일 수 있습니다');

          // 마지막으로 한 번 더 미들웨어가 처리하도록 페이지 새로고침
          console.log('🔄 페이지 새로고침으로 미들웨어 재실행 유도');
          window.location.reload();
          return;
        }

        console.log('✅ OAuth 세션 확인됨:', session.user?.email);

        // 성공 페이지로 리다이렉트
        router.push('/auth/success');
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
