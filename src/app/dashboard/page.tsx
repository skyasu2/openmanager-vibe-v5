'use client';

import { Suspense, lazy } from 'react';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { AISidebar, type AISidebarConfig } from '../../modules/ai-sidebar';
import { SystemBootSequence } from '../../components/dashboard/transition';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Monitor, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';

// ⚡ Dynamic Import로 코드 스플리팅 적용 (Vercel 최적화)
const DashboardHeader = dynamic(() => import('../../components/dashboard/DashboardHeader'), {
  ssr: false,
  loading: () => <HeaderLoadingSkeleton />
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

// 🎯 AI 사이드바도 Dynamic Import 적용
const AISidebarDynamic = dynamic(() => import('../../modules/ai-sidebar').then(mod => ({ default: mod.AISidebar })), {
  ssr: false,
  loading: () => (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-lg border-l border-gray-200 z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">AI 로딩 중...</p>
      </div>
    </div>
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

  // AI 상태 가져오기
  const { aiAgent } = useUnifiedAdminStore();

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

      {/* AI 모드 상태 배너 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`border-b ${
          aiAgent.isEnabled 
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {aiAgent.isEnabled ? (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <span className="text-purple-800 font-semibold text-sm">
                      🤖 AI 에이전트 모드 활성
                    </span>
                    <p className="text-purple-600 text-xs">
                      지능형 분석, 예측, 자연어 질의 등 모든 AI 기능을 사용할 수 있습니다.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-blue-800 font-semibold text-sm flex items-center gap-2">
                      📊 기본 모니터링 모드
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        AI 기능 제한
                      </span>
                    </span>
                    <p className="text-blue-600 text-xs">
                      서버 상태, 메트릭 차트, 알림 등 기본 모니터링 기능만 사용 가능합니다.
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {!aiAgent.isEnabled && (
              <motion.div
                className="flex items-center gap-2 text-orange-600"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">AI 활성화 필요</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

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
    </div>
  );
} 