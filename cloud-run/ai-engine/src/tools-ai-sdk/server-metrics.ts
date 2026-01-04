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

// ============================================================================
// Response Schemas (Best Practice: Structured Output Documentation)
// ============================================================================

/**
 * Server info in response
 */
export const serverInfoSchema = z.object({
  id: z.string().describe('서버 고유 ID'),
  name: z.string().describe('서버 이름'),
  status: z.enum(['online', 'offline', 'warning', 'critical']).describe('서버 상태'),
  cpu: z.number().describe('CPU 사용률 (%)'),
  memory: z.number().describe('메모리 사용률 (%)'),
  disk: z.number().describe('디스크 사용률 (%)'),
});

/**
 * getServerMetrics response schema
 */
export const getServerMetricsResponseSchema = z.object({
  success: z.boolean(),
  servers: z.array(serverInfoSchema),
  summary: z.object({
    total: z.number().describe('전체 서버 수'),
    alertCount: z.number().describe('경고/위험 상태 서버 수'),
  }),
  timestamp: z.string().describe('조회 시간 (ISO 8601)'),
});

/**
 * getServerMetricsAdvanced response schema
 */
export const getServerMetricsAdvancedResponseSchema = z.object({
  success: z.boolean(),
  query: z.object({
    timeRange: z.string().optional(),
    metric: z.string().optional(),
    aggregation: z.string().optional(),
    sortBy: z.string().optional(),
    limit: z.number().optional(),
  }),
  servers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    location: z.string(),
    metrics: z.record(z.number()),
    dataPoints: z.number().optional(),
  })),
  summary: z.object({
    total: z.number(),
    matchedFromTotal: z.string(),
  }),
  timestamp: z.string(),
});

/**
 * filterServers response schema
 */
export const filterServersResponseSchema = z.object({
  success: z.boolean(),
  condition: z.string().describe('적용된 필터 조건'),
  servers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
  }).passthrough()), // Allow additional fields
  summary: z.object({
    matched: z.number().describe('조건에 맞는 서버 수'),
    returned: z.number().describe('반환된 서버 수'),
    total: z.number().describe('전체 서버 수'),
  }),
  timestamp: z.string(),
});

// Export types for external use
export type ServerInfo = z.infer<typeof serverInfoSchema>;
export type GetServerMetricsResponse = z.infer<typeof getServerMetricsResponseSchema>;
export type GetServerMetricsAdvancedResponse = z.infer<typeof getServerMetricsAdvancedResponseSchema>;
export type FilterServersResponse = z.infer<typeof filterServersResponseSchema>;

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
 *
 * Best Practices Applied:
 * - Detailed description with input/output examples
 * - .describe() on all schema fields
 * - Clear response structure documentation
 */
