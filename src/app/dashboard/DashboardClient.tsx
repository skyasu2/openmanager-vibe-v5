'use client';

/**
 * 🚀 Dashboard Client Component - 클라이언트 사이드 로직
 *
 * 서버 컴포넌트에서 전달받은 데이터로 UI를 렌더링
 */

import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import { NotificationToast } from '@/components/system/NotificationToast';
// AISidebarV2는 필요시에만 동적 로드
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { useSystemAutoShutdown } from '@/hooks/useSystemAutoShutdown';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';
import { systemInactivityService } from '@/services/system/SystemInactivityService';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import type { Server } from '@/types/server';
// framer-motion은 필요시에만 동적 로드
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import debug from '@/utils/debug';

// 🎯 타입 변환 헬퍼 함수 - 재사용 가능하도록 분리
function convertServerToModalData(server: Server) {
  return {
    ...server,
    hostname: server.hostname || server.name,
    type: server.type || 'server',
    environment: server.environment || 'production',
    provider: server.provider || 'Unknown',
    alerts: Array.isArray(server.alerts) ? server.alerts.length : (server.alerts || 0),
    services: server.services || [],
    lastUpdate: server.lastUpdate || new Date(),
    uptime: typeof server.uptime === 'number' 
      ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m`
      : server.uptime || '0h 0m',
    status: (
      server.status === 'online' ? 'healthy' : 
      server.status === 'critical' ? 'critical' :
      server.status === 'warning' ? 'warning' :
      server.status === 'offline' ? 'offline' :
      'healthy'
    ),
    networkStatus: (
      server.status === 'online' || server.status === 'healthy' ? 'excellent' :
      server.status === 'warning' ? 'good' :
      server.status === 'critical' ? 'poor' :
      'offline'
    ),
  };
}

// --- Dynamic Imports with Preload ---
const DashboardHeader = dynamic(
  () => import('../../components/dashboard/DashboardHeader'),
  { 
    loading: () => <div className="h-16 bg-white dark:bg-gray-800 animate-pulse" />,
    ssr: true // SSR 활성화로 초기 로딩 개선
  }
);
const DashboardContent = dynamic(
  () => import('../../components/dashboard/DashboardContent'),
  { 
    loading: () => <ContentLoadingSkeleton />,
    ssr: true // SSR 활성화로 초기 로딩 개선
  }
);
const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl'),
  {
    ssr: false // 클라이언트 전용 컴포넌트
  }
);
// EnhancedServerModal은 AnimatedServerModal로 통합됨

// AI Sidebar를 framer-motion과 함께 동적 로드
const AnimatedAISidebar = dynamic(
  async () => {
    const [{ AnimatePresence, motion }, AISidebarV2] = await Promise.all([
      import('framer-motion'),
      import('@/domains/ai-sidebar/components/AISidebarV2'),
    ]);
    
    return function AnimatedAISidebarWrapper({ 
      isOpen, 
      onClose, 
      ...props 
    }: { 
      isOpen: boolean; 
      onClose: () => void; 
    }) {
      return (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-40 w-96"
            >
              <AISidebarV2.default onClose={onClose} isOpen={isOpen} {...props} />
            </motion.div>
          )}
        </AnimatePresence>
      );
    };
  },
  {
    loading: () => (
      <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    ),
  }
);

// 서버 모달을 framer-motion과 함께 동적 로드
const AnimatedServerModal = dynamic(
  async () => {
    const [{ AnimatePresence }, EnhancedServerModal] = await Promise.all([
      import('framer-motion'),
      import('../../components/dashboard/EnhancedServerModal'),
    ]);
    
    return function AnimatedServerModalWrapper({ 
      isOpen, 
      server,
      onClose 
    }: { 
      isOpen: boolean; 
      server: Server | null;
      onClose: () => void; 
    }) {
      // 🎯 서버 데이터 변환 헬퍼 함수 사용
      const serverData = server ? convertServerToModalData(server) : null;
      
      return (
        <AnimatePresence>
          {isOpen && serverData && (
            <EnhancedServerModal.default
              server={serverData}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      );
    };
  },
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      </div>
    ),
  }
);

const ContentLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="animate-pulse h-16 rounded-lg bg-gray-200 dark:bg-gray-800"></div>

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse h-24 rounded-lg bg-gray-200 dark:bg-gray-800"
          ></div>
        ))}
      </div>

      {/* 서버 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="animate-pulse h-48 rounded-lg bg-gray-200 dark:bg-gray-800"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Error Boundary for Dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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

function DashboardPageContent() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [_showSystemWarning, setShowSystemWarning] = useState(false);
  const isResizing = false;

  // 🔄 실제 시스템 상태 확인
  const { status: _systemStatus, isLoading: _systemStatusLoading } =
    useSystemStatus();

  // 🛑 시스템 정지 함수
  const { stopSystem } = useUnifiedAdminStore();

  // 🔒 자동 로그아웃 시스템 - 베르셀 사용량 최적화
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

  // 🕐 20분 시스템 자동 종료 - 포트폴리오 최적화
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

  // 🕐 시간 포맷팅
  const remainingTimeFormatted = formatTime
    ? formatTime(systemRemainingTime)
    : '00:00';

  const toggleAgent = useCallback(() => {
    setIsAgentOpen((prev) => !prev);
  }, []);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

  // 🔄 세션 연장 처리
  const handleExtendSession = useCallback(() => {
    resetTimer();
    setShowLogoutWarning(false);
    systemInactivityService.resumeSystem();
    debug.log('🔄 사용자가 세션을 연장했습니다 - 베르셀 사용량 최적화');
  }, [resetTimer]);

  // 🔒 즉시 로그아웃 처리
  const handleLogoutNow = useCallback(() => {
    forceLogout();
    setShowLogoutWarning(false);
    debug.log('🔒 사용자가 즉시 로그아웃을 선택했습니다');
  }, [forceLogout]);

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
  }, [dashboardModalClose]);

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

  return (
    <div
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
              onStatsUpdate={() => {}}
              onShowSequentialChange={() => {}}
              mainContentVariants={{}}
              isAgentOpen={isAgentOpen}
            />
          </Suspense>
        </div>

        {/* 🎯 AI 에이전트 - 동적 로딩으로 최적화 */}
        <AnimatedAISidebar isOpen={isAgentOpen} onClose={closeAgent} />

        {/* 🎯 서버 모달 - 동적 로딩으로 최적화 */}
        <AnimatedServerModal 
          isOpen={isServerModalOpen} 
          server={selectedServer} 
          onClose={handleServerModalClose} 
        />

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
    <DashboardErrorBoundary>
      <Suspense fallback={<ContentLoadingSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
