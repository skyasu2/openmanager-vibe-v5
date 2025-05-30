/**
 * 🚀 Enhanced Cache Service with Redis Support
 * 
 * OpenManager AI v5.11.0 - Redis 캐싱 통합 서비스
 * - Redis 기반 고성능 캐싱
 * - 메모리 fallback 지원
 * - TTL 기반 자동 만료
 * - 실시간 서버 메트릭 캐싱
 */

import { EnhancedServerMetrics } from './simulationEngine';

// Redis 클라이언트 (동적 import)
let redis: any = null;

// 메모리 기반 fallback 캐시
const memoryCache = new Map<string, { data: any; expires: number }>();

/**
 * Redis 클라이언트 초기화
 */
async function initRedis() {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 Redis 사용 안 함
    return null;
  }

  if (redis) return redis;

  try {
    const { Redis } = await import('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
      family: 4,
    });

    redis.on('connect', () => {
      console.log('✅ Redis 연결 성공');
    });

    redis.on('error', (error: Error) => {
      console.warn('⚠️ Redis 연결 실패, 메모리 캐시 사용:', error.message);
      redis = null;
    });

    return redis;
  } catch (error) {
    console.warn('⚠️ Redis 패키지 없음, 메모리 캐시 사용');
    return null;
  }
}

/**
 * 🔥 Enhanced Cache Service
 */
export class EnhancedCacheService {
  private static instance: EnhancedCacheService;
  
  static getInstance(): EnhancedCacheService {
    if (!this.instance) {
      this.instance = new EnhancedCacheService();
    }
    return this.instance;
  }

  /**
   * 서버 메트릭 캐싱 (Redis + Memory fallback)
   */
  async cacheServerMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    const timestamp = Date.now();
    
    try {
      const redisClient = await initRedis();
      
      if (redisClient) {
        // 🔥 Redis 캐싱
        await Promise.all([
          // 전체 서버 목록
          redisClient.setex('servers:all', 60, JSON.stringify({
            servers,
            timestamp,
            count: servers.length
          })),
          
          // 서버 상태 요약
          redisClient.setex('servers:summary', 300, JSON.stringify({
            total: servers.length,
            healthy: servers.filter(s => s.status === 'healthy').length,
            warning: servers.filter(s => s.status === 'warning').length,
            critical: servers.filter(s => s.status === 'critical').length,
            timestamp
          })),
          
          // 개별 서버 캐싱
          ...servers.map(server => 
            redisClient.setex(`server:${server.id}`, 300, JSON.stringify(server))
          )
        ]);
        
        console.log(`🔥 Redis: ${servers.length}개 서버 메트릭 캐싱 완료`);
      } else {
        // 메모리 fallback
        this.cacheToMemory('servers:all', { servers, timestamp, count: servers.length }, 60000);
        
        const summary = {
          total: servers.length,
          healthy: servers.filter(s => s.status === 'healthy').length,
          warning: servers.filter(s => s.status === 'warning').length,
          critical: servers.filter(s => s.status === 'critical').length,
          timestamp
        };
        this.cacheToMemory('servers:summary', summary, 300000);
        
        console.log(`💾 Memory: ${servers.length}개 서버 메트릭 캐싱 완료`);
      }
    } catch (error) {
      console.error('❌ 캐싱 실패:', error);
    }
  }

  /**
   * 캐시된 서버 데이터 조회
   */
  async getCachedServers(): Promise<{ servers: EnhancedServerMetrics[]; timestamp: number } | null> {
    try {
      const redisClient = await initRedis();
      
      if (redisClient) {
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
      return null;
    }
  }

  /**
   * 서버 요약 정보 조회
   */
  async getCachedSummary(): Promise<any> {
    try {
      const redisClient = await initRedis();
      
      if (redisClient) {
        const cached = await redisClient.get('servers:summary');
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      return this.getFromMemory('servers:summary');
    } catch (error) {
      console.error('❌ 요약 조회 실패:', error);
      return null;
    }
  }

  /**
   * 개별 서버 정보 조회
   */
  async getCachedServer(serverId: string): Promise<EnhancedServerMetrics | null> {
    try {
      const redisClient = await initRedis();
      
      if (redisClient) {
        const cached = await redisClient.get(`server:${serverId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      return this.getFromMemory(`server:${serverId}`);
    } catch (error) {
      console.error('❌ 서버 조회 실패:', error);
      return null;
    }
  }

  /**
   * 캐시 무효화
   */
  async invalidateCache(pattern?: string): Promise<void> {
    try {
      const redisClient = await initRedis();
      
      if (redisClient) {
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
   * Redis 연결 상태 확인
   */
  async checkRedisStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      const redisClient = await initRedis();
      
      if (!redisClient) {
        return { connected: false, message: 'Redis 클라이언트 없음' };
      }
      
      await redisClient.ping();
      return { connected: true, message: 'Redis 연결 정상' };
    } catch (error) {
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Redis 연결 실패' 
      };
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