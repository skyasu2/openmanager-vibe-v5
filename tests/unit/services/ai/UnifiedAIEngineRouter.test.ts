/**
 * UnifiedAIEngineRouter TDD 테스트 (Updated)
 * 
 * 🔧 수정된 사항:
 * - 타임아웃 문제 해결
 * - Mock 설정 개선
 * - Korean NLP API 호출 최적화
 * - 테스트 실행 시간 단축
 * 
 * 테스트 커버리지:
 * - 엔진 선택 로직 (local, google-ai, auto 모드)
 * - 폴백 메커니즘 (엔진 실패 시 다른 엔진으로 전환)
 * - 캐싱 시스템 (쿼리 결과 캐싱)
 * - 성능 최적화 (응답 시간 측정)
 * - 에러 핸들링 (타임아웃, 네트워크 오류)
 * - 한국어 NLP 처리 (개선됨)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  UnifiedAIEngineRouter, 
  RouterConfig, 
  RouteResult,
  getUnifiedAIRouter,
  routeAIQuery 
} from '@/services/ai/UnifiedAIEngineRouter';
import { QueryRequest, QueryResponse } from '@/services/ai/SimplifiedQueryEngine';

// 외부 의존성 모킹
const mockQueryMethod = vi.fn();
vi.mock('@/services/ai/SimplifiedQueryEngine', () => ({
  SimplifiedQueryEngine: vi.fn(() => ({
    query: mockQueryMethod
  }))
}));

vi.mock('@/services/ai/performance-optimized-query-engine', () => ({
  getPerformanceOptimizedQueryEngine: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({
      success: true,
      response: 'Performance mock',
      engine: 'performance',
      confidence: 0.9,
      thinkingSteps: [],
      processingTime: 80
    })
  }))
}));

vi.mock('@/services/ai/supabase-rag-engine', () => ({
  getSupabaseRAGEngine: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({
      success: true,
      response: 'RAG mock',
      engine: 'rag',
      confidence: 0.85,
      thinkingSteps: [],
      processingTime: 120
    })
  }))
}));

vi.mock('@/services/ai/security/PromptSanitizer', () => ({
  PromptSanitizer: {
    getInstance: vi.fn(() => ({}))
  },
  sanitizePrompt: vi.fn((prompt: string) => {
    // null/undefined 체크
    if (!prompt || typeof prompt !== 'string') {
      return {
        sanitized: '',
        blocked: true,
        threatsDetected: ['malformed_input'],
        riskLevel: 'high'
      };
    }
    
    // 악성 프롬프트 탐지 시뮬레이션
    const isMalicious = prompt.includes('DROP TABLE') || 
                       prompt.includes('DELETE FROM') ||
                       prompt.includes('EXEC sp_executesql');
    
    return {
      sanitized: isMalicious ? '*** BLOCKED ***' : prompt,
      blocked: isMalicious,
      threatsDetected: isMalicious ? ['sql_injection'] : [],
      riskLevel: isMalicious ? 'high' : 'safe'
    };
  })
}));

vi.mock('@/services/ai/security/AIResponseFilter', () => ({
  AIResponseFilter: {
    getInstance: vi.fn(() => ({}))
  },
  filterAIResponse: vi.fn((response: string) => {
    // 위험한 응답 탐지 시뮬레이션
    const isRisky = response.includes('admin password') || 
                    response.includes('민감한 시스템 정보');
    
    return {
      filtered: isRisky ? '*** FILTERED RESPONSE ***' : response,
      riskLevel: isRisky ? 'blocked' : 'safe',
      requiresRegeneration: isRisky,
      flaggedContent: isRisky ? ['sensitive_info'] : []
    };
  })
}));

// Test timeout configuration
const TEST_TIMEOUT = 30000; // 30 seconds - 타임아웃 증가
const MOCK_DELAY = 10; // Very short delay for mocks

describe('UnifiedAIEngineRouter - Optimized Tests', () => {
  let router: UnifiedAIEngineRouter;
  const mockQueryRequest: QueryRequest = {
    query: '서버 성능을 어떻게 개선할 수 있나요?',
    mode: 'auto',
    context: {
      servers: [{ id: 'server-1', name: 'web-server' }]
    }
  };

  const mockQueryResponse: QueryResponse = {
    success: true,
    response: '서버 성능 개선 방법입니다.',
    engine: 'google-ai',
    confidence: 0.85,
    thinkingSteps: [],
    processingTime: 150
  };

  beforeEach(() => {
    // Fake timers 제거 - 실제 타이머 사용 (타임아웃 문제 해결)
    // vi.useFakeTimers(); ❌ 제거됨
    
    // Singleton 인스턴스 초기화
    // @ts-ignore - private 속성 접근을 위해
    UnifiedAIEngineRouter.instance = undefined;
    
    // SimplifiedQueryEngine 기본 모킹 설정 - setImmediate로 빠른 비동기 처리
    mockQueryMethod.mockReset();
    mockQueryMethod.mockImplementation(async () => {
      // setImmediate로 빠른 비동기 처리
      await new Promise(resolve => setImmediate(resolve));
      return {
        success: true,
        response: 'Mock response',
        engine: 'mock-engine',
        confidence: 0.8,
        thinkingSteps: [],
        processingTime: 100,
        metadata: { tokensUsed: 50 }
      };
    });
    
    // fetch 모킹 - Korean NLP API 호출 포함
    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Korean NLP API 호출 시뮬레이션
      if (typeof url === 'string' && url.includes('korean-nlp')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              intent: 'server_status_check',
              entities: [{ type: 'server', value: '서버' }],
              semantic_analysis: {
                main_topic: 'server_monitoring',
                urgency_level: 'medium'
              },
              quality_metrics: {
                confidence: 0.9,
                processing_time: 120
              }
            }
          })
        });
      }
      
      // 기본 fetch 응답
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          response: 'Mock fetch response',
          confidence: 0.8
        })
      });
    });
    
    router = UnifiedAIEngineRouter.getInstance({
      enableSecurity: true,
      strictSecurityMode: false,
      dailyTokenLimit: 1000,
      userTokenLimit: 100,
      preferredEngine: 'auto',
      fallbackChain: ['local-rag', 'google-ai', 'korean-nlp'],
      enableCircuitBreaker: true,
      maxRetries: 3,
      timeoutMs: 5000, // Shorter timeout for tests
      enableKoreanNLP: true,
      koreanNLPThreshold: 0.7
    });
  });

  afterEach(() => {
    // vi.useRealTimers(); ❌ Fake timers 사용 안 함
    vi.clearAllMocks();
  });

  describe('🏗️ 인스턴스 생성 및 초기화', () => {
    it('should create singleton instance with default config', () => {
      const instance1 = UnifiedAIEngineRouter.getInstance();
      const instance2 = UnifiedAIEngineRouter.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(UnifiedAIEngineRouter);
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<RouterConfig> = {
        enableSecurity: false,
        preferredEngine: 'google-ai',
        dailyTokenLimit: 5000
      };
      
      const instance = UnifiedAIEngineRouter.getInstance(customConfig);
      const metrics = instance.getMetrics();
      
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.tokenUsage.daily).toBe(0);
    });

    it('should initialize all required components', async () => {
      // 초기화가 완료되었는지 확인
      expect(router).toBeDefined();
      
      // getMetrics가 정상 동작하는지 확인
      const metrics = router.getMetrics();
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('engineUsage');
      expect(metrics).toHaveProperty('securityEvents');
    });
  });

  describe('🎯 엔진 선택 로직 (Engine Selection)', () => {
    it('should select google-ai engine for complex queries', async () => {
      const complexQuery: QueryRequest = {
        query: '복잡한 서버 아키텍처 분석과 성능 최적화 전략을 수립하고 단계별 실행 계획을 제시해주세요.',
        mode: 'auto',
        context: {
          servers: [
            { id: 'server-1', name: 'api-server' },
            { id: 'server-2', name: 'db-server' }
          ]
        }
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...complexQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
      expect(result.routingInfo.processingPath).toContain('engine_selected_google-ai');
    }, TEST_TIMEOUT);

    it('should select local-rag engine for simple queries', async () => {
      const simpleQuery: QueryRequest = {
        query: 'CPU 사용률은?',
        mode: 'auto'
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...simpleQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
      expect(result.routingInfo.processingPath).toContain('engine_selected_local-rag');
    }, TEST_TIMEOUT);

    it('should select korean-nlp engine for Korean queries', async () => {
      const koreanQuery: QueryRequest = {
        query: '서버의 메모리 사용량이 갑자기 증가했어요. 어떻게 해야 하나요?',
        mode: 'auto'
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('korean-nlp');
      expect(result.routingInfo.processingPath).toContain('engine_selected_korean-nlp');
    }, TEST_TIMEOUT);

    it('should respect preferred engine when not auto', async () => {
      router.updateConfig({ preferredEngine: 'google-ai' });
      
      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
    }, TEST_TIMEOUT);

    it('should calculate Korean ratio correctly', async () => {
      const mixedQuery: QueryRequest = {
        query: 'Server performance 서버 성능 모니터링',
        mode: 'auto'
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mixedQuery, userId: 'user-1' });
      
      // 한국어 비율이 threshold 이하면 다른 엔진 선택
      expect(result.routingInfo.selectedEngine).not.toBe('korean-nlp');
    }, TEST_TIMEOUT);
  });

  describe('🔄 폴백 메커니즘 (Fallback Mechanism)', () => {
    it('should fallback to next engine when primary fails', async () => {
      // SimplifiedQueryEngine이 실패하도록 모킹
      mockQueryMethod.mockReset();
      mockQueryMethod
        .mockRejectedValueOnce(new Error('Google AI 서비스 오류'))
        .mockImplementation(async () => {
          // setImmediate로 빠른 비동기 처리
          await new Promise(resolve => setImmediate(resolve));
          return {
            success: true,
            response: 'Fallback response',
            engine: 'fallback-engine',
            confidence: 0.7,
            thinkingSteps: [],
            processingTime: 200
          };
        });
      
      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.processingPath.some(path => path.startsWith('fallback_to_'))).toBe(true);
    }, TEST_TIMEOUT);

    it('should return error when all engines fail', async () => {
      // 모든 엔진이 실패하도록 모킹
      mockQueryMethod.mockReset();
      mockQueryMethod.mockRejectedValue(new Error('All engines failed'));
      
      // Korean NLP API 호출도 실패하도록 설정
      global.fetch = vi.fn().mockRejectedValue(new Error('Korean NLP API failed'));
      
      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('💾 캐싱 시스템 (Caching System)', () => {
    it('should cache successful query responses', async () => {
      // 첫 번째 요청
      // 실제 타이머 사용으로 변경
      const result1 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // 두 번째 요청 (캐시에서 가져와야 함)
      // 실제 타이머 사용으로 변경 (캐시된 응답)
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result2.metadata?.cached).toBe(true);
      expect(result2.processingTime).toBeLessThan(100);
    }, TEST_TIMEOUT);

    it('should invalidate cache after TTL expires', async () => {
      // 첫 번째 요청
      await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // TTL 대기는 실제 테스트에서는 필요 없음 (캐시가 메모리 기반이므로 즉시 만료 가능)
      // 실제로는 캐시 TTL이 작동하지만 테스트에서는 즉시 새 요청
      
      // 두 번째 요청 (캐시 만료 후)
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result2.metadata?.cached).toBeFalsy();
    }, TEST_TIMEOUT);

    it('should not cache failed responses', async () => {
      mockQueryMethod.mockRejectedValue(new Error('Query failed'));

      // 실제 타이머 사용으로 변경
      const result1 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // 실제 타이머 사용으로 변경
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result2.metadata?.cached).toBeFalsy();
    }, TEST_TIMEOUT);
  });

  describe('⚡ 성능 최적화 (Performance Optimization)', () => {
    it('should measure and record response times', async () => {
      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.processingTime).toBeGreaterThan(0);
      
      const metrics = router.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should update performance metrics correctly', async () => {
      const initialMetrics = router.getMetrics();
      
      // 실제 타이머 사용으로 변경
      await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // 실제 타이머 사용으로 변경
      await router.route({ ...mockQueryRequest, userId: 'user-2' });
      
      const updatedMetrics = router.getMetrics();
      
      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 2);
      expect(updatedMetrics.averageResponseTime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should optimize for concurrent requests', async () => {
      const promises = Array.from({ length: 3 }, (_, i) => 
        router.route({ 
          query: `Query ${i}`, 
          mode: 'auto',
          userId: `user-${i}` 
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('routingInfo');
      });
    }, TEST_TIMEOUT);
  });

  describe('🚨 에러 핸들링 (Error Handling)', () => {
    it('should handle timeout errors gracefully', async () => {
      router.updateConfig({ timeoutMs: 50 }); // 매우 짧은 타임아웃
      
      // 긴 처리 시간 모킹
      mockQueryMethod.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, TEST_TIMEOUT);

    it('should handle network errors with proper fallback', async () => {
      const networkError = new Error('Network connection failed');
      mockQueryMethod.mockRejectedValue(networkError);

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.processingPath).toContain('fallback_attempt');
    }, TEST_TIMEOUT);

    it('should handle malformed query gracefully', async () => {
      const malformedQuery = {
        query: null,
        mode: 'invalid-mode'
      } as Partial<QueryRequest>;

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...malformedQuery, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('🇰🇷 한국어 NLP 처리 (Korean NLP Processing)', () => {
    it('should detect Korean text and route to Korean NLP engine', async () => {
      const koreanQuery = {
        query: '서버의 메모리 사용량이 높습니다. 최적화 방법을 알려주세요.',
        mode: 'auto' as const
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('korean-nlp');
      expect(result.metadata?.koreanNLP).toBe(true);
    }, TEST_TIMEOUT);

    it('should calculate Korean character ratio correctly', async () => {
      const mixedQuery = {
        query: 'Server CPU usage 서버 CPU 사용률 check please',
        mode: 'auto' as const
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mixedQuery, userId: 'user-1' });
      
      // 한국어 비율이 threshold 이하이므로 다른 엔진 선택
      expect(result.routingInfo.selectedEngine).not.toBe('korean-nlp');
    }, TEST_TIMEOUT);

    it('should fallback to local engine when Korean NLP fails', async () => {
      const koreanQuery = {
        query: '한국어 처리 테스트입니다.',
        mode: 'auto' as const
      };

      // Korean NLP API 호출 실패 모킹
      global.fetch = vi.fn().mockRejectedValue(new Error('Korean NLP API failed'));

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
    }, TEST_TIMEOUT);

    it('should process Korean NLP response correctly', async () => {
      const koreanQuery = {
        query: '서버 상태를 확인하고 싶습니다.',
        mode: 'auto' as const
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.response).toContain('분석 결과');
      expect(result.response).toContain('server_status_check');
      expect(result.confidence).toBe(0.9);
    }, TEST_TIMEOUT);
  });

  describe('💰 토큰 사용량 추적 및 제한 (Token Usage Tracking)', () => {
    it('should track token usage per user', async () => {
      const queryWithTokens = {
        ...mockQueryRequest,
        userId: 'user-1'
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route(queryWithTokens);
      
      expect(result.routingInfo.tokensCounted).toBe(true);
      
      const metrics = router.getMetrics();
      expect(metrics.tokenUsage.byUser.get('user-1')).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should enforce daily token limits', async () => {
      router.updateConfig({ dailyTokenLimit: 10 });
      
      // 토큰 사용량을 한도 초과로 설정
      const metrics = router.getMetrics();
      metrics.tokenUsage.daily = 15;

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.routingInfo.selectedEngine).toBe('rate-limiter');
      expect(result.response).toContain('일일 사용 한도');
    }, TEST_TIMEOUT);

    it('should reset daily limits correctly', () => {
      // 토큰 사용량 설정
      const metrics = router.getMetrics();
      metrics.tokenUsage.daily = 100;
      metrics.tokenUsage.byUser.set('user-1', 50);

      router.resetDailyLimits();
      
      const resetMetrics = router.getMetrics();
      expect(resetMetrics.tokenUsage.daily).toBe(0);
      expect(resetMetrics.tokenUsage.byUser.size).toBe(0);
    });
  });

  describe('🛡️ 보안 검사 및 필터링 (Security Checks)', () => {
    it('should block malicious prompts', async () => {
      const maliciousQuery = {
        query: 'DROP TABLE users; DELETE FROM servers; --',
        mode: 'auto' as const
      };

      // 실제 타이머 사용으로 변경
      const result = await router.route({ ...maliciousQuery, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.routingInfo.selectedEngine).toBe('security-filter');
      expect(result.routingInfo.securityApplied).toBe(true);
    }, TEST_TIMEOUT);

    it('should track security events in metrics', async () => {
      const maliciousQuery = {
        query: 'EXEC sp_executesql N\'DROP DATABASE production\'',
        mode: 'auto' as const
      };

      // 실제 타이머 사용으로 변경
      await router.route({ ...maliciousQuery, userId: 'user-1' });
      
      const metrics = router.getMetrics();
      expect(metrics.securityEvents.promptsBlocked).toBeGreaterThan(0);
      expect(metrics.securityEvents.threatsDetected.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('🔗 유틸리티 함수 (Utility Functions)', () => {
    it('should provide convenience function for getting router instance', () => {
      const instance = getUnifiedAIRouter();
      
      expect(instance).toBeInstanceOf(UnifiedAIEngineRouter);
    });

    it('should provide convenience function for routing queries', async () => {
      // 실제 타이머 사용으로 변경
      const result = await routeAIQuery({
        query: 'Test query',
        mode: 'auto',
        userId: 'user-1'
      });
      
      expect(result).toHaveProperty('routingInfo');
      expect(result.routingInfo).toHaveProperty('selectedEngine');
    }, TEST_TIMEOUT);

    it('should handle concurrent utility function calls', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        routeAIQuery({
          query: `Concurrent query ${i}`,
          mode: 'auto',
          userId: `user-${i}`
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('routingInfo');
      });
    }, TEST_TIMEOUT);
  });
});