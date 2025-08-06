/**
 * 💾 Memory Cache Service
 * 
 * VM 환경의 메모리 기반 캐싱 서비스
 * Redis 대신 메모리를 활용한 고속 캐싱
 */

import { v4 as uuidv4 } from 'uuid';

interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number; // milliseconds
  createdAt: Date;
  expiresAt?: Date;
  hits: number;
  lastAccessedAt: Date;
  size: number; // bytes
  tags?: string[];
  metadata?: Record<string, any>;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  avgAccessTime: number;
  memoryUsage: number;
  entriesByTag: Map<string, number>;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry>;
  private hits: number;
  private misses: number;
  private evictions: number;
  private accessTimes: number[];
  private readonly MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
  private readonly MAX_ENTRIES = 10000;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1분

  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.accessTimes = [];
    
    // 주기적으로 만료된 엔트리 정리
    setInterval(() => this.cleanupExpired(), this.CLEANUP_INTERVAL);
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(
    key: string, 
    value: T, 
    options?: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): boolean {
    try {
      // 크기 계산
      const size = this.calculateSize(value);
      
      // 메모리 제한 체크
      if (this.getTotalSize() + size > this.MAX_SIZE_BYTES) {
        this.evictLRU();
      }
      
      // 엔트리 수 제한 체크
      if (this.cache.size >= this.MAX_ENTRIES) {
        this.evictOldest();
      }
      
      const now = new Date();
      const ttl = options?.ttl || this.DEFAULT_TTL;
      
      const entry: CacheEntry<T> = {
        key,
        value,
        ttl,
        createdAt: now,
        expiresAt: ttl ? new Date(now.getTime() + ttl) : undefined,
        hits: 0,
        lastAccessedAt: now,
        size,
        tags: options?.tags,
        metadata: options?.metadata
      };
      
      this.cache.set(key, entry);
      console.log(`💾 Cache set: ${key} (${size} bytes, TTL: ${ttl}ms)`);
      
      return true;
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
      return false;
    }
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const startTime = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // 만료 체크
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    // 히트 처리
    entry.hits++;
    entry.lastAccessedAt = new Date();
    this.hits++;
    
    // 액세스 시간 기록
    const accessTime = Date.now() - startTime;
    this.accessTimes.push(accessTime);
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-1000);
    }
    
    return entry.value;
  }

  /**
   * 패턴으로 캐시 조회
   */
  getByPattern(pattern: string | RegExp): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    this.cache.forEach((entry, key) => {
      if (regex.test(key)) {
        // 만료 체크
        if (!entry.expiresAt || entry.expiresAt >= new Date()) {
          results.push({ key, value: entry.value });
          entry.hits++;
          entry.lastAccessedAt = new Date();
        }
      }
    });
    
    return results;
  }

  /**
   * 태그로 캐시 조회
   */
  getByTags(tags: string[]): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && tags.some(tag => entry.tags!.includes(tag))) {
        // 만료 체크
        if (!entry.expiresAt || entry.expiresAt >= new Date()) {
          results.push({ key, value: entry.value });
          entry.hits++;
          entry.lastAccessedAt = new Date();
        }
      }
    });
    
    return results;
  }

  /**
   * 캐시 키 존재 여부
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // 만료 체크
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 캐시 삭제
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return result;
  }

  /**
   * 패턴으로 캐시 삭제
   */
  deleteByPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;
    
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        if (this.cache.delete(key)) {
          deleted++;
        }
      }
    });
    
    console.log(`🗑️ Deleted ${deleted} cache entries by pattern: ${pattern}`);
    return deleted;
  }

  /**
   * 태그로 캐시 삭제
   */
  deleteByTags(tags: string[]): number {
    let deleted = 0;
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.tags && tags.some(tag => entry.tags!.includes(tag))) {
        if (this.cache.delete(key)) {
          deleted++;
        }
      }
    });
    
    console.log(`🗑️ Deleted ${deleted} cache entries by tags: ${tags.join(', ')}`);
    return deleted;
  }

  /**
   * 전체 캐시 삭제
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.accessTimes = [];
    console.log(`🧹 Cache cleared: ${size} entries removed`);
  }

  /**
   * TTL 갱신
   */
  touch(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const newTtl = ttl || entry.ttl || this.DEFAULT_TTL;
    entry.expiresAt = new Date(Date.now() + newTtl);
    entry.lastAccessedAt = new Date();
    
    return true;
  }

  /**
   * 캐시 통계
   */
  getStats(): CacheStats {
    const totalSize = this.getTotalSize();
    const totalRequests = this.hits + this.misses;
    
    // 태그별 엔트리 수 계산
    const entriesByTag = new Map<string, number>();
    this.cache.forEach(entry => {
      entry.tags?.forEach(tag => {
        entriesByTag.set(tag, (entriesByTag.get(tag) || 0) + 1);
      });
    });
    
    // 평균 액세스 시간
    const avgAccessTime = this.accessTimes.length > 0
      ? this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length
      : 0;
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      evictions: this.evictions,
      avgAccessTime,
      memoryUsage: process.memoryUsage().heapUsed,
      entriesByTag
    };
  }

  /**
   * 캐시 정보 조회
   */
  info(key: string): Omit<CacheEntry, 'value'> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const { value, ...info } = entry;
    return info;
  }

  /**
   * 가장 많이 액세스된 키
   */
  getHotKeys(limit: number = 10): Array<{ key: string; hits: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * 가장 큰 엔트리
   */
  getLargestEntries(limit: number = 10): Array<{ key: string; size: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, size: entry.size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  /**
   * 만료된 엔트리 정리
   */
  private cleanupExpired(): void {
    const now = new Date();
    let cleaned = 0;
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * LRU 방식으로 제거
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = new Date();
    
    this.cache.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
      console.log(`♻️ Evicted LRU: ${oldestKey}`);
    }
  }

  /**
   * 가장 오래된 엔트리 제거
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = new Date();
    
    this.cache.forEach((entry, key) => {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
      console.log(`♻️ Evicted oldest: ${oldestKey}`);
    }
  }

  /**
   * 전체 캐시 크기 계산
   */
  private getTotalSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      total += entry.size;
    });
    return total;
  }

  /**
   * 객체 크기 계산 (대략적)
   */
  private calculateSize(obj: any): number {
    try {
      const str = JSON.stringify(obj);
      return Buffer.byteLength(str, 'utf8');
    } catch {
      // JSON으로 변환할 수 없는 경우 기본값
      return 1024;
    }
  }

  /**
   * 메모리 정리 (GC 트리거)
   */
  cleanup(): void {
    // 만료된 엔트리 정리
    this.cleanupExpired();
    
    // 사용되지 않는 엔트리 정리 (히트가 0인 오래된 엔트리)
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1시간
    let cleaned = 0;
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      const age = now - entry.createdAt.getTime();
      if (entry.hits === 0 && age > maxAge) {
        this.cache.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} unused cache entries`);
    }
    
    // 통계 리셋
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-100);
    }
  }

  /**
   * 캐시 덤프 (디버깅용)
   */
  dump(): Array<{ key: string; size: number; hits: number; age: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      hits: entry.hits,
      age: Math.floor((now - entry.createdAt.getTime()) / 1000)
    }));
  }
}