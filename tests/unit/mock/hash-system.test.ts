/**
 * 해시 시스템 테스트 - Mock 데이터 생성 기반
 * 현재 구현: 단순 해시 → 향후 FNV-1a 업그레이드 대비
 */

import { beforeEach, describe, expect, it } from 'vitest';

// 현재 구현된 해시 함수 import
import { hashString } from '../../../src/utils/utils-functions';

// Mock 데이터 생성 관련 import 시뮬레이션
interface MockHashSystem {
  generateDeterministicValue: (seed: string, timestamp: number) => number;
  generateServerMetrics: (serverId: string, timestamp: number) => ServerMetrics;
  validateConsistency: (serverId: string, timestamp: number) => boolean;
}

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number;
  errorRate?: number;
}

// 테스트용 해시 시스템 구현 (FNV-1a 시뮬레이션)
class TestHashSystem implements MockHashSystem {
  private readonly FNV_OFFSET_BASIS = 2166136261;
  private readonly FNV_PRIME = 16777619;

  /**
   * FNV-1a 해시 알고리즘 (32비트)
   */
  private fnv1a(data: string): number {
    let hash = this.FNV_OFFSET_BASIS;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = (hash * this.FNV_PRIME) >>> 0; // 32비트 unsigned
    }
    return hash;
  }

  /**
   * 시드와 타임스탬프로 결정론적 값 생성
   */
  generateDeterministicValue(seed: string, timestamp: number): number {
    const combined = `${seed}_${Math.floor(timestamp / 1000)}`;
    const hash = this.fnv1a(combined);
    return hash / 0xffffffff; // 0-1 정규화
  }

  /**
   * 서버별 메트릭 생성
   */
  generateServerMetrics(serverId: string, timestamp: number): ServerMetrics {
    // 서버별 기본 특성 (해시 기반)
    const serverHash = this.fnv1a(serverId);
    const serverType = serverHash % 10; // 0-9 서버 타입

    // 시간 기반 변동성
    const timeValue = this.generateDeterministicValue(serverId, timestamp);
    const hourOfDay = new Date(timestamp).getHours();

    // 서버 타입별 기본값
    const baseMetrics = this.getBaseMetricsForType(serverType);

    // 시간대별 부하 패턴
    const timeMultiplier = this.getTimeMultiplier(hourOfDay);

    return {
      cpu: Math.max(
        0,
        Math.min(100, baseMetrics.cpu + (timeValue * 30 - 15) * timeMultiplier)
      ),
      memory: Math.max(
        0,
        Math.min(
          100,
          baseMetrics.memory + (timeValue * 20 - 10) * timeMultiplier
        )
      ),
      disk: Math.max(0, Math.min(100, baseMetrics.disk + (timeValue * 10 - 5))),
      network: Math.max(
        0,
        Math.min(
          100,
          baseMetrics.network + (timeValue * 40 - 20) * timeMultiplier
        )
      ),
      responseTime: baseMetrics.responseTime * (1 + timeValue * 2),
      errorRate: Math.max(0, baseMetrics.errorRate + timeValue * 0.5),
    };
  }

  private getBaseMetricsForType(type: number): ServerMetrics {
    const profiles = [
      {
        cpu: 30,
        memory: 40,
        disk: 60,
        network: 20,
        responseTime: 50,
        errorRate: 0.1,
      }, // Web
      {
        cpu: 50,
        memory: 70,
        disk: 80,
        network: 30,
        responseTime: 100,
        errorRate: 0.2,
      }, // DB
      {
        cpu: 60,
        memory: 50,
        disk: 30,
        network: 60,
        responseTime: 30,
        errorRate: 0.05,
      }, // API
      {
        cpu: 25,
        memory: 30,
        disk: 90,
        network: 10,
        responseTime: 200,
        errorRate: 0.01,
      }, // Storage
      {
        cpu: 40,
        memory: 60,
        disk: 50,
        network: 80,
        responseTime: 20,
        errorRate: 0.1,
      }, // Cache
    ];
    return profiles[type % profiles.length];
  }

  private getTimeMultiplier(hour: number): number {
    // 업무 시간 (9-18시) 가중치
    if (hour >= 9 && hour <= 18) return 1.5;
    if (hour >= 19 && hour <= 22) return 1.2;
    return 0.8;
  }

  /**
   * 데이터 일관성 검증
   */
  validateConsistency(serverId: string, timestamp: number): boolean {
    const metrics1 = this.generateServerMetrics(serverId, timestamp);
    const metrics2 = this.generateServerMetrics(serverId, timestamp);

    return (
      metrics1.cpu === metrics2.cpu &&
      metrics1.memory === metrics2.memory &&
      metrics1.disk === metrics2.disk &&
      metrics1.network === metrics2.network
    );
  }
}

