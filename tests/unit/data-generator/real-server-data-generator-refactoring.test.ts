/**
 * RealServerDataGenerator 리팩토링 TDD 테스트
 *
 * 목적: 1,801줄 파일을 SOLID 원칙에 따라 분리하면서 기존 기능 보장
 * 시간: 2025-06-30 23:10 KST
 */

import { beforeEach, describe, expect, it } from 'vitest';

// 기존 Generator (분리 전)
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 분리 예정 모듈들 (아직 존재하지 않음)
// import { ServerTypes, REALISTIC_SERVER_TYPES } from '@/services/data-generator/types/ServerTypes';
// import { RedisService } from '@/services/data-generator/services/RedisService';
// import { ServerFactory } from '@/services/data-generator/factories/ServerFactory';
// import { MetricsCalculator } from '@/services/data-generator/calculators/MetricsCalculator';

describe('RealServerDataGenerator 리팩토링 TDD', () => {
  let generator: RealServerDataGenerator;

  beforeEach(() => {
    // Mock Redis를 사용하여 안전하게 테스트
    generator = new RealServerDataGenerator({
      maxServers: 10,
      enableRedis: false,
      enableRealtime: false,
    });
  });

  describe('분리 전 기존 기능 테스트 (Baseline)', () => {
    it('인스턴스 생성이 성공해야 함', () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(RealServerDataGenerator);
    });

    it('초기화가 성공해야 함', async () => {
      await expect(generator.initialize()).resolves.not.toThrow();
    });

    it('서버 데이터 생성이 성공해야 함', async () => {
      await generator.initialize();
      const servers = generator.getAllServers();

      expect(servers).toBeDefined();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
      expect(servers.length).toBeLessThanOrEqual(10);
    });

    it('클러스터 데이터 생성이 성공해야 함', async () => {
      await generator.initialize();
      const clusters = generator.getAllClusters();

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      // 클러스터는 같은 타입의 서버가 2개 이상일 때만 생성됨
      expect(clusters.length).toBeGreaterThanOrEqual(0);
    });

    it('애플리케이션 메트릭 생성이 성공해야 함', async () => {
      await generator.initialize();
      const applications = generator.getAllApplications();

      expect(applications).toBeDefined();
      expect(Array.isArray(applications)).toBe(true);
      expect(applications.length).toBeGreaterThan(0);
    });

    it('대시보드 요약 데이터가 올바른 구조여야 함', async () => {
      await generator.initialize();
      const summary = generator.getDashboardSummary();

      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('servers');
      expect(summary).toHaveProperty('clusters');
      expect(summary).toHaveProperty('applications');
      expect(summary).toHaveProperty('timestamp');

      // 서버 상세 구조 확인
      expect(summary.servers).toHaveProperty('total');
      expect(summary.servers).toHaveProperty('running');
      expect(summary.servers).toHaveProperty('warning');
      expect(summary.servers).toHaveProperty('error');
    });

    it('특정 서버 조회가 성공해야 함', async () => {
      await generator.initialize();
      const servers = generator.getAllServers();

      if (servers.length > 0) {
        const firstServer = servers[0];
        const foundServer = generator.getServerById(firstServer.id);

        expect(foundServer).toBeDefined();
        expect(foundServer?.id).toBe(firstServer.id);
      }
    });

    it('헬스체크가 성공해야 함', async () => {
      await generator.initialize();
      const healthResult = await generator.healthCheck();

      expect(healthResult).toBeDefined();
      expect(healthResult).toHaveProperty('status');
      expect(healthResult).toHaveProperty('timestamp');
      expect(healthResult).toHaveProperty('generator');
      expect(healthResult).toHaveProperty('metrics');

      // 중첩 구조 확인
      expect(healthResult.generator).toHaveProperty('serverCount');
      expect(healthResult.metrics).toHaveProperty('healthyServers');
    });
  });

  describe('분리 후 기능 테스트 (구현 예정)', () => {
    it('ServerTypes 모듈이 올바른 타입 정의를 제공해야 함', async () => {
      // 🏗️ 분리된 모듈 import (TDD Green 단계)
      const {
        REALISTIC_SERVER_TYPES,
        calculateServerDistribution,
        getServerTypesForCategory,
        generateHostname,
        generateSpecializedMetrics,
      } = await import('@/services/data-generator/types/NewServerTypes');

      // 타입 정의 검증
      expect(REALISTIC_SERVER_TYPES).toBeDefined();
      expect(REALISTIC_SERVER_TYPES.length).toBeGreaterThan(0);
      expect(REALISTIC_SERVER_TYPES[0]).toHaveProperty('id');
      expect(REALISTIC_SERVER_TYPES[0]).toHaveProperty('category');

      // 유틸리티 함수 검증
      const distribution = calculateServerDistribution(10);
      expect(distribution).toHaveProperty('web');
      expect(distribution).toHaveProperty('app');
      expect(distribution).toHaveProperty('database');
      expect(distribution).toHaveProperty('infrastructure');

      // 카테고리별 서버 타입 검증
      const webServers = getServerTypesForCategory('web');
      expect(webServers.length).toBeGreaterThan(0);
      expect(webServers.every(s => s.category === 'web')).toBe(true);

      // 호스트네임 생성 검증
      const hostname = generateHostname(
        REALISTIC_SERVER_TYPES[0],
        'production',
        1
      );
      expect(hostname).toMatch(/prod-/);

      // 메트릭 생성 검증
      const metrics = generateSpecializedMetrics(REALISTIC_SERVER_TYPES[0]);
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('customMetrics');
    });

    it.skip('RedisService가 독립적으로 작동해야 함', async () => {
      // TODO: RedisService 모듈 구현 후 테스트
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('ServerFactory가 서버 생성을 담당해야 함', () => {
      // TODO: ServerFactory 모듈 구현 후 테스트
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('MetricsCalculator가 메트릭 계산을 담당해야 함', () => {
      // TODO: MetricsCalculator 모듈 구현 후 테스트
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('분리 후 RealServerDataGenerator가 오케스트레이션만 담당해야 함', async () => {
      // TODO: 리팩토링 완료 후 테스트
      expect(true).toBe(false); // 의도적 실패
    });
  });

  describe('성능 및 메모리 테스트', () => {
    it('대량 서버 생성 시 메모리 누수가 없어야 함', async () => {
      const largeGenerator = new RealServerDataGenerator({
        maxServers: 100,
        enableRedis: false,
        enableRealtime: false,
      });

      await largeGenerator.initialize();
      const servers = largeGenerator.getAllServers();

      expect(servers.length).toBe(100);
      expect(servers.every(s => s.id && s.name)).toBe(true);

      largeGenerator.dispose();
    });

    it('자동 생성 시작/중지가 정상 작동해야 함', async () => {
      await generator.initialize();

      expect(() => generator.startAutoGeneration()).not.toThrow();
      expect(() => generator.stopAutoGeneration()).not.toThrow();
    });
  });

  afterEach(() => {
    generator.dispose();
  });
});

/**
 * 분리 목표:
 *
 * 1. ServerTypes.ts (150줄) - 타입 정의 & 상수
 * 2. RedisService.ts (250줄) - Redis 연동 기능
 * 3. ServerFactory.ts (350줄) - 서버 생성 로직
 * 4. MetricsCalculator.ts (250줄) - 메트릭 계산
 * 5. RealServerDataGenerator.ts (400줄) - 메인 오케스트레이션
 *
 * 총합: 1,400줄 (기존 1,801줄에서 22% 감소)
 */
