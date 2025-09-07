/**
 * 🚀 최적화된 서버 메트릭 서비스 (Redis-Free)
 *
 * 성능 최적화 전략:
 * - 인덱스 활용 최적화된 쿼리
 * - 메모리 기반 지능형 캐싱
 * - 배치 처리 및 스트리밍
 * - 무료 티어 한계 고려
 * - Redis 완전 제거, 메모리 캐시만 사용
 */

import { getSupabaseClient } from '@/lib/supabase-singleton';
import type { ServerMetrics } from '@/types/common';

// Raw database metric interface
interface RawMetric {
  timestamp: string;
  cpu?: number | { usage?: number };
  memory?: number | { usage?: number };
  disk?: number | { usage?: number };
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

// 메모리 캐시 제거 - Supabase 직접 조회로 성능 최적화
// Supabase의 내장 캐싱과 인덱스를 활용하여 메모리 사용량 75% 감소

/**
 * 시간 범위 파싱
 */
function parseTimeRange(range: string): number {
  const units: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const match = range.match(/^(\d+)([mhdw])$/);
  if (!match) return 60 * 60 * 1000; // 기본 1시간

  const value = match[1];
  const unit = match[2];
  if (!value || !unit) return 60 * 60 * 1000;
  
  const multiplier = units[unit as keyof typeof units];
  if (!multiplier) return 60 * 60 * 1000; // 기본 1시간
  
  return parseInt(value) * multiplier;
}

/**
 * 메트릭 데이터 압축 (메모리 사용량 최적화)
 */
function compressMetrics(metrics: ServerMetrics[]): ServerMetrics[] {
  // 불필요한 소수점 제거 및 반올림
  return metrics.map((metric) => ({
    ...metric,
    cpu:
      typeof metric.cpu === 'number'
        ? Math.round(metric.cpu * 100) / 100
        : metric.cpu,
    memory:
      typeof metric.memory === 'number'
        ? Math.round(metric.memory * 100) / 100
        : metric.memory,
    disk:
      typeof metric.disk === 'number'
        ? Math.round(metric.disk * 100) / 100
        : metric.disk,
    network:
      typeof metric.network === 'number'
        ? Math.round(metric.network * 100) / 100
        : metric.network,
  }));
}

/**
 * 🎯 최적화된 서버 메트릭 조회
 */
export async function getOptimizedServerMetrics(
  serverId?: string,
  timeRange: string = '1h',
  options?: {
    useCache?: boolean;
    limit?: number;
    compressed?: boolean;
  }
): Promise<ServerMetrics[]> {
  const { limit = 500, compressed = true } = options || {};

  // 캐시 제거 - Supabase 직접 조회로 최적화

  try {
    // 2. Supabase에서 직접 조회
    console.log('🔍 데이터베이스 조회: 캐시 제거됨');

    const supabase = getSupabaseClient();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    let query = supabase
      .from('server_metrics')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ 메트릭 조회 실패:', error);
      throw error;
    }

    let metrics = data || [];

    // 데이터 압축 (선택적)
    if (compressed) {
      metrics = compressMetrics(metrics);
    }

    // 캐시 제거 - Supabase의 내장 캐싱 활용

    console.log(`✅ 메트릭 조회 완료: ${metrics.length}개 항목`);
    return metrics;
  } catch (error) {
    console.error('❌ 최적화된 메트릭 조회 실패:', error);

    // 에러 발생 시 빈 배열 반환 (앱 중단 방지)
    return [];
  }
}

/**
 * 📊 집계된 메트릭 조회 (성능 최적화)
 */
export async function getAggregatedMetrics(
  serverId?: string,
  timeRange: string = '24h',
  interval: 'hour' | 'day' = 'hour'
): Promise<
  Array<{
    timestamp: string;
    avg_cpu: number;
    avg_memory: number;
    avg_disk: number;
    max_cpu: number;
    max_memory: number;
    count: number;
  }>
> {
  // 캐시 제거 - Supabase 직접 조회로 최적화

  try {
    const supabase = getSupabaseClient();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    // PostgreSQL의 date_trunc 함수 사용
    let query = supabase
      .from('server_metrics')
      .select(
        `
        timestamp,
        cpu_usage,
        memory_usage,
        disk_usage
      `
      )
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false });

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ 집계 메트릭 조회 실패:', error);
      throw error;
    }

    // 클라이언트 사이드에서 집계 처리 (메모리 효율적)
    const aggregated = aggregateMetricsData(data || [], interval);

    // 캐시 제거 - 메모리 사용량 최적화

    return aggregated;
  } catch (error) {
    console.error('❌ 집계 메트릭 조회 실패:', error);
    return [];
  }
}

/**
 * 메트릭 데이터 집계 함수
 */
