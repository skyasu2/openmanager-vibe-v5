import { NaturalLanguageQueryCache } from '@/services/ai/NaturalLanguageQueryCache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// Mock Redis client
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    scan: vi.fn(),
    expire: vi.fn(),
    multi: vi.fn(() => ({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
    on: vi.fn(),
    isOpen: true,
  })),
}));

// Mock AI Engine
vi.mock('@/core/ai/engines/UnifiedAIEngineRouter', () => ({
  UnifiedAIEngineRouter: vi.fn().mockImplementation(() => ({
    processQuery: vi.fn().mockResolvedValue({
      content: 'AI response',
      success: true,
      confidence: 0.9,
      metadata: { tokensUsed: 100 },
    }),
  })),
}));

describe('NaturalLanguageQueryCache', () => {
  let cache: NaturalLanguageQueryCache;
  let mockRedisClient: any;

  beforeEach(() => {
    mockRedisClient = createClient();
    
    cache = new NaturalLanguageQueryCache({
      enableMockMode: true,
      defaultTTL: 300, // 5분
      maxCacheSize: 100,
      preventExcessiveAPICalls: true,
      apiCallLimit: {
        perMinute: 5,
        perHour: 50,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('캐시 기본 기능', () => {
    it('캐시된 응답이 없을 때 null을 반환해야 함', async () => {
      const result = await cache.getCachedResponse('test query', 'test-engine');
      expect(result).toBeNull();
    });

    it('응답을 캐시에 저장하고 조회할 수 있어야 함', async () => {
      const query = '서버 상태는 어떻습니까?';
      const response = '모든 서버가 정상 작동 중입니다.';
      const confidence = 0.9;
      const engine = 'korean-ai';

      // 캐시에 저장
      await cache.setCachedResponse(query, response, confidence, engine);

      // 캐시에서 조회
      const cached = await cache.getCachedResponse(query, engine);

      expect(cached).toBeDefined();
      expect(cached?.query).toBe(query);
      expect(cached?.response).toBe(response);
      expect(cached?.confidence).toBe(confidence);
      expect(cached?.engine).toBe(engine);
      expect(cached?.hitCount).toBe(1); // 첫 조회에서 hitCount가 1이 되는 것이 정상
    });

    it('캐시 히트 시 hitCount가 증가해야 함', async () => {
      const query = '메모리 사용량을 확인해주세요';
      const response = '현재 메모리 사용량은 75%입니다.';

      await cache.setCachedResponse(query, response, 0.8, 'unified');

      // 첫 번째 조회
      const first = await cache.getCachedResponse(query, 'unified');
      expect(first?.hitCount).toBe(1);

      // 두 번째 조회
      const second = await cache.getCachedResponse(query, 'unified');
      expect(second?.hitCount).toBe(2);
    });

    it('다른 엔진의 같은 쿼리는 별도로 캐시되어야 함', async () => {
      const query = 'CPU 사용률은?';
      const response1 = 'CPU 사용률: 45%';
      const response2 = 'CPU utilization: 45%';

      await cache.setCachedResponse(query, response1, 0.9, 'korean-ai');
      await cache.setCachedResponse(query, response2, 0.8, 'google-ai');

      const cached1 = await cache.getCachedResponse(query, 'korean-ai');
      const cached2 = await cache.getCachedResponse(query, 'google-ai');

      expect(cached1?.response).toBe(response1);
      expect(cached2?.response).toBe(response2);
    });
  });

  describe('API 호출 제한 기능', () => {
    it('API 호출 제한 내에서는 허용해야 함', async () => {
      const result = await cache.checkAPICallLimit('test-engine');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('분당 호출 제한을 초과하면 거부해야 함', async () => {
      const engine = 'limited-engine';

      // 제한 횟수만큼 호출
      for (let i = 0; i < 5; i++) {
        await cache.checkAPICallLimit(engine);
      }

      // 제한 초과 호출
      const result = await cache.checkAPICallLimit(engine);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('분당 API 호출 제한 초과');
    });

    it('시간이 지나면 API 호출 제한이 리셋되어야 함', async () => {
      const engine = 'reset-engine';

      // 제한 횟수만큼 호출
      for (let i = 0; i < 5; i++) {
        await cache.checkAPICallLimit(engine);
      }

      // 시간을 1분 후로 이동 (모킹)
      const originalDate = Date.now;
      Date.now = vi.fn(() => originalDate() + 61 * 1000);

      const result = await cache.checkAPICallLimit(engine);
      expect(result.allowed).toBe(true);

      Date.now = originalDate;
    });
  });

  describe('캐시 통계 및 관리', () => {
    it('캐시 통계를 올바르게 계산해야 함', async () => {
      // 여러 캐시 항목 추가
      await cache.setCachedResponse('query1', 'response1', 0.9, 'engine1');
      await cache.setCachedResponse('query2', 'response2', 0.8, 'engine2');

      // 캐시 히트 생성
      await cache.getCachedResponse('query1', 'engine1');
      await cache.getCachedResponse('query1', 'engine1');

      const stats = await cache.getCacheStats();

      expect(stats.totalCached).toBe(2);
      expect(stats.topQueries).toHaveLength(1);
      expect(stats.topQueries[0].hitCount).toBe(2);
    });

    it('캐시를 선택적으로 정리할 수 있어야 함', async () => {
      await cache.setCachedResponse('서버 상태', 'response1', 0.9, 'engine1');
      await cache.setCachedResponse(
        '메모리 사용량',
        'response2',
        0.8,
        'engine2'
      );

      const deletedCount = await cache.clearCache('서버');

      expect(deletedCount).toBe(1);

      const remaining = await cache.getCachedResponse(
        '메모리 사용량',
        'engine2'
      );
      expect(remaining).toBeDefined();

      const deleted = await cache.getCachedResponse('서버 상태', 'engine1');
      expect(deleted).toBeNull();
    });

    it('전체 캐시를 정리할 수 있어야 함', async () => {
      await cache.setCachedResponse('query1', 'response1', 0.9, 'engine1');
      await cache.setCachedResponse('query2', 'response2', 0.8, 'engine2');

      const deletedCount = await cache.clearCache();

      expect(deletedCount).toBe(2);

      const stats = await cache.getCacheStats();
      expect(stats.totalCached).toBe(0);
    });
  });

  describe('TTL 및 만료 처리', () => {
    it('엔진별로 다른 TTL을 적용해야 함', async () => {
      const query = 'test query';
      const response = 'test response';

      // Google AI는 더 긴 TTL
      await cache.setCachedResponse(query, response, 0.9, 'google-ai');
      const googleCached = await cache.getCachedResponse(query, 'google-ai');

      // MCP는 더 짧은 TTL
      await cache.setCachedResponse(query, response, 0.9, 'mcp');
      const mcpCached = await cache.getCachedResponse(query, 'mcp');

      expect(googleCached?.ttl).toBeGreaterThan(mcpCached?.ttl || 0);
    });

    it('신뢰도가 높을수록 더 긴 TTL을 적용해야 함', async () => {
      const query = 'confidence test';
      const engine = 'test-engine';

      await cache.setCachedResponse(query + '1', 'response1', 0.9, engine);
      await cache.setCachedResponse(query + '2', 'response2', 0.5, engine);

      const highConfidence = await cache.getCachedResponse(query + '1', engine);
      const lowConfidence = await cache.getCachedResponse(query + '2', engine);

      expect(highConfidence?.ttl).toBeGreaterThan(lowConfidence?.ttl || 0);
    });
  });

  describe('에러 처리', () => {
    it('캐시 조회 실패 시 null을 반환해야 함', async () => {
      // 잘못된 캐시 키로 조회
      const result = await cache.getCachedResponse('', '');
      expect(result).toBeNull();
    });

    it('캐시 저장 실패 시 예외를 던지지 않아야 함', async () => {
      // 예외가 발생하지 않아야 함
      await expect(
        cache.setCachedResponse('test', 'test', 0.5, 'test')
      ).resolves.not.toThrow();
    });

    it('API 호출 제한 확인 실패 시 허용으로 처리해야 함', async () => {
      const cache = new NaturalLanguageQueryCache({
        preventExcessiveAPICalls: false,
      });

      const result = await cache.checkAPICallLimit('any-engine');
      expect(result.allowed).toBe(true);
    });
  });

  describe('목업 모드 vs Redis 모드', () => {
    it('목업 모드에서 정상 동작해야 함', async () => {
      const mockCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
      });

      await mockCache.setCachedResponse('test', 'response', 0.8, 'engine');
      const result = await mockCache.getCachedResponse('test', 'engine');

      expect(result).toBeDefined();
      expect(result?.response).toBe('response');
    });

    it('최대 캐시 크기를 초과하면 정리해야 함', async () => {
      const smallCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
        maxCacheSize: 2,
      });

      // 최대 크기를 초과하여 캐시 추가
      await smallCache.setCachedResponse('query1', 'response1', 0.8, 'engine');
      await smallCache.setCachedResponse('query2', 'response2', 0.8, 'engine');
      await smallCache.setCachedResponse('query3', 'response3', 0.8, 'engine');

      const stats = await smallCache.getCacheStats();
      expect(stats.totalCached).toBeLessThanOrEqual(2);
    });

    it('TTL이 만료된 캐시는 자동으로 삭제되어야 함', async () => {
      const query = '만료될 쿼리';
      const response = '만료될 응답';
      
      // TTL 1초로 설정
      const shortTTLCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
        defaultTTL: 1,
        maxCacheSize: 100,
      });
      
      await shortTTLCache.setCachedResponse(query, response, 0.9, 'test-engine');
      
      // 2초 후 확인
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cached = await shortTTLCache.getCachedResponse(query, 'test-engine');
      expect(cached).toBeNull();
    }, 10000);
  });

  describe('Redis 통합', () => {
    it('Redis가 연결되어 있을 때 사용해야 함', async () => {
      // Redis 클라이언트를 사용하는 캐시 생성
      const redisCache = new NaturalLanguageQueryCache({
        enableMockMode: false,
        redisClient: mockRedisClient,
        defaultTTL: 300,
      });
      
      const query = 'Redis 테스트';
      const response = 'Redis를 통한 응답';
      
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.set.mockResolvedValueOnce('OK');
      
      await redisCache.setCachedResponse(query, response, 0.9, 'redis-engine');
      
      expect(mockRedisClient.set).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('nlq:redis-engine:'),
        expect.any(String),
        expect.objectContaining({ EX: 300 })
      );
    });

    it('Redis 연결 실패 시 fallback으로 메모리 캐시 사용', async () => {
      const redisCache = new NaturalLanguageQueryCache({
        enableMockMode: false,
        redisClient: mockRedisClient,
        defaultTTL: 300,
      });
      
      // Redis 오류 시뮬레이션
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis connection failed'));
      
      const query = 'fallback 테스트';
      const response = '메모리 캐시 응답';
      
      await redisCache.setCachedResponse(query, response, 0.9, 'fallback-engine');
      const cached = await redisCache.getCachedResponse(query, 'fallback-engine');
      
      expect(cached).toBeDefined();
      expect(cached?.response).toBe(response);
    });

    it('Redis에서 대량 데이터 처리', async () => {
      const redisCache = new NaturalLanguageQueryCache({
        enableMockMode: false,
        redisClient: mockRedisClient,
        defaultTTL: 300,
      });
      
      // 대량 데이터 준비
      const largeResponse = 'A'.repeat(10000); // 10KB
      
      mockRedisClient.set.mockResolvedValueOnce('OK');
      
      await redisCache.setCachedResponse('large-query', largeResponse, 0.9, 'large-engine');
      
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(largeResponse),
        expect.any(Object)
      );
    });
  });

  describe('동시성 처리', () => {
    it('동시에 같은 쿼리로 여러 요청이 오면 한 번만 처리', async () => {
      const query = '동시 요청 테스트';
      const response = '동시성 처리된 응답';
      
      // 동시 요청 시뮬레이션
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          cache.getOrCompute(query, 'concurrent-engine', async () => {
            // 지연 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 100));
            return { response, confidence: 0.9 };
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      // 모든 결과가 동일해야 함
      results.forEach(result => {
        expect(result.response).toBe(response);
      });
      
      // 실제 컴퓨트 함수는 한 번만 호출되어야 함
      const stats = await cache.getCacheStats();
      expect(stats.totalCached).toBe(1);
    });

    it('다른 쿼리는 동시에 처리 가능', async () => {
      const queries = ['query1', 'query2', 'query3'];
      const promises = queries.map((query, index) => 
        cache.getOrCompute(query, 'multi-engine', async () => ({
          response: `response-${index}`,
          confidence: 0.9,
        }))
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.response).toBe(`response-${index}`);
      });
    });

    it('락 타임아웃 처리', async () => {
      const query = '락 타임아웃 테스트';
      
      // 락 타임아웃 설정
      const timeoutCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
        lockTimeout: 100, // 100ms
      });
      
      // 처음 요청은 오래 걸림
      const firstPromise = timeoutCache.getOrCompute(query, 'timeout-engine', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { response: 'should timeout', confidence: 0.9 };
      });
      
      // 두 번째 요청
      await new Promise(resolve => setTimeout(resolve, 150));
      const secondPromise = timeoutCache.getOrCompute(query, 'timeout-engine', async () => {
        return { response: 'second attempt', confidence: 0.9 };
      });
      
      const result = await secondPromise;
      expect(result.response).toBe('second attempt');
    });
  });

  describe('메모리 관리', () => {
    it('최대 캐시 크기 제한', async () => {
      const smallCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
        maxCacheSize: 3,
        defaultTTL: 300,
      });
      
      // 최대 크기보다 많은 항목 추가
      for (let i = 0; i < 5; i++) {
        await smallCache.setCachedResponse(
          `query-${i}`,
          `response-${i}`,
          0.9,
          'size-test-engine'
        );
      }
      
      const stats = await smallCache.getCacheStats();
      expect(stats.totalCached).toBeLessThanOrEqual(3);
    });

    it('LRU 정책으로 오래된 항목 제거', async () => {
      const lruCache = new NaturalLanguageQueryCache({
        enableMockMode: true,
        maxCacheSize: 2,
        evictionPolicy: 'LRU',
        defaultTTL: 300,
      });
      
      // 첫 번째 항목
      await lruCache.setCachedResponse('old-query', 'old-response', 0.9, 'lru-engine');
      
      // 두 번째 항목
      await lruCache.setCachedResponse('newer-query', 'newer-response', 0.9, 'lru-engine');
      
      // 첫 번째 항목 사용 (최근 사용으로 변경)
      await lruCache.getCachedResponse('old-query', 'lru-engine');
      
      // 세 번째 항목 추가 (두 번째 항목이 제거되어야 함)
      await lruCache.setCachedResponse('newest-query', 'newest-response', 0.9, 'lru-engine');
      
      // 검증
      const oldCached = await lruCache.getCachedResponse('old-query', 'lru-engine');
      const newerCached = await lruCache.getCachedResponse('newer-query', 'lru-engine');
      const newestCached = await lruCache.getCachedResponse('newest-query', 'lru-engine');
      
      expect(oldCached).toBeDefined();
      expect(newerCached).toBeNull(); // 제거되었어야 함
      expect(newestCached).toBeDefined();
    });

    it('메모리 누수 방지', async () => {
      const queries = [];
      
      // 많은 수의 다른 쿼리 생성
      for (let i = 0; i < 1000; i++) {
        const query = `memory-test-${i}-${Math.random()}`;
        queries.push(query);
        await cache.setCachedResponse(query, `response-${i}`, 0.9, 'memory-test');
      }
      
      // 메모리 사용량 확인 (실제로는 process.memoryUsage() 사용)
      const stats = await cache.getCacheStats();
      expect(stats.totalCached).toBeLessThanOrEqual(100); // maxCacheSize
      
      // 참조 해제
      queries.length = 0;
    });
  });

  describe('성능 최적화', () => {
    it('캐시 warming 기능', async () => {
      const commonQueries = [
        { query: '서버 상태', response: '모든 서버 정상', confidence: 0.95 },
        { query: 'CPU 사용량', response: 'CPU 45%', confidence: 0.9 },
        { query: '메모리 상태', response: '메모리 60%', confidence: 0.88 },
      ];
      
      // 캐시 warming
      await cache.warmCache(commonQueries, 'warm-engine');
      
      // 모든 쿼리가 캐시되어 있어야 함
      for (const item of commonQueries) {
        const cached = await cache.getCachedResponse(item.query, 'warm-engine');
        expect(cached).toBeDefined();
        expect(cached?.response).toBe(item.response);
      }
    });

    it('배치 처리 성능', async () => {
      const batchQueries = [];
      for (let i = 0; i < 50; i++) {
        batchQueries.push(`batch-query-${i}`);
      }
      
      const startTime = Date.now();
      
      // 배치로 캐시 검색
      const results = await cache.getBatchCached(batchQueries, 'batch-engine');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 50개 항목을 100ms 이내에 처리해야 함
      expect(duration).toBeLessThan(100);
      expect(results).toHaveLength(50);
    });
  });

  describe('AI 엔진 통합', () => {
    it('AI 엔진 응답 캐싱', async () => {
      const mockAIResponse = {
        content: '서버 상태는 모두 정상입니다.',
        confidence: 0.92,
        metadata: {
          engine: 'unified-ai',
          responseTime: 120,
          tokensUsed: 45,
        },
      };
      
      // AI 엔진 응답 캐싱
      await cache.setCachedAIResponse(
        '서버 상태 확인',
        mockAIResponse,
        'unified-ai'
      );
      
      const cached = await cache.getCachedAIResponse('서버 상태 확인', 'unified-ai');
      expect(cached).toBeDefined();
      expect(cached?.content).toBe(mockAIResponse.content);
      expect(cached?.metadata?.tokensUsed).toBe(45);
    });

    it('캐싱된 응답으로 토큰 절약', async () => {
      const query = '토큰 절약 테스트';
      const aiResponse = {
        content: '대량의 토큰을 사용하는 긴 응답',
        confidence: 0.95,
        metadata: { tokensUsed: 500 },
      };
      
      await cache.setCachedAIResponse(query, aiResponse, 'token-save-engine');
      
      // 10번 재사용
      let totalTokensSaved = 0;
      for (let i = 0; i < 10; i++) {
        const cached = await cache.getCachedAIResponse(query, 'token-save-engine');
        if (cached) {
          totalTokensSaved += cached.metadata?.tokensUsed || 0;
        }
      }
      
      // 캐시로 4500 토큰 절약 (500 * 9)
      expect(totalTokensSaved).toBe(5000);
    });
  });
});
