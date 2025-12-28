/**
 * Server Metrics Tools (AI SDK Format)
 *
 * Converted from LangChain tools to Vercel AI SDK format.
 * Used by the new AI SDK Supervisor.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import { tool } from 'ai';
import { z } from 'zod';

// Data sources
import {
  getCurrentState,
  type ServerSnapshot,
} from '../data/precomputed-state';
import {
  FIXED_24H_DATASETS,
  getDataAtMinute,
  getRecentData,
  type Server24hDataset,
  type Fixed10MinMetric,
} from '../data/fixed-24h-metrics';

// ============================================================================
// 1. Helper Functions
// ============================================================================

/**
 * Get current minute of day (KST)
 */
function getCurrentMinuteOfDay(): number {
  const koreaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  });
  const koreaDate = new Date(koreaTime);
  return koreaDate.getHours() * 60 + koreaDate.getMinutes();
}

/**
 * Calculate aggregation over time series data
 */
function calculateAggregation(
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
function getTimeRangeData(
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

// ============================================================================
// 2. AI SDK Tools
// ============================================================================

/**
 * Basic Server Metrics Tool
 * O(1) lookup using precomputed state
 */
export const getServerMetrics = tool({
  description:
    '서버 CPU/메모리/디스크 상태를 조회합니다. 현재 시점의 서버 상태를 빠르게 확인할 때 사용합니다.',
  inputSchema: z.object({
    serverId: z.string().optional().describe('조회할 서버 ID (선택, 없으면 전체)'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .default('all')
      .describe('조회할 메트릭 타입'),
  }),
  execute: async ({
    serverId,
    metric,
  }: {
    serverId?: string;
    metric: 'cpu' | 'memory' | 'disk' | 'all';
  }) => {
    const state = getCurrentState();

    const servers: ServerSnapshot[] = serverId
      ? state.servers.filter((s) => s.id === serverId)
      : state.servers;

    return {
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
      })),
      summary: {
        total: servers.length,
        alertCount: servers.filter(
          (s) => s.status === 'warning' || s.status === 'critical'
        ).length,
      },
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * Advanced Server Metrics Tool
 * Supports time range, filtering, aggregation
 */
export const getServerMetricsAdvanced = tool({
  description: `고급 서버 메트릭 조회 도구. 시간 범위, 필터링, 집계 기능을 지원합니다.

사용 예시:
- "지난 6시간 동안 CPU 평균": timeRange="last6h", metric="cpu", aggregation="avg"
- "CPU 80% 이상인 서버들": filters=[{field:"cpu", operator:">", value:80}]
- "메모리 사용량 TOP 5 서버": metric="memory", sortBy="memory", limit=5
- "어제 CPU 최고치가 90% 넘었던 서버": timeRange="last24h", aggregation="max"`,
  inputSchema: z.object({
    serverId: z.string().optional().describe('특정 서버 ID (선택)'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'network', 'all'])
      .default('all')
      .describe('조회할 메트릭 타입'),
    timeRange: z
      .enum(['current', 'last1h', 'last6h', 'last24h'])
      .default('current')
      .describe('시간 범위'),
    filters: z
      .array(
        z.object({
          field: z.enum(['cpu', 'memory', 'disk', 'network', 'status']),
          operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
          value: z.union([z.number(), z.string()]),
        })
      )
      .optional()
      .describe('필터 조건 배열'),
    aggregation: z
      .enum(['avg', 'max', 'min', 'count', 'none'])
      .default('none')
      .describe('집계 함수'),
    sortBy: z
      .enum(['cpu', 'memory', 'disk', 'network', 'name'])
      .optional()
      .describe('정렬 기준'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('정렬 순서'),
    limit: z.number().optional().describe('결과 제한 개수'),
  }),
  execute: async ({
    serverId,
    metric,
    timeRange,
    filters,
    aggregation,
    sortBy,
    sortOrder,
    limit,
  }: {
    serverId?: string;
    metric: 'cpu' | 'memory' | 'disk' | 'network' | 'all';
    timeRange: 'current' | 'last1h' | 'last6h' | 'last24h';
    filters?: Array<{
      field: 'cpu' | 'memory' | 'disk' | 'network' | 'status';
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      value: number | string;
    }>;
    aggregation: 'avg' | 'max' | 'min' | 'count' | 'none';
    sortBy?: 'cpu' | 'memory' | 'disk' | 'network' | 'name';
    sortOrder: 'asc' | 'desc';
    limit?: number;
  }) => {
    try {
      // 1. Get target datasets
      const targetDatasets = serverId
        ? FIXED_24H_DATASETS.filter((d) => d.serverId === serverId)
        : FIXED_24H_DATASETS;

      if (targetDatasets.length === 0) {
        return { success: false, error: `Server not found: ${serverId}` };
      }

      // 2. Collect time range data
      const serverResults: Array<{
        id: string;
        name: string;
        type: string;
        location: string;
        metrics: Record<string, number>;
        dataPoints?: number;
      }> = [];

      for (const dataset of targetDatasets) {
        const dataPoints = getTimeRangeData(dataset, timeRange);
        if (dataPoints.length === 0) continue;

        let metrics: Record<string, number>;
        if (aggregation && aggregation !== 'none') {
          metrics = calculateAggregation(dataPoints, metric, aggregation);
        } else {
          const latest = dataPoints[dataPoints.length - 1] || dataPoints[0];
          metrics =
            metric === 'all'
              ? {
                  cpu: latest.cpu,
                  memory: latest.memory,
                  disk: latest.disk,
                  network: latest.network,
                }
              : { [metric]: latest[metric] };
        }

        serverResults.push({
          id: dataset.serverId,
          name: dataset.serverId,
          type: dataset.serverType,
          location: dataset.location,
          metrics,
          dataPoints: dataPoints.length,
        });
      }

      // 3. Apply filters
      let filteredResults = serverResults;
      if (filters && filters.length > 0) {
        filteredResults = serverResults.filter((server) => {
          return filters.every((filter) => {
            const value = server.metrics[filter.field];
            if (value === undefined) return true;

            switch (filter.operator) {
              case '>':
                return value > Number(filter.value);
              case '<':
                return value < Number(filter.value);
              case '>=':
                return value >= Number(filter.value);
              case '<=':
                return value <= Number(filter.value);
              case '==':
                return value === Number(filter.value);
              case '!=':
                return value !== Number(filter.value);
              default:
                return true;
            }
          });
        });
      }

      // 4. Apply sorting
      if (sortBy) {
        filteredResults.sort((a, b) => {
          const aVal = sortBy === 'name' ? a.name : (a.metrics[sortBy] ?? 0);
          const bVal = sortBy === 'name' ? b.name : (b.metrics[sortBy] ?? 0);
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortOrder === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          return sortOrder === 'asc'
            ? Number(aVal) - Number(bVal)
            : Number(bVal) - Number(aVal);
        });
      }

      // 5. Apply limit
      if (limit && limit > 0) {
        filteredResults = filteredResults.slice(0, limit);
      }

      return {
        success: true,
        query: { timeRange, metric, aggregation, sortBy, limit },
        servers: filteredResults,
        summary: {
          total: filteredResults.length,
          matchedFromTotal: `${filteredResults.length}/${targetDatasets.length}`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Filter Servers Tool
 * Quick filtering by condition
 */
export const filterServers = tool({
  description:
    '조건에 맞는 서버를 필터링합니다. 예: CPU 80% 이상, 메모리 90% 이상인 서버 찾기',
  inputSchema: z.object({
    field: z
      .enum(['cpu', 'memory', 'disk'])
      .describe('필터링할 메트릭'),
    operator: z
      .enum(['>', '<', '>=', '<='])
      .describe('비교 연산자'),
    value: z.number().describe('비교 값 (퍼센트)'),
    limit: z.number().default(10).describe('최대 결과 개수'),
  }),
  execute: async ({
    field,
    operator,
    value,
    limit,
  }: {
    field: 'cpu' | 'memory' | 'disk';
    operator: '>' | '<' | '>=' | '<=';
    value: number;
    limit: number;
  }) => {
    const state = getCurrentState();

    const filtered = state.servers.filter((server) => {
      const serverValue = server[field] as number;
      switch (operator) {
        case '>':
          return serverValue > value;
        case '<':
          return serverValue < value;
        case '>=':
          return serverValue >= value;
        case '<=':
          return serverValue <= value;
        default:
          return false;
      }
    });

    // Sort by the filtered field (descending for >, ascending for <)
    const sortedResults = filtered.sort((a, b) =>
      operator.includes('>') ? b[field] - a[field] : a[field] - b[field]
    );

    const limitedResults = sortedResults.slice(0, limit);

    return {
      success: true,
      condition: `${field} ${operator} ${value}%`,
      servers: limitedResults.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        [field]: s[field],
      })),
      summary: {
        matched: filtered.length,
        returned: limitedResults.length,
        total: state.servers.length,
      },
      timestamp: new Date().toISOString(),
    };
  },
});
