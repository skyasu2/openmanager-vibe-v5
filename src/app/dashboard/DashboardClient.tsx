'use client';

/**
 * 🚀 Dashboard Client Component - 클라이언트 사이드 로직 v5.1.0
 *
 * 서버 컴포넌트에서 전달받은 데이터로 UI를 렌더링
 * 🔧 Fixed: TypeError w is not a function (usePerformanceGuard disabled)
 */

import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import { NotificationToast } from '@/components/system/NotificationToast';
// AISidebarV2는 필요시에만 동적 로드
import { useAutoLogout } from '@/hooks/useAutoLogout';
// import { usePerformanceGuard } from '@/hooks/usePerformanceGuard'; // 🛡️ 성능 모니터링 - 임시 비활성화
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useToast } from '@/hooks/use-toast';
import { useSystemAutoShutdown } from '@/hooks/useSystemAutoShutdown';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useAdminMode } from '@/stores/auth-store'; // Phase 2: Zustand 인증 상태
import { useAISidebarStore } from '@/stores/useAISidebarStore'; // AI 사이드바 상태
import { cn } from '@/lib/utils';
import { systemInactivityService } from '@/services/system/SystemInactivityService';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import type { Server } from '@/types/server';
import type { ServerData } from '@/components/dashboard/EnhancedServerModal.types';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { useRouter } from 'next/navigation';
import debug from '@/utils/debug';
// 🛡️ 베르셀 안전 유틸리티 import 추가 (Bundle-Safe Inline으로 l6 압축 방지)
import { handleVercelError } from '@/lib/vercel-safe-utils';

// 🎯 Bundle-Safe Inline 매크로 - getSafeArrayLength (압축 방지)
const getSafeArrayLength = (arr: unknown): number => {
  try {
    // 🛡️ Vercel 환경 Race Condition 완전 방어 - 5중 검증
    if (arr === null || arr === undefined) return 0;
    const arrType = typeof arr;
    if (arrType !== 'object') return 0;
    if (arr === null || arr === undefined) return 0;
    const isArrayResult = Array.isArray(arr);
    if (!isArrayResult) return 0;
    if (!arr || !Array.isArray(arr)) return 0;
    if (!Object.prototype.hasOwnProperty.call(arr, 'length')) return 0;

    const lengthValue = (() => {
      try {
        const tempArr = arr as unknown[];
        if (!tempArr || !Array.isArray(tempArr)) return 0;
        const tempLength = tempArr.length;
        if (typeof tempLength !== 'number') return 0;
        return tempLength;
      } catch {
        return 0;
      }
    })();

    if (isNaN(lengthValue) || lengthValue < 0) return 0;
    return Math.floor(lengthValue);
  } catch (error) {
    console.error('🛡️ getSafeArrayLength Bundle-Safe error:', error);
    return 0;
  }
};

// 🎯 Bundle-Safe Inline 매크로 - vercelSafeLog (압축 방지)
const vercelSafeLog = (message: string, data?: unknown): void => {
  if (typeof process !== 'undefined' && process.env &&
      (process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined) &&
      process.env.NODE_ENV === 'development') {
    console.log(`🛡️ [Vercel Safe] ${message}`, data);
  }
};

