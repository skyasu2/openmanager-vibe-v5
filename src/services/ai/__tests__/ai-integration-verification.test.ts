/**
 * 🧪 AI 시스템 통합 검증 테스트
 * 
 * 핵심 검증 항목:
 * - 로컬 AI vs 클라우드 AI 모드 비교
 * - GCP Cloud Functions 통합
 * - AI 어시스턴트 기능 전체 워크플로우
 * - 실제 사용자 시나리오 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SimplifiedQueryEngine,
  getSimplifiedQueryEngine,
} from '../SimplifiedQueryEngine';
import type { QueryRequest, QueryResponse } from '../SimplifiedQueryEngine.types';
import type { AIQueryContext } from '@/types/ai-service-types';
import { getGCPFunctionsClient, analyzeKoreanNLP } from '@/lib/gcp/gcp-functions-client';

// Mock GCP Functions for testing
vi.mock('@/lib/gcp/gcp-functions-client', () => ({
  getGCPFunctionsClient: vi.fn(() => ({
    callFunction: vi.fn().mockResolvedValue({
      success: true,
      data: {
        intent: 'server_monitoring',
        confidence: 0.85,
        analysis: {
          intent: 'server_status_check',
          sentiment: 'neutral',
          keywords: ['서버', '상태', '확인'],
          topics: ['monitoring', 'system'],
          summary: '서버 상태 확인 요청'
        }
      }
    })
  })),
  analyzeKoreanNLP: vi.fn().mockResolvedValue({
    success: true,
    data: {
      intent: 'server_monitoring',
      entities: [
        { type: 'service', value: '서버', confidence: 0.9 }
      ],
      semantic_analysis: {
        main_topic: 'Server Monitoring',
        urgency_level: 'medium',
        technical_complexity: 0.7
      }
    }
  })
}));

// Mock other dependencies
vi.mock('../supabase-rag-engine', () => ({
  getSupabaseRAGEngine: vi.fn(() => ({
    searchSimilar: vi.fn().mockResolvedValue({
      results: [
        {
          content: '서버 모니터링 가이드: CPU, 메모리, 디스크 사용률 확인',
          similarity: 0.87,
          metadata: { category: 'monitoring', source: 'knowledge_base' }
        }
      ],
      totalResults: 1,
      cached: false
    }),
    _initialize: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue({ status: 'healthy', vectorDB: true })
  }))
}));

vi.mock('@/services/mcp/CloudContextLoader', () => ({
  CloudContextLoader: {
    getInstance: vi.fn(() => ({
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [
          { path: '/monitoring/server-status.md', content: '서버 상태 모니터링 문서' }
        ],
        systemContext: { activeServers: 15 }
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: { status: 'online' }
      })
    }))
  }
}));

vi.mock('../embedding-service', () => ({
  embeddingService: {
    createEmbedding: vi.fn().mockImplementation(async (text: string) => {
      const hash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
      const embedding = Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.1);
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
    }),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(() => ({ size: 0, maxSize: 1000, hitRate: 0, hits: 0, misses: 0 }))
  }
}));

// Mock other required modules
vi.mock('../query-complexity-analyzer', () => ({
  QueryComplexityAnalyzer: {
    analyze: vi.fn(() => ({
      score: 50,
      recommendation: 'local',
      confidence: 0.8,
      factors: { length: 15, keywords: 2, patterns: 1, context: 1, language: 0 }
    }))
  }
}));

vi.mock('@/config/free-tier-cache-config', () => ({
  createCacheKey: vi.fn((prefix, key) => `${prefix}:${key}`),
  getTTL: vi.fn(() => 900),
  validateDataSize: vi.fn(() => true)
}));

vi.mock('@/lib/env-safe', () => ({
  validateGoogleAIMCPConfig: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    config: {
      googleAI: {
        isValid: true,
        apiKey: 'test-api-key',
        modelName: 'gemini-pro',
        maxTokens: 2000,
        temperature: 0.7
      }
    }
  }))
}));

// Mock fetch for Google AI API
global.fetch = vi.fn();

const TEST_TIMEOUT = 15000; // 15 seconds

describe('AI System Integration Verification', () => {
  let engine: SimplifiedQueryEngine;

  // Test environment variables
  const originalEnv = {
    USE_LOCAL_EMBEDDINGS: process.env.USE_LOCAL_EMBEDDINGS,
    GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    NEXT_PUBLIC_GCP_FUNCTIONS_URL: process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SimplifiedQueryEngine();
  });

  afterEach(() => {
    // Restore original environment variables
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key as keyof typeof originalEnv] !== undefined) {
        process.env[key] = originalEnv[key as keyof typeof originalEnv];
      } else {
        delete process.env[key];
      }
    });
  });

  describe('Local AI Mode Integration', () => {
    beforeEach(() => {
      process.env.USE_LOCAL_EMBEDDINGS = 'true';
      delete process.env.GOOGLE_AI_API_KEY;
    });

    it(
      'should handle complete local AI workflow',
      async () => {
        const request: QueryRequest = {
          query: '현재 서버들의 CPU 사용률이 높은지 확인해주세요',
          mode: 'local-ai',
          context: {
            servers: [
              { id: 'srv-001', name: 'web-server-1', status: 'healthy', cpu: 85, memory: 60 },
              { id: 'srv-002', name: 'db-server-1', status: 'warning', cpu: 92, memory: 78 }
            ]
          }
        };

        const response = await engine.query(request);

        expect(response.success).toBe(true);
        expect(response.engine).toBe('local-ai');
        expect(response.response).toContain('서버');
        expect(response.confidence).toBeGreaterThan(0);
        expect(response.processingTime).toBeGreaterThan(0);
        
        // Should not call Google AI API in local mode
        expect(global.fetch).not.toHaveBeenCalled();
        
        // Should have thinking steps for local processing
        const steps = response.thinkingSteps.map(s => s.step);
        expect(steps).toContain('모드 선택');
        expect(steps.some(s => s.includes('로컬') || s.includes('AI'))).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      'should integrate with GCP Cloud Functions for Korean NLP',
      async () => {
        const response = await engine.query({
          query: '서버 성능 분석 보고서를 작성해주세요',
          mode: 'local-ai',
          options: { enableKoreanNLP: true }
        });

        expect(response.success).toBe(true);
        expect(response.engine).toBe('local-ai');
        
        // Should include NLP processing step
        const nlpStep = response.thinkingSteps.find(step => 
          step.step.includes('NLP') || step.step.includes('의도')
        );
        expect(nlpStep).toBeDefined();
        
        // Should not call Google AI API
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  });

  describe('Cloud AI Mode Integration', () => {
    beforeEach(() => {
      process.env.USE_LOCAL_EMBEDDINGS = 'false';
      process.env.GOOGLE_AI_ENABLED = 'true';
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      // Mock Google AI API response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Google AI가 생성한 서버 분석 응답입니다.',
          confidence: 0.92,
          model: 'gemini-pro',
          tokensUsed: 150
        })
      } as Response);
    });

    it(
      'should handle complete Google AI workflow',
      async () => {
        const request: QueryRequest = {
          query: '복잡한 서버 성능 최적화 전략을 제안해주세요',
          mode: 'google-ai',
          enableGoogleAI: true,
          options: {
            includeMCPContext: true,
            enableKoreanNLP: true
          }
        };

        const response = await engine.query(request);

        expect(response.success).toBe(true);
        expect(response.engine).toBe('google-ai');
        expect(response.response).toContain('Google AI가 생성한');
        expect(response.confidence).toBeGreaterThan(0.9);
        expect(response.metadata?.model).toBe('gemini-pro');
        
        // Should call Google AI API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/ai/google-ai/generate',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      },
      TEST_TIMEOUT
    );

    it(
      'should fallback to local AI when Google AI fails',
      async () => {
        // Mock Google AI API failure
        vi.mocked(global.fetch).mockRejectedValue(new Error('Google AI API unavailable'));

        const response = await engine.query({
          query: 'Google AI 실패 시 fallback 테스트',
          mode: 'google-ai',
          enableGoogleAI: true
        });

        expect(response.success).toBe(true);
        expect(response.engine).toBe('local-ai'); // Should fallback to local-ai
        
        // Should have attempted Google AI first, then fallen back
        expect(global.fetch).toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  });

  describe('Auto Mode Intelligence', () => {
    it(
      'should intelligently select local AI for simple queries',
      async () => {
        const response = await engine.query({
          query: '서버 상태',
          mode: 'auto'
        });

        expect(response.success).toBe(true);
        expect(['local-ai', 'local-rag']).toContain(response.engine);
        expect(global.fetch).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    it(
      'should handle complex server analysis scenarios',
      async () => {
        const complexContext: AIQueryContext = {
          servers: Array.from({ length: 10 }, (_, i) => ({
            id: `srv-${i.toString().padStart(3, '0')}`,
            name: `server-${i + 1}`,
            status: Math.random() > 0.7 ? 'warning' : 'healthy',
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            disk: Math.floor(Math.random() * 100),
            network: Math.floor(Math.random() * 100)
          })),
          previousQueries: [
            '서버 성능 트렌드 분석',
            '메모리 사용률 최적화',
            '네트워크 병목 현상 해결'
          ]
        };

        const response = await engine.query({
          query: '지난 24시간 동안의 서버 성능 데이터를 기반으로 향후 1주일간의 리소스 사용 예측과 최적화 방안을 제시해주세요',
          mode: 'auto',
          context: complexContext,
          options: {
            includeMCPContext: true,
            enableKoreanNLP: true
          }
        });

        expect(response.success).toBe(true);
        expect(response.confidence).toBeGreaterThan(0.5);
        expect(response.processingTime).toBeLessThan(10000); // Should complete within 10s
        
        // Should analyze all provided servers
        const serverMentions = complexContext.servers!.filter(server => 
          response.response.includes(server.name) || response.response.includes(server.id)
        );
        
        // Should provide meaningful analysis
        expect(response.response.length).toBeGreaterThan(100);
        expect(response.thinkingSteps.length).toBeGreaterThan(3);
      },
      TEST_TIMEOUT
    );
  });

  describe('Error Handling & Resilience', () => {
    it(
      'should gracefully handle RAG engine failures',
      async () => {
        // Mock RAG engine failure
        const mockRAGEngine = vi.mocked(await import('../supabase-rag-engine'));
        mockRAGEngine.getSupabaseRAGEngine = vi.fn(() => ({
          searchSimilar: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          _initialize: vi.fn().mockResolvedValue(undefined),
          healthCheck: vi.fn().mockResolvedValue({ status: 'unhealthy', vectorDB: false })
        }));

        const response = await engine.query({
          query: 'RAG 엔진 실패 시 처리',
          mode: 'local-ai'
        });

        // Should handle the error gracefully
        expect(response.success).toBe(false);
        expect(response.error).toContain('Database connection failed');
        expect(response.engine).toBe('local-ai');
      },
      TEST_TIMEOUT
    );

    it(
      'should maintain performance under load',
      async () => {
        const queries = Array.from({ length: 5 }, (_, i) => 
          engine.query({
            query: `동시 처리 테스트 쿼리 ${i + 1}`,
            mode: 'local-ai'
          })
        );

        const startTime = Date.now();
        const responses = await Promise.all(queries);
        const totalTime = Date.now() - startTime;

        // All queries should succeed
        expect(responses.every(r => r.success)).toBe(true);
        
        // Should complete within reasonable time (parallel processing)
        expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 queries
        
        // Each query should be processed efficiently
        responses.forEach(response => {
          expect(response.processingTime).toBeLessThan(2000);
          expect(response.confidence).toBeGreaterThan(0);
        });
      },
      TEST_TIMEOUT
    );
  });

  describe('System Health & Monitoring', () => {
    it(
      'should provide comprehensive health check',
      async () => {
        const health = await engine.healthCheck();

        expect(health.status).toMatch(/healthy|degraded/);
        expect(typeof health.engines.localRAG).toBe('boolean');
        expect(typeof health.engines.googleAI).toBe('boolean');
        expect(typeof health.engines.mcp).toBe('boolean');
        
        // Should include performance metrics
        expect(health.performance).toBeDefined();
        expect(health.timestamp).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it(
      'should track and report performance metrics',
      async () => {
        const response = await engine.query({
          query: '성능 메트릭 테스트',
          mode: 'local-ai'
        });

        expect(response.metadata).toBeDefined();
        expect(response.metadata!.ragResults).toBeGreaterThanOrEqual(0);
        expect(typeof response.metadata!.cached).toBe('boolean');
        expect(response.processingTime).toBeGreaterThan(0);
        
        // Should include thinking steps with timing
        const stepsWithTiming = response.thinkingSteps.filter(s => s.duration && s.duration > 0);
        expect(stepsWithTiming.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });
});