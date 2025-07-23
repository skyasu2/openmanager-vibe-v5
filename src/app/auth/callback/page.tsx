/**
 * 🔐 OAuth 콜백 페이지
 *
 * GitHub OAuth 후 Supabase가 이 페이지로 리다이렉트합니다.
 * 클라이언트 사이드에서 세션을 처리하여 싱글톤 문제를 해결합니다.
 */

'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Helper function to check session with retries
async function checkSessionWithRetries(maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;

    if (i < maxAttempts - 1) {
      console.log(`❌ 최종 세션 확인 실패 - 재시도 ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return null;
}

// Helper function to perform redirect
function performRedirect(redirect: string, router: any) {
  console.log('🔄 window.location.replace로 리다이렉트 실행');
  window.location.replace(redirect);

  // 백업으로 router.push 시도
  setTimeout(() => {
    if (window.location.pathname === '/auth/callback') {
      console.log('🔄 백업: router.push 실행');
      router.push(redirect);
    }
  }, 2000);

  // 최종 폴백
  setTimeout(() => {
    console.log('🔄 최종 폴백: window.location.href 실행');
    window.location.href = redirect;
  }, 3000);
}

// eslint-disable-next-line max-lines-per-function
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 코드 추출
        const code = searchParams?.get('code');

        // 리다이렉트 URL 결정 (우선순위: 세션스토리지 > URL 파라미터 > 기본값)
        const sessionRedirect = sessionStorage.getItem('auth_redirect_to');
        const urlRedirect =
          searchParams?.get('redirectTo') || searchParams?.get('redirect');
        const finalRedirect = sessionRedirect || urlRedirect || '/main';

        // 세션스토리지에 최종 목적지 저장 (success 페이지에서 사용)
        if (finalRedirect !== '/main') {
          sessionStorage.setItem('auth_redirect_to', finalRedirect);
        }

        // 🔧 성공 페이지로 리다이렉트 (세션 안정화를 위해)
        const redirect = '/auth/success';

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

        // 세션이 완전히 저장될 때까지 충분히 대기
        console.log('⏳ 세션 저장 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 세션 강제 새로고침
        console.log('🔄 세션 강제 새로고침...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ 세션 새로고침 실패:', refreshError);
        } else {
          console.log('✅ 세션 새로고침 성공');
        }

        // 쿠키가 제대로 설정되었는지 확인
        const cookieStore = document.cookie;
        console.log('🍪 현재 쿠키:', cookieStore);

        // 라우터 캐시 새로고침 (쿠키 업데이트 반영)
        router.refresh();

        // 추가 대기 시간 (미들웨어가 세션을 인식할 수 있도록)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 최종 세션 확인 및 재시도 로직
        const finalSession = await checkSessionWithRetries();

        if (!finalSession) {
          console.error('❌ 세션 생성 최종 실패 - 로그인 페이지로 이동');
          setError('세션 생성에 실패했습니다. 다시 시도해주세요.');
          setTimeout(
            () => router.push('/login?error=session_creation_failed'),
            2000
          );
          return;
        }

        console.log('✅ 최종 세션 확인 성공:', finalSession.user.email);

        // 성공적으로 로그인되면 리다이렉트
        console.log('🔄 리다이렉트 시도:', redirect);

        // 미들웨어가 세션을 확실히 인식할 수 있도록 추가 대기
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 라우터 캐시 갱신
        console.log('🔄 라우터 캐시 갱신 중...');
        router.refresh();

        // 추가 대기 시간 (쿠키가 완전히 설정되도록)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 리다이렉트 수행
        try {
          performRedirect(redirect, router);
        } catch (redirectError) {
          console.error('❌ 리다이렉트 실패:', redirectError);
          setTimeout(() => {
            window.location.href = redirect;
          }, 3000);
        }
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

// Suspense boundary로 감싸서 useSearchParams 에러 해결
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center'>
          <div className='text-center'>
            <div className='mb-8'>
              <Loader2 className='w-16 h-16 text-blue-500 animate-spin mx-auto' />
            </div>
            <h1 className='text-2xl font-bold text-white mb-2'>로딩 중...</h1>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
