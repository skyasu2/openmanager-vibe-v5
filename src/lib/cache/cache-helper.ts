/**
 * 🚀 캐시 헬퍼 유틸리티 v3.0 (통합 캐시 래퍼)
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 * 내부적으로 unified-cache.ts의 UnifiedCacheService를 사용합니다.
 *
 * 마이그레이션 가이드:
 * - 새 코드는 unified-cache.ts를 직접 import하여 사용하세요
 * - 기존 코드는 이 파일을 계속 사용할 수 있습니다
 */

export type { SWRPresetKey } from './unified-cache';
// 통합 캐시에서 모든 기능을 재export
export {
  CacheNamespace,
  CacheTTL,
  cacheOrFetch,
  createCachedResponse,
  createCacheHeaders,
  createCacheHeadersFromPreset,
  getCachedData,
  getCacheStats,
  invalidateCache,
  SWRPreset,
  setCachedData,
  UnifiedCacheService,
  unifiedCache,
} from './unified-cache';

import { logger } from '@/lib/logging';
// 추가 호환성 함수들
import {
  CacheNamespace,
  UnifiedCacheService,
  unifiedCache,
} from './unified-cache';

/**
 * 캐시 서비스 인스턴스 가져오기 (하위 호환성)
 * @deprecated unified-cache.ts의 unifiedCache를 직접 사용하세요
 */
export function getCacheService(): MemoryCacheService {
  logger.warn(
    'getCacheService() is deprecated. Use MemoryCacheService or unifiedCache instead.'
  );
  return getGlobalCacheService();
}

/**
 * 캐시 데이터 조회 또는 fallback 실행 (하위 호환성)
 * @deprecated cacheOrFetch를 사용하세요
 */
export async function getCachedDataWithFallback<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  return unifiedCache.getOrFetch(key, fallback, {
    ttlSeconds,
    namespace: CacheNamespace.GENERAL,
  });
}

/**
 * 함수 결과 캐싱 래퍼 (하위 호환성)
 */
export function cacheWrapper<
  T extends (...args: unknown[]) => Promise<unknown>,
>(keyPrefix: string, fn: T, ttlSeconds: number = 300): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

    return unifiedCache.getOrFetch(cacheKey, () => fn(...args), {
      ttlSeconds,
      namespace: CacheNamespace.GENERAL,
    });
  }) as T;
}

/**
 * 여러 키를 한 번에 캐시 또는 페칭 (하위 호환성)
 */
export async function cacheOrFetchMany<T>(
  items: Array<{
    key: string;
    fetcher: () => Promise<T>;
    ttl?: number;
  }>
): Promise<T[]> {
  const promises = items.map((item) =>
    unifiedCache.getOrFetch(item.key, item.fetcher, {
      ttlSeconds: item.ttl,
      namespace: CacheNamespace.GENERAL,
    })
  );

  return Promise.all(promises);
}

/**
 * Response 헤더에 캐시 제어 추가 (하위 호환성)
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
 * 캐시 워밍업 (사전 로딩) - 하위 호환성
 */
export async function warmupCache(
  items: Array<{
    key: string;
    fetcher: () => Promise<unknown>;
    ttl?: number;
  }>
): Promise<void> {
  logger.info(`🔥 캐시 워밍업 시작: ${items.length}개 항목`);

  const promises = items.map(async ({ key, fetcher, ttl }) => {
    try {
      const data = await fetcher();
      await unifiedCache.set(key, data, {
        ttlSeconds: ttl,
        namespace: CacheNamespace.GENERAL,
      });
    } catch (error) {
      logger.error(`캐시 워밍업 실패 (${key}):`, error);
    }
  });

  await Promise.allSettled(promises);
  logger.info('✅ 캐시 워밍업 완료');
}

/**
 * 메모리 기반 캐시 헬스체크 (하위 호환성)
 */
export function getCacheHealth(): {
  status: 'online' | 'warning' | 'critical';
  details: {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryPressure: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
} {
  const stats = unifiedCache.getStats();
  const usagePercent = (stats.size / stats.maxSize) * 100;

  const recommendations: string[] = [];
  let status: 'online' | 'warning' | 'critical' = 'online';
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
    if (status === 'online') status = 'warning';
    recommendations.push('캐시 히트율이 낮습니다. TTL을 검토하세요.');
  }

  return {
    status,
    details: {
      size: stats.size,
      maxSize: stats.maxSize,
      hitRate: stats.hitRate,
      memoryPressure,
    },
    recommendations,
  };
}

// MemoryCacheService 클래스 (하위 호환성)
export class MemoryCacheService {
  private unifiedCache = UnifiedCacheService.getInstance();

  // 하위 호환성을 위한 public cache 속성
  get cache() {
    logger.warn(
      'Direct cache access is deprecated. Use the provided methods instead.'
    );
    return new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    return this.unifiedCache.get<T>(key, CacheNamespace.GENERAL);
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    return this.unifiedCache.set(key, value, {
      ttlSeconds,
      namespace: CacheNamespace.GENERAL,
    });
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return this.unifiedCache.mget<T>(keys, CacheNamespace.GENERAL);
  }

  async delete(key: string): Promise<void> {
    return this.unifiedCache.invalidate(key, CacheNamespace.GENERAL);
  }

  async invalidateCache(pattern?: string): Promise<void> {
    return this.unifiedCache.invalidate(pattern, CacheNamespace.GENERAL);
  }

  getStats() {
    return this.unifiedCache.getStats();
  }

  resetStats(): void {
    this.unifiedCache.resetStats();
  }

  cleanup(): void {
    this.unifiedCache.cleanup();
  }
}

// 글로벌 캐시 서비스 인스턴스 (하위 호환성)
let globalCacheService: MemoryCacheService | null = null;

// 하위 호환성을 위한 export
export function getGlobalCacheService(): MemoryCacheService {
  if (!globalCacheService) {
    globalCacheService = new MemoryCacheService();
  }
  return globalCacheService;
}
