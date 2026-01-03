/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * Supabase가 detectSessionInUrl: true 설정으로 자동으로 코드 교환을 수행합니다.
 * 이 페이지는 세션이 설정될 때까지 대기하고 결과를 표시합니다.
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

        // 🔐 Supabase 클라이언트 초기화 - detectSessionInUrl이 자동으로 코드 교환 수행
        setStatus('exchanging');
        setMessage('인증 코드 교환 중...');
        console.log('🔑 PKCE 코드 교환 시작...');

        // 디버깅: localStorage에서 PKCE 관련 키 확인
        const allKeys = Object.keys(localStorage);
        const pkceKeys = allKeys.filter(
          (k) =>
            k.includes('code_verifier') ||
            k.includes('pkce') ||
            k.startsWith('sb-')
        );
        console.log('🔍 localStorage PKCE 관련 키:', pkceKeys);
        pkceKeys.forEach((k) => {
          const value = localStorage.getItem(k);
          console.log(
            `  ${k}:`,
            value?.substring(0, 50) + (value && value.length > 50 ? '...' : '')
          );
        });

        const supabase = getSupabase();

        // 방법 1: 수동 코드 교환 시도
        console.log('🔄 수동 코드 교환 시도...');
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ 수동 코드 교환 실패:', exchangeError.message);

          // 방법 2: 세션 자동 감지 대기
          console.log('🔄 세션 자동 감지 대기 중...');

          // 최대 5초 동안 세션 확인
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

          if (!session) {
            // 에러 메시지 표시
            let userMessage = '인증 코드 교환에 실패했습니다.';
            if (
              exchangeError.message.includes('invalid_grant') ||
              exchangeError.message.includes('expired')
            ) {
              userMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
            } else if (exchangeError.message.includes('code_verifier')) {
              userMessage = 'PKCE 검증에 실패했습니다. 다시 로그인해주세요.';
            }

            setStatus('error');
            setMessage(userMessage);
            setTimeout(() => {
              router.push(
                `/login?error=exchange_failed&message=${encodeURIComponent(userMessage)}`
              );
            }, 2000);
            return;
          }

          // 자동 감지로 세션 획득 성공
          console.log('✅ 자동 세션 감지 성공:', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
          });

          setStatus('success');
          setMessage('로그인 성공! 리다이렉트 중...');
          cleanupGuestData();

          setTimeout(() => {
            window.location.href = getRedirectUrl();
          }, 500);
          return;
        }

        if (!exchangeData.session) {
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
          userId: exchangeData.session.user.id,
          email: exchangeData.session.user.email,
          provider: exchangeData.session.user.app_metadata?.provider,
        });

        setStatus('success');
        setMessage('로그인 성공! 리다이렉트 중...');

        // 게스트 데이터 정리
        cleanupGuestData();

        // 리다이렉트
        setTimeout(() => {
          window.location.href = getRedirectUrl();
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
