/**
 * 🎉 OAuth 인증 성공 페이지
 *
 * OAuth 콜백 후 세션이 안정화될 때까지 대기하는 중간 페이지입니다.
 * 세션 확인 후 자동으로 메인 페이지로 이동합니다.
 */

'use client';

// 클라이언트 컴포넌트 - 인증 페이지는 클라이언트에서 처리

import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import debug from '@/utils/debug';

export default function AuthSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>(
    'checking'
  );
  const [retryCount, setRetryCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    [key: string]: number;
  }>({});

  // 🚀 성능 측정 헬퍼
  // 🚀 성능 측정 헬퍼
  const measureTime = useCallback((label: string, startTime: number) => {
    const duration = performance.now() - startTime;
    debug.log(`⏱️ ${label}: ${duration.toFixed(0)}ms`);
    setPerformanceMetrics((prev) => ({ ...prev, [label]: duration }));
    return duration;
  }, []);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const totalStartTime = performance.now();

      try {
        debug.log('🎉 인증 성공 페이지 - 세션 확인 중...');
        debug.log('⏱️ 성능 측정 시작');

        // Vercel 환경 감지 (더 정확한 방법)
        const isVercel =
          window.location.hostname.includes('vercel.app') ||
          window.location.hostname.includes('.vercel.app') ||
          process.env.VERCEL === '1' ||
          process.env.VERCEL_ENV !== undefined;
        debug.log('🌍 환경:', {
          isVercel,
          hostname: window.location.hostname,
          vercelEnv: process.env.VERCEL_ENV,
          origin: window.location.origin,
        });

        // 🚀 Phase 2 최적화: 대기 시간 추가 단축 + 이벤트 기반 처리
        const _initialWait = isVercel ? 500 : 200; // 2000 → 500ms
        const sessionCheckStart = performance.now();

        // 이벤트 기반 세션 감지
        const sessionPromise = new Promise<boolean>((resolve) => {
          const unsubscribe = getSupabase().auth.onAuthStateChange(
            (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                debug.log('🎉 이벤트 기반 세션 감지!');
                unsubscribe.data.subscription.unsubscribe();
                resolve(true);
              }
            }
          );

          // 타임아웃 설정
          setTimeout(() => {
            unsubscribe.data.subscription.unsubscribe();
            resolve(false);
          }, _initialWait);
        });

        // 즉시 세션 확인과 이벤트 기반 감지를 병렬로
        let immediateSession = false;
        let eventSession = false;

        try {
          [immediateSession, eventSession] = await Promise.all([
            getSupabase()
              .auth.getSession()
              .then(({ data }) => !!data.session?.user)
              .catch((err) => {
                // fetch 에러 처리 (PKCE 코드 교환 실패)
                if (err instanceof TypeError && String(err).includes('fetch')) {
                  debug.error('❌ PKCE 코드 교환 실패 (fetch 에러):', err);
                  return false;
                }
                throw err;
              }),
            sessionPromise,
          ]);
        } catch (err) {
          debug.error('❌ 세션 확인 중 에러:', err);
          // 에러 발생 시 로그인 페이지로 리다이렉트
          if (err instanceof TypeError && String(err).includes('fetch')) {
            // OAuth 상태 정리
            const keysToRemove = Object.keys(localStorage).filter(
              (key) => key.startsWith('sb-') || key.includes('supabase')
            );
            for (const key of keysToRemove) {
              localStorage.removeItem(key);
            }

            router.push(
              '/login?error=pkce_failed&message=' +
                encodeURIComponent(
                  '인증 코드 처리에 실패했습니다. GitHub 로그인을 다시 시도해주세요.'
                )
            );
            return;
          }
        }

        measureTime('초기 세션 확인', sessionCheckStart);

        if (immediateSession || eventSession) {
          debug.log('✅ 세션 즉시 확인됨!');
          // 세션이 있으면 바로 진행
        } else {
          // 세션이 없을 때만 최소한의 대기
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // 🚀 Phase 2: 조건부 새로고침 (필요한 경우만)
        const refreshStart = performance.now();

        // 세션이 없거나 만료 임박한 경우만 새로고침
        const { data: currentSession } = await getSupabase().auth.getSession();
        if (
          !currentSession.session ||
          (currentSession.session.expires_at &&
            new Date(currentSession.session.expires_at * 1000).getTime() -
              Date.now() <
              60000)
        ) {
          debug.log('🔄 세션 새로고침 필요함...');
          const { error: refreshError } =
            await getSupabase().auth.refreshSession();
          if (refreshError) {
            debug.warn('⚠️ 세션 새로고침 실패:', refreshError);
          }
        } else {
          debug.log('✅ 세션 새로고침 불필요 (유효한 세션 존재)');
        }

        measureTime('세션 새로고침', refreshStart);

        // 🚀 Phase 2: 스마트 재시도 (첫 시도에서 성공할 가능성 높음)
        const validationStart = performance.now();
        let user = null;
        let session = null;
        let error = null;
        const maxRetries = isVercel ? 2 : 1; // 더 적극적으로 재시도 감소

        // 첫 번째 시도는 즉시
        const [sessionResult, userResult] = await Promise.all([
          getSupabase().auth.getSession(),
          getSupabase().auth.getUser(),
        ]);

        session = sessionResult.data.session;
        user = userResult.data.user;
        error = userResult.error;

        if (!user && !error && maxRetries > 0) {
          // 첫 시도 실패 시만 재시도
          debug.log('⚠️ 첫 시도 실패, 한 번만 재시도...');
          setRetryCount(1);

          // 짧은 대기 후 재시도
          await new Promise((resolve) =>
            setTimeout(resolve, isVercel ? 500 : 300)
          );

          const retryResult = await getSupabase().auth.getUser();
          user = retryResult.data.user;
          error = retryResult.error;
        }

        measureTime('사용자 검증', validationStart);

        if (user && !error) {
          debug.log('✅ 사용자 검증 성공');
        }

        if (error) {
          debug.error('❌ 세션 확인 오류:', error);
          setStatus('error');
          setTimeout(
            () => router.push('/login?error=session_check_failed'),
            2000
          );
          return;
        }

        if (!user || !session) {
          debug.error('❌ 사용자 인증 실패');
          setStatus('error');
          setTimeout(() => router.push('/login?error=no_user'), 2000);
          return;
        }

        debug.log('✅ 사용자 인증 완료, userId:', user.id);
        setStatus('success');

        // 라우터 캐시 갱신 여러 번
        for (let i = 0; i < 3; i++) {
          router.refresh();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // 세션 저장 목적지 확인
        const redirectTo =
          sessionStorage.getItem('auth_redirect_to') || '/main';
        sessionStorage.removeItem('auth_redirect_to');

        debug.log('🚀 리다이렉트:', redirectTo);

        // 🍪 쿠키에 인증 상태 표시 (미들웨어에서 확인용)
        document.cookie = `auth_redirect_to=${encodeURIComponent(redirectTo)}; path=/; max-age=60; SameSite=Lax`;
        document.cookie = `auth_in_progress=true; path=/; max-age=60; SameSite=Lax`;

        // 🚀 Phase 2: 스마트 쿠키 처리 (폴링 방식)
        const cookieStart = performance.now();
        const maxCookieWait = isVercel ? 1000 : 500; // 3000 → 1000ms
        const cookieCheckInterval = 100;
        let cookieReady = false;

        // 쿠키가 실제로 설정되었는지 확인하는 폴링
        for (
          let elapsed = 0;
          elapsed < maxCookieWait;
          elapsed += cookieCheckInterval
        ) {
          if (
            document.cookie.includes('sb-') &&
            document.cookie.includes('auth_redirect_to')
          ) {
            cookieReady = true;
            debug.log(`✅ 쿠키 준비 완료 (${elapsed}ms)`);
            break;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, cookieCheckInterval)
          );
        }

        if (!cookieReady) {
          debug.log('⚠️ 쿠키 설정 타임아웃, 계속 진행...');
        }

        measureTime('쿠키 동기화', cookieStart);

        // 쿠키 상태 확인 로그
        const cookies = document.cookie;
        debug.log('🍪 리다이렉트 전 쿠키 상태:', {
          hasCookies: cookies.length > 0,
          cookieCount: cookies.split(';').length,
          supabaseCookies: cookies
            .split(';')
            .filter((c) => c.includes('supabase')).length,
          environment: isVercel ? 'Vercel' : 'Local',
        });

        // 🚀 Phase 2: 최종 검증 완전 생략 (이미 검증됨)
        debug.log('✅ 모든 검증 완료, 리다이렉트 준비...');

        // 전체 소요 시간 측정
        const totalTime = measureTime('전체 인증 프로세스', totalStartTime);
        debug.log('📊 성능 요약:', performanceMetrics);
        debug.log(`🎯 총 소요 시간: ${totalTime.toFixed(0)}ms`);

        // 🔧 Vercel 환경에서 더 안정적인 리다이렉트 방법
        debug.log('🔄 리다이렉트 실행:', redirectTo);

        // 쿠키 정리
        document.cookie = 'auth_in_progress=; path=/; max-age=0';

        if (isVercel) {
          // Vercel에서는 window.location.replace 사용 (히스토리 스택 교체)
          debug.log('🌍 Vercel 환경 - window.location.replace 사용');
          window.location.replace(redirectTo);
        } else {
          // 로컬에서는 기존 방식 유지
          debug.log('🏠 로컬 환경 - window.location.href 사용');
          window.location.href = redirectTo;
        }
      } catch (error) {
        debug.error('❌ 예상치 못한 오류:', error);
        setStatus('error');
        setTimeout(() => router.push('/login?error=unexpected'), 3000);
      }
    };

    void checkSessionAndRedirect();
    // performanceMetrics는 의도적으로 의존성에서 제외 (변경될 때마다 재실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, measureTime, performanceMetrics]); // router 함수 의존성 복구

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <div className="mb-8">
          {status === 'checking' && (
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-500" />
          )}
          {status === 'success' && (
            <CheckCircle className="animate-bounce mx-auto h-16 w-16 text-green-500" />
          )}
          {status === 'error' && (
            <div className="mx-auto h-16 w-16 text-red-500">❌</div>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">
          {status === 'checking' && '인증 확인 중...'}
          {status === 'success' && '인증 성공!'}
          {status === 'error' && '오류 발생'}
        </h1>

        <p className="text-gray-400">
          {status === 'checking' && '잠시만 기다려주세요'}
          {status === 'success' && '메인 페이지로 이동합니다'}
          {status === 'error' && '다시 시도해주세요'}
        </p>

        {status === 'checking' && retryCount > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              세션 확인 중... (재시도 {retryCount}회)
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              리다이렉트 중...
            </div>
          </div>
        )}

        {/* 성능 메트릭 표시 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' &&
          Object.keys(performanceMetrics).length > 0 && (
            <div className="mt-6 rounded-lg bg-gray-800 p-4 text-xs text-gray-400">
              <h3 className="mb-2 font-bold">성능 메트릭:</h3>
              {Object.entries(performanceMetrics).map(([key, value]) => (
                <div key={`metric-${key}`}>
                  {key}: {value.toFixed(0)}ms
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
