/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * 서버 측 Route Handler(route.ts)가 PKCE 코드 교환을 처리합니다.
 * 이 페이지는 세션 확인과 UI 표시만 담당합니다.
 *
 * 흐름:
 * 1. Google → /auth/callback?code=xxx (route.ts가 처리)
 * 2. route.ts에서 코드 교환 성공 → /main으로 리다이렉트
 * 3. route.ts에서 실패 → /login?error=xxx로 리다이렉트
 * 4. 직접 접근 또는 implicit flow → 이 페이지에서 처리
 */

'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import debug from '@/utils/debug';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('인증 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        debug.log('🔐 OAuth 콜백 페이지 로드');
        debug.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        });

        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorMessage = urlParams.get('message');

        // 에러 파라미터가 있으면 로그인 페이지로 (route.ts에서 리다이렉트됨)
        if (error) {
          debug.error('❌ OAuth 에러:', error, errorMessage);
          setStatus('error');
          setMessage(errorMessage || '인증에 실패했습니다.');

          // 2초 후 로그인 페이지로 이동
          setTimeout(() => {
            router.push(
              `/login?error=${error}&message=${encodeURIComponent(errorMessage || '')}`
            );
          }, 2000);
          return;
        }

        // 🔐 서버 측 route.ts가 이미 코드 교환을 처리했을 수 있음
        // 세션이 있는지 확인
        setMessage('세션 확인 중...');

        // 잠시 대기 (쿠키가 설정될 시간)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data, error: sessionError } =
          await getSupabase().auth.getSession();

        if (sessionError) {
          debug.error('❌ 세션 확인 에러:', sessionError.message);
          setStatus('error');
          setMessage('세션 확인에 실패했습니다.');

          setTimeout(() => {
            router.push(
              `/login?error=session_error&message=${encodeURIComponent(sessionError.message)}`
            );
          }, 2000);
          return;
        }

        if (data.session) {
          debug.log('✅ 세션 확인됨:', {
            userId: data.session.user.id,
            email: data.session.user.email,
          });

          setStatus('success');
          setMessage('로그인 성공! 리다이렉트 중...');

          // 저장된 리다이렉트 목적지 확인
          let redirectTo = '/main';
          try {
            const storedRedirect = sessionStorage.getItem('auth_redirect_to');
            if (storedRedirect) {
              redirectTo = storedRedirect;
              sessionStorage.removeItem('auth_redirect_to');
            }
          } catch {
            // sessionStorage 접근 실패 무시
          }

          // 게스트 데이터 정리
          cleanupGuestData();

          // 리다이렉트
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 500);
          return;
        }

        // 세션이 없고, URL에 code도 없는 경우 - 직접 접근
        const hasCode = urlParams.get('code');
        if (!hasCode) {
          debug.log('⚠️ 코드 없음, 세션 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }

        // 서버 측에서 처리되지 않은 code가 있는 경우 (드문 경우)
        debug.log('⏳ 서버 처리 대기 중... (재시도)');
        setMessage('인증 완료 대기 중...');

        // 추가 대기 후 재확인
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const finalCheck = await getSupabase().auth.getSession();
        if (finalCheck.data.session) {
          setStatus('success');
          setMessage('로그인 성공!');
          cleanupGuestData();
          window.location.href = '/main';
        } else {
          debug.error('❌ 최종 세션 확인 실패');
          setStatus('error');
          setMessage('세션 생성에 실패했습니다. 다시 로그인해주세요.');

          setTimeout(() => {
            router.push(
              '/login?error=session_timeout&message=' +
                encodeURIComponent('세션 생성에 실패했습니다.')
            );
          }, 2000);
        }
      } catch (error) {
        debug.error('❌ 콜백 처리 예외:', error);
        setStatus('error');
        setMessage('예상치 못한 오류가 발생했습니다.');

        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 2000);
      }
    };

    void handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          {status === 'loading' && (
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-500" />
          )}
          {status === 'success' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-10 w-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          {status === 'loading' && '인증 처리 중...'}
          {status === 'success' && '로그인 성공!'}
          {status === 'error' && '오류 발생'}
        </h1>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * 게스트 세션 데이터 정리
 */
function cleanupGuestData() {
  try {
    // 쿠키 정리
    const isProduction = window.location.protocol === 'https:';
    const secureFlag = isProduction ? '; Secure' : '';

    document.cookie = `guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
    document.cookie = `auth_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
    document.cookie = `auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;

    // localStorage 정리
    localStorage.removeItem('auth_type');
    localStorage.removeItem('auth_session_id');
    localStorage.removeItem('auth_user');

    debug.log('✅ 게스트 데이터 정리 완료');
  } catch (error) {
    debug.warn('게스트 데이터 정리 실패:', error);
  }
}
