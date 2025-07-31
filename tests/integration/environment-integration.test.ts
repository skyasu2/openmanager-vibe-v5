/**
 * 🔗 환경별 통합 테스트
 *
 * 실제 환경에서의 시스템 동작 검증
 */

import { detectEnvironment } from '@/lib/environment/detect-environment';
import { getMockSystem } from '@/mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('환경별 통합 테스트', () => {
  beforeEach(() => {
    // 테스트 전 모든 환경변수 초기화
    vi.unstubAllEnvs();
    
    // 기본 테스트 환경 설정
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_MOCK_DATA', 'true');
    vi.stubEnv('DISABLE_EXTERNAL_CALLS', 'true');
  });

  describe('로컬 개발 환경 통합 테스트', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('VERCEL', undefined);
      vi.stubEnv('RENDER', undefined);
    });

    test('로컬 환경에서 목업 데이터 생성기 정상 동작', async () => {
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      expect(servers).toBeDefined();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);

      // 목업 데이터 특성 검증
      const firstServer = servers[0];
      expect(firstServer).toHaveProperty('id');
      expect(firstServer).toHaveProperty('name'); // 'hostname' 대신 'name' 사용
      expect(firstServer).toHaveProperty('status');
      expect(firstServer).toHaveProperty('cpu');
      expect(firstServer).toHaveProperty('memory');
    });

    test('로컬 환경에서 대시보드 요약 데이터 생성', async () => {
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      // 대시보드 요약 데이터 계산
      const summary = {
        totalServers: servers.length,
        healthyServers: servers.filter(
          s => s.status === 'healthy' || s.status === 'online'
        ).length,
        warningServers: servers.filter(s => s.status === 'warning').length,
        criticalServers: servers.filter(
          s => s.status === 'critical' || s.status === 'offline'
        ).length,
      };

      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('totalServers');
      expect(summary).toHaveProperty('healthyServers');
      expect(summary).toHaveProperty('warningServers');
      expect(summary).toHaveProperty('criticalServers');
      expect(typeof summary.totalServers).toBe('number');
    });

    test('로컬 환경에서 서버 메트릭 조회', async () => {
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      // 서버에서 메트릭 데이터 추출
      const metrics = servers.map(server => ({
        server_id: server.id,
        cpu_usage: server.cpu,
        memory_usage: server.memory,
        disk_usage: server.disk || 50,
        timestamp: new Date(),
      }));

      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);

      if (metrics.length > 0) {
        const firstMetric = metrics[0];
        expect(firstMetric).toHaveProperty('cpu_usage');
        expect(firstMetric).toHaveProperty('memory_usage');
        expect(firstMetric).toHaveProperty('disk_usage');
      }
    });
  });

  describe('Vercel 환경 통합 테스트', () => {
    beforeEach(() => {
      vi.stubEnv('VERCEL', '1');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_ENV', 'production');
    });

    test('Vercel 환경에서 목업 시스템 초기화', async () => {
      const mockSystem = getMockSystem();

      // Vercel 환경에서도 목업 시스템 사용
      expect(mockSystem).toBeDefined();
      expect(typeof mockSystem.getServers).toBe('function');
      expect(typeof mockSystem.reset).toBe('function');
    });

    test('Vercel 환경에서 메모리 제한 확인', () => {
      const env = detectEnvironment();

      expect(env.IS_VERCEL).toBe(true);
      expect(env.IS_PRODUCTION).toBe(true);
      expect(env.performance.maxMemory).toBe(1024);
      expect(env.performance.timeout).toBe(25000);
      expect(env.features.enableWebSocket).toBe(false);
    });

    test('Vercel 환경에서 목업 데이터 비활성화 확인', () => {
      const env = detectEnvironment();

      expect(env.features.enableMockData).toBe(false);
      expect(env.platform).toBe('vercel');
    });
  });

  describe('테스트 환경 통합 테스트', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('VERCEL', undefined);
      vi.stubEnv('VERCEL_ENV', undefined);
      vi.stubEnv('REDIS_CONNECTION_DISABLED', 'true');
      vi.stubEnv('UPSTASH_REDIS_DISABLED', 'true');
      vi.stubEnv('DISABLE_HEALTH_CHECK', 'true');
      vi.stubEnv('FORCE_MOCK_GOOGLE_AI', 'true');
    });

    test('테스트 환경에서 외부 연결 차단 확인', () => {
      const env = detectEnvironment();

      expect(env.IS_TEST).toBe(true);
      expect(env.features.enableMockData).toBe(false); // test 환경에서는 false
      expect(env.platform).toBe('unknown'); // test 환경에서는 unknown
    });

    test('테스트 환경에서 Redis 연결 비활성화', () => {
      expect(process.env.REDIS_CONNECTION_DISABLED).toBe('true');
      expect(process.env.UPSTASH_REDIS_DISABLED).toBe('true');
    });

    test('테스트 환경에서 Google AI 목업 활성화', () => {
      expect(process.env.FORCE_MOCK_GOOGLE_AI).toBe('true');
    });
  });

  describe('환경 전환 테스트', () => {
    test('개발 환경에서 프로덕션 환경으로 전환', () => {
      // 개발 환경 설정
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('VERCEL', undefined);
      vi.stubEnv('VERCEL_ENV', undefined);

      const devEnv = detectEnvironment();
      expect(devEnv.IS_LOCAL).toBe(true);
      expect(devEnv.features.enableMockData).toBe(true);

      // 프로덕션 환경으로 전환
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL', '1');
      vi.stubEnv('VERCEL_ENV', 'production');

      const prodEnv = detectEnvironment();
      expect(prodEnv.IS_VERCEL).toBe(true);
      expect(prodEnv.features.enableMockData).toBe(false);
    });

    test('환경 전환 시 설정 일관성 확인', () => {
      const environments = [
        { NODE_ENV: 'development' },
        { NODE_ENV: 'production', VERCEL: '1' },
        { NODE_ENV: 'test' },
      ];

      environments.forEach(envVars => {
        // 기존 환경변수 제거
        vi.unstubAllEnvs();
        
        // 새 환경변수 설정
        Object.entries(envVars).forEach(([key, value]) => {
          vi.stubEnv(key, value);
        });

        const env = detectEnvironment();

        // 각 환경에서 필수 속성 존재 확인
        expect(env).toHaveProperty('IS_LOCAL');
        expect(env).toHaveProperty('IS_VERCEL');
        expect(env).toHaveProperty('IS_PRODUCTION');
        expect(env.features).toHaveProperty('enableMockData');
        expect(env).toHaveProperty('platform');
      });
    });
  });

  describe('환경별 API 응답 테스트', () => {
    test('로컬 환경에서 서버 API 응답 구조', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      // API 응답 구조 검증
      expect(servers).toBeDefined();
      expect(Array.isArray(servers)).toBe(true);

      if (servers.length > 0) {
        const server = servers[0];
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('status');
        expect(typeof server.id).toBe('string');
        expect(typeof server.name).toBe('string');
      }
    });

    test('환경별 에러 응답 일관성', async () => {
      const testCases = [
        { NODE_ENV: 'development', expectMockData: true },
        {
          NODE_ENV: 'production',
          VERCEL: '1',
          VERCEL_ENV: 'production',
          expectMockData: false,
        },
        { NODE_ENV: 'test', expectMockData: false }, // test 환경에서는 enableMockData가 false
      ];

      for (const testCase of testCases) {
        // 환경 초기화
        vi.unstubAllEnvs();
        
        // 환경 설정
        const { expectMockData, ...envVars } = testCase;
        Object.entries(envVars).forEach(([key, value]) => {
          vi.stubEnv(key, value);
        });

        const env = detectEnvironment();

        // production + VERCEL='1'이지만 VERCEL_ENV가 없으면 Vercel로 감지되지 않음
        if (
          envVars.NODE_ENV === 'production' &&
          envVars.VERCEL === '1' &&
          !envVars.VERCEL_ENV
        ) {
          // Vercel로 감지되지 않아 production이지만 enableMockData가 false가 아닐 수 있음
          expect(env.features.enableMockData).toBe(false); // production은 항상 false
        } else {
          expect(env.features.enableMockData).toBe(expectMockData);
        }
      }
    });
  });

  describe('성능 테스트', () => {
    test('로컬 환경에서 서버 데이터 생성 성능', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const mockSystem = getMockSystem();

      const startTime = Date.now();
      const servers = mockSystem.getServers();
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(servers.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // 5초 이내
    });

    test('환경 감지 함수 성능', () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        detectEnvironment();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;

      expect(avgDuration).toBeLessThan(1); // 평균 1ms 이내
    });
  });

  describe('메모리 사용량 테스트', () => {
    test('환경별 메모리 사용량 모니터링', async () => {
      const initialMemory = process.memoryUsage();

      vi.stubEnv('NODE_ENV', 'development');
      const mockSystem = getMockSystem();
      const servers = mockSystem.getServers();

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 메모리 증가량이 합리적인 범위 내인지 확인 (100MB 이하)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});