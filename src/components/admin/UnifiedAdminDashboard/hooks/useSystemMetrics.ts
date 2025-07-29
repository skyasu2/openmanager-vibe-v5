/**
 * 🎯 시스템 메트릭 훅
 *
 * 성능 메트릭 및 차트 데이터 관리
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PerformanceChartData,
  GCPQuotaStatus,
} from '../UnifiedAdminDashboard.types';

interface UseSystemMetricsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSystemMetrics(options: UseSystemMetricsOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [chartData, setChartData] = useState<PerformanceChartData>({
    responseTime: [],
    requestRate: [],
    errorRate: [],
  });

  const [gcpQuota, setGcpQuota] = useState<GCPQuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 성능 메트릭 가져오기
  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/performance/metrics');
      if (!response.ok) throw new Error('메트릭 로드 실패');

      const _data = await response.json();

      // 차트 데이터 변환
      const transformedData: PerformanceChartData = {
        responseTime: _data.responseTime || [],
        requestRate: _data.requestRate || [],
        errorRate: _data.errorRate || [],
      };

      setChartData(transformedData);
    } catch (error) {
      console.error('성능 메트릭 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // GCP 할당량 상태 가져오기
  const fetchGCPQuota = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/gcp/quota');
      if (!response.ok) return;

      const _data = await response.json();
      setGcpQuota(_data);
    } catch (error) {
      console.error('GCP 할당량 정보 로드 실패:', error);
    }
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    fetchPerformanceMetrics();
    fetchGCPQuota();

    const interval = setInterval(() => {
      fetchPerformanceMetrics();
      fetchGCPQuota();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPerformanceMetrics, fetchGCPQuota]);

  // 메트릭 내보내기
  const exportMetrics = useCallback(async (format: 'csv' | 'json' = 'json') => {
    try {
      const response = await fetch(
        `/api/admin/performance/export?format=${format}`
      );
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('메트릭 내보내기 실패:', error);
    }
  }, []);

  return {
    chartData,
    gcpQuota,
    isLoading,
    refreshMetrics: fetchPerformanceMetrics,
    refreshGCPQuota: fetchGCPQuota,
    exportMetrics,
  };
}
