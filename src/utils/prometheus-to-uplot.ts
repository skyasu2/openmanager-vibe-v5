/**
 * Prometheus → uPlot Data Conversion Utilities
 *
 * Pre-computed 시계열 데이터를 uPlot AlignedData 형식으로 변환
 * uPlot AlignedData = [timestamps, series1, series2, ...]
 *
 * @created 2026-02-04
 */

import type { PrecomputedTimeSeries } from '@/types/processed-metrics';

/** uPlot이 받을 수 있는 정렬 데이터 (number[][] 호환) */
export type UPlotAlignedData = number[][];

type MetricKey = 'cpu' | 'memory' | 'disk' | 'network';

/**
 * 특정 서버의 전체 메트릭 시계열 → uPlot AlignedData
 *
 * 출력: [timestamps, cpu, memory, disk, network]
 */
export function serverToUPlotData(
  timeseries: PrecomputedTimeSeries,
  serverId: string
): UPlotAlignedData {
  const serverIndex = timeseries.serverIds.indexOf(serverId);
  if (serverIndex === -1) return [[], [], [], [], []];

  const cpuRow = timeseries.metrics.cpu[serverIndex];
  const memoryRow = timeseries.metrics.memory[serverIndex];
  const diskRow = timeseries.metrics.disk[serverIndex];
  const networkRow = timeseries.metrics.network[serverIndex];

  if (!cpuRow || !memoryRow || !diskRow || !networkRow) {
    return [[], [], [], [], []];
  }

  return [timeseries.timestamps, cpuRow, memoryRow, diskRow, networkRow];
}

/**
 * 단일 메트릭의 전체 서버 시계열 → uPlot AlignedData
 *
 * 출력: [timestamps, server1, server2, ...]
 */
export function metricToUPlotData(
  timeseries: PrecomputedTimeSeries,
  metric: MetricKey
): UPlotAlignedData {
  const metricData = timeseries.metrics[metric];
  return [timeseries.timestamps, ...metricData];
}

/**
 * 특정 서버의 단일 메트릭 시계열 → uPlot AlignedData
 *
 * 출력: [timestamps, metricValues]
 */
export function singleSeriesUPlotData(
  timeseries: PrecomputedTimeSeries,
  serverId: string,
  metric: MetricKey
): UPlotAlignedData {
  const serverIndex = timeseries.serverIds.indexOf(serverId);
  if (serverIndex === -1) return [[], []];

  const metricRow = timeseries.metrics[metric][serverIndex];
  if (!metricRow) return [[], []];

  return [timeseries.timestamps, metricRow];
}

/**
 * 메트릭 타입 → 시리즈 라벨 목록
 */
export function getMetricLabels(metric: MetricKey): string {
  const labelMap: Record<MetricKey, string> = {
    cpu: 'CPU %',
    memory: 'Memory %',
    disk: 'Disk %',
    network: 'Network Mbps',
  };
  return labelMap[metric];
}

/**
 * 서버별 전체 메트릭 라벨
 */
export const ALL_METRIC_LABELS = [
  'CPU %',
  'Memory %',
  'Disk %',
  'Network Mbps',
];
