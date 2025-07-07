/**
 * 🧪 TDD - 서버 데이터 수집 주기 분리 테스트
 *
 * @description
 * Test-Driven Development 방식으로 서버 데이터 생성과
 * 수집 주기 분리 기능을 테스트합니다.
 *
 * @features
 * - 백그라운드 스케줄러
 * - 데이터 생성/수집 분리
 * - Redis 기반 캐싱
 * - 최적 간격 계산
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 테스트할 클래스들 (아직 구현되지 않음)
import {
  calculateOptimalCollectionInterval,
  calculateOptimalUpdateInterval,
} from '@/config/serverConfig';
import { ServerDataScheduler } from '@/services/background/ServerDataScheduler';

// Mock Redis
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
  })),
}));

// Mock Server Data Generator
vi.mock('@/services/data-generator/RealServerDataGenerator', () => ({
  RealServerDataGenerator: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      getDashboardSummary: vi.fn(() => ({
        servers: {
          total: 2,
          online: 2,
          running: 2,
          warning: 0,
          offline: 0,
          error: 0,
          avgCpu: 45,
          avgMemory: 60,
          // Mock servers array for compatibility
          data: [
            { id: 'test-1', name: 'Test Server 1' },
            { id: 'test-2', name: 'Test Server 2' },
          ],
        },
        summary: { totalServers: 2, activeServers: 2 },
        timestamp: Date.now(),
      })),
    })),
  },
}));

describe('🧪 TDD - ServerDataScheduler', () => {
  let scheduler: ServerDataScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = ServerDataScheduler.getInstance();
  });

  afterEach(async () => {
    if (scheduler.isRunning()) {
      scheduler.stop();
    }
  });

  describe('🔴 Red - 기본 기능 테스트', () => {
    it('스케줄러 인스턴스를 생성할 수 있어야 함', () => {
      expect(scheduler).toBeDefined();
      expect(scheduler).toBeInstanceOf(ServerDataScheduler);
    });

    it('싱글톤 패턴으로 동작해야 함', () => {
      const instance1 = ServerDataScheduler.getInstance();
      const instance2 = ServerDataScheduler.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('초기 상태는 중지 상태여야 함', () => {
      expect(scheduler.isRunning()).toBe(false);
    });

    it('스케줄러 상태 정보를 반환해야 함', () => {
      const status = scheduler.getStatus();
      expect(status).toMatchObject({
        isRunning: false,
        interval: expect.any(Number),
        lastVersion: expect.any(Number),
        optimization: {
          separatedGeneration: true,
          deltaUpdates: true,
          functionDurationOptimized: true,
          storageBackends: expect.any(Array),
        },
      });
    });
  });

  describe('🔴 Red - 스케줄러 제어 테스트', () => {
    it('스케줄러를 시작할 수 있어야 함', async () => {
      await scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
    });

    it('스케줄러를 중지할 수 있어야 함', async () => {
      await scheduler.start();
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
    });

    it('이미 실행 중인 스케줄러를 다시 시작하면 경고 메시지가 나와야 함', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await scheduler.start();
      await scheduler.start(); // 두 번째 시작

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ 스케줄러가 이미 실행 중입니다.'
      );
    });
  });

  describe('🔴 Red - 데이터 생성 및 저장 테스트', () => {
    it('데이터를 생성하고 저장할 수 있어야 함', async () => {
      await scheduler.generateAndStore();

      const storedData = await scheduler.getStoredData();
      expect(storedData).toBeDefined();
      expect(storedData).toMatchObject({
        servers: expect.any(Array),
        summary: expect.any(Object),
        timestamp: expect.any(String),
        version: expect.any(Number),
        changes: {
          added: expect.any(Array),
          updated: expect.any(Array),
          removed: expect.any(Array),
        },
      });
    });

    it('변경사항을 추적할 수 있어야 함', async () => {
      await scheduler.generateAndStore();
      const changes = await scheduler.getChanges();

      expect(changes).toMatchObject({
        added: expect.any(Array),
        updated: expect.any(Array),
        removed: expect.any(Array),
      });
    });

    it('버전이 증가해야 함', async () => {
      await scheduler.generateAndStore();
      const firstVersion = (await scheduler.getStoredData())?.version || 0;

      await scheduler.generateAndStore();
      const secondVersion = (await scheduler.getStoredData())?.version || 0;

      expect(secondVersion).toBeGreaterThan(firstVersion);
    });
  });

  describe('🔴 Red - 성능 최적화 테스트', () => {
    it('메모리 사용량을 모니터링할 수 있어야 함', () => {
      // Mock process.memoryUsage to avoid actual memory measurements
      const mockMemoryUsage = vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 1024 * 1024 * 50, // 50MB
        heapTotal: 1024 * 1024 * 30, // 30MB
        heapUsed: 1024 * 1024 * 20, // 20MB
        external: 1024 * 1024 * 5, // 5MB
        arrayBuffers: 1024 * 1024 * 2, // 2MB
      });

      const performance = scheduler.getPerformanceMetrics();
      expect(performance).toMatchObject({
        memoryUsage: expect.any(Object),
        cacheStats: expect.any(Object),
        timing: expect.any(Object),
      });

      mockMemoryUsage.mockRestore();
    });

    it('캐시 클리어 기능이 있어야 함', async () => {
      await scheduler.generateAndStore();
      await scheduler.clearCache();

      const storedData = await scheduler.getStoredData();
      expect(storedData).toBeNull();
    });
  });
});

describe('🧪 TDD - 최적 간격 계산 함수', () => {
  describe('🔴 Red - calculateOptimalUpdateInterval', () => {
    it('업데이트 간격을 계산해야 함', () => {
      const interval = calculateOptimalUpdateInterval();
      expect(interval).toBeGreaterThan(0);
      expect(interval).toBeLessThanOrEqual(50000); // 50초 이하
    });
  });

  describe('🔴 Red - calculateOptimalCollectionInterval', () => {
    it('수집 간격을 계산해야 함', () => {
      const updateInterval = 33000; // 33초
      const collectionInterval = calculateOptimalCollectionInterval();

      console.log(
        `업데이트 간격: ${updateInterval}ms, 수집 간격: ${collectionInterval}ms`
      );

      // 🚨 무료 티어 최적화: 수집 간격이 5-10분 범위여야 함
      expect(collectionInterval).toBeGreaterThanOrEqual(300000); // 5분
      expect(collectionInterval).toBeLessThanOrEqual(600000); // 10분

      // 수집 간격이 업데이트 간격보다 훨씬 커야 함 (무료 티어 절약)
      expect(collectionInterval).toBeGreaterThan(updateInterval * 5);
    });

    it('수집 간격이 업데이트 간격보다 커야 함', () => {
      const updateInterval = calculateOptimalUpdateInterval();
      const collectionInterval = calculateOptimalCollectionInterval();

      expect(collectionInterval).toBeGreaterThan(updateInterval);
    });
  });
});
