/**
 * 🧪 SimplifiedQueryEngine 포괄적 단위 테스트
 * 
 * 테스트 커버리지 목표: 90% 이상
 * - 모든 public 메서드
 * - 모든 조건 분기
 * - 에러 처리
 * - 캐싱 로직
 * - 타임아웃 처리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimplifiedQueryEngine, getSimplifiedQueryEngine } from '../SimplifiedQueryEngine';
import type {
  QueryRequest,
  QueryResponse,
} from '../SimplifiedQueryEngine';
import type { AIQueryContext } from '@/types/ai-service-types';
import { getSupabaseRAGEngine } from '../supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { createStandardServerMock } from '@/test/helpers/server-mocks';
import { QueryComplexityAnalyzer } from '../query-complexity-analyzer';
import * as cacheConfig from '@/config/free-tier-cache-config';

// Mock dependencies
vi.mock('../supabase-rag-engine');
vi.mock('@/services/mcp/CloudContextLoader');
vi.mock('../query-complexity-analyzer');
vi.mock('@/config/free-tier-cache-config');

// Mock fetch globally
global.fetch = vi.fn();

// Create proper timeout for tests
const TEST_TIMEOUT = 5000; // 5 seconds

describe('SimplifiedQueryEngine', () => {
  let engine: SimplifiedQueryEngine;
  let mockRAGEngine: any;
  let mockContextLoader: any;
  let originalSetInterval: typeof global.setInterval;
  let originalClearTimeout: typeof global.clearTimeout;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Save original timer functions
    originalSetInterval = global.setInterval;
    originalClearTimeout = global.clearTimeout;
    
    // Mock RAG engine with shorter timeouts
    mockRAGEngine = {
      _initialize: vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(resolve, 10); // Very short delay
        });
      }),
      searchSimilar: vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            results: [
              {
                content: 'Test result content',
                similarity: 0.9,
                metadata: { category: 'test' },
              },
            ],
            totalResults: 1,
            cached: false,
          }), 10);
        });
      }),
      healthCheck: vi.fn().mockResolvedValue({
        status: 'healthy',
        vectorDB: true,
      }),
    };
    
    // Mock context loader with quick responses
    mockContextLoader = {
      queryMCPContextForRAG: vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            files: [
              {
                path: '/test/file.ts',
                content: 'test file content',
              },
            ],
            systemContext: {},
          }), 10);
        });
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: { status: 'online' },
      }),
    };
    
    // Mock complexity analyzer
    vi.mocked(QueryComplexityAnalyzer.analyze).mockReturnValue({
      score: 50,
      recommendation: 'local',
      confidence: 0.85,
      factors: {
        length: 10,
        keywords: 1,
        patterns: 0,
        context: 1,
        language: 0,
      },
    });
    
    // Mock cache config
    vi.mocked(cacheConfig.createCacheKey).mockImplementation((prefix, key) => `${prefix}:${key}`);
    vi.mocked(cacheConfig.getTTL).mockReturnValue(900); // 15 minutes
    vi.mocked(cacheConfig.validateDataSize).mockReturnValue(true);
    
    // Mock static methods
    vi.mocked(getSupabaseRAGEngine).mockReturnValue(mockRAGEngine);
    vi.mocked(CloudContextLoader.getInstance).mockReturnValue(mockContextLoader);
    
    engine = new SimplifiedQueryEngine();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    // Restore original timer functions
    global.setInterval = originalSetInterval;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with required dependencies', () => {
      expect(engine).toBeDefined();
      expect(getSupabaseRAGEngine).toHaveBeenCalled();
      expect(CloudContextLoader.getInstance).toHaveBeenCalled();
    });

    it('should set up cache cleanup interval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      new SimplifiedQueryEngine();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it('should initialize only once', async () => {
      // Initialize and advance timers
      const initPromise = engine._initialize();
      vi.advanceTimersByTime(100);
      await initPromise;

      // Second initialization should not call RAG engine again
      const initPromise2 = engine._initialize();
      vi.advanceTimersByTime(100);
      await initPromise2;

      const initPromise3 = engine._initialize();
      vi.advanceTimersByTime(100);
      await initPromise3;
      
      expect(mockRAGEngine._initialize).toHaveBeenCalledTimes(1);
    }, TEST_TIMEOUT);

    it('should handle initialization timeout', async () => {
      // Mock a long initialization
      mockRAGEngine._initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const initPromise = engine._initialize();
      
      // Advance beyond timeout threshold
      vi.advanceTimersByTime(5001);
      await initPromise;
      
      expect(engine['isInitialized']).toBe(true);
    }, TEST_TIMEOUT);

    it('should handle initialization errors gracefully', async () => {
      mockRAGEngine._initialize.mockRejectedValue(new Error('Init failed'));
      
      const initPromise = engine._initialize();
      vi.advanceTimersByTime(100);
      
      await expect(initPromise).resolves.toBeUndefined();
      expect(engine['isInitialized']).toBe(true);
    }, TEST_TIMEOUT);

    it('should handle concurrent initialization requests', async () => {
      const promises = [
        engine._initialize(),
        engine._initialize(),
        engine._initialize(),
      ];
      
      // Advance timers to complete initialization
      vi.advanceTimersByTime(100);
      
      await Promise.all(promises);
      expect(mockRAGEngine._initialize).toHaveBeenCalledTimes(1);
    }, TEST_TIMEOUT);
  });

  describe('Query Processing - Basic', () => {
    it('should handle empty query', async () => {
      const queryPromise = engine.query({ query: '' });
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toBe('질의를 입력해 주세요');
      expect(response.engine).toBe('local-rag');
      expect(response.confidence).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle whitespace-only query', async () => {
      const queryPromise = engine.query({ query: '   \t\n   ' });
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toBe('질의를 입력해 주세요');
    }, TEST_TIMEOUT);

    it('should process simple query in auto mode', async () => {
      const queryPromise = engine.query({
        query: '서버 상태 확인',
        mode: 'auto',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag');
      expect(QueryComplexityAnalyzer.analyze).toHaveBeenCalled();
    }, TEST_TIMEOUT);

    it('should process query with specific mode', async () => {
      const queryPromise = engine.query({
        query: '테스트 쿼리',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag');
      expect(mockRAGEngine.searchSimilar).toHaveBeenCalled();
    }, TEST_TIMEOUT);
  });

  describe('Query Processing - Local Mode', () => {
    it('should process local query with RAG results', async () => {
      const queryPromise = engine.query({
        query: '서버 모니터링 방법',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toContain('Test result content');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata?.ragResults).toBe(1);
    }, TEST_TIMEOUT);

    it('should handle empty RAG results', async () => {
      mockRAGEngine.searchSimilar.mockResolvedValue({
        results: [],
        totalResults: 0,
        cached: false,
      });
      
      const queryPromise = engine.query({
        query: '없는 정보',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toContain('관련된 정보를 찾을 수 없습니다');
      expect(response.confidence).toBe(0.1);
    }, TEST_TIMEOUT);

    it('should handle server context in local mode', async () => {
      const context: AIQueryContext = {
        servers: [
          createStandardServerMock({
            id: 'srv-001',
            name: 'test-server',
            status: 'warning',
            cpu: 85,
            memory: 70,
            disk: 50,
            network: 100,
          }),
        ],
      };
      
      const queryPromise = engine.query({
        query: 'CPU가 높은 서버',
        mode: 'local',
        context,
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toContain('test-server');
      expect(response.response).toContain('85%');
    }, TEST_TIMEOUT);

    it('should include MCP context when available', async () => {
      const queryPromise = engine.query({
        query: '프로젝트 구조',
        mode: 'local',
        options: { includeMCPContext: true },
      });
      
      // Wait for MCP context to be fetched
      vi.advanceTimersByTime(100);
      await queryPromise;
      
      expect(mockContextLoader.queryMCPContextForRAG).toHaveBeenCalled();
    }, TEST_TIMEOUT);

    it('should adjust search parameters based on complexity', async () => {
      // Low complexity
      vi.mocked(QueryComplexityAnalyzer.analyze).mockReturnValue({
        score: 20,
        recommendation: 'local',
        confidence: 0.95,
        factors: {
          length: 5,
          keywords: 1,
          patterns: 0,
          context: 0,
          language: 0,
        },
      });
      
      const queryPromise = engine.query({
        query: '간단한 질문',
        mode: 'auto',
      });
      
      vi.advanceTimersByTime(100);
      await queryPromise;
      
      expect(mockRAGEngine.searchSimilar).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxResults: 3,
          threshold: 0.6,
        })
      );
    }, TEST_TIMEOUT);
  });

  describe('Query Processing - Google AI Mode', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            response: 'Google AI response',
            confidence: 0.95,
            model: 'gemini-pro',
            tokensUsed: 100,
          }),
        } as Response);
      });
    });

    it('should process Google AI query successfully', async () => {
      const queryPromise = engine.query({
        query: '복잡한 기술 질문',
        mode: 'google-ai',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.response).toBe('Google AI response');
      expect(response.engine).toBe('google-ai');
      expect(response.confidence).toBe(0.95);
      expect(response.metadata?.model).toBe('gemini-pro');
    }, TEST_TIMEOUT);

    it('should include context in Google AI prompt', async () => {
      const context: AIQueryContext = {
        servers: [createStandardServerMock({ id: '1', name: 'server1', status: 'healthy' })],
        previousQueries: ['이전 질문'],
      };
      
      const queryPromise = engine.query({
        query: '서버 분석',
        mode: 'google-ai',
        context,
      });
      
      vi.advanceTimersByTime(100);
      await queryPromise;
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/google-ai/generate',
        expect.objectContaining({
          body: expect.stringContaining('서버 분석'),
        })
      );
    }, TEST_TIMEOUT);

    it('should handle Google AI API errors with fallback', async () => {
      vi.mocked(global.fetch).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        } as Response);
      });
      
      const queryPromise = engine.query({
        query: 'API 오류 테스트',
        mode: 'google-ai',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag'); // Fallback to local
    }, TEST_TIMEOUT);

    it('should handle Google AI timeout with fallback', async () => {
      // Mock fetch to return a hanging promise
      vi.mocked(global.fetch).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );
      
      const queryPromise = engine.query({
        query: '타임아웃 테스트',
        mode: 'google-ai',
        options: { timeoutMs: 200 },
      });
      
      // Advance timers to trigger timeout
      vi.advanceTimersByTime(300);
      const response = await queryPromise;
      
      // Should fallback to local RAG after timeout
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag'); // Fallback to local
    }, TEST_TIMEOUT);

    it('should adjust parameters based on complexity', async () => {
      vi.mocked(QueryComplexityAnalyzer.analyze).mockReturnValue({
        score: 80,
        recommendation: 'google-ai',
        confidence: 0.9,
        factors: {
          length: 50,
          keywords: 3,
          patterns: 2,
          context: 5,
          language: 1,
        },
      });
      
      const queryPromise = engine.query({
        query: '매우 복잡한 질문',
        mode: 'auto',
      });
      
      vi.advanceTimersByTime(100);
      await queryPromise;
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.8'),
        })
      );
    }, TEST_TIMEOUT);
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const request: QueryRequest = {
        query: '캐시 테스트',
        mode: 'local',
      };
      
      const response1Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      const response1 = await response1Promise;
      
      const response2Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      const response2 = await response2Promise;
      
      expect(response2.metadata?.cacheHit).toBe(true);
      expect(mockRAGEngine.searchSimilar).toHaveBeenCalledTimes(1);
    }, TEST_TIMEOUT);

    it('should not cache when cached option is false', async () => {
      const request: QueryRequest = {
        query: '캐시 비활성화',
        mode: 'local',
        options: { cached: false },
      };
      
      const query1Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      await query1Promise;
      
      const query2Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      await query2Promise;
      
      expect(mockRAGEngine.searchSimilar).toHaveBeenCalledTimes(2);
    }, TEST_TIMEOUT);

    it('should respect cache TTL', async () => {
      const request: QueryRequest = {
        query: 'TTL 테스트',
        mode: 'local',
      };
      
      const query1Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      await query1Promise;
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(16 * 60 * 1000); // 16 minutes
      
      const query2Promise = engine.query(request);
      vi.advanceTimersByTime(100);
      const response = await query2Promise;
      
      expect(response.metadata?.cacheHit).toBeFalsy();
    }, TEST_TIMEOUT);

    it('should cleanup expired cache entries', async () => {
      // Add some cache entries
      const query1Promise = engine.query({ query: 'query1', mode: 'local' });
      vi.advanceTimersByTime(100);
      await query1Promise;
      
      const query2Promise = engine.query({ query: 'query2', mode: 'local' });
      vi.advanceTimersByTime(100);
      await query2Promise;
      
      // Advance time to trigger cleanup
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      // Add new query after some entries expired
      vi.advanceTimersByTime(11 * 60 * 1000); // Total 16 minutes
      
      const queryPromise = engine.query({ query: 'query1', mode: 'local' });
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.metadata?.cacheHit).toBeFalsy();
    }, TEST_TIMEOUT);

    it('should limit cache size', async () => {
      // Fill cache to limit
      const promises = [];
      for (let i = 0; i < 101; i++) {
        promises.push(engine.query({ query: `query${i}`, mode: 'local' }));
      }
      
      vi.advanceTimersByTime(1000);
      await Promise.all(promises);
      
      // First query should have been evicted
      const queryPromise = engine.query({ query: 'query0', mode: 'local' });
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.metadata?.cacheHit).toBeFalsy();
    }, TEST_TIMEOUT);

    it('should validate data size before caching', async () => {
      vi.mocked(cacheConfig.validateDataSize).mockReturnValue(false);
      
      const query1Promise = engine.query({ query: 'large data', mode: 'local' });
      vi.advanceTimersByTime(100);
      await query1Promise;
      
      const query2Promise = engine.query({ query: 'large data', mode: 'local' });
      vi.advanceTimersByTime(100);
      const response = await query2Promise;
      
      expect(response.metadata?.cacheHit).toBeFalsy();
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle RAG engine errors', async () => {
      mockRAGEngine.searchSimilar.mockRejectedValue(new Error('RAG error'));
      
      const queryPromise = engine.query({
        query: 'RAG 오류 테스트',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      // When RAG fails, it should return an error response
      expect(response.success).toBe(false);
      expect(response.error).toContain('RAG error');
      expect(response.response).toContain('쿼리 처리 중 오류가 발생했습니다');
    }, TEST_TIMEOUT);

    it('should handle MCP context errors gracefully', async () => {
      mockContextLoader.queryMCPContextForRAG.mockRejectedValue(new Error('MCP error'));
      
      const queryPromise = engine.query({
        query: 'MCP 오류 테스트',
        mode: 'google-ai',
        options: { includeMCPContext: true },
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true); // Should still work
      expect(response.thinkingSteps.some(step => step.status === 'failed')).toBe(true);
    }, TEST_TIMEOUT);

    it('should handle fetch errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));
      
      const queryPromise = engine.query({
        query: '네트워크 오류',
        mode: 'google-ai',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag'); // Fallback
    }, TEST_TIMEOUT);

    it('should handle abort controller errors', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      vi.mocked(global.fetch).mockRejectedValue(abortError);
      
      const queryPromise = engine.query({
        query: '중단 오류',
        mode: 'google-ai',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.success).toBe(true);
      expect(response.engine).toBe('local-rag');
    }, TEST_TIMEOUT);
  });

  describe('Timeout Handling', () => {
    it('should respect custom timeout', async () => {
      mockRAGEngine.searchSimilar.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const responsePromise = engine.query({
        query: '타임아웃 테스트',
        mode: 'local',
        options: { timeoutMs: 100 },
      });
      
      vi.advanceTimersByTime(101);
      const response = await responsePromise;
      
      expect(response.engine).toBe('fallback');
    }, TEST_TIMEOUT);

    it('should use default timeout', async () => {
      mockRAGEngine.searchSimilar.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const responsePromise = engine.query({
        query: '기본 타임아웃',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(451);
      const response = await responsePromise;
      
      expect(response.engine).toBe('fallback');
    }, TEST_TIMEOUT);
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      const healthPromise = engine.healthCheck();
      vi.advanceTimersByTime(100);
      const health = await healthPromise;
      
      expect(health.status).toBe('healthy');
      expect(health.engines.localRAG).toBe(true);
      expect(health.engines.googleAI).toBe(true);
      expect(health.engines.mcp).toBe(true);
    }, TEST_TIMEOUT);

    it('should report degraded status when RAG is unhealthy', async () => {
      mockRAGEngine.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        vectorDB: false,
      });
      
      const healthPromise = engine.healthCheck();
      vi.advanceTimersByTime(100);
      const health = await healthPromise;
      
      expect(health.status).toBe('degraded');
      expect(health.engines.localRAG).toBe(false);
    }, TEST_TIMEOUT);

    it('should handle MCP offline status', async () => {
      mockContextLoader.getIntegratedStatus.mockResolvedValue({
        mcpServer: { status: 'offline' },
      });
      
      const healthPromise = engine.healthCheck();
      vi.advanceTimersByTime(100);
      const health = await healthPromise;
      
      expect(health.engines.mcp).toBe(false);
    }, TEST_TIMEOUT);
  });

  describe('Complex Scenarios', () => {
    it('should handle auto mode with hybrid recommendation', async () => {
      vi.mocked(QueryComplexityAnalyzer.analyze).mockReturnValue({
        score: 60,
        recommendation: 'hybrid',
        confidence: 0.8,
        factors: {
          length: 30,
          keywords: 3,
          patterns: 0,
          context: 3,
          language: 0,
        },
      });
      
      const queryPromise = engine.query({
        query: '하이브리드 추천 질문',
        mode: 'auto',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.engine).toBe('local-rag');
    }, TEST_TIMEOUT);

    it('should process multiple RAG results', async () => {
      mockRAGEngine.searchSimilar.mockResolvedValue({
        results: [
          { content: 'Result 1', similarity: 0.9 },
          { content: 'Result 2', similarity: 0.8 },
          { content: 'Result 3', similarity: 0.7 },
        ],
        totalResults: 3,
        cached: false,
      });
      
      const queryPromise = engine.query({
        query: '다중 결과 테스트',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.response).toContain('Result 1');
      expect(response.response).toContain('추가 정보');
    }, TEST_TIMEOUT);

    it('should handle server status summary query', async () => {
      const context: AIQueryContext = {
        servers: [
          createStandardServerMock({ id: '1', name: 'srv1', status: 'healthy' }),
          createStandardServerMock({ id: '2', name: 'srv2', status: 'warning' }),
          createStandardServerMock({ id: '3', name: 'srv3', status: 'critical' }),
          createStandardServerMock({ id: '4', name: 'srv4', status: 'offline' }),
        ],
      };
      
      const queryPromise = engine.query({
        query: '서버 상태 요약',
        mode: 'local',
        context,
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.response).toContain('정상: 1대');
      expect(response.response).toContain('주의: 1대');
      expect(response.response).toContain('위험: 2대');
    }, TEST_TIMEOUT);

    it('should handle concurrent queries', async () => {
      const queries = [
        engine.query({ query: 'query1', mode: 'local' }),
        engine.query({ query: 'query2', mode: 'google-ai' }),
        engine.query({ query: 'query3', mode: 'auto' }),
      ];
      
      vi.advanceTimersByTime(200);
      const responses = await Promise.all(queries);
      
      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.success)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = getSimplifiedQueryEngine();
      const instance2 = getSimplifiedQueryEngine();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Thinking Steps', () => {
    it('should track all processing steps', async () => {
      const queryPromise = engine.query({
        query: '단계 추적 테스트',
        mode: 'auto',
        options: { includeMCPContext: true },
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      const stepTypes = response.thinkingSteps.map(s => s.step);
      expect(stepTypes).toContain('쿼리 복잡도 분석');
      expect(stepTypes).toContain('RAG 검색');
      expect(stepTypes).toContain('응답 생성');
    }, TEST_TIMEOUT);

    it('should include timing information', async () => {
      const queryPromise = engine.query({
        query: '타이밍 테스트',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      const stepsWithDuration = response.thinkingSteps.filter(s => s.duration);
      expect(stepsWithDuration.length).toBeGreaterThan(0);
      expect(stepsWithDuration.every(s => s.duration! >= 0)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Performance Constraints', () => {
    it('should complete within 500ms target', async () => {
      const start = Date.now();
      const queryPromise = engine.query({
        query: '성능 테스트',
        mode: 'local',
      });
      
      vi.advanceTimersByTime(100);
      const response = await queryPromise;
      
      expect(response.processingTime).toBeLessThan(500);
    }, TEST_TIMEOUT);

    it('should not cache slow responses', async () => {
      mockRAGEngine.searchSimilar.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            results: [{ content: 'Slow result', similarity: 0.9 }],
            totalResults: 1,
            cached: false,
          }), 600)
        )
      );
      
      const query1Promise = engine.query({ 
        query: '느린 응답', 
        mode: 'local', 
        options: { timeoutMs: 1000 } 
      });
      
      vi.advanceTimersByTime(700);
      await query1Promise;
      
      // Should not be cached due to slow response
      const query2Promise = engine.query({ query: '느린 응답', mode: 'local' });
      vi.advanceTimersByTime(100);
      const response2 = await query2Promise;
      
      expect(response2.metadata?.cacheHit).toBeFalsy();
    }, TEST_TIMEOUT);
  });
});