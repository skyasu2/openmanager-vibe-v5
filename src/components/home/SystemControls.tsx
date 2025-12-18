'use client';

import { BarChart3, Bot, Loader2, LogIn, Play, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useMemo } from 'react';
import {
  isGuestFullAccessEnabled,
  isGuestSystemStartEnabled,
} from '@/config/guestMode';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

interface SystemControlsProps {
  isGitHubUser: boolean;
  systemStartCountdown: number;
  isSystemStarting: boolean;
  isLoading: boolean;
  onSystemToggle: () => void;
  onDashboardClick: () => void;
}

const SystemControls = memo(function SystemControls({
  isGitHubUser,
  systemStartCountdown,
  isSystemStarting,
  isLoading,
  onSystemToggle,
  onDashboardClick,
}: SystemControlsProps) {
  const router = useRouter();
  const { isSystemStarted } = useUnifiedAdminStore();
  const { status: multiUserStatus, isLoading: statusLoading } =
    useSystemStatus();
  const permissions = useUserPermissions();

  const guestFullAccess = isGuestFullAccessEnabled();
  const guestSystemStartAllowed = isGuestSystemStartEnabled();
  const isGuestUser = permissions.userType === 'guest';
  const userCanControlSystem =
    isGitHubUser || guestFullAccess || (isGuestUser && guestSystemStartAllowed);

  // 버튼 설정 메모이제이션
  const buttonConfig = useMemo(() => {
    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: <X className="h-5 w-5" />,
        className:
          'bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
      };
    }

    if (isSystemStarting) {
      return {
        text: '시스템 시작 중...',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className:
          'bg-linear-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
      };
    }

    if (isLoading || statusLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
      };
    }

    if (multiUserStatus?.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
        icon: <BarChart3 className="h-5 w-5" />,
        className:
          'bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
      };
    }

    return {
      text: '🚀 시스템 시작',
      icon: <Play className="h-5 w-5" />,
      className:
        'bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
    };
  }, [
    systemStartCountdown,
    isSystemStarting,
    isLoading,
    statusLoading,
    multiUserStatus,
    isSystemStarted,
  ]);

  if (!isSystemStarted) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex flex-col items-center space-y-4">
          {/* GitHub 사용자 또는 전체 접근 게스트 */}
          {userCanControlSystem ? (
            <>
              <button
                onClick={onSystemToggle}
                disabled={isLoading || isSystemStarting}
                className={`flex h-16 w-64 items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 ${buttonConfig.className}`}
              >
                {systemStartCountdown > 0 && (
                  <div
                    className="absolute inset-0 overflow-hidden rounded-xl"
                    style={{ transformOrigin: 'left' }}
                  >
                    <div className="h-full bg-linear-to-r from-red-600/40 via-red-500/40 to-red-400/40" />
                  </div>
                )}
                <div className="relative z-10 flex items-center gap-3">
                  {buttonConfig.icon}
                  <span className="text-lg">{buttonConfig.text}</span>
                </div>
              </button>

              <div className="mt-2 flex flex-col items-center gap-1">
                <span
                  className={`text-sm font-medium opacity-80 transition-all duration-300 ${
                    systemStartCountdown > 0
                      ? 'text-orange-300'
                      : isSystemStarting
                        ? 'text-purple-300'
                        : multiUserStatus?.isRunning
                          ? 'text-green-300'
                          : 'text-white'
                  }`}
                >
                  {systemStartCountdown > 0
                    ? '⚠️ 시작 예정 - 취소하려면 클릭'
                    : isSystemStarting
                      ? '🚀 시스템 부팅 중...'
                      : multiUserStatus?.isRunning || isSystemStarted
                        ? '✅ 시스템 가동 중 - 대시보드로 이동'
                        : '클릭하여 시작하기'}
                </span>
              </div>
            </>
          ) : (
            /* 권한 없는 게스트 사용자 */
            <div className="text-center">
              <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
                <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  GitHub 로그인이 필요합니다
                </h3>
                <p className="mb-4 text-sm text-blue-100">
                  기본적으로 시스템 제어는 GitHub 사용자에게만 허용되지만,
                  현재는 개발 편의성을 위해 게스트도 동일한 기능을 테스트
                  중입니다.
                </p>
                <p className="mb-4 text-xs text-blue-200/80">
                  💡 게스트 제한을 다시 적용하려면 환경 변수{' '}
                  <span className="ml-1 rounded bg-blue-900/40 px-1 py-0.5 text-[10px]">
                    NEXT_PUBLIC_GUEST_MODE
                  </span>{' '}
                  또는{' '}
                  <span className="ml-1 rounded bg-blue-900/40 px-1 py-0.5 text-[10px]">
                    NEXT_PUBLIC_GUEST_SYSTEM_START_ENABLED
                  </span>{' '}
                  값을 조정하세요.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  로그인 페이지로 이동
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 시스템이 시작된 후 상태
  return (
    <div className="text-center">
      {userCanControlSystem ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-8">
          <div className="mb-4 flex items-center justify-center">
            <Bot className="h-16 w-16 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            🎉 시스템이 성공적으로 시작되었습니다!
          </h2>
          <p className="mb-4 text-emerald-100">
            모든 서비스가 정상 작동 중입니다. 대시보드에서 실시간 모니터링을
            확인하세요.
          </p>
          <button
            onClick={onDashboardClick}
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-700 hover:scale-105"
          >
            📊 대시보드 열기
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
          <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            시스템이 실행 중입니다
          </h3>
          <p className="mb-4 text-sm text-blue-100">
            게스트 제한이 활성화된 경우 GitHub 로그인 후 대시보드에 접근할 수
            있습니다.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            로그인하기
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-white/60">
        시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을 확인하세요.
      </p>
    </div>
  );
});

export default SystemControls;
