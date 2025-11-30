/**
 * 🏠 OpenManager 메인 페이지 - Commit 18a89a4 UI 복원
 *
 * GitHub OAuth + 게스트 로그인 지원 + 원래 UI 구조 복원
 * 웨이브 파티클 배경, 고급 애니메이션, 카운트다운 시스템 복원
 *
 * NOTE: 이 파일은 반드시 Client Component여야 합니다 (hooks 사용)
 */

'use client';

import { BarChart3, Bot, Loader2, LogIn, Play, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FeatureCardsGrid from '@/components/home/FeatureCardsGrid';
import AuthLoadingUI from '@/components/shared/AuthLoadingUI';
import { OpenManagerLogo } from '@/components/shared/OpenManagerLogo';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import {
  isGuestFullAccessEnabled,
  isGuestSystemStartEnabled,
} from '@/config/guestMode';
import { isVercel } from '@/env';
import { useInitialAuth } from '@/hooks/useInitialAuth';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { PAGE_BACKGROUNDS } from '@/styles/design-constants';
import debug from '@/utils/debug';
import { renderTextWithAIGradient } from '@/utils/text-rendering';
import {
  authRetryDelay,
  debugWithEnv,
  envLabel,
  mountDelay,
  syncDebounce,
} from '@/utils/vercel-env-utils';
import {
  performanceTracker,
  preloadCriticalResources,
} from '@/utils/vercel-optimization';

const SYSTEM_START_COUNTDOWN_SECONDS = 3;
const COUNTDOWN_INTERVAL_MS = 1000;

function Home() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isLoading: authLoading,
    isAuthenticated,
    user: _currentUser,
    isGitHubConnected: isGitHubUser,
    error: authError,
    isReady: authReady,
    shouldRedirect,
    getLoadingMessage,
    retry: retryAuth,
  } = useInitialAuth();

  const guestSystemStartEnabled = isGuestSystemStartEnabled();
  const [isMounted, setIsMounted] = useState(false);

  const { isSystemStarted, startSystem, stopSystem, getSystemRemainingTime } =
    useUnifiedAdminStore();

  const {
    status: multiUserStatus,
    isLoading: statusLoading,
    startSystem: startMultiUserSystem,
  } = useSystemStatus();

  const [_isLoading, _setIsLoading] = useState(false);
  const [_systemTimeRemaining, setSystemTimeRemaining] = useState(0);
  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isSystemStarting, setIsSystemStarting] = useState(false);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevRunningRef = useRef<boolean | null>(null);

  const statusInfo = useMemo(() => {
    if (systemStartCountdown > 0) {
      return {
        color: 'text-orange-300',
        message: '⚠️ 시작 예정 - 취소하려면 클릭',
        showEscHint: true,
      };
    }
    if (isSystemStarting) {
      return {
        color: 'text-purple-300',
        message: '🚀 시스템 부팅 중...',
        showEscHint: false,
      };
    }
    if (multiUserStatus?.isRunning || isSystemStarted) {
      const shutdownTime =
        typeof window !== 'undefined'
          ? localStorage.getItem('system_auto_shutdown')
          : null;
      let message = '✅ 시스템 가동 중 - 대시보드로 이동';
      if (shutdownTime) {
        const timeLeft = Math.max(
          0,
          Math.floor((parseInt(shutdownTime, 10) - Date.now()) / 60000)
        );
        message = `✅ 시스템 가동 중 (${timeLeft}분 후 자동 종료)`;
      }
      return { color: 'text-green-300', message, showEscHint: false };
    }
    return {
      color: 'text-white',
      message: '클릭하여 시작하기',
      showEscHint: false,
    };
  }, [
    systemStartCountdown,
    isSystemStarting,
    multiUserStatus?.isRunning,
    isSystemStarted,
  ]);

  useEffect(() => {
    if (isVercel) performanceTracker.start('page-mount');
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
      debug.log(debugWithEnv('✅ 클라이언트 마운트 완료'), { isVercel });
      if (isVercel) {
        void preloadCriticalResources();
        performanceTracker.end('page-mount');
      }
    }, mountDelay);
    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    if (!authReady || !multiUserStatus) return;
    const currentRunning = multiUserStatus.isRunning;
    if (prevRunningRef.current !== currentRunning) {
      prevRunningRef.current = currentRunning;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        const needsStart = multiUserStatus.isRunning && !isSystemStarted;
        const needsStop = !multiUserStatus.isRunning && isSystemStarted;
        if (needsStart) {
          debug.log(debugWithEnv('🔄 시스템이 다른 사용자에 의해 시작됨'));
          startSystem();
        } else if (needsStop) {
          debug.log(debugWithEnv('🔄 시스템이 다른 사용자에 의해 정지됨'));
          stopSystem();
        }
      }, syncDebounce);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [authReady, multiUserStatus, isSystemStarted, startSystem, stopSystem]);

  useEffect(() => {
    if (!multiUserStatus) return;
    const currentStarting = multiUserStatus.isStarting || false;
    if (currentStarting !== isSystemStarting) {
      debug.log(
        debugWithEnv(
          `🔄 시스템 시작 상태 업데이트: ${isSystemStarting} → ${currentStarting}`
        )
      );
      setIsSystemStarting(currentStarting);
    }
  }, [multiUserStatus, isSystemStarting]);

  useEffect(() => {
    if (!authError || !authReady) return;
    debug.error(debugWithEnv('❌ 인증 에러 발생'), authError);
    const authRetryTimeout = setTimeout(() => {
      debug.log(
        debugWithEnv(`🔄 인증 재시도 시작 (${authRetryDelay / 1000}초 후)`)
      );
      retryAuth();
    }, authRetryDelay);
    return () => clearTimeout(authRetryTimeout);
  }, [authError, authReady, retryAuth]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (isSystemStarted) {
        setSystemTimeRemaining(getSystemRemainingTime());
      } else {
        setSystemTimeRemaining(0);
      }
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isSystemStarted, getSystemRemainingTime]);

  useEffect(() => {
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [countdownTimer]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && systemStartCountdown > 0) {
        if (countdownTimer) clearInterval(countdownTimer);
        setCountdownTimer(null);
        setSystemStartCountdown(0);
        setIsSystemStarting(false);
      }
    };
    if (systemStartCountdown > 0) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }
    return undefined;
  }, [systemStartCountdown, countdownTimer]);

  const handleSystemToggle = useCallback(() => {
    const isActuallyLoading =
      statusLoading ||
      isSystemStarting ||
      (authLoading && !isAuthenticated && !isGitHubUser);
    if (isActuallyLoading) {
      console.log('🚫 시스템 토글 차단:', {
        statusLoading,
        isSystemStarting,
        authLoading,
        isAuthenticated,
        isGitHubUser,
      });
      return;
    }

    const isGuest = !isGitHubUser;
    if (isGuest && !guestSystemStartEnabled) {
      alert(
        '⚠️ 게스트 모드는 시스템을 시작할 수 없습니다.\n\nGitHub 로그인을 이용해주세요.'
      );
      return;
    }

    console.log('✅ 시스템 토글 실행 - GitHub 사용자:', isGitHubUser);

    if (systemStartCountdown > 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      setCountdownTimer(null);
      setSystemStartCountdown(0);
      setIsSystemStarting(false);
      return;
    }

    if (multiUserStatus?.isRunning || isSystemStarted) {
      if (pathname !== '/dashboard') router.push('/dashboard');
    } else {
      setSystemStartCountdown(SYSTEM_START_COUNTDOWN_SECONDS);
      setIsSystemStarting(false);
      const timer = setInterval(() => {
        setSystemStartCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            debug.log('🚀 카운트다운 완료 - 로딩 페이지로 이동');
            void (async () => {
              try {
                await startMultiUserSystem();
                await startSystem();
              } catch (error) {
                debug.error('❌ 시스템 시작 실패:', error);
                setIsSystemStarting(false);
              }
            })();
            router.push('/system-boot');
            return 0;
          }
          return prev - 1;
        });
      }, COUNTDOWN_INTERVAL_MS);
      setCountdownTimer(timer);
    }
  }, [
    isSystemStarting,
    systemStartCountdown,
    multiUserStatus?.isRunning,
    isSystemStarted,
    pathname,
    isAuthenticated,
    isGitHubUser,
    authLoading,
    statusLoading,
    countdownTimer,
    router,
    startMultiUserSystem,
    startSystem,
    guestSystemStartEnabled,
  ]);

  const buttonConfig = useMemo(() => {
    const getIcon = (
      IconComponent: React.ComponentType<{ className?: string }>,
      className: string
    ) => (isMounted ? <IconComponent className={className} /> : null);

    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: getIcon(X, 'h-5 w-5'),
        className:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
        disabled: false,
      };
    }

    if (isSystemStarting) {
      return {
        text: '시스템 시작 중...',
        icon: getIcon(Loader2, 'h-5 w-5 animate-spin'),
        className:
          'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
        disabled: true,
      };
    }

    const isActuallyLoading =
      statusLoading ||
      isSystemStarting ||
      (authLoading && !isAuthenticated && !isGitHubUser);
    if (isActuallyLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: getIcon(Loader2, 'h-5 w-5 animate-spin'),
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
        disabled: true,
      };
    }

    if (multiUserStatus?.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
        icon: getIcon(BarChart3, 'h-5 w-5'),
        className:
          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
        disabled: false,
      };
    }

    return {
      text: '🚀 시스템 시작',
      icon: getIcon(Play, 'h-5 w-5'),
      className:
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
      disabled: false,
    };
  }, [
    isMounted,
    systemStartCountdown,
    isSystemStarting,
    authLoading,
    isAuthenticated,
    isGitHubUser,
    statusLoading,
    multiUserStatus?.isRunning,
    multiUserStatus?.userCount,
    isSystemStarted,
  ]);

  const shouldShowLoading = !isMounted || authLoading || shouldRedirect;

  if (shouldShowLoading) {
    return (
      <AuthLoadingUI
        loadingMessage={getLoadingMessage()}
        envLabel={envLabel}
        authError={authError}
        onRetry={retryAuth}
      />
    );
  }

  if (!authReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <div className="text-sm">리다이렉션 중... ({envLabel})</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${PAGE_BACKGROUNDS.DARK_PAGE_BG}`}
      data-system-active={isSystemStarted ? 'true' : 'false'}
    >
      <div className="wave-particles"></div>
      <header className="relative z-50 flex items-center justify-between p-4 sm:p-6">
        <button
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-80"
          onClick={() => router.push('/')}
          aria-label="홈으로 이동"
        >
          <OpenManagerLogo variant="dark" />
        </button>
        <div className="flex items-center gap-3">
          <UnifiedProfileHeader />
        </div>
      </header>
      <div className="container relative z-10 mx-auto px-6 pt-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {renderTextWithAIGradient('AI', isMounted)}
            </span>{' '}
            <span className="font-semibold text-white">기반</span>{' '}
            <span className="text-white">서버 모니터링</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
            <span className="text-sm text-white/75">
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </div>
        <div className="mb-12">
          {!isSystemStarted ? (
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 flex flex-col items-center space-y-4">
                {isGitHubUser ||
                guestSystemStartEnabled ||
                isGuestFullAccessEnabled() ? (
                  <>
                    <button
                      onClick={handleSystemToggle}
                      disabled={buttonConfig.disabled}
                      className={`flex h-16 w-full max-w-xs items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 sm:w-64 ${buttonConfig.className}`}
                    >
                      {systemStartCountdown > 0 && (
                        <div
                          className="absolute inset-0 overflow-hidden rounded-xl"
                          style={{ transformOrigin: 'left' }}
                        >
                          <div className="h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40" />
                          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        {buttonConfig.icon}
                        <span className="text-lg">{buttonConfig.text}</span>
                      </div>
                    </button>
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-medium opacity-80 transition-all duration-300 ${statusInfo.color}`}
                      >
                        {statusInfo.message}
                      </span>
                      {statusInfo.showEscHint && (
                        <span className="text-xs text-white/75">
                          또는 ESC 키를 눌러 취소
                        </span>
                      )}
                    </div>
                    {!systemStartCountdown &&
                      !isSystemStarting &&
                      !multiUserStatus?.isRunning &&
                      !isSystemStarted && (
                        <div className="mt-2 flex justify-center">
                          <span className="finger-pointer-primary">👆</span>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 sm:p-6">
                      {isMounted && (
                        <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                      )}
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        GitHub 로그인이 필요합니다
                      </h3>
                      <p className="mb-4 text-sm text-blue-100">
                        시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수
                        있습니다.
                      </p>
                      <button
                        onClick={() => router.push('/login')}
                        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        로그인 페이지로 이동
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {guestSystemStartEnabled || isGuestFullAccessEnabled()
                        ? '현재 게스트 모드에서도 시스템 제어 기능을 전부 테스트 중입니다.'
                        : '게스트 모드에서는 읽기 전용 기능만 사용 가능합니다.'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center text-sm">
                <div className="max-w-md rounded-lg bg-white/5 p-2 sm:p-3">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    {isMounted && <Bot className="h-4 w-4 text-purple-400" />}
                    <span className="font-semibold">AI 어시스턴트</span>
                  </div>
                  <p className="text-center text-white/90">
                    시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex flex-col items-center">
                  {isGitHubUser ||
                  guestSystemStartEnabled ||
                  isGuestFullAccessEnabled() ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="flex h-16 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-600 font-semibold text-white shadow-xl transition-all duration-200 hover:bg-emerald-700 sm:w-64"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-lg">📊 대시보드 열기</span>
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="mb-2 text-sm text-gray-400">
                        시스템이 다른 사용자에 의해 실행 중입니다
                      </p>
                      <p className="text-xs text-gray-500">
                        GitHub 로그인 후 대시보드 접근이 가능합니다
                      </p>
                    </div>
                  )}
                  <div className="mt-2 flex justify-center">
                    <span className="finger-pointer-dashboard">👆</span>
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className="text-xs text-white opacity-70">
                      클릭하세요
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-white/75">
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을
                확인하세요.
              </p>
            </div>
          )}
        </div>
        <div className="mb-12">
          <FeatureCardsGrid />
        </div>
        <div className="mt-8 border-t border-white/20 pt-6 text-center">
          <p className="text-white/90">
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
