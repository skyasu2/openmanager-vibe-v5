/**
 * 🚀 Upstash Redis 최적화 캐시 서비스 v3.0
 *
 * 서버리스 및 Edge Runtime 환경에 최적화된 캐시 서비스
 * - Upstash Redis 전용 최적화
 * - 레이턴시 개선 (배치 처리, 파이프라인)
 * - 캐시 히트율 향상 (지능형 TTL)
 * - 256MB 메모리 제한 관리
 * - Edge Runtime 완벽 호환
 */

import type { EnhancedServerMetrics } from '../types/server';
import { getUpstashRedis, safeRedisOperation } from '@/lib/upstash-redis';
import {
  UpstashCacheService,
  CACHE_KEYS,
  TTL_STRATEGY,
} from './upstashCacheService';

// 메모리 기반 fallback 캐시 (Redis 장애 시)
interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * 🚀 서버리스 최적화 캐시 서비스
 * Upstash Redis를 활용한 고성능 캐싱
 */
export class RequestScopedCacheService {
  private _initialized: boolean = false;
  private upstashService: UpstashCacheService | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 초기화는 첫 사용 시 lazy loading
    console.log('🚀 RequestScopedCacheService 생성됨');
  }

  /**
   * 🚀 Upstash Redis 초기화 (lazy loading)
   */
  private async _initialize(): Promise<void> {
    if (this._initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const redis = getUpstashRedis();
        this.upstashService = new UpstashCacheService(redis);
        this._initialized = true;
        console.log('✅ Upstash Redis 캐시 서비스 초기화 완료');
      } catch (error) {
        console.error('❌ Upstash Redis 초기화 실패:', error);
        this._initialized = true; // 메모리 캐시로 폴백
      }
    })();

    return this.initPromise;
  }

  /**
   * 서비스 준비 확인
   */
  private async ensureInitialized(): Promise<void> {
    if (!this._initialized) {
      await this._initialize();
    }
  }

  /**
   * 🚀 서버 메트릭 캐싱 (Upstash Redis)
   */
  async cacheServerMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        await this.upstashService.cacheServerMetrics(servers);
      } catch (error) {
        console.error('❌ Redis 캐싱 실패, 메모리 캐시 사용:', error);
        this.cacheToMemory('servers:list', servers, 300);
      }
    } else {
      // 메모리 캐시 폴백
      this.cacheToMemory('servers:list', servers, 300);
    }
  }

  /**
   * 🚀 캐시된 서버 데이터 조회
   */
  async getCachedServers(): Promise<{
    servers: EnhancedServerMetrics[];
    timestamp: number;
  } | null> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        return await this.upstashService.getCachedServers();
      } catch (error) {
        console.error('❌ Redis 조회 실패, 메모리 캐시 확인:', error);
      }
    }

    // 메모리 캐시 폴백
    const cached = this.getFromMemory<EnhancedServerMetrics[]>('servers:list');
    if (cached) {
      return { servers: cached, timestamp: Date.now() };
    }

    return null;
  }

  /**
   * 🚀 서버 요약 정보 조회
   */
  async getCachedSummary(): Promise<unknown> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        return await this.upstashService.getCachedSummary();
      } catch (error) {
        console.error('❌ Redis 요약 조회 실패:', error);
      }
    }

    return this.getFromMemory('servers:summary');
  }

  /**
   * 🚀 개별 서버 조회
   */
  async getCachedServer(
    serverId: string
  ): Promise<EnhancedServerMetrics | null> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        return await this.upstashService.getCachedServer(serverId);
      } catch (error) {
        console.error(`❌ Redis 서버 조회 실패 (${serverId}):`, error);
      }
    }

    return this.getFromMemory(`server:${serverId}`);
  }

  /**
   * 🚀 캐시 무효화
   */
  async invalidateCache(pattern?: string): Promise<void> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        await this.upstashService.invalidateCache(pattern);
      } catch (error) {
        console.error('❌ Redis 캐시 무효화 실패:', error);
      }
    }

    // 메모리 캐시도 정리
    if (pattern) {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      }
    } else {
      memoryCache.clear();
    }
  }

  /**
   * 🚀 캐시 설정
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        await this.upstashService.set(key, value, ttlSeconds);
      } catch (error) {
        console.error(`❌ Redis SET 실패 (${key}):`, error);
        this.cacheToMemory(key, value, ttlSeconds);
      }
    } else {
      this.cacheToMemory(key, value, ttlSeconds);
    }
  }

  /**
   * 🚀 캐시 조회
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    if (this.upstashService) {
      try {
        const result = await this.upstashService.get<T>(key);
        if (result !== null) return result;
      } catch (error) {
        console.error(`❌ Redis GET 실패 (${key}):`, error);
      }
    }

    // 메모리 캐시 폴백
    return this.getFromMemory<T>(key);
  }

  /**
   * 🚀 통계 조회
   */
  getStats(): {
    memoryCache: { size: number; keys: string[] };
    redis: unknown;
  } {
    const memoryCacheKeys = Array.from(memoryCache.keys());
    const redisStats = this.upstashService?.getStats() || null;

    return {
      memoryCache: {
        size: memoryCache.size,
        keys: memoryCacheKeys,
      },
      redis: redisStats,
    };
  }

  /**
   * 🚀 Redis 상태 확인
   */
  async checkRedisStatus(): Promise<{
    connected: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    await this.ensureInitialized();

    if (!this.upstashService) {
      return {
        connected: false,
        message: 'Upstash Redis 서비스가 초기화되지 않았습니다.',
      };
    }

    try {
      const redis = getUpstashRedis();
      await redis.ping();
      const stats = this.upstashService.getStats();

      return {
        connected: true,
        message: 'Upstash Redis 연결 정상',
        details: {
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          operations: stats.hits + stats.misses + stats.sets,
          errors: stats.errors,
          memoryUsageMB: stats.memoryUsageMB,
        },
      };
    } catch (error) {
      return {
        connected: false,
        message: `Redis 연결 실패: ${error}`,
      };
    }
  }

  /**
   * 🚀 Redis 재연결
   */
  async reconnectRedis(): Promise<boolean> {
    this._initialized = false;
    this.upstashService = null;
    this.initPromise = null;

    try {
      await this._initialize();
      return true;
    } catch (error) {
      console.error('❌ Redis 재연결 실패:', error);
      return false;
    }
  }

  // === 메모리 캐시 헬퍼 메서드 ===

  /**
   * 메모리에 캐싱
   */
  private cacheToMemory<T>(key: string, value: T, ttlSeconds: number): void {
    const expires = Date.now() + ttlSeconds * 1000;
    memoryCache.set(key, { data: value, expires });

    // 메모리 제한 관리 (최대 1000개 항목)
    if (memoryCache.size > 1000) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
  }

  /**
   * 메모리에서 조회
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 서비스 정리
   */
  async cleanup(): Promise<void> {
    if (this.upstashService) {
      await this.upstashService.cleanup();
    }
    memoryCache.clear();
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createCacheService(): RequestScopedCacheService {
  return new RequestScopedCacheService();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createCacheService() 사용
 */
export const EnhancedCacheService = {
  getInstance: () => {
    console.warn(
      '⚠️ EnhancedCacheService.getInstance()는 서버리스에서 사용 금지.'
    );
    console.warn('🔧 대신 createCacheService()를 사용하세요.');
    return new RequestScopedCacheService();
  },
};

/**
 * 🔄 호환성을 위한 인스턴스 export
 */
export const cacheService = new RequestScopedCacheService();