export const getServerMetrics = tool({
  description: `서버 CPU/메모리/디스크 상태를 조회합니다.

## 입력 예시 (Input Examples)
1. 전체 서버 조회: { }
2. 특정 서버: { "serverId": "api-server-01" }
3. CPU만 조회: { "metric": "cpu" }
4. 특정 서버 메모리: { "serverId": "db-server-02", "metric": "memory" }

## 출력 형식 (Output Schema)
{
  "success": true,
  "servers": [
    { "id": "api-server-01", "name": "API Server 01", "status": "online", "cpu": 45.2, "memory": 67.8, "disk": 55.1 }
  ],
  "summary": { "total": 10, "alertCount": 2 },
  "timestamp": "2025-01-04T12:00:00Z"
}

## 사용 시나리오
- "서버 상태 알려줘" → metric: "all" (기본값)
- "api-server-01 CPU 확인" → serverId: "api-server-01", metric: "cpu"`,
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('조회할 서버 ID. 예: "api-server-01", "db-server-02". 생략하면 모든 서버 조회. 절대 "all" 문자열을 넣지 마세요.'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .default('all')
      .describe('조회할 메트릭 종류. cpu=CPU 사용률, memory=메모리 사용률, disk=디스크 사용률, all=전체'),
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
 *
 * Best Practices Applied:
 * - Comprehensive description with input/output examples
 * - .describe() on all schema fields
 * - Clear response structure documentation
 */
export const getServerMetricsAdvanced = tool({
  description: `고급 서버 메트릭 조회 도구. 시간 범위, 필터링, 집계 기능을 지원합니다.

## 입력 예시 (Input Examples)
1. 시간 범위 + 집계:
   { "metric": "cpu", "timeRange": "last6h", "aggregation": "avg" }

2. 필터링:
   { "metric": "all", "filters": [{"field": "cpu", "operator": ">", "value": 80}] }

3. TOP N 정렬:
   { "metric": "memory", "sortBy": "memory", "sortOrder": "desc", "limit": 5 }

4. 복합 쿼리:
   { "timeRange": "last1h", "aggregation": "max", "sortBy": "cpu", "limit": 3 }

## 출력 형식 (Output Schema)
{
  "success": true,
  "query": { "timeRange": "last6h", "metric": "cpu", "aggregation": "avg" },
  "servers": [
    { "id": "api-server-01", "name": "api-server-01", "type": "api", "location": "seoul", "metrics": { "cpu": 65.3 }, "dataPoints": 36 }
  ],
  "summary": { "total": 10, "matchedFromTotal": "10/10" },
  "timestamp": "2025-01-04T12:00:00Z"
}

## 사용 시나리오
- "지난 6시간 CPU 평균" → timeRange="last6h", metric="cpu", aggregation="avg"
- "메모리 높은 순 5개" → sortBy="memory", sortOrder="desc", limit=5`,
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('조회할 서버 ID. 예: "db-server-01". 생략하면 모든 서버 대상. 절대 "all" 문자열을 넣지 마세요.'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'network', 'all'])
      .default('all')
      .describe('조회할 메트릭. cpu/memory/disk/network 중 선택 또는 all(전체)'),
    timeRange: z
      .enum(['current', 'last1h', 'last6h', 'last24h'])
      .default('current')
      .describe('시간 범위. current=현재, last1h=최근 1시간, last6h=최근 6시간, last24h=최근 24시간'),
    filters: z
      .array(
        z.object({
          field: z.enum(['cpu', 'memory', 'disk', 'network', 'status']).describe('필터 대상 필드'),
          operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).describe('비교 연산자'),
          value: z.union([z.number(), z.string()]).describe('비교할 값 (숫자 또는 문자열)'),
        })
      )
      .optional()
      .describe('필터 조건 배열. 예: [{field:"cpu", operator:">", value:80}]'),
    aggregation: z
      .enum(['avg', 'max', 'min', 'count', 'none'])
      .default('none')
      .describe('집계 함수. avg=평균, max=최대값, min=최소값, count=개수, none=집계안함'),
    sortBy: z
      .enum(['cpu', 'memory', 'disk', 'network', 'name'])
      .optional()
      .describe('정렬 기준 필드'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('정렬 순서. asc=오름차순, desc=내림차순'),
    limit: z.number().optional().describe('반환할 최대 서버 수. 예: 5면 TOP 5'),
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
 *
 * Best Practices Applied:
 * - Clear description with input/output examples
 * - .describe() on all schema fields
 * - Clear response structure documentation
 */
export const filterServers = tool({
  description: `조건에 맞는 서버를 빠르게 필터링합니다.

## 입력 예시 (Input Examples)
1. CPU 80% 초과:
   { "field": "cpu", "operator": ">", "value": 80 }

2. 메모리 90% 이상 TOP 3:
   { "field": "memory", "operator": ">=", "value": 90, "limit": 3 }

3. 디스크 50% 미만:
   { "field": "disk", "operator": "<", "value": 50 }

## 출력 형식 (Output Schema)
{
  "success": true,
  "condition": "cpu > 80%",
  "servers": [
    { "id": "db-server-01", "name": "DB Server 01", "status": "warning", "cpu": 92.5 }
  ],
  "summary": { "matched": 3, "returned": 3, "total": 10 },
  "timestamp": "2025-01-04T12:00:00Z"
}

## 사용 시나리오
- "CPU 80% 이상 서버" → field="cpu", operator=">", value=80
- "메모리 90% 넘는 서버 3개" → field="memory", operator=">", value=90, limit=3`,
  inputSchema: z.object({
    field: z
      .enum(['cpu', 'memory', 'disk'])
      .describe('필터링할 메트릭. cpu=CPU 사용률, memory=메모리 사용률, disk=디스크 사용률'),
    operator: z
      .enum(['>', '<', '>=', '<='])
      .describe('비교 연산자. >: 초과, <: 미만, >=: 이상, <=: 이하'),
    value: z.number().describe('비교할 임계값 (퍼센트). 예: 80이면 80% 의미'),
    limit: z.number().default(10).describe('반환할 최대 서버 수 (기본값: 10). TOP N 결과'),
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
