/**
 * 🚀 시스템 시작 로직 Hook
 *
 * 메인 페이지에서 추출된 시스템 시작 관련 로직
 * - 카운트다운 관리
 * - 시작/정지 토글
 * - 버튼 상태 계산
 */

import { BarChart3, Loader2, Play, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import debug from '@/utils/debug';
import { debugWithEnv } from '@/utils/vercel-env-utils';

const SYSTEM_START_COUNTDOWN_SECONDS = 3;
const COUNTDOWN_INTERVAL_MS = 1000;

interface UseSystemStartOptions {
  isAuthenticated: boolean;
  isGitHubUser: boolean;
  authLoading: boolean;
  isMounted: boolean;
  guestSystemStartEnabled: boolean;
}

interface StatusInfo {
  color: string;
  message: string;
  showEscHint: boolean;
}

interface ButtonConfig {
  text: string;
  icon: React.ReactNode;
  className: string;
  disabled: boolean;
}

export function useSystemStart(options: UseSystemStartOptions) {
  const {
    isAuthenticated,
    isGitHubUser,
    authLoading,
    isMounted,
    guestSystemStartEnabled,
  } = options;

  const router = useRouter();
  const pathname = usePathname();

  const { isSystemStarted, startSystem } = useUnifiedAdminStore();

  const {
    status: multiUserStatus,
    isLoading: statusLoading,
    startSystem: startMultiUserSystem,
  } = useSystemStatus();

  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isSystemStarting, setIsSystemStarting] = useState(false);

  // ESC 키로 카운트다운 취소
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

  // 타이머 클린업
  useEffect(() => {
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [countdownTimer]);

  // 시스템 시작 상태 동기화
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

  // 상태 정보 계산
  const statusInfo: StatusInfo = useMemo(() => {
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

  // 시스템 토글 핸들러
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

    // 카운트다운 중이면 취소
    if (systemStartCountdown > 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      setCountdownTimer(null);
      setSystemStartCountdown(0);
      setIsSystemStarting(false);
      return;
    }

    // 이미 실행 중이면 대시보드로 이동
    if (multiUserStatus?.isRunning || isSystemStarted) {
      if (pathname !== '/dashboard') router.push('/dashboard');
    } else {
      // 카운트다운 시작
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

  // 버튼 설정 계산
  const buttonConfig: ButtonConfig = useMemo(() => {
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

  return {
    // 상태
    systemStartCountdown,
    isSystemStarting,
    isSystemStarted,
    multiUserStatus,
    statusLoading,

    // 계산된 값
    statusInfo,
    buttonConfig,

    // 액션
    handleSystemToggle,
    navigateToDashboard: () => router.push('/dashboard'),
  };
}

export type { StatusInfo, ButtonConfig };
