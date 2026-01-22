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

  // 🔧 AbortController를 사용한 안전한 fetch
  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
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

        const response = await fetch(
          `/api/ai/raw-metrics?${params.toString()}`,
          {
            signal, // 🔧 AbortController signal 전달
          }
        );

        if (!response.ok) {
          // 404는 데이터 없음 - 에러로 취급하지 않음 (Graceful Degradation)
          if (response.status === 404) {
            setData(null);
            setIsLoading(false);
            return;
          }
          throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || '데이터 조회 실패');
        }

        setData(result.data);
      } catch (err) {
        // 🔧 AbortError는 정상적인 cleanup이므로 무시
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // 예상 가능한 에러는 debug로 처리
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        if (message.includes('404')) {
          logger.debug('시계열 데이터 없음:', message);
        } else {
          logger.warn('시계열 데이터 조회 실패:', err);
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [serverId, metric, range, includePrediction, includeAnomalies]
  );

  // 🔧 Initial fetch with AbortController
  useEffect(() => {
    const abortController = new AbortController();
    void fetchData(abortController.signal);

    return () => {
      abortController.abort(); // 컴포넌트 unmount 시 fetch 취소
    };
  }, [fetchData]);

  // 🔧 Auto refresh with AbortController
  useEffect(() => {
    if (refreshInterval <= 0) return;

    let abortController: AbortController | null = null;

    const interval = setInterval(() => {
      abortController = new AbortController();
      void fetchData(abortController.signal);
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      abortController?.abort(); // 진행 중인 fetch 취소
    };
  }, [fetchData, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useTimeSeriesMetrics;
