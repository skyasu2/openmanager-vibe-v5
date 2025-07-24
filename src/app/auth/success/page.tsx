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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        console.log('🎉 인증 성공 페이지 - 세션 확인 중...');

        // Vercel 환경 감지
        const isVercel = window.location.hostname.includes('vercel.app');
        console.log('🌍 환경:', isVercel ? 'Vercel' : 'Local');

        // Vercel 환경에서는 더 긴 대기 시간
        const initialWait = isVercel ? 4000 : 2500;
        await new Promise(resolve => setTimeout(resolve, initialWait));

        // 세션 새로고침 여러 번 시도
        console.log('🔄 세션 새로고침 시도...');
        for (let i = 0; i < 3; i++) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            console.log(`✅ 세션 새로고침 성공 (시도 ${i + 1})`);
            break;
          }
          console.warn(`⚠️ 세션 새로고침 실패 ${i + 1}/3:`, refreshError);
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 추가 대기 후 세션 확인
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 세션 확인 (최대 5회 재시도)
        let session = null;
        let error = null;
        const maxRetries = isVercel ? 7 : 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          error = result.error;

          if (session) {
            console.log(
              `✅ 세션 확인 성공 (시도 ${attempt + 1}/${maxRetries})`
            );
            break;
          }

          if (attempt < maxRetries - 1) {
            console.log(
              `⏳ 세션 대기 중... (시도 ${attempt + 1}/${maxRetries})`
            );
            setRetryCount(attempt + 1);

            // Vercel에서는 더 긴 대기
            const retryWait = isVercel ? 2000 : 1500;
            await new Promise(resolve => setTimeout(resolve, retryWait));

            // 중간에 한 번 더 새로고침 시도
            if (attempt === Math.floor(maxRetries / 2)) {
              await supabase.auth.refreshSession();
            }
          }
        }

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
          console.error('❌ 세션을 찾을 수 없습니다');
          setStatus('error');
          setTimeout(() => router.push('/login?error=no_session'), 2000);
          return;
        }

        console.log('✅ 세션 확인 완료:', session.user.email);
        setStatus('success');

        // 라우터 캐시 갱신 여러 번
        for (let i = 0; i < 3; i++) {
          router.refresh();
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 세션 저장 목적지 확인
        const redirectTo =
          sessionStorage.getItem('auth_redirect_to') || '/main';
        sessionStorage.removeItem('auth_redirect_to');

        console.log('🚀 리다이렉트:', redirectTo);

        // 🔧 Vercel에서는 더 긴 대기 시간
        const cookieWait = isVercel ? 4000 : 2000;
        console.log(`⏳ 쿠키 동기화 대기 중... (${cookieWait}ms)`);
        await new Promise(resolve => setTimeout(resolve, cookieWait));

        // 쿠키 상태 확인 로그
        const cookies = document.cookie;
        console.log('🍪 리다이렉트 전 쿠키 상태:', {
          hasCookies: cookies.length > 0,
          cookieCount: cookies.split(';').length,
          supabaseCookies: cookies
            .split(';')
            .filter(c => c.includes('supabase')).length,
          environment: isVercel ? 'Vercel' : 'Local',
        });

        // 최종 세션 확인
        const finalCheck = await supabase.auth.getSession();
        if (!finalCheck.data.session) {
          console.error('❌ 최종 세션 확인 실패');
          setStatus('error');
          setTimeout(
            () => router.push('/login?error=final_check_failed'),
            2000
          );
          return;
        }

        // window.location을 사용하여 완전한 페이지 새로고침
        console.log('🔄 완전한 페이지 새로고침으로 리다이렉트 실행');
        window.location.href = redirectTo;
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

        {status === 'checking' && retryCount > 0 && (
          <div className='mt-4'>
            <p className='text-sm text-gray-500'>
              세션 확인 중... (재시도 {retryCount}회)
            </p>
          </div>
        )}

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
