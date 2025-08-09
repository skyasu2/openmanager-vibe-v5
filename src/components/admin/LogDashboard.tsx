/**
 * 📝 로깅 시스템 대시보드 v3.0 - Modular Architecture Complete
 *
 * ✅ 실시간 로그 모니터링
 * ✅ 고급 검색 및 필터링
 * ✅ 로그 분석 및 통계
 * ✅ 로그 내보내기 및 관리
 * 
 * Modularization Complete: 1045 → 266 lines (75% reduction)
 * Modules: 6 specialized components for optimal maintainability
 * - LogDashboard.types.ts (119 lines) - Type definitions
 * - LogDashboard.charts.tsx (95 lines) - Dynamic chart imports  
 * - LogDashboard.hooks.ts (227 lines) - Data management hooks
 * - LogDashboard.StatsCards.tsx (72 lines) - Summary statistics
 * - LogDashboard.Analytics.tsx (206 lines) - Analytics visualization
 * - LogDashboard.LogViewer.tsx (257 lines) - Log viewer interface
 */

'use client';

import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Import modular components
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogDashboardStatsCards } from './LogDashboard.StatsCards';
import { LogDashboardAnalytics } from './LogDashboard.Analytics';
import { LogDashboardLogViewer } from './LogDashboard.LogViewer';
import { useLogDashboard, useLogExport, useLogClear } from './LogDashboard.hooks';
import type { LogFilters } from './LogDashboard.types';

export default function LogDashboard() {
  const { data, loading, error, autoRefresh, setAutoRefresh, fetchLogData } = useLogDashboard();
  const { exportLogs } = useLogExport();
  const { clearLogs } = useLogClear();
  
  const [selectedTab, setSelectedTab] = useState('logs');
  
  // 필터 상태
  const [filters, setFilters] = useState<LogFilters>({
    searchQuery: '',
    selectedLevels: [],
    selectedCategories: [],
    selectedSource: '',
    timeRange: { start: '', end: '' },
    limit: 100,
  });

  // 초기 데이터 로드 및 필터 변경 시 재로드
  useEffect(() => {
    fetchLogData(filters);
  }, [fetchLogData, filters]);

  // 필터 업데이트 헬퍼 함수
  const updateFilters = useCallback((updates: Partial<LogFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // 📤 로그 내보내기 핸들러
  const handleExportLogs = useCallback(async () => {
    if (!data?.logs?.length) return;

    try {
      await exportLogs(data.logs, {
        format: 'json',
        includeMetadata: true,
        includeStackTrace: false,
      });
      
      console.log('로그 내보내기 완료');
    } catch (err) {
      console.error('로그 내보내기 실패:', err);
    }
  }, [data?.logs, exportLogs]);

  // 🗑️ 로그 삭제 핸들러
  const handleClearLogs = useCallback(async () => {
    if (!confirm('정말로 모든 로그를 삭제하시겠습니까?')) return;

    try {
      await clearLogs();
      await fetchLogData(filters); // 삭제 후 새로고침
      console.log('로그 삭제 완료');
    } catch (err) {
      console.error('로그 삭제 실패:', err);
    }
  }, [clearLogs, fetchLogData, filters]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">로그 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">오류: {error}</p>
        <Button 
          onClick={() => fetchLogData(filters)} 
          className="mt-4"
          variant="outline"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500">
        <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
        <p>로그 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 제어 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 로그 대시보드</h1>
          <p className="text-gray-600">
            {data.logs.length.toLocaleString()}개 로그 • 
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>

          <Button variant="destructive" size="sm" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            로그 삭제
          </Button>
        </div>
      </motion.div>

      {/* 요약 통계 */}
      <LogDashboardStatsCards data={data} />

      {/* 메인 대시보드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">📝 로그 뷰어</TabsTrigger>
            <TabsTrigger value="analytics">📊 분석</TabsTrigger>
            <TabsTrigger value="trends">📈 트렌드</TabsTrigger>
            <TabsTrigger value="settings">⚙️ 설정</TabsTrigger>
          </TabsList>

          {/* 로그 뷰어 탭 */}
          <LogDashboardLogViewer 
            data={data} 
            filters={filters} 
            updateFilters={updateFilters} 
          />

          {/* 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <LogDashboardAnalytics data={data} />
          </TabsContent>

          {/* 트렌드 탭 */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>트렌드 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">트렌드 분석 기능이 곧 추가됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  로깅 시스템 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.status && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          상태
                        </label>
                        <p className="text-lg">
                          {data.status.enabled ? '활성' : '비활성'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          총 로그 수
                        </label>
                        <p className="text-lg">
                          {data.status.logCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {data.status.lastLogTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          마지막 로그 시간
                        </label>
                        <p className="text-lg">
                          {new Date(data.status.lastLogTime).toLocaleString(
                            'ko-KR'
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        설정
                      </label>
                      <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                        {JSON.stringify(data.status.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}