/**
 * 🔐 Supabase Auth 콜백 페이지
 * 
 * GitHub OAuth 리다이렉트 처리
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuthCallback, type AuthCallbackResult } from '@/lib/supabase-auth';
import { Loader2 } from 'lucide-react';

/**
 * 에러 객체가 message 속성을 가지고 있는지 확인하는 타입 가드
 */
function hasMessage(error: any): error is { message: string } {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string';
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔄 Auth 콜백 처리 중...');
      
      try {
        const { session, error } = await handleAuthCallback();
        
        if (error) {
          console.error('❌ Auth 콜백 에러:', error);
          
          // 에러 타입에 따른 상세 처리 (타입 가드 사용)
          if (hasMessage(error)) {
            if (error.message.includes('Invalid code')) {
              router.push('/login?error=invalid_code&message=인증 코드가 유효하지 않습니다');
            } else if (error.message.includes('provider')) {
              router.push('/login?error=provider_error&message=GitHub OAuth 설정을 확인해주세요');
            } else {
              router.push('/login?error=auth_callback_failed&message=인증 처리 중 오류가 발생했습니다');
            }
          } else {
            // message 속성이 없는 에러의 경우
            router.push('/login?error=auth_callback_failed&message=인증 처리 중 예상치 못한 오류가 발생했습니다');
          }
          return;
        }

        if (session) {
          console.log('✅ Auth 콜백 성공:', session.user.email);
          
          // URL에서 리다이렉트 경로 확인
          const searchParams = new URLSearchParams(window.location.search);
          const redirectTo = searchParams.get('redirect') || '/';
          
          console.log('🔄 리다이렉트:', redirectTo);
          router.push(redirectTo);
        } else {
          console.warn('⚠️ 세션 없음, 로그인 페이지로 이동');
          router.push('/login?warning=no_session');
        }
      } catch (unexpectedError) {
        console.error('💥 예상치 못한 콜백 에러:', unexpectedError);
        router.push('/login?error=unexpected_error&message=예상치 못한 오류가 발생했습니다');
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