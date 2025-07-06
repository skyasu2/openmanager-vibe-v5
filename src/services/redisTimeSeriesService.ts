/**
 * 📊 Redis 기반 시계열 데이터 서비스
 *
 * OpenManager AI v5.11.0 - Redis를 활용한 경량 시계열 데이터 솔루션
 * - Redis 스트림을 활용한 시계열 데이터 저장
 * - JSON 구조 기반 메트릭 집계
 * - 효율적인 메모리 관리
 * - Supabase 백업 연동
 */

import type { EnhancedServerMetrics } from '../types/server';

// 시계열 데이터 포인트 타입
export interface TimeSeriesPoint {
  timestamp: number;
  server_id: string;
  hostname: string;
  environment: string;
  role: string;
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    response_time: number;
  };
  status: string;
  alerts_count: number;
}

// 시계열 쿼리 결과
export interface TimeSeriesResult {
  server_id: string;
  points: TimeSeriesPoint[];
  aggregations?: {
    avg: Record<string, number>;
    max: Record<string, number>;
    min: Record<string, number>;
    latest: Record<string, number>;
  };
}

// 집계 데이터 타입
type AggregationData = {
  avg: Record<string, number>;
  max: Record<string, number>;
  min: Record<string, number>;
  latest: Record<string, number>;
};

/**
 * 🕒 Redis 기반 시계열 데이터 서비스
 */
export class RedisTimeSeriesService {
  private static instance: RedisTimeSeriesService;
  private readonly MAX_POINTS_PER_SERVER = 1440; // 24시간 (분당 1개 기준)
  private readonly RETENTION_HOURS = 24;

  static getInstance(): RedisTimeSeriesService {
    if (!this.instance) {
      this.instance = new RedisTimeSeriesService();
    }
    return this.instance;
  }

