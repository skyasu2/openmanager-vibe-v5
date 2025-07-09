'use client';

/**
 * 🚀 Dashboard Page - Commit 18a89a4 구조 복원
 *
 * DashboardHeader + DashboardContent + AI사이드바 통합 구조
 * 기존 백엔드 API 구조 유지하면서 UI만 복원
 */

import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import { NotificationToast } from '@/components/system/NotificationToast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { cn } from '@/lib/utils';
import { AISidebar } from '@/presentation/ai-sidebar';
import { systemInactivityService } from '@/services/system/SystemInactivityService';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

// --- Dynamic Imports ---
const DashboardHeader = dynamic(
  () => import('../../components/dashboard/DashboardHeader')
);
const DashboardContent = dynamic(
  () => import('../../components/dashboard/DashboardContent')
);
const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl')
);
const EnhancedServerModalDynamic = dynamic(
  () => import('../../components/dashboard/EnhancedServerModal'),
  {
    loading: () => (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
      </div>
    ),
  }
);

const ContentLoadingSkeleton = () => (
  <div className='min-h-screen bg-gray-100 dark:bg-gray-900 p-6'>
    <div className='space-y-6'>
      {/* 헤더 스켈레톤 */}
      <div className='h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse'></div>

      {/* 통계 카드 스켈레톤 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className='h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse'
          ></div>
        ))}
      </div>

      {/* 서버 카드 그리드 스켈레톤 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div
            key={i}
            className='h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse'
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
    console.error('🚨 Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
            <div className='text-center'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Dashboard Failed to Load
              </h2>
              <p className='text-gray-600 mb-4'>
                {this.state.error?.message || 'Unknown error'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg'
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
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const isResizing = false;

  // 🔒 자동 로그아웃 시스템 - 베르셀 사용량 최적화
  const { remainingTime, isWarning, resetTimer, forceLogout } = useAutoLogout({
    timeoutMinutes: 10, // 10분 비활성 시 로그아웃
    warningMinutes: 1,  // 1분 전 경고
    onWarning: () => {
      setShowLogoutWarning(true);
      console.log('⚠️ 자동 로그아웃 경고 표시 - 베르셀 사용량 최적화');
    },
    onLogout: () => {
      console.log('🔒 자동 로그아웃 실행 - 베르셀 사용량 최적화');
      systemInactivityService.pauseSystem();
    }
  });

  // 🎯 실제 서버 데이터 생성기 데이터 사용 - 즉시 로드
  const {
    paginatedServers: realServers,
    handleServerSelect,
    selectedServer: dashboardSelectedServer,
    handleModalClose: dashboardModalClose,
    isLoading: serverDataLoading,
  } = useServerDashboard({});

  // 🚀 대시보드 직접 접속 시 최적화된 초기화
  useEffect(() => {
    console.log('🎯 대시보드 직접 접속 - 최적화된 초기화');

    // 🔥 즉시 실행 최적화
    const initializeDashboard = async () => {
      try {
        // 필요한 경우에만 데이터 생성기 상태 확인
        const response = await fetch('/api/data-generator/status');
        const status = await response.json();

        if (!status.success || !status.data.isRunning) {
          console.log('📊 데이터 생성기 자동 시작');
          await fetch('/api/data-generator/start', { method: 'POST' });
        }
      } catch (error) {
        console.warn('⚠️ 데이터 생성기 초기화 실패 (폴백 데이터 사용):', error);
      }
    };

    // 🚀 비동기로 초기화 (블로킹하지 않음)
    initializeDashboard();
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentOpen(prev => !prev);
  }, []);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

  // 🔄 세션 연장 처리
  const handleExtendSession = useCallback(() => {
    resetTimer();
    setShowLogoutWarning(false);
    systemInactivityService.resumeSystem();
    console.log('🔄 사용자가 세션을 연장했습니다 - 베르셀 사용량 최적화');
  }, [resetTimer]);

  // 🔒 즉시 로그아웃 처리
  const handleLogoutNow = useCallback(() => {
    forceLogout();
    setShowLogoutWarning(false);
    console.log('🔒 사용자가 즉시 로그아웃을 선택했습니다');
  }, [forceLogout]);

  // 🎯 서버 클릭 핸들러 - 실제 데이터와 연동
  const handleServerClick = useCallback(
    (server: any) => {
      try {
        console.log('🖱️ 서버 카드 클릭됨:', server?.name || server?.id);
        if (!server) {
          console.warn('⚠️ 유효하지 않은 서버 데이터');
          return;
        }
        handleServerSelect(server);
        setSelectedServer(server);
        setIsServerModalOpen(true);
      } catch (error) {
        console.error('❌ 서버 클릭 처리 중 오류:', error);
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
      <div className='flex-1 flex flex-col min-h-0'>
        <DashboardHeader
          onNavigateHome={() => (window.location.href = '/')}
          onToggleAgent={toggleAgent}
          isAgentOpen={isAgentOpen}
        />

        <div className='flex-1 overflow-hidden'>
          <Suspense fallback={<ContentLoadingSkeleton />}>
            <DashboardContent
              showSequentialGeneration={false}
              servers={realServers}
              status={{ type: 'idle' }}
              actions={{ start: () => { }, stop: () => { } }}
              selectedServer={selectedServer || dashboardSelectedServer}
              onServerClick={handleServerClick}
              onServerModalClose={handleServerModalClose}
              onStatsUpdate={() => { }}
              onShowSequentialChange={() => { }}
              mainContentVariants={{}}
              isAgentOpen={isAgentOpen}
            />
          </Suspense>
        </div>

        {/* 🎯 AI 에이전트 */}
        <AnimatePresence>
          {isAgentOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className='fixed inset-y-0 right-0 w-96 z-40'
            >
              <AISidebar onClose={closeAgent} isOpen={isAgentOpen} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎯 서버 모달 */}
        <AnimatePresence>
          {isServerModalOpen && selectedServer && (
            <EnhancedServerModalDynamic
              server={selectedServer}
              onClose={handleServerModalClose}
            />
          )}
        </AnimatePresence>

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

// 🎯 대시보드 페이지 - 직접 접속 최적화
export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<ContentLoadingSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
