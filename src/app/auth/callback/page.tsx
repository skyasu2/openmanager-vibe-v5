/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * URL에서 authorization code를 받아 클라이언트 측에서 PKCE 코드 교환을 수행합니다.
 * @supabase/ssr의 createBrowserClient는 localStorage에 code_verifier를 저장하므로
 * 클라이언트 측에서만 코드 교환이 가능합니다.
 */

'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

type Status = 'loading' | 'exchanging' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('인증 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 OAuth 콜백 페이지 로드');
        console.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        });

        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorMessage =
          urlParams.get('message') || urlParams.get('error_description');

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

        // 코드가 없으면 로그인 페이지로
        if (!code) {
          console.log('⚠️ 코드 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }

        // 🔐 클라이언트 측 PKCE 코드 교환
        setStatus('exchanging');
        setMessage('인증 코드 교환 중...');
        console.log('🔑 PKCE 코드 교환 시작 (클라이언트 측)...');

        const supabase = getSupabase();
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ 코드 교환 실패:', exchangeError.message);
          setStatus('error');

          let userMessage = '인증 코드 교환에 실패했습니다.';
          if (
            exchangeError.message.includes('invalid_grant') ||
            exchangeError.message.includes('expired')
          ) {
            userMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
          } else if (exchangeError.message.includes('code_verifier')) {
            userMessage = 'PKCE 검증에 실패했습니다. 다시 로그인해주세요.';
          }

          setMessage(userMessage);
          setTimeout(() => {
            router.push(
              `/login?error=exchange_failed&message=${encodeURIComponent(userMessage)}`
            );
          }, 2000);
          return;
        }

        if (!data.session) {
          console.error('❌ 세션 생성 실패: 세션이 null');
          setStatus('error');
          setMessage('세션 생성에 실패했습니다.');
          setTimeout(() => {
            router.push('/login?error=no_session');
          }, 2000);
          return;
        }

        // 성공!
        console.log('✅ OAuth 로그인 성공:', {
          userId: data.session.user.id,
          email: data.session.user.email,
          provider: data.session.user.app_metadata?.provider,
        });

        setStatus('success');
        setMessage('로그인 성공! 리다이렉트 중...');

        // 게스트 데이터 정리
        cleanupGuestData();

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

        // 리다이렉트
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          {(status === 'loading' || status === 'exchanging') && (
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
          {status === 'exchanging' && '코드 교환 중...'}
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
