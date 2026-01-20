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
// Cache Key Utilities
// ============================================================================

/**
 * Create stable cache key from filter array
 * Ensures consistent key order in objects and sorted array items
 */
function stableStringify(filters: Array<Record<string, unknown>> | undefined): string {
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
  answer: z.string().describe('⚠️ 사용자에게 이 값을 그대로 전달하세요'),
  globalSummary: z.record(z.number()).describe('전체 서버 집계: cpu_avg, cpu_max, cpu_min 등'),
  serverCount: z.number().describe('조회된 서버 수'),
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
  })).describe('상위 5개 서버 샘플'),
  hasMore: z.boolean().describe('5개 이상일 때 true'),
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

/**
 * getServerByGroup response schema
 */
export const getServerByGroupAdvancedResponseSchema = z.object({
  success: z.boolean(),
  group: z.string(),
  servers: z.array(serverInfoSchema),
  summary: z.object({
    total: z.number(),
    online: z.number(),
    warning: z.number(),
    critical: z.number(),
    filtered: z.number().describe('Number of servers after applying filters'),
  }),
  appliedFilters: z.object({
    cpuMin: z.number().optional(),
    cpuMax: z.number().optional(),
    memoryMin: z.number().optional(),
    memoryMax: z.number().optional(),
    status: z.string().optional(),
  }).optional(),
  appliedSort: z.object({
    by: z.string(),
    order: z.string(),
  }).optional(),
  timestamp: z.string(),
});

export const getServerByGroupResponseSchema = z.object({
  success: z.boolean(),
  group: z.string().describe('조회된 서버 그룹/타입'),
  servers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.enum(['online', 'warning', 'critical']),
    cpu: z.number(),
    memory: z.number(),
    disk: z.number(),
  })),
  summary: z.object({
    total: z.number().describe('해당 그룹 서버 총 수'),
    online: z.number().describe('온라인 상태 수'),
    warning: z.number().describe('경고 상태 수'),
    critical: z.number().describe('위험 상태 수'),
  }),
  timestamp: z.string(),
});

// Export types for external use
export type ServerInfo = z.infer<typeof serverInfoSchema>;
export type GetServerMetricsResponse = z.infer<typeof getServerMetricsResponseSchema>;
export type GetServerMetricsAdvancedResponse = z.infer<typeof getServerMetricsAdvancedResponseSchema>;
export type FilterServersResponse = z.infer<typeof filterServersResponseSchema>;
export type GetServerByGroupResponse = z.infer<typeof getServerByGroupResponseSchema>;

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

// Caching
import { getDataCache } from '../lib/cache-layer';

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
  description: `[현재 상태 전용] 서버 CPU/메모리/디스크의 실시간 상태를 조회합니다.

⚠️ 시간 범위(지난 1시간, 6시간 등), 평균/최대값 집계가 필요하면 getServerMetricsAdvanced를 사용하세요.

## 입력 예시
1. 전체 서버 현재 상태: { }
2. 특정 서버: { "serverId": "web-nginx-icn-01" }

## 출력 형식
{ "success": true, "servers": [{ "id": "...", "name": "...", "cpu": 45, "memory": 67, "disk": 55 }], "summary": { "total": 15 } }

## 사용 시나리오
- "서버 상태" / "현재 CPU" → 이 도구
- "지난 6시간 평균" / "최근 1시간 최대값" → getServerMetricsAdvanced 사용`,
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
    const cache = getDataCache();
    const cacheKey = serverId || 'all';

    // Best Practice: Use cache.getMetrics with lazy computation
    return cache.getMetrics(cacheKey, async () => {
      const state = getCurrentState();

      const servers: ServerSnapshot[] = serverId
        ? state.servers.filter((s) => s.id === serverId)
        : state.servers;

      console.log(`📊 [getServerMetrics] Computing for ${cacheKey} (cache miss)`);

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
        _cached: false,
      };
    });
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
  description: `시간 범위 집계 도구. "지난 N시간", "평균", "최대값" 질문에 사용.

⚠️ 중요: 응답의 "answer" 필드를 사용자에게 그대로 전달하세요.

예시:
- "6시간 CPU 평균" → { "timeRange": "last6h", "metric": "cpu", "aggregation": "avg" }

출력: { answer: "지난 6시간 전체 15대 서버 집계: cpu_avg=34%...", globalSummary: {...} }`,
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
    const cache = getDataCache();
    // Cache key: combine all parameters that affect the result
    // Use stableStringify for filters to ensure consistent key order
    const cacheKey = `adv:${serverId || 'all'}:${timeRange}:${metric}:${aggregation}:${sortBy || 'none'}:${sortOrder}:${limit || 0}:${stableStringify(filters)}`;

    return cache.getOrCompute('metrics', cacheKey, async () => {
    console.log(`📊 [getServerMetricsAdvanced] Computing for ${cacheKey} (cache miss)`);
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

      // 6. Calculate global summary (across all servers)
      const globalSummary: Record<string, number> = {};
      if (filteredResults.length > 0) {
        const metricsToSummarize = metric === 'all' ? ['cpu', 'memory', 'disk'] : [metric];
        for (const m of metricsToSummarize) {
          const values = filteredResults
            .map((s) => s.metrics[m])
            .filter((v) => v !== undefined);
          if (values.length > 0) {
            globalSummary[`${m}_avg`] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
            globalSummary[`${m}_max`] = Math.max(...values);
            globalSummary[`${m}_min`] = Math.min(...values);
          }
        }
      }

      // 7. Generate interpretation for LLM
      const timeRangeKr = {
        current: '현재',
        last1h: '지난 1시간',
        last6h: '지난 6시간',
        last24h: '지난 24시간',
      }[timeRange];

      const interpretation = Object.keys(globalSummary).length > 0
        ? `[응답 가이드] ${timeRangeKr} 전체 ${filteredResults.length}대 서버 집계: ` +
          Object.entries(globalSummary)
            .map(([k, v]) => `${k}=${v}%`)
            .join(', ') +
          '. 이 값을 사용자에게 전달하세요.'
        : null;

      return {
        success: true,
        // ⚠️ LLM: 아래 answer를 그대로 사용하세요
        answer: interpretation || `${timeRangeKr} 데이터 조회 완료`,
        globalSummary,
        serverCount: filteredResults.length,
        query: { timeRange, metric, aggregation, sortBy, limit },
        servers: filteredResults.slice(0, 5), // 상위 5개만 반환 (토큰 절약)
        hasMore: filteredResults.length > 5,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    }); // End of cache.getOrCompute wrapper
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
    const cache = getDataCache();
    const cacheKey = `filter:${field}:${operator}:${value}:${limit}`;

    return cache.getOrCompute('metrics', cacheKey, async () => {
    console.log(`📊 [filterServers] Computing for ${cacheKey} (cache miss)`);
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
    }); // End of cache.getOrCompute wrapper
  },
});

