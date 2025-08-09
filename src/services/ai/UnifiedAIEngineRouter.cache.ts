/**
 * 💾 Unified AI Engine Router - Caching System
 * 
 * High-performance in-memory caching for AI query responses
 * - Cache key generation
 * - TTL-based cache management
 * - LRU eviction policy
 * - Cache size optimization
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';
import type { AIMetadata } from '@/types/ai-service-types';
import { CacheEntry, ResponseCache, ExtendedQueryRequest } from './UnifiedAIEngineRouter.types';

export class UnifiedAIEngineRouterCache {
  private cache: ResponseCache;
  private readonly DEFAULT_TTL = 300000; // 5분
  private readonly MAX_CACHE_SIZE = 200; // 최대 200개 엔트리

  constructor() {
    this.cache = new Map();
  }

  /**
   * 💾 캐시 키 생성
   * 
   * 쿼리, 모드, 컨텍스트, 사용자ID를 조합하여 유니크한 캐시 키 생성
   */
  public generateCacheKey(request: ExtendedQueryRequest): string {
    const keyParts = [
      request.query,
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous'
    ];
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 💾 캐시된 응답 조회
   * 
   * TTL 기반 만료 확인 및 자동 정리
   */
  public getCachedResponse(cacheKey: string): QueryResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // TTL 확인
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // 캐시 히트 메타데이터 추가
    const response = { ...cached.response };
    if (response.metadata) {
      // Extract complexity separately to avoid type conflict
      const { complexity, ...restMetadata } = response.metadata as any;
      response.metadata = {
        ...restMetadata,
        cached: true,
        cacheHit: true,
        cacheTimestamp: cached.timestamp,
      } as AIMetadata;
      // Add complexity back as a separate property
      if (complexity) {
        (response.metadata as any).complexity = complexity;
      }
    } else {
      response.metadata = {
        cached: true,
        cacheHit: true,
        cacheTimestamp: cached.timestamp,
      } as AIMetadata;
    }

    return response;
  }

  /**
   * 💾 응답 캐시 저장
   * 
   * LRU 기반 캐시 크기 관리
   */
  public setCachedResponse(
    cacheKey: string, 
    response: QueryResponse, 
    ttl: number = this.DEFAULT_TTL
  ): void {
    // 응답 복사 (immutable)
    const cachedResponse = { ...response };
    
    // 캐시 메타데이터 제거 (중복 방지)
    if (cachedResponse.metadata) {
      const { cached, cacheHit, cacheTimestamp, ...cleanMetadata } = cachedResponse.metadata as any;
      cachedResponse.metadata = cleanMetadata;
    }

    this.cache.set(cacheKey, {
      response: cachedResponse,
      timestamp: Date.now(),
      ttl,
    });

    // LRU 기반 캐시 크기 제한
    this.enforceMaxCacheSize();
  }

  /**
   * 🧹 캐시 크기 제한 (LRU 정책)
   */
  private enforceMaxCacheSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // 가장 오래된 엔트리 제거 (LRU)
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 🧹 만료된 캐시 엔트리 정리
   */
  public cleanupExpiredEntries(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * 📊 캐시 통계 조회
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    utilization: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(entry => entry.timestamp);

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilization: this.cache.size / this.MAX_CACHE_SIZE,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * 🧹 전체 캐시 클리어
   */
  public clearAll(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * 🎯 특정 패턴의 캐시 삭제
   */
  public clearByPattern(pattern: RegExp): number {
    let removedCount = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      try {
        // Base64 디코딩하여 패턴 매칭
        const decodedKey = Buffer.from(key, 'base64').toString();
        if (pattern.test(decodedKey)) {
          keysToDelete.push(key);
        }
      } catch {
        // Base64 디코딩 실패 시 원본 키로 패턴 매칭
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      removedCount++;
    });

    return removedCount;
  }

  /**
   * 🔄 캐시 워밍업 (미리 자주 사용될 쿼리들을 캐시)
   */
  public async warmupCache(
    commonQueries: string[],
    queryExecutor: (query: string) => Promise<QueryResponse>
  ): Promise<number> {
    let warmedCount = 0;

    for (const query of commonQueries) {
      try {
        const request: QueryRequest = { query };
        const cacheKey = this.generateCacheKey(request);
        
        // 이미 캐시된 경우 스킵
        if (this.cache.has(cacheKey)) continue;

        const response = await queryExecutor(query);
        if (response.success) {
          this.setCachedResponse(cacheKey, response, this.DEFAULT_TTL * 2); // 워밍업 캐시는 더 오래 유지
          warmedCount++;
        }
      } catch (error) {
        console.warn(`⚠️ 캐시 워밍업 실패: ${query}`, error);
      }
    }

    return warmedCount;
  }

  /**
   * 💡 캐시 히트율 계산
   */
  public calculateHitRate(hits: number, misses: number): {
    hitRate: number;
    totalRequests: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;

    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (hitRate >= 80) efficiency = 'excellent';
    else if (hitRate >= 60) efficiency = 'good';
    else if (hitRate >= 40) efficiency = 'fair';
    else efficiency = 'poor';

    return {
      hitRate,
      totalRequests,
      efficiency,
    };
  }

  /**
   * 🕒 TTL 기반 캐시 전략 최적화
   */
  public getOptimalTTL(queryType: 'realtime' | 'analysis' | 'static' | 'user-specific'): number {
    const TTL_STRATEGIES = {
      'realtime': 60000,      // 1분 (실시간 데이터)
      'analysis': 300000,     // 5분 (분석 결과)
      'static': 3600000,      // 1시간 (정적 정보)
      'user-specific': 1800000, // 30분 (사용자별 데이터)
    };

    return TTL_STRATEGIES[queryType] || this.DEFAULT_TTL;
  }
}