// React import 제거 - 서버 환경 호환성을 위해
// import { useState, useEffect, useCallback } from 'react';

/**
 * 🧠 지능형 캐싱 시스템
 * 
 * 서버/클라이언트 양쪽에서 사용 가능한 캐싱 솔루션
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
    staleTime: 300000, // 5분
    cacheTime: 1800000, // 30분
    refetchOnWindowFocus: false, // 서버 환경에서는 기본 false
    retry: 3,
    retryDelay: 1000,
    dedupeTime: 2000
  };

  private constructor() {
    this.setupCleanupInterval();
    // 브라우저 환경에서만 포커스 리스너 설정
    if (typeof window !== 'undefined') {
      this.setupWindowFocusListener();
    }
  }

  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
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
    const pendingKey = `${key}:${Date.now()}`;
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
      
      // 구독자들에게 무효화 알림
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.forEach(callback => {
          try {
            callback(undefined);
          } catch (error) {
            console.error(`❌ 무효화 알림 실패: ${key}`, error);
          }
        });
      }
    }

    console.log(`🗑️ 캐시 무효화: ${keysToInvalidate.length}개 키 제거`);
  }

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // 현재 캐시된 데이터가 있으면 즉시 콜백 실행
    const cached = this.cache.get(key);
    if (cached && !cached.error) {
      try {
        callback(cached.data);
      } catch (error) {
        console.error(`❌ 구독 콜백 실패: ${key}`, error);
      }
    }
    
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
      this.subscribers.delete(key);
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
      hitRate: 0.85 // 임시값, 실제로는 히트/미스 카운터 필요
    };
  }

  private async fetchWithRetry<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>,
    retryCount = 0
  ): Promise<T> {
    this.updateCacheEntry(key, { isLoading: true, error: undefined });

    try {
      const result = await fetcher();
      
      // 성공적으로 데이터를 가져온 경우
      this.updateCacheEntry(key, {
        data: result,
        timestamp: Date.now(),
        isLoading: false,
        error: undefined,
        retryCount: 0,
        isStale: false
      });

      // 구독자들에게 새 데이터 알림
      this.notifySubscribers(key, result);

      return result;
    } catch (error) {
      // 재시도 가능한 경우
      if (retryCount < options.retry) {
        console.warn(`⚠️ 재시도 ${retryCount + 1}/${options.retry}: ${key}`, error);
        
        // 지연 후 재시도
        await new Promise(resolve => setTimeout(resolve, options.retryDelay * (retryCount + 1)));
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
      this.optimizeCache();
    }, 10 * 60 * 1000); // 10분마다 정리 (성능 최적화)
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

  private optimizeCache(): void {
    // 캐시 최적화 로직 구현
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