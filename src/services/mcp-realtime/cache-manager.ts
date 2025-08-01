/**
 * 🔴 MCP 실시간 모니터링 캐시 관리자 v2.0
 *
 * Upstash Redis 기반 고성능 캐싱 전략
 * - 무료 티어 256MB 메모리 최적화
 * - 응답시간 목표: <100ms (캐시 히트), <300ms (캐시 미스)
 * - 실시간 메트릭 TTL 최적화 (15초 간격)
 * - 배치 처리 및 파이프라인 최적화
 */

import { Redis } from '@upstash/redis';
import type {
  MCPServerMetrics,
  HealthCheckResult,
  MonitoringEvent,
  SystemHealthSummary,
  CircuitBreakerStats,
  MCPServerName,
} from '../mcp-monitor/types';

// 🔑 MCP 전용 캐시 키 패턴
export const MCP_CACHE_KEYS = {
  // 서버 메트릭 (15초 갱신)
  SERVER_METRICS: (serverId: MCPServerName) => `mcp:metrics:${serverId}`,
  SERVER_HEALTH: (serverId: MCPServerName) => `mcp:health:${serverId}`,

  // 시스템 상태 (1분 간격)
  SYSTEM_SUMMARY: 'mcp:system:summary',
  ALL_METRICS: 'mcp:metrics:all',

  // 성능 추세 (5분 윈도우)
  PERFORMANCE_TREND: (serverId: MCPServerName, window: string) =>
    `mcp:trend:${serverId}:${window}`,

  // 이벤트 및 알림 (30초)
  RECENT_EVENTS: 'mcp:events:recent',
  ACTIVE_ALERTS: 'mcp:alerts:active',

  // Circuit Breaker 상태 (실시간)
  CIRCUIT_BREAKER: (serverId: MCPServerName) => `mcp:cb:${serverId}`,

  // 집계 통계 (15분)
  HOURLY_STATS: (serverId: MCPServerName) => `mcp:stats:hourly:${serverId}`,
  DAILY_STATS: (serverId: MCPServerName) => `mcp:stats:daily:${serverId}`,

  // 연결 풀 및 세션
  CONNECTION_POOL: 'mcp:pool:connections',
  SESSION_STATE: (sessionId: string) => `mcp:session:${sessionId}`,
} as const;

// ⏰ TTL 전략 (무료 티어 메모리 최적화)
export const MCP_TTL_STRATEGY = {
  // 실시간 데이터 (짧은 TTL)
  REALTIME_METRICS: 15, // 15초 - 모니터링 간격과 동기화
  HEALTH_CHECK: 30, // 30초 - 헬스체크 간격의 2배
  CIRCUIT_BREAKER: 10, // 10초 - 즉각적인 상태 변경 감지

  // 시스템 레벨 (중간 TTL)
  SYSTEM_SUMMARY: 60, // 1분 - 전체 시스템 상태
  RECENT_EVENTS: 30, // 30초 - 최신 이벤트
  ACTIVE_ALERTS: 45, // 45초 - 활성 알림

  // 분석 데이터 (긴 TTL)
  PERFORMANCE_TREND: 300, // 5분 - 성능 추세 분석
  HOURLY_STATS: 900, // 15분 - 시간별 통계
  DAILY_STATS: 3600, // 1시간 - 일별 통계

  // 세션 관리 (가변 TTL)
  CONNECTION_POOL: 120, // 2분 - 연결 풀 상태
  SESSION_STATE: 600, // 10분 - 사용자 세션
} as const;

// 📊 캐시 성능 메트릭
interface CachePerformanceMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  lastUpdate: number;
}

// 🎯 배치 작업 설정
interface BatchConfig {
  maxBatchSize: number;
  flushInterval: number;
  compressionThreshold: number;
  retryAttempts: number;
}

const BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 50, // 최대 50개 작업 배치
  flushInterval: 100, // 100ms 후 자동 플러시
  compressionThreshold: 1024, // 1KB 이상 압축 고려
  retryAttempts: 2, // 최대 2회 재시도
};

/**
 * MCP 실시간 모니터링 캐시 관리자
 */
export class MCPCacheManager {
  private redis: Redis;
  private metrics: CachePerformanceMetrics;
  private batchQueue: Array<{
    operation: string;
    key: string;
    value?: any;
    ttl?: number;
  }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private memoryMonitor: NodeJS.Timeout | null = null;

  constructor(redis: Redis) {
    this.redis = redis;
    this.metrics = this.initializeMetrics();
    this.startBackgroundTasks();
  }

