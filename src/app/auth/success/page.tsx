/**
 * 🎉 OAuth 인증 성공 페이지
 *
 * OAuth 콜백 후 세션이 안정화될 때까지 대기하는 중간 페이지입니다.
 * 세션 확인 후 자동으로 메인 페이지로 이동합니다.
 */

'use client';

import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

        // Vercel 환경 감지 (더 정확한 방법)
        const isVercel =
          window.location.hostname.includes('vercel.app') ||
          window.location.hostname.includes('.vercel.app') ||
          process.env.VERCEL === '1' ||
          process.env.VERCEL_ENV !== undefined;
        console.log('🌍 환경:', {
          isVercel,
          hostname: window.location.hostname,
          vercelEnv: process.env.VERCEL_ENV,
          origin: window.location.origin,
        });

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

        // 🔐 보안 강화: getUser()로 세션 검증 (최대 5회 재시도)
        let user = null;
        let session = null;
        let error = null;
        const maxRetries = isVercel ? 5 : 3;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          // 먼저 세션 확인 (쿠키 기반)
          const sessionResult = await supabase.auth.getSession();
          session = sessionResult.data.session;

          if (session) {
            // 세션이 있으면 getUser()로 검증
            const userResult = await supabase.auth.getUser();
            user = userResult.data.user;
            error = userResult.error;

            if (user && !error) {
              console.log(
                `✅ 사용자 검증 성공 (시도 ${attempt + 1}/${maxRetries})`
              );
              break;
            }
          }

          if (attempt < maxRetries - 1) {
            console.log(
              `⏳ 세션 대기 중... (시도 ${attempt + 1}/${maxRetries})`
            );
            setRetryCount(attempt + 1);

            // Vercel에서는 더 긴 대기
            const retryWait = isVercel ? 2500 : 1500;
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

        if (!user || !session) {
          console.error('❌ 사용자 인증 실패');
          setStatus('error');
          setTimeout(() => router.push('/login?error=no_user'), 2000);
          return;
        }

        console.log('✅ 사용자 인증 완료:', user.email);
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

        // 🍪 쿠키에 인증 상태 표시 (미들웨어에서 확인용)
        document.cookie = `auth_redirect_to=${encodeURIComponent(redirectTo)}; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;

        // 🔧 Vercel에서는 더 긴 대기 시간 (쿠키 전파 보장)
        const cookieWait = isVercel ? 6000 : 2500;
        console.log(`⏳ 쿠키 동기화 대기 중... (${cookieWait}ms)`);
        await new Promise(resolve => setTimeout(resolve, cookieWait));

        // Vercel 환경에서 추가 세션 새로고침
        if (isVercel) {
          console.log('🔄 Vercel 환경 - 추가 세션 새로고침');
          await supabase.auth.refreshSession();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

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

        // 최종 사용자 검증 (getUser()로 확실한 검증)
        const finalUserCheck = await supabase.auth.getUser();
        if (!finalUserCheck.data.user) {
          console.error('❌ 최종 사용자 검증 실패');
          setStatus('error');
          setTimeout(
            () => router.push('/login?error=final_check_failed'),
            2000
          );
          return;
        }

        console.log(
          '✅ 최종 사용자 검증 성공:',
          finalUserCheck.data.user.email
        );

        // 🔧 Vercel 환경에서 더 안정적인 리다이렉트 방법
        console.log('🔄 리다이렉트 실행:', redirectTo);

        // 쿠키 정리
        document.cookie = 'auth_in_progress=; path=/; max-age=0';

        if (isVercel) {
          // Vercel에서는 window.location.replace 사용 (히스토리 스택 교체)
          console.log('🌍 Vercel 환경 - window.location.replace 사용');
          window.location.replace(redirectTo);
        } else {
          // 로컬에서는 기존 방식 유지
          console.log('🏠 로컬 환경 - window.location.href 사용');
          window.location.href = redirectTo;
        }
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
