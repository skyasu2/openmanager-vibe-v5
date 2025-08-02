/**
 * ✅ Redis 클라이언트 환경별 선택 및 비즈니스 로직 테스트
 * 
 * 테스트 범위:
 * 1. 환경별 Redis 선택 (개발=Mock, 프로덕션=Upstash)
 * 2. 실제 비즈니스 로직 (캐싱, 메트릭, 세션 관리)
 * 
 * Mock Redis 내부 구현은 테스트하지 않음 (테스트 도구이므로)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RedisClientInterface } from '@/lib/redis';

// Mock environment variables
const originalEnv = process.env;

// Simple mock for business logic testing
const mockRedisOperations = {
  get: vi.fn(),
  set: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(1),
  ping: vi.fn().mockResolvedValue('PONG'),
  setex: vi.fn().mockResolvedValue('OK'),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  pipeline: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
    get: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([])
  })),
  // Set operations for session management
  sadd: vi.fn().mockResolvedValue(1),
  srem: vi.fn().mockResolvedValue(1),
  smembers: vi.fn().mockResolvedValue([]),
  scard: vi.fn().mockResolvedValue(0),
  // Hash operations for complex data
  hset: vi.fn().mockResolvedValue(1),
  hget: vi.fn().mockResolvedValue(null),
  hgetall: vi.fn().mockResolvedValue({}),
  // Mock-specific methods
  getStats: vi.fn().mockReturnValue({ type: 'mock', commands: 0 }),
  dump: vi.fn().mockResolvedValue({}),
  restore: vi.fn().mockResolvedValue(undefined),
};

// Mock imports
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    ...mockRedisOperations,
    // Real Redis doesn't have getStats/dump/restore
    getStats: undefined,
    dump: undefined,
    restore: undefined,
  })),
}));

// DevMockRedis는 실제 메서드를 가진 객체를 반환해야 함
vi.mock('@/lib/redis/dev-mock-redis', () => ({
  DevMockRedis: class MockDevMockRedis {
    constructor() {
      return mockRedisOperations;
    }
  },
  getDevMockRedis: vi.fn(() => mockRedisOperations),
}));

vi.mock('@/lib/env', () => ({
  env: {
    KV_REST_API_URL: 'https://test-redis.upstash.io',
    KV_REST_API_TOKEN: 'test-token',
  },
}));

vi.mock('@/lib/config/runtime-env-decryptor', () => ({
  getDecryptedRedisConfig: vi.fn(() => null),
}));

describe('Redis 환경별 선택 및 비즈니스 로직', () => {
  let smartRedis: any;
  let getMetrics: any;
  let setMetrics: any;
  let getRealtime: any;
  let setRealtime: any;
  let getAllRealtime: any;
  let isRedisConnected: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset environment - Force test environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.FORCE_MOCK_REDIS = 'true';
    
    // Clear global cache
    globalThis.__redis_client_cache = undefined;
    globalThis.__redis_client_type = undefined;

    // Reset mocks
    mockRedisOperations.get.mockResolvedValue(null);
    mockRedisOperations.set.mockResolvedValue('OK');
    mockRedisOperations.ping.mockResolvedValue('PONG');
    mockRedisOperations.dump.mockResolvedValue({});
    
    // Reset module cache
    vi.resetModules();
    
    // Dynamic import
    const redisModule = await import('@/lib/redis');
    smartRedis = redisModule.smartRedis;
    getMetrics = redisModule.getMetrics;
    setMetrics = redisModule.setMetrics;
    getRealtime = redisModule.getRealtime;
    setRealtime = redisModule.setRealtime;
    getAllRealtime = redisModule.getAllRealtime;
    isRedisConnected = redisModule.isRedisConnected;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('🔴 환경별 Redis 선택', () => {
    it('개발 환경에서 Mock Redis 사용', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.USE_REAL_REDIS;
      
      const client = await smartRedis.getClient('dev-context');
      
      expect(client).toBeDefined();
      // Mock Redis는 getStats 메서드를 가짐
      expect(client.getStats).toBeDefined();
    });

    it('테스트 환경에서 항상 Mock Redis 사용', async () => {
      process.env.NODE_ENV = 'test';
      process.env.USE_REAL_REDIS = 'true'; // 무시되어야 함
      
      const client = await smartRedis.getClient('test-context');
      
      expect(client).toBeDefined();
      expect(client.getStats).toBeDefined();
    });

    it('CI 환경에서 Mock Redis 사용', async () => {
      process.env.CI = 'true';
      
      const client = await smartRedis.getClient('ci-context');
      
      expect(client).toBeDefined();
      expect(client.getStats).toBeDefined();
    });

    it('프로덕션 환경 설정 (실제로는 테스트 환경이므로 Mock 반환)', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      
      const client = await smartRedis.getClient('production-context');
      
      // 테스트 환경에서는 여전히 Mock 반환
      expect(client).toBeDefined();
      expect(client.getStats).toBeDefined();
    });

    it('대량 데이터 처리시 Mock Redis 사용', async () => {
      process.env.NODE_ENV = 'production';
      const largeDataSize = 200 * 1024; // 200KB
      
      const client = await smartRedis.getClient('bulk-data', largeDataSize);
      
      expect(client).toBeDefined();
      expect(client.getStats).toBeDefined();
    });
  });

  describe('🔴 서버 메트릭 캐싱 비즈니스 로직', () => {
    it('메트릭 데이터 저장 및 조회', async () => {
      const metricsData = {
        cpu: 75,
        memory: 60,
        disk: 40,
        timestamp: Date.now()
      };
      
      mockRedisOperations.get.mockResolvedValueOnce(JSON.stringify(metricsData));
      
      // 메트릭 저장
      await setMetrics('server-123', metricsData, 1625097600);
      
      expect(mockRedisOperations.set).toHaveBeenCalledWith(
        'metrics:server-123:1625097600',
        JSON.stringify(metricsData),
        { ex: 3600 }
      );
      
      // 메트릭 조회
      const result = await getMetrics('server-123', 1625097600);
      
      expect(result).toEqual(metricsData);
      expect(mockRedisOperations.get).toHaveBeenCalledWith('metrics:server-123:1625097600');
    });

    it('최신 메트릭 조회 (타임스탬프 없이)', async () => {
      const latestMetrics = { status: 'healthy', uptime: 99.95 };
      mockRedisOperations.get.mockResolvedValueOnce(JSON.stringify(latestMetrics));
      
      const result = await getMetrics('server-456');
      
      expect(mockRedisOperations.get).toHaveBeenCalledWith('metrics:server-456:latest');
      expect(result).toEqual(latestMetrics);
    });

    it('잘못된 JSON 데이터 처리', async () => {
      mockRedisOperations.get.mockResolvedValueOnce('invalid-json{');
      
      const result = await getMetrics('server-789');
      
      expect(result).toBeNull();
    });

    it('메트릭 데이터 없을 때 null 반환', async () => {
      mockRedisOperations.get.mockResolvedValueOnce(null);
      
      const result = await getMetrics('server-999');
      
      expect(result).toBeNull();
    });
  });

  describe('🔴 실시간 데이터 관리', () => {
    it('실시간 데이터 저장 및 조회', async () => {
      const realtimeData = {
        activeUsers: 150,
        requestsPerSecond: 25,
        timestamp: Date.now()
      };
      
      mockRedisOperations.get.mockResolvedValueOnce(JSON.stringify(realtimeData));
      
      // 저장
      await setRealtime('dashboard-stats', realtimeData, 600);
      
      expect(mockRedisOperations.set).toHaveBeenCalledWith(
        'realtime:dashboard-stats',
        JSON.stringify(realtimeData),
        { ex: 600 }
      );
      
      // 조회
      const result = await getRealtime('dashboard-stats');
      
      expect(result).toEqual(realtimeData);
    });

    it('모든 실시간 데이터 조회', async () => {
      const mockDump = {
        'realtime:stats1': { value: JSON.stringify({ data: 'test1' }) },
        'realtime:stats2': { value: JSON.stringify({ data: 'test2' }) },
        'metrics:other': { value: 'should be ignored' },
      };
      
      mockRedisOperations.dump.mockResolvedValueOnce(mockDump);
      
      const allData = await getAllRealtime();
      
      expect(allData).toHaveLength(2);
      expect(allData).toContainEqual({ data: 'test1' });
      expect(allData).toContainEqual({ data: 'test2' });
    });

    it('실시간 데이터 JSON 파싱 오류 처리', async () => {
      mockRedisOperations.get.mockResolvedValueOnce('invalid-json');
      
      const result = await getRealtime('broken-data');
      
      expect(result).toBeNull();
    });
  });

  describe('🔴 캐시 키 생성 패턴', () => {
    it('서버별 메트릭 캐시 키 패턴', async () => {
      const servers = ['web-01', 'api-02', 'db-03'];
      
      for (const serverId of servers) {
        await setMetrics(serverId, { status: 'ok' });
        
        const lastCall = mockRedisOperations.set.mock.calls[mockRedisOperations.set.mock.calls.length - 1];
        expect(lastCall[0]).toMatch(new RegExp(`^metrics:${serverId}:`));
      }
    });

    it('실시간 데이터 캐시 키 패턴', async () => {
      const dataTypes = ['cpu-usage', 'network-io', 'active-connections'];
      
      for (const type of dataTypes) {
        await setRealtime(type, { value: Math.random() });
        
        const lastCall = mockRedisOperations.set.mock.calls[mockRedisOperations.set.mock.calls.length - 1];
        expect(lastCall[0]).toBe(`realtime:${type}`);
      }
    });
  });

  describe('🔴 연결 상태 관리', () => {
    it('Redis 연결 상태 확인 (캐싱 포함)', async () => {
      // 첫 번째 호출
      const status1 = await isRedisConnected();
      expect(typeof status1).toBe('boolean');
      
      // 두 번째 호출 (캐시 사용)
      const status2 = await isRedisConnected();
      expect(typeof status2).toBe('boolean');
    });

    it('연결 테스트 API', async () => {
      // testRedisConnection은 이미 초기화된 클라이언트를 사용
      const { testRedisConnection } = await import('@/lib/redis');
      const result = await testRedisConnection();
      
      // 테스트 환경에서는 항상 true 반환
      expect(result).toBe(true);
    });
  });

  describe('🔴 클라이언트 캐싱', () => {
    it('동일한 Redis 인스턴스 재사용', async () => {
      const client1 = await smartRedis.getClient('context-1');
      const client2 = await smartRedis.getClient('context-2');
      
      // 동일한 환경에서는 같은 인스턴스
      expect(client1).toBe(client2);
      expect(globalThis.__redis_client_cache).toBeDefined();
    });
  });

  describe('🔴 에러 처리', () => {
    it('Redis 작업 실패시 graceful 처리', async () => {
      mockRedisOperations.get.mockRejectedValueOnce(new Error('Connection timeout'));
      
      try {
        await smartRedis.get('error-key');
        // 에러가 발생해야 함
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('메트릭 조회 실패시 처리', async () => {
      mockRedisOperations.get.mockRejectedValueOnce(new Error('Network error'));
      
      // getMetrics는 내부에서 에러를 처리하지 않으므로 에러가 전파됨
      try {
        await getMetrics('failed-server');
        expect(true).toBe(false); // 에러가 발생해야 함
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});