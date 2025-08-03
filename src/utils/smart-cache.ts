/**
 * 🧠 요청별 캐싱 시스템 (서버리스 호환)
 *
 * 서버리스 환경에서 요청 범위 내에서만 동작하는 캐싱 솔루션
 * 싱글톤 패턴 제거, 전역 상태 제거
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
  refetchOnWindowFocus?: boolean;
  retryCount: number;
  isStale: boolean;
  isLoading: boolean;
  error?: Error;
}

export interface CacheOptions {
  staleTime?: number; // 데이터가 stale로 간주되는 시간 (ms)
  cacheTime?: number; // 캐시에서 제거되기까지의 시간 (ms)
  refetchOnWindowFocus?: boolean; // 윈도우 포커스 시 재요청
  retry?: number; // 재시도 횟수
  retryDelay?: number; // 재시도 지연 시간 (ms)
  dedupeTime?: number; // 중복 요청 방지 시간 (ms)
}

/**
 * 🚫 서버리스 호환: 요청별 인스턴스, 전역 상태 없음
 * 각 요청마다 새로운 인스턴스를 생성하여 사용
 */
export class RequestScopedCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private defaultOptions: Required<CacheOptions> = {
    staleTime: 300000, // 5분
    cacheTime: 1800000, // 30분
    refetchOnWindowFocus: false, // 서버 환경에서는 기본 false
    retry: 3,
    retryDelay: 1000,
    dedupeTime: 2000,
  };

  constructor() {
    // 🚫 타이머 제거: 서버리스에서 지속적 타이머 금지
    // 🚫 이벤트 리스너 제거: 전역 상태 유지 금지
  }

  async query<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const cached = this.cache.get(key);

    // 캐시된 데이터가 있고 아직 fresh한 경우
    if (cached && !this.isStale(cached) && !cached.error) {
      return cached.data;
    }

    // 이미 진행 중인 요청이 있는 경우 중복 제거
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // 새로운 요청 시작
    const promise = this.fetchWithRetry(key, fetcher, opts);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  async invalidateQueries(keyPrefix: string): Promise<void> {
    const keysToInvalidate: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        keysToInvalidate.push(key);
      }
    }

    for (const key of keysToInvalidate) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    }

    console.log(`🗑️ 캐시 무효화: ${keysToInvalidate.length}개 키 제거`);
  }

  removeQueries(keyPrefix: string): void {
    const keysToRemove: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    }

    console.log(`🗑️ 캐시 제거: ${keysToRemove.length}개 키 삭제`);
  }

  getStats(): {
    totalEntries: number;
    freshEntries: number;
    staleEntries: number;
    totalSize: string;
    hitRate: number;
  } {
    let freshCount = 0;
    let staleCount = 0;

    for (const entry of this.cache.values()) {
      if (this.isStale(entry)) {
        staleCount++;
      } else {
        freshCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      freshEntries: freshCount,
      staleEntries: staleCount,
      totalSize: this.calculateCacheSize(),
      hitRate: 0.85, // 임시값, 실제로는 히트/미스 카운터 필요
    };
  }

  private async fetchWithRetry<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>,
    retryCount = 0
  ): Promise<T> {
    try {
      this.updateCacheEntry(key, { isLoading: true, error: undefined });

      const data = await fetcher();

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        staleTime: options.staleTime,
        cacheTime: options.cacheTime,
        refetchOnWindowFocus: options.refetchOnWindowFocus,
        retryCount: 0,
        isStale: false,
        isLoading: false,
      };

      this.cache.set(key, entry);

      return data;
    } catch (error) {
      if (retryCount < options.retry) {
        console.warn(`🔄 재시도 ${retryCount + 1}/${options.retry}: ${key}`);

        // 🚫 setTimeout 제거: 서버리스에서 타이머 사용 금지
        // await new Promise(resolve => setTimeout(resolve, options.retryDelay * (retryCount + 1)));

        return this.fetchWithRetry(key, fetcher, options, retryCount + 1);
      }

      this.updateCacheEntry(key, {
        isLoading: false,
        error: error as Error,
        retryCount,
      });

      throw error;
    }
  }

  private isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.staleTime;
  }

  private updateCacheEntry(key: string, updates: Partial<CacheEntry>): void {
    const existing = this.cache.get(key);
    if (existing) {
      this.cache.set(key, { ...existing, ...updates });
    } else {
      this.cache.set(key, {
        data: null,
        timestamp: Date.now(),
        staleTime: this.defaultOptions.staleTime,
        cacheTime: this.defaultOptions.cacheTime,
        retryCount: 0,
        isStale: false,
        isLoading: false,
        ...updates,
      } as CacheEntry);
    }
  }

  private calculateCacheSize(): string {
    const sizeInBytes = JSON.stringify(Array.from(this.cache.entries())).length;
    const sizeInKB = sizeInBytes / 1024;

    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(2)} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
  }
}

/**
 * 🔧 서버리스 호환 헬퍼 함수
 * 각 요청마다 새로운 캐시 인스턴스 생성
 */
export function createRequestCache(): RequestScopedCache {
  return new RequestScopedCache();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createRequestCache() 사용
 */
export const SmartCache = {
  getInstance: () => {
    console.warn(
      '⚠️ SmartCache.getInstance()는 서버리스에서 사용 금지. createRequestCache() 사용하세요.'
    );
    return new RequestScopedCache();
  },
};
