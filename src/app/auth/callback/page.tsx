/**
 * 🔐 OAuth 콜백 페이지
 *
 * GitHub OAuth 후 Supabase가 이 페이지로 리다이렉트합니다.
 * 클라이언트 사이드에서 세션을 처리하여 싱글톤 문제를 해결합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 코드 추출
        const code = searchParams?.get('code');
        const redirect = searchParams?.get('redirect') || '/main';

        console.log('🔐 OAuth 콜백 처리:', {
          code: code ? 'exists' : 'missing',
          redirect,
          url: window.location.href,
        });

        if (!code) {
          setError('인증 코드가 없습니다');
          setTimeout(() => router.push('/login?error=no_code'), 2000);
          return;
        }

        // Supabase가 자동으로 URL의 코드를 감지하고 세션을 설정합니다
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ 세션 가져오기 실패:', sessionError);
          setError('세션 처리 실패');
          setTimeout(() => router.push('/login?error=session_failed'), 2000);
          return;
        }

        if (!session) {
          // 세션이 없으면 잠시 기다렸다가 다시 확인
          console.log('⏳ 세션 대기 중...');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();
          if (!retrySession) {
            setError('세션 생성 실패');
            setTimeout(() => router.push('/login?error=no_session'), 2000);
            return;
          }
        }

        console.log('✅ OAuth 인증 성공:', {
          userId: session?.user?.id,
          email: session?.user?.email,
          provider: session?.user?.app_metadata?.provider,
        });

        // 성공적으로 로그인되면 리다이렉트
        router.push(redirect);
      } catch (error) {
        console.error('❌ 콜백 처리 오류:', error);
        setError('예상치 못한 오류가 발생했습니다');
        setTimeout(() => router.push('/login?error=callback_error'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
      <div className='text-center'>
        <div className='mb-8'>
          <Loader2 className='w-16 h-16 text-blue-500 animate-spin mx-auto' />
        </div>
        <h1 className='text-2xl font-bold text-white mb-2'>
          {error ? '오류 발생' : '인증 처리 중...'}
        </h1>
        <p className='text-gray-400'>{error || '잠시만 기다려주세요'}</p>
      </div>
    </div>
  );
}