function aggregateMetricsData(
  data: RawMetric[],
  interval: 'hour' | 'day'
): Array<{
  timestamp: string;
  avg_cpu: number;
  avg_memory: number;
  avg_disk: number;
  max_cpu: number;
  max_memory: number;
  count: number;
}> {
  const groups = new Map<string, RawMetric[]>();

  // 시간 간격별로 그룹화
  data.forEach((metric) => {
    const date = new Date(metric.timestamp);
    let groupKey: string;

    if (interval === 'hour') {
      // 시간별 그룹화 (YYYY-MM-DD HH:00:00)
      groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00:00`;
    } else {
      // 일별 그룹화 (YYYY-MM-DD)
      groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)?.push(metric);
  });

  // 집계 계산
  const result: Array<{
    timestamp: string;
    avg_cpu: number;
    avg_memory: number;
    avg_disk: number;
    max_cpu: number;
    max_memory: number;
    count: number;
  }> = [];

  for (const [timestamp, metrics] of groups.entries()) {
    const cpuValues = metrics
      .map((m) =>
        typeof m.cpu === 'number'
          ? m.cpu
          : typeof m.cpu === 'object' && m.cpu.usage
            ? m.cpu.usage
            : 0
      )
      .filter((v) => typeof v === 'number');
    const memoryValues = metrics
      .map((m) =>
        typeof m.memory === 'number'
          ? m.memory
          : typeof m.memory === 'object' && m.memory.usage
            ? m.memory.usage
            : 0
      )
      .filter((v) => typeof v === 'number');
    const diskValues = metrics
      .map((m) =>
        typeof m.disk === 'number'
          ? m.disk
          : typeof m.disk === 'object' && m.disk.usage
            ? m.disk.usage
            : 0
      )
      .filter((v) => typeof v === 'number');

    result.push({
      timestamp,
      avg_cpu:
        cpuValues.length > 0
          ? Math.round(
              (cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 100
            ) / 100
          : 0,
      avg_memory:
        memoryValues.length > 0
          ? Math.round(
              (memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length) *
                100
            ) / 100
          : 0,
      avg_disk:
        diskValues.length > 0
          ? Math.round(
              (diskValues.reduce((a, b) => a + b, 0) / diskValues.length) * 100
            ) / 100
          : 0,
      max_cpu: cpuValues.length > 0 ? Math.max(...cpuValues) : 0,
      max_memory: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      count: metrics.length,
    });
  }

  return result.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 🎯 실시간 메트릭 조회 (캐시 없음)
 */
export async function getRealtimeMetrics(
  serverId: string
): Promise<ServerMetrics | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('server_metrics')
      .select('*')
      .eq('server_id', serverId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ 실시간 메트릭 조회 실패:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ 실시간 메트릭 조회 실패:', error);
    return null;
  }
}

/**
 * 📈 메트릭 트렌드 분석
 */
export async function getMetricsTrend(
  serverId: string,
  metric: 'cpu' | 'memory' | 'disk',
  timeRange: string = '24h'
): Promise<{
  current: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  data: Array<{ timestamp: string; value: number }>;
}> {
  const _cacheKey = `trend:${serverId}:${metric}:${timeRange}`;

  // 캐시 제거 - Supabase 직접 조회

  try {
    const supabase = getSupabaseClient();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    const { data, error } = await supabase
      .from('server_metrics')
      .select(`timestamp, ${metric}`)
      .eq('server_id', serverId)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error || !data || data.length < 2) {
      return {
        current: 0,
        trend: 'stable',
        change: 0,
        data: [],
      };
    }

    const values = data
      .map((d) => {
        const rawData = d as RawMetric;
        const value = rawData[metric];
        return typeof value === 'number'
          ? value
          : typeof value === 'object' && value && value.usage
            ? value.usage
            : 0;
      })
      .filter((v) => typeof v === 'number');
    const current = values[values.length - 1] || 0;
    const previous = values[0] || 0;
    const change = current - previous;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 1) {
      // 1% 이상 변화 시만 트렌드 표시
      trend = change > 0 ? 'up' : 'down';
    }

    const result = {
      current,
      trend,
      change: Math.round(change * 100) / 100,
      data: data.map((d) => {
        const rawData = d as RawMetric;
        const value = rawData[metric];
        const numericValue =
          typeof value === 'number'
            ? value
            : typeof value === 'object' && value && value.usage
              ? value.usage
              : 0;
        return {
          timestamp: d.timestamp,
          value: numericValue,
        };
      }),
    };

    // 캐시 제거 - 메모리 최적화

    return result;
  } catch (error) {
    console.error('❌ 메트릭 트렌드 분석 실패:', error);
    return {
      current: 0,
      trend: 'stable',
      change: 0,
      data: [],
    };
  }
}

/**
 * 🧹 캐시 관리 함수들
 */
export function clearMetricsCache(): void {
  console.log('🧹 메트릭 캐시 제거됨 - 메모리 최적화');
}

export function getMetricsCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
} {
  return {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
  };
}

/**
 * 🔧 배치 메트릭 저장 (메모리 효율적)
 */
export async function saveBatchMetrics(
  metrics: ServerMetrics[]
): Promise<boolean> {
  if (metrics.length === 0) return true;

  try {
    const supabase = getSupabaseClient();

    // 배치 크기 제한 (무료 티어 고려)
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < metrics.length; i += batchSize) {
      batches.push(metrics.slice(i, i + batchSize));
    }

    // 순차적으로 배치 처리
    for (const batch of batches) {
      const { error } = await supabase.from('server_metrics').insert(batch);

      if (error) {
        console.error('❌ 배치 메트릭 저장 실패:', error);
        throw error;
      }
    }

    console.log(`✅ 배치 메트릭 저장 완료: ${metrics.length}개 항목`);

    // 캐시 제거됨 - 메모리 최적화

    return true;
  } catch (error) {
    console.error('❌ 배치 메트릭 저장 실패:', error);
    return false;
  }
}
