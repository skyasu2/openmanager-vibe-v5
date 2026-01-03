/**
 * 🔐 OAuth 콜백 페이지 (Implicit Flow)
 *
 * Implicit 플로우에서는 토큰이 URL hash로 전달됩니다.
 * #access_token=xxx&refresh_token=xxx&... 형태
 */

'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

type Status = 'loading' | 'processing' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('인증 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 OAuth 콜백 페이지 로드 (Implicit Flow)');
        console.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash ? '(hash present)' : '(no hash)',
        });

        // URL hash에서 토큰 파싱 (Implicit Flow)
        const hash = window.location.hash.substring(1); // # 제거
        const hashParams = new URLSearchParams(hash);

        // URL query에서 에러 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error') || hashParams.get('error');
        const errorMessage =
          urlParams.get('message') ||
          urlParams.get('error_description') ||
          hashParams.get('error_description');

        // OAuth 에러 처리
        if (error) {
          console.error('❌ OAuth 에러:', error, errorMessage);
          setStatus('error');
          setMessage(errorMessage || '인증에 실패했습니다.');
          setTimeout(() => {
            router.push(
              `/login?error=${error}&message=${encodeURIComponent(errorMessage || '')}`
            );
          }, 2000);
          return;
        }

        // Implicit Flow: URL hash에서 토큰 확인
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          console.log(
            '🔑 Implicit Flow 토큰 감지 - Supabase 자동 처리 대기...'
          );
          setStatus('processing');
          setMessage('세션 설정 중...');

          const supabase = getSupabase();

          // Supabase가 자동으로 hash 토큰을 처리할 시간을 줌
          // detectSessionInUrl: true 설정으로 자동 처리됨
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 세션 확인 (최대 5초 대기)
          let session = null;
          for (let i = 0; i < 10; i++) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.getSession();

            if (sessionError) {
              console.error('❌ 세션 확인 에러:', sessionError.message);
            }

            if (sessionData.session) {
              session = sessionData.session;
              break;
            }

            console.log(`  세션 대기 ${i + 1}/10...`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          if (!session) {
            console.error('❌ 세션 생성 실패');
            setStatus('error');
            setMessage('세션 설정에 실패했습니다. 다시 로그인해주세요.');
            setTimeout(() => {
              router.push('/login?error=session_failed');
            }, 2000);
            return;
          }

          // 성공!
          console.log('✅ OAuth 로그인 성공 (Implicit Flow):', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
          });

          setStatus('success');
          setMessage('로그인 성공! 리다이렉트 중...');

          // URL hash 제거 (보안)
          window.history.replaceState(null, '', window.location.pathname);

          // 게스트 데이터 정리
          cleanupGuestData();

          // 리다이렉트
          setTimeout(() => {
            window.location.href = getRedirectUrl();
          }, 500);
          return;
        }

        // PKCE Flow fallback: code가 있는 경우 (이전 방식)
        const code = urlParams.get('code');
        if (code) {
          console.log('🔑 Authorization Code 감지 (PKCE fallback)');
          setStatus('processing');
          setMessage('인증 코드 교환 중...');

          const supabase = getSupabase();

          // 세션 자동 감지 대기 (최대 5초)
          let session = null;
          for (let i = 0; i < 10; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              session = sessionData.session;
              break;
            }
            console.log(`  세션 확인 ${i + 1}/10...`);
          }

          if (session) {
            console.log('✅ 세션 감지 성공:', {
              userId: session.user.id,
              email: session.user.email,
            });

            setStatus('success');
            setMessage('로그인 성공! 리다이렉트 중...');
            cleanupGuestData();

            setTimeout(() => {
              window.location.href = getRedirectUrl();
            }, 500);
            return;
          }

          // 세션 없음 - 에러
          console.error('❌ 세션 감지 실패');
          setStatus('error');
          setMessage('인증에 실패했습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            router.push('/login?error=session_timeout');
          }, 2000);
          return;
        }

        // 토큰도 코드도 없음 - 로그인 페이지로
        console.log('⚠️ 인증 정보 없음 - 로그인 페이지로 이동');
        router.push('/login');
      } catch (error) {
        console.error('❌ 콜백 처리 예외:', error);
        setStatus('error');
        setMessage('예상치 못한 오류가 발생했습니다.');
        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 2000);
      }
    };

    void handleCallback();
  }, [router]);

  /**
   * 저장된 리다이렉트 목적지 확인
   */
  function getRedirectUrl(): string {
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
    return redirectTo;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          {(status === 'loading' || status === 'processing') && (
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-500" />
          )}
          {status === 'success' && (
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          {status === 'loading' && '인증 처리 중...'}
          {status === 'processing' && '세션 설정 중...'}
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
    const isProduction = window.location.protocol === 'https:';
    const secureFlag = isProduction ? '; Secure' : '';

    document.cookie = `guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
    document.cookie = `auth_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
    document.cookie = `auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;

    localStorage.removeItem('auth_type');
    localStorage.removeItem('auth_session_id');
    localStorage.removeItem('auth_user');

    console.log('✅ 게스트 데이터 정리 완료');
  } catch (error) {
    console.warn('게스트 데이터 정리 실패:', error);
  }
}
