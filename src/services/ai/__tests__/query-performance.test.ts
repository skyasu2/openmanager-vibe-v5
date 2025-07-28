/**
 * SimplifiedQueryEngine 성능 테스트
 * 
 * 목표: 응답 시간 500ms 이하
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimplifiedQueryEngine } from '../SimplifiedQueryEngine';
import { QueryComplexityAnalyzer } from '../query-complexity-analyzer';

// Mock dependencies
vi.mock('../supabase-rag-engine', () => ({
  getSupabaseRAGEngine: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    searchSimilar: vi.fn().mockResolvedValue({
      results: [
        { content: '테스트 응답', similarity: 0.9 },
        { content: '추가 정보', similarity: 0.8 },
      ],
      totalResults: 2,
      cached: false,
    }),
    healthCheck: vi.fn().mockResolvedValue({
      status: 'healthy',
      vectorDB: true,
    }),
  }),
}));

vi.mock('@/services/mcp/CloudContextLoader', () => ({
  CloudContextLoader: {
    getInstance: () => ({
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [
          { path: '/test/file.ts', content: 'test content' },
        ],
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: { status: 'online' },
      }),
    }),
  },
}));

// Mock fetch for Google AI
global.fetch = vi.fn();

describe('SimplifiedQueryEngine Performance', () => {
  let engine: SimplifiedQueryEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SimplifiedQueryEngine();
    
    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  describe('응답 시간 테스트', () => {
    it('로컬 RAG 응답이 500ms 이하여야 함', async () => {
      const startTime = Date.now();
      
      const response = await engine.query({
        query: '서버 상태 확인',
        mode: 'local',
      });

      const elapsedTime = Date.now() - startTime;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag');
      expect(elapsedTime).toBeLessThan(500);
      expect(response.processingTime).toBeLessThan(500);
    });

    it('Google AI 응답이 500ms 이하여야 함 (빠른 응답)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Google AI 응답',
          confidence: 0.9,
          model: 'gemini-pro',
        }),
      });

      const startTime = Date.now();
      
      const response = await engine.query({
        query: '복잡한 분석 요청',
        mode: 'google-ai',
        options: { timeoutMs: 450 },
      });

      const elapsedTime = Date.now() - startTime;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      expect(elapsedTime).toBeLessThan(500);
    });

    it('타임아웃 시 폴백이 작동해야 함', async () => {
      // Google AI를 느리게 만들기
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 600))
      );

      const response = await engine.query({
        query: '타임아웃 테스트',
        mode: 'google-ai',
        options: { timeoutMs: 300 },
      });

      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag'); // 폴백됨
      expect(response.processingTime).toBeLessThan(500);
    });
  });

  describe('쿼리 복잡도 분석', () => {
    it('간단한 쿼리는 로컬로 처리되어야 함', async () => {
      const response = await engine.query({
        query: '서버 목록',
        mode: 'auto',
      });

      expect(response.engine).toBe('local-rag');
      expect(response.metadata?.complexity?.recommendation).toBe('local');
    });

    it('복잡한 쿼리는 Google AI로 처리되어야 함', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '복잡한 분석 결과',
          confidence: 0.95,
        }),
      });

      const response = await engine.query({
        query: '지난 한 달간의 서버 성능을 분석하고, 이상 패턴을 찾아서 향후 개선 방안을 제안해주세요. 특히 CPU와 메모리 사용률의 상관관계를 중점적으로 분석해주세요.',
        mode: 'auto',
      });

      expect(response.engine).toBe('google-ai');
      expect(response.metadata?.complexity?.score).toBeGreaterThan(60);
    });

    it('기술적 쿼리는 로컬로 처리되어야 함', async () => {
      const response = await engine.query({
        query: 'API 엔드포인트 /api/servers의 응답 시간',
        mode: 'auto',
      });

      expect(response.engine).toBe('local-rag');
      expect(response.metadata?.complexity?.factors.patterns).toBeLessThan(40);
    });
  });

  describe('캐싱 성능', () => {
    it('캐시된 응답은 즉시 반환되어야 함', async () => {
      // 첫 번째 쿼리
      const firstResponse = await engine.query({
        query: '캐시 테스트',
        mode: 'local',
      });

      expect(firstResponse.success).toBe(true);
      expect(firstResponse.metadata?.cacheHit).toBeUndefined();

      // 두 번째 쿼리 (캐시됨)
      const startTime = Date.now();
      const cachedResponse = await engine.query({
        query: '캐시 테스트',
        mode: 'local',
      });
      const elapsedTime = Date.now() - startTime;

      expect(cachedResponse.success).toBe(true);
      expect(cachedResponse.metadata?.cacheHit).toBe(true);
      expect(elapsedTime).toBeLessThan(50); // 캐시는 매우 빨라야 함
    });

    it('캐싱이 비활성화되면 새로 처리해야 함', async () => {
      // 첫 번째 쿼리
      await engine.query({
        query: '캐시 비활성화 테스트',
        mode: 'local',
      });

      // 두 번째 쿼리 (캐시 비활성화)
      const response = await engine.query({
        query: '캐시 비활성화 테스트',
        mode: 'local',
        options: { cached: false },
      });

      expect(response.metadata?.cacheHit).toBeUndefined();
    });
  });

  describe('병렬 처리', () => {
    it('MCP 컨텍스트 수집이 비동기로 처리되어야 함', async () => {
      const response = await engine.query({
        query: '병렬 처리 테스트',
        mode: 'google-ai',
        options: { 
          includeMCPContext: true,
          timeoutMs: 450,
        },
      });

      // MCP 처리가 병렬로 진행되므로 전체 시간이 단축됨
      expect(response.processingTime).toBeLessThan(500);
      
      const mcpStep = response.thinkingSteps.find(s => s.step === 'MCP 컨텍스트 수집');
      expect(mcpStep).toBeDefined();
      expect(mcpStep?.duration).toBeDefined();
    });
  });

  describe('복잡도 분석기 단위 테스트', () => {
    it('쿼리 길이에 따른 복잡도 계산', () => {
      const short = QueryComplexityAnalyzer.analyze('상태');
      const medium = QueryComplexityAnalyzer.analyze('서버의 현재 CPU 사용률과 메모리 사용률을 보여주세요');
      const long = QueryComplexityAnalyzer.analyze('지난 24시간 동안의 모든 서버의 성능 지표를 분석하여 이상 징후를 찾고, 각 서버별로 최적화 방안을 제시해주세요. 특히 데이터베이스 서버의 쿼리 성능과 웹 서버의 응답 시간을 중점적으로 살펴봐주세요.');

      expect(short.factors.length).toBeLessThan(30);
      expect(medium.factors.length).toBeGreaterThan(20);
      expect(long.factors.length).toBeGreaterThan(70);
    });

    it('키워드 기반 복잡도 계산', () => {
      const simple = QueryComplexityAnalyzer.analyze('서버 목록 보기');
      const complex = QueryComplexityAnalyzer.analyze('서버 성능을 분석하고 최적화 전략을 제안해주세요');

      expect(simple.factors.keywords).toBeLessThan(30);
      expect(complex.factors.keywords).toBeGreaterThan(50);
    });

    it('기술적 패턴 인식', () => {
      const technical = QueryComplexityAnalyzer.analyze('CPU 메모리 디스크 사용률');
      const general = QueryComplexityAnalyzer.analyze('어떻게 하면 좋을까요?');

      expect(technical.factors.patterns).toBeLessThan(30);
      expect(general.factors.patterns).toBeGreaterThan(30);
    });

    it('엔진 추천이 적절해야 함', () => {
      const simpleQuery = QueryComplexityAnalyzer.analyze('서버 상태');
      const complexQuery = QueryComplexityAnalyzer.analyze('지난 한 달간의 모든 서버의 성능 추이를 분석하고, 머신러닝을 활용하여 향후 3개월간의 성능을 예측해주세요. 또한 예상되는 병목 지점과 대응 방안을 제시해주세요.');
      const hybridQuery = QueryComplexityAnalyzer.analyze('서버 성능을 분석해서 개선점을 찾아주세요');

      expect(simpleQuery.recommendation).toBe('local');
      expect(complexQuery.recommendation).toBe('google-ai');
      expect(hybridQuery.score).toBeGreaterThanOrEqual(40);
      expect(hybridQuery.score).toBeLessThan(70);
    });
  });

  describe('에러 처리 및 폴백', () => {
    it('초기화 실패 시에도 쿼리 처리가 가능해야 함', async () => {
      // 새 인스턴스로 테스트
      const failEngine = new SimplifiedQueryEngine();
      
      // RAG 엔진 초기화 실패 시뮬레이션
      vi.mocked(failEngine['ragEngine'].initialize).mockRejectedValueOnce(
        new Error('초기화 실패')
      );

      const response = await failEngine.query({
        query: '초기화 실패 테스트',
        mode: 'local',
      });

      expect(response.success).toBe(true);
    });

    it('모든 엔진 실패 시 폴백 응답 반환', async () => {
      // RAG 검색 실패
      vi.mocked(engine['ragEngine'].searchSimilar).mockRejectedValueOnce(
        new Error('RAG 검색 실패')
      );

      const response = await engine.query({
        query: '완전 실패 테스트',
        mode: 'local',
        options: { timeoutMs: 200 },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});