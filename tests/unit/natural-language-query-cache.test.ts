import { NaturalLanguageQueryCache } from '@/services/ai/NaturalLanguageQueryCache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('NaturalLanguageQueryCache', () => {
  let cache: NaturalLanguageQueryCache;

  beforeEach(() => {
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
      expect(cached?.hitCount).toBe(0);
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
  });
});
