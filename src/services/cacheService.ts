/**
 * 🚀 Enhanced Cache Service with Upstash for Redis Support v2.0
 *
 * OpenManager AI v5.16.1 - 고성능 Upstash for Redis 캐싱 통합 서비스
 * - 고성능 Upstash for Redis 연결 관리
 * - 메모리 fallback 지원
 * - 자동 TTL 및 압축
 * - 배치 작업 최적화
 * - 에러 복구 시스템
 * - 실시간 통계
 */

import type { EnhancedServerMetrics } from '../types/server';
import { redisConnectionManager } from './RedisConnectionManager';

// 메모리 기반 fallback 캐시
const memoryCache = new Map<string, { data: any; expires: number }>();

/**
 * 🔥 Enhanced Cache Service v2.0
 */
export class EnhancedCacheService {
  private static instance: EnhancedCacheService;
  private initialized: boolean = false;

  static getInstance(): EnhancedCacheService {
    if (!this.instance) {
      this.instance = new EnhancedCacheService();
    }
    return this.instance;
  }

  /**
   * 🚀 캐시 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 캐시 서비스 초기화 시작...');

    try {
      // Upstash for Redis 연결 초기화
      const redisConnected = await redisConnectionManager.initialize();

      if (redisConnected) {
        console.log('✅ Upstash for Redis 캐시 연결 성공');

        // Upstash for Redis 건강 상태 체크
        const healthCheck = await redisConnectionManager.performHealthCheck();
        console.log(
          `🏥 Upstash for Redis 건강 상태: ${healthCheck.status} (응답시간: ${healthCheck.responseTime}ms)`
        );
      } else {
        console.warn('⚠️ Upstash for Redis 연결 실패 - 메모리 캐시로 동작');
      }

      this.initialized = true;
      console.log('✅ 캐시 서비스 초기화 완료');
    } catch (error) {
      console.error('❌ 캐시 서비스 초기화 실패:', error);
      console.log('💾 메모리 기반 fallback 캐시 사용');
      this.initialized = true;
    }
  }

  /**
   * 🔧 Upstash for Redis 클라이언트 가져오기
   */
  private getRedisClient(): any {
    return redisConnectionManager.getClient();
  }

  /**
   * 서버 메트릭 캐싱 (Upstash for Redis + Memory fallback)
   */
  async cacheServerMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    const timestamp = Date.now();

    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        // 🔥 고성능 Upstash for Redis 캐싱
        const pipeline = redisClient.pipeline();

        // 전체 서버 목록
        pipeline.setex(
          'servers:all',
          60,
          JSON.stringify({
            servers,
            timestamp,
            count: servers.length,
          })
        );

        // 서버 상태 요약
        pipeline.setex(
          'servers:summary',
          300,
          JSON.stringify({
            total: servers.length,
            healthy: servers.filter(s => s.status === 'healthy').length,
            warning: servers.filter(s => s.status === 'warning').length,
            critical: servers.filter(s => s.status === 'critical').length,
            timestamp,
          })
        );

        // 개별 서버 캐싱
        servers.forEach(server => {
          pipeline.setex(`server:${server.id}`, 300, JSON.stringify(server));
        });

        // 배치 실행
        await pipeline.exec();