  /**
   * 🚀 서버 메트릭 캐싱 (고성능 배치 처리)
   */
  async cacheServerMetrics(metrics: MCPServerMetrics[]): Promise<void> {
    const startTime = Date.now();

    try {
      // 개별 서버 메트릭 캐싱
      const individualOps = metrics.map((metric) => ({
        operation: 'setex',
        key: MCP_CACHE_KEYS.SERVER_METRICS(metric.serverId),
        value: metric,
        ttl: MCP_TTL_STRATEGY.REALTIME_METRICS,
      }));

      // 전체 메트릭 배열 캐싱
      const allMetricsOp = {
        operation: 'setex',
        key: MCP_CACHE_KEYS.ALL_METRICS,
        value: metrics,
        ttl: MCP_TTL_STRATEGY.REALTIME_METRICS,
      };

      // 시스템 요약 생성 및 캐싱
      const summary = this.generateSystemSummary(metrics);
      const summaryOp = {
        operation: 'setex',
        key: MCP_CACHE_KEYS.SYSTEM_SUMMARY,
        value: summary,
        ttl: MCP_TTL_STRATEGY.SYSTEM_SUMMARY,
      };

      // 배치 처리로 한 번에 실행
      await this.executeBatch([...individualOps, allMetricsOp, summaryOp]);

      this.metrics.sets += metrics.length + 2;
      console.log(
        `✅ [MCPCacheManager] ${metrics.length} server metrics cached (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      this.metrics.errors++;
      console.error('❌ [MCPCacheManager] Metrics caching failed:', error);
      throw error;
    }
  }

  /**
   * 🏥 헬스체크 결과 캐싱
   */
  async cacheHealthCheck(
    serverId: MCPServerName,
    result: HealthCheckResult
  ): Promise<void> {
    const key = MCP_CACHE_KEYS.SERVER_HEALTH(serverId);
    await this.setWithMetrics(key, result, MCP_TTL_STRATEGY.HEALTH_CHECK);
  }

  /**
   * 🔄 Circuit Breaker 상태 캐싱
   */
  async cacheCircuitBreakerState(
    serverId: MCPServerName,
    stats: CircuitBreakerStats
  ): Promise<void> {
    const key = MCP_CACHE_KEYS.CIRCUIT_BREAKER(serverId);
    await this.setWithMetrics(key, stats, MCP_TTL_STRATEGY.CIRCUIT_BREAKER);
  }

  /**
   * 📢 이벤트 스트림 캐싱
   */
  async cacheRecentEvents(events: MonitoringEvent[]): Promise<void> {
    // 최신 20개 이벤트만 유지 (메모리 절약)
    const recentEvents = events.slice(0, 20);
    await this.setWithMetrics(
      MCP_CACHE_KEYS.RECENT_EVENTS,
      recentEvents,
      MCP_TTL_STRATEGY.RECENT_EVENTS
    );
  }

  /**
   * 📈 성능 추세 캐싱 (시간 윈도우별)
   */
  async cachePerformanceTrend(
    serverId: MCPServerName,
    window: '5m' | '15m' | '1h' | '24h',
    trendData: any
  ): Promise<void> {
    const key = MCP_CACHE_KEYS.PERFORMANCE_TREND(serverId, window);
    await this.setWithMetrics(
      key,
      trendData,
      MCP_TTL_STRATEGY.PERFORMANCE_TREND
    );
  }

  /**
   * 🔍 서버 메트릭 조회 (캐시 우선)
   */
  async getServerMetrics(
    serverId: MCPServerName
  ): Promise<MCPServerMetrics | null> {
    const key = MCP_CACHE_KEYS.SERVER_METRICS(serverId);
    return this.getWithMetrics<MCPServerMetrics>(key);
  }

  /**
   * 📊 모든 서버 메트릭 조회
   */
  async getAllMetrics(): Promise<MCPServerMetrics[] | null> {
    return this.getWithMetrics<MCPServerMetrics[]>(MCP_CACHE_KEYS.ALL_METRICS);
  }

  /**
   * 🎯 시스템 상태 요약 조회
   */
  async getSystemSummary(): Promise<SystemHealthSummary | null> {
    return this.getWithMetrics<SystemHealthSummary>(
      MCP_CACHE_KEYS.SYSTEM_SUMMARY
    );
  }

  /**
   * ⚡ 다중 키 조회 (배치 GET)
   */
  async getMultipleMetrics(
    serverIds: MCPServerName[]
  ): Promise<(MCPServerMetrics | null)[]> {
    const keys = serverIds.map((id) => MCP_CACHE_KEYS.SERVER_METRICS(id));
    return this.mgetWithMetrics<MCPServerMetrics>(keys);
  }

  /**
   * 🧹 선택적 캐시 무효화 (메모리 효율적)
   */
  async invalidateServerCache(serverId: MCPServerName): Promise<void> {
    const keysToDelete = [
      MCP_CACHE_KEYS.SERVER_METRICS(serverId),
      MCP_CACHE_KEYS.SERVER_HEALTH(serverId),
      MCP_CACHE_KEYS.CIRCUIT_BREAKER(serverId),
    ];

    try {
      const pipeline = this.redis.pipeline();
      keysToDelete.forEach((key) => pipeline.del(key));
      await pipeline.exec();

      this.metrics.deletes += keysToDelete.length;
      console.log(`🧹 [MCPCacheManager] Server ${serverId} cache invalidated`);
    } catch (error) {
      this.metrics.errors++;
      console.error(
        `❌ [MCPCacheManager] Cache invalidation failed for ${serverId}:`,
        error
      );
    }
  }

  /**
   * 🔥 메모리 압박 시 긴급 정리
   */
  async emergencyCleanup(): Promise<void> {
    console.warn('🚨 [MCPCacheManager] Emergency cleanup initiated');

    try {
      // 가장 오래된 성능 추세 데이터부터 제거
      const servers = await this.redis.keys('mcp:trend:*');
      if (servers.length > 0) {
        const pipeline = this.redis.pipeline();
        servers
          .slice(0, Math.min(20, servers.length))
          .forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }

      // 통계 캐시 정리
      const statsKeys = await this.redis.keys('mcp:stats:*');
      if (statsKeys.length > 0) {
        const pipeline = this.redis.pipeline();
        statsKeys
          .slice(0, Math.min(10, statsKeys.length))
          .forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }

      console.log('✅ [MCPCacheManager] Emergency cleanup completed');
    } catch (error) {
      console.error('❌ [MCPCacheManager] Emergency cleanup failed:', error);
    }
  }

  /**
   * 📊 캐시 성능 통계 조회
   */
  getPerformanceMetrics(): CachePerformanceMetrics & {
    recommendations: string[];
    memoryEfficiency: number;
  } {
    const recommendations: string[] = [];
    const memoryEfficiency = this.calculateMemoryEfficiency();

    // 성능 분석 및 권장사항
    if (this.metrics.hitRate < 75) {
      recommendations.push('캐시 히트율이 낮습니다. TTL 전략을 재검토하세요.');
    }

    if (this.metrics.avgResponseTime > 50) {
      recommendations.push('캐시 응답시간이 높습니다. 배치 크기를 줄이세요.');
    }

    if (this.metrics.memoryUsage > 200) {
      recommendations.push('메모리 사용량이 높습니다. 긴급 정리를 고려하세요.');
    }

    if (memoryEfficiency < 0.8) {
      recommendations.push(
        '메모리 효율성이 낮습니다. 압축 또는 TTL 단축을 고려하세요.'
      );
    }

    return {
      ...this.metrics,
      recommendations,
      memoryEfficiency,
    };
  }

  /**
   * 🔧 Private: 메트릭과 함께 SET 실행
   */
  private async setWithMetrics<T>(
    key: string,
    value: T,
    ttl: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await this.redis.setex(key, ttl, value);
      this.metrics.sets++;
      this.updateAvgResponseTime(Date.now() - startTime);
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * 🔧 Private: 메트릭과 함께 GET 실행
   */
  private async getWithMetrics<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const data = await this.redis.get<T>(key);

      if (data !== null) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }

      this.updateHitRate();
      this.updateAvgResponseTime(Date.now() - startTime);

      return data;
    } catch (error) {
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * 🔧 Private: 다중 GET with 메트릭
   */
  private async mgetWithMetrics<T>(keys: string[]): Promise<(T | null)[]> {
    const startTime = Date.now();

    try {
      const pipeline = this.redis.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      // 통계 업데이트
      results.forEach((result) => {
        if (result) {
          this.metrics.hits++;
        } else {
          this.metrics.misses++;
        }
      });

      this.updateHitRate();
      this.updateAvgResponseTime(Date.now() - startTime);

      return results as (T | null)[];
    } catch (error) {
      this.metrics.errors++;
      return keys.map(() => null);
    }
  }

  /**
   * 🔧 Private: 배치 실행
   */
  private async executeBatch(
    operations: Array<{
      operation: string;
      key: string;
      value?: any;
      ttl?: number;
    }>
  ): Promise<void> {
    if (operations.length === 0) return;

    const startTime = Date.now();

    try {
      const pipeline = this.redis.pipeline();

      operations.forEach(({ operation, key, value, ttl }) => {
        if (operation === 'setex' && ttl) {
          pipeline.setex(key, ttl, value);
        } else if (operation === 'set') {
          pipeline.set(key, value);
        } else if (operation === 'del') {
          pipeline.del(key);
        }
      });

      await pipeline.exec();
      console.log(
        `⚡ [MCPCacheManager] Batch executed: ${operations.length} ops (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      console.error('❌ [MCPCacheManager] Batch execution failed:', error);
      throw error;
    }
  }

  /**
   * 🔧 Private: 시스템 요약 생성
   */
  private generateSystemSummary(
    metrics: MCPServerMetrics[]
  ): SystemHealthSummary {
    const totalServers = metrics.length;
    const healthyServers = metrics.filter((m) => m.status === 'healthy').length;
    const degradedServers = metrics.filter(
      (m) => m.status === 'degraded'
    ).length;
    const unhealthyServers = metrics.filter(
      (m) => m.status === 'unhealthy'
    ).length;

    const avgResponseTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
        : 0;

    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // 임계 상황 감지
    metrics.forEach((metric) => {
      if (metric.status === 'unhealthy') {
        criticalIssues.push(`Server ${metric.serverId} is unhealthy`);
      }
      if (metric.errorRate > 10) {
        warnings.push(
          `High error rate on ${metric.serverId}: ${metric.errorRate}%`
        );
      }
      if (metric.responseTime > 1000) {
        warnings.push(
          `Slow response time on ${metric.serverId}: ${metric.responseTime}ms`
        );
      }
    });

    // 전체 시스템 상태 결정
    let systemStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (criticalIssues.length > 0 || unhealthyServers > totalServers * 0.3) {
      systemStatus = 'unhealthy';
    } else if (warnings.length > 0 || degradedServers > totalServers * 0.2) {
      systemStatus = 'degraded';
    } else {
      systemStatus = 'healthy';
    }

    return {
      timestamp: Date.now(),
      totalServers,
      healthyServers,
      degradedServers,
      unhealthyServers,
      averageResponseTime: avgResponseTime,
      systemStatus,
      criticalIssues,
      warnings,
    };
  }

  /**
   * 🔧 Private: 메트릭 초기화
   */
  private initializeMetrics(): CachePerformanceMetrics {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * 🔧 Private: 히트율 업데이트
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  /**
   * 🔧 Private: 평균 응답시간 업데이트
   */
  private updateAvgResponseTime(responseTime: number): void {
    const total = this.metrics.hits + this.metrics.misses + this.metrics.sets;
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (total - 1) + responseTime) / total;
  }

  /**
   * 🔧 Private: 메모리 효율성 계산
   */
  private calculateMemoryEfficiency(): number {
    // 히트율과 메모리 사용량을 기반으로 효율성 계산
    const hitRateWeight = 0.7;
    const memoryWeight = 0.3;

    const hitRateScore = this.metrics.hitRate / 100;
    const memoryScore = Math.max(0, 1 - this.metrics.memoryUsage / 256); // 256MB 기준

    return hitRateWeight * hitRateScore + memoryWeight * memoryScore;
  }

  /**
   * 🔧 Private: 백그라운드 작업 시작
   */
  private startBackgroundTasks(): void {
    // 5분마다 메모리 사용량 추정
    this.memoryMonitor = setInterval(
      () => {
        // 간단한 메모리 사용량 추정 (실제 INFO 명령 불가)
        this.metrics.memoryUsage = Math.min(256, this.metrics.sets * 0.002); // 2KB per key estimate
        this.metrics.lastUpdate = Date.now();

        // 메모리 임계값 체크
        if (this.metrics.memoryUsage > 200) {
          console.warn(
            `⚠️ [MCPCacheManager] High memory usage: ${this.metrics.memoryUsage}MB`
          );
        }
      },
      5 * 60 * 1000
    );
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    // 대기 중인 배치 작업 완료
    if (this.batchQueue.length > 0) {
      await this.executeBatch(this.batchQueue);
      this.batchQueue = [];
    }

    console.log('✅ [MCPCacheManager] Cleanup completed');
  }
}

/**
 * 팩토리 함수 - 싱글톤 패턴
 */
export function createMCPCacheManager(redis: Redis): MCPCacheManager {
  return new MCPCacheManager(redis);
}
