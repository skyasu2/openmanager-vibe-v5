/**
 * 💾 캐시 관리자
 * 단일 책임: AI 응답 캐싱, TTL 관리, 캐시 무효화
 */

export interface QueryRequest {
  query: string;
  mode?: string;
  context?: Record<string, unknown>;
  userId?: string;
}

export interface QueryResponse {
  success: boolean;
  response: string;
  engine: string;
  confidence: number;
  error?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize?: number;        // 최대 캐시 항목 수 (기본: 200)
  defaultTTL?: number;     // 기본 TTL (기본: 5분)
  enableMetrics?: boolean; // 메트릭 수집 여부
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;          // 0-100%
  totalSize: number;
  averageTTL: number;
  oldestEntry: number;      // timestamp
  newestEntry: number;      // timestamp
  mostAccessedKeys: Array<{
    key: string;
    hits: number;
    lastAccessed: number;
  }>;
}

export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private options: Required<CacheOptions>;
  private metrics: {
    hits: number;
    misses: number;
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.options = {
      maxSize: options.maxSize || 200,
      defaultTTL: options.defaultTTL || 300000, // 5분
      enableMetrics: options.enableMetrics !== false,
    };
    this.metrics = {
      hits: 0,
      misses: 0,
    };
  }

  /**
   * 캐시 키 생성
   */
  generateCacheKey(request: QueryRequest): string {
    const keyParts = [
      request.query,
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous'
    ];
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 캐시된 응답 조회
   */
  getCachedResponse(cacheKey: string): QueryResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      if (this.options.enableMetrics) {
        this.metrics.misses++;
      }
      return null;
    }

    // TTL 확인
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      if (this.options.enableMetrics) {
        this.metrics.misses++;
      }
      return null;
    }

    // 캐시 히트 기록
    if (this.options.enableMetrics) {
      this.metrics.hits++;
      cached.hitCount++;
      cached.lastAccessed = now;
    }

    return { ...cached.response }; // 깊은 복사
  }

  /**
   * 응답 캐시 저장
   */
  setCachedResponse(
    cacheKey: string, 
    response: QueryResponse, 
    ttl: number = this.options.defaultTTL
  ): void {
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      response: { ...response }, // 깊은 복사
      timestamp: now,
      ttl,
      hitCount: 0,
      lastAccessed: now,
    });

    // 캐시 크기 제한 - LRU 방식
    if (this.cache.size > this.options.maxSize) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * LRU 방식으로 캐시 항목 제거
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ LRU 캐시 제거: ${oldestKey.substring(0, 20)}...`);
    }
  }

  /**
   * 특정 패턴으로 캐시 무효화
   */
  invalidateByPattern(pattern: RegExp): number {
    let removedCount = 0;
    
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    console.log(`🗑️ 패턴 기반 캐시 무효화: ${removedCount}개 항목 제거`);
    return removedCount;
  }

  /**
   * 사용자별 캐시 무효화
   */
  invalidateByUser(userId: string): number {
    const userPattern = new RegExp(`userId.*${userId}`);
    return this.invalidateByPattern(userPattern);
  }

  /**
   * 만료된 캐시 정리
   */
  cleanupExpired(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 만료된 캐시 정리: ${removedCount}개 항목 제거`);
    }

    return removedCount;
  }

  /**
   * 전체 캐시 초기화
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ 캐시 초기화 완료: ${size}개 항목 제거`);
  }

  /**
   * 캐시 메트릭 조회
   */
  getMetrics(): CacheMetrics {
    const entries = Array.from(this.cache.entries());
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

    // 평균 TTL 계산
    const averageTTL = entries.length > 0 
      ? entries.reduce((sum, [, entry]) => sum + entry.ttl, 0) / entries.length
      : 0;

    // 가장 오래된/최신 항목
    const timestamps = entries.map(([, entry]) => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    // 가장 많이 접근된 키들
    const mostAccessedKeys = entries
      .map(([key, entry]) => ({
        key: key.substring(0, 50) + '...', // 키 길이 제한
        hits: entry.hitCount,
        lastAccessed: entry.lastAccessed,
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize: this.cache.size,
      averageTTL: Math.round(averageTTL),
      oldestEntry,
      newestEntry,
      mostAccessedKeys,
    };
  }

  /**
   * 캐시 상태 정보
   */
  getStatus(): {
    size: number;
    maxSize: number;
    utilizationRate: number; // 0-100%
    averageAge: number;      // ms
    hitRate: number;         // 0-100%
  } {
    const metrics = this.getMetrics();
    const now = Date.now();
    
    // 평균 나이 계산
    const entries = Array.from(this.cache.values());
    const averageAge = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      utilizationRate: Math.round((this.cache.size / this.options.maxSize) * 100),
      averageAge: Math.round(averageAge),
      hitRate: metrics.hitRate,
    };
  }

  /**
   * 캐시 설정 업데이트
   */
  updateOptions(newOptions: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // 최대 크기가 줄어들면 즉시 정리
    if (newOptions.maxSize && this.cache.size > newOptions.maxSize) {
      while (this.cache.size > newOptions.maxSize) {
        this.evictLeastRecentlyUsed();
      }
    }
  }

  /**
   * 캐시 덤프 (디버깅용)
   */
  dumpCache(): Array<{
    key: string;
    timestamp: number;
    ttl: number;
    hitCount: number;
    age: number;
  }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 100) + '...', // 키 길이 제한
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      hitCount: entry.hitCount,
      age: now - entry.timestamp,
    }));
  }
}