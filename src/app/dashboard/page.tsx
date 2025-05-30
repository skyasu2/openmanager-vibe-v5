'use client';

import { Suspense, lazy } from 'react';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { AISidebar, type AISidebarConfig } from '../../modules/ai-sidebar';
import { SystemBootSequence } from '../../components/dashboard/transition';

// 동적 임포트로 코드 스플리팅 적용
const DashboardHeader = lazy(() => import('../../components/dashboard/DashboardHeader'));
const DashboardContent = lazy(() => import('../../components/dashboard/DashboardContent'));
const SystemStatusDisplay = lazy(() => import('../../components/dashboard/SystemStatusDisplay'));
const FloatingSystemControl = lazy(() => import('../../components/system/FloatingSystemControl'));

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

export default function DashboardPage() {
  const {
    // State
    isAgentOpen,
    isClient,
    selectedServer,
    serverStats,
    showBootSequence,
    showSequentialGeneration,
    
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

  // AI 사이드바 설정
  const aiSidebarConfig: AISidebarConfig = {
    apiEndpoint: '/api/ai/unified',
    theme: 'auto',
    position: 'right',
    width: 400,
    height: '100vh',
    enableVoice: false,
    enableFileUpload: false,
    enableHistory: true,
    maxHistoryLength: 10,
    title: 'OpenManager AI',
    placeholder: 'AI에게 질문하세요...',
    welcomeMessage: '안녕하세요! OpenManager AI 에이전트입니다. 서버 모니터링, 성능 분석, 장애 예측 등에 대해 궁금한 점을 자유롭게 물어보세요.',
    onMessage: (message) => console.log('사용자 메시지:', message),
    onResponse: (response) => console.log('AI 응답:', response),
    onError: (error) => console.error('AI 사이드바 오류:', error),
    onOpen: () => console.log('AI 사이드바 열림'),
    onClose: () => {
      console.log('AI 사이드바 닫힘');
      closeAgent();
    }
  };

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
    return (
      <SystemBootSequence
        servers={serverGeneration.servers}
        onBootComplete={handleBootSequenceComplete}
        onServerSpawned={handleServerSpawned}
        skipAnimation={false}
        autoStart={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 헤더 */}
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

      {/* 메인 콘텐츠 */}
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

      {/* AI 에이전트 모달 */}
      {isAgentOpen && (
        <Suspense fallback={<LoadingSpinner />}>
          <AISidebar 
            config={aiSidebarConfig}
            isOpen={isAgentOpen} 
            onClose={closeAgent}
            className="z-50"
          />
        </Suspense>
      )}

      {/* 플로팅 시스템 제어판 */}
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
    </div>
  );
} 