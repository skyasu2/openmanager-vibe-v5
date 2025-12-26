/**
 * NLQ (Natural Language Query) Agent
 * 자연어 쿼리를 서버 메트릭 조회로 변환
 *
 * ## Phase 1 Enhancement (2025-12-26)
 * - 시간 범위 쿼리 지원 (last1h, last6h, last24h, custom)
 * - 필터링 지원 (cpu > 80, memory < 50 등)
 * - 집계 함수 지원 (avg, max, min, count)
 * - 정렬/제한 지원
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getDataCache } from '../lib/cache-layer';
import { getSupabaseConfig } from '../lib/config-parser';
import {
  loadHourlyScenarioData,
  loadHistoricalContext,
} from '../services/scenario/scenario-loader';
import {
  FIXED_24H_DATASETS,
  getDataAtMinute,
  getRecentData,
  type Server24hDataset,
  type Fixed10MinMetric,
} from '../data/fixed-24h-metrics';

// ============================================================================
// 1. Tool Input Types
// ============================================================================

interface GetServerMetricsInput {
  serverId?: string;
  metric: 'cpu' | 'memory' | 'disk' | 'all';
}

interface GetServerLogsInput {
  serverId?: string;
  limit?: number;
}

/**
 * Advanced Query Input Schema
 */
interface GetServerMetricsAdvancedInput {
  serverId?: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network' | 'all';
  // 시간 범위
  timeRange?: 'current' | 'last1h' | 'last6h' | 'last24h';
  startMinute?: number; // 0-1439 (minute of day)
  endMinute?: number;
  // 필터링
  filters?: Array<{
    field: 'cpu' | 'memory' | 'disk' | 'network' | 'status';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number | string;
  }>;
  // 집계
  aggregation?: 'avg' | 'max' | 'min' | 'count' | 'none';
  // 정렬/제한
  sortBy?: 'cpu' | 'memory' | 'disk' | 'network' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// ============================================================================
// 1.1 Helper Functions
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
 * Apply filters to server metrics
 */
function applyFilters(
  servers: Array<{ id: string; cpu: number; memory: number; disk: number; network?: number; status?: string }>,
  filters: GetServerMetricsAdvancedInput['filters'],
  mode: 'AND' | 'OR' = 'AND'
): typeof servers {
  if (!filters || filters.length === 0) return servers;

  return servers.filter((server) => {
    const results = filters.map((filter) => {
      const fieldValue = server[filter.field as keyof typeof server];
      if (fieldValue === undefined) return true;

      switch (filter.operator) {
        case '>':
          return Number(fieldValue) > Number(filter.value);
        case '<':
          return Number(fieldValue) < Number(filter.value);
        case '>=':
          return Number(fieldValue) >= Number(filter.value);
        case '<=':
          return Number(fieldValue) <= Number(filter.value);
        case '==':
          return fieldValue === filter.value;
        case '!=':
          return fieldValue !== filter.value;
        default:
          return true;
      }
    });

    return mode === 'AND' ? results.every(Boolean) : results.some(Boolean);
  });
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
    const values = dataPoints.map((d) => d[m as keyof typeof d] as number).filter((v) => v !== undefined);
    if (values.length === 0) {
      result[m] = 0;
      continue;
    }

    switch (func) {
      case 'avg':
        result[m] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
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
  timeRange: string,
  startMinute?: number,
  endMinute?: number
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
      return [getDataAtMinute(dataset, currentMinute)].filter(Boolean) as Fixed10MinMetric[];
  }

  // Use getRecentData for historical data (6 points per hour)
  const pointsNeeded = hoursBack * 6;
  return getRecentData(dataset, currentMinute, pointsNeeded);
}

// ============================================================================
// 2. Tools Definition
// ============================================================================

export const getServerMetricsTool = tool(
  async ({ serverId, metric: _metric }: GetServerMetricsInput) => {
    const cache = getDataCache();

    // Cache metrics with 1-minute TTL
    const allServers = await cache.getMetrics(
      serverId,
      () => loadHourlyScenarioData()
    );

    const target = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers;

    const servers = Array.isArray(target)
      ? target
      : target
        ? [target]
        : allServers;

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
      _dataSource: 'scenario-loader',
      _cached: true,
    };
  },
  {
    name: 'getServerMetrics',
    description:
      '서버 CPU/메모리/디스크 상태를 조회합니다 (시나리오 기반 시뮬레이션)',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .describe('조회할 메트릭 타입'),
    }),
  }
);

export const getServerLogsTool = tool(
  async ({ serverId, limit = 5 }: GetServerLogsInput) => {
    const cache = getDataCache();
    const cacheKey = `logs:${serverId || 'all'}:${limit}`;

    // Cache logs with 5-minute TTL (RAG)
    return cache.getHistoricalContext(cacheKey, async () => {
      // Use config-parser for unified JSON secret support
      const config = getSupabaseConfig();

      if (!config) {
        return { success: false, error: 'Supabase config missing' };
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(config.url, config.serviceRoleKey);

        let query = supabase
          .from('server_logs')
          .select('timestamp, level, message, source')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (serverId) {
          query = query.eq('server_id', serverId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          success: true,
          serverId: serverId || 'ALL',
          logs: data,
          count: data?.length || 0,
          _dataSource: 'supabase-db',
          _cached: true,
        };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    });
  },
  {
    name: 'getServerLogs',
    description: '서버의 최근 로그 및 장애 이력을 DB에서 조회합니다 (RAG)',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      limit: z.number().optional().default(5).describe('조회할 로그 개수'),
    }),
  }
);

