/**
 * 🔐 Supabase Auth 콜백 페이지
 * 
 * GitHub OAuth 리다이렉트 처리
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuthCallback } from '@/lib/supabase-auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔄 Auth 콜백 처리 중...');
      
      const { session, error } = await handleAuthCallback();
      
      if (error) {
        console.error('❌ Auth 콜백 에러:', error);
        router.push('/login?error=auth_callback_failed');
        return;
      }

      if (session) {
        console.log('✅ Auth 콜백 성공, 홈으로 이동');
        router.push('/');
      } else {
        console.warn('⚠️ 세션 없음, 로그인 페이지로 이동');
        router.push('/login');
      }
    };

    processCallback();
  }, [router]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='w-8 h-8 animate-spin text-white mx-auto mb-4' />
        <p className='text-white text-lg'>인증 처리 중...</p>
        <p className='text-gray-400 text-sm mt-2'>잠시만 기다려주세요</p>
      </div>
    </div>
  );
}