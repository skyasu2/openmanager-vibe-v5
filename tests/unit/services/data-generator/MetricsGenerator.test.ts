import { MetricsGenerator } from '@/services/data-generator/modules/MetricsGenerator';
import { REALISTIC_SERVER_TYPES } from '@/services/data-generator/modules/config';
import { beforeEach, describe, expect, it } from 'vitest';

describe('MetricsGenerator', () => {
  let generator: MetricsGenerator;

  beforeEach(() => {
    generator = new MetricsGenerator();
  });

  describe('기본 메트릭 생성', () => {
    it('서버 메트릭을 정상적으로 생성해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const metrics = generator.generateServerMetrics(
        'test-server',
        serverType,
        'running'
      );

      expect(metrics).toBeDefined();
      expect(metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu).toBeLessThanOrEqual(100);
      expect(metrics.memory).toBeGreaterThanOrEqual(0);
      expect(metrics.memory).toBeLessThanOrEqual(100);
      expect(metrics.disk).toBeGreaterThanOrEqual(0);
      expect(metrics.disk).toBeLessThanOrEqual(100);
    });

    it('서버 타입별로 특화된 메트릭을 생성해야 함', () => {
      const webServer = REALISTIC_SERVER_TYPES.find(t => t.category === 'web');
      const dbServer = REALISTIC_SERVER_TYPES.find(
        t => t.category === 'database'
      );

      if (webServer && dbServer) {
        const webMetrics = generator.generateServerMetrics('web-01', webServer);
        const dbMetrics = generator.generateServerMetrics('db-01', dbServer);

        // 웹서버는 요청 관련 메트릭을 가져야 함
        expect(webMetrics.requests).toBeDefined();
        expect(webMetrics.activeConnections).toBeDefined();
        expect(webMetrics.responseTime).toBeDefined();

        // 데이터베이스는 연결 관련 메트릭을 가져야 함
        expect(dbMetrics.connections).toBeDefined();
        expect(dbMetrics.queriesPerSecond).toBeDefined();
        expect(dbMetrics.lockWaitTime).toBeDefined();
      }
    });
  });

  describe('상태별 메트릭 조정', () => {
    it('error 상태일 때 높은 메트릭 값을 생성해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const healthyMetrics = generator.generateServerMetrics(
        'test-1',
        serverType,
        'running'
      );
      const errorMetrics = generator.generateServerMetrics(
        'test-2',
        serverType,
        'error'
      );

      // error 상태의 서버는 더 높은 리소스 사용률을 가져야 함
      expect(errorMetrics.cpu).toBeGreaterThan(healthyMetrics.cpu);
      expect(errorMetrics.memory).toBeGreaterThan(healthyMetrics.memory);
    });

    it('warning 상태일 때 중간 수준의 메트릭 값을 생성해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const healthyMetrics = generator.generateServerMetrics(
        'test-1',
        serverType,
        'running'
      );
      const warningMetrics = generator.generateServerMetrics(
        'test-2',
        serverType,
        'warning'
      );
      const errorMetrics = generator.generateServerMetrics(
        'test-3',
        serverType,
        'error'
      );

      // warning 상태는 healthy와 error 사이의 값을 가져야 함
      expect(warningMetrics.cpu).toBeGreaterThan(healthyMetrics.cpu);
      expect(warningMetrics.cpu).toBeLessThan(errorMetrics.cpu);
    });
  });

  describe('트렌드 데이터 관리', () => {
    it('트렌드 데이터를 올바르게 저장해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const serverId = 'trend-test';

      // 여러 번 메트릭 생성
      for (let i = 0; i < 5; i++) {
        generator.generateServerMetrics(serverId, serverType);
      }

      const trendData = generator.getTrendData(serverId);
      expect(trendData).toHaveLength(5);
      expect(trendData.every(value => typeof value === 'number')).toBe(true);
    });

    it('최대 100개 포인트만 유지해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const serverId = 'trend-limit-test';

      // 150개 메트릭 생성 (한계 초과)
      for (let i = 0; i < 150; i++) {
        generator.generateServerMetrics(serverId, serverType);
      }

      const trendData = generator.getTrendData(serverId);
      expect(trendData).toHaveLength(100);
    });
  });

  describe('대시보드 요약 생성', () => {
    it('빈 데이터로도 요약을 생성할 수 있어야 함', () => {
      const emptyServers = new Map();
      const emptyApps = new Map();

      const summary = generator.generateDashboardSummary(
        emptyServers,
        emptyApps
      );

      expect(summary).toBeDefined();
      expect(summary.servers.total).toBe(0);
      expect(summary.applications.total).toBe(0);
      expect(summary.timestamp).toBeGreaterThan(0);
    });
  });

  describe('메트릭 스무딩', () => {
    it('연속된 메트릭 생성 시 부드러운 전환을 제공해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];
      const serverId = 'smooth-test';

      const firstMetrics = generator.generateServerMetrics(
        serverId,
        serverType
      );
      const secondMetrics = generator.generateServerMetrics(
        serverId,
        serverType
      );

      // 두 번째 메트릭은 첫 번째와 완전히 다르지 않아야 함 (스무딩 효과)
      const cpuDiff = Math.abs(secondMetrics.cpu - firstMetrics.cpu);
      expect(cpuDiff).toBeLessThan(50); // 급격한 변화 방지
    });
  });

  describe('메모리 관리', () => {
    it('cleanup 후 모든 데이터가 삭제되어야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];

      // 데이터 생성
      generator.generateServerMetrics('test-1', serverType);
      generator.generateServerMetrics('test-2', serverType);

      // 정리 전 통계 확인
      const statsBefore = generator.getMetricsStats();
      expect(statsBefore.trackedServers).toBe(2);

      // 정리 실행
      generator.cleanup();

      // 정리 후 통계 확인
      const statsAfter = generator.getMetricsStats();
      expect(statsAfter.trackedServers).toBe(0);
      expect(statsAfter.totalDataPoints).toBe(0);
    });

    it('메트릭 통계 정보를 올바르게 제공해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];

      generator.generateServerMetrics('stats-test-1', serverType);
      generator.generateServerMetrics('stats-test-2', serverType);
      generator.generateServerMetrics('stats-test-1', serverType); // 두 번째 포인트

      const stats = generator.getMetricsStats();

      expect(stats.trackedServers).toBe(2);
      expect(stats.totalDataPoints).toBe(3); // test-1: 2개, test-2: 1개
      expect(stats.memoryUsage).toMatch(/\d+\.\d+KB/);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 서버 ID로도 안전하게 동작해야 함', () => {
      const serverType = REALISTIC_SERVER_TYPES[0];

      expect(() => {
        generator.generateServerMetrics('', serverType);
        generator.generateServerMetrics(null!, serverType);
        generator.generateServerMetrics(undefined!, serverType);
      }).not.toThrow();
    });

    it('존재하지 않는 서버 ID의 트렌드 데이터 요청 시 빈 배열을 반환해야 함', () => {
      const trendData = generator.getTrendData('non-existent-server');
      expect(trendData).toEqual([]);
    });
  });
});
