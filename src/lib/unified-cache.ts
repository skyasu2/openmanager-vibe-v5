/**
 * 🚀 통합 캐시 시스템 v3.0
 *
 * 3개의 중복 캐시 시스템을 하나로 통합
 * - Memory 기반 LRU 캐시 (cache-helper.ts)
 * - AI 쿼리 패턴 캐시 (query-cache-manager.ts)
 * - AI 응답 캐시 (CacheManager.ts)
 *
 * 특징:
 * - 단일 인터페이스로 모든 캐시 기능 제공
 * - 타입별 네임스페이스 지원
 * - 패턴 학습 및 예측
 * - 자동 TTL 관리
 * - LRU 정책
 * - 통계 및 메트릭
 */

// 타입 정의
interface CacheItem<T = unknown> {
  value: T;
  expires: number;
  created: number;
  hits: number;
  namespace: string;
  pattern?: string;
  metadata?: Record<string, unknown>;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: string;
  namespaces: Record<string, number>;
}

interface QueryPattern {
  id: string;
  regex: string;
  frequency: number;
  avgResponseTime: number;
  lastUsed: Date;
  hits: number;
}

// 캐시 네임스페이스 enum
export enum CacheNamespace {
  GENERAL = 'general',
  AI_QUERY = 'ai_query',
  AI_RESPONSE = 'ai_response',
  API = 'api',
  SERVER_METRICS = 'server_metrics',
  USER_SESSION = 'user_session',
}

/**
 * 통합 캐시 서비스
 */