        console.log(
          `🔥 Upstash for Redis: ${servers.length}개 서버 메트릭 캐싱 완료`
        );
      } else {
        // 메모리 fallback
        await this.fallbackToMemoryCache(servers, timestamp);
      }
    } catch (error) {
      console.warn('⚠️ Upstash for Redis 캐싱 실패, 메모리 fallback:', error);
      await this.fallbackToMemoryCache(servers, timestamp);
    }
  }

  /**
   * 💾 메모리 fallback 캐싱
   */
  private async fallbackToMemoryCache(
    servers: EnhancedServerMetrics[],
    timestamp: number
  ): Promise<void> {
    this.cacheToMemory(
      'servers:all',
      { servers, timestamp, count: servers.length },
      60000
    );

    const summary = {
      total: servers.length,
      healthy: servers.filter(s => s.status === 'healthy').length,
      warning: servers.filter(s => s.status === 'warning').length,
      critical: servers.filter(s => s.status === 'critical').length,
      timestamp,
    };
    this.cacheToMemory('servers:summary', summary, 300000);

    console.log(`💾 Memory: ${servers.length}개 서버 메트릭 캐싱 완료`);
  }

  /**
   * 캐시된 서버 데이터 조회
   */
  async getCachedServers(): Promise<{
    servers: EnhancedServerMetrics[];
    timestamp: number;
  } | null> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        const cached = await redisClient.get('servers:all');
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // 메모리 fallback
      const memoryCached = this.getFromMemory('servers:all');
      return memoryCached;
    } catch (error) {
      console.error('❌ 캐시 조회 실패:', error);
      return this.getFromMemory('servers:all');
    }
  }

  /**
   * 서버 요약 정보 조회
   */
  async getCachedSummary(): Promise<any> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        const cached = await redisClient.get('servers:summary');
        if (cached) {
          return JSON.parse(cached);
        }
      }

      return this.getFromMemory('servers:summary');
    } catch (error) {
      console.error('❌ 요약 조회 실패:', error);
      return this.getFromMemory('servers:summary');
    }
  }

  /**
   * 개별 서버 정보 조회
   */
  async getCachedServer(
    serverId: string
  ): Promise<EnhancedServerMetrics | null> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        const cached = await redisClient.get(`server:${serverId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      return this.getFromMemory(`server:${serverId}`);
    } catch (error) {
      console.error('❌ 서버 조회 실패:', error);
      return this.getFromMemory(`server:${serverId}`);
    }
  }

  /**
   * 캐시 무효화
   */
  async invalidateCache(pattern?: string): Promise<void> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        if (pattern) {
          const keys = await redisClient.keys(pattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        } else {
          await redisClient.flushdb();
        }
      }

      // 메모리 캐시도 클리어
      if (pattern) {
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            memoryCache.delete(key);
          }
        }
      } else {
        memoryCache.clear();
      }

      console.log('🗑️ 캐시 무효화 완료');
    } catch (error) {
      console.error('❌ 캐시 무효화 실패:', error);
    }
  }

  /**
   * 범용 캐시 저장 (set 메서드)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        this.cacheToMemory(key, value, ttlSeconds * 1000);
      }
    } catch (error) {
      console.error('❌ 캐시 저장 실패:', error);
      // fallback to memory
      this.cacheToMemory(key, value, ttlSeconds * 1000);
    }
  }

  /**
   * 범용 캐시 조회 (get 메서드)
   */
  async get(key: string): Promise<any> {
    try {
      const redisClient = this.getRedisClient();

      if (redisClient && redisConnectionManager.isRedisConnected()) {
        const cached = await redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        return this.getFromMemory(key);
      }
    } catch (error) {
      console.error('❌ 캐시 조회 실패:', error);
      return this.getFromMemory(key);
    }
  }

  /**
   * 캐시 통계 조회 (getStats 메서드)
   */
  getStats(): {
    memoryCache: { size: number; keys: string[] };
    redis: any;
  } {
    const redisStats = redisConnectionManager.getConnectionStats();

    return {
      memoryCache: {
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()),
      },
      redis: {
        connected: redisStats.isConnected,
        totalConnections: redisStats.totalConnections,
        activeConnections: redisStats.activeConnections,
        averageResponseTime: redisStats.averageResponseTime,
        totalCommands: redisStats.totalCommands,
        lastHealthCheck: redisStats.lastHealthCheck,
      },
    };
  }

  /**
   * Upstash for Redis 연결 상태 확인
   */
  async checkRedisStatus(): Promise<{
    connected: boolean;
    message: string;
    details?: any;
  }> {
    try {
      if (!redisConnectionManager.isRedisConnected()) {
        return {
          connected: false,
          message: 'Upstash for Redis 연결되지 않음',
          details: redisConnectionManager.getConnectionStats(),
        };
      }

      const healthCheck = await redisConnectionManager.performHealthCheck();

      return {
        connected: true,
        message: `Upstash for Redis 상태: ${healthCheck.status}`,
        details: {
          healthCheck,
          connectionStats: redisConnectionManager.getConnectionStats(),
        },
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Upstash for Redis 상태 확인 실패',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 🔄 Redis 재연결
   */
  async reconnectRedis(): Promise<boolean> {
    try {
      console.log('🔄 Redis 재연결 시도...');
      return await redisConnectionManager.reconnect();
    } catch (error) {
      console.error('❌ Redis 재연결 실패:', error);
      return false;
    }
  }

  /**
   * 메모리 캐시 저장
   */
  private cacheToMemory(key: string, data: any, ttlMs: number): void {
    const expires = Date.now() + ttlMs;
    memoryCache.set(key, { data, expires });

    // 만료된 캐시 정리
    this.cleanExpiredMemoryCache();
  }

  /**
   * 메모리 캐시 조회
   */
  private getFromMemory(key: string): any {
    const cached = memoryCache.get(key);

    if (!cached) return null;

    if (Date.now() > cached.expires) {
      memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 만료된 메모리 캐시 정리
   */
  private cleanExpiredMemoryCache(): void {
    const now = Date.now();

    for (const [key, value] of memoryCache.entries()) {
      if (now > value.expires) {
        memoryCache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스 export
export const cacheService = EnhancedCacheService.getInstance();
