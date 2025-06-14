'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Monitor, Bot, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationToast } from '@/components/system/NotificationToast';
import { cn } from '@/lib/utils';
import React from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import Link from 'next/link';
import { AISidebar } from '@/presentation/ai-sidebar';

// 🚨 React 내장 에러 바운더리
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
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
          <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4'>
            <div className='text-center'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                🚨 대시보드 로딩 오류
              </h2>
              <p className='text-gray-600 mb-4'>
                대시보드 로딩 중 문제가 발생했습니다.
              </p>
              <div className='text-sm text-gray-500 mb-6'>
                <p>Supabase 연결 또는 컴포넌트 로딩 오류일 수 있습니다.</p>
              </div>
              <div className='space-y-3'>
                <button
                  onClick={() => window.location.reload()}
                  className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                >
                  새로고침
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className='w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300'
                >
                  홈으로 돌아가기
                </button>
                <Link
                  href='/test-supabase'
                  className='w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
                >
                  Supabase 연결 테스트
                </Link>
                <Link
                  href='/system-boot'
                  className='w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700'
                >
                  부팅 애니메이션 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ⚡ Dynamic Import로 코드 스플리팅 적용 (Vercel 최적화)
const DashboardHeader = dynamic(
  () => import('../../components/dashboard/DashboardHeader'),
  {
    ssr: false,
    loading: () => <HeaderLoadingSkeleton />,
  }
);

const DashboardContent = dynamic(
  () => import('../../components/dashboard/DashboardContent'),
  {
    ssr: false,
    loading: () => <ContentLoadingSkeleton />,
  }
);

const SystemStatusDisplay = dynamic(
  () => import('../../components/dashboard/SystemStatusDisplay'),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
);

const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl'),
  {
    ssr: false,
    loading: () => (
      <div className='fixed bottom-6 right-6 w-14 h-14 bg-gray-200 rounded-full animate-pulse' />
    ),
  }
);

// 로딩 컴포넌트들
const LoadingSpinner = () => (
  <div className='flex items-center justify-center h-8'>
    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
  </div>
);

const HeaderLoadingSkeleton = () => (
  <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'>
    <div className='flex items-center justify-between px-6 py-4'>
      <div className='flex items-center gap-4'>
        <div className='w-8 h-8 bg-gray-200 rounded-lg animate-pulse'></div>
        <div>
          <div className='w-32 h-5 bg-gray-200 rounded animate-pulse'></div>
          <div className='w-24 h-3 bg-gray-100 rounded animate-pulse mt-1'></div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <div className='w-24 h-8 bg-gray-200 rounded animate-pulse'></div>
        <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
      </div>
    </div>
  </header>
);

const ContentLoadingSkeleton = () => (
  <div className='p-6 space-y-4'>
    <div className='w-full h-32 bg-gray-200 rounded-lg animate-pulse'></div>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className='w-full h-48 bg-gray-200 rounded-lg animate-pulse'
        ></div>
      ))}
    </div>
  </div>
);

function DashboardPageContent() {
  const {
    isAgentOpen,
    isClient,
    selectedServer,
    serverStats,

    // Actions
    setSelectedServer,
    setShowSequentialGeneration,

    // Handlers
    handleServerClick,
    toggleAgent,
    closeAgent,
    handleNavigateHome,
    handleSystemStop,
    handleSystemPause,
    handleSystemResume,

    // Animation
    mainContentVariants,

    // System control
    systemControl,

    // Server generation
    serverGeneration,
  } = useDashboardLogic();

  const { isSystemStarted, getSystemRemainingTime } = useUnifiedAdminStore();
  const {
    isOpen: isAISidebarOpen,
    isMinimized: isAISidebarMinimized,
    setOpen: setAISidebarOpen,
  } = useAISidebarStore();

  // 사이드바 상태 초기화 (페이지 진입 시 항상 닫힘)
  useEffect(() => {
    setAISidebarOpen(false);
  }, [setAISidebarOpen]);

  // 사이드바 너비 동적 계산
  const sidebarWidth = isAISidebarOpen ? (isAISidebarMinimized ? 80 : 500) : 0;

  // 🔄 클라이언트 사이드 렌더링 확인
  if (!isClient) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
        <div className='flex items-center justify-center h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>대시보드를 로드하고 있습니다...</p>
            <p className='text-sm text-gray-500 mt-2'>
              Supabase 연결 및 컴포넌트 초기화 중
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative'>
      {/* 🎯 대시보드 메인 레이아웃 */}
      <motion.div
        variants={mainContentVariants}
        initial='hidden'
        animate='visible'
        className='flex flex-col h-screen transition-all duration-300 ease-in-out'
        style={{
          marginRight: `${sidebarWidth}px`,
        }}
      >
        {/* 헤더 */}
        <Suspense fallback={<HeaderLoadingSkeleton />}>
          <DashboardHeader
            serverStats={serverStats}
            onNavigateHome={handleNavigateHome}
            onToggleAgent={toggleAgent}
            isAgentOpen={isAgentOpen}
            systemStatusDisplay={
              <Suspense fallback={<LoadingSpinner />}>
                <SystemStatusDisplay
                  isSystemActive={true}
                  isSystemPaused={false}
                  isUserSession={true}
                  formattedTime='00:00:00'
                  pauseReason=''
                  onSystemStop={handleSystemStop}
                  onSystemPause={handleSystemPause}
                  onSystemResume={handleSystemResume}
                />
              </Suspense>
            }
          />
        </Suspense>

        {/* 메인 컨텐츠 */}
        <main className='flex-1 overflow-y-auto'>
          <Suspense fallback={<ContentLoadingSkeleton />}>
            <DashboardContent
              showSequentialGeneration={false}
              servers={serverGeneration.servers}
              status={serverGeneration.status}
              actions={serverGeneration.actions}
              selectedServer={selectedServer}
              onServerClick={handleServerClick}
              onServerModalClose={() => setSelectedServer(null)}
              onStatsUpdate={() => {}}
              onShowSequentialChange={setShowSequentialGeneration}
              mainContentVariants={mainContentVariants}
              isAgentOpen={isAgentOpen}
            />
          </Suspense>
        </main>

        {/* 플로팅 시스템 컨트롤 */}
        <Suspense fallback={null}>
          <FloatingSystemControl
            systemState={systemControl || {}}
            aiAgentState={{ state: 'active' }}
            isSystemActive={true}
            isSystemPaused={false}
            onStartSystem={async () => {}}
            onStopSystem={async () => await handleSystemStop()}
            onResumeSystem={async () => await handleSystemResume()}
          />
        </Suspense>

        {/* 알림 토스트 */}
        <NotificationToast />
      </motion.div>

      {/* 🤖 AI 사이드바 - 간소화 버전 */}
      {isAISidebarOpen && (
        <div
          className='fixed top-0 right-0 h-full z-20 shadow-2xl bg-white border-l border-gray-200 transition-all duration-300'
          style={{ width: `${sidebarWidth}px` }}
        >
          <AISidebar
            isOpen={isAISidebarOpen}
            onClose={() => setAISidebarOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <ErrorBoundary>
        <DashboardPageContent />
      </ErrorBoundary>
    </DashboardErrorBoundary>
  );
}
