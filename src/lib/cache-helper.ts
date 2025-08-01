/**
 * 🚀 캐시 헬퍼 유틸리티 v1.0
 *
 * API 라우트와 서버 컴포넌트에서 사용하기 쉬운 캐시 유틸리티
 * - 자동 직렬화/역직렬화
 * - 타입 안전성
 * - 에러 핸들링
 * - 캐시 미스 시 자동 페칭
 */

import { getUpstashRedis } from './upstash-redis';
import { UpstashCacheService } from '@/services/upstashCacheService';

// 글로벌 캐시 서비스 인스턴스
let globalCacheService: UpstashCacheService | null = null;

/**
 * 캐시 서비스 인스턴스 가져오기
 */
export function getCacheService(): UpstashCacheService {
  if (!globalCacheService) {
    const redis = getUpstashRedis();
    globalCacheService = new UpstashCacheService(redis);
  }
  return globalCacheService;
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
    cache.set(key, data, options?.ttl).catch((error) => {
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
  const keys = items.map((item) => item.key);

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
          cache.set(item.key, data, item.ttl).catch((error) => {
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
    return Promise.all(items.map((item) => item.fetcher()));
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
    fetcher: () => Promise<any>;
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
