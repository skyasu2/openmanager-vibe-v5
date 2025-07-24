/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * PKCE를 지원하는 클라이언트 사이드 OAuth 콜백 처리
 * Supabase가 자동으로 code_verifier를 처리합니다
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase SSR이 미들웨어에서 PKCE를 자동으로 처리합니다
        // exchangeCodeForSession을 호출할 필요가 없습니다

        // 잠시 대기하여 미들웨어 처리가 완료되도록 함
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 세션 확인
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.error('❌ 세션이 아직 생성되지 않음');
          // 조금 더 기다린 후 재시도
          await new Promise(resolve => setTimeout(resolve, 2000));

          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();

          if (!retrySession) {
            console.error('❌ 세션 생성 실패');
            router.push('/login?error=no_session');
            return;
          }
        }

        console.log('✅ OAuth 세션 확인됨:', session?.user?.email);

        // 성공 페이지로 리다이렉트
        router.push('/auth/success');
      } catch (error) {
        console.error('❌ 예상치 못한 오류:', error);
        router.push('/login?error=unexpected');
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
