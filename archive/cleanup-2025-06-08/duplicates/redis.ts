import { Redis } from '@upstash/redis';
import { getVercelOptimizedConfig } from '@/config/environment';

/**
 * 🔄 Vercel 최적화된 Redis 클라이언트
 * 
 * - Upstash Redis 사용 (Vercel 권장)
 * - 자동 reconnection
 * - Fallback 메커니즘
 * - 메모리 최적화
 */

class VercelRedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private config = getVercelOptimizedConfig();
  private fallbackCache = new Map<string, { value: any; expires: number }>();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (!this.config.database.redis.enabled) {
        console.log('⚠️ Redis 환경변수가 설정되지 않음 - 메모리 캐시 사용');
        return;
      }

      this.client = new Redis({
        url: this.config.database.redis.url,
        token: this.config.database.redis.token,
      });

      // 연결 테스트
      await this.client.ping();
      this.isConnected = true;
      console.log('✅ Redis 연결 성공');
    } catch (error) {
      console.error('❌ Redis 연결 실패:', error);
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * 🔄 데이터 저장 (배치 처리)
   */
  async setBatch(items: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    if (!this.isConnected || !this.client) {
      // Fallback to memory cache
      items.forEach(({ key, value, ttl }) => {
        const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + 300000; // 기본 5분
        this.fallbackCache.set(key, { value, expires });
      });
      return;
    }

    try {
      // Upstash Redis는 pipeline 대신 배치 처리 사용
      const pipeline = this.client.multi();
      
      items.forEach(({ key, value, ttl }) => {
        if (ttl) {
          pipeline.setex(key, ttl, JSON.stringify(value));
        } else {
          pipeline.set(key, JSON.stringify(value));
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error('❌ Redis 배치 저장 실패:', error);
      // Fallback to memory cache
      items.forEach(({ key, value, ttl }) => {
        const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + 300000;
        this.fallbackCache.set(key, { value, expires });
      });
    }
  }

  /**
   * 📖 데이터 조회
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      // Check fallback cache
      const cached = this.fallbackCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value as T;
      }
      this.fallbackCache.delete(key);
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('❌ Redis 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🗑️ 데이터 삭제
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.fallbackCache.delete(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('❌ Redis 삭제 실패:', error);
    }
  }

  /**
   * 🔍 키 목록 조회
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('❌ Redis 키 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🧹 만료된 캐시 정리
   */
  private cleanupFallbackCache() {
    const now = Date.now();
    for (const [key, data] of this.fallbackCache.entries()) {
      if (data.expires <= now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * 📊 상태 확인
   */
  getStatus() {
    this.cleanupFallbackCache();
    return {
      isConnected: this.isConnected,
      usingFallback: !this.isConnected,
      fallbackCacheSize: this.fallbackCache.size,
      redisEnabled: this.config.database.redis.enabled,
    };
  }
}

// 싱글톤 인스턴스
export const redis = new VercelRedisClient();

/**
 * 🚀 Vercel 최적화된 캐시 헬퍼
 */
export class VercelCache {
  static async setServerMetrics(serverId: string, metrics: any, ttl = 300) {
    const key = `server:metrics:${serverId}`;
    await redis.setBatch([{ key, value: metrics, ttl }]);
  }

  static async getServerMetrics(serverId: string) {
    const key = `server:metrics:${serverId}`;
    return await redis.get(key);
  }

  static async setAIAnalysis(analysisId: string, analysis: any, ttl = 600) {
    const key = `ai:analysis:${analysisId}`;
    await redis.setBatch([{ key, value: analysis, ttl }]);
  }

  static async getAIAnalysis(analysisId: string) {
    const key = `ai:analysis:${analysisId}`;
    return await redis.get(key);
  }

  static async cacheWithFallback<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl = 300
  ): Promise<T> {
    try {
      // 캐시에서 조회
      const cached = await redis.get<T>(key);
      if (cached) return cached;

      // 캐시 미스 - 새로 가져와서 저장
      const fresh = await fetchFunction();
      await redis.setBatch([{ key, value: fresh, ttl }]);
      return fresh;
    } catch (error) {
      console.error('❌ 캐시 처리 실패:', error);
      return await fetchFunction();
    }
  }
}

export default redis; 