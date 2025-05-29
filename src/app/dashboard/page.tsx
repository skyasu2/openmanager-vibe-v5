'use client';

import FlexibleAISidebar from '../../components/ai/FlexibleAISidebar';
import DashboardEntrance from '../../components/dashboard/DashboardEntrance';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardContent from '../../components/dashboard/DashboardContent';
import SystemStatusDisplay from '../../components/dashboard/SystemStatusDisplay';
import FloatingSystemControl from '../../components/system/FloatingSystemControl';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';

export default function DashboardPage() {
  const {
    // State
    isAgentOpen,
    isClient,
    selectedServer,
    serverStats,
    showEntrance,
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
    
    // Animation
    mainContentVariants,
    
    // System control
    systemControl,
    
    // Server generation
    serverGeneration
  } = useDashboardLogic();

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

  // Entrance animation
  if (showEntrance) {
    return <DashboardEntrance onStatsUpdate={updateServerStats} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 헤더 */}
      <DashboardHeader
        serverStats={serverStats}
        onNavigateHome={handleNavigateHome}
        onToggleAgent={toggleAgent}
        isAgentOpen={isAgentOpen}
        systemStatusDisplay={
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
        }
      />

      {/* 메인 콘텐츠 */}
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

      {/* AI 에이전트 모달 */}
      <FlexibleAISidebar 
        isOpen={isAgentOpen} 
        onClose={closeAgent} 
        serverMetrics={serverStats}
      />

      {/* 플로팅 시스템 제어판 */}
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
  );
} 