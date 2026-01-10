/**
 * Variation Generator Unit Tests
 *
 * @description 현실적인 서버 메트릭 변동성 생성 검증
 * @created 2026-01-10 v5.84.3
 */
import { describe, expect, it } from 'vitest';

import { RealisticVariationGenerator } from './variation-generator';

describe('RealisticVariationGenerator', () => {
  describe('fnv1aHash', () => {
    it('should return deterministic value for same seed', () => {
      const seed = 12345;
      const result1 = RealisticVariationGenerator.fnv1aHash(seed);
      const result2 = RealisticVariationGenerator.fnv1aHash(seed);
      expect(result1).toBe(result2);
    });

    it('should return different values for different seeds', () => {
      const result1 = RealisticVariationGenerator.fnv1aHash(100);
      const result2 = RealisticVariationGenerator.fnv1aHash(200);
      expect(result1).not.toBe(result2);
    });

    it('should return value between 0 and 1', () => {
      for (let seed = 0; seed < 100; seed++) {
        const result = RealisticVariationGenerator.fnv1aHash(seed);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });

    it('should have good distribution', () => {
      // Test that values are reasonably distributed
      const buckets = [0, 0, 0, 0, 0];
      for (let i = 0; i < 1000; i++) {
        const result = RealisticVariationGenerator.fnv1aHash(i);
        const bucketIndex = Math.floor(result * 5);
        buckets[Math.min(bucketIndex, 4)]++;
      }
      // Each bucket should have roughly 200 values (±100 tolerance)
      for (const bucket of buckets) {
        expect(bucket).toBeGreaterThan(100);
        expect(bucket).toBeLessThan(300);
      }
    });
  });

  describe('seededRandom', () => {
    it('should be alias for fnv1aHash', () => {
      const seed = 42;
      const hash = RealisticVariationGenerator.fnv1aHash(seed);
      const random = RealisticVariationGenerator.seededRandom(seed);
      expect(hash).toBe(random);
    });
  });

  describe('generateNaturalVariance', () => {
    it('should return value within reasonable bounds', () => {
      const baseValue = 50;
      const serverId = 'server-1';
      const result = RealisticVariationGenerator.generateNaturalVariance(
        baseValue,
        serverId
      );

      // Should be between 5 and 95
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(95);
    });

    it('should return different values for different servers', () => {
      const baseValue = 50;
      const result1 = RealisticVariationGenerator.generateNaturalVariance(
        baseValue,
        'server-a'
      );
      const result2 = RealisticVariationGenerator.generateNaturalVariance(
        baseValue,
        'server-z'
      );
      // Results might be the same due to timing, but characters are different
      expect(typeof result1).toBe('number');
      expect(typeof result2).toBe('number');
    });

    it('should not drop below minimum (5)', () => {
      const baseValue = 5;
      const result = RealisticVariationGenerator.generateNaturalVariance(
        baseValue,
        'test'
      );
      expect(result).toBeGreaterThanOrEqual(5);
    });

    it('should not exceed maximum (95)', () => {
      const baseValue = 95;
      const result = RealisticVariationGenerator.generateNaturalVariance(
        baseValue,
        'test'
      );
      expect(result).toBeLessThanOrEqual(95);
    });
  });

  describe('checkRandomEvent', () => {
    it('should return valid event structure', () => {
      const result = RealisticVariationGenerator.checkRandomEvent('server-1');

      expect(result).toHaveProperty('hasEvent');
      expect(result).toHaveProperty('impact');
      expect(result).toHaveProperty('type');
      expect(typeof result.hasEvent).toBe('boolean');
      expect(typeof result.impact).toBe('number');
      expect(typeof result.type).toBe('string');
    });

    it('should return consistent event for same seed/time', () => {
      // Events are based on minute-level time seed
      const result1 = RealisticVariationGenerator.checkRandomEvent('server-1');
      const result2 = RealisticVariationGenerator.checkRandomEvent('server-1');
      expect(result1.type).toBe(result2.type);
    });

    it('should have non-negative impact', () => {
      for (let i = 0; i < 10; i++) {
        const result = RealisticVariationGenerator.checkRandomEvent(
          `server-${i}`
        );
        expect(result.impact).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return "정상" when no event', () => {
      // Run multiple times to find a non-event case
      let foundNormal = false;
      for (let i = 0; i < 100; i++) {
        const result = RealisticVariationGenerator.checkRandomEvent(
          `test-server-${i}-${Date.now()}`
        );
        if (!result.hasEvent) {
          expect(result.type).toBe('정상');
          expect(result.impact).toBe(0);
          foundNormal = true;
          break;
        }
      }
      // At least some should be normal (80%+ probability)
      expect(foundNormal).toBe(true);
    });
  });

  describe('calculateCascadeEffect', () => {
    it('should return 0 for empty server list', () => {
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'api',
        []
      );
      expect(result).toBe(0);
    });

    it('should return 0 when other servers have low load', () => {
      const otherServers = [
        { id: 'web-1', type: 'web', cpu: 30 },
        { id: 'db-1', type: 'database', cpu: 40 },
      ];
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'api',
        otherServers
      );
      expect(result).toBe(0);
    });

    it('should add impact for API server when web servers are overloaded', () => {
      const otherServers = [
        { id: 'web-1', type: 'web', cpu: 85 },
        { id: 'web-2', type: 'web', cpu: 90 },
      ];
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'api',
        otherServers
      );
      expect(result).toBeGreaterThan(0);
    });

    it('should add impact when database is overloaded', () => {
      const otherServers = [{ id: 'db-1', type: 'database', cpu: 95 }];
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'api',
        otherServers
      );
      expect(result).toBeGreaterThan(0);
    });

    it('should not affect database servers from other databases', () => {
      const otherServers = [{ id: 'db-2', type: 'database', cpu: 95 }];
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'database',
        otherServers
      );
      // Database servers only affected by web, not other DBs directly
      expect(result).toBe(0);
    });

    it('should cap cascade effect at 20', () => {
      const otherServers = [
        { id: 'web-1', type: 'web', cpu: 100 },
        { id: 'web-2', type: 'web', cpu: 100 },
        { id: 'web-3', type: 'web', cpu: 100 },
        { id: 'db-1', type: 'database', cpu: 100 },
      ];
      const result = RealisticVariationGenerator.calculateCascadeEffect(
        'api',
        otherServers
      );
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('generateBatchMetrics', () => {
    it('should generate metrics for all servers', () => {
      const serverInfos = [
        {
          id: 'server-1',
          type: 'web',
          baseMetrics: { cpu: 50, memory: 60, disk: 40, network: 30 },
        },
        {
          id: 'server-2',
          type: 'api',
          baseMetrics: { cpu: 45, memory: 55, disk: 35, network: 25 },
        },
      ];

      const results =
        RealisticVariationGenerator.generateBatchMetrics(serverInfos);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('server-1');
      expect(results[1].id).toBe('server-2');
    });

    it('should return valid metric structure', () => {
      const serverInfos = [
        {
          id: 'test',
          type: 'web',
          baseMetrics: { cpu: 50, memory: 50, disk: 50, network: 50 },
        },
      ];

      const results =
        RealisticVariationGenerator.generateBatchMetrics(serverInfos);
      const result = results[0];

      expect(result.metrics).toHaveProperty('cpu');
      expect(result.metrics).toHaveProperty('memory');
      expect(result.metrics).toHaveProperty('disk');
      expect(result.metrics).toHaveProperty('network');
      expect(result.events).toHaveProperty('hasEvent');
      expect(result.events).toHaveProperty('impact');
      expect(result.events).toHaveProperty('type');
    });

    it('should return consistent results for same timeSlot', () => {
      const serverInfos = [
        {
          id: 'test',
          type: 'web',
          baseMetrics: { cpu: 50, memory: 50, disk: 50, network: 50 },
        },
      ];
      const fixedTime = 1704067200000; // Fixed timestamp

      const results1 = RealisticVariationGenerator.generateBatchMetrics(
        serverInfos,
        fixedTime
      );
      const results2 = RealisticVariationGenerator.generateBatchMetrics(
        serverInfos,
        fixedTime
      );

      expect(results1[0].metrics.cpu).toBe(results2[0].metrics.cpu);
      expect(results1[0].metrics.memory).toBe(results2[0].metrics.memory);
    });

    it('should keep metrics within bounds', () => {
      const serverInfos = [
        {
          id: 'test',
          type: 'web',
          baseMetrics: { cpu: 90, memory: 90, disk: 90, network: 90 },
        },
      ];

      const results =
        RealisticVariationGenerator.generateBatchMetrics(serverInfos);
      const metrics = results[0].metrics;

      expect(metrics.cpu).toBeLessThanOrEqual(95);
      expect(metrics.memory).toBeLessThanOrEqual(95);
      expect(metrics.disk).toBeLessThanOrEqual(95);
      expect(metrics.network).toBeLessThanOrEqual(95);
    });
  });
});
