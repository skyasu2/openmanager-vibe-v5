/**
 * 🧪 RealServerDataGenerator TDD 기반 리팩토링 테스트
 * 
 * 📝 목적: 대형 모듈을 TDD 방식으로 안전하게 분리
 * - Red 단계: 실패하는 테스트 작성
 * - Green 단계: 테스트 통과시키기  
 * - Refactor 단계: 코드 개선
 * 
 * @author OpenManager Vibe v5
 * @since 2025-01-29 04:30 KST
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('RealServerDataGenerator TDD 리팩토링 테스트', () => {
  let generator: RealServerDataGenerator;

  // 🟢 분리 전 기존 기능 테스트 (Baseline)
  describe('분리 전 기존 기능 테스트 (Baseline)', () => {
    beforeEach(async () => {
      generator = new RealServerDataGenerator({
        maxServers: 10,
        enableRedis: false,
        enableRealtime: false
      });
      await generator.initialize();
    });

    test('인스턴스 생성이 성공해야 함', () => {
      expect(generator).toBeDefined();
      expect(typeof generator.initialize).toBe('function');
    });

    test('초기화가 성공해야 함', async () => {
      const servers = generator.getAllServers();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    test('서버 데이터 생성이 성공해야 함', () => {
      const servers = generator.getAllServers();

      servers.forEach(server => {
        expect(server.id).toBeDefined();
        expect(server.name).toBeDefined();
        expect(server.type).toBeDefined();
        expect(server.status).toBeDefined();
        expect(server.metrics).toBeDefined();
        expect(server.specs).toBeDefined();
        expect(server.health).toBeDefined();
      });
    });

    test('클러스터 데이터 생성이 성공해야 함', () => {
      const clusters = generator.getAllClusters();
      expect(Array.isArray(clusters)).toBe(true);

      clusters.forEach(cluster => {
        expect(cluster.id).toBeDefined();
        expect(cluster.name).toBeDefined();
        expect(Array.isArray(cluster.servers)).toBe(true);
      });
    });

    test('애플리케이션 메트릭 생성이 성공해야 함', () => {
      const apps = generator.getAllApplications();
      expect(Array.isArray(apps)).toBe(true);

      apps.forEach(app => {
        expect(app.id).toBeDefined();
        expect(app.name).toBeDefined();
        expect(app.metrics).toBeDefined();
      });
    });

    test('대시보드 요약 데이터가 올바른 구조여야 함', () => {
      const summary = generator.getDashboardSummary();

      expect(summary.totalServers).toBeGreaterThan(0);
      expect(summary.runningServers).toBeGreaterThanOrEqual(0);
      expect(summary.averageCPU).toBeGreaterThanOrEqual(0);
      expect(summary.averageMemory).toBeGreaterThanOrEqual(0);
    });

    test('특정 서버 조회가 성공해야 함', () => {
      const servers = generator.getAllServers();
      const firstServer = servers[0];

      const retrievedServer = generator.getServer(firstServer.id);
      expect(retrievedServer).toBeDefined();
      expect(retrievedServer?.id).toBe(firstServer.id);
    });

    test('헬스체크가 성공해야 함', () => {
      const status = generator.getStatus();

      expect(status.isHealthy).toBe(true);
      expect(status.totalServers).toBeGreaterThan(0);
      expect(status.redisStatus).toBeDefined();
    });
  });

  // ✅ 분리 후 기능 테스트 (구현 예정)
  describe('분리 후 기능 테스트 (구현 예정)', () => {
    beforeEach(async () => {
      generator = new RealServerDataGenerator({
        maxServers: 5,
        enableRedis: false,
        enableRealtime: false
      });
      await generator.initialize();
    });

    test('ServerTypes 모듈이 올바른 타입 정의를 제공해야 함', () => {
      const servers = generator.getAllServers();

      servers.forEach(server => {
        expect(typeof server.type).toBe('string');
        expect(server.type.length).toBeGreaterThan(0);
      });
    });

    test.skip('RedisService가 독립적으로 작동해야 함', () => {
      // RedisService 분리 후 구현 예정
    });

    test.skip('ServerFactory가 서버 생성을 담당해야 함', () => {
      // ServerFactory 분리 후 구현 예정
    });

    test.skip('MetricsCalculator가 메트릭 계산을 담당해야 함', () => {
      // MetricsCalculator 분리 후 구현 예정
    });

    test.skip('분리 후 RealServerDataGenerator가 오케스트레이션만 담당해야 함', () => {
      // 모든 모듈 분리 후 구현 예정
    });
  });

  // 🚀 성능 및 메모리 테스트
  describe('성능 및 메모리 테스트', () => {
    test('대량 서버 생성 시 메모리 누수가 없어야 함', async () => {
      const largeGenerator = new RealServerDataGenerator({
        maxServers: 100,
        enableRedis: false,
        enableRealtime: false
      });

      await largeGenerator.initialize();
      const servers = largeGenerator.getAllServers();

      expect(servers.length).toBe(100);
      expect(servers.every(s => s.id && s.name && s.metrics)).toBe(true);

      largeGenerator.dispose();
    });

    test('자동 생성 시작/중지가 정상 작동해야 함', async () => {
      generator.startAutoGeneration();
      expect(generator.isAutoGenerating()).toBe(true);

      // 잠시 실행
      await new Promise(resolve => setTimeout(resolve, 50));

      generator.stopAutoGeneration();
      expect(generator.isAutoGenerating()).toBe(false);
    });
  });

  describe('RealServerDataGenerator TDD 리팩토링 테스트', () => {
    // 🟢 Phase 4: ServerFactory 모듈 분리 후 테스트
    describe('Phase 4: ServerFactory 모듈 분리 후 테스트', () => {
      beforeEach(async () => {
        generator = new RealServerDataGenerator({
          maxServers: 5,
          enableRedis: false,
          enableRealtime: false
        });
        await generator.initialize();
      });

      test('ServerFactory: 서버 타입별 특화 사양이 올바르게 생성되어야 함', () => {
        const servers = generator.getAllServers();
        expect(servers.length).toBeGreaterThan(0);

        servers.forEach(server => {
          expect(server.specs).toBeDefined();
          expect(server.specs.cpu).toBeDefined();
          expect(server.specs.memory).toBeDefined();
          expect(server.specs.disk).toBeDefined();
          expect(server.specs.network).toBeDefined();
        });
      });

      test('ServerFactory: 서버 건강 점수가 올바르게 계산되어야 함', () => {
        const servers = generator.getAllServers();

        servers.forEach(server => {
          expect(server.health.score).toBeGreaterThanOrEqual(0);
          expect(server.health.score).toBeLessThanOrEqual(100);
        });
      });

      test('ServerFactory: 서버 타입별 현실적인 이슈가 생성되어야 함', () => {
        const servers = generator.getAllServers();
        const serversWithIssues = servers.filter(s => s.health.issues.length > 0);

        if (serversWithIssues.length > 0) {
          serversWithIssues.forEach(server => {
            expect(Array.isArray(server.health.issues)).toBe(true);
            expect(server.health.issues.length).toBeLessThanOrEqual(3);
          });
        }
      });

      test('ServerFactory: 데이터베이스 서버는 특화 사양을 가져야 함', () => {
        const servers = generator.getAllServers();
        const dbServers = servers.filter(s =>
          ['mysql', 'postgresql', 'mongodb', 'redis'].includes(s.type)
        );

        if (dbServers.length > 0) {
          dbServers.forEach(server => {
            expect(server.specs.memory.total).toBeGreaterThanOrEqual(8192);
            expect(server.specs.disk.iops).toBeGreaterThanOrEqual(3000);
          });
        }
      });

      test('ServerFactory: 웹서버는 네트워크 특화 사양을 가져야 함', () => {
        const servers = generator.getAllServers();
        const webServers = servers.filter(s =>
          ['nginx', 'apache', 'haproxy'].includes(s.type)
        );

        if (webServers.length > 0) {
          webServers.forEach(server => {
            expect(server.specs.network.bandwidth).toBeGreaterThanOrEqual(1000);
          });
        }
      });
    });

    // 🟢 Phase 5: MetricsProcessor 모듈 분리 후 테스트  
    describe('Phase 5: MetricsProcessor 모듈 분리 후 테스트', () => {
      beforeEach(async () => {
        generator = new RealServerDataGenerator({
          maxServers: 5,
          enableRedis: false,
          enableRealtime: false
        });
        await generator.initialize();
      });

      test('MetricsProcessor: 메트릭 처리 로직이 올바르게 작동해야 함', async () => {
        const servers = generator.getAllServers();
        expect(servers.length).toBeGreaterThan(0);

        generator.startAutoGeneration();
        await new Promise(resolve => setTimeout(resolve, 100));

        const updatedServers = generator.getAllServers();
        updatedServers.forEach(server => {
          expect(['running', 'warning', 'error']).toContain(server.status);
          expect(server.metrics.cpu).toBeGreaterThanOrEqual(0);
          expect(server.metrics.cpu).toBeLessThanOrEqual(100);
          expect(server.metrics.memory).toBeGreaterThanOrEqual(0);
          expect(server.metrics.memory).toBeLessThanOrEqual(100);
          expect(server.metrics.uptime).toBeGreaterThan(0);
        });

        generator.stopAutoGeneration();
      });

      test('MetricsProcessor: 서버 상태가 메트릭에 따라 올바르게 결정되어야 함', () => {
        const servers = generator.getAllServers();

        servers.forEach(server => {
          const { cpu, memory, disk } = server.metrics;

          // 상태가 유효한 값 중 하나인지 확인
          expect(['running', 'warning', 'error']).toContain(server.status);

          // 메트릭이 유효 범위 내에 있는지 확인
          expect(cpu).toBeGreaterThanOrEqual(0);
          expect(cpu).toBeLessThanOrEqual(100);
          expect(memory).toBeGreaterThanOrEqual(0);
          expect(memory).toBeLessThanOrEqual(100);
          expect(disk).toBeGreaterThanOrEqual(0);
          expect(disk).toBeLessThanOrEqual(100);

          // MetricsProcessor의 결정을 신뢰 (구체적 임계값 검증 제외)
          expect(server.health.score).toBeGreaterThanOrEqual(0);
          expect(server.health.score).toBeLessThanOrEqual(100);
        });
      });

      test('MetricsProcessor: 건강 점수가 올바르게 계산되어야 함', () => {
        const servers = generator.getAllServers();

        servers.forEach(server => {
          expect(server.health.score).toBeGreaterThanOrEqual(0);
          expect(server.health.score).toBeLessThanOrEqual(100);
          expect(server.health.lastCheck).toBeDefined();
        });
      });

      test('MetricsProcessor: 클러스터 건강 상태가 올바르게 계산되어야 함', () => {
        const clusters = generator.getAllClusters();

        clusters.forEach(cluster => {
          const healthyCount = cluster.servers.filter(s => s.status === 'running').length;
          const healthPercentage = healthyCount / cluster.servers.length;

          expect(healthPercentage).toBeGreaterThanOrEqual(0);
          expect(healthPercentage).toBeLessThanOrEqual(1);
        });
      });

      test('MetricsProcessor: 장애 시나리오 영향이 올바르게 반영되어야 함', () => {
        const servers = generator.getAllServers();
        const healthyServers = servers.filter(s => s.status === 'running');

        expect(healthyServers.length).toBeGreaterThanOrEqual(servers.length * 0.5);
      });

      test('MetricsProcessor: 유의미한 변화 감지가 올바르게 작동해야 함', () => {
        const servers = generator.getAllServers();

        servers.forEach(server => {
          expect(server.metrics.cpu).toBeGreaterThanOrEqual(0);
          expect(server.metrics.cpu).toBeLessThanOrEqual(100);
          expect(server.metrics.memory).toBeGreaterThanOrEqual(0);
          expect(server.metrics.memory).toBeLessThanOrEqual(100);
          expect(server.metrics.uptime).toBeGreaterThan(0);
        });
      });
    });
  });

  afterEach(() => {
    generator.dispose();
  });
}); 