/**
 * 📊 성능 모니터링 대시보드 v3.0 - Modular Architecture
 *
 * ✅ 모듈화 완료: 974 → ~300 lines (70% reduction)
 * ✅ 실시간 AI 엔진 성능 추적
 * ✅ 폴백 시스템 모니터링
 * ✅ 성능 알림 및 경고
 * ✅ 트렌드 분석 및 예측
 *
 * Extracted Components:
 * - PerformanceDashboard.header.tsx - Header with controls
 * - PerformanceDashboard.metrics.tsx - Summary metrics cards
 * - PerformanceDashboard.tabs.tsx - Tab content components
 * - PerformanceDashboard.states.tsx - Loading/error states
 * - PerformanceDashboard.footer.tsx - Status footer
 *
 * Data Modules:
 * - PerformanceDashboard.types.ts - Type definitions
 * - PerformanceDashboard.data.ts - Data processing
 * - PerformanceDashboard.utils.ts - Utility functions  
 * - PerformanceDashboard.mock.ts - Mock data generation
 * - PerformanceDashboard.constants.ts - Colors and constants
 * - PerformanceDashboard.charts.tsx - Chart components
 */

'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

// Import modular components  
import type { PerformanceData } from './PerformanceDashboard.types';
import { AUTO_REFRESH_INTERVAL } from './PerformanceDashboard.constants';
import { 
  getEnginePerformanceData,
  getModeDistributionData, 
  getHourlyTrendsData,
  getFilteredAlerts,
  calculatePerformanceScore,
} from './PerformanceDashboard.data';
import { handleExportData } from './PerformanceDashboard.utils';
import { fetchPerformanceData as fetchMockData } from './PerformanceDashboard.mock';

// Import extracted UI components
import { PerformanceDashboardHeader } from './PerformanceDashboard.header';
import { PerformanceDashboardMetrics } from './PerformanceDashboard.metrics';
import { PerformanceDashboardTabs } from './PerformanceDashboard.tabs';
import { LoadingState, ErrorState } from './PerformanceDashboard.states';
import { PerformanceDashboardFooter } from './PerformanceDashboard.footer';

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('60'); // 분 단위
  const [selectedTab, setSelectedTab] = useState('overview');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 📡 성능 데이터 가져오기 (PerformanceDashboard.mock 위임)
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const mockData = await fetchMockData();
      setData(mockData);
      setLastUpdate(new Date());

      console.log('✅ 성능 대시보드 데이터 업데이트 완료 (모킹)');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('❌ 성능 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 수동 새로고침 핸들러 (PerformanceDashboard.utils 위임)
  const handleManualRefresh = () => {
    fetchPerformanceData();
  };

  // 📥 데이터 내보내기 핸들러 (PerformanceDashboard.utils 위임)
  const handleDataExport = () => {
    handleExportData(data, selectedTimeRange);
  };

  // 🔄 자동 새로고침
  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, AUTO_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
    return;
  }, [autoRefresh, fetchPerformanceData]);

  // 로딩 상태 (PerformanceDashboard.states 위임)
  if (loading && !data) {
    return <LoadingState />;
  }

  // 에러 상태 (PerformanceDashboard.states 위임)
  if (error) {
    return <ErrorState error={error} handleManualRefresh={handleManualRefresh} />;
  }

  if (!data) return null;

  // 📊 데이터 처리 (PerformanceDashboard.data 위임)
  const performanceScore = calculatePerformanceScore(data);
  const engineData = getEnginePerformanceData(data);
  const modeData = getModeDistributionData(data);
  const trendsData = getHourlyTrendsData(data);
  const filteredAlerts = getFilteredAlerts(data, filterEngine, searchQuery);

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* 헤더 (PerformanceDashboard.header 위임) */}
      <PerformanceDashboardHeader
        selectedTimeRange={selectedTimeRange}
        setSelectedTimeRange={setSelectedTimeRange}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        alertsEnabled={alertsEnabled}
        setAlertsEnabled={setAlertsEnabled}
        handleManualRefresh={handleManualRefresh}
        handleDataExport={handleDataExport}
        loading={loading}
      />

      {/* 요약 메트릭 카드 (PerformanceDashboard.metrics 위임) */}
      <PerformanceDashboardMetrics
        data={data}
        performanceScore={performanceScore}
      />

      {/* 메인 대시보드 탭 (PerformanceDashboard.tabs 위임) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 개요</TabsTrigger>
            <TabsTrigger value="engines">🤖 엔진 성능</TabsTrigger>
            <TabsTrigger value="trends">📈 트렌드</TabsTrigger>
            <TabsTrigger value="alerts">🚨 알림</TabsTrigger>
          </TabsList>

          <PerformanceDashboardTabs
            modeData={modeData}
            trendsData={trendsData}
            engineData={engineData}
            filteredAlerts={filteredAlerts}
            filterEngine={filterEngine}
            setFilterEngine={setFilterEngine}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </Tabs>
      </motion.div>

      {/* 하단 상태 정보 (PerformanceDashboard.footer 위임) */}
      <PerformanceDashboardFooter data={data} lastUpdate={lastUpdate} />
    </div>
  );
}
