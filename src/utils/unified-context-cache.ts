/**
 * 🚀 통합 컨텍스트 캐싱 레이어
 *
 * AI 제안사항 구현:
 * - Redis 캐싱을 모든 컨텍스트 관리자에 적용
 * - DevKeyManager의 Redis 설정 활용
 * - 응답 속도 30-50% 향상 목표
 * - 시연용 최적화 적용
 */

import { Redis } from '@upstash/redis';
import { devKeyManager } from './dev-key-manager';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  memoryUsage: string;
  oldestEntry: number;
  newestEntry: number;
}

export class UnifiedContextCache {
  private static instance: UnifiedContextCache;
  private redis: Redis | null = null;
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  // 무료 티어 최적화 설정
  private readonly DEFAULT_TTL = 2700; // 45분 (실용성과 효율성 균형)
  private readonly MAX_LOCAL_CACHE_SIZE = 150; // 무료 티어에서 적정 수준
  private readonly CLEANUP_INTERVAL = 600000; // 10분마다 정리

  private constructor() {
    this.initializeRedis();
    this.startCleanupScheduler();
  }

  static getInstance(): UnifiedContextCache {
    if (!UnifiedContextCache.instance) {
      UnifiedContextCache.instance = new UnifiedContextCache();
    }
    return UnifiedContextCache.instance;
  }

