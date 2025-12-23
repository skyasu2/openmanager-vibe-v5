/**
 * Data Cache Layer Unit Tests
 *
 * 테스트 대상:
 * 1. Core cache operations (get, set, getOrCompute)
 * 2. TTL expiration
 * 3. Invalidation (single, by type, clear)
 * 4. High-level methods (getMetrics, getHistoricalContext, getAnalysis)
 * 5. Statistics and debugging
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  DataCacheLayer,
  DEFAULT_CACHE_CONFIG,
  getDataCache,
  resetDataCache,
} from './cache-layer';

describe('DataCacheLayer', () => {
  let cache: DataCacheLayer;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new DataCacheLayer();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetDataCache();
  });

  // ============================================================================
  // 1. Core Cache Operations
  // ============================================================================
  describe('Core Operations', () => {
    describe('set and get', () => {
      it('should store and retrieve values', () => {
        cache.set('metrics', 'server-01', { cpu: 45, memory: 60 });

        const result = cache.get('metrics', 'server-01');

        expect(result).toEqual({ cpu: 45, memory: 60 });
      });

      it('should return null for non-existent keys', () => {
        const result = cache.get('metrics', 'non-existent');

        expect(result).toBeNull();
      });

      it('should overwrite existing values', () => {
        cache.set('metrics', 'server-01', { cpu: 45 });
        cache.set('metrics', 'server-01', { cpu: 75 });

        const result = cache.get<{ cpu: number }>('metrics', 'server-01');

        expect(result?.cpu).toBe(75);
      });

      it('should handle different cache types', () => {
        cache.set('metrics', 'key1', 'metrics-value');
        cache.set('rag', 'key1', 'rag-value');
        cache.set('analysis', 'key1', 'analysis-value');

        expect(cache.get('metrics', 'key1')).toBe('metrics-value');
        expect(cache.get('rag', 'key1')).toBe('rag-value');
        expect(cache.get('analysis', 'key1')).toBe('analysis-value');
      });
    });

    describe('getOrCompute', () => {
      it('should return cached value if exists', async () => {
        cache.set('metrics', 'server-01', { cpu: 45 });
        const computeFn = vi.fn().mockResolvedValue({ cpu: 99 });

        const result = await cache.getOrCompute('metrics', 'server-01', computeFn);

        expect(result).toEqual({ cpu: 45 });
        expect(computeFn).not.toHaveBeenCalled();
      });

      it('should compute and cache if not exists', async () => {
        const computeFn = vi.fn().mockResolvedValue({ cpu: 99 });

        const result = await cache.getOrCompute('metrics', 'new-key', computeFn);

        expect(result).toEqual({ cpu: 99 });
        expect(computeFn).toHaveBeenCalledTimes(1);

        // Should be cached now
        const secondResult = await cache.getOrCompute(
          'metrics',
          'new-key',
          computeFn
        );
        expect(secondResult).toEqual({ cpu: 99 });
        expect(computeFn).toHaveBeenCalledTimes(1); // Not called again
      });
    });
  });

  // ============================================================================
  // 2. TTL Expiration
  // ============================================================================
  describe('TTL Expiration', () => {
    it('should expire metrics after 1 minute', () => {
      cache.set('metrics', 'server-01', { cpu: 45 });

      expect(cache.get('metrics', 'server-01')).not.toBeNull();

      // Advance 59 seconds (still valid)
      vi.advanceTimersByTime(59_000);
      expect(cache.get('metrics', 'server-01')).not.toBeNull();

      // Advance past 1 minute
      vi.advanceTimersByTime(2_000);
      expect(cache.get('metrics', 'server-01')).toBeNull();
    });

    it('should expire RAG data after 5 minutes', () => {
      cache.set('rag', 'query-hash', { results: [] });

      expect(cache.get('rag', 'query-hash')).not.toBeNull();

      // Advance 4 minutes (still valid)
      vi.advanceTimersByTime(4 * 60_000);
      expect(cache.get('rag', 'query-hash')).not.toBeNull();

      // Advance past 5 minutes
      vi.advanceTimersByTime(2 * 60_000);
      expect(cache.get('rag', 'query-hash')).toBeNull();
    });

    it('should expire analysis after 10 minutes', () => {
      cache.set('analysis', 'trend-123', { trend: 'up' });

      expect(cache.get('analysis', 'trend-123')).not.toBeNull();

      // Advance 9 minutes (still valid)
      vi.advanceTimersByTime(9 * 60_000);
      expect(cache.get('analysis', 'trend-123')).not.toBeNull();

      // Advance past 10 minutes
      vi.advanceTimersByTime(2 * 60_000);
      expect(cache.get('analysis', 'trend-123')).toBeNull();
    });

    it('should track miss count for expired entries', () => {
      cache.set('metrics', 'server-01', { cpu: 45 });

      cache.get('metrics', 'server-01'); // hit
      vi.advanceTimersByTime(61_000);
      cache.get('metrics', 'server-01'); // miss (expired)

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
    });
  });

  // ============================================================================
  // 3. Invalidation
  // ============================================================================
  describe('Invalidation', () => {
    it('should invalidate specific entry', () => {
      cache.set('metrics', 'server-01', { cpu: 45 });
      cache.set('metrics', 'server-02', { cpu: 60 });

      const deleted = cache.invalidate('metrics', 'server-01');

      expect(deleted).toBe(true);
      expect(cache.get('metrics', 'server-01')).toBeNull();
      expect(cache.get('metrics', 'server-02')).not.toBeNull();
    });

    it('should return false when invalidating non-existent entry', () => {
      const deleted = cache.invalidate('metrics', 'non-existent');

      expect(deleted).toBe(false);
    });

    it('should invalidate all entries of a type', () => {
      cache.set('metrics', 'server-01', { cpu: 45 });
      cache.set('metrics', 'server-02', { cpu: 60 });
      cache.set('rag', 'query-1', { results: [] });

      const count = cache.invalidateByType('metrics');

      expect(count).toBe(2);
      expect(cache.get('metrics', 'server-01')).toBeNull();
      expect(cache.get('metrics', 'server-02')).toBeNull();
      expect(cache.get('rag', 'query-1')).not.toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('metrics', 'server-01', { cpu: 45 });
      cache.set('rag', 'query-1', { results: [] });
      cache.set('analysis', 'trend-1', { trend: 'up' });

      cache.clear();

      expect(cache.get('metrics', 'server-01')).toBeNull();
      expect(cache.get('rag', 'query-1')).toBeNull();
      expect(cache.get('analysis', 'trend-1')).toBeNull();

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  // ============================================================================
  // 4. High-Level Methods
  // ============================================================================
  describe('High-Level Methods', () => {
    describe('getMetrics', () => {
      it('should cache metrics with correct TTL', async () => {
        const fetcher = vi.fn().mockResolvedValue({ cpu: 50 });

        await cache.getMetrics('server-01', fetcher);
        await cache.getMetrics('server-01', fetcher);

        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      it('should use "all" as identifier when serverId is undefined', async () => {
        const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);

        await cache.getMetrics(undefined, fetcher);

        expect(cache.get('metrics', 'all')).toEqual([{ id: 1 }]);
      });
    });

    describe('getHistoricalContext', () => {
      it('should cache RAG results with correct TTL', async () => {
        const fetcher = vi.fn().mockResolvedValue({ docs: [] });

        await cache.getHistoricalContext('test query', fetcher);
        await cache.getHistoricalContext('test query', fetcher);

        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      it('should differentiate by query hash', async () => {
        const fetcher1 = vi.fn().mockResolvedValue({ query: 'first' });
        const fetcher2 = vi.fn().mockResolvedValue({ query: 'second' });

        await cache.getHistoricalContext('query-1', fetcher1);
        await cache.getHistoricalContext('query-2', fetcher2);

        expect(fetcher1).toHaveBeenCalledTimes(1);
        expect(fetcher2).toHaveBeenCalledTimes(1);
      });
    });

    describe('getAnalysis', () => {
      it('should cache analysis results', async () => {
        const analyzer = vi.fn().mockResolvedValue({ result: 'analyzed' });

        await cache.getAnalysis('anomaly', { serverId: '01' }, analyzer);
        await cache.getAnalysis('anomaly', { serverId: '01' }, analyzer);

        expect(analyzer).toHaveBeenCalledTimes(1);
      });

      it('should differentiate by analysis type and params', async () => {
        const analyzer = vi.fn().mockResolvedValue({ type: 'result' });

        await cache.getAnalysis('anomaly', { serverId: '01' }, analyzer);
        await cache.getAnalysis('trend', { serverId: '01' }, analyzer);
        await cache.getAnalysis('anomaly', { serverId: '02' }, analyzer);

        expect(analyzer).toHaveBeenCalledTimes(3);
      });
    });
  });

  // ============================================================================
  // 5. Statistics and Debugging
  // ============================================================================
  describe('Statistics', () => {
    it('should track hit and miss counts', () => {
      cache.set('metrics', 'key1', 'value1');

      cache.get('metrics', 'key1'); // hit
      cache.get('metrics', 'key1'); // hit
      cache.get('metrics', 'key2'); // miss

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('should report entry counts', () => {
      cache.set('metrics', 'key1', 'value1');
      cache.set('rag', 'key2', 'value2');

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
    });

    it('should report oldest and newest entry times', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      cache.set('metrics', 'key1', 'value1');

      vi.advanceTimersByTime(1000);
      cache.set('rag', 'key2', 'value2');

      const stats = cache.getStats();
      expect(stats.oldestEntry).toBe(now);
      expect(stats.newestEntry).toBe(now + 1000);
    });

    it('should return null for oldest/newest when empty', () => {
      const stats = cache.getStats();
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });
  });

  describe('Debug Info', () => {
    it('should report entries by type', () => {
      cache.set('metrics', 'key1', 'value1');
      cache.set('metrics', 'key2', 'value2');
      cache.set('rag', 'key3', 'value3');
      cache.set('analysis', 'key4', 'value4');

      const debugInfo = cache.getDebugInfo();

      expect(debugInfo.entriesByType.metrics).toBe(2);
      expect(debugInfo.entriesByType.rag).toBe(1);
      expect(debugInfo.entriesByType.analysis).toBe(1);
    });

    it('should include config in debug info', () => {
      const debugInfo = cache.getDebugInfo();

      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.config.ttl.metrics).toBe(DEFAULT_CACHE_CONFIG.ttl.metrics);
    });
  });

  // ============================================================================
  // 6. Max Size Enforcement
  // ============================================================================
  describe('Max Size Enforcement', () => {
    it('should enforce max size limit', () => {
      const smallCache = new DataCacheLayer({ maxSize: 3 });

      smallCache.set('metrics', 'key1', 'value1');
      smallCache.set('metrics', 'key2', 'value2');
      smallCache.set('metrics', 'key3', 'value3');

      expect(smallCache.getStats().totalEntries).toBe(3);

      // Adding one more should trigger cleanup
      smallCache.set('metrics', 'key4', 'value4');

      expect(smallCache.getStats().totalEntries).toBeLessThanOrEqual(3);
    });

    it('should evict oldest entries first', () => {
      const smallCache = new DataCacheLayer({ maxSize: 2 });
      const now = Date.now();
      vi.setSystemTime(now);

      smallCache.set('metrics', 'oldest', 'value1');

      vi.advanceTimersByTime(1000);
      smallCache.set('metrics', 'middle', 'value2');

      vi.advanceTimersByTime(1000);
      smallCache.set('metrics', 'newest', 'value3');

      // Oldest should be evicted
      expect(smallCache.get('metrics', 'oldest')).toBeNull();
      expect(smallCache.get('metrics', 'newest')).not.toBeNull();
    });
  });

  // ============================================================================
  // 7. Singleton Pattern
  // ============================================================================
  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      resetDataCache();

      const instance1 = getDataCache();
      const instance2 = getDataCache();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance correctly', () => {
      const instance1 = getDataCache();
      instance1.set('metrics', 'test', 'value');

      resetDataCache();
      const instance2 = getDataCache();

      expect(instance2.get('metrics', 'test')).toBeNull();
    });
  });

  // ============================================================================
  // 8. Custom Configuration
  // ============================================================================
  describe('Custom Configuration', () => {
    it('should accept custom TTL values', () => {
      const customCache = new DataCacheLayer({
        ttl: {
          metrics: 30_000, // 30 seconds
          rag: 120_000, // 2 minutes
          analysis: 300_000, // 5 minutes
        },
      });

      customCache.set('metrics', 'key1', 'value1');

      // Still valid at 29 seconds
      vi.advanceTimersByTime(29_000);
      expect(customCache.get('metrics', 'key1')).not.toBeNull();

      // Expired after 30 seconds
      vi.advanceTimersByTime(2_000);
      expect(customCache.get('metrics', 'key1')).toBeNull();
    });

    it('should accept custom max size', () => {
      const customCache = new DataCacheLayer({ maxSize: 100 });

      const debugInfo = customCache.getDebugInfo();
      expect(debugInfo.config.maxSize).toBe(100);
    });
  });
});
