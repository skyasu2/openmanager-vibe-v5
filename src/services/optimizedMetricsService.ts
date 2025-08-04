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
import { FREE_TIER_INTERVALS } from '@/config/free-tier-intervals';

// 메모리 기반 캐시 클래스
class MemoryMetricsCache {
  private cache = new Map<string, { data: unknown; expiry: number; hits: number }>();
  private maxSize = 200; // 최대 200개 항목
  private stats = { hits: 0, misses: 0, evictions: 0 };

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      cached.hits++;
      this.stats.hits++;
      return cached.data as T;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    this.stats.misses++;
    return null;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    // LRU 방식으로 캐시 크기 관리
    if (this.cache.size >= this.maxSize) {
      // 가장 적게 사용된 항목 제거
      let leastUsedKey = '';
      let leastHits = Infinity;
      
      for (const [k, v] of this.cache.entries()) {
        if (v.hits < leastHits) {
          leastHits = v.hits;
          leastUsedKey = k;
        }
      }
      
      if (leastUsedKey) {
        this.cache.delete(leastUsedKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): typeof this.stats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// 글로벌 메모리 캐시 인스턴스
const metricsCache = new MemoryMetricsCache();

// 주기적 캐시 정리 (5분마다)
setInterval(() => {
  metricsCache.cleanup();
}, 5 * 60 * 1000);

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

  return parseInt(match[1]) * (units[match[2]] || units.h);
}

/**
 * 메트릭 데이터 압축 (메모리 사용량 최적화)
 */
function compressMetrics(metrics: ServerMetrics[]): ServerMetrics[] {
  // 불필요한 소수점 제거 및 반올림
  return metrics.map(metric => ({
    ...metric,
    cpu: typeof metric.cpu === 'number' ? Math.round(metric.cpu * 100) / 100 : metric.cpu,
    memory: typeof metric.memory === 'number' ? Math.round(metric.memory * 100) / 100 : metric.memory,
    disk: typeof metric.disk === 'number' ? Math.round(metric.disk * 100) / 100 : metric.disk,
    network: typeof metric.network === 'number' ? Math.round(metric.network * 100) / 100 : metric.network,
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
  const { useCache = true, limit = 500, compressed = true } = options || {};

  // 캐시 키 생성
  const cacheKey = `metrics:${serverId || 'all'}:${timeRange}:${limit}:${compressed}`;

  // 1. 메모리 캐시 확인 (15초 TTL)
  if (useCache) {
    const memoryCached = metricsCache.get<ServerMetrics[]>(cacheKey);
    if (memoryCached) {
      console.log('📦 메모리 캐시 히트:', cacheKey);
      return memoryCached;
    }
  }

  try {
    // 2. Supabase에서 직접 조회
    console.log('🔍 데이터베이스 조회:', cacheKey);
    
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

    // 3. 결과를 메모리 캐시에 저장 (조건부)
    if (useCache && metrics.length > 0) {
      // 캐시 TTL 동적 조정
      const ttl = timeRange.includes('m') ? 15 : // 분 단위: 15초
                  timeRange.includes('h') ? 60 : // 시간 단위: 1분
                  300; // 일/주 단위: 5분

      metricsCache.set(cacheKey, metrics, ttl);
      console.log(`💾 메모리 캐시 저장: ${cacheKey} (TTL: ${ttl}s)`);
    }

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
): Promise<Array<{
  timestamp: string;
  avg_cpu: number;
  avg_memory: number;
  avg_disk: number;
  max_cpu: number;
  max_memory: number;
  count: number;
}>> {
  const cacheKey = `aggregated:${serverId || 'all'}:${timeRange}:${interval}`;

  // 메모리 캐시 확인 (더 긴 TTL)
  const memoryCached = metricsCache.get<any[]>(cacheKey);
  if (memoryCached) {
    console.log('📦 집계 메트릭 캐시 히트:', cacheKey);
    return memoryCached;
  }

  try {
    const supabase = getSupabaseClient();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    // PostgreSQL의 date_trunc 함수 사용
    let query = supabase
      .from('server_metrics')
      .select(`
        timestamp,
        cpu_usage,
        memory_usage,
        disk_usage
      `)
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

    // 캐시에 저장 (5분 TTL)
    metricsCache.set(cacheKey, aggregated, 300);
    console.log(`💾 집계 메트릭 캐시 저장: ${aggregated.length}개 항목`);

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
  data: any[],
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
  const groups = new Map<string, any[]>();

  // 시간 간격별로 그룹화
  data.forEach(metric => {
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
    groups.get(groupKey)!.push(metric);
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
    const cpuValues = metrics.map(m => typeof m.cpu === 'number' ? m.cpu : (typeof m.cpu === 'object' && m.cpu.usage ? m.cpu.usage : 0)).filter(v => typeof v === 'number');
    const memoryValues = metrics.map(m => typeof m.memory === 'number' ? m.memory : (typeof m.memory === 'object' && m.memory.usage ? m.memory.usage : 0)).filter(v => typeof v === 'number');
    const diskValues = metrics.map(m => typeof m.disk === 'number' ? m.disk : (typeof m.disk === 'object' && m.disk.usage ? m.disk.usage : 0)).filter(v => typeof v === 'number');

    result.push({
      timestamp,
      avg_cpu: cpuValues.length > 0 ? Math.round((cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 100) / 100 : 0,
      avg_memory: memoryValues.length > 0 ? Math.round((memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length) * 100) / 100 : 0,
      avg_disk: diskValues.length > 0 ? Math.round((diskValues.reduce((a, b) => a + b, 0) / diskValues.length) * 100) / 100 : 0,
      max_cpu: cpuValues.length > 0 ? Math.max(...cpuValues) : 0,
      max_memory: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      count: metrics.length,
    });
  }

  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 🎯 실시간 메트릭 조회 (캐시 없음)
 */
export async function getRealtimeMetrics(serverId: string): Promise<ServerMetrics | null> {
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
  const cacheKey = `trend:${serverId}:${metric}:${timeRange}`;

  // 캐시 확인
  const cached = metricsCache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

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

    const values = data.map(d => {
      const value = (d as any)[metric];
      return typeof value === 'number' ? value : (typeof value === 'object' && value && value.usage ? value.usage : 0);
    }).filter(v => typeof v === 'number');
    const current = values[values.length - 1] || 0;
    const previous = values[0] || 0;
    const change = current - previous;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 1) { // 1% 이상 변화 시만 트렌드 표시
      trend = change > 0 ? 'up' : 'down';
    }

    const result = {
      current,
      trend,
      change: Math.round(change * 100) / 100,
      data: data.map(d => {
        const value = (d as any)[metric];
        const numericValue = typeof value === 'number' ? value : (typeof value === 'object' && value && value.usage ? value.usage : 0);
        return {
          timestamp: d.timestamp,
          value: numericValue,
        };
      }),
    };

    // 캐시에 저장 (2분 TTL)
    metricsCache.set(cacheKey, result, 120);

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
  metricsCache.clear();
  console.log('🧹 메트릭 캐시 정리 완료');
}

export function getMetricsCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
} {
  return metricsCache.getStats();
}

/**
 * 🔧 배치 메트릭 저장 (메모리 효율적)
 */
export async function saveBatchMetrics(metrics: ServerMetrics[]): Promise<boolean> {
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
      const { error } = await supabase
        .from('server_metrics')
        .insert(batch);

      if (error) {
        console.error('❌ 배치 메트릭 저장 실패:', error);
        throw error;
      }
    }

    console.log(`✅ 배치 메트릭 저장 완료: ${metrics.length}개 항목`);
    
    // 관련 캐시 무효화
    clearMetricsCache();
    
    return true;

  } catch (error) {
    console.error('❌ 배치 메트릭 저장 실패:', error);
    return false;
  }
}