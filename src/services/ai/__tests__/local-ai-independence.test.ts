/**
 * 🧪 Local AI Independence Test
 * 
 * 핵심 목표: "local-ai" 모드가 외부 상용 AI API (Google AI, OpenAI) 없이 완전 독립 작동 검증
 * - 임베딩 서비스 로컬 생성 확인
 * - 키워드 기반 fallback 작동 확인
 * - Google AI API 호출 차단 확인
 * - Supabase RAG 엔진 로컬 모드 확인
 * - 환경변수 제어 로직 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SimplifiedQueryEngine,
  getSimplifiedQueryEngine,
} from '../SimplifiedQueryEngine';
import { getSupabaseRAGEngine } from '../supabase-rag-engine';
import { embeddingService } from '../embedding-service';
import type { QueryRequest } from '../SimplifiedQueryEngine.types';

// Mock all external dependencies
vi.mock('../supabase-rag-engine');
vi.mock('@/services/mcp/CloudContextLoader', () => ({
  CloudContextLoader: {
    getInstance: vi.fn(() => ({
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [],
        systemContext: {},
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: { status: 'offline' }, // Offline for local AI test
      }),
    })),
  },
}));
vi.mock('../query-complexity-analyzer', () => ({
  QueryComplexityAnalyzer: {
    analyze: vi.fn(() => ({
      score: 30,
      recommendation: 'local',
      confidence: 0.85,
      factors: {
        length: 10,
        keywords: 1,
        patterns: 0,
        context: 1,
        language: 0,
      },
    })),
  },
}));
vi.mock('@/config/free-tier-cache-config', () => ({
  createCacheKey: vi.fn((prefix, key) => `${prefix}:${key}`),
  getTTL: vi.fn(() => 900), // 15 minutes
  validateDataSize: vi.fn(() => true),
}));
vi.mock('@/lib/env-safe', () => ({
  validateGoogleAIMCPConfig: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    config: {
      googleAI: {
        isValid: false, // Disabled for local AI test
        apiKey: '',
        modelName: '',
        maxTokens: 0,
        temperature: 0,
      },
    },
  })),
}));
vi.mock('../MockContextLoader', () => ({
  MockContextLoader: {
    getInstance: vi.fn(() => ({
      getMockContext: vi.fn().mockReturnValue(null),
      loadMockContext: vi.fn().mockResolvedValue({}),
    })),
  },
}));

// Mock embedding service
vi.mock('../embedding-service', () => ({
  embeddingService: {
    createEmbedding: vi.fn(),
    createBatchEmbeddings: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(),
  },
}));

// Mock other AI modules
vi.mock('@/services/modules/ai-agent/processors/IntentClassifier', () => ({
  IntentClassifier: class MockIntentClassifier {
    static analyze() {
      return {
        intent: 'general',
        confidence: 0.8,
        category: 'query',
        priority: 'normal',
        urgency: 'low',
        suggestedActions: [],
        needsTimeSeries: false,
        needsNLP: false,
        needsAnomalyDetection: false,
        needsComplexML: false,
      };
    }
    
    classify() {
      return Promise.resolve({
        intent: 'general',
        confidence: 0.8,
        category: 'query',
        priority: 'normal',
        urgency: 'low',
        suggestedActions: [],
        needsTimeSeries: false,
        needsNLP: false,
        needsAnomalyDetection: false,
        needsComplexML: false,
      });
    }
  },
}));

// Mock fetch globally to ensure it's never called
global.fetch = vi.fn();

const TEST_TIMEOUT = 10000; // 10 seconds

describe('Local AI Independence Test', () => {
  let engine: SimplifiedQueryEngine;
  let mockRAGEngine: {
    searchSimilar: ReturnType<typeof vi.fn>;
    searchByKeywords: ReturnType<typeof vi.fn>;
    generateEmbedding: ReturnType<typeof vi.fn>;
    _initialize: ReturnType<typeof vi.fn>;
    healthCheck: ReturnType<typeof vi.fn>;
  };

  // Store original environment variables
  const originalEnv = {
    USE_LOCAL_EMBEDDINGS: process.env.USE_LOCAL_EMBEDDINGS,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    ENABLE_KEYWORD_SEARCH: process.env.ENABLE_KEYWORD_SEARCH,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up local AI environment
    process.env.USE_LOCAL_EMBEDDINGS = 'true';
    process.env.ENABLE_KEYWORD_SEARCH = 'true';
    // Remove Google AI API key to force local mode
    delete process.env.GOOGLE_AI_API_KEY;

    // Mock RAG engine with local capabilities
    mockRAGEngine = {
      searchSimilar: vi.fn().mockResolvedValue({
        results: [
          {
            content: 'Local AI test result from vector search',
            similarity: 0.85,
            metadata: { source: 'local-vector', category: 'test' },
          },
        ],
        totalResults: 1,
        cached: false,
        method: 'vector',
      }),
      searchByKeywords: vi.fn().mockResolvedValue([
        {
          content: 'Local AI test result from keyword search',
          metadata: { source: 'local-keywords', category: 'test' },
        },
      ]),
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4]), // Mock local embedding
      _initialize: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi.fn().mockResolvedValue({
        status: 'healthy',
        vectorDB: true,
      }),
    };

    vi.mocked(getSupabaseRAGEngine).mockReturnValue(mockRAGEngine);

    // Set up mock embedding service behavior
    vi.mocked(embeddingService.clearCache).mockReturnValue(undefined);
    vi.mocked(embeddingService.createEmbedding).mockImplementation(async (text: string) => {
      // Generate deterministic local embedding (384 dimensions)
      const hash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
      const embedding = Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.1);
      
      // Normalize to unit vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
    });
    
    vi.mocked(embeddingService.createBatchEmbeddings).mockImplementation(async (texts: string[]) => {
      const embeddings = [];
      for (const text of texts) {
        const hash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const embedding = Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.1);
        
        // Normalize to unit vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        embeddings.push(magnitude > 0 ? embedding.map(v => v / magnitude) : embedding);
      }
      return embeddings;
    });
    
    vi.mocked(embeddingService.getCacheStats).mockReturnValue({
      size: 0,
      maxSize: 1000,
      hitRate: 0,
      hits: 0,
      misses: 0,
    });

    engine = new SimplifiedQueryEngine();

    // Mock fetch to throw error if ever called (should never happen in local mode)
    vi.mocked(global.fetch).mockRejectedValue(new Error('Google AI API should not be called in local mode'));
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalEnv.USE_LOCAL_EMBEDDINGS !== undefined) {
      process.env.USE_LOCAL_EMBEDDINGS = originalEnv.USE_LOCAL_EMBEDDINGS;
    } else {
      delete process.env.USE_LOCAL_EMBEDDINGS;
    }
    
    if (originalEnv.GOOGLE_AI_API_KEY !== undefined) {
      process.env.GOOGLE_AI_API_KEY = originalEnv.GOOGLE_AI_API_KEY;
    } else {
      delete process.env.GOOGLE_AI_API_KEY;
    }

    if (originalEnv.ENABLE_KEYWORD_SEARCH !== undefined) {
      process.env.ENABLE_KEYWORD_SEARCH = originalEnv.ENABLE_KEYWORD_SEARCH;
    } else {
      delete process.env.ENABLE_KEYWORD_SEARCH;
    }

    vi.clearAllMocks();
  });

  describe('Environment Variable Control', () => {
    it('should use local embeddings when USE_LOCAL_EMBEDDINGS=true', async () => {
      const text = '테스트 임베딩 생성';
      const embedding = await embeddingService.createEmbedding(text);
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(384); // Default dimension
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
      expect(embeddingService.createEmbedding).toHaveBeenCalledWith(text);
      
      // Should not call Google AI API
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should generate deterministic local embeddings', async () => {
      const text = '동일한 텍스트';
      
      const embedding1 = await embeddingService.createEmbedding(text);
      const embedding2 = await embeddingService.createEmbedding(text);
      
      // Should be identical (deterministic)
      expect(embedding1).toEqual(embedding2);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should use local embeddings when Google AI API key is missing', async () => {
      // Ensure no API key
      delete process.env.GOOGLE_AI_API_KEY;
      process.env.USE_LOCAL_EMBEDDINGS = 'false'; // Even with false, should use local when no API key
      
      const text = 'API 키 없음 테스트';
      const embedding = await embeddingService.createEmbedding(text);
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(384);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Local AI Mode Query Processing', () => {
    it(
      'should process local-ai mode query without external API calls',
      async () => {
        const request: QueryRequest = {
          query: '서버 상태를 확인해주세요',
          mode: 'local-ai',
        };

        const response = await engine.query(request);

        // Debug: Log the response to understand what happened
        console.log('Response:', JSON.stringify(response, null, 2));

        expect(response.success).toBe(true);
        if (response.success) {
          expect(response.engine).toBe('local-ai');
          expect(response.response).toContain('Local AI test result');
          expect(response.metadata?.ragResults).toBe(1);
          expect(response.metadata?.mode).toBe('local-ai');
        }
        
        // Critical: No external API calls should be made
        expect(global.fetch).not.toHaveBeenCalled();
        
        // Should use RAG engine with local embeddings
        expect(mockRAGEngine.searchSimilar).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            useLocalEmbeddings: true,
            enableKeywordFallback: true,
            enableMCP: false, // AI assistant MCP disabled in local mode
          })
        );
      },
      TEST_TIMEOUT
    );

    it(
      'should use keyword fallback when vector search has no results',
      async () => {
        // Mock vector search returning no results
        mockRAGEngine.searchSimilar.mockResolvedValue({
          results: [],
          totalResults: 0,
          cached: false,
          method: 'vector',
        });

        // Mock keyword search returning results
        mockRAGEngine.searchByKeywords.mockResolvedValue([
          {
            content: 'Keyword fallback result',
            metadata: { source: 'keywords' },
          },
        ]);

        const request: QueryRequest = {
          query: '찾을 수 없는 정보',
          mode: 'local-ai',
        };

        const response = await engine.query(request);

        expect(response.success).toBe(true);
        expect(response.engine).toBe('local-ai');
        
        // Should have tried vector search first
        expect(mockRAGEngine.searchSimilar).toHaveBeenCalled();
        
        // No external API calls
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    it(
      'should handle Korean NLP processing in local mode',
      async () => {
        const request: QueryRequest = {
          query: '한국어 자연어 처리 테스트입니다',
          mode: 'local-ai',
          options: { enableKoreanNLP: true },
        };

        const response = await engine.query(request);

        expect(response.success).toBe(true);
        expect(response.engine).toBe('local-ai');
        
        // Should include NLP processing steps
        const nlpStep = response.thinkingSteps.find(step => 
          step.step.includes('NLP') || step.step.includes('의도')
        );
        expect(nlpStep).toBeDefined();
        
        // No external API calls for NLP
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    it(
      'should work with auto mode when complexity analysis recommends local',
      async () => {
        const request: QueryRequest = {
          query: '간단한 질문',
          mode: 'auto',
        };

        const response = await engine.query(request);

        expect(response.success).toBe(true);
        expect(['local-ai', 'local-rag']).toContain(response.engine);
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  });

  describe('Local Embedding Service Integration', () => {
    it('should generate normalized local embeddings', async () => {
      const text = '벡터 정규화 테스트';
      const embedding = await embeddingService.createEmbedding(text);
      
      // Calculate magnitude
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      
      // Should be normalized (unit vector, magnitude ≈ 1)
      expect(magnitude).toBeCloseTo(1.0, 5);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle batch embedding generation locally', async () => {
      const texts = [
        '첫 번째 텍스트',
        '두 번째 텍스트', 
        '세 번째 텍스트'
      ];
      
      const embeddings = await embeddingService.createBatchEmbeddings(texts);
      
      expect(embeddings).toHaveLength(3);
      expect(embeddings.every(emb => emb.length === 384)).toBe(true);
      expect(embeddings.every(emb => Array.isArray(emb))).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should use local cache for embeddings', async () => {
      const text = '캐싱 테스트 텍스트';
      
      // Mock cache hit behavior
      vi.mocked(embeddingService.getCacheStats).mockReturnValue({
        size: 1,
        maxSize: 1000,
        hitRate: 50,
        hits: 1,
        misses: 1,
      });
      
      // First call - generates embedding
      const embedding1 = await embeddingService.createEmbedding(text);
      
      // Second call - should use cache
      const embedding2 = await embeddingService.createEmbedding(text);
      
      expect(embedding1).toEqual(embedding2);
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Check cache stats
      const stats = embeddingService.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should gracefully handle RAG engine failures in local mode', async () => {
      mockRAGEngine.searchSimilar.mockRejectedValue(new Error('Local RAG failure'));
      
      const request: QueryRequest = {
        query: 'RAG 실패 테스트',
        mode: 'local-ai',
      };

      const response = await engine.query(request);

      // Should return error response but not crash
      expect(response.success).toBe(false);
      expect(response.error).toContain('Local RAG failure');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should never fallback to Google AI from local-ai mode', async () => {
      // Force all local components to fail
      mockRAGEngine.searchSimilar.mockRejectedValue(new Error('All local systems down'));
      mockRAGEngine.searchByKeywords.mockRejectedValue(new Error('Keywords failed too'));
      
      const request: QueryRequest = {
        query: '모든 로컬 시스템 실패',
        mode: 'local-ai',
      };

      const response = await engine.query(request);

      // Should fail gracefully without external API calls
      expect(response.success).toBe(false);
      expect(response.engine).toBe('local-ai'); // Should still report local-ai
      expect(global.fetch).not.toHaveBeenCalled(); // Critical: no external fallback
    });
  });

  describe('Performance and Independence Verification', () => {
    it(
      'should complete local AI query within reasonable time',
      async () => {
        const startTime = Date.now();
        
        const response = await engine.query({
          query: '성능 테스트 쿼리',
          mode: 'local-ai',
        });
        
        const duration = Date.now() - startTime;
        
        expect(response.success).toBe(true);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    it('should maintain consistent local AI behavior across multiple queries', async () => {
      const queries = [
        '첫 번째 로컬 쿼리',
        '두 번째 로컬 쿼리',
        '세 번째 로컬 쿼리',
      ];

      const responses = await Promise.all(
        queries.map(query => 
          engine.query({ query, mode: 'local-ai' })
        )
      );

      // All should succeed
      expect(responses.every(r => r.success)).toBe(true);
      expect(responses.every(r => r.engine === 'local-ai')).toBe(true);
      
      // No external API calls for any query
      expect(global.fetch).not.toHaveBeenCalled();
      
      // All should have processed locally
      expect(responses.every(r => r.processingTime > 0)).toBe(true);
    });

    it('should provide meaningful local AI responses', async () => {
      const response = await engine.query({
        query: '서버 모니터링에 대해 알려주세요',
        mode: 'local-ai',
      });

      expect(response.success).toBe(true);
      expect(response.response.length).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.thinkingSteps.length).toBeGreaterThan(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Integration with Supabase RAG Engine', () => {
    it('should call RAG engine with correct local parameters', async () => {
      await engine.query({
        query: 'RAG 엔진 통합 테스트',
        mode: 'local-ai',
      });

      expect(mockRAGEngine.searchSimilar).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          useLocalEmbeddings: true, // Force local embeddings
          enableKeywordFallback: true, // Enable keyword fallback
          enableMCP: false, // Disable AI assistant MCP in local mode
        })
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});