/**
 * 🚀 Edge Runtime 메모리 캐시
 * 
 * Redis 대체용 로컬 메모리 캐시
 * - Edge Runtime 메모리 제한 고려 (128MB)
 * - LRU 정책으로 자동 정리
 * - TTL 기반 만료 처리
 */

interface CachedItem<T = unknown> {
  data: T;
  expiresAt: number;
  accessedAt: number;
  size: number;
}

export class EdgeCache {
  private cache = new Map<string, CachedItem<unknown>>();
  private maxSize = 100; // 최대 캐시 항목 수
  private maxMemoryMB = 50; // Edge Runtime 메모리 제한 (MB)
  private currentMemoryUsage = 0;

  /**
   * 캐시에서 값 조회
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // 만료 확인
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }
    
    // 접근 시간 업데이트 (LRU)
    item.accessedAt = Date.now();
    
    return item.data as T;
  }

  /**
   * 캐시에 값 저장
   */
  async set<T = unknown>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const size = this.estimateSize(value);
    
    // 메모리 제한 확인
    if (this.currentMemoryUsage + size > this.maxMemoryMB * 1024 * 1024) {
      this.evictLRU();
    }
    
    // 항목 수 제한 확인
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const item: CachedItem<T> = {
      data: value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      accessedAt: Date.now(),
      size,
    };
    
    // 기존 항목이 있으면 메모리 사용량 업데이트
    const oldItem = this.cache.get(key);
    if (oldItem) {
      this.currentMemoryUsage -= oldItem.size;
    }
    
    this.cache.set(key, item);
    this.currentMemoryUsage += size;
  }

  /**
   * 캐시에서 값 삭제
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.currentMemoryUsage -= item.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * 캐시 전체 초기화
   */
  clear(): void {
    this.cache.clear();
    this.currentMemoryUsage = 0;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    let validItems = 0;
    const now = Date.now();
    
    for (const [_, item] of this.cache.entries()) {
      if (now <= item.expiresAt) {
        validItems++;
      }
    }
    
    return {
      size: this.cache.size,
      validItems,
      memoryUsageMB: Math.round(this.currentMemoryUsage / 1024 / 1024 * 100) / 100,
      maxMemoryMB: this.maxMemoryMB,
    };
  }

  /**
   * 캐시 키 생성 헬퍼
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    // 간단한 해시 생성
    let hash = 0;
    for (let i = 0; i < sortedParams.length; i++) {
      const char = sortedParams.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    
    return `${prefix}:${Math.abs(hash).toString(36)}`;
  }

  /**
   * LRU 정책으로 오래된 항목 제거
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessedAt < oldestTime) {
        oldestTime = item.accessedAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * 객체 크기 추정 (바이트)
   */
  private estimateSize(obj: unknown): number {
    const str = JSON.stringify(obj);
    // UTF-8 인코딩 크기 추정
    return new Blob([str]).size;
  }

  /**
   * 주기적 정리 (만료된 항목 제거)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.delete(key);
    }
  }
}

// 싱글톤 인스턴스
export const edgeCache = new EdgeCache();

// 주기적 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    edgeCache.cleanup();
  }, 5 * 60 * 1000);
}