// 🎯 타입 변환 헬퍼 함수 - 재사용 가능하도록 분리
function convertServerToModalData(server: Server): ServerData {
  return {
    ...server,
    hostname: server.hostname || server.name,
    type: server.type || 'server',
    environment: server.environment || 'production',
    provider: server.provider || 'Unknown',
        // 🚀 FIX: getSafeArrayLength로 베르셀 안전성 보장 (l6 TypeError 완전 해결)
        alerts: (() => {
          try {
            if (Array.isArray(server.alerts)) {
              return getSafeArrayLength(server.alerts);
            }
            if (typeof server.alerts === 'number') {
              return Math.max(0, server.alerts);
            }
            return 0;
          } catch (error) {
            vercelSafeLog('convertServerToModalData alerts 처리 오류:', error);
            return 0;
          }
        })(),
        // 🛡️ services 배열도 베르셀 안전 처리
        services: (() => {
          try {
            const serverServices = server.services || [];
            if (!Array.isArray(serverServices)) {
              return [];
            }
            return serverServices.map(service => ({
              name: service?.name || 'Unknown Service',
              status: service?.status || 'running',
              port: service?.port || 80
            }));
          } catch (error) {
            vercelSafeLog('convertServerToModalData services 처리 오류:', error);
            return [];
          }
        })(),
    lastUpdate: server.lastUpdate || new Date(),
    uptime:
      typeof server.uptime === 'number'
        ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m`
        : server.uptime || '0h 0m',
    status: server.status, // 🔧 수정: ServerStatus 타입 직접 사용 (타입 통합 완료)
    networkStatus: (server.status === 'online' // 🔧 수정: 'healthy' 제거 (타입 통합)
        ? 'excellent'
        : server.status === 'warning'
          ? 'good'
          : server.status === 'critical'
            ? 'poor'
            : 'offline') as 'excellent' | 'good' | 'poor' | 'offline',
  };
}

// --- Static Imports for Core Components (SSR bailout 해결) ---
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardContent from '../../components/dashboard/DashboardContent';
const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl'),
  {
    ssr: false, // 클라이언트 전용 컴포넌트 (변경 없음)
  }
);
// EnhancedServerModal은 AnimatedServerModal로 통합됨

// AI Sidebar를 CSS 애니메이션으로 동적 로드
const AnimatedAISidebar = dynamic(
  async () => {
    const AISidebarV3 = await import('@/domains/ai-sidebar/components/AISidebarV3');

    return function AnimatedAISidebarWrapper(props: { isOpen: boolean; onClose: () => void; [key: string]: unknown }) {
      const { isOpen, onClose, ...otherProps } = props;
      return (
        <>
          {isOpen && (
            <div
              className="fixed inset-y-0 right-0 z-40 w-96 transform transition-transform duration-300 ease-in-out"
              style={{
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
              }}
            >
              <AISidebarV3.default
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

// 서버 모달을 CSS 애니메이션으로 동적 로드
const AnimatedServerModal = dynamic(
  async () => {
    const EnhancedServerModal = await import('../../components/dashboard/EnhancedServerModal');

    return function AnimatedServerModalWrapper({
      isOpen,
      server,
      onClose,
    }: {
      isOpen: boolean;
      server: Server | null; // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
      onClose: () => void;
    }) {
      // 🎯 서버 데이터 변환 헬퍼 함수 사용
      const serverData = server ? convertServerToModalData(server) : null;

      return (
        <>
          {isOpen && serverData && (
            <EnhancedServerModal.default
              server={serverData}
              onClose={onClose}
            />
          )}
        </>
      );
    };
  },
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      </div>
    ),
    ssr: false, // 클라이언트 전용 컴포넌트
  }
);

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

// Error Boundary for Dashboard
class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debug.error('🚨 Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Dashboard Failed to Load
              </h2>
              <p className="mb-4 text-gray-600">
                {this.state.error?.message || 'Unknown error'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 🧪 테스트 모드 체크 함수 (컴포넌트 외부로 이동 - E2E 테스트용)
function checkTestMode(): boolean {
  console.log('🧪 [Dashboard] checkTestMode() 함수 실행 시작');

  // SSR 환경 체크
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.log('🧪 [Dashboard] SSR 환경 - 테스트 모드 체크 스킵');
    return false;
  }

  // 쿠키 체크
  const allCookies = document.cookie;
  console.log('🧪 [Dashboard] 전체 쿠키:', allCookies);

  const cookies = document.cookie.split(';').map(c => c.trim());
  const hasTestMode = cookies.some(c => c.startsWith('test_mode=enabled'));
  const hasTestToken = cookies.some(c => c.startsWith('vercel_test_token='));

  console.log('🧪 [Dashboard] test_mode 쿠키 존재:', hasTestMode);
  console.log('🧪 [Dashboard] vercel_test_token 쿠키 존재:', hasTestToken);

  if (hasTestMode || hasTestToken) {
    console.log('🧪 [Dashboard] 테스트 모드 감지 (쿠키) ✅');
    return true;
  }

  // localStorage 체크 (보조)
  const testModeEnabled = localStorage.getItem('test_mode_enabled') === 'true';
  console.log('🧪 [Dashboard] localStorage test_mode_enabled:', testModeEnabled);

  if (testModeEnabled) {
    console.log('🧪 [Dashboard] 테스트 모드 감지 (localStorage) ✅');
    return true;
  }

  console.log('🧪 [Dashboard] 테스트 모드 감지 실패 ❌');
  return false;
}

function DashboardPageContent() {
  // 🔒 Hydration 불일치 방지를 위한 클라이언트 전용 상태
  const [isMounted, setIsMounted] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null); // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [_showSystemWarning, setShowSystemWarning] = useState(false);
  const isResizing = false;

  // 🔒 새로운 권한 시스템 사용
  const router = useRouter();
  const { toast } = useToast();
  const permissions = useUserPermissions();

  // 🎯 AI 사이드바 상태 (중앙 관리)
  const { isOpen: isAgentOpen, setOpen: setIsAgentOpen } = useAISidebarStore();
  const isPinAuth = useAdminMode(); // Phase 2: Zustand로 PIN 인증 상태 직접 확인 (5배 빠름)
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🔥 강화된 권한 체크 (비동기 인증 상태 타이밍 문제 해결)
  useEffect(() => {
    if (!isMounted) return;

    // 🎛️ 환경 변수 기반 게스트 모드 체크
    const isGuestFullAccess = isGuestFullAccessEnabled();

    if (isGuestFullAccess) {
      // 🟢 게스트 전체 접근 모드: 즉시 허용
      console.log('✅ DashboardClient: 게스트 전체 접근 모드 - 즉시 허용 (NEXT_PUBLIC_GUEST_MODE=full_access)');
      setAuthLoading(false);
      return; // cleanup 불필요
    } else {
      // 🔐 프로덕션 모드: 권한 체크
      const checkPermissions = () => {
        const canAccess = permissions.canAccessDashboard || isPinAuth || checkTestMode();
        
        console.log('🔍 대시보드 권한 체크:', {
          hookAuth: permissions.canAccessDashboard,
          canAccess: canAccess,
          userType: permissions.userType,
          loading: permissions.userType === 'loading'
        });
        
        if (permissions.userType === 'loading') {
          console.log('⏳ 권한 상태 로딩 중 - 알람 억제');
          return;
        }

        if (!canAccess && (permissions.userType === 'guest' || permissions.userType === 'github')) {
          console.log('🚫 대시보드 접근 권한 없음 - 메인 페이지로 이동');
          toast({
            variant: 'destructive',
            title: '접근 권한 없음',
            description: '대시보드 접근 권한이 없습니다. GitHub 로그인 또는 관리자 모드 인증이 필요합니다.',
          });
          router.push('/main');
          return;
        }
        
        if (canAccess) {
          console.log('✅ 대시보드 접근 권한 확인됨:', {
            userType: permissions.userType,
            userName: permissions.userName,
            canAccessDashboard: permissions.canAccessDashboard,
            isPinAuthenticated: permissions.isPinAuthenticated,
            isGitHubAuthenticated: permissions.isGitHubAuthenticated,
          });
          
          setAuthLoading(false);
        }
      };
      
      const timeoutId = setTimeout(checkPermissions, 500);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
  }, [isMounted, permissions, router]);

  // 🎯 서버 통계 상태 관리 (상단 통계 카드용)
  const [serverStats, setServerStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });

  // 🔄 실제 시스템 상태 확인
  const { status: _systemStatus, isLoading: _systemStatusLoading } =
    useSystemStatus();

  // 🛡️ 성능 가드 - 임시 비활성화 (TypeError 문제 해결 중)
  // const { warningCount, generateReport } = usePerformanceGuard({
  //   minTimerInterval: 5000, // 5초 최소값
  //   memoryWarningThreshold: 100, // 100MB 경고 임계값
  //   localStorageAccessLimit: 60, // 분당 60회 제한
  //   devOnly: true // 개발 환경에서만 활성화 (프로덕션 안전)
  // });
  const warningCount = 0;
  const generateReport = () => ({ warningCount: 0, isEdgeRuntime: false });

  // 🛑 시스템 제어 함수들
  const { isSystemStarted, startSystem, stopSystem } = useUnifiedAdminStore();

  // 🔒 자동 로그아웃 시스템 - 베르셀 사용량 최적화 (1초→10초 최적화 적용)
  const {
    remainingTime,
    isWarning: _isWarning,
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
    isSystemActive,
    remainingTime: systemRemainingTime,
    formatTime,
    isWarning: _isSystemWarning,
    restartSystem: _restartSystem,
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

  // 🎯 실제 서버 데이터 생성기 데이터 사용 - 즉시 로드
  const {
    paginatedServers: realServers,
    handleServerSelect,
    selectedServer: dashboardSelectedServer,
    handleModalClose: dashboardModalClose,
    isLoading: _serverDataLoading,
  } = useServerDashboard({});

  // 🕐 Supabase에서 24시간 데이터를 직접 가져오므로 시간 회전 시스템 제거됨
  // API가 30초마다 다른 시간대 데이터를 자동으로 반환

  // 🚀 대시보드 초기화 - Supabase에서 직접 데이터 로드
  useEffect(() => {
    debug.log('🎯 대시보드 초기화 - Supabase hourly_server_states 테이블 사용');
    // Supabase에서 24시간 데이터를 직접 가져오므로 별도 초기화 불필요
  }, []);

  // 🚀 시스템 자동 시작 로직 - "시스템 종료됨" 문제 해결
  useEffect(() => {
    if (!isSystemStarted) {
      debug.log('🚀 시스템이 종료된 상태입니다. 자동으로 시작합니다.');
      startSystem();
    }
  }, [isSystemStarted]); // ✅ startSystem 함수 의존성 제거하여 순환 의존성 해결

  // 🛡️ 성능 가드 경고 모니터링 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && warningCount > 0) {
      console.group('🚨 Performance Guard Warnings');
      console.warn(`성능 경고 ${warningCount}개 발견! 베르셀 Edge Runtime 문제 예방을 위해 확인하세요.`);
      console.log('성능 리포트 확인:', generateReport());
      console.log('해결 방법: docs/development/performance-development-checklist.md 참고');
      console.groupEnd();
    }
  }, [warningCount]); // ✅ generateReport 함수 의존성 제거하여 순환 의존성 해결

  // 🕐 시간 포맷팅
  const remainingTimeFormatted = formatTime
    ? formatTime(systemRemainingTime)
    : '00:00';

  const toggleAgent = useCallback(() => {
    // 🔒 AI 기능은 권한이 있는 사용자 또는 게스트 전체 접근 모드에서 사용 가능
    if (!permissions.canToggleAI && !isGuestFullAccessEnabled()) {
      console.log('🚫 AI 사이드바 접근 차단 - AI 사용 권한 필요');
      // 토스트 메시지로 안내 (선택사항)
      return;
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
  }, []); // ✅ resetTimer 함수 의존성 제거하여 순환 의존성 해결

  // 🔒 즉시 로그아웃 처리
  const handleLogoutNow = useCallback(() => {
    forceLogout();
    setShowLogoutWarning(false);
    debug.log('🔒 사용자가 즉시 로그아웃을 선택했습니다');
  }, []); // ✅ forceLogout 함수 의존성 제거하여 순환 의존성 해결

  // 🎯 통계 업데이트 핸들러 (상단 통계 카드 업데이트)
  const handleStatsUpdate = useCallback((stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => {
    console.log('📊 통계 업데이트 수신:', stats);
    setServerStats(stats);
  }, []);

  // 🎯 서버 클릭 핸들러 - 실제 데이터와 연동
  const handleServerClick = useCallback(
    (server: Server) => {
      try {
        debug.log('🖱️ 서버 카드 클릭됨:', server?.name || server?.id);
        if (!server) {
          debug.warn('⚠️ 유효하지 않은 서버 데이터');
          return;
        }
        handleServerSelect(server);
        setSelectedServer(server);
        setIsServerModalOpen(true);
      } catch (error) {
        debug.error('❌ 서버 클릭 처리 중 오류:', error);
      }
    },
    [handleServerSelect]
  );

  // 🔒 서버 모달 닫기
  const handleServerModalClose = useCallback(() => {
    dashboardModalClose();
    setSelectedServer(null);
    setIsServerModalOpen(false);
  }, []); // ✅ dashboardModalClose 함수 의존성 제거하여 순환 의존성 해결

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
  if ((!isMounted || authLoading || permissions.userType === 'loading') && !checkTestMode()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">로딩 중...</h2>
            <p className="text-gray-300 mb-6">
              권한을 확인하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🔒 대시보드 접근 권한이 없는 경우 (GitHub 로그인 또는 PIN 인증 또는 테스트 모드 또는 게스트 전체 접근 모드 필요)
  // 🧪 FIX: 테스트 모드 체크 추가 (E2E 테스트용)
  // 🎛️ FIX: 게스트 전체 접근 모드 체크 추가 (개발 모드용)
  if (!permissions.canAccessDashboard && !isPinAuth && !checkTestMode() && !isGuestFullAccessEnabled()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">접근 권한 필요</h2>
            <p className="text-gray-300 mb-6">
              대시보드 접근을 위해 GitHub 로그인 또는 관리자 PIN 인증이 필요합니다.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200"
            >
              GitHub 로그인
            </button>
            
            <button
              onClick={() => router.push('/main')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 px-6 rounded-lg font-medium transition-all duration-200"
            >
              메인 페이지로 돌아가기
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            게스트 모드에서는 관리자 PIN 인증으로 대시보드 접근이 가능합니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="dashboard-container"
      className={cn(
        'flex h-screen bg-gray-100 dark:bg-gray-900',
        isResizing && 'cursor-col-resize'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DashboardHeader
          onNavigateHome={() => (window.location.href = '/main')}
          onToggleAgent={toggleAgent}
          isAgentOpen={isAgentOpen}
          systemRemainingTime={systemRemainingTime}
          isSystemActive={isSystemActive}
          onSystemStop={stopSystem}
          remainingTimeFormatted={remainingTimeFormatted}
        />

        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<ContentLoadingSkeleton />}>
            <DashboardContent
              showSequentialGeneration={false}
              servers={realServers}
              status={{ type: 'idle' }}
              actions={{ startSystem: () => {}, stopSystem: () => {} }}
              selectedServer={selectedServer || dashboardSelectedServer}
              onServerClick={handleServerClick}
              onServerModalClose={handleServerModalClose}
              onStatsUpdate={handleStatsUpdate}
              onShowSequentialChange={() => {}}
              isAgentOpen={isAgentOpen}
            />
          </Suspense>
        </div>

        {/* 🎯 AI 에이전트 - 동적 로딩으로 최적화 (Hydration 안전성) - AI 권한이 있는 사용자 또는 게스트 전체 접근 모드에서 접근 가능 */}
        {isMounted && (permissions.canToggleAI || isGuestFullAccessEnabled()) && (
          <AnimatedAISidebar
            isOpen={isAgentOpen}
            onClose={closeAgent}
            userType={permissions.userType}
          />
        )}

        {/* 🎯 서버 모달 - 동적 로딩으로 최적화 (Hydration 안전성 추가) */}
        {isMounted && (
          <AnimatedServerModal
            isOpen={isServerModalOpen}
            server={selectedServer}
            onClose={handleServerModalClose}
          />
        )}

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