export class UnifiedCacheService {
  private cache = new Map<string, CacheItem<unknown>>();
  private patterns = new Map<string, QueryPattern>();
  private maxSize = 1000; // 통합 후 최대 1000개
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    namespaces: {} as Record<string, number>,
  };

  // Singleton 인스턴스
  private static instance: UnifiedCacheService;

  private constructor() {
    // Runtime별 cleanup 전략
    this.initCleanupStrategy();
  }

  private initCleanupStrategy() {
    try {
      // Edge Runtime 감지 (setInterval 제한 여부 확인)
      if (
        typeof setInterval === 'function' &&
        typeof process !== 'undefined' &&
        process.env.NODE_ENV !== 'test'
      ) {
        // Node.js Runtime: 5분마다 자동 정리
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
      } else {
        // Edge Runtime: 요청별 정리 (cleanup은 수동으로 호출됨)
        // 빌드 시에는 아무것도 하지 않음
      }
    } catch (_error) {
      // setInterval 사용 불가 환경: 수동 cleanup만 사용
      console.warn(
        'Automatic cache cleanup disabled: setInterval not available'
      );
    }
  }

  static getInstance(): UnifiedCacheService {
    if (!UnifiedCacheService.instance) {
      UnifiedCacheService.instance = new UnifiedCacheService();
    }
    return UnifiedCacheService.instance;
  }

  /**
   * 캐시에서 값 가져오기
   */
  async get<T>(
    key: string,
    namespace: CacheNamespace = CacheNamespace.GENERAL
  ): Promise<T | null> {
    const fullKey = `${namespace}:${key}`;
    const item = this.cache.get(fullKey);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      return null;
    }

    item.hits++;
    this.stats.hits++;
    return item.value as T;
  }

  /**
   * 여러 키를 한 번에 조회 (배치 조회)
   */
  async mget<T>(
    keys: string[],
    namespace: CacheNamespace = CacheNamespace.GENERAL
  ): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    for (const key of keys) {
      const value = await this.get<T>(key, namespace);
      results.push(value);
    }

    return results;
  }

  /**
   * 캐시에 값 저장
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttlSeconds?: number;
      namespace?: CacheNamespace;
      pattern?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    const {
      ttlSeconds = 300,
      namespace = CacheNamespace.GENERAL,
      pattern,
      metadata,
    } = options;

    const fullKey = `${namespace}:${key}`;

    // LRU 정책 적용
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(fullKey, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
      created: Date.now(),
      hits: 0,
      namespace: String(namespace),
      pattern,
      metadata,
    });

    // 네임스페이스별 통계 업데이트
    const namespaceKey = String(namespace);
    this.stats.namespaces[namespaceKey] =
      (this.stats.namespaces[namespaceKey] || 0) + 1;
    this.stats.sets++;

    // 패턴 학습 (AI 쿼리인 경우)
    if (namespace === CacheNamespace.AI_QUERY && pattern) {
      this.learnPattern(pattern, metadata);
    }
  }

  /**
   * 캐시 또는 페칭 패턴
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttlSeconds?: number;
      namespace?: CacheNamespace;
      force?: boolean;
    } = {}
  ): Promise<T> {
    const { force = false, namespace = CacheNamespace.GENERAL } = options;

    if (!force) {
      const cached = await this.get<T>(key, namespace);
      if (cached !== null) {
        return cached;
      }
    }

    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  /**
   * 패턴 학습 (AI 쿼리용)
   */
  private learnPattern(
    pattern: string,
    metadata?: Record<string, unknown>
  ): void {
    const patternKey = this.normalizePattern(pattern);
    const existing = this.patterns.get(patternKey);

    if (existing) {
      existing.frequency++;
      existing.hits++;
      existing.lastUsed = new Date();
      if (metadata?.responseTime) {
        existing.avgResponseTime =
          (existing.avgResponseTime * (existing.hits - 1) +
            (metadata.responseTime as number)) /
          existing.hits;
      }
    } else {
      this.patterns.set(patternKey, {
        id: patternKey,
        regex: pattern,
        frequency: 1,
        avgResponseTime: (metadata?.responseTime as number) || 0,
        lastUsed: new Date(),
        hits: 1,
      });
    }
  }

  /**
   * 패턴 정규화
   */
  private normalizePattern(pattern: string): string {
    return pattern
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * 캐시 무효화
   */
  async invalidate(
    pattern?: string,
    namespace?: CacheNamespace
  ): Promise<void> {
    if (!pattern && !namespace) {
      this.cache.clear();
      this.stats.deletes += this.cache.size;
      return;
    }

    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const item = this.cache.get(key) ?? null;
      if (!item) continue;

      // 네임스페이스 매칭
      if (namespace && item.namespace !== String(namespace)) continue;

      // 패턴 매칭
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (!regex.test(key)) continue;
      }

      keysToDelete.push(key);
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.stats.deletes++;
    });
  }

  /**
   * LRU 정책으로 가장 오래된/적게 사용된 항목 제거
   */
  private evictLeastRecentlyUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (
        item.hits < leastHits ||
        (item.hits === leastHits && item.created < oldestTime)
      ) {
        leastHits = item.hits;
        oldestTime = item.created;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      const item = this.cache.get(leastUsedKey);
      if (item?.namespace && typeof item.namespace === 'string') {
        const currentCount = this.stats.namespaces[item.namespace];
        if (currentCount !== undefined && currentCount > 0) {
          this.stats.namespaces[item.namespace] = currentCount - 1;
        }
      }
      this.cache.delete(leastUsedKey);
      this.stats.deletes++;
    }
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (item?.expires <= now) {
        expiredKeys.push(key);
        if (item?.namespace && typeof item.namespace === 'string') {
          const currentCount = this.stats.namespaces[item.namespace];
          if (currentCount !== undefined && currentCount > 0) {
            this.stats.namespaces[item.namespace] = currentCount - 1;
          }
        }
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      this.stats.deletes++;
    });
  }

  /**
   * 통계 정보 가져오기
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const namespaceCount: Record<string, number> = {};

    // 현재 네임스페이스별 카운트
    for (const item of this.cache.values()) {
      namespaceCount[item.namespace] =
        (namespaceCount[item.namespace] || 0) + 1;
    }

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      memoryUsage: `${Math.round(this.cache.size * 0.5)}KB`,
      namespaces: namespaceCount,
    };
  }

  /**
   * 패턴 통계 가져오기
   */
  getPatternStats(): QueryPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 패턴
  }

  /**
   * 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      namespaces: {},
    };
  }
}

// 글로벌 인스턴스 export
export const unifiedCache = UnifiedCacheService.getInstance();

// 하위 호환성을 위한 wrapper 함수들
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cache = UnifiedCacheService.getInstance();
  return await cache.get<T>(key, CacheNamespace.GENERAL);
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds: number = 300
): Promise<void> {
  const cache = UnifiedCacheService.getInstance();
  await cache.set(key, data, { ttlSeconds, namespace: CacheNamespace.GENERAL });
}

export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    force?: boolean;
  }
): Promise<T> {
  const cache = UnifiedCacheService.getInstance();
  return cache.getOrFetch(key, fetcher, {
    ttlSeconds: options?.ttl,
    force: options?.force,
    namespace: CacheNamespace.GENERAL,
  });
}

export async function invalidateCache(pattern?: string): Promise<void> {
  const cache = UnifiedCacheService.getInstance();
  return cache.invalidate(pattern);
}

export function getCacheStats(): CacheStats {
  const cache = UnifiedCacheService.getInstance();
  return cache.getStats();
}

export async function getCachedDataWithFallback<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds: number = 300,
  namespace: CacheNamespace = CacheNamespace.GENERAL
): Promise<T> {
  const cache = UnifiedCacheService.getInstance();
  return cache.getOrFetch(key, fallback, { ttlSeconds, namespace });
}

export function cacheWrapper<T extends unknown[], R>(
  key: string,
  fn: (...args: T) => Promise<R>,
  ttlSeconds: number = 300
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const cache = UnifiedCacheService.getInstance();
    const cacheKey = `${key}:${JSON.stringify(args)}`;
    return cache.getOrFetch(cacheKey, () => fn(...args), {
      ttlSeconds,
      namespace: CacheNamespace.GENERAL,
    });
  };
}

// Next.js Response 헬퍼
export function createCachedResponse<T>(
  data: T,
  options: {
    status?: number;
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
  } = {}
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': [
      'public',
      `max-age=${options.maxAge ?? 0}`,
      `s-maxage=${options.sMaxAge ?? 60}`,
      `stale-while-revalidate=${options.staleWhileRevalidate ?? 300}`,
    ].join(', '),
  });

  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers,
  });
}
