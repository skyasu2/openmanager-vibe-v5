/**
 * 🚀 캐시 헬퍼 유틸리티 v2.0 (Redis-Free)
 *
 * API 라우트와 서버 컴포넌트에서 사용하기 쉬운 캐시 유틸리티
 * - 메모리 기반 캐시 (Redis 완전 제거)
 * - 자동 직렬화/역직렬화
 * - 타입 안전성
 * - 에러 핸들링
 * - 캐시 미스 시 자동 페칭
 * - LRU 캐시 만료 관리
 */

// 메모리 기반 캐시 서비스 클래스
class MemoryCacheService {
  public cache = new Map<string, { 
    value: any; 
    expires: number; 
    created: number;
    hits: number;
  }>();
  private maxSize = 100; // 최대 100개 항목 (90% 감소)
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    item.hits++;
    this.stats.hits++;
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // LRU 방식으로 캐시 크기 관리
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
      created: Date.now(),
      hits: 0,
    });
    
    this.stats.sets++;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async delete(key: string): Promise<void> {
    if (this.cache.delete(key)) {
      this.stats.deletes++;
    }
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // 패턴 매칭으로 키 삭제
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.deletes++;
    });
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      memoryUsage: `${Math.round(this.cache.size * 0.5)}KB`, // 추정치
    };
  }

  private evictLeastRecentlyUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      // 히트수가 적거나, 같다면 더 오래된 것을 선택
      if (item.hits < leastHits || (item.hits === leastHits && item.created < oldestTime)) {
        leastHits = item.hits;
        oldestTime = item.created;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.deletes++;
    }
  }

  // 만료된 항목 정리
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expires <= now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.deletes++;
    });
  }
}

// 글로벌 캐시 서비스 인스턴스
let globalCacheService: MemoryCacheService | null = null;

/**
 * 캐시 서비스 인스턴스 가져오기
 */
export function getCacheService(): MemoryCacheService {
  if (!globalCacheService) {
    globalCacheService = new MemoryCacheService();
    
    // 주기적 정리 (5분마다)
    setInterval(() => {
      globalCacheService?.cleanup();
    }, 5 * 60 * 1000);
  }
  return globalCacheService;
}

/**
 * Simple cache get (for compatibility)
 */
export function getCachedData<T>(key: string): T | null {
  const cache = getCacheService();
  try {
    const item = cache.cache.get(key);
    if (!item || Date.now() > item.expires) {
      return null;
    }
    item.hits++;
    return item.value as T;
  } catch {
    return null;
  }
}

/**
 * Simple cache set (for compatibility) 
 */
export function setCachedData<T>(key: string, data: T, ttlSeconds: number = 300): void {
  const cache = getCacheService();
  try {
    cache.set(key, data, ttlSeconds);
  } catch (error) {
    console.error(`Cache set failed (${key}):`, error);
  }
}

/**
 * 캐시 또는 페칭 패턴
 * 캐시에 있으면 반환, 없으면 페칭 후 캐싱
 */
export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    force?: boolean;
  }
): Promise<T> {
  const cache = getCacheService();

  // 강제 새로고침이 아니면 캐시 확인
  if (!options?.force) {
    try {
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.error(`캐시 조회 실패 (${key}):`, error);
    }
  }

  // 캐시 미스 또는 강제 새로고침: 데이터 페칭
  try {
    const data = await fetcher();

    // 결과 캐싱 (비동기로 처리하여 응답 지연 방지)
    cache.set(key, data, options?.ttl).catch(error => {
      console.error(`캐시 저장 실패 (${key}):`, error);
    });

    return data;
  } catch (error) {
    console.error(`데이터 페칭 실패 (${key}):`, error);
    throw error;
  }
}

/**
 * 여러 키를 한 번에 캐시 또는 페칭
 */
