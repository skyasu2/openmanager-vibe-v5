/**
 * AI Cache Manager
 *
 * AI 응답 캐싱 관리
 * - TTL 기반 캐시 만료
 * - 캐시 키 생성 및 관리
 * - 메모리 효율적 캐시 크기 제한
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryRequest, QueryResponse } from '../SimplifiedQueryEngine';

interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheConfig {
  enableCache: boolean;
  defaultTTL: number; // milliseconds
  maxCacheSize: number;
  cacheKeyPrefix: string;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export class AICacheManager {
  private cache: Map<string, CacheEntry>;
  private stats: Omit<CacheStats, 'size' | 'hitRate'>;

  constructor(private config: CacheConfig) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * 캐시 키 생성
   */
  generateKey(request: QueryRequest & { userId?: string }): string {
    const keyParts = [
      this.config.cacheKeyPrefix,
      request.query.toLowerCase().trim(),
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous',
    ];

    // Base64 인코딩으로 안전한 키 생성
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 캐시에서 응답 조회
   */
  get(key: string): QueryResponse | null {
    if (!this.config.enableCache) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // 캐시 히트
    entry.hits++;
    this.stats.hits++;

    // 캐시된 응답에 메타데이터 추가 (타입 안전성을 위해 cacheHit만 설정)
    const metadata = {
      ...entry.response.metadata,
      cacheHit: true,
    } as typeof entry.response.metadata;

    return {
      ...entry.response,
      metadata,
    };
  }

  /**
   * 응답 캐시 저장
   */
  set(key: string, response: QueryResponse, ttl?: number): void {
    if (!this.config.enableCache) {
      return;
    }

    // 실패한 응답은 캐시하지 않음
    if (!response.success) {
      return;
    }

    const entry: CacheEntry = {
      response: this.deepClone(response),
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
    };

    // 캐시 크기 제한 확인
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * 특정 키 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ 캐시 초기화 완료 (${previousSize}개 항목 제거)`);
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 만료된 엔트리 정리
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 만료된 캐시 ${removed}개 정리 완료`);
    }

    return removed;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 캐시 비활성화 시 초기화
    if (!this.config.enableCache) {
      this.clear();
    }
  }

  /**
   * 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  // === Private Methods ===

  /**
   * 가장 오래된 엔트리 제거 (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      const lastAccess = entry.timestamp + entry.hits * 60000; // 히트마다 1분 보너스
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * 응답 객체 깊은 복사
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