/**
 * Server By Group Tool
 * Query servers by type/group (db, lb, web, cache, etc.)
 *
 * Best Practices Applied:
 * - Supports common abbreviations (db→database, lb→loadbalancer)
 * - Clear description with input/output examples
 * - Cached for performance
 */
export const getServerByGroup = tool({
  description: `서버 그룹/타입으로 조회합니다. DB 서버, 로드밸런서, 웹 서버 등 특정 유형의 서버를 조회할 때 사용하세요.

## 지원하는 그룹/타입
- database (또는 db, mysql, postgres, mongodb, oracle): 데이터베이스 서버
- loadbalancer (또는 lb, haproxy, f5): 로드밸런서 서버
- web (또는 nginx, apache, httpd, frontend): 웹 서버
- cache (또는 redis, memcached, varnish): 캐시 서버
- storage (또는 nas, s3, minio, nfs): 스토리지 서버
- application (또는 api, app, backend): 애플리케이션/API 서버

## 입력 예시
1. DB 서버 조회: { "group": "db" } 또는 { "group": "database" }
2. 로드밸런서 조회: { "group": "lb" } 또는 { "group": "loadbalancer" }
3. 웹 서버 조회: { "group": "web" }
4. 캐시 서버 조회: { "group": "cache" }

## 출력 형식
{
  "success": true,
  "group": "database",
  "servers": [
    { "id": "db-mysql-icn-01", "name": "MySQL Primary", "type": "database", "status": "online", "cpu": 45, "memory": 78, "disk": 62 }
  ],
  "summary": { "total": 2, "online": 2, "warning": 0, "critical": 0 }
}

## 사용 시나리오
- "DB 서버 상태 알려줘" → group="db"
- "로드밸런서 현황" → group="lb"
- "웹 서버 목록" → group="web"
- "캐시 서버 확인" → group="cache"`,
  inputSchema: z.object({
    group: z
      .string()
      .describe('서버 그룹/타입. 기본: db, database, lb, loadbalancer, web, cache, storage, application, api, app. 확장: mysql, postgres, mongodb, oracle, haproxy, f5, nginx, apache, redis, memcached, nas, s3, backend'),
  }),
  execute: async ({ group }: { group: string }) => {
    const cache = getDataCache();
    const normalizedGroup = group.toLowerCase().trim();
    const cacheKey = `group:${normalizedGroup}`;

    return cache.getOrCompute('metrics', cacheKey, async () => {
      console.log(`📊 [getServerByGroup] Computing for ${cacheKey} (cache miss)`);

      // Abbreviation mapping (technology stack → canonical type)
      const typeMap: Record<string, string> = {
        // Database variants
        'db': 'database',
        'mysql': 'database',
        'postgres': 'database',
        'postgresql': 'database',
        'mongodb': 'database',
        'oracle': 'database',
        'mariadb': 'database',
        // Load Balancer variants
        'lb': 'loadbalancer',
        'haproxy': 'loadbalancer',
        'f5': 'loadbalancer',
        'elb': 'loadbalancer',
        'alb': 'loadbalancer',
        // Web server variants
        'nginx': 'web',
        'apache': 'web',
        'httpd': 'web',
        'frontend': 'web',
        // Cache variants
        'redis': 'cache',
        'memcached': 'cache',
        'varnish': 'cache',
        'elasticache': 'cache',
        // Storage variants
        'nas': 'storage',
        's3': 'storage',
        'minio': 'storage',
        'nfs': 'storage',
        'efs': 'storage',
        // Application variants
        'api': 'application',
        'app': 'application',
        'backend': 'application',
        'server': 'application',
      };

      const targetType = typeMap[normalizedGroup] || normalizedGroup;
      const state = getCurrentState();

      // Normalize server type (handles both directions)
      const normalizeType = (type: string): string => {
        const t = type.toLowerCase().trim();
        return typeMap[t] || t;
      };

      // Filter by server type (exact match only after normalization)
      const filteredServers = state.servers.filter((s) => {
        const serverType = normalizeType(s.type || '');
        return serverType === targetType;
      });

      // Calculate summary
      const summary = {
        total: filteredServers.length,
        online: filteredServers.filter((s) => s.status === 'online').length,
        warning: filteredServers.filter((s) => s.status === 'warning').length,
        critical: filteredServers.filter((s) => s.status === 'critical').length,
      };

      return {
        success: true,
        group: targetType,
        servers: filteredServers.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type || targetType,
          status: s.status,
          cpu: s.cpu,
          memory: s.memory,
          disk: s.disk,
        })),
        summary,
        timestamp: new Date().toISOString(),
      };
    });
  },
});

