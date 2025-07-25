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

        // exchangeCodeForSession을 직접 호출하여 세션 생성
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ 코드 교환 실패:', error);
          router.push('/login?error=code_exchange_failed');
          return;
        }

        if (!data.session) {
          console.error('❌ 세션 생성 실패');
          router.push('/login?error=no_session');
          return;
        }

        console.log('✅ OAuth 세션 생성 성공:', data.session.user?.email);

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
