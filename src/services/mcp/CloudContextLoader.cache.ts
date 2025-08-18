/**
 * 🧠 Memory Context Cache - CloudContextLoader Module
 *
 * High-performance in-memory caching for MCP context data:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) expiration management
 * - Hit/miss statistics tracking
 * - Automatic cleanup of expired entries
 * - Memory-efficient key-value storage
 */

export interface CacheItem {
  value: unknown;
  expires: number;
  lastAccess: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

/**
 * 메모리 기반 컨텍스트 캐시
 *
 * Features:
 * - Maximum 50 context entries (configurable)
 * - LRU eviction when cache is full
 * - TTL-based automatic expiration
 * - Performance statistics tracking
 */
export class MemoryContextCache {
  private cache = new Map<string, CacheItem>();
  private maxSize = 50; // 최대 50개 컨텍스트
  private hits = 0;
  private misses = 0;

  /**
   * 캐시에 값 저장 (LRU 방식으로 크기 관리)
   */
  set(key: string, value: unknown, ttlSeconds: number): void {
    // LRU 방식으로 캐시 크기 관리
    if (this.cache.size >= this.maxSize) {
      let oldestKey = '';
      let oldestTime = Date.now();

      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccess < oldestTime) {
          oldestTime = v.lastAccess;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
      lastAccess: Date.now(),
    });
  }

  /**
   * 캐시에서 값 조회 (TTL 및 통계 업데이트)
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    item.lastAccess = Date.now();
    this.hits++;
    return item.value as T;
  }

  /**
   * 캐시에서 키 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 캐시 전체 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 키 존재 여부 확인 (TTL 체크 포함)
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 현재 캐시 크기 반환
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 성능 통계 반환
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      size: this.cache.size,
    };
  }

  /**
   * 만료된 캐시 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
}
