import { useState, useEffect, useCallback } from 'react';

/**
 * 🧠 지능형 캐싱 시스템
 * 
 * React Query 스타일의 자동 캐싱, 백그라운드 갱신, stale-while-revalidate
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

export class SmartCache {
  private static instance: SmartCache;
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private defaultOptions: Required<CacheOptions> = {
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
    dedupeTime: 1000
  };

  private constructor() {
    this.setupWindowFocusListener();
    this.setupCleanupInterval();
  }

  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
  }

  /**
   * 🎯 데이터 조회 (핵심 메서드)
   */
  async query<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheEntry = this.cache.get(key);

    // 캐시 히트이고 fresh한 경우
    if (cacheEntry && !this.isStale(cacheEntry) && !cacheEntry.isLoading) {
      console.log(`🎯 캐시 히트 (fresh): ${key}`);
      return cacheEntry.data;
    }

    // 캐시 히트이지만 stale한 경우 - stale-while-revalidate
    if (cacheEntry && !cacheEntry.isLoading) {
      console.log(`🔄 캐시 히트 (stale): ${key} - 백그라운드 갱신 시작`);
      this.backgroundRefetch(key, fetcher, opts);
      return cacheEntry.data;
    }

    // 중복 요청 방지
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ 중복 요청 방지: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // 새로운 요청
    return this.fetchWithRetry(key, fetcher, opts);
  }

  /**
   * 🔄 데이터 무효화 및 재요청
   */
  async invalidateQueries(keyPrefix: string): Promise<void> {
    const keysToInvalidate = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(keyPrefix)
    );

    for (const key of keysToInvalidate) {
      const entry = this.cache.get(key);
      if (entry) {
        entry.isStale = true;
        this.notifySubscribers(key, entry.data);
      }
    }

    console.log(`🔄 ${keysToInvalidate.length}개 쿼리 무효화: ${keyPrefix}*`);
  }

  /**
   * 📡 데이터 구독
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // 구독 해제 함수 반환
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * 🗑️ 캐시 삭제
   */
  removeQueries(keyPrefix: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(keyPrefix)
    );

    for (const key of keysToRemove) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
      this.subscribers.delete(key);
    }

    console.log(`🗑️ ${keysToRemove.length}개 캐시 삭제: ${keyPrefix}*`);
  }

  /**
   * 📊 캐시 통계
   */
  getStats(): {
    totalEntries: number;
    freshEntries: number;
    staleEntries: number;
    totalSize: string;
    hitRate: number;
  } {
    const entries = Array.from(this.cache.values());
    const freshEntries = entries.filter(entry => !this.isStale(entry));
    const staleEntries = entries.filter(entry => this.isStale(entry));
    
    // 대략적인 메모리 사용량 계산
    const totalSize = this.calculateCacheSize();
    
    return {
      totalEntries: this.cache.size,
      freshEntries: freshEntries.length,
      staleEntries: staleEntries.length,
      totalSize,
      hitRate: 0 // 실제 구현에서는 히트율 추적 필요
    };
  }

  // ========== 내부 메서드 ==========

  private async fetchWithRetry<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>,
    retryCount = 0
  ): Promise<T> {
    try {
      console.log(`🚀 새로운 요청: ${key} (시도 ${retryCount + 1})`);
      
      // 로딩 상태 설정
      this.updateCacheEntry(key, {
        isLoading: true,
        retryCount,
        timestamp: Date.now()
      });

      const promise = fetcher();
      this.pendingRequests.set(key, promise);

      const data = await promise;

      // 성공 시 캐시 업데이트
      this.updateCacheEntry(key, {
        data,
        timestamp: Date.now(),
        staleTime: options.staleTime,
        cacheTime: options.cacheTime,
        refetchOnWindowFocus: options.refetchOnWindowFocus,
        retryCount: 0,
        isStale: false,
        isLoading: false,
        error: undefined
      });

      this.pendingRequests.delete(key);
      this.notifySubscribers(key, data);
      
      return data;

    } catch (error) {
      console.error(`❌ 요청 실패: ${key} (시도 ${retryCount + 1})`, error);
      
      this.pendingRequests.delete(key);

      // 재시도 로직
      if (retryCount < options.retry) {
        const delay = options.retryDelay * Math.pow(2, retryCount); // 지수 백오프
        console.log(`🔄 ${delay}ms 후 재시도: ${key}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(key, fetcher, options, retryCount + 1);
      }

      // 최종 실패
      this.updateCacheEntry(key, {
        isLoading: false,
        error: error as Error,
        retryCount
      });

      throw error;
    }
  }

  private async backgroundRefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>
  ): Promise<void> {
    try {
      await this.fetchWithRetry(key, fetcher, options);
    } catch (error) {
      console.warn(`⚠️ 백그라운드 갱신 실패: ${key}`, error);
    }
  }

  private isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.staleTime;
  }

  private updateCacheEntry(key: string, updates: Partial<CacheEntry>): void {
    const existing = this.cache.get(key);
    const updated = existing ? { ...existing, ...updates } : {
      data: null,
      timestamp: Date.now(),
      staleTime: this.defaultOptions.staleTime,
      cacheTime: this.defaultOptions.cacheTime,
      refetchOnWindowFocus: this.defaultOptions.refetchOnWindowFocus,
      retryCount: 0,
      isStale: false,
      isLoading: false,
      ...updates
    };
    
    this.cache.set(key, updated);
  }

  private notifySubscribers(key: string, data: any): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ 구독자 알림 실패: ${key}`, error);
        }
      });
    }
  }

  private setupWindowFocusListener(): void {
    if (typeof window === 'undefined') return;

    let focused = true;

    const handleFocus = () => {
      if (!focused) {
        focused = true;
        console.log('🔄 윈도우 포커스 - 캐시 갱신 시작');
        this.refetchOnFocus();
      }
    };

    const handleBlur = () => {
      focused = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  }

  private refetchOnFocus(): void {
    for (const [key, entry] of this.cache) {
      if (entry.refetchOnWindowFocus && this.isStale(entry)) {
        // 백그라운드에서 갱신 (fetcher가 없어서 스킵)
        console.log(`🔄 포커스 갱신 대상: ${key}`);
      }
    }
  }

  private setupCleanupInterval(): void {
    // 10분마다 만료된 캐시 정리
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.cacheTime) {
        this.cache.delete(key);
        this.subscribers.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 만료된 캐시 ${cleanedCount}개 정리 완료`);
    }
  }

  private calculateCacheSize(): string {
    try {
      const jsonString = JSON.stringify(Array.from(this.cache.entries()));
      const sizeInBytes = new Blob([jsonString]).size;
      
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return '계산 불가';
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const smartCache = SmartCache.getInstance();

/**
 * 🎣 React Hook for Smart Cache
 */
export function useSmartQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await smartCache.query(key, fetcher, options);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // 구독 설정
    const unsubscribe = smartCache.subscribe(key, (newData: T) => {
      if (mounted) {
        setData(newData);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key, fetcher, options]);

  const mutate = useCallback(async (newData?: T) => {
    if (newData) {
      setData(newData);
    }
    await smartCache.invalidateQueries(key);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    mutate
  };
} 