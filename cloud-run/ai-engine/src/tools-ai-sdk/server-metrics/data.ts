/**
 * Server Metrics Data Helpers
 *
 * Cache key utilities, data source imports, and helper functions
 * for time range queries and aggregation.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import {
  getCurrentState,
  type ServerSnapshot,
} from '../../data/precomputed-state';
import {
  FIXED_24H_DATASETS,
  getDataAtMinute,
  getRecentData,
  get24hTrendSummaries,
  type Server24hDataset,
  type Fixed10MinMetric,
} from '../../data/fixed-24h-metrics';
import { getDataCache } from '../../lib/cache-layer';
import {
  SERVER_TYPE_MAP,
  SERVER_TYPE_DESCRIPTIONS,
  SERVER_GROUP_INPUT_DESCRIPTION,
  SERVER_GROUP_DESCRIPTION_LIST,
  normalizeServerType,
} from '../../config/server-types';

// ============================================================================
// Cache Key Utilities
// ============================================================================

/**
 * Create stable cache key from filter array
 * Ensures consistent key order in objects and sorted array items
 */
export function stableStringify(filters: Array<Record<string, unknown>> | undefined): string {
  if (!filters || filters.length === 0) return '[]';

  // Sort each object's keys and stringify, then sort array by resulting strings
  const normalized = filters.map(filter => {
    const sortedKeys = Object.keys(filter).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = filter[key];
    }
    return JSON.stringify(sortedObj);
  }).sort();

  return `[${normalized.join(',')}]`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current minute of day (KST)
 */
export function getCurrentMinuteOfDay(): number {
  const koreaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  });
  const koreaDate = new Date(koreaTime);
  return koreaDate.getHours() * 60 + koreaDate.getMinutes();
}

/**
 * Calculate aggregation over time series data
 */
export function calculateAggregation(
  dataPoints: Array<{ cpu: number; memory: number; disk: number }>,
  metric: 'cpu' | 'memory' | 'disk' | 'network' | 'all',
  func: 'avg' | 'max' | 'min' | 'count'
): Record<string, number> {
  if (func === 'count') {
    return { count: dataPoints.length };
  }

  const metrics = metric === 'all' ? ['cpu', 'memory', 'disk'] : [metric];
  const result: Record<string, number> = {};

  for (const m of metrics) {
    const values = dataPoints
      .map((d) => d[m as keyof typeof d] as number)
      .filter((v) => v !== undefined);

    if (values.length === 0) {
      result[m] = 0;
      continue;
    }

    switch (func) {
      case 'avg':
        result[m] =
          Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) /
          10;
        break;
      case 'max':
        result[m] = Math.max(...values);
        break;
      case 'min':
        result[m] = Math.min(...values);
        break;
    }
  }

  return result;
}

/**
 * Get time range data points for a server
 */
export function getTimeRangeData(
  dataset: Server24hDataset,
  timeRange: string
): Fixed10MinMetric[] {
  const currentMinute = getCurrentMinuteOfDay();

  let hoursBack = 0;
  switch (timeRange) {
    case 'last1h':
      hoursBack = 1;
      break;
    case 'last6h':
      hoursBack = 6;
      break;
    case 'last24h':
      hoursBack = 24;
      break;
    case 'current':
    default:
      return [getDataAtMinute(dataset, currentMinute)].filter(
        Boolean
      ) as Fixed10MinMetric[];
  }

  const pointsNeeded = hoursBack * 6;
  return getRecentData(dataset, currentMinute, pointsNeeded);
}

// Re-export data sources for tools
export {
  getCurrentState,
  type ServerSnapshot,
  FIXED_24H_DATASETS,
  getDataAtMinute,
  getRecentData,
  get24hTrendSummaries,
  type Server24hDataset,
  type Fixed10MinMetric,
  getDataCache,
  SERVER_TYPE_MAP,
  SERVER_TYPE_DESCRIPTIONS,
  SERVER_GROUP_INPUT_DESCRIPTION,
  SERVER_GROUP_DESCRIPTION_LIST,
  normalizeServerType,
};
