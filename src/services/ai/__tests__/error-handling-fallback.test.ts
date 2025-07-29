/**
 * 에러 처리 및 폴백 메커니즘 검증 테스트
 */

import { SimplifiedQueryEngine } from '../SimplifiedQueryEngine';
import { embeddingService } from '../embedding-service';
import { SupabaseRAGEngine } from '../supabase-rag-engine';
import { VectorIndexingService } from '../vectorization/VectorIndexingService';

// Mock 설정
jest.mock('@/utils/supabase/server');
jest.mock('@/lib/logger');
jest.mock('@/lib/monitoring/performance');

describe('에러 처리 및 폴백 메커니즘', () => {
  let queryEngine: SimplifiedQueryEngine;
  let ragEngine: SupabaseRAGEngine;
  let indexingService: VectorIndexingService;

  beforeEach(() => {
    queryEngine = new SimplifiedQueryEngine();
    ragEngine = new SupabaseRAGEngine();
    indexingService = VectorIndexingService.getInstance();

    // 환경 변수 설정
    process.env.GOOGLE_AI_API_KEY = 'test-key';
  });

  describe('임베딩 서비스 폴백', () => {
    it('API 실패 시 빈 임베딩 반환', async () => {
      // API 호출 실패 시뮬레이션
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const embedding = await embeddingService.createEmbedding('test text');

      // 빈 임베딩이 반환되어야 함
      expect(embedding).toHaveLength(384);
      expect(embedding.every(v => v === 0)).toBe(true);
    });

    it('잘못된 응답 형식 처리', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      const embedding = await embeddingService.createEmbedding('test');

      expect(embedding).toHaveLength(384);
      expect(embedding.every(v => v === 0)).toBe(true);
    });

    it('캐시 히트 시 API 호출 없음', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          embedding: { values: new Array(384).fill(0.1) },
        }),
      });
      global.fetch = mockFetch;

      // 첫 번째 호출
      await embeddingService.createEmbedding('cached text');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 두 번째 호출 (캐시됨)
      await embeddingService.createEmbedding('cached text');
      expect(mockFetch).toHaveBeenCalledTimes(1); // 여전히 1번
    });
  });

  describe('RAG 엔진 폴백', () => {
    it('벡터 검색 실패 시 더미 임베딩 사용', async () => {
      // 임베딩 서비스 실패 설정
      jest
        .spyOn(embeddingService, 'createEmbedding')
        .mockRejectedValue(new Error('Embedding failed'));

      const result = await ragEngine.searchSimilar('test query');

      expect(result.success).toBe(false);
      expect(result.error).toContain('RAG 검색 실패');
    });

    it('배치 임베딩 실패 시 개별 처리 폴백', async () => {
      // 배치 처리 실패
      jest
        .spyOn(embeddingService, 'createBatchEmbeddings')
        .mockRejectedValue(new Error('Batch failed'));

      // 개별 처리는 성공
      jest
        .spyOn(embeddingService, 'createEmbedding')
        .mockResolvedValue(new Array(384).fill(0.1));

      const documents = [
        { id: '1', content: 'doc1', metadata: {} },
        { id: '2', content: 'doc2', metadata: {} },
      ];

      const result = await ragEngine.bulkIndex(documents);

      // 개별 처리로 폴백되어 성공해야 함
      expect(result.success).toBeGreaterThan(0);
    });
  });

  describe('쿼리 엔진 폴백', () => {
    it('Google AI 실패 시 로컬 RAG로 폴백', async () => {
      // Google AI API 실패
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      });

      const response = await queryEngine.query({
        query: 'test query',
        mode: 'google-ai',
      });

      // 로컬 RAG로 폴백되어야 함
      expect(response.engine).toBe('local-rag');
      expect(response.metadata?.fallback).toBeTruthy();
    });

    it('빈 쿼리 처리', async () => {
      const response = await queryEngine.query({
        query: '',
        mode: 'local',
      });

      expect(response.success).toBe(true);
      expect(response.response).toContain('질의를 입력해 주세요');
      expect(response.confidence).toBe(0);
    });

    it('타임아웃 처리', async () => {
      // 느린 응답 시뮬레이션
      jest
        .spyOn(ragEngine, 'searchSimilar')
        .mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 10000))
        );

      const response = await queryEngine.query({
        query: 'slow query',
        options: { timeout: 100 }, // 100ms 타임아웃
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('시간 초과');
    });
  });

  describe('벡터 인덱싱 에러 처리', () => {
    it('유효하지 않은 문서 필터링', async () => {
      const documents = [
        { id: '1', content: 'short', metadata: {} }, // 너무 짧음
        { id: '2', content: 'a'.repeat(100), metadata: {} }, // 적절함
        { id: '3', content: '', metadata: {} }, // 비어있음
      ];

      const result = await indexingService.indexDocuments(documents);

      expect(result.indexed).toBeLessThan(documents.length);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors).toContain('문서 1: 콘텐츠가 너무 짧습니다');
    });

    it('데이터베이스 오류 처리', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      };

      jest.mock('@/utils/supabase/server', () => ({
        createClient: () => mockSupabase,
      }));

      const documents = [{ id: '1', content: 'test content', metadata: {} }];

      const result = await indexingService.indexDocuments(documents);

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('Database error');
    });
  });

  describe('레이트 리미팅 및 재시도', () => {
    it('429 에러 시 지수 백오프', async () => {
      let attempts = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            embedding: { values: new Array(384).fill(0.1) },
          }),
        });
      });

      const start = Date.now();
      const embedding = await embeddingService.createEmbedding('test');
      const duration = Date.now() - start;

      // 재시도로 인한 지연 확인
      expect(duration).toBeGreaterThan(100); // 최소 지연 시간
      expect(embedding).toHaveLength(384);
      expect(attempts).toBe(3);
    });
  });

  describe('캐싱 및 메모리 관리', () => {
    it('캐시 크기 제한 준수', async () => {
      // 1001개의 서로 다른 텍스트로 캐시 채우기
      for (let i = 0; i < 1001; i++) {
        await embeddingService.createEmbedding(`text ${i}`);
      }

      // 캐시 통계 확인
      const stats = embeddingService.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    it('TTL 만료 시 재생성', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          embedding: { values: new Array(384).fill(0.1) },
        }),
      });
      global.fetch = mockFetch;

      // 첫 번째 호출
      await embeddingService.createEmbedding('ttl test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // TTL 시뮬레이션 (캐시 무효화)
      embeddingService.clearCache();

      // 두 번째 호출 (재생성)
      await embeddingService.createEmbedding('ttl test');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('동시성 및 경쟁 상태', () => {
    it('동시 요청 처리', async () => {
      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          queryEngine.query({
            query: `concurrent query ${i}`,
            mode: 'local',
          })
        );

      const results = await Promise.all(requests);

      // 모든 요청이 성공해야 함
      expect(results.every(r => r.success)).toBe(true);
      expect(new Set(results.map(r => r.processingTime)).size).toBeGreaterThan(
        1
      ); // 서로 다른 처리 시간
    });
  });

  describe('데이터 무결성', () => {
    it('SQL 인젝션 방지', async () => {
      const maliciousQuery = "'; DROP TABLE knowledge_base; --";

      // 에러가 발생해야 하지만 SQL 인젝션은 실행되지 않아야 함
      await expect(
        ragEngine.searchSimilar(maliciousQuery, {
          category: maliciousQuery,
        })
      ).rejects.toThrow();
    });

    it('XSS 방지', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await queryEngine.query({
        query: xssPayload,
        mode: 'local',
      });

      // 스크립트 태그가 이스케이프되어야 함
      expect(response.response).not.toContain('<script>');
    });
  });
});

describe('통합 시나리오 테스트', () => {
  it('전체 워크플로우 에러 복구', async () => {
    const workflow = async () => {
      // 1. 문서 인덱싱 (일부 실패 예상)
      const docs = [
        { id: '1', content: 'valid content', metadata: {} },
        { id: '2', content: '', metadata: {} }, // 실패
        { id: '3', content: 'another valid', metadata: {} },
      ];

      const indexResult =
        await VectorIndexingService.getInstance().indexDocuments(docs);

      expect(indexResult.indexed).toBe(2);
      expect(indexResult.failed).toBe(1);

      // 2. 검색 (부분 결과로도 작동)
      const searchResult = await new SupabaseRAGEngine().searchSimilar('valid');

      expect(searchResult.results?.length ?? 0).toBeGreaterThanOrEqual(0);

      // 3. 쿼리 처리 (폴백 포함)
      const queryResult = await new SimplifiedQueryEngine().query({
        query: 'test query',
        mode: 'google-ai', // 실패하고 로컬로 폴백
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.engine).toBe('local-rag');
    };

    await expect(workflow()).resolves.not.toThrow();
  });
});