// ============================================================================
// 3. Advanced Tool (Phase 1 Enhancement)
// ============================================================================

/**
 * Advanced Server Metrics Tool
 * 시간 범위, 필터링, 집계 기능을 지원하는 고급 메트릭 조회 도구
 */
export const getServerMetricsAdvancedTool = tool(
  async ({
    serverId,
    metric,
    timeRange = 'current',
    filters,
    aggregation = 'none',
    sortBy,
    sortOrder = 'desc',
    limit,
  }: GetServerMetricsAdvancedInput) => {
    try {
      // 1. 대상 서버 결정
      const targetDatasets = serverId
        ? FIXED_24H_DATASETS.filter((d) => d.serverId === serverId)
        : FIXED_24H_DATASETS;

      if (targetDatasets.length === 0) {
        return {
          success: false,
          error: `Server not found: ${serverId}`,
        };
      }

      // 2. 시간 범위별 데이터 수집
      const serverResults: Array<{
        id: string;
        name: string;
        type: string;
        location: string;
        metrics: Record<string, number>;
        dataPoints?: number;
        timeRange: string;
      }> = [];

      for (const dataset of targetDatasets) {
        const dataPoints = getTimeRangeData(dataset, timeRange);

        if (dataPoints.length === 0) continue;

        // 3. 집계 처리
        let metrics: Record<string, number>;
        if (aggregation && aggregation !== 'none') {
          metrics = calculateAggregation(dataPoints, metric, aggregation);
        } else {
          // 현재 시점 데이터 (최신 포인트)
          const latest = dataPoints[dataPoints.length - 1] || dataPoints[0];
          metrics =
            metric === 'all'
              ? { cpu: latest.cpu, memory: latest.memory, disk: latest.disk, network: latest.network }
              : { [metric]: latest[metric] };
        }

        serverResults.push({
          id: dataset.serverId,
          name: dataset.serverId,
          type: dataset.serverType,
          location: dataset.location,
          metrics,
          dataPoints: dataPoints.length,
          timeRange,
        });
      }

      // 4. 필터링 적용
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

      // 5. 정렬 적용
      if (sortBy) {
        filteredResults.sort((a, b) => {
          const aVal = sortBy === 'name' ? a.name : (a.metrics[sortBy] ?? 0);
          const bVal = sortBy === 'name' ? b.name : (b.metrics[sortBy] ?? 0);
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });
      }

      // 6. 제한 적용
      if (limit && limit > 0) {
        filteredResults = filteredResults.slice(0, limit);
      }

      return {
        success: true,
        query: {
          timeRange,
          metric,
          aggregation,
          filters: filters?.length ?? 0,
          sortBy,
          sortOrder,
          limit,
        },
        servers: filteredResults,
        summary: {
          total: filteredResults.length,
          matchedFromTotal: `${filteredResults.length}/${targetDatasets.length}`,
        },
        timestamp: new Date().toISOString(),
        _dataSource: 'fixed-24h-metrics',
        _enhanced: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    name: 'getServerMetricsAdvanced',
    description: `고급 서버 메트릭 조회 도구. 시간 범위(last1h, last6h, last24h), 필터링(cpu > 80), 집계(avg, max, min) 기능을 지원합니다.

사용 예시:
- "지난 6시간 동안 CPU 평균": timeRange="last6h", metric="cpu", aggregation="avg"
- "CPU 80% 이상인 서버들": filters=[{field:"cpu", operator:">", value:80}]
- "메모리 사용량 TOP 5 서버": metric="memory", sortBy="memory", sortOrder="desc", limit=5
- "어제 CPU 최고치가 90% 넘었던 서버": timeRange="last24h", aggregation="max", filters=[{field:"cpu", operator:">", value:90}]`,
    schema: z.object({
      serverId: z.string().optional().describe('특정 서버 ID (선택, 없으면 전체)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'network', 'all'])
        .describe('조회할 메트릭 타입'),
      timeRange: z
        .enum(['current', 'last1h', 'last6h', 'last24h'])
        .optional()
        .default('current')
        .describe('시간 범위 (current: 현재, last1h: 지난 1시간, last6h: 지난 6시간, last24h: 지난 24시간)'),
      filters: z
        .array(
          z.object({
            field: z.enum(['cpu', 'memory', 'disk', 'network', 'status']).describe('필터 대상 필드'),
            operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).describe('비교 연산자'),
            value: z.union([z.number(), z.string()]).describe('비교 값'),
          })
        )
        .optional()
        .describe('필터 조건 배열 (AND 조합)'),
      aggregation: z
        .enum(['avg', 'max', 'min', 'count', 'none'])
        .optional()
        .default('none')
        .describe('집계 함수 (시간 범위 데이터에 적용)'),
      sortBy: z
        .enum(['cpu', 'memory', 'disk', 'network', 'name'])
        .optional()
        .describe('정렬 기준'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .default('desc')
        .describe('정렬 순서'),
      limit: z.number().optional().describe('결과 제한 개수'),
    }),
  }
);

// ============================================================================
// 4. Exports (All Tools)
// ============================================================================

export const nlqTools = [
  getServerMetricsTool,
  getServerLogsTool,
  getServerMetricsAdvancedTool,
];

// 🚫 Dead Code Removed: nlqAgentNode
// This function was a legacy standalone node.
// Current architecture uses createReactAgent in multi-agent-supervisor.ts.
// Errors in tools (getServerMetricsTool, getServerLogsTool) will be propagated
// essentially by LangGraph to the supervisor.

