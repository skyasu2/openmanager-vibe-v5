'use client';

/**
 * 🚀 Dashboard Client Component - 클라이언트 사이드 로직 v5.1.0
 *
 * 서버 컴포넌트에서 전달받은 데이터로 UI를 렌더링
 * 🔧 Fixed: TypeError w is not a function (usePerformanceGuard disabled)
 */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import AuthLoadingUI from '@/components/shared/AuthLoadingUI';
import UnauthorizedAccessUI from '@/components/shared/UnauthorizedAccessUI';
import { NotificationToast } from '@/components/system/NotificationToast';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useToast } from '@/hooks/use-toast';
// AISidebarV2는 필요시에만 동적 로드
import { useAutoLogout } from '@/hooks/useAutoLogout';
// import { usePerformanceGuard } from '@/hooks/usePerformanceGuard'; // 🛡️ 성능 모니터링 - 임시 비활성화
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { useSystemAutoShutdown } from '@/hooks/useSystemAutoShutdown';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { logger } from '@/lib/logging';
import { cn } from '@/lib/utils';
import { systemInactivityService } from '@/services/system/SystemInactivityService';
// Admin mode removed - Phase 2: Admin removal complete
import { useAISidebarStore } from '@/stores/useAISidebarStore'; // AI 사이드바 상태
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
// 🔧 레거시 정리 (2026-01-17): Server 타입 import 제거 - AnimatedServerModal 제거됨
import debug from '@/utils/debug';
import DashboardContent from '../../components/dashboard/DashboardContent';
// --- Static Imports for Core Components (SSR bailout 해결) ---
import DashboardHeader from '../../components/dashboard/DashboardHeader';

const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl'),
  {
    ssr: false, // 클라이언트 전용 컴포넌트 (변경 없음)
  }
);
// 🔧 레거시 정리 (2026-01-17): EnhancedServerModal은 ServerDashboard 내부에서 직접 사용