export async function cacheOrFetchMany<T>(
  items: Array<{
    key: string;
    fetcher: () => Promise<T>;
    ttl?: number;
  }>
): Promise<T[]> {
  const cache = getCacheService();
  const keys = items.map(item => item.key);

  try {
    // 배치로 캐시 조회
    const cached = await cache.mget<T>(keys);
    const results: T[] = [];
    const toFetch: Array<{ index: number; item: (typeof items)[0] }> = [];

    // 캐시 히트/미스 분류
    cached.forEach((value, index) => {
      if (value !== null) {
        results[index] = value;
      } else {
        toFetch.push({ index, item: items[index] });
      }
    });

    // 캐시 미스 항목 페칭
    if (toFetch.length > 0) {
      const fetchPromises = toFetch.map(async ({ index, item }) => {
        try {
          const data = await item.fetcher();
          results[index] = data;

          // 비동기 캐싱
          cache.set(item.key, data, item.ttl).catch(error => {
            console.error(`배치 캐시 저장 실패 (${item.key}):`, error);
          });

          return data;
        } catch (error) {
          console.error(`배치 페칭 실패 (${item.key}):`, error);
          throw error;
        }
      });

      await Promise.all(fetchPromises);
    }

    return results;
  } catch (error) {
    // 캐시 실패 시 모든 항목 페칭
    console.error('배치 캐시 조회 실패, 전체 페칭:', error);
    return Promise.all(items.map(item => item.fetcher()));
  }
}

/**
 * 캐시 무효화 헬퍼
 */
export async function invalidateCache(pattern?: string): Promise<void> {
  const cache = getCacheService();
  try {
    await cache.invalidateCache(pattern);
  } catch (error) {
    console.error('캐시 무효화 실패:', error);
  }
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats() {
  const cache = getCacheService();
  return cache.getStats();
}

/**
 * Response 헤더에 캐시 제어 추가
 */
export function setCacheHeaders(
  headers: Headers,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    private?: boolean;
  } = {}
): void {
  const directives: string[] = [];

  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  headers.set('Cache-Control', directives.join(', '));
}

/**
 * Next.js API Response에 캐시 헤더 추가
 */
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
  });

  setCacheHeaders(headers, {
    maxAge: options.maxAge ?? 0,
    sMaxAge: options.sMaxAge ?? 60,
    staleWhileRevalidate: options.staleWhileRevalidate ?? 300,
  });

  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers,
  });
}

/**
 * 캐시 워밍업 (사전 로딩)
 */
export async function warmupCache(
  items: Array<{
    key: string;
    fetcher: () => Promise<unknown>;
    ttl?: number;
  }>
): Promise<void> {
  const cache = getCacheService();

  console.log(`🔥 캐시 워밍업 시작: ${items.length}개 항목`);

  const promises = items.map(async ({ key, fetcher, ttl }) => {
    try {
      const data = await fetcher();
      await cache.set(key, data, ttl);
    } catch (error) {
      console.error(`캐시 워밍업 실패 (${key}):`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log('✅ 캐시 워밍업 완료');
}

/**
 * 메모리 기반 캐시 헬스체크
 */
export function getCacheHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  details: {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryPressure: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
} {
  const cache = getCacheService();
  const stats = cache.getStats();
  const usagePercent = (stats.size / 1000) * 100; // maxSize가 1000이므로
  
  const recommendations: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  let memoryPressure: 'low' | 'medium' | 'high' = 'low';

  if (usagePercent > 90) {
    status = 'critical';
    memoryPressure = 'high';
    recommendations.push('캐시 크기가 위험 수준입니다. 정리를 고려하세요.');
  } else if (usagePercent > 70) {
    status = 'warning';
    memoryPressure = 'medium';
    recommendations.push('캐시 사용률이 높습니다. 모니터링하세요.');
  }

  if (stats.hitRate < 50) {
    if (status === 'healthy') status = 'warning';
    recommendations.push('캐시 히트율이 낮습니다. TTL을 검토하세요.');
  }

  return {
    status,
    details: {
      size: stats.size,
      maxSize: 1000,
      hitRate: stats.hitRate,
      memoryPressure,
    },
    recommendations,
  };
}