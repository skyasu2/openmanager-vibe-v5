/**
 * 🎯 통합 관리자 대시보드 v2.0 - 리팩토링 버전
 *
 * ✅ 모듈화된 구조
 * ✅ 커스텀 훅으로 로직 분리
 * ✅ 타입 안전성 강화
 * ✅ SOLID 원칙 준수
 */

'use client';

import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  Brain,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';

// Types
import type { DashboardTab } from './UnifiedAdminDashboard.types';

// Hooks
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import { useAIEngineStatus } from './hooks/useAIEngineStatus';

// Sections
import { HeaderSection } from './sections/HeaderSection';
import { SystemHealthCard } from './sections/SystemHealthCard';

// Lazy load heavy sections
const PerformanceMetrics = lazy(() => import('./sections/PerformanceMetrics'));
const AIEnginePanel = lazy(() => import('./sections/AIEnginePanel'));
const AlertsSection = lazy(() => import('./sections/AlertsSection'));
const LoggingSection = lazy(() => import('./sections/LoggingSection'));
const SettingsSection = lazy(() => import('./sections/SettingsSection'));

// Loading fallback
const LoadingFallback = () => (
  <div className='flex items-center justify-center h-64'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
  </div>
);

export default function UnifiedAdminDashboard() {
  // 메인 대시보드 상태 관리
  const {
    data,
    loading,
    error,
    selectedTab,
    autoRefresh,
    lastUpdate,
    unreadAlerts,
    setSelectedTab,
    setAutoRefresh,
    refreshData,
    acknowledgeAlert,
  } = useAdminDashboard();

  // 시스템 메트릭 관리
  const {
    chartData,
    gcpQuota,
    isLoading: metricsLoading,
    exportMetrics,
  } = useSystemMetrics({ autoRefresh });

  // AI 엔진 상태 관리
  const {
    engines,
    selectedEngine,
    setSelectedEngine,
    toggleEngine,
    updateEngineConfig,
    restartEngine,
  } = useAIEngineStatus();

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingFallback />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            데이터 로드 실패
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
          <button
            onClick={refreshData}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!data) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* 헤더 섹션 */}
        <HeaderSection
          status={data.status.overall}
          lastUpdate={lastUpdate}
          autoRefresh={autoRefresh}
          unreadAlerts={unreadAlerts}
          onRefresh={refreshData}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        />

        {/* 시스템 헬스 카드 */}
        <SystemHealthCard data={data} gcpQuota={gcpQuota} />

        {/* 탭 네비게이션 */}
        <Tabs
          value={selectedTab}
          onValueChange={value => setSelectedTab(value as DashboardTab)}
          className='mt-8'
        >
          <TabsList className='grid grid-cols-6 w-full'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <Activity className='w-4 h-4' />
              <span className='hidden sm:inline'>개요</span>
            </TabsTrigger>
            <TabsTrigger
              value='performance'
              className='flex items-center gap-2'
            >
              <BarChart3 className='w-4 h-4' />
              <span className='hidden sm:inline'>성능</span>
            </TabsTrigger>
            <TabsTrigger value='logging' className='flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              <span className='hidden sm:inline'>로깅</span>
            </TabsTrigger>
            <TabsTrigger value='ai-engines' className='flex items-center gap-2'>
              <Brain className='w-4 h-4' />
              <span className='hidden sm:inline'>AI 엔진</span>
            </TabsTrigger>
            <TabsTrigger
              value='alerts'
              className='flex items-center gap-2 relative'
            >
              <AlertTriangle className='w-4 h-4' />
              <span className='hidden sm:inline'>알림</span>
              {unreadAlerts > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                  {unreadAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value='settings' className='flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              <span className='hidden sm:inline'>설정</span>
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview' className='mt-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* 최근 알림 */}
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-semibold mb-4'>최근 알림</h3>
                <Suspense fallback={<LoadingFallback />}>
                  <AlertsSection
                    alerts={data.alerts.slice(0, 5)}
                    onAcknowledge={acknowledgeAlert}
                    compact
                  />
                </Suspense>
              </div>

              {/* AI 엔진 상태 요약 */}
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-semibold mb-4'>AI 엔진 상태</h3>
                <div className='space-y-3'>
                  {data.status.engines.engines.map((engine, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm'>{engine.name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          engine.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {engine.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 성능 탭 */}
          <TabsContent value='performance' className='mt-6'>
            <Suspense fallback={<LoadingFallback />}>
              <PerformanceMetrics
                performanceData={data.status.performance}
                chartData={chartData}
                onExport={exportMetrics}
                isLoading={metricsLoading}
              />
            </Suspense>
          </TabsContent>

          {/* 로깅 탭 */}
          <TabsContent value='logging' className='mt-6'>
            <Suspense fallback={<LoadingFallback />}>
              <LoggingSection loggingStatus={data.status.logging} />
            </Suspense>
          </TabsContent>

          {/* AI 엔진 탭 */}
          <TabsContent value='ai-engines' className='mt-6'>
            <Suspense fallback={<LoadingFallback />}>
              <AIEnginePanel
                engines={engines}
                selectedEngine={selectedEngine}
                onSelectEngine={setSelectedEngine}
                onToggleEngine={toggleEngine}
                onUpdateConfig={updateEngineConfig}
                onRestartEngine={restartEngine}
              />
            </Suspense>
          </TabsContent>

          {/* 알림 탭 */}
          <TabsContent value='alerts' className='mt-6'>
            <Suspense fallback={<LoadingFallback />}>
              <AlertsSection
                alerts={data.alerts}
                onAcknowledge={acknowledgeAlert}
              />
            </Suspense>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value='settings' className='mt-6'>
            <Suspense fallback={<LoadingFallback />}>
              <SettingsSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}