  /**
   * 🔄 Redis 초기화 (DevKeyManager 활용)
   */
  private async initializeRedis(): Promise<void> {
    try {
      // 🚫 최우선: 환경변수 체크
      if (process.env.FORCE_MOCK_REDIS === 'true') {
        console.log(
          '🎭 FORCE_MOCK_REDIS=true - UnifiedContextCache Redis 연결 건너뜀'
        );
        return;
      }

      // 🧪 개발 도구 환경 체크
      if (process.env.STORYBOOK === 'true' || process.env.NODE_ENV === 'test') {
        console.log(
          '🧪 개발 도구 환경 - UnifiedContextCache Redis 연결 건너뜀'
        );
        return;
      }

      const redisUrl = devKeyManager.getKey('UPSTASH_REDIS_REST_URL');
      const redisToken = devKeyManager.getKey('UPSTASH_REDIS_REST_TOKEN');

      if (redisUrl && redisToken) {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });

        // 연결 테스트
        await this.redis.ping();
        console.log('✅ 통합 컨텍스트 캐시: Redis 연결 성공');
      } else {
        console.warn('⚠️ Redis 설정 없음, 로컬 캐시만 사용');
      }
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 로컬 캐시로 폴백:', error);
      this.redis = null;
    }
  }

  /**
   * 📦 캐시에서 데이터 가져오기
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);

    try {
      // 1. 로컬 캐시 확인 (가장 빠름)
      const localEntry = this.localCache.get(cacheKey);
      if (localEntry && this.isValidEntry(localEntry)) {
        localEntry.accessCount++;
        localEntry.lastAccessed = Date.now();
        this.stats.hits++;
        return localEntry.data;
      }

      // 2. Redis 캐시 확인
      if (this.redis) {
        const redisData = await this.redis.get(cacheKey);
        if (redisData) {
          const parsedData = JSON.parse(redisData as string);

          // 로컬 캐시에도 저장 (다음 접근 시 더 빠름)
          this.setLocalCache(cacheKey, parsedData, this.DEFAULT_TTL);

          this.stats.hits++;
          return parsedData;
        }
      }

      // 3. 캐시 미스
      this.stats.misses++;
      return null;
    } catch (error) {
      console.warn('캐시 조회 오류:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 💾 캐시에 데이터 저장
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(key);

    try {
      // 1. 로컬 캐시에 저장
      this.setLocalCache(cacheKey, data, ttl);

      // 2. Redis에 저장 (비동기)
      if (this.redis) {
        const serializedData = JSON.stringify(data);
        await this.redis.setex(cacheKey, ttl, serializedData);
      }

      this.stats.sets++;
    } catch (error) {
      console.warn('캐시 저장 오류:', error);
    }
  }

  /**
   * 🗑️ 캐시에서 데이터 삭제
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key);

    try {
      // 로컬 캐시에서 삭제
      this.localCache.delete(cacheKey);

      // Redis에서 삭제
      if (this.redis) {
        await this.redis.del(cacheKey);
      }

      this.stats.deletes++;
    } catch (error) {
      console.warn('캐시 삭제 오류:', error);
    }
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(key: string): string {
    return `openmanager:context:${key}`;
  }

  /**
   * 💾 로컬 캐시 저장
   */
  private setLocalCache<T>(key: string, data: T, ttl: number): void {
    // 시연용 최적화: 캐시 크기 제한
    if (this.localCache.size >= this.MAX_LOCAL_CACHE_SIZE) {
      // LRU 방식으로 가장 오래된 항목 제거
      const oldestKey = this.findOldestCacheKey();
      if (oldestKey) {
        this.localCache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // 밀리초로 변환
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.localCache.set(key, entry);
  }

  /**
   * ✅ 캐시 엔트리 유효성 검사
   */
  private isValidEntry(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * 🕰️ 가장 오래된 캐시 키 찾기 (LRU)
   */
  private findOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.localCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * 🧹 정기적 캐시 정리
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 🧹 만료된 캐시 정리
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.localCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.localCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 통합 캐시 정리: ${cleanedCount}개 만료 항목 제거`);
    }
  }

  /**
   * 📊 캐시 통계
   */
  getStats(): CacheStats {
    const entries = Array.from(this.localCache.values());
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: this.localCache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate:
        totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry:
        entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry:
        entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
    };
  }

  /**
   * 📏 메모리 사용량 추정
   */
  private estimateMemoryUsage(): string {
    const jsonString = JSON.stringify(Array.from(this.localCache.entries()));
    const bytes = new Blob([jsonString]).size;

    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * 🔄 캐시 새로고침
   */
  async refresh(): Promise<void> {
    this.localCache.clear();

    if (this.redis) {
      // Redis 연결 상태 확인
      try {
        await this.redis.ping();
        console.log('✅ 통합 캐시 새로고침 완료');
      } catch (error) {
        console.warn('⚠️ Redis 연결 확인 실패:', error);
      }
    }
  }

  /**
   * 📈 성능 리포트
   */
  getPerformanceReport(): string {
    const stats = this.getStats();
    const totalRequests = this.stats.hits + this.stats.misses;

    return `
🚀 통합 컨텍스트 캐시 성능 리포트
${'='.repeat(50)}
📊 기본 통계:
   • 총 요청: ${totalRequests}
   • 캐시 히트: ${this.stats.hits} (${stats.hitRate.toFixed(1)}%)
   • 캐시 미스: ${this.stats.misses} (${stats.missRate.toFixed(1)}%)
   • 저장 작업: ${this.stats.sets}
   • 삭제 작업: ${this.stats.deletes}

💾 메모리 사용:
   • 로컬 캐시 항목: ${stats.totalEntries}/${this.MAX_LOCAL_CACHE_SIZE}
   • 메모리 사용량: ${stats.memoryUsage}
   • Redis 연결: ${this.redis ? '✅ 활성' : '❌ 비활성'}

⚡ 성능 지표:
   • 히트율: ${stats.hitRate >= 70 ? '✅ 우수' : stats.hitRate >= 50 ? '⚠️ 보통' : '❌ 개선 필요'} (${stats.hitRate.toFixed(1)}%)
   • 메모리 효율: ${this.localCache.size < this.MAX_LOCAL_CACHE_SIZE * 0.8 ? '✅ 양호' : '⚠️ 주의'}
   • TTL 설정: ${this.DEFAULT_TTL / 60}분 (시연용 최적화)
`;
  }
}

// 🌟 전역 인스턴스
export const unifiedContextCache = UnifiedContextCache.getInstance();

// 🔧 편의 함수들
export const cacheGet = <T>(key: string) => unifiedContextCache.get<T>(key);
export const cacheSet = <T>(key: string, data: T, ttl?: number) =>
  unifiedContextCache.set(key, data, ttl);
export const cacheDelete = (key: string) => unifiedContextCache.delete(key);
export const getCacheStats = () => unifiedContextCache.getStats();
export const getCacheReport = () => unifiedContextCache.getPerformanceReport();