describe('Hash System for Mock Data Generation', () => {
  let hashSystem: TestHashSystem;

  beforeEach(() => {
    hashSystem = new TestHashSystem();
  });

  describe('FNV-1a Hash Algorithm', () => {
    it('should generate consistent hash for same input', () => {
      const testString = 'server-001';
      const hash1 = hashSystem.generateDeterministicValue(testString, 1000000);
      const hash2 = hashSystem.generateDeterministicValue(testString, 1000000);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(1);
    });

    it('should generate different hash for different inputs', () => {
      const timestamp = 1000000;
      const hash1 = hashSystem.generateDeterministicValue(
        'server-001',
        timestamp
      );
      const hash2 = hashSystem.generateDeterministicValue(
        'server-002',
        timestamp
      );

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different values for different timestamps', () => {
      const serverId = 'server-001';
      const hash1 = hashSystem.generateDeterministicValue(serverId, 1000000);
      const hash2 = hashSystem.generateDeterministicValue(serverId, 2000000);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Server Metrics Generation', () => {
    it('should generate valid server metrics', () => {
      const serverId = 'web-prd-001';
      const timestamp = Date.now();

      const metrics = hashSystem.generateServerMetrics(serverId, timestamp);

      expect(metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu).toBeLessThanOrEqual(100);
      expect(metrics.memory).toBeGreaterThanOrEqual(0);
      expect(metrics.memory).toBeLessThanOrEqual(100);
      expect(metrics.disk).toBeGreaterThanOrEqual(0);
      expect(metrics.disk).toBeLessThanOrEqual(100);
      expect(metrics.network).toBeGreaterThanOrEqual(0);
      expect(metrics.network).toBeLessThanOrEqual(100);
      expect(metrics.responseTime).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should generate consistent metrics for same server and time', () => {
      const serverId = 'db-main-001';
      const timestamp = 1699000000000;

      const metrics1 = hashSystem.generateServerMetrics(serverId, timestamp);
      const metrics2 = hashSystem.generateServerMetrics(serverId, timestamp);

      expect(metrics1).toEqual(metrics2);
    });

    it('should generate different metrics for different servers', () => {
      const timestamp = 1699000000000;

      const metrics1 = hashSystem.generateServerMetrics('web-001', timestamp);
      const metrics2 = hashSystem.generateServerMetrics('db-001', timestamp);

      expect(metrics1.cpu).not.toBe(metrics2.cpu);
      expect(metrics1.memory).not.toBe(metrics2.memory);
    });

    it('should reflect time-based load patterns', () => {
      const serverId = 'api-prd-001';

      // 업무 시간 (오후 2시)
      const businessHour = new Date('2023-11-01T14:00:00Z').getTime();
      const businessMetrics = hashSystem.generateServerMetrics(
        serverId,
        businessHour
      );

      // 새벽 시간 (오전 3시)
      const nightHour = new Date('2023-11-01T03:00:00Z').getTime();
      const nightMetrics = hashSystem.generateServerMetrics(
        serverId,
        nightHour
      );

      // 업무 시간에 더 높은 부하 패턴 예상 (통계적으로)
      // 개별 케이스는 다를 수 있지만, 평균적으로 차이가 있어야 함
      expect(businessMetrics).not.toEqual(nightMetrics);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain consistency for deterministic generation', () => {
      const serverId = 'cache-001';
      const timestamp = 1699000000000;

      const isConsistent = hashSystem.validateConsistency(serverId, timestamp);
      expect(isConsistent).toBe(true);
    });

    it('should work with multiple server types', () => {
      const timestamp = 1699000000000;
      const serverIds = [
        'web-prd-001',
        'db-main-001',
        'api-gateway-001',
        'cache-redis-001',
        'storage-s3-001',
      ];

      serverIds.forEach((serverId) => {
        const isConsistent = hashSystem.validateConsistency(
          serverId,
          timestamp
        );
        expect(isConsistent).toBe(true);
      });
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should generate realistic server profiles', () => {
      const servers = [
        'web-prd-001',
        'web-prd-002',
        'db-main-001',
        'api-gateway-001',
        'cache-redis-001',
      ];
      const timestamp = Date.now();

      const profiles = servers.map((serverId) => ({
        serverId,
        metrics: hashSystem.generateServerMetrics(serverId, timestamp),
      }));

      // 각 서버가 다른 특성을 가져야 함
      const cpuValues = profiles.map((p) => p.metrics.cpu);
      const uniqueCpuValues = new Set(cpuValues);
      expect(uniqueCpuValues.size).toBeGreaterThan(1);

      // 모든 메트릭이 유효 범위 내에 있어야 함
      profiles.forEach(({ serverId, metrics }) => {
        expect(metrics.cpu, `${serverId} CPU`).toBeGreaterThanOrEqual(0);
        expect(metrics.cpu, `${serverId} CPU`).toBeLessThanOrEqual(100);
        expect(metrics.memory, `${serverId} Memory`).toBeGreaterThanOrEqual(0);
        expect(metrics.memory, `${serverId} Memory`).toBeLessThanOrEqual(100);
      });
    });

    it('should handle 24-hour data generation cycle', () => {
      const serverId = 'web-prd-001';
      const baseTime = new Date('2023-11-01T00:00:00Z').getTime();
      const hoursInDay = 24;

      const dailyMetrics = Array.from({ length: hoursInDay }, (_, hour) => {
        const timestamp = baseTime + hour * 60 * 60 * 1000;
        return {
          hour,
          metrics: hashSystem.generateServerMetrics(serverId, timestamp),
        };
      });

      // 24시간 데이터가 모두 생성되어야 함
      expect(dailyMetrics).toHaveLength(24);

      // 각 시간대별로 다른 값들이 있어야 함 (완전히 동일하지 않아야 함)
      const cpuValues = dailyMetrics.map((d) => d.metrics.cpu);
      const uniqueCount = new Set(cpuValues.map((v) => Math.floor(v))).size;
      expect(uniqueCount).toBeGreaterThan(3); // 최소 4개 이상의 다른 패턴
    });
  });

  describe('Performance Testing', () => {
    it('should generate metrics quickly for high frequency updates', () => {
      const serverId = 'performance-test-001';
      const iterations = 1000;
      const timestamp = Date.now();

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        hashSystem.generateServerMetrics(serverId, timestamp + i * 30000); // 30초 간격
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000회 생성이 100ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent server metric generation', () => {
      const serverIds = Array.from(
        { length: 50 },
        (_, i) => `server-${String(i).padStart(3, '0')}`
      );
      const timestamp = Date.now();

      const startTime = performance.now();

      const results = serverIds.map((serverId) =>
        hashSystem.generateServerMetrics(serverId, timestamp)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 50개 서버 동시 생성이 50ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(50);
      expect(results).toHaveLength(50);

      // 모든 결과가 유효해야 함
      results.forEach((metrics, _index) => {
        expect(metrics.cpu).toBeGreaterThanOrEqual(0);
        expect(metrics.memory).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('현재 시스템 해시 함수 테스트', () => {
  describe('hashString function', () => {
    it('should generate consistent SHA-256 hash', async () => {
      const testString = 'server-001';

      const hash1 = await hashString(testString);
      const hash2 = await hashString(testString);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await hashString('server-001');
      const hash2 = await hashString('server-002');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle edge cases', async () => {
      const emptyHash = await hashString('');
      const spaceHash = await hashString(' ');
      const specialHash = await hashString('server-001!@#$%');

      expect(emptyHash).toBeTruthy();
      expect(spaceHash).toBeTruthy();
      expect(specialHash).toBeTruthy();
      expect(emptyHash).not.toBe(spaceHash);
    });
  });
});
