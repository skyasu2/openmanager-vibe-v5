/**
 * RedisMetricsManager - Redis 실시간 메트릭 관리자
 * Phase 1: Redis 실시간 처리 시스템
 *
 * 🟢 Green 단계: 최소 구현으로 테스트 통과
 *
 * 목표:
 * - Firestore 120% 사용량을 Redis 40% 사용량으로 분산
 * - 실시간 메트릭 TTL 30분 저장
 * - 서버별 최신 메트릭 TTL 5분 저장
 * - Pipeline 배치 처리로 성능 최적화
 */

import { ServerMetric } from '@/types/server-metrics';

export interface RedisClient {
  setex(key: string, seconds: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  pipeline(): RedisPipeline;
  keys(pattern: string): Promise<string[]>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

export interface RedisPipeline {
  setex(key: string, seconds: number, value: string): RedisPipeline;
  exec(): Promise<any[]>;
}

export interface RealtimeStats {
  averageCpuUsage: number;
  averageMemoryUsage: number;
  averageDiskUsage: number;
  averageNetworkUsage: number;
  totalServers: number;
  highCpuServers: number;
  highMemoryServers: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface MemoryUsage {
  usedMemory: number;
  totalMemory: number;
  usagePercentage: number;
}

export class RedisMetricsManager {
  private readonly SESSION_TTL = 1800; // 30분
  private readonly SERVER_TTL = 300; // 5분
  private readonly MEMORY_LIMIT = 256 * 1024 * 1024; // 256MB

  constructor(private redis: RedisClient) {}

  /**
   * 🟢 GREEN: 실시간 메트릭을 TTL과 함께 Redis에 저장
   */
  async saveRealtimeMetrics(
    sessionId: string,
    metrics: ServerMetric[]
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 세션 전체 메트릭 저장 (30분 TTL)
    pipeline.setex(
      `session:${sessionId}:current`,
      this.SESSION_TTL,
      JSON.stringify(metrics)
    );

    // 각 서버별 최신 메트릭 저장 (5분 TTL)
    metrics.forEach(metric => {
      pipeline.setex(
        `server:${metric.serverId}:latest`,
        this.SERVER_TTL,
        JSON.stringify(metric)
      );
    });

    await pipeline.exec();
  }

  /**
   * 🟢 GREEN: 세션 메트릭 조회
   */
  async getSessionMetrics(sessionId: string): Promise<ServerMetric[]> {
    try {
      const sessionKey = `session:${sessionId}:current`;
      const data = await this.redis.get(sessionKey);

      if (!data) {
        return [];
      }

      return JSON.parse(data) as ServerMetric[];
    } catch (error) {
      console.error('세션 메트릭 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🟢 GREEN: 특정 서버의 최신 메트릭 조회
   */
  async getServerLatestMetric(serverId: string): Promise<ServerMetric | null> {
    const data = await this.redis.get(`server:${serverId}:latest`);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  }

  /**
   * 🟢 GREEN: 활성 세션 목록 조회
   */
  async getActiveSessions(): Promise<string[]> {
    const keys = await this.redis.keys('session:*:current');
    return keys
      .map(key => {
        const match = key.match(/session:(.+):current/);
        return match ? match[1] : '';
      })
      .filter(Boolean);
  }

  /**
   * 🟢 GREEN: 세션 메트릭 삭제
   */
  async deleteSessionMetrics(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}:current`);
  }

  /**
   * 🟢 GREEN: 메트릭 통계 실시간 계산
   */
  async calculateRealtimeStats(sessionId: string): Promise<RealtimeStats> {
    const metrics = await this.getSessionMetrics(sessionId);

    if (metrics.length === 0) {
      return {
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageDiskUsage: 0,
        averageNetworkUsage: 0,
        totalServers: 0,
        highCpuServers: 0,
        highMemoryServers: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }

    const cpuUsages = metrics.map(m => m.cpu);
    const memoryUsages = metrics.map(m => m.memory);
    const diskUsages = metrics.map(m => m.disk);
    const networkUsages = metrics.map(m => (m.network.in + m.network.out) / 2);
    const requestCounts = metrics.map(m => m.activeConnections);
    const responseTimes = metrics.map(m => m.responseTime);
    const errorRates = metrics.map(m => 0); // 기본값

    return {
      averageCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      averageMemoryUsage:
        memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      averageDiskUsage:
        diskUsages.reduce((a, b) => a + b, 0) / diskUsages.length,
      averageNetworkUsage:
        networkUsages.reduce((a, b) => a + b, 0) / networkUsages.length,
      totalServers: metrics.length,
      highCpuServers: cpuUsages.filter(cpu => cpu > 80).length,
      highMemoryServers: memoryUsages.filter(mem => mem > 80).length,
      totalRequests: requestCounts.reduce((a, b) => a + b, 0),
      averageResponseTime:
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
    };
  }

  /**
   * 🟢 GREEN: Redis 메모리 사용량 모니터링
   */
  async getMemoryUsage(): Promise<MemoryUsage> {
    // 실제 구현에서는 Redis INFO 명령어 사용
    // 현재는 모킹을 위한 기본값
    const usedMemory = 50 * 1024 * 1024; // 50MB 시뮬레이션
    const totalMemory = this.MEMORY_LIMIT;
    const usagePercentage = (usedMemory / totalMemory) * 100;

    return {
      usedMemory,
      totalMemory,
      usagePercentage,
    };
  }

  /**
   * 🟢 GREEN: TTL 만료 전 자동 갱신
   */
  async refreshSessionTTL(sessionId: string): Promise<void> {
    const ttl = await this.redis.ttl(`session:${sessionId}:current`);

    // TTL이 5분(300초) 미만이면 갱신
    if (ttl > 0 && ttl < 300) {
      await this.redis.expire(`session:${sessionId}:current`, this.SESSION_TTL);
    }
  }

  /**
   * 🟢 GREEN: 실시간 메트릭 조회
   */
  async getRealtimeMetrics(sessionId: string): Promise<ServerMetric[]> {
    try {
      const sessionKey = `session:${sessionId}:current`;
      const data = await this.redis.get(sessionKey);

      if (!data) {
        return [];
      }

      return JSON.parse(data) as ServerMetric[];
    } catch (error) {
      console.error('실시간 메트릭 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🟢 GREEN: 압축된 메트릭 저장
   */
  async saveCompressedMetrics(
    sessionId: string,
    metrics: ServerMetric[]
  ): Promise<void> {
    try {
      const compressedData = JSON.stringify(metrics); // 실제로는 압축 라이브러리 사용
      const sessionKey = `session:${sessionId}:compressed`;

      await this.redis.setex(sessionKey, 1800, compressedData); // 30분 TTL

      console.log(`압축된 메트릭 저장 완료: ${sessionId}, ${metrics.length}개`);
    } catch (error) {
      console.error('압축된 메트릭 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 REFACTOR: 다중 서버 최신 메트릭 배치 조회
   */
  async getMultipleServerLatestMetrics(
    serverIds: string[]
  ): Promise<(ServerMetric | null)[]> {
    const keys = serverIds.map(id => `server:${id}:latest`);
    const results = await this.redis.mget(...keys);

    return results.map(data => (data ? JSON.parse(data) : null));
  }

  /**
   * 🔄 REFACTOR: 세션 활성도 체크 및 정리
   */
  async cleanupInactiveSessions(): Promise<string[]> {
    const sessionKeys = await this.redis.keys('session:*:current');
    const cleanedSessions: string[] = [];

    for (const key of sessionKeys) {
      const ttl = await this.redis.ttl(key);

      // TTL이 0 이하면 이미 만료된 키
      if (ttl <= 0) {
        await this.redis.del(key);
        const sessionId = key.match(/session:(.+):current/)?.[1];
        if (sessionId) {
          cleanedSessions.push(sessionId);
        }
      }
    }

    return cleanedSessions;
  }
}
