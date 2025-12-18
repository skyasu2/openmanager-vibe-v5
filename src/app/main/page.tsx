/**
 * 🏠 OpenManager 메인 페이지
 *
 * GitHub OAuth + 게스트 로그인 지원
 * 웨이브 파티클 배경, 고급 애니메이션, 카운트다운 시스템
 *
 * NOTE: 이 파일은 반드시 Client Component여야 합니다 (hooks 사용)
 *
 * @refactored 2024-12 - 568줄 → ~200줄 (컴포넌트 분리)
 */

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

import AuthLoadingUI from '@/components/shared/AuthLoadingUI';
import { OpenManagerLogo } from '@/components/shared/OpenManagerLogo';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import {
  isGuestFullAccessEnabled,
  isGuestSystemStartEnabled,
} from '@/config/guestMode';
import { isVercel } from '@/env';
import { useInitialAuth } from '@/hooks/useInitialAuth';
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
import {
  DashboardSection,
  GuestRestrictionModal,
  LoginPrompt,
  MainPageErrorBoundary,
  SystemStartSection,
} from './components';
// 로컬 컴포넌트 및 훅
import { useSystemStart } from './hooks';

// Phase 2: Lazy loading
const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  { ssr: false }
);

function Home() {
  // 인증 상태
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

  // 마운트 상태
  const [isMounted, setIsMounted] = useState(false);
  const guestSystemStartEnabled = isGuestSystemStartEnabled();

  // 시스템 시작 훅
  const {
    systemStartCountdown,
    isSystemStarting,
    isSystemStarted,
    multiUserStatus,
    showGuestRestriction,
    dismissGuestRestriction,
    statusInfo,
    buttonConfig,
    handleSystemToggle,
    navigateToDashboard,
  } = useSystemStart({
    isAuthenticated,
    isGitHubUser,
    authLoading,
    isMounted,
    guestSystemStartEnabled,
  });

  // 시스템 상태 동기화
  const { startSystem, stopSystem, getSystemRemainingTime } =
    useUnifiedAdminStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevRunningRef = useRef<boolean | null>(null);

  // 시스템 남은 시간 (UI 표시용)
  const [_systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 클라이언트 마운트
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

  // 다중 사용자 시스템 상태 동기화
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

  // 인증 에러 재시도
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

  // 시스템 남은 시간 업데이트
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

  // 접근 권한 계산
  const canAccessSystem = useMemo(
    () => isGitHubUser || guestSystemStartEnabled || isGuestFullAccessEnabled(),
    [isGitHubUser, guestSystemStartEnabled]
  );

  const guestModeMessage = useMemo(
    () =>
      guestSystemStartEnabled || isGuestFullAccessEnabled()
        ? '현재 게스트 모드에서도 시스템 제어 기능을 전부 테스트 중입니다.'
        : '게스트 모드에서는 읽기 전용 기능만 사용 가능합니다.',
    [guestSystemStartEnabled]
  );

  // 로딩 상태
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

  // 미인증 상태 처리: 게스트 시스템 시작이 허용된 경우 메인 콘텐츠 표시
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <div className="text-sm">인증 확인 중... ({envLabel})</div>
        </div>
      </div>
    );
  }

  // 게스트 시스템 시작이 비활성화된 경우에만 리다이렉트
  if (
    !isAuthenticated &&
    !guestSystemStartEnabled &&
    !isGuestFullAccessEnabled()
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
      <div className="wave-particles" />

      {/* 헤더 */}
      <header className="relative z-50 flex items-center justify-between p-4 sm:p-6">
        <OpenManagerLogo variant="dark" href="/" />
        <div className="flex items-center gap-3">
          <UnifiedProfileHeader />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 mx-auto px-6 pt-8">
        {/* 타이틀 */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            <span className="bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {renderTextWithAIGradient('AI', isMounted)}
            </span>{' '}
            <span className="font-semibold text-white">기반</span>{' '}
            <span className="text-white">서버 모니터링</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
            <span className="text-sm text-white/75">
              LangGraph 기반 A2A 엔진 (Gemini + Groq) | 멀티 에이전트 협업을
              통한 지능형 분석
            </span>
          </p>
        </div>

        {/* 시스템 시작/대시보드 섹션 */}
        <div className="mb-12">
          {!isSystemStarted ? (
            canAccessSystem ? (
              <SystemStartSection
                isMounted={isMounted}
                systemStartCountdown={systemStartCountdown}
                isSystemStarting={isSystemStarting}
                isSystemStarted={isSystemStarted}
                isSystemRunning={multiUserStatus?.isRunning || false}
                buttonConfig={buttonConfig}
                statusInfo={statusInfo}
                onSystemToggle={handleSystemToggle}
              />
            ) : (
              <div className="mx-auto max-w-2xl">
                <LoginPrompt
                  isMounted={isMounted}
                  guestModeMessage={guestModeMessage}
                />
              </div>
            )
          ) : (
            <DashboardSection
              canAccessDashboard={canAccessSystem}
              onNavigateDashboard={navigateToDashboard}
            />
          )}
        </div>

        {/* 기능 카드 그리드 */}
        <div className="mb-12">
          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className="mt-8 border-t border-white/20 pt-6 text-center">
          <p className="text-white/90">
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 게스트 제한 모달 */}
      <GuestRestrictionModal
        open={showGuestRestriction}
        onClose={dismissGuestRestriction}
      />
    </div>
  );
}

// Phase 3: Error Boundary로 래핑된 페이지 export
export default function MainPage() {
  return (
    <MainPageErrorBoundary
      fallbackTitle="메인 페이지 오류"
      fallbackMessage="메인 페이지를 불러오는 중 문제가 발생했습니다."
    >
      <Home />
    </MainPageErrorBoundary>
  );
}