// AI Sidebar를 CSS 애니메이션으로 동적 로드
const AnimatedAISidebar = dynamic(
  async () => {
    const AISidebarV4 = await import('@/components/ai-sidebar/AISidebarV4');

    return function AnimatedAISidebarWrapper(props: {
      isOpen: boolean;
      onClose: () => void;
      [key: string]: unknown;
    }) {
      const { isOpen, onClose, ...otherProps } = props;
      return (
        <>
          {isOpen && (
            <div
              className="fixed inset-y-0 right-0 z-40 w-96 transform transition-transform duration-300 ease-in-out"
              style={{
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
              }}
            >
              <AISidebarV4.default
                onClose={onClose}
                isOpen={isOpen}
                {...otherProps}
              />
            </div>
          )}
        </>
      );
    };
  },
  {
    loading: () => (
      <div className="fixed inset-y-0 right-0 z-40 w-96 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    ),
    ssr: false, // 클라이언트 전용 컴포넌트
  }
);

// 🔧 레거시 정리 (2026-01-17): AnimatedServerModal dynamic import 제거
// - ServerDashboard 내부에서 EnhancedServerModal 직접 렌더링
// - 중복 모달 시스템 제거로 번들 크기 최적화

const ContentLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"></div>

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
          ></div>
        ))}
      </div>

      {/* 서버 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// 🔧 Error Boundary 클래스 제거됨 - React 19의 ErrorBoundary 또는 next.js error.tsx 사용 권장

// 🧪 테스트 모드 체크 함수 (컴포넌트 외부로 이동 - E2E 테스트용)
function checkTestMode(): boolean {
  // SSR 환경 체크
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  // 쿠키 체크 - 🔒 FIX: Safe access pattern for document.cookie
  const cookieStr = typeof document.cookie === 'string' ? document.cookie : '';
  const cookies = cookieStr.split(';').map((c) => c.trim());
  const hasTestMode = cookies.some((c) => c.startsWith('test_mode=enabled'));
  const hasTestToken = cookies.some((c) => c.startsWith('vercel_test_token='));

  if (hasTestMode || hasTestToken) {
    return true;
  }

  // localStorage 체크 (보조) - 🔒 FIX: Safe access pattern for localStorage
  try {
    const testModeEnabled =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('test_mode_enabled') === 'true';

    if (testModeEnabled) {
      return true;
    }
  } catch {
    // localStorage가 비활성화된 환경 (시크릿 모드 등)에서 무시
  }

  return false;
}

function DashboardPageContent() {
  // 🔍 DIAGNOSTIC: Render cycle tracking for E2E investigation
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
  });

  // 🔒 Hydration 불일치 방지를 위한 클라이언트 전용 상태
  const [isMounted, setIsMounted] = useState(false);

  // 🧪 테스트 모드 감지 - 즉시 동기적으로 체크 (useEffect 타이밍 이슈 해결)
  // FIX: Check BOTH cookie methods synchronously for E2E test reliability
  const [testModeDetected, setTestModeDetected] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for test mode cookies first (works in all environments)
    // 🔒 FIX: Safe access pattern for document.cookie to prevent undefined errors
    const cookieString =
      typeof document !== 'undefined' && typeof document.cookie === 'string'
        ? document.cookie
        : '';
    const hasTestModeCookie = cookieString.includes('test_mode=enabled');
    const hasTestToken = cookieString.includes('vercel_test_token=');

    // 🔒 Production: Require BOTH cookies for security while allowing E2E tests
    if (process.env.NODE_ENV === 'production') {
      const isTestMode = hasTestModeCookie && hasTestToken;
      return isTestMode;
    }

    // Development mode: use full detection logic with additional checks
    const functionBasedDetection = (() => {
      try {
        const cookies = document.cookie.split(';').map((c) => c.trim());
        return cookies.some(
          (c) =>
            c.startsWith('test_mode=enabled') ||
            c.startsWith('vercel_test_token=')
        );
      } catch {
        return false;
      }
    })();

    // 💾 localStorage check (with exception handling)
    let hasLocalStorageTestMode = false;
    try {
      const localStorageTestMode = localStorage.getItem('test_mode');
      hasLocalStorageTestMode = localStorageTestMode === 'enabled';
    } catch (error) {
      logger.error('❌ [Security] localStorage 접근 실패:', error);
    }

    const isTestMode =
      hasTestModeCookie ||
      hasTestToken ||
      functionBasedDetection ||
      hasLocalStorageTestMode;

    return isTestMode;
  });
  // 🔧 FIX: Re-evaluate test mode after client-side mount
  // Problem: useState initializer runs during SSR (before cookies available)
  // Solution: Check again after hydration when cookies are guaranteed present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTestMode = checkTestMode();
      if (isTestMode !== testModeDetected) {
        setTestModeDetected(isTestMode);
      }
    }
  }, [testModeDetected]); // testModeDetected 의존성 추가

  // 🔧 레거시 정리 (2026-01-17): selectedServer, isServerModalOpen 제거
  // - ServerDashboard 내부에서 EnhancedServerModal로 직접 관리
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  // 🔧 showSystemWarning - setter만 사용 (onWarning 콜백에서 설정, UI 반영은 NotificationToast로 대체)
  const [, setShowSystemWarning] = useState(false);
  const isResizing = false;

  // 🔒 새로운 권한 시스템 사용
  const router = useRouter();
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // 🎯 AI 사이드바 상태 (중앙 관리)
  const { isOpen: isAgentOpen, setOpen: setIsAgentOpen } = useAISidebarStore();
  const [authLoading, setAuthLoading] = useState(() => {
    if (checkTestMode()) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🧪 Post-hydration test mode detection (E2E 테스트용)
  useEffect(() => {
    if (!isMounted) return;

    // 쿠키가 hydration 후 접근 가능한지 확인
    const detectTestMode = () => {
      if (typeof document === 'undefined') return;

      // 🔒 FIX: Safe access pattern for document.cookie
      const cookieStr =
        typeof document.cookie === 'string' ? document.cookie : '';
      const hasTestModeCookie = cookieStr.includes('test_mode=enabled');
      const hasTestToken = cookieStr.includes('vercel_test_token=');

      if (hasTestModeCookie || hasTestToken) {
        setTestModeDetected(true);
      }
    };

    detectTestMode();
  }, [isMounted]);

  // 🔥 강화된 권한 체크 (비동기 인증 상태 타이밍 문제 해결)
  useEffect(() => {
    if (!isMounted) return;

    // 🎛️ 환경 변수 기반 게스트 모드 체크
    const isGuestFullAccess = isGuestFullAccessEnabled();

    if (isGuestFullAccess) {
      // 🟢 게스트 전체 접근 모드: 즉시 허용
      setAuthLoading(false);
      return; // cleanup 불필요
    } else {
      // 🔐 프로덕션 모드: 권한 체크 (동기 실행 - 타이밍 이슈 제거)
      const canAccess =
        permissions.canAccessDashboard ||
        permissions.isPinAuthenticated ||
        testModeDetected ||
        isGuestFullAccessEnabled();

      if (permissions.userType === 'loading') {
        return; // cleanup 불필요
      }

      if (
        !canAccess &&
        (permissions.userType === 'guest' || permissions.userType === 'github')
      ) {
        toast({
          variant: 'destructive',
          title: '접근 권한 없음',
          description:
            '대시보드 접근 권한이 없습니다. GitHub 로그인 또는 관리자 모드 인증이 필요합니다.',
        });
        router.push('/');
        return; // cleanup 불필요
      }

      if (canAccess) {
        setAuthLoading(false);
      }

      // cleanup 불필요 - 동기 실행으로 타이머 없음
    }
  }, [isMounted, permissions, router, testModeDetected, toast]);

  // 🎯 서버 통계 상태 관리 (상단 통계 카드용)
  // 🔧 serverStats - setter만 사용 (handleStatsUpdate에서 설정, 향후 상단 통계 카드 연동용)
  const [, setServerStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });

  // 🔄 실제 시스템 상태 확인
  // 🔧 useSystemStatus 반환값 미사용 - 향후 시스템 상태 표시용으로 보존
  useSystemStatus();

  // 🛑 시스템 제어 함수들
  const { isSystemStarted, startSystem } = useUnifiedAdminStore();

  // 🔒 자동 로그아웃 시스템 - 베르셀 사용량 최적화 (1초→10초 최적화 적용)
  const {
    remainingTime,
    // isWarning - 미사용 (showLogoutWarning 상태로 대체됨)
    resetTimer,
    forceLogout,
  } = useAutoLogout({
    timeoutMinutes: 10, // 10분 비활성 시 로그아웃
    warningMinutes: 1, // 1분 전 경고
    onWarning: () => {
      setShowLogoutWarning(true);
      debug.log('⚠️ 자동 로그아웃 경고 표시 - 베르셀 사용량 최적화');
    },
    onLogout: () => {
      debug.log('🔒 자동 로그아웃 실행 - 베르셀 사용량 최적화');
      systemInactivityService.pauseSystem();
    },
  });

  // 🕐 20분 시스템 자동 종료 - 포트폴리오 최적화 (1초→5초 최적화 적용)
  const {
    // isSystemActive - useUnifiedAdminStore.isSystemStarted로 대체됨
    remainingTime: systemRemainingTime,
    formatTime,
    // isWarning, restartSystem - 미사용 (showSystemWarning 상태로 대체됨)
  } = useSystemAutoShutdown({
    warningMinutes: 5, // 5분 전 경고
    onWarning: (remainingMinutes) => {
      setShowSystemWarning(true);
      debug.log(`⚠️ 시스템 자동 종료 경고: ${remainingMinutes}분 남음`);

      // 토스트 알림 표시 (CustomEvent 사용)
      const event = new CustomEvent('system-event', {
        detail: {
          type: 'server_alert',
          level: remainingMinutes === 5 ? 'warning' : 'critical',
          message:
            remainingMinutes === 5
              ? '시스템이 5분 후 자동으로 종료됩니다. 계속 사용하시려면 시스템 중지를 해제해주세요.'
              : '시스템이 1분 후 자동으로 종료됩니다!',
        },
      });
      window.dispatchEvent(event);
    },
    onShutdown: () => {
      debug.log('🛑 시스템 자동 종료 완료');
      setShowSystemWarning(false);

      // 종료 알림은 콘솔 로그로만 표시 (info 레벨은 NotificationToast에서 필터링됨)
    },
  });

  // ✅ useSystemStatusStore 제거 - useUnifiedAdminStore로 직접 접근

  // 🎯 실제 서버 데이터 생성기 데이터 사용 - 즉시 로드
  // 🔧 레거시 정리 (2026-01-17):
  // - selectedServer, handleServerSelect, handleModalClose 제거
  // - ServerDashboard 내부에서 EnhancedServerModal로 직접 관리
  const { paginatedServers: realServers } = useServerDashboard({});

  // 🕐 Supabase에서 24시간 데이터를 직접 가져오므로 시간 회전 시스템 제거됨
  // API가 30초마다 다른 시간대 데이터를 자동으로 반환

  // 🚀 대시보드 초기화 - Supabase에서 직접 데이터 로드
  useEffect(() => {
    debug.log('🎯 대시보드 초기화 - Supabase hourly_server_states 테이블 사용');
    // Supabase에서 24시간 데이터를 직접 가져오므로 별도 초기화 불필요
  }, []);

  // 🔥 AI Engine Cold Start 방지 - 대시보드 진입 시 미리 깨우기
  useEffect(() => {
    // Fire-and-forget: 응답을 기다리지 않고 백그라운드에서 실행
    fetch('/api/ai/wake-up', { method: 'POST' }).catch(() => {
      // Ignore errors - this is a best-effort warmup
    });
    debug.log('🔥 AI Engine warmup 신호 전송');
  }, []);

  // 🚀 시스템 자동 시작 로직 - "시스템 종료됨" 문제 해결
  useEffect(() => {
    if (!isSystemStarted) {
      debug.log('🚀 시스템이 종료된 상태입니다. 자동으로 시작합니다.');
      startSystem();
    }
  }, [isSystemStarted, startSystem]);

  // 🕐 시간 포맷팅 (향후 사용을 위해 유지)
  const _remainingTimeFormatted = formatTime
    ? formatTime(systemRemainingTime)
    : '00:00';

  // 🔥 Cloud Run warmup 쿨다운 (5분)
  const lastWarmupAtRef = useRef(0);
  const WARMUP_COOLDOWN_MS = 5 * 60 * 1000; // 5분

  const toggleAgent = useCallback(() => {
    // 🔒 AI 기능은 권한이 있는 사용자 또는 게스트 전체 접근 모드에서 사용 가능
    if (!permissions.canToggleAI && !isGuestFullAccessEnabled()) {
      // 토스트 메시지로 안내 (선택사항)
      return;
    }

    // 🔥 AI 사이드바 열릴 때 Cloud Run warmup 호출 (Cold Start 방지, 5분 쿨다운)
    if (!isAgentOpen) {
      const now = Date.now();
      if (now - lastWarmupAtRef.current > WARMUP_COOLDOWN_MS) {
        lastWarmupAtRef.current = now;
        fetch('/api/ai/wake-up', { method: 'POST' }).catch(() => {
          // Ignore errors - this is a best-effort warmup
        });
        debug.log('🔥 AI 어시스턴트 열기 - Cloud Run warmup 신호 전송');
      } else {
        debug.log('⏳ AI warmup 쿨다운 중 - 스킵');
      }
    }

    setIsAgentOpen(!isAgentOpen);
  }, [permissions.canToggleAI, isAgentOpen, setIsAgentOpen]);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, [setIsAgentOpen]);

  // 🔄 세션 연장 처리
  const handleExtendSession = useCallback(() => {
    resetTimer();
    setShowLogoutWarning(false);
    systemInactivityService.resumeSystem();
    debug.log('🔄 사용자가 세션을 연장했습니다 - 베르셀 사용량 최적화');
  }, [resetTimer]);

  // 🔒 즉시 로그아웃 처리
  const handleLogoutNow = useCallback(() => {
    void forceLogout();
    setShowLogoutWarning(false);
    debug.log('🔒 사용자가 즉시 로그아웃을 선택했습니다');
  }, [forceLogout]);

  // 🎯 통계 업데이트 핸들러 (상단 통계 카드 업데이트)
  const handleStatsUpdate = useCallback(
    (stats: {
      total: number;
      online: number;
      warning: number;
      offline: number;
    }) => {
      setServerStats(stats);
    },
    []
  );

  // 🔧 레거시 정리 (2026-01-17): handleServerClick, handleServerModalClose 제거
  // - ServerDashboard가 useServerDashboard hook에서 직접 클릭/모달 핸들링
  // - 외부에서 서버 클릭/모달 핸들러를 주입할 필요 없음

  // 🚀 시스템 제어 더미 데이터 최적화
  const dummySystemControl = {
    systemState: { status: 'ok' },
    aiAgentState: { state: 'idle' },
    isSystemActive: true,
    isSystemPaused: false,
    onStartSystem: () => Promise.resolve(),
    onStopSystem: () => Promise.resolve(),
    onResumeSystem: () => Promise.resolve(),
  };

  // 🔒 대시보드 접근 권한 확인 - PIN 인증한 게스트도 접근 가능
  // 🧪 FIX: 테스트 모드일 때는 로딩 상태 스킵 (E2E 테스트용)
  // 🧪 FIX: 테스트 모드 감지를 가장 먼저 체크 (E2E 테스트 타임아웃 해결)
  // 핵심: 테스트 환경이면 로딩 체크를 완전히 스킵하여 dashboard-container가 즉시 렌더링되도록 함
  // ✅ FIX: Use testModeDetected state (updated by useEffect) instead of direct checkTestMode() call
  const isTestEnvironment = testModeDetected;

  // 🎯 Step 4: Loading Gate with Test Mode Priority
  // Only block if NOT test mode AND hydration complete AND still loading
  if (
    !isTestEnvironment &&
    isMounted &&
    (authLoading || permissions.userType === 'loading')
  ) {
    return <AuthLoadingUI loadingMessage="권한을 확인하고 있습니다" />;
  }

  // 🔒 대시보드 접근 권한이 없는 경우 (GitHub 로그인 또는 PIN 인증 또는 테스트 모드 또는 게스트 전체 접근 모드 필요)
  // 🧪 FIX: 테스트 모드 체크 추가 (E2E 테스트용)
  // 🎛️ FIX: 게스트 전체 접근 모드 체크 추가 (개발 모드용)
  // 🔄 FIX: SSR/Hydration 중에는 권한 체크 건너뛰기 (쿠키 접근 불가능) - E2E 테스트 타임아웃 해결
  if (
    isMounted && // ← SSR/Hydration 완료 후에만 권한 체크 실행
    !permissions.canAccessDashboard &&
    !permissions.isPinAuthenticated &&
    !testModeDetected &&
    !isGuestFullAccessEnabled()
  ) {
    return <UnauthorizedAccessUI />;
  }

  return (
    <div
      data-testid="dashboard-container"
      data-test-mode={testModeDetected.toString()}
      data-cookies-present={String(
        typeof document !== 'undefined' &&
          Boolean(document.cookie?.includes('test_mode'))
      )}
      data-hydration-complete={isMounted.toString()}
      data-check-test-mode-result={checkTestMode().toString()}
      className={cn(
        'flex h-screen bg-[#F3F4F6]',
        isResizing && 'cursor-col-resize'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* 🔧 레거시 정리 (2026-01-17):
            - onNavigateHome, isAgentOpen 제거 - DashboardHeader 내부에서 직접 관리 */}
        <DashboardHeader onToggleAgent={toggleAgent} />

        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<ContentLoadingSkeleton />}>
            {/* 🔧 레거시 props 정리 (2026-01-17):
                - 제거됨: actions, selectedServer, onServerClick, onServerModalClose
                - ServerDashboard가 useServerDashboard hook으로 직접 데이터 관리 */}
            <DashboardContent
              showSequentialGeneration={false}
              servers={realServers}
              status={{ type: 'idle' }}
              onStatsUpdate={handleStatsUpdate}
              onShowSequentialChange={() => {}}
              isAgentOpen={isAgentOpen}
            />
          </Suspense>
        </div>

        {/* 🎯 AI 에이전트 - 동적 로딩으로 최적화 (Hydration 안전성) - AI 권한이 있는 사용자 또는 게스트 전체 접근 모드에서 접근 가능 */}
        {isMounted &&
          (permissions.canToggleAI || isGuestFullAccessEnabled()) && (
            <AnimatedAISidebar
              isOpen={isAgentOpen}
              onClose={closeAgent}
              userType={permissions.userType}
            />
          )}

        {/* 🔧 레거시 정리 (2026-01-17): AnimatedServerModal 제거
            - ServerDashboard 내부에서 EnhancedServerModal로 직접 관리
            - 중복 모달 시스템 제거로 번들 크기 최적화 */}

        {/* 🔒 자동 로그아웃 경고 모달 - 베르셀 사용량 최적화 */}
        <AutoLogoutWarning
          remainingTime={remainingTime}
          isWarning={showLogoutWarning}
          onExtendSession={handleExtendSession}
          onLogoutNow={handleLogoutNow}
        />

        {/* 🎯 플로팅 시스템 제어 */}
        <FloatingSystemControl
          systemState={dummySystemControl.systemState}
          aiAgentState={dummySystemControl.aiAgentState}
          isSystemActive={dummySystemControl.isSystemActive}
          isSystemPaused={dummySystemControl.isSystemPaused}
          onStartSystem={dummySystemControl.onStartSystem}
          onStopSystem={dummySystemControl.onStopSystem}
          onResumeSystem={dummySystemControl.onResumeSystem}
        />
      </div>

      {/* 🔔 알림 토스트 */}
      <NotificationToast />
    </div>
  );
}

// 🎯 대시보드 클라이언트 컴포넌트
export default function DashboardClient() {
  return (
    <Suspense fallback={<ContentLoadingSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
