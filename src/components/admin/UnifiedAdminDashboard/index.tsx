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
  <div className="flex h-64 items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
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
      <div className="flex min-h-screen items-center justify-center">
        <LoadingFallback />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            데이터 로드 실패
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={refreshData}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl p-6">
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
          onValueChange={(value) => setSelectedTab(value as DashboardTab)}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">개요</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">성능</span>
            </TabsTrigger>
            <TabsTrigger value="logging" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">로깅</span>
            </TabsTrigger>
            <TabsTrigger value="ai-engines" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI 엔진</span>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="relative flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">알림</span>
              {unreadAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">설정</span>
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 최근 알림 */}
              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold">최근 알림</h3>
                <Suspense fallback={<LoadingFallback />}>
                  <AlertsSection
                    alerts={data.alerts.slice(0, 5)}
                    onAcknowledge={acknowledgeAlert}
                    compact
                  />
                </Suspense>
              </div>

              {/* AI 엔진 상태 요약 */}
              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold">AI 엔진 상태</h3>
                <div className="space-y-3">
                  {data.status.engines.engines.map((engine, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{engine.name}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
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
          <TabsContent value="performance" className="mt-6">
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
          <TabsContent value="logging" className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <LoggingSection loggingStatus={data.status.logging} />
            </Suspense>
          </TabsContent>

          {/* AI 엔진 탭 */}
          <TabsContent value="ai-engines" className="mt-6">
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
          <TabsContent value="alerts" className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <AlertsSection
                alerts={data.alerts}
                onAcknowledge={acknowledgeAlert}
              />
            </Suspense>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <SettingsSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
