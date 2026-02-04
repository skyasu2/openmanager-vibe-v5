/**
 * Pre-computed Metrics Type Definitions
 *
 * hourly-data (Prometheus format) -> precompute pipeline -> processed-metrics
 * - Dashboard (uPlot): PrecomputedTimeSeries
 * - AI + Dashboard: PrecomputedHourly
 * - Metadata: MetricsMetadata
 *
 * @created 2026-02-04
 */

import type { PrometheusLabels } from '@/data/hourly-data';
import type { Alert } from '@/services/monitoring/AlertManager';
import type { HealthReport } from '@/services/monitoring/HealthCalculator';
import type { AggregatedMetrics } from '@/services/monitoring/MetricsAggregator';

// ============================================================================
// uPlot Time Series (24h full timeline)
// ============================================================================

/**
 * 전체 24시간 시계열 데이터 (uPlot 소비용)
 *
 * - timestamps: Unix seconds (uPlot 표준), 144개 = 24h x 6슬롯(10분간격)
 * - metrics: [serverIndex][timeIndex] 2D 배열
 */
export type PrecomputedTimeSeries = {
  serverIds: string[];
  timestamps: number[];
  metrics: {
    cpu: number[][];
    memory: number[][];
    disk: number[][];
    network: number[][];
    up: (0 | 1)[][];
  };
};

// ============================================================================
// Hourly Pre-computed Data (Dashboard + AI)
// ============================================================================

/**
 * 시간대별 가공 데이터
 *
 * 기존 MonitoringContext.analyze() 결과를 빌드 타임에 미리 계산
 */
export type PrecomputedHourly = {
  hour: number;
  scenario: string;
  aggregated: AggregatedMetrics;
  alerts: Alert[];
  health: HealthReport;
  aiContext: string;
};

// ============================================================================
// Metadata
// ============================================================================

/**
 * 서버 메타데이터 + 시나리오 요약
 */
export type MetricsMetadata = {
  serverIds: string[];
  serverLabels: Record<string, PrometheusLabels>;
  scenarios: Array<{ hour: number; description: string }>;
  availableMetrics: string[];
  scrapeConfig: { interval: string; source: string };
};

// ============================================================================
// PromQL Result Types (Internal Query Layer)
// ============================================================================

/**
 * PromQL 쿼리 결과 - instant vector
 */
export type PromQLSample = {
  labels: Record<string, string>;
  value: number;
};

/**
 * PromQL 쿼리 결과 - range vector
 */
export type PromQLRangeSample = {
  labels: Record<string, string>;
  values: Array<[number, number]>;
};

export type PromQLResult = {
  resultType: 'vector' | 'scalar';
  result: PromQLSample[];
};
