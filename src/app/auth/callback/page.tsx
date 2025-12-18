/**
 * 🔐 OAuth 콜백 페이지 (클라이언트 컴포넌트)
 *
 * 미들웨어가 PKCE 플로우를 완전히 처리한 후 세션 확인
 * URL code 파라미터 검증 없이 세션 상태만 확인하여 타이밍 이슈 해결
 */

'use client';

// Force dynamic rendering - this page uses browser APIs (window, document, localStorage)
// and handles OAuth callbacks at runtime, cannot be statically generated
export const dynamic = 'force-dynamic';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import debug from '@/utils/debug';

/**
 * 🔧 Supabase 프로젝트 ID 동적 추출
 */
function getSupabaseStorageKey(suffix: string = ''): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return suffix ? `sb-auth-token-${suffix}` : 'sb-auth-token';

  const projectId = url.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectId) return suffix ? `sb-auth-token-${suffix}` : 'sb-auth-token';

  return suffix
    ? `sb-${projectId}-auth-token-${suffix}`
    : `sb-${projectId}-auth-token`;
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const startTime = performance.now();

      try {
        debug.log('🔐 OAuth 콜백 페이지 로드...');
        debug.log(
          '⚡ Supabase가 자동으로 PKCE 처리합니다 (detectSessionInUrl: true)'
        );
        debug.log('🌍 환경:', {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          isVercel: window.location.origin.includes('vercel.app'),
        });

        // 🔍 상세 디버깅: URL 파라미터 및 기존 토큰 상태 확인
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const state = urlParams.get('state');
        const error_param = urlParams.get('error');

        // 🚨 OAuth 코드 없이 콜백 페이지에 접근한 경우 - 로그인 페이지로 리다이렉트
        if (!authCode && !error_param) {
          debug.log('⚠️ OAuth 코드 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }

        // ✅ 보안 개선: 민감정보 로깅 제거, 필요한 상태만 기록
        debug.log('🔍 OAuth 콜백 처리 시작:', {
          hasAuthCode: !!authCode,
          hasState: !!state,
          hasError: !!error_param,
          hasExistingTokens: {
            codeVerifier: !!localStorage.getItem(
              getSupabaseStorageKey('code-verifier')
            ),
            authToken: !!localStorage.getItem(getSupabaseStorageKey()),
            hasAuthCookie: document.cookie.includes(getSupabaseStorageKey()),
          },
          timestamp: new Date().toISOString(),
        });

        // URL에서 에러 파라미터 확인 (이미 위에서 정의됨)
        const error = error_param;

        if (error) {
          debug.error('❌ OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          const _errorMessage = errorDescription || error;

          // 더 자세한 에러 메시지
          let userMessage = 'GitHub 로그인에 실패했습니다.';
          if (error === 'access_denied') {
            userMessage = 'GitHub 인증이 취소되었습니다.';
          } else if (error === 'server_error') {
            userMessage =
              '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          } else if (error === 'temporarily_unavailable') {
            userMessage = '일시적으로 서비스를 사용할 수 없습니다.';
          }

          router.push(
            `/login?error=${error}&message=${encodeURIComponent(userMessage)}`
          );
          return;
        }

        debug.log('🔑 Supabase 자동 PKCE 처리 대기 중...');

        // 🚀 세션 스토리지에서 최종 리다이렉트 목적지 읽기
        // (useSupabaseSession.signIn()에서 저장한 값)
        let finalRedirectTo = '/main'; // 기본값
        try {
          const storedRedirect = sessionStorage.getItem('auth_redirect_to');
          if (storedRedirect) {
            finalRedirectTo = storedRedirect;
            sessionStorage.removeItem('auth_redirect_to'); // 사용 후 정리
            debug.log('📍 저장된 리다이렉트 목적지:', finalRedirectTo);
          }
        } catch (err) {
          debug.warn('sessionStorage 접근 오류 (무시됨):', err);
        }

        // 쿠키 설정 (리다이렉트 준비)
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_redirect_to=${encodeURIComponent(finalRedirectTo)}; path=/; max-age=60; SameSite=Lax`;

        // Supabase가 URL에서 코드를 감지하고 처리할 시간 최적화 (사용자 경험 개선)
        const isVercel = window.location.origin.includes('vercel.app');
        const initialWait = isVercel ? 1500 : 800; // 대기시간 50% 단축
        await new Promise((resolve) => setTimeout(resolve, initialWait));

        // 세션 확인 (Qwen 권장: 지수 백오프 알고리즘 적용)
        let session = null;
        let sessionError = null;
        let attempts = 0;
        const maxAttempts = isVercel ? 10 : 8; // 재시도 횟수 증가 (6→10, 4→8)
        let fetchError = false; // fetch 에러 발생 여부 추적

        do {
          try {
            const result = await getSupabase().auth.getSession();
            session = result.data.session;
            sessionError = result.error;
          } catch (err) {
            // 🚨 fetch 에러 처리 (PKCE 코드 교환 실패)
            // "TypeError: Failed to execute 'fetch' on 'Window': Invalid value"
            if (err instanceof TypeError && String(err).includes('fetch')) {
              debug.error('❌ PKCE 코드 교환 실패 (fetch 에러):', err);
              fetchError = true;

              // OAuth 관련 localStorage 정리
              const keysToRemove = Object.keys(localStorage).filter(
                (key) => key.startsWith('sb-') || key.includes('supabase')
              );
              for (const key of keysToRemove) {
                localStorage.removeItem(key);
              }

              break; // 루프 종료
            }
            throw err; // 다른 에러는 상위로 전파
          }

          if (!session && attempts < maxAttempts - 1) {
            // 지수 백오프 알고리즘 최적화 (200ms → 360ms → 648ms → 1166ms → 2000ms)
            const baseDelay = 200; // 기본 지연 시간 단축
            const maxDelay = 2000; // 최대 지연 시간 50% 단축
            const jitter = Math.random() * 0.1; // 10% 지터로 thundering herd 방지
            const retryDelay = Math.min(
              baseDelay * 1.8 ** attempts * (1 + jitter),
              maxDelay
            );

            debug.log(
              `🔄 세션 확인 재시도 ${attempts + 1}/${maxAttempts} (${Math.round(retryDelay)}ms 대기, 지수 백오프)`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          attempts++;
        } while (
          !session &&
          !sessionError &&
          !fetchError &&
          attempts < maxAttempts
        );

        // 🚨 fetch 에러 발생 시 사용자 친화적인 안내
        if (fetchError) {
          debug.log('⚠️ OAuth 인증 코드 처리 실패 - 게스트 로그인 안내');
          router.push(
            '/login?error=pkce_failed&message=' +
              encodeURIComponent(
                '인증 코드 처리에 실패했습니다. GitHub 로그인을 다시 시도하거나 게스트 모드를 이용해주세요.'
              )
          );
          return;
        }

        debug.log('📊 세션 상태:', {
          hasSession: !!session,
          sessionError: sessionError?.message,
          user: session?.user?.email,
          attempts,
        });

        if (session?.user) {
          debug.log('✅ 세션 확인됨, userId:', session.user.id);
          debug.log(
            `⏱️ 콜백 처리 시간: ${(performance.now() - startTime).toFixed(0)}ms`
          );

          // 🧹 게스트 쿠키 정리 (GitHub 로그인 성공 시)
          debug.log('🧹 게스트 쿠키 정리 시작...');
          const isProduction = window.location.protocol === 'https:';
          const secureFlag = isProduction ? '; Secure' : '';

          // 게스트 쿠키 삭제
          document.cookie = `guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
          document.cookie = `auth_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
          document.cookie = `auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;

          // localStorage 게스트 데이터 정리
          localStorage.removeItem('auth_type');
          localStorage.removeItem('auth_session_id');
          localStorage.removeItem('auth_user');

          debug.log('✅ 게스트 쿠키 및 localStorage 정리 완료');

          // auth_verified 쿠키 설정 (Vercel HTTPS 환경 대응)
          document.cookie = `auth_verified=true; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${secureFlag}`;

          // 최종 목적지로 이동
          debug.log('🚀 최종 목적지로 이동:', finalRedirectTo);

          // 세션 완전 설정 대기 최적화 (빠른 응답성)
          const sessionWait = isVercel ? 800 : 500; // 대기시간 60% 단축
          await new Promise((resolve) => setTimeout(resolve, sessionWait));

          // 세션 쿠키 설정 확인 및 검증
          const cookies = document.cookie.split(';').map((c) => c.trim());
          const hasAuthToken = cookies.some(
            (c) => c.startsWith('sb-') && c.includes('auth-token')
          );

          // 추가 세션 유효성 검증
          const finalSessionCheck = await getSupabase().auth.getSession();
          const sessionValid = !!finalSessionCheck.data.session?.access_token;

          debug.log('🍪 세션 완전성 검증:', {
            hasAuthToken,
            sessionValid,
            userId: finalSessionCheck.data.session?.user?.id,
            environment: isVercel ? 'Vercel' : 'Local',
          });

          // 검증 통과 후 리다이렉트
          if (hasAuthToken && sessionValid) {
            window.location.href = finalRedirectTo;
          } else {
            debug.log('⚠️ 세션 검증 실패 - 추가 대기 후 리다이렉트');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            window.location.href = finalRedirectTo; // 실패해도 진행 (클라이언트에서 재처리)
          }
        } else {
          // 세션이 없는 경우
          if (sessionError) {
            debug.error('❌ 세션 에러:', sessionError.message);

            // 더 친화적인 에러 메시지
            let userMessage = '인증 처리 중 오류가 발생했습니다.';
            if (sessionError.message.includes('invalid_grant')) {
              userMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
            } else if (sessionError.message.includes('network')) {
              userMessage =
                '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }

            router.push(
              '/login?error=session_failed&message=' +
                encodeURIComponent(userMessage)
            );
          } else {
            debug.log('⏳ PKCE 처리 중, 최종 재시도...');

            // 최종 재시도 대기 시간 증가 (세션 생성 안정성 우선)
            const finalRetryWait = isVercel ? 4000 : 3000; // 대기시간 증가 (2000→4000ms, 1500→3000ms)
            debug.log(`⏱️ 최종 재시도 대기 중... (${finalRetryWait}ms)`);
            await new Promise((resolve) => setTimeout(resolve, finalRetryWait));

            // 최종 세션 확인 (더 엄격한 검증)
            const finalCheck = await getSupabase().auth.getSession();
            const finalSession = finalCheck.data.session;

            debug.log('🔍 최종 세션 검증:', {
              hasSession: !!finalSession,
              hasAccessToken: !!finalSession?.access_token,
              hasUser: !!finalSession?.user?.id,
              userEmail: finalSession?.user?.email,
              expiresAt: finalSession?.expires_at,
            });

            if (finalSession?.access_token && finalSession?.user) {
              debug.log('✅ 최종 세션 검증 성공!');

              // 세션 유효성 재확인 후 리다이렉트
              await new Promise((resolve) => setTimeout(resolve, 500));
              window.location.href = finalRedirectTo;
            } else {
              debug.log('❌ 최종 세션 생성 실패 - 로그인 페이지로 이동');

              // 무한 리다이렉션 루프 방지: 메인 페이지 대신 로그인 페이지로 직접 이동
              router.push(
                '/login?error=session_timeout&message=' +
                  encodeURIComponent(
                    '세션 생성에 실패했습니다. 다시 로그인해주세요.'
                  )
              );
            }
          }
        }
      } catch (error) {
        debug.error('❌ OAuth 콜백 처리 오류:', error);

        // 에러 타입별 사용자 친화적 메시지 생성
        let errorMessage = '인증 처리 중 예상치 못한 오류가 발생했습니다.';
        let errorCode = 'callback_failed';

        if (error instanceof TypeError) {
          if (String(error).includes('fetch')) {
            errorMessage =
              '네트워크 요청 중 오류가 발생했습니다. 다시 시도해주세요.';
            errorCode = 'network_error';
          } else if (
            String(error).includes('null') ||
            String(error).includes('undefined')
          ) {
            errorMessage = '세션 데이터 처리 중 오류가 발생했습니다.';
            errorCode = 'data_error';
          }
        } else if (error instanceof Error) {
          if (error.message.includes('invalid_grant')) {
            errorMessage = '인증 코드가 만료되었습니다. 다시 로그인해주세요.';
            errorCode = 'invalid_grant';
          } else if (error.message.includes('network')) {
            errorMessage = '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
            errorCode = 'network_error';
          }
        }

        router.push(
          `/login?error=${errorCode}&message=${encodeURIComponent(errorMessage)}`
        );
      }
    };

    void handleCallback();
  }, [router]); // router 함수 의존성 복구

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">인증 처리 중...</h1>
        <p className="text-gray-400">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
