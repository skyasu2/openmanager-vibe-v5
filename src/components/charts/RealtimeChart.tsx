'use client';

/**
 * RealtimeChart - uPlot 기반 서버 메트릭 시계열 차트
 *
 * Pre-computed 시계열 데이터(processed-metrics/timeseries.json)를
 * uPlot으로 렌더링. 기존 RealtimeChartProps 인터페이스 100% 유지.
 *
 * @updated 2026-02-04 - 플레이스홀더 → uPlot 실제 구현
 */

import { useEffect, useState } from 'react';
import type { PrecomputedTimeSeries } from '@/types/processed-metrics';
import {
  getMetricLabels,
  singleSeriesUPlotData,
} from '@/utils/prometheus-to-uplot';
import { UPlotTimeSeries } from './uplot/UPlotTimeSeries';

// ============================================================================
// Props Interface (기존과 100% 동일)
// ============================================================================

interface RealtimeChartProps {
  serverId: string;
  metricType: 'cpu' | 'memory' | 'disk' | 'network';
  showPrediction?: boolean;
  height?: string;
  className?: string;
}

// ============================================================================
// Data Fetcher Hook
// ============================================================================

let cachedTimeSeries: PrecomputedTimeSeries | null = null;
let fetchPromise: Promise<PrecomputedTimeSeries | null> | null = null;

async function loadTimeSeries(): Promise<PrecomputedTimeSeries | null> {
  if (cachedTimeSeries) return cachedTimeSeries;

  if (!fetchPromise) {
    fetchPromise = fetch('/processed-metrics/timeseries.json')
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<PrecomputedTimeSeries>;
      })
      .then((data) => {
        cachedTimeSeries = data;
        fetchPromise = null;
        return data;
      })
      .catch(() => {
        fetchPromise = null;
        return null;
      });
  }

  return fetchPromise;
}

function useTimeSeries(): PrecomputedTimeSeries | null {
  const [ts, setTs] = useState<PrecomputedTimeSeries | null>(cachedTimeSeries);

  useEffect(() => {
    if (cachedTimeSeries) {
      setTs(cachedTimeSeries);
      return;
    }

    let cancelled = false;
    loadTimeSeries().then((data) => {
      if (!cancelled) setTs(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return ts;
}

// ============================================================================
// Component
// ============================================================================

export function RealtimeChart({
  serverId,
  metricType,
  showPrediction: _showPrediction = false,
  height = 'h-64',
  className = '',
}: RealtimeChartProps) {
  const timeseries = useTimeSeries();

  // Loading state
  if (!timeseries) {
    return (
      <div
        className={`${height} ${className} flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800`}
      >
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          Loading chart...
        </div>
      </div>
    );
  }

  // Check if server exists in data
  if (!timeseries.serverIds.includes(serverId)) {
    return (
      <div
        className={`${height} ${className} flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800`}
      >
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No data for {serverId}
        </p>
      </div>
    );
  }

  const data = singleSeriesUPlotData(timeseries, serverId, metricType);
  const label = getMetricLabels(metricType);

  return (
    <div
      className={`${className} rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50`}
    >
      <UPlotTimeSeries
        data={data}
        seriesLabels={[label]}
        colorKey={metricType}
        height={height}
        yAxisLabel="%"
        yRange={metricType === 'network' ? undefined : [0, 100]}
      />
    </div>
  );
}

export default RealtimeChart;
