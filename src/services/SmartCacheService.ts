/**
 * 🚀 Smart Cache Service
 * 
 * 고성능 스마트 캐싱 시스템
 * - LRU, LFU, FIFO 전략 지원
 * - 자동 TTL 관리
 * - 메모리 사용량 최적화
 * - 캐시 히트율 분석
 * - 압축 및 직렬화 지원
 */

import { ICacheService, ILogger } from '@/interfaces/services';

export interface CacheEntry<T = any> {
  value: T;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  ttl?: number;
  compressed?: boolean;
  size: number;
}

export interface ExtendedCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  evictions: number;
  compressionRatio: number;
}

export type EvictionStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl';

export interface SmartCacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  evictionStrategy?: EvictionStrategy;
  enableCompression?: boolean;
  compressionThreshold?: number;
  enableStats?: boolean;
  cleanupInterval?: number;
}

export class SmartCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // LRU 추적
  private insertOrder: string[] = []; // FIFO 추적
  private cacheStats: ExtendedCacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  
  private readonly options: Required<SmartCacheOptions>;

  constructor(
    private logger: ILogger,
    options: SmartCacheOptions = {}
  ) {
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTtl: options.defaultTtl || 300000, // 5분
      evictionStrategy: options.evictionStrategy || 'lru',
      enableCompression: options.enableCompression || true,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      enableStats: options.enableStats || true,
      cleanupInterval: options.cleanupInterval || 60000 // 1분
    };

    this.cacheStats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0,
      evictions: 0,
      compressionRatio: 0
    };

    this.startCleanupTimer();
    this.logger.info('Smart Cache Service initialized', {
      maxSize: this.options.maxSize,
      strategy: this.options.evictionStrategy,
      compression: this.options.enableCompression
    });
  }

  /**
   * 캐시에서 값 조회
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    // TTL 확인
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromOrders(key);
      this.recordMiss();
      return null;
    }

    // 액세스 정보 업데이트
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.updateAccessOrder(key);

    this.recordHit();
    
    // 압축 해제
    let value: any = entry.value;
    if (entry.compressed && typeof entry.value === 'string') {
      value = this.decompress(entry.value);
    }
    
    this.logger.debug(`Cache hit for key: ${key}`, {
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp.getTime()
    });

    return value as T;
  }

  /**
   * 캐시에 값 저장
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // 기존 엔트리 제거
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.removeFromOrders(key);
    }

    // 캐시 크기 확인 및 정리
    await this.ensureCapacity();

    // 값 압축 (필요한 경우)
    const serialized = JSON.stringify(value);
    const shouldCompress = this.options.enableCompression && 
                          serialized.length > this.options.compressionThreshold;
    
    const finalValue: any = shouldCompress ? this.compress(serialized) : value;
    const size = this.calculateSize(finalValue);

    // 엔트리 생성
    const entry: CacheEntry = {
      value: finalValue,
      timestamp: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      ttl: ttl || this.options.defaultTtl,
      compressed: shouldCompress,
      size
    };

    // 캐시에 저장
    this.cache.set(key, entry);
    this.insertOrder.push(key);
    this.updateAccessOrder(key);

    // 통계 업데이트
    this.updateCacheStats();

    this.logger.debug(`Cache set for key: ${key}`, {
      size,
      compressed: shouldCompress,
      ttl: entry.ttl
    });
  }

  /**
   * 캐시에서 키 삭제
   */
  async delete(key: string): Promise<void> {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.removeFromOrders(key);
      this.updateCacheStats();
      
      this.logger.debug(`Cache deleted key: ${key}`);
    }
  }

  /**
   * 캐시 전체 삭제
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.insertOrder = [];
    this.resetCacheStats();
    
    this.logger.info('Cache cleared');
  }

  /**
   * 키 존재 여부 확인
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromOrders(key);
      return false;
    }
    
    return true;
  }

  /**
   * 패턴으로 키 검색
   */
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) return allKeys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  /**
   * 캐시 크기 조회
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * 캐시 통계 조회 (ICacheService 인터페이스 구현)
   */
  async stats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  }> {
    this.updateCacheStats();
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: this.cacheStats.hitRate,
      size: this.cacheStats.size,
      maxSize: this.cacheStats.maxSize
    };
  }

  /**
   * 확장된 캐시 통계 조회
   */
  async getExtendedStats(): Promise<ExtendedCacheStats> {
    this.updateCacheStats();
    return { ...this.cacheStats };
  }

  /**
   * 캐시 용량 확보
   */
  private async ensureCapacity(): Promise<void> {
    while (this.cache.size >= this.options.maxSize) {
      const keyToEvict = this.selectEvictionKey();
      if (keyToEvict) {
        this.cache.delete(keyToEvict);
        this.removeFromOrders(keyToEvict);
        this.cacheStats.evictions++;
        
        this.logger.debug(`Evicted key: ${keyToEvict}`, {
          strategy: this.options.evictionStrategy,
          cacheSize: this.cache.size
        });
      } else {
        break;
      }
    }
  }

  /**
   * 제거할 키 선택 (전략에 따라)
   */
  private selectEvictionKey(): string | null {
    if (this.cache.size === 0) return null;

    switch (this.options.evictionStrategy) {
      case 'lru':
        return this.accessOrder[0] || null;
      
      case 'lfu':
        return this.findLeastFrequentlyUsed();
      
      case 'fifo':
        return this.insertOrder[0] || null;
      
      case 'ttl':
        return this.findEarliestExpiring();
      
      default:
        return this.accessOrder[0] || null;
    }
  }

  /**
   * 가장 적게 사용된 키 찾기 (LFU)
   */
  private findLeastFrequentlyUsed(): string | null {
    let minAccessCount = Infinity;
    let leastUsedKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  /**
   * 가장 빨리 만료되는 키 찾기 (TTL)
   */
  private findEarliestExpiring(): string | null {
    let earliestExpiry = Infinity;
    let earliestKey: string | null = null;

    for (const [key, entry] of this.cache) {
      const expiryTime = entry.timestamp.getTime() + (entry.ttl || 0);
      if (expiryTime < earliestExpiry) {
        earliestExpiry = expiryTime;
        earliestKey = key;
      }
    }

    return earliestKey;
  }

  /**
   * 액세스 순서 업데이트 (LRU)
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 순서 배열에서 키 제거
   */
  private removeFromOrders(key: string): void {
    const accessIndex = this.accessOrder.indexOf(key);
    if (accessIndex > -1) {
      this.accessOrder.splice(accessIndex, 1);
    }

    const insertIndex = this.insertOrder.indexOf(key);
    if (insertIndex > -1) {
      this.insertOrder.splice(insertIndex, 1);
    }
  }

  /**
   * 만료 여부 확인
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp.getTime() > entry.ttl;
  }

  /**
   * 값 압축
   */
  private compress(value: string): string {
    // 간단한 압축 시뮬레이션 (실제로는 gzip 등 사용)
    try {
      return btoa(value);
    } catch {
      return value;
    }
  }

  /**
   * 값 압축 해제
   */
  private decompress(value: string): any {
    try {
      const decompressed = atob(value);
      return JSON.parse(decompressed);
    } catch {
      return value;
    }
  }

  /**
   * 크기 계산
   */
  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  /**
   * 히트 기록
   */
  private recordHit(): void {
    if (this.options.enableStats) {
      this.cacheStats.hits++;
      this.updateHitRate();
    }
  }

  /**
   * 미스 기록
   */
  private recordMiss(): void {
    if (this.options.enableStats) {
      this.cacheStats.misses++;
      this.updateHitRate();
    }
  }

  /**
   * 히트율 업데이트
   */
  private updateHitRate(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
  }

  /**
   * 통계 업데이트
   */
  private updateCacheStats(): void {
    if (!this.options.enableStats) return;

    this.cacheStats.size = this.cache.size;
    
    // 메모리 사용량 계산
    let totalSize = 0;
    let compressedSize = 0;
    let originalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      if (entry.compressed) {
        compressedSize += entry.size;
        // 원본 크기 추정
        originalSize += entry.size * 2; // 압축률 50% 가정
      } else {
        originalSize += entry.size;
      }
    }

    this.cacheStats.memoryUsage = totalSize;
    this.cacheStats.compressionRatio = originalSize > 0 ? compressedSize / originalSize : 0;
  }

  /**
   * 통계 초기화
   */
  private resetCacheStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0,
      evictions: 0,
      compressionRatio: 0
    };
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * 만료된 엔트리 정리
   */
  private performCleanup(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.removeFromOrders(key);
    }

    if (expiredKeys.length > 0) {
      this.updateCacheStats();
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * 캐시 분석 리포트
   */
  getAnalysisReport(): {
    performance: {
      hitRate: number;
      averageAccessCount: number;
      memoryEfficiency: number;
    };
    distribution: {
      byAccessCount: Record<string, number>;
      byAge: Record<string, number>;
      bySize: Record<string, number>;
    };
    recommendations: string[];
  } {
    const entries = Array.from(this.cache.values());
    
    // 성능 분석
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const averageAccessCount = entries.length > 0 ? totalAccess / entries.length : 0;
    const memoryEfficiency = this.cacheStats.compressionRatio;

    // 분포 분석
    const accessDistribution: Record<string, number> = {};
    const ageDistribution: Record<string, number> = {};
    const sizeDistribution: Record<string, number> = {};

    const now = Date.now();
    
    entries.forEach(entry => {
      // 액세스 횟수 분포
      const accessRange = entry.accessCount < 5 ? 'low' : 
                         entry.accessCount < 20 ? 'medium' : 'high';
      accessDistribution[accessRange] = (accessDistribution[accessRange] || 0) + 1;

      // 나이 분포
      const age = now - entry.timestamp.getTime();
      const ageRange = age < 60000 ? 'fresh' : 
                      age < 300000 ? 'medium' : 'old';
      ageDistribution[ageRange] = (ageDistribution[ageRange] || 0) + 1;

      // 크기 분포
      const sizeRange = entry.size < 1024 ? 'small' : 
                       entry.size < 10240 ? 'medium' : 'large';
      sizeDistribution[sizeRange] = (sizeDistribution[sizeRange] || 0) + 1;
    });

    // 권장사항 생성
    const recommendations: string[] = [];
    
    if (this.cacheStats.hitRate < 0.7) {
      recommendations.push('캐시 히트율이 낮습니다. TTL 설정을 검토하세요.');
    }
    
    if (this.cacheStats.evictions > this.cacheStats.size * 0.1) {
      recommendations.push('제거 횟수가 많습니다. 캐시 크기를 늘리는 것을 고려하세요.');
    }
    
    if (this.cacheStats.compressionRatio < 0.3 && this.options.enableCompression) {
      recommendations.push('압축 효율이 낮습니다. 압축 임계값을 조정하세요.');
    }

    return {
      performance: {
        hitRate: this.cacheStats.hitRate,
        averageAccessCount,
        memoryEfficiency
      },
      distribution: {
        byAccessCount: accessDistribution,
        byAge: ageDistribution,
        bySize: sizeDistribution
      },
      recommendations
    };
  }

  /**
   * 정리
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.cache.clear();
    this.accessOrder = [];
    this.insertOrder = [];
    
    this.logger.info('Smart Cache Service destroyed');
  }
} 