/**
 * 🧠 자연어 질의 응답 Redis 캐싱 시스템
 *
 * POC 프로젝트 최적화:
 * - 과도한 AI API 호출 방지
 * - 응답 시간 단축 (캐시 히트 시 50ms 이내)
 * - 비용 절약 (Google AI API 할당량 보호)
 * - 목업 Redis 모드 지원
 */

import { createHash } from 'crypto';
import { Redis } from 'ioredis';

export interface CachedQuery {
  query: string;
  response: string;
  confidence: number;
  engine: string;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

export interface QueryCacheConfig {
  defaultTTL: number; // 기본 캐시 유지 시간 (초)
  maxCacheSize: number; // 최대 캐시 항목 수
  enableMockMode: boolean; // 목업 모드 활성화
  preventExcessiveAPICalls: boolean; // 과도한 API 호출 방지
  apiCallLimit: {
    perMinute: number; // 분당 API 호출 제한
    perHour: number; // 시간당 API 호출 제한
  };
}

export class NaturalLanguageQueryCache {
  private redis: Redis | null = null;
  private mockCache: Map<string, CachedQuery> = new Map();
  private config: QueryCacheConfig;
  private apiCallTracker: Map<string, number[]> = new Map(); // 엔진별 API 호출 추적
  private isMockMode: boolean;

  constructor(config: Partial<QueryCacheConfig> = {}) {
    this.config = {
      defaultTTL: 15 * 60, // 15분
      maxCacheSize: 1000,
      enableMockMode: true,
      preventExcessiveAPICalls: true,
      apiCallLimit: {
        perMinute: 10, // POC: 분당 10회 제한
        perHour: 100, // POC: 시간당 100회 제한
      },
      ...config,
    };

    this.isMockMode =
      this.config.enableMockMode || process.env.NODE_ENV === 'development';
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isMockMode) {
      console.log('🎭 자연어 질의 캐시: 목업 모드 활성화');
      return;
    }

    try {
      // 실제 Redis 연결 (프로덕션)
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 2,
        connectTimeout: 3000,
      });

