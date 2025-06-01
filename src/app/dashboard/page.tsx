'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { SystemBootSequence } from '../../components/dashboard/transition';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Monitor, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationToast } from '@/components/system/NotificationToast';
import { cn } from '@/lib/utils';

// ⚡ Dynamic Import로 코드 스플리팅 적용 (Vercel 최적화)
const DashboardHeader = dynamic(() => import('../../components/dashboard/DashboardHeader'), {
  ssr: false,
  loading: () => <HeaderLoadingSkeleton />
});

const AISidebar = dynamic(() => import('../../components/dashboard/AISidebar').then(mod => ({ default: mod.AISidebar })), {
  ssr: false,
  loading: () => <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-lg border-l border-gray-200 z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
      <p className="text-sm text-gray-600">AI 사이드바 로딩 중...</p>
    </div>
  </div>
});

const DashboardContent = dynamic(() => import('../../components/dashboard/DashboardContent'), {
  ssr: false,
  loading: () => <ContentLoadingSkeleton />
});

const SystemStatusDisplay = dynamic(() => import('../../components/dashboard/SystemStatusDisplay'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

const FloatingSystemControl = dynamic(() => import('../../components/system/FloatingSystemControl'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-6 right-6 w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
  )
});

// 로딩 컴포넌트들
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

const HeaderLoadingSkeleton = () => (
  <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div>
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-3 bg-gray-100 rounded animate-pulse mt-1"></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </header>
);

const ContentLoadingSkeleton = () => (
  <div className="p-6 space-y-4">
    <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
  </div>
);

// Dynamic imports for better performance
const SystemStatusWidget = dynamic(() => import('./components/SystemStatusWidget'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-32" />,
  ssr: false
});

const PatternAnalysisWidget = dynamic(() => import('@/components/ai/PatternAnalysisWidget'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-64" />,
  ssr: false
});

const PredictionDashboard = dynamic(() => import('@/components/prediction/PredictionDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-80" />,
  ssr: false
});

export default function DashboardPage() {
  const {
    // State
    isAgentOpen,
    isClient,
    selectedServer,
    serverStats,
    showBootSequence,
    showSequentialGeneration,
    
    // ✨ 새로운 로딩 상태 정보
    bootProgress,
    loadingPhase,
    estimatedTimeRemaining,
    elapsedTime,
    isDataReady,
    
    // Actions
    setSelectedServer,
    setShowSequentialGeneration,
    updateServerStats,
    
    // Handlers
    handleServerClick,
    toggleAgent,
    closeAgent,
    handleNavigateHome,
    handleSystemStop,
    handleSystemPause,
    handleSystemResume,
    
    // ✨ 새로운 전환 시스템 핸들러
    handleBootSequenceComplete,
    handleServerSpawned,
    
    // Animation
    mainContentVariants,
    
    // System control
    systemControl,
    
    // Server generation
    serverGeneration
  } = useDashboardLogic();

  const {
    isSystemStarted,
    getSystemRemainingTime
  } = useUnifiedAdminStore();

  // 🛡️ 대시보드 진입 시 시스템 상태 검증
  useEffect(() => {
    if (isClient) {
      console.log('📊 [Dashboard] 페이지 진입 - 시스템 상태 검증');
      
      if (!isSystemStarted) {
        console.warn('⚠️ [Dashboard] 시스템이 비활성 상태에서 대시보드 접근');
      } else {
        const remainingTime = getSystemRemainingTime();
        console.log(`✅ [Dashboard] 시스템 활성 확인 - 남은 시간: ${Math.floor(remainingTime / 1000)}초`);
      }
    }
  }, [isClient, isSystemStarted, getSystemRemainingTime]);

  // 🧹 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('🧹 [Dashboard] 페이지 언마운트 - 리소스 정리');
    };
  }, []);

  // Server-side rendering fallback
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">대시보드를 로드하고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✨ 새로운 부팅 시퀀스 표시
  if (showBootSequence) {
    // 🚨 긴급 우회 - URL 파라미터로 강제 스킵 가능
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceSkip = urlParams?.get('force-skip') === 'true';
    const instantLoad = urlParams?.get('instant') === 'true'; // 🚨 새로운 즉시 로딩 옵션
    
    // 🚨 추가 안전장치: 서버 데이터가 없으면 자동 스킵
    if (forceSkip || instantLoad) {
      console.log('🚨 Emergency skip activated:', { forceSkip, instantLoad, serversCount: serverGeneration.servers.length });
      
      // 즉시 대시보드 표시
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✅ 긴급 모드 활성화 - 즉시 로딩 완료
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">🎯 OpenManager v5 대시보드</h1>
            <p className="text-gray-600 mb-6">정상 전환 시스템을 우회하여 즉시 로딩되었습니다.</p>
            
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                정상 모드로 재시도
              </button>
              
              <button 
                onClick={() => window.location.href = '/dashboard?skip-animation=true'}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                애니메이션 비활성화 모드
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left max-w-md mx-auto">
              <h3 className="font-medium text-blue-900 mb-2">🔧 개발자 정보</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 서버 수: {serverGeneration.servers.length}</li>
                <li>• 시스템 상태: {systemControl.isSystemActive ? '활성' : '비활성'}</li>
                <li>• 클라이언트: {isClient ? '준비됨' : '로딩중'}</li>
                <li>• 로딩 진행률: {Math.round(bootProgress)}%</li>
                <li>• 로딩 단계: {loadingPhase}</li>
                {estimatedTimeRemaining > 0 && (
                  <li>• 예상 남은 시간: {Math.ceil(estimatedTimeRemaining / 1000)}초</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <SystemBootSequence
        servers={serverGeneration.servers}
        onBootComplete={handleBootSequenceComplete}
        onServerSpawned={handleServerSpawned}
        skipAnimation={false}
        autoStart={true}
        // ✨ 새로운 로딩 상태 정보 전달
        loadingProgress={bootProgress}
        loadingPhase={loadingPhase}
        estimatedTimeRemaining={estimatedTimeRemaining}
        elapsedTime={elapsedTime}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 기존 대시보드 헤더 (적절한 크기) */}
      <Suspense fallback={<HeaderLoadingSkeleton />}>
        <DashboardHeader
          serverStats={serverStats}
          onNavigateHome={handleNavigateHome}
          onToggleAgent={toggleAgent}
          isAgentOpen={isAgentOpen}
          systemStatusDisplay={
            <Suspense fallback={<LoadingSpinner />}>
              <SystemStatusDisplay
                isSystemActive={systemControl.isSystemActive}
                isSystemPaused={systemControl.isSystemPaused}
                isUserSession={systemControl.isUserSession}
                formattedTime={systemControl.formattedTime}
                pauseReason={systemControl.pauseReason || ''}
                onSystemStop={handleSystemStop}
                onSystemPause={handleSystemPause}
                onSystemResume={handleSystemResume}
              />
            </Suspense>
          }
        />
      </Suspense>

      {/* 메인 콘텐츠 - 전체 영역 */}
      <div className="flex-1">
        <Suspense fallback={<ContentLoadingSkeleton />}>
          <DashboardContent
            showSequentialGeneration={showSequentialGeneration}
            servers={serverGeneration.servers}
            status={serverGeneration.status}
            actions={serverGeneration.actions}
            selectedServer={selectedServer}
            onServerClick={handleServerClick}
            onServerModalClose={() => setSelectedServer(null)}
            onStatsUpdate={updateServerStats}
            onShowSequentialChange={setShowSequentialGeneration}
            mainContentVariants={mainContentVariants}
            isAgentOpen={isAgentOpen}
          />
        </Suspense>
      </div>

      {/* AI 에이전트 사이드바 */}
      <Suspense fallback={<LoadingSpinner />}>
        <AISidebar 
          isOpen={isAgentOpen} 
          onToggle={toggleAgent}
          onClose={closeAgent}
        />
      </Suspense>

      {/* 플로팅 시스템 제어판 - 시스템 비활성 시에만 표시 */}
      {!systemControl.isSystemActive && (
        <Suspense fallback={null}>
          <div className="fixed bottom-6 right-6 z-30">
            <FloatingSystemControl
              systemState={systemControl}
              aiAgentState={{ state: 'active' }}
              isSystemActive={systemControl.isSystemActive}
              isSystemPaused={systemControl.isSystemPaused}
              onStartSystem={async () => { window.location.href = '/'; }}
              onStopSystem={handleSystemStop}
              onResumeSystem={handleSystemResume}
            />
          </div>
        </Suspense>
      )}

      {/* 🔔 실시간 알림 토스트 */}
      <NotificationToast 
        position="top-right"
        maxNotifications={5}
        autoHideDuration={5000}
        enableSound={true}
      />
    </div>
  );
} 