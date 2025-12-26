/**
 * Hybrid Cache Layer (L1 + L2)
 *
 * 2-Tier caching architecture:
 * - L1: In-memory (DataCacheLayer) - Fast, process-local
 * - L2: Redis (Upstash) - Distributed, persistent
 *
 * Flow:
 * 1. GET: L1 -> L2 -> Compute -> Store both
 * 2. SET: L1 + L2 (write-through)
 * 3. DEL: L1 + L2 (invalidate both)
 *
 * Benefits:
 * - Local speed (L1 hits ~0ms)
 * - Multi-instance consistency (L2)
 * - Graceful degradation (Redis fail -> L1 only)
 */

import { DataCacheLayer, getDataCache, type CacheConfig } from './cache-layer';
import {
  redisGet,
  redisSet,
  redisDel,
  redisDelByPattern,
  isRedisAvailable,
  checkRedisHealth,
} from './redis-client';

// ============================================================================
// 1. Types
// ============================================================================

type CacheType = 'metrics' | 'rag' | 'analysis';

interface HybridCacheStats {
  l1: {
    entries: number;
    hitRate: number;
  };
  l2: {
    available: boolean;
    latencyMs: number | null;
  };
  totalHits: {
    l1: number;
    l2: number;
    miss: number;
  };
}

// ============================================================================
// 2. TTL Configuration (Redis uses seconds)
// ============================================================================

const REDIS_TTL: Record<CacheType, number> = {
  metrics: 60, // 1 minute
  rag: 300, // 5 minutes
  analysis: 600, // 10 minutes
};

// ============================================================================
// 3. Hybrid Cache Layer
// ============================================================================

export class HybridCacheLayer {
  private l1: DataCacheLayer;
  private l1Hits = 0;
  private l2Hits = 0;
  private misses = 0;

  constructor(l1Config?: Partial<CacheConfig>) {
    this.l1 = getDataCache(l1Config);
    console.log('📦 [HybridCache] Initialized (L1: In-Memory, L2: Redis)');
  }

  // ============================================================================
  // 3.1 Core Operations
  // ============================================================================

  /**
   * Get with L1 -> L2 fallback
   */
  async get<T>(type: CacheType, identifier: string): Promise<T | null> {
    const key = `${type}:${identifier}`;

    // L1: Check in-memory first
    const l1Result = this.l1.get<T>(type, identifier);
    if (l1Result !== null) {
      this.l1Hits++;
      return l1Result;
    }

    // L2: Check Redis if available
    if (isRedisAvailable()) {
      try {
        const l2Result = await redisGet<T>(key);
        if (l2Result !== null) {
          this.l2Hits++;
          // Backfill L1 for future local access
          this.l1.set(type, identifier, l2Result);
          return l2Result;
        }
      } catch (e) {
        console.warn(`⚠️ [HybridCache] L2 GET failed for ${key}:`, e);
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Set with write-through (L1 + L2)
   */
  async set<T>(type: CacheType, identifier: string, data: T): Promise<void> {
    const key = `${type}:${identifier}`;

    // L1: Always set in-memory
    this.l1.set(type, identifier, data);

    // L2: Set in Redis if available (non-blocking)
    if (isRedisAvailable()) {
      redisSet(key, data, REDIS_TTL[type]).catch((e) => {
        console.warn(`⚠️ [HybridCache] L2 SET failed for ${key}:`, e);
      });
    }
  }

  /**
   * Get or compute with caching
   */
  async getOrCompute<T>(
    type: CacheType,
    identifier: string,
    compute: () => Promise<T>
  ): Promise<T> {
    // Try get first
    const cached = await this.get<T>(type, identifier);
    if (cached !== null) {
      return cached;
    }

    // Compute and store
    const result = await compute();
    await this.set(type, identifier, result);
    return result;
  }

  /**
   * Invalidate from both layers
   */
  async invalidate(type: CacheType, identifier: string): Promise<void> {
    const key = `${type}:${identifier}`;

    // L1: Invalidate in-memory
    this.l1.invalidate(type, identifier);

    // L2: Invalidate in Redis
    if (isRedisAvailable()) {
      await redisDel(key).catch((e) => {
        console.warn(`⚠️ [HybridCache] L2 DEL failed for ${key}:`, e);
      });
    }
  }

  /**
   * Invalidate all entries of a type
   */
  async invalidateByType(type: CacheType): Promise<number> {
    // L1: Clear in-memory
    const l1Count = this.l1.invalidateByType(type);

    // L2: Clear Redis pattern
    let l2Count = 0;
    if (isRedisAvailable()) {
      l2Count = await redisDelByPattern(`${type}:*`).catch((e) => {
        console.warn(`⚠️ [HybridCache] L2 pattern DEL failed:`, e);
        return 0;
      });
    }

    return Math.max(l1Count, l2Count);
  }

  // ============================================================================
  // 3.2 High-Level Cache Methods (Same API as DataCacheLayer)
  // ============================================================================

  /**
   * Cache metrics data
   */
  async getMetrics<T>(
    serverId: string | undefined,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const identifier = serverId || 'all';
    return this.getOrCompute('metrics', identifier, fetcher);
  }

  /**
   * Cache historical context / RAG results
   */
  async getHistoricalContext<T>(
    query: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const identifier = this.hashQuery(query);
    return this.getOrCompute('rag', identifier, fetcher);
  }

  /**
   * Cache analysis results
   */
  async getAnalysis<T>(
    analysisType: string,
    params: Record<string, unknown>,
    analyzer: () => Promise<T>
  ): Promise<T> {
    const identifier = `${analysisType}:${this.hashParams(params)}`;
    return this.getOrCompute('analysis', identifier, analyzer);
  }

  // ============================================================================
  // 3.3 Utility Methods
  // ============================================================================

  /**
   * Simple hash for query strings
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Hash parameters object
   */
  private hashParams(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}:${JSON.stringify(params[k])}`)
      .join('|');
    return this.hashQuery(sorted);
  }

  /**
   * Get hybrid cache statistics
   */
  async getStats(): Promise<HybridCacheStats> {
    const l1Stats = this.l1.getStats();
    const redisHealth = await checkRedisHealth();

    return {
      l1: {
        entries: l1Stats.totalEntries,
        hitRate: l1Stats.hitRate,
      },
      l2: {
        available: redisHealth.connected,
        latencyMs: redisHealth.latencyMs,
      },
      totalHits: {
        l1: this.l1Hits,
        l2: this.l2Hits,
        miss: this.misses,
      },
    };
  }

  /**
   * Clear all caches (both layers)
   */
  async clear(): Promise<void> {
    this.l1.clear();
    this.l1Hits = 0;
    this.l2Hits = 0;
    this.misses = 0;

    // Note: Redis clear-all is intentionally not included
    // to prevent accidental data loss across instances
    console.log('📦 [HybridCache] L1 cleared, L2 preserved');
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let hybridCacheInstance: HybridCacheLayer | null = null;

/**
 * Get the global hybrid cache instance
 */
export function getHybridCache(config?: Partial<CacheConfig>): HybridCacheLayer {
  if (!hybridCacheInstance) {
    hybridCacheInstance = new HybridCacheLayer(config);
  }
  return hybridCacheInstance;
}

/**
 * Reset the hybrid cache (for testing)
 */
export function resetHybridCache(): void {
  if (hybridCacheInstance) {
    hybridCacheInstance.clear();
    hybridCacheInstance = null;
    console.log('📦 [HybridCache] Reset');
  }
}