      console.log('✅ 자연어 질의 캐시: Redis 연결 성공');
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 목업 모드로 전환:', error);
      this.isMockMode = true;
      this.redis = null;
    }
  }

  /**
   * 🔍 캐시된 응답 조회
   */
  public async getCachedResponse(
    query: string,
    engine: string = 'default'
  ): Promise<CachedQuery | null> {
    const cacheKey = this.generateCacheKey(query, engine);

    try {
      if (this.isMockMode) {
        const cached = this.mockCache.get(cacheKey);
        if (cached && this.isValidCache(cached)) {
          cached.hitCount++;
          console.log(
            `💾 캐시 히트 (목업): ${query.substring(0, 50)}... (${cached.hitCount}회)`
          );
          return cached;
        }
        return null;
      }

      if (!this.redis) return null;

      const cachedData = await this.redis.get(`nlq:${cacheKey}`);
      if (cachedData) {
        const cached: CachedQuery = JSON.parse(cachedData);
        if (this.isValidCache(cached)) {
          // 히트 카운트 증가
          cached.hitCount++;
          await this.redis.setex(
            `nlq:${cacheKey}`,
            cached.ttl,
            JSON.stringify(cached)
          );

          console.log(
            `💾 캐시 히트 (Redis): ${query.substring(0, 50)}... (${cached.hitCount}회)`
          );
          return cached;
        }
      }
      return null;
    } catch (error) {
      console.warn('⚠️ 캐시 조회 실패:', error);
      return null;
    }
  }

  /**
   * 💾 응답 캐시 저장
   */
  public async setCachedResponse(
    query: string,
    response: string,
    confidence: number,
    engine: string = 'default',
    customTTL?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, engine);
    const ttl = customTTL || this.getEngineSpecificTTL(engine, confidence);

    const cachedQuery: CachedQuery = {
      query,
      response,
      confidence,
      engine,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
    };

    try {
      if (this.isMockMode) {
        this.mockCache.set(cacheKey, cachedQuery);
        this.cleanupMockCache();
        console.log(`💾 캐시 저장 (목업): ${engine} - TTL ${ttl}초`);
        return;
      }

      if (!this.redis) return;

      await this.redis.setex(
        `nlq:${cacheKey}`,
        ttl,
        JSON.stringify(cachedQuery)
      );
      console.log(`💾 캐시 저장 (Redis): ${engine} - TTL ${ttl}초`);
    } catch (error) {
      console.warn('⚠️ 캐시 저장 실패:', error);
    }
  }

  /**
   * 🚫 과도한 API 호출 방지 검사
   */
  public async checkAPICallLimit(
    engine: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.config.preventExcessiveAPICalls) {
      return { allowed: true };
    }

    const now = Date.now();
    const engineKey = `api_calls:${engine}`;

    // 현재 엔진의 API 호출 기록 가져오기
    let callHistory = this.apiCallTracker.get(engineKey) || [];

    // 1시간 이내 호출만 유지
    callHistory = callHistory.filter(
      timestamp => now - timestamp < 60 * 60 * 1000
    );

    // 1분 이내 호출 수 확인
    const recentCalls = callHistory.filter(
      timestamp => now - timestamp < 60 * 1000
    );

    if (recentCalls.length >= this.config.apiCallLimit.perMinute) {
      return {
        allowed: false,
        reason: `분당 API 호출 제한 초과 (${recentCalls.length}/${this.config.apiCallLimit.perMinute})`,
      };
    }

    if (callHistory.length >= this.config.apiCallLimit.perHour) {
      return {
        allowed: false,
        reason: `시간당 API 호출 제한 초과 (${callHistory.length}/${this.config.apiCallLimit.perHour})`,
      };
    }

    // 호출 기록 업데이트
    callHistory.push(now);
    this.apiCallTracker.set(engineKey, callHistory);

    console.log(
      `✅ API 호출 허용: ${engine} (분당: ${recentCalls.length}/${this.config.apiCallLimit.perMinute}, 시간당: ${callHistory.length}/${this.config.apiCallLimit.perHour})`
    );
    return { allowed: true };
  }

  /**
   * 📊 캐시 통계 조회
   */
  public async getCacheStats(): Promise<{
    totalCached: number;
    hitRate: number;
    topQueries: Array<{ query: string; hitCount: number }>;
    apiCallStats: Record<string, number>;
  }> {
    let totalCached = 0;
    let totalHits = 0;
    const topQueries: Array<{ query: string; hitCount: number }> = [];

    if (this.isMockMode) {
      totalCached = this.mockCache.size;

      for (const cached of this.mockCache.values()) {
        totalHits += cached.hitCount;
        if (cached.hitCount > 0) {
          topQueries.push({
            query: cached.query.substring(0, 50),
            hitCount: cached.hitCount,
          });
        }
      }
    } else if (this.redis) {
      try {
        const keys = await this.redis.keys('nlq:*');
        totalCached = keys.length;

        for (const key of keys.slice(0, 100)) {
          // 상위 100개만 확인
          const data = await this.redis.get(key);
          if (data) {
            const cached: CachedQuery = JSON.parse(data);
            totalHits += cached.hitCount;
            if (cached.hitCount > 0) {
              topQueries.push({
                query: cached.query.substring(0, 50),
                hitCount: cached.hitCount,
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ 캐시 통계 조회 실패:', error);
      }
    }

    // API 호출 통계
    const apiCallStats: Record<string, number> = {};
    for (const [engine, calls] of this.apiCallTracker.entries()) {
      const engineName = engine.replace('api_calls:', '');
      apiCallStats[engineName] = calls.length;
    }

    // 상위 질의 정렬
    topQueries.sort((a, b) => b.hitCount - a.hitCount);

    return {
      totalCached,
      hitRate: totalCached > 0 ? (totalHits / totalCached) * 100 : 0,
      topQueries: topQueries.slice(0, 10),
      apiCallStats,
    };
  }

  /**
   * 🧹 캐시 정리
   */
  public async clearCache(pattern?: string): Promise<number> {
    let deletedCount = 0;

    if (this.isMockMode) {
      if (pattern) {
        for (const [key, cached] of this.mockCache.entries()) {
          if (cached.query.includes(pattern)) {
            this.mockCache.delete(key);
            deletedCount++;
          }
        }
      } else {
        deletedCount = this.mockCache.size;
        this.mockCache.clear();
      }
    } else if (this.redis) {
      try {
        const searchPattern = pattern ? `nlq:*${pattern}*` : 'nlq:*';
        const keys = await this.redis.keys(searchPattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('⚠️ 캐시 정리 실패:', error);
      }
    }

    console.log(`🧹 캐시 정리 완료: ${deletedCount}개 항목 삭제`);
    return deletedCount;
  }

  // ===== Private Methods =====

  private generateCacheKey(query: string, engine: string): string {
    const data = `${query.toLowerCase().trim()}_${engine}`;
    return createHash('md5').update(data).digest('hex').substring(0, 16);
  }

  private isValidCache(cached: CachedQuery): boolean {
    const now = Date.now();
    const age = (now - cached.timestamp) / 1000; // 초 단위
    return age < cached.ttl;
  }

  private getEngineSpecificTTL(engine: string, confidence: number): number {
    // 엔진별 & 신뢰도별 TTL 설정
    const baseTTL = this.config.defaultTTL;

    const engineMultipliers: Record<string, number> = {
      'google-ai': 2.0, // 20분 (API 비용 고려)
      rag: 1.5, // 15분 (문서 기반)
      mcp: 0.5, // 5분 (실시간성 중요)
      unified: 1.0, // 10분 (기본)
      korean: 3.0, // 30분 (한국어 특화)
    };

    const engineMultiplier = engineMultipliers[engine] || 1.0;
    const confidenceMultiplier = Math.max(0.5, confidence); // 신뢰도가 높을수록 오래 캐시

    return Math.floor(baseTTL * engineMultiplier * confidenceMultiplier);
  }

  private cleanupMockCache(): void {
    if (this.mockCache.size > this.config.maxCacheSize) {
      // 가장 오래된 항목들 제거
      const entries = Array.from(this.mockCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(
        0,
        entries.length - this.config.maxCacheSize + 100
      );
      for (const [key] of toDelete) {
        this.mockCache.delete(key);
      }

      console.log(`🧹 목업 캐시 정리: ${toDelete.length}개 항목 제거`);
    }
  }
}

// 싱글톤 인스턴스
export const naturalLanguageQueryCache = new NaturalLanguageQueryCache({
  defaultTTL: 15 * 60, // 15분
  maxCacheSize: 500, // POC 환경에 적합한 크기
  enableMockMode: true,
  preventExcessiveAPICalls: true,
  apiCallLimit: {
    perMinute: 5, // POC: 분당 5회 제한 (보수적)
    perHour: 50, // POC: 시간당 50회 제한
  },
});
