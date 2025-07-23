/**
 * 🎉 OAuth 인증 성공 페이지
 *
 * OAuth 콜백 후 세션이 안정화될 때까지 대기하는 중간 페이지입니다.
 * 세션 확인 후 자동으로 메인 페이지로 이동합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function AuthSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>(
    'checking'
  );

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        console.log('🎉 인증 성공 페이지 - 세션 확인 중...');

        // 세션 안정화 대기
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 세션 확인
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ 세션 확인 오류:', error);
          setStatus('error');
          setTimeout(
            () => router.push('/login?error=session_check_failed'),
            2000
          );
          return;
        }

        if (!session) {
          console.log('⏳ 세션 대기 중... 재시도');
          // 한 번 더 시도
          await new Promise(resolve => setTimeout(resolve, 2000));

          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();

          if (!retrySession) {
            console.error('❌ 세션을 찾을 수 없습니다');
            setStatus('error');
            setTimeout(() => router.push('/login?error=no_session'), 2000);
            return;
          }
        }

        console.log('✅ 세션 확인 완료:', session?.user?.email);
        setStatus('success');

        // 라우터 캐시 갱신
        router.refresh();

        // 세션 저장 목적지 확인
        const redirectTo =
          sessionStorage.getItem('auth_redirect_to') || '/main';
        sessionStorage.removeItem('auth_redirect_to');

        console.log('🚀 리다이렉트:', redirectTo);

        // 약간의 지연 후 리다이렉트 (UI 피드백용)
        setTimeout(() => {
          // window.location을 사용하여 완전한 페이지 새로고침
          window.location.href = redirectTo;
        }, 1500);
      } catch (error) {
        console.error('❌ 예상치 못한 오류:', error);
        setStatus('error');
        setTimeout(() => router.push('/login?error=unexpected'), 3000);
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
      <div className='text-center'>
        <div className='mb-8'>
          {status === 'checking' && (
            <Loader2 className='w-16 h-16 text-blue-500 animate-spin mx-auto' />
          )}
          {status === 'success' && (
            <CheckCircle className='w-16 h-16 text-green-500 mx-auto animate-bounce' />
          )}
          {status === 'error' && (
            <div className='w-16 h-16 text-red-500 mx-auto'>❌</div>
          )}
        </div>

        <h1 className='text-2xl font-bold text-white mb-2'>
          {status === 'checking' && '인증 확인 중...'}
          {status === 'success' && '인증 성공!'}
          {status === 'error' && '오류 발생'}
        </h1>

        <p className='text-gray-400'>
          {status === 'checking' && '잠시만 기다려주세요'}
          {status === 'success' && '메인 페이지로 이동합니다'}
          {status === 'error' && '다시 시도해주세요'}
        </p>

        {status === 'success' && (
          <div className='mt-4'>
            <div className='inline-flex items-center gap-2 text-sm text-gray-500'>
              <Loader2 className='w-4 h-4 animate-spin' />
              리다이렉트 중...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
