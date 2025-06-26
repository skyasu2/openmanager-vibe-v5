'use client';

import { NotificationToast } from '@/components/system/NotificationToast';
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { cn } from '@/lib/utils';
import { AISidebar } from '@/presentation/ai-sidebar';
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
const EnhancedServerModal = dynamic(
  () => import('../../components/dashboard/EnhancedServerModal')
);

const ContentLoadingSkeleton = () => (
  <div className='p-6 space-y-4'>
    <div className='w-full h-32 bg-gray-200 rounded-lg animate-pulse'></div>
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
  const [isClient, setIsClient] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const isResizing = false;

  // 🎯 실제 서버 데이터 생성기 데이터 사용
  const {
    paginatedServers: realServers,
    handleServerSelect,
    selectedServer: dashboardSelectedServer,
    handleModalClose: dashboardModalClose,
  } = useServerDashboard({});

  useEffect(() => {
    setIsClient(true);
    // 🚀 대시보드 직접 접속 시 시스템 자동 초기화
    console.log('🎯 대시보드 직접 접속 - 시스템 자동 초기화');
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentOpen(prev => !prev);
  }, []);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

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

  // 🚀 클라이언트 사이드 렌더링만 허용 (SSR 방지)
  if (!isClient) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            대시보드 초기화 중...
          </p>
        </div>
      </div>
    );
  }

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
        <main className='flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 lg:p-6 xl:p-8'>
          <DashboardContent
            showSequentialGeneration={false}
            servers={realServers}
            status={{ type: 'idle' }}
            actions={{ start: () => {}, stop: () => {} }}
            selectedServer={selectedServer || dashboardSelectedServer}
            onServerClick={handleServerClick}
            onServerModalClose={handleServerModalClose}
            onStatsUpdate={() => {}}
            onShowSequentialChange={() => {}}
            mainContentVariants={{}}
            isAgentOpen={isAgentOpen}
          />
        </main>
      </div>
      <AnimatePresence>
        {isAgentOpen && (
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <AISidebar onClose={closeAgent} isOpen={isAgentOpen} />
          </motion.aside>
        )}
      </AnimatePresence>
      <FloatingSystemControl {...dummySystemControl} />
      <NotificationToast />

      {/* 🎯 서버 상세 모달 */}
      {isServerModalOpen && (selectedServer || dashboardSelectedServer) && (
        <EnhancedServerModal
          server={selectedServer || dashboardSelectedServer}
          onClose={handleServerModalClose}
        />
      )}
    </div>
  );
}

// 🎯 대시보드 페이지 - 직접 접속 가능
export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<ContentLoadingSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