  /**
   * 📊 서버 메트릭을 시계열 데이터로 저장
   */
  async storeMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    try {
      const timestamp = Date.now();
      const timeSeriesPoints: TimeSeriesPoint[] = [];

      // 서버별 시계열 데이터 포인트 생성
      for (const server of servers) {
        const point: TimeSeriesPoint = {
          timestamp,
          server_id: server.id,
          hostname: server.hostname,
          environment: server.environment,
          role: server.role,
          metrics: {
            cpu_usage: server.cpu_usage,
            memory_usage: server.memory_usage,
            disk_usage: server.disk_usage,
            network_in: server.network_in,
            network_out: server.network_out,
            response_time: server.response_time,
          },
          status: server.status,
          alerts_count: server.alerts?.length || 0,
        };

        timeSeriesPoints.push(point);
      }

      // 메모리 기반 시계열 저장 (Redis 대안)
      await this.storePointsInMemory(timeSeriesPoints);

      // 주기적으로 Supabase에 백업 (30분마다, 성능 최적화)
      if (timestamp % (30 * 60 * 1000) < 10000) {
        // 30분 간격으로 백업 (5분 → 30분)
        await this.backupToSupabase(timeSeriesPoints);
      }

      console.log(
        `📊 시계열 데이터 ${timeSeriesPoints.length}개 포인트 저장 완료`
      );
    } catch (error) {
      console.error('❌ 시계열 데이터 저장 실패:', error);
    }
  }

  /**
   * 💾 메모리 기반 시계열 데이터 저장
   */
  private async storePointsInMemory(points: TimeSeriesPoint[]): Promise<void> {
    const storage = this.getTimeSeriesStorage();

    for (const point of points) {
      const key = `timeseries:${point.server_id}`;

      if (!storage[key]) {
        storage[key] = [];
      }

      // 새 포인트 추가
      storage[key].push(point);

      // 크기 제한 적용 (FIFO)
      if (storage[key].length > this.MAX_POINTS_PER_SERVER) {
        const excess = storage[key].length - this.MAX_POINTS_PER_SERVER;
        storage[key].splice(0, excess);
      }

      // 오래된 데이터 정리 (24시간 초과)
      const cutoffTime = Date.now() - this.RETENTION_HOURS * 60 * 60 * 1000;
      storage[key] = storage[key].filter(p => p.timestamp > cutoffTime);
    }

    // 전역 저장소 업데이트
    this.setTimeSeriesStorage(storage);
  }

  /**
   * 🔍 시계열 데이터 조회
   */
  async queryMetrics(
    serverId: string,
    timeRange: string = '1h',
    metrics: string[] = ['cpu_usage', 'memory_usage', 'disk_usage']
  ): Promise<TimeSeriesResult> {
    try {
      const storage = this.getTimeSeriesStorage();
      const key = `timeseries:${serverId}`;

      if (!storage[key]) {
        return {
          server_id: serverId,
          points: [],
          aggregations: this.generateEmptyAggregations(metrics),
        };
      }

      // 시간 범위 필터링
      const timeRangeMs = this.parseTimeRange(timeRange);
      const cutoffTime = Date.now() - timeRangeMs;

      const filteredPoints = storage[key].filter(
        point => point.timestamp > cutoffTime
      );

      // 집계 계산
      const aggregations = this.calculateAggregations(filteredPoints, metrics);

      return {
        server_id: serverId,
        points: filteredPoints,
        aggregations,
      };
    } catch (error) {
      console.error('❌ 시계열 데이터 조회 실패:', error);
      return {
        server_id: serverId,
        points: [],
        aggregations: this.generateEmptyAggregations(metrics),
      };
    }
  }

  /**
   * 📈 여러 통합 AI 컴포넌트의 메트릭 비교 조회
   */
  async queryMultipleServers(
    serverIds: string[],
    timeRange: string = '1h',
    metric: string = 'cpu_usage'
  ): Promise<Record<string, TimeSeriesPoint[]>> {
    const results: Record<string, TimeSeriesPoint[]> = {};

    for (const serverId of serverIds) {
      const result = await this.queryMetrics(serverId, timeRange, [metric]);
      results[serverId] = result.points;
    }

    return results;
  }

  /**
   * 📊 집계 계산
   */
  private calculateAggregations(
    points: TimeSeriesPoint[],
    metrics: string[]
  ): AggregationData {
    if (points.length === 0) return this.generateEmptyAggregations(metrics);

    const aggregations: AggregationData = {
      avg: {},
      max: {},
      min: {},
      latest: {},
    };

    for (const metric of metrics) {
      const values = points
        .map(p => (p.metrics as any)[metric])
        .filter(v => v !== undefined);

      if (values.length > 0) {
        aggregations.avg[metric] =
          values.reduce((a, b) => a + b, 0) / values.length;
        aggregations.max[metric] = Math.max(...values);
        aggregations.min[metric] = Math.min(...values);
        aggregations.latest[metric] = values[values.length - 1];
      } else {
        aggregations.avg[metric] = 0;
        aggregations.max[metric] = 0;
        aggregations.min[metric] = 0;
        aggregations.latest[metric] = 0;
      }
    }

    return aggregations;
  }

  /**
   * 🗄️ Supabase 백업
   */
  private async backupToSupabase(points: TimeSeriesPoint[]): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');

      if (!supabase) {
        console.warn('⚠️ Supabase client not initialized. 백업을 건너뜁니다');
        return;
      }

      const backupData = points.map(point => ({
        server_id: point.server_id,
        timestamp: new Date(point.timestamp).toISOString(),
        hostname: point.hostname,
        environment: point.environment,
        role: point.role,
        metrics: point.metrics,
        status: point.status,
        alerts_count: point.alerts_count,
      }));

      const { error } = await supabase
        .from('server_metrics_timeseries')
        .insert(backupData);

      if (error) {
        console.warn('⚠️ Supabase 백업 실패:', error);
      } else {
        console.log(`💾 Supabase 백업 완료: ${points.length}개 포인트`);
      }
    } catch (error) {
      console.warn('⚠️ Supabase 백업 실패:', error);
    }
  }

  /**
   * 🕒 시간 범위 파싱
   */
  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'm':
        return value * 60 * 1000; // 분
      case 'h':
        return value * 60 * 60 * 1000; // 시간
      case 'd':
        return value * 24 * 60 * 60 * 1000; // 일
      default:
        return 60 * 60 * 1000; // 기본 1시간
    }
  }

  /**
   * 📊 빈 집계 데이터 생성
   */
  private generateEmptyAggregations(metrics: string[]): AggregationData {
    const aggregations: AggregationData = {
      avg: {},
      max: {},
      min: {},
      latest: {},
    };

    for (const metric of metrics) {
      aggregations.avg[metric] = 0;
      aggregations.max[metric] = 0;
      aggregations.min[metric] = 0;
      aggregations.latest[metric] = 0;
    }

    return aggregations;
  }

  /**
   * 💾 전역 시계열 저장소 관리
   */
  private getTimeSeriesStorage(): Record<string, TimeSeriesPoint[]> {
    if (typeof globalThis !== 'undefined') {
      if (!(globalThis as any).timeSeriesStorage) {
        (globalThis as any).timeSeriesStorage = {};
      }
      return (globalThis as any).timeSeriesStorage;
    }
    return {};
  }

  private setTimeSeriesStorage(
    storage: Record<string, TimeSeriesPoint[]>
  ): void {
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).timeSeriesStorage = storage;
    }
  }

  /**
   * 📈 현재 저장된 데이터 통계
   */
  getStorageStats(): {
    totalServers: number;
    totalPoints: number;
    oldestPoint: number | null;
    newestPoint: number | null;
    memoryUsageKB: number;
  } {
    const storage = this.getTimeSeriesStorage();
    const serverIds = Object.keys(storage);

    let totalPoints = 0;
    let oldestPoint: number | null = null;
    let newestPoint: number | null = null;

    for (const serverId of serverIds) {
      const points = storage[serverId];
      totalPoints += points.length;

      if (points.length > 0) {
        const serverOldest = Math.min(...points.map(p => p.timestamp));
        const serverNewest = Math.max(...points.map(p => p.timestamp));

        if (oldestPoint === null || serverOldest < oldestPoint) {
          oldestPoint = serverOldest;
        }
        if (newestPoint === null || serverNewest > newestPoint) {
          newestPoint = serverNewest;
        }
      }
    }

    // 대략적인 메모리 사용량 계산 (JSON 문자열 길이 기준)
    const memoryUsageKB = Math.round(JSON.stringify(storage).length / 1024);

    return {
      totalServers: serverIds.length,
      totalPoints,
      oldestPoint,
      newestPoint,
      memoryUsageKB,
    };
  }
}

// 싱글톤 인스턴스 export
export const redisTimeSeriesService = RedisTimeSeriesService.getInstance();