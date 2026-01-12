/**
 * 시계열 메트릭 데이터 Hook
 *
 * 특정 서버의 시계열 메트릭 데이터, 예측, 이상탐지 결과를 가져옵니다.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface PredictionDataPoint {
  timestamp: string;
  predicted: number;
  upper: number;
  lower: number;
}

export interface AnomalyDataPoint {
  startTime: string;
  endTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  description: string;
}

export interface TimeSeriesData {
  serverId: string;
  serverName: string;
  metric: string;
  history: MetricDataPoint[];
  prediction?: PredictionDataPoint[];
  anomalies?: AnomalyDataPoint[];
}

export interface UseTimeSeriesMetricsOptions {
  serverId: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network';
  range?: '1h' | '6h' | '24h' | '7d';
  includePrediction?: boolean;
  includeAnomalies?: boolean;
  refreshInterval?: number; // ms, 0 = no auto refresh
}

export interface UseTimeSeriesMetricsResult {
  data: TimeSeriesData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useTimeSeriesMetrics({
  serverId,
  metric,
  range = '6h',
  includePrediction = true,
  includeAnomalies = true,
  refreshInterval = 0,
}: UseTimeSeriesMetricsOptions): UseTimeSeriesMetricsResult {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!serverId || !metric) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        serverId,
        metric,
        range,
        includeHistory: 'true',
        includePrediction: includePrediction.toString(),
        includeAnomalies: includeAnomalies.toString(),
      });

      const response = await fetch(`/api/ai/raw-metrics?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '데이터 조회 실패');
      }

      setData(result.data);
    } catch (err) {
      logger.error('시계열 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }, [serverId, metric, range, includePrediction, includeAnomalies]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useTimeSeriesMetrics;