/**
 * Server By Group Advanced Tool
 * Query servers by type/group with filtering and sorting support
 *
 * Best Practices Applied:
 * - Extends getServerByGroup with filtering/sorting
 * - Supports compound queries like "DB 서버 중 CPU 80% 이상"
 * - Maintains backward compatibility
 */
export const getServerByGroupAdvanced = tool({
  description: `서버 그룹/타입 조회 + 필터링/정렬 기능. 복합 조건 쿼리에 사용하세요.

## 사용 시나리오
- "DB 서버 중 CPU 80% 이상" → group="db", filters={ cpuMin: 80 }
- "웹 서버 메모리 순으로 정렬" → group="web", sort={ by: "memory", order: "desc" }
- "캐시 서버 중 warning 상태" → group="cache", filters={ status: "warning" }
- "상위 3개 DB 서버 (CPU 기준)" → group="db", sort={ by: "cpu", order: "desc" }, limit=3

## 지원 그룹 (getServerByGroup과 동일)
database, loadbalancer, web, cache, storage, application + 기술 스택 약어

## 필터 옵션
- cpuMin/cpuMax: CPU 사용률 범위 (0-100)
- memoryMin/memoryMax: 메모리 사용률 범위 (0-100)
- status: online | warning | critical

## 정렬 옵션
- by: cpu | memory | disk | network | name
- order: asc | desc`,
  inputSchema: z.object({
    group: z
      .string()
      .describe('서버 그룹/타입 (db, mysql, nginx, redis 등)'),
    filters: z.object({
      cpuMin: z.number().min(0).max(100).optional().describe('최소 CPU 사용률'),
      cpuMax: z.number().min(0).max(100).optional().describe('최대 CPU 사용률'),
      memoryMin: z.number().min(0).max(100).optional().describe('최소 메모리 사용률'),
      memoryMax: z.number().min(0).max(100).optional().describe('최대 메모리 사용률'),
      status: z.enum(['online', 'warning', 'critical']).optional().describe('서버 상태'),
    }).optional().describe('필터 조건'),
    sort: z.object({
      by: z.enum(['cpu', 'memory', 'disk', 'network', 'name']).describe('정렬 기준'),
      order: z.enum(['asc', 'desc']).describe('정렬 순서'),
    }).optional().describe('정렬 옵션'),
    limit: z.number().min(1).max(100).optional().describe('최대 결과 수'),
  }),
  execute: async ({
    group,
    filters,
    sort,
    limit,
  }: {
    group: string;
    filters?: {
      cpuMin?: number;
      cpuMax?: number;
      memoryMin?: number;
      memoryMax?: number;
      status?: 'online' | 'warning' | 'critical';
    };
    sort?: {
      by: 'cpu' | 'memory' | 'disk' | 'network' | 'name';
      order: 'asc' | 'desc';
    };
    limit?: number;
  }) => {
    const cache = getDataCache();
    const normalizedGroup = group.toLowerCase().trim();
    const filterKey = filters ? JSON.stringify(filters) : 'none';
    const sortKey = sort ? `${sort.by}-${sort.order}` : 'none';
    const cacheKey = `group-adv:${normalizedGroup}:${filterKey}:${sortKey}:${limit || 'all'}`;

    return cache.getOrCompute('metrics', cacheKey, async () => {
      console.log(`📊 [getServerByGroupAdvanced] Computing for ${cacheKey} (cache miss)`);

      // Reuse typeMap from getServerByGroup
      const typeMap: Record<string, string> = {
        // Database variants
        'db': 'database',
        'mysql': 'database',
        'postgres': 'database',
        'postgresql': 'database',
        'mongodb': 'database',
        'oracle': 'database',
        'mariadb': 'database',
        // Load Balancer variants
        'lb': 'loadbalancer',
        'haproxy': 'loadbalancer',
        'f5': 'loadbalancer',
        'elb': 'loadbalancer',
        'alb': 'loadbalancer',
        // Web server variants
        'nginx': 'web',
        'apache': 'web',
        'httpd': 'web',
        'frontend': 'web',
        // Cache variants
        'redis': 'cache',
        'memcached': 'cache',
        'varnish': 'cache',
        'elasticache': 'cache',
        // Storage variants
        'nas': 'storage',
        's3': 'storage',
        'minio': 'storage',
        'nfs': 'storage',
        'efs': 'storage',
        // Application variants
        'api': 'application',
        'app': 'application',
        'backend': 'application',
        'server': 'application',
      };

      const targetType = typeMap[normalizedGroup] || normalizedGroup;
      const state = getCurrentState();

      // Normalize server type
      const normalizeType = (type: string): string => {
        const t = type.toLowerCase().trim();
        return typeMap[t] || t;
      };

      // Step 1: Filter by server type
      let filteredServers = state.servers.filter((s) => {
        const serverType = normalizeType(s.type || '');
        return serverType === targetType;
      });

      const totalBeforeFilters = filteredServers.length;

      // Step 2: Apply metric filters
      if (filters) {
        if (filters.cpuMin !== undefined) {
          filteredServers = filteredServers.filter((s) => s.cpu >= filters.cpuMin!);
        }
        if (filters.cpuMax !== undefined) {
          filteredServers = filteredServers.filter((s) => s.cpu <= filters.cpuMax!);
        }
        if (filters.memoryMin !== undefined) {
          filteredServers = filteredServers.filter((s) => s.memory >= filters.memoryMin!);
        }
        if (filters.memoryMax !== undefined) {
          filteredServers = filteredServers.filter((s) => s.memory <= filters.memoryMax!);
        }
        if (filters.status) {
          filteredServers = filteredServers.filter((s) => s.status === filters.status);
        }
      }

      // Step 3: Apply sorting
      if (sort) {
        filteredServers.sort((a, b) => {
          let valueA: number | string;
          let valueB: number | string;

          switch (sort.by) {
            case 'cpu':
              valueA = a.cpu;
              valueB = b.cpu;
              break;
            case 'memory':
              valueA = a.memory;
              valueB = b.memory;
              break;
            case 'disk':
              valueA = a.disk;
              valueB = b.disk;
              break;
            case 'network':
              valueA = a.network || 0;
              valueB = b.network || 0;
              break;
            case 'name':
              valueA = a.name;
              valueB = b.name;
              break;
            default:
              valueA = a.cpu;
              valueB = b.cpu;
          }

          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sort.order === 'asc'
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          }

          return sort.order === 'asc'
            ? (valueA as number) - (valueB as number)
            : (valueB as number) - (valueA as number);
        });
      }

      // Step 4: Apply limit
      if (limit && limit > 0) {
        filteredServers = filteredServers.slice(0, limit);
      }

      // Calculate summary (from filtered results)
      const summary = {
        total: totalBeforeFilters,
        online: filteredServers.filter((s) => s.status === 'online').length,
        warning: filteredServers.filter((s) => s.status === 'warning').length,
        critical: filteredServers.filter((s) => s.status === 'critical').length,
        filtered: filteredServers.length,
      };

      return {
        success: true,
        group: targetType,
        servers: filteredServers.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type || targetType,
          status: s.status,
          cpu: s.cpu,
          memory: s.memory,
          disk: s.disk,
          network: s.network,
        })),
        summary,
        appliedFilters: filters || undefined,
        appliedSort: sort || undefined,
        timestamp: new Date().toISOString(),
      };
    });
  },
});
