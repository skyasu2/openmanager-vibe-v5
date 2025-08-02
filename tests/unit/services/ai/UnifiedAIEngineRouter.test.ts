/**
 * UnifiedAIEngineRouter TDD 테스트 (RED 단계)
 * 
 * @tdd-red
 * @created-date: 2025-08-02
 * @author: test-first-developer
 * 
 * 테스트 커버리지:
 * - 엔진 선택 로직 (local, google-ai, auto 모드)
 * - 폴백 메커니즘 (엔진 실패 시 다른 엔진으로 전환)
 * - 캐싱 시스템 (쿼리 결과 캐싱)
 * - 성능 최적화 (응답 시간 측정)
 * - 에러 핸들링 (타임아웃, 네트워크 오류)
 * - 복잡도 분석 기반 엔진 선택
 * - 컨텍스트 인식 처리
 * - 보안 검사 및 필터링
 * - 토큰 사용량 추적 및 제한
 * - Circuit Breaker 패턴
 * - 한국어 NLP 처리
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

describe('UnifiedAIEngineRouter - TDD RED 단계', () => {
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
    // Singleton 인스턴스 초기화
    // @ts-ignore - private 속성 접근을 위해
    UnifiedAIEngineRouter.instance = undefined;
    
    // SimplifiedQueryEngine 기본 모킹 설정
    mockQueryMethod.mockReset();
    mockQueryMethod.mockResolvedValue({
      success: true,
      response: 'Mock response',
      engine: 'mock-engine',
      confidence: 0.8,
      thinkingSteps: [],
      processingTime: 100,
      metadata: { tokensUsed: 50 }
    });
    
    // fetch 모킹
    global.fetch = vi.fn().mockResolvedValue({
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
    
    router = UnifiedAIEngineRouter.getInstance({
      enableSecurity: true,
      strictSecurityMode: false,
      dailyTokenLimit: 1000,
      userTokenLimit: 100,
      preferredEngine: 'auto',
      fallbackChain: ['local-rag', 'google-ai', 'korean-nlp'],
      enableCircuitBreaker: true,
      maxRetries: 3,
      timeoutMs: 30000,
      enableKoreanNLP: true,
      koreanNLPThreshold: 0.7
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🏗️ 인스턴스 생성 및 초기화', () => {
    // @tdd-red
    it('should create singleton instance with default config', () => {
      const instance1 = UnifiedAIEngineRouter.getInstance();
      const instance2 = UnifiedAIEngineRouter.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(UnifiedAIEngineRouter);
    });

    // @tdd-red
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

    // @tdd-red
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
    // @tdd-red
    it('should select google-ai engine for complex queries', async () => {
      const complexQuery: QueryRequest = {
        query: '복잡한 서버 아키텍처 분석과 성능 최적화 전략을 수립하고 단계별 실행 계획을 제시해주세요. 특히 마이크로서비스 환경에서의 로드 밸런싱과 캐싱 전략을 포함하여...',
        mode: 'auto',
        context: {
          servers: [
            { id: 'server-1', name: 'api-server' },
            { id: 'server-2', name: 'db-server' }
          ]
        }
      };

      const result = await router.route({ ...complexQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
      expect(result.routingInfo.processingPath).toContain('engine_selected_google-ai');
    });

    // @tdd-red
    it('should select local-rag engine for simple queries', async () => {
      const simpleQuery: QueryRequest = {
        query: 'CPU 사용률은?',
        mode: 'auto'
      };

      const result = await router.route({ ...simpleQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
      expect(result.routingInfo.processingPath).toContain('engine_selected_local-rag');
    });

    // @tdd-red
    it('should select korean-nlp engine for Korean queries', async () => {
      const koreanQuery: QueryRequest = {
        query: '서버의 메모리 사용량이 갑자기 증가했어요. 어떻게 해야 하나요?',
        mode: 'auto'
      };

      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('korean-nlp');
      expect(result.routingInfo.processingPath).toContain('engine_selected_korean-nlp');
    });

    // @tdd-red
    it('should respect preferred engine when not auto', async () => {
      router.updateConfig({ preferredEngine: 'google-ai' });
      
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
    });

    // @tdd-red
    it('should calculate Korean ratio correctly', async () => {
      const mixedQuery: QueryRequest = {
        query: 'Server performance 서버 성능 모니터링',
        mode: 'auto'
      };

      const result = await router.route({ ...mixedQuery, userId: 'user-1' });
      
      // 한국어 비율이 threshold 이하면 다른 엔진 선택
      expect(result.routingInfo.selectedEngine).not.toBe('korean-nlp');
    });
  });

  describe('🔄 폴백 메커니즘 (Fallback Mechanism)', () => {
    // @tdd-red
    it('should fallback to next engine when primary fails', async () => {
      // SimplifiedQueryEngine이 실패하도록 모킹 (reset 후 설정)
      mockQueryMethod.mockReset();
      mockQueryMethod
        .mockRejectedValueOnce(new Error('Google AI 서비스 오류'))
        .mockResolvedValueOnce({
          success: true,
          response: 'Fallback response',
          engine: 'fallback-engine',
          confidence: 0.7,
          thinkingSteps: [],
          processingTime: 200
        });
      
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.processingPath.some(path => path.startsWith('fallback_to_'))).toBe(true);
    });

    // @tdd-red
    it('should try all engines in fallback chain', async () => {
      // 처음 두 번은 실패, 세 번째에 성공 (reset 후 설정)
      mockQueryMethod.mockReset();
      mockQueryMethod
        .mockRejectedValueOnce(new Error('First engine failed'))
        .mockRejectedValueOnce(new Error('Second engine failed'))
        .mockResolvedValueOnce(mockQueryResponse);

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(true);
      expect(result.routingInfo.fallbackUsed).toBe(true);
    });

    // @tdd-red
    it('should return error when all engines fail', async () => {
      // 모든 엔진이 실패하도록 모킹 (reset 후 설정)
      mockQueryMethod.mockReset();
      mockQueryMethod.mockRejectedValue(new Error('All engines failed'));
      
      // Korean NLP API 호출도 실패하도록 설정
      global.fetch = vi.fn().mockRejectedValue(new Error('Korean NLP API failed'));
      
      // 캐시 무효화 (fresh 인스턴스로 테스트)
      // @ts-ignore - private 속성 접근을 위해
      UnifiedAIEngineRouter.instance = undefined;
      
      // 새 라우터 인스턴스 생성
      const freshRouter = UnifiedAIEngineRouter.getInstance({
        enableSecurity: false, // 보안 검사 비활성화로 간단하게
      });

      const result = await freshRouter.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.routingInfo.selectedEngine).toBe('error-handler');
    });

    // @tdd-red
    it('should retry with different engine when response is filtered', async () => {
      // 첫 번째 응답이 보안 필터에 걸리도록 모킹
      const riskyResponse = {
        ...mockQueryResponse,
        response: '민감한 정보가 포함된 응답'
      };

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.processingPath.some(path => path.startsWith('retry_with_'))).toBe(true);
    });
  });

  describe('💾 캐싱 시스템 (Caching System)', () => {
    // @tdd-red
    it('should cache successful query responses', async () => {
      const cacheKey = 'test-cache-key';
      const cachedResponse = { ...mockQueryResponse, cached: true };

      // 첫 번째 요청
      const result1 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // 두 번째 요청 (캐시에서 가져와야 함)
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result2.metadata?.cached).toBe(true);
      expect(result2.processingTime).toBeLessThan(50); // 캐시된 응답은 빨라야 함
    });

    // @tdd-red
    it('should invalidate cache after TTL expires', async () => {
      const shortTTL = 100; // 100ms TTL
      
      const result1 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      // TTL 대기
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
      
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result2.metadata?.cached).toBeFalsy();
    });

    // @tdd-red
    it('should not cache failed responses', async () => {
      const mockQuery = vi.fn().mockRejectedValue(new Error('Query failed'));

      const result1 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      const result2 = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result2.metadata?.cached).toBeFalsy();
    });
  });

  describe('⚡ 성능 최적화 (Performance Optimization)', () => {
    // @tdd-red
    it('should measure and record response times', async () => {
      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.processingTime).toBeGreaterThan(0);
      
      const metrics = router.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    // @tdd-red
    it('should update performance metrics correctly', async () => {
      const initialMetrics = router.getMetrics();
      
      await router.route({ ...mockQueryRequest, userId: 'user-1' });
      await router.route({ ...mockQueryRequest, userId: 'user-2' });
      
      const updatedMetrics = router.getMetrics();
      
      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 2);
      expect(updatedMetrics.averageResponseTime).toBeGreaterThan(0);
    });

    // @tdd-red
    it('should track engine usage statistics', async () => {
      await router.route({ 
        query: 'Simple query', 
        mode: 'auto',
        userId: 'user-1' 
      });
      
      await router.route({ 
        query: '매우 복잡한 한국어 질문입니다. 서버 아키텍처를 분석해주세요.',
        mode: 'auto',
        userId: 'user-1'
      });
      
      const metrics = router.getMetrics();
      
      expect(metrics.engineUsage.localRAG).toBeGreaterThan(0);
      expect(metrics.engineUsage.koreanNLP).toBeGreaterThan(0);
    });

    // @tdd-red
    it('should optimize for concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        router.route({ 
          query: `Query ${i}`, 
          mode: 'auto',
          userId: `user-${i}` 
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('routingInfo');
      });
    });
  });

  describe('🚨 에러 핸들링 (Error Handling)', () => {
    // @tdd-red
    it('should handle timeout errors gracefully', async () => {
      router.updateConfig({ timeoutMs: 100 }); // 매우 짧은 타임아웃
      
      // 긴 처리 시간 모킹
      const mockQuery = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    // @tdd-red
    it('should handle network errors with proper fallback', async () => {
      const networkError = new Error('Network connection failed');
      const mockQuery = vi.fn().mockRejectedValue(networkError);

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.processingPath).toContain('fallback_attempt');
    });

    // @tdd-red
    it('should retry failed requests up to maxRetries', async () => {
      router.updateConfig({ maxRetries: 3 });
      
      const mockQuery = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce(mockQueryResponse);

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(true);
      expect(result.routingInfo.processingPath).toContain('retry_attempt');
    });

    // @tdd-red
    it('should handle malformed query gracefully', async () => {
      const malformedQuery = {
        query: null,
        mode: 'invalid-mode'
      } as any;

      const result = await router.route({ ...malformedQuery, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('🧠 복잡도 분석 기반 엔진 선택 (Complexity-based Engine Selection)', () => {
    // @tdd-red
    it('should analyze query complexity for engine selection', async () => {
      const complexQuery = {
        query: 'Analyze server performance metrics, create optimization plan, implement monitoring dashboard, set up alerting system, and provide detailed documentation with best practices',
        mode: 'auto' as const,
        context: {
          servers: Array.from({ length: 10 }, (_, i) => ({ id: `server-${i}`, name: `server-${i}` }))
        }
      };

      const result = await router.route({ ...complexQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
      expect(result.routingInfo.processingPath).toContain('engine_selected_google-ai');
    });

    // @tdd-red
    it('should consider context size in complexity analysis', async () => {
      const queryWithLargeContext = {
        query: 'Status check',
        mode: 'auto' as const,
        context: {
          servers: Array.from({ length: 50 }, (_, i) => ({ 
            id: `server-${i}`, 
            name: `server-${i}`,
            metrics: { cpu: Math.random(), memory: Math.random() }
          }))
        }
      };

      const result = await router.route({ ...queryWithLargeContext, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai');
    });

    // @tdd-red
    it('should prefer local engines for simple queries', async () => {
      const simpleQuery = {
        query: 'CPU',
        mode: 'auto' as const
      };

      const result = await router.route({ ...simpleQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
    });
  });

  describe('🌏 컨텍스트 인식 처리 (Context-aware Processing)', () => {
    // @tdd-red
    it('should process server context correctly', async () => {
      const contextQuery = {
        query: '서버 상태를 확인해주세요',
        mode: 'auto' as const,
        context: {
          servers: [
            { id: 'web-1', name: 'Web Server', status: 'active' },
            { id: 'db-1', name: 'Database Server', status: 'maintenance' }
          ]
        }
      };

      const result = await router.route({ ...contextQuery, userId: 'user-1' });
      
      expect(result.success).toBe(true);
      expect(result.routingInfo.processingPath.some(path => path.startsWith('engine_executed_'))).toBe(true);
    });

    // @tdd-red
    it('should handle empty context gracefully', async () => {
      const emptyContextQuery = {
        query: '일반적인 질문입니다',
        mode: 'auto' as const,
        context: {}
      };

      const result = await router.route({ ...emptyContextQuery, userId: 'user-1' });
      
      expect(result.success).toBe(true);
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
    });

    // @tdd-red
    it('should adapt processing based on context type', async () => {
      const alertContextQuery = {
        query: '긴급 상황입니다',
        mode: 'auto' as const,
        context: {
          alert: {
            severity: 'critical',
            timestamp: Date.now()
          }
        }
      };

      const result = await router.route({ ...alertContextQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('google-ai'); // 긴급 상황은 고급 엔진 사용
    });
  });

  describe('🛡️ 보안 검사 및 필터링 (Security Checks)', () => {
    // @tdd-red
    it('should block malicious prompts', async () => {
      const maliciousQuery = {
        query: 'DROP TABLE users; DELETE FROM servers; --',
        mode: 'auto' as const
      };

      const result = await router.route({ ...maliciousQuery, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.routingInfo.selectedEngine).toBe('security-filter');
      expect(result.routingInfo.securityApplied).toBe(true);
    });

    // @tdd-red
    it('should sanitize suspicious input', async () => {
      const suspiciousQuery = {
        query: 'Show me <script>alert("xss")</script> server info',
        mode: 'auto' as const
      };

      const result = await router.route({ ...suspiciousQuery, userId: 'user-1' });
      
      expect(result.routingInfo.securityApplied).toBe(true);
      expect(result.routingInfo.processingPath).toContain('security_applied');
    });

    // @tdd-red
    it('should filter risky AI responses', async () => {
      const riskyResponse = {
        ...mockQueryResponse,
        response: '여기에 민감한 시스템 정보: admin password = 12345'
      };

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.routingInfo.processingPath).toContain('response_filtered');
    });

    // @tdd-red
    it('should track security events in metrics', async () => {
      const maliciousQuery = {
        query: 'EXEC sp_executesql N\'DROP DATABASE production\'',
        mode: 'auto' as const
      };

      await router.route({ ...maliciousQuery, userId: 'user-1' });
      
      const metrics = router.getMetrics();
      expect(metrics.securityEvents.promptsBlocked).toBeGreaterThan(0);
      expect(metrics.securityEvents.threatsDetected.length).toBeGreaterThan(0);
    });
  });

  describe('💰 토큰 사용량 추적 및 제한 (Token Usage Tracking)', () => {
    // @tdd-red
    it('should track token usage per user', async () => {
      const queryWithTokens = {
        ...mockQueryRequest,
        userId: 'user-1'
      };

      const result = await router.route(queryWithTokens);
      
      expect(result.routingInfo.tokensCounted).toBe(true);
      
      const metrics = router.getMetrics();
      expect(metrics.tokenUsage.byUser.get('user-1')).toBeGreaterThan(0);
    });

    // @tdd-red
    it('should enforce daily token limits', async () => {
      router.updateConfig({ dailyTokenLimit: 10 });
      
      // 토큰 사용량을 한도 초과로 설정
      const metrics = router.getMetrics();
      metrics.tokenUsage.daily = 15;

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.routingInfo.selectedEngine).toBe('rate-limiter');
      expect(result.response).toContain('일일 사용 한도');
    });

    // @tdd-red
    it('should enforce per-user token limits', async () => {
      router.updateConfig({ userTokenLimit: 5 });
      
      // 사용자별 토큰 사용량을 한도 초과로 설정
      const metrics = router.getMetrics();
      metrics.tokenUsage.byUser.set('user-1', 10);

      const result = await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      expect(result.success).toBe(false);
      expect(result.response).toContain('개인 사용 한도');
    });

    // @tdd-red
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

  describe('🔌 Circuit Breaker 패턴 (Circuit Breaker Pattern)', () => {
    // @tdd-red
    it('should open circuit breaker after repeated failures', async () => {
      router.updateConfig({ maxRetries: 1 });
      
      // 여러 번 실패 시뮬레이션
      const mockQuery = vi.fn().mockRejectedValue(new Error('Engine failed'));
      
      for (let i = 0; i < 6; i++) { // threshold 이상 실패
        await router.route({ ...mockQueryRequest, userId: `user-${i}` });
      }

      const result = await router.route({ ...mockQueryRequest, userId: 'user-final' });
      
      expect(result.routingInfo.selectedEngine).toBe('circuit-breaker');
      expect(result.response).toContain('일시적으로 제한된 모드');
    });

    // @tdd-red
    it('should transition to half-open state after timeout', async () => {
      // Circuit breaker를 open 상태로 만들기
      for (let i = 0; i < 6; i++) {
        await router.route({ ...mockQueryRequest, userId: `user-${i}` });
      }

      // 타임아웃 시뮬레이션 (실제로는 1분이지만 테스트용으로 짧게)
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await router.route({ ...mockQueryRequest, userId: 'user-test' });
      
      // Half-open 상태에서는 요청이 시도되어야 함
      expect(result.routingInfo.fallbackUsed).toBe(true);
    });

    // @tdd-red
    it('should reset circuit breaker manually', () => {
      // Circuit breaker를 open 상태로 만들기
      for (let i = 0; i < 6; i++) {
        router.recordFailure('google-ai'); // public 메서드 접근
      }

      router.resetCircuitBreakers();
      
      // 이후 요청이 정상 처리되어야 함
      const result = router.route({ ...mockQueryRequest, userId: 'user-1' });
      expect(result).resolves.toHaveProperty('success');
    });
  });

  describe('🇰🇷 한국어 NLP 처리 (Korean NLP Processing)', () => {
    // @tdd-red
    it('should detect Korean text and route to Korean NLP engine', async () => {
      const koreanQuery = {
        query: '서버의 메모리 사용량이 높습니다. 최적화 방법을 알려주세요.',
        mode: 'auto' as const
      };

      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.selectedEngine).toBe('korean-nlp');
      expect(result.metadata?.koreanNLP).toBe(true);
    });

    // @tdd-red
    it('should calculate Korean character ratio correctly', async () => {
      const mixedQuery = {
        query: 'Server CPU usage 서버 CPU 사용률 check please',
        mode: 'auto' as const
      };

      const result = await router.route({ ...mixedQuery, userId: 'user-1' });
      
      // 한국어 비율이 threshold 이하이므로 다른 엔진 선택
      expect(result.routingInfo.selectedEngine).not.toBe('korean-nlp');
    });

    // @tdd-red
    it('should fallback to local engine when Korean NLP fails', async () => {
      const koreanQuery = {
        query: '한국어 처리 테스트입니다.',
        mode: 'auto' as const
      };

      // Korean NLP API 호출 실패 모킹
      global.fetch = vi.fn().mockRejectedValue(new Error('Korean NLP API failed'));

      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.routingInfo.fallbackUsed).toBe(true);
      expect(result.routingInfo.selectedEngine).toBe('local-rag');
    });

    // @tdd-red
    it('should process Korean NLP response correctly', async () => {
      const koreanQuery = {
        query: '서버 상태를 확인하고 싶습니다.',
        mode: 'auto' as const
      };

      // Korean NLP API 응답 모킹
      const mockNLPResponse = {
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
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNLPResponse)
      });

      const result = await router.route({ ...koreanQuery, userId: 'user-1' });
      
      expect(result.response).toContain('분석 결과');
      expect(result.response).toContain('server_status_check');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('📊 메트릭 및 모니터링 (Metrics and Monitoring)', () => {
    // @tdd-red
    it('should provide comprehensive metrics', () => {
      const metrics = router.getMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('tokenUsage');
      expect(metrics).toHaveProperty('engineUsage');
      expect(metrics).toHaveProperty('securityEvents');
    });

    // @tdd-red
    it('should update metrics after each request', async () => {
      const initialMetrics = router.getMetrics();
      
      await router.route({ ...mockQueryRequest, userId: 'user-1' });
      
      const updatedMetrics = router.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
    });

    // @tdd-red
    it('should track different types of engine usage', async () => {
      // 다양한 쿼리로 다른 엔진들 사용
      await router.route({ query: 'Simple', mode: 'auto', userId: 'user-1' });
      await router.route({ query: 'Complex query with lots of context and requirements', mode: 'auto', userId: 'user-2' });
      await router.route({ query: '한국어 질문입니다', mode: 'auto', userId: 'user-3' });
      
      const metrics = router.getMetrics();
      
      expect(metrics.engineUsage.localRAG).toBeGreaterThan(0);
      expect(metrics.engineUsage.googleAI).toBeGreaterThan(0);
      expect(metrics.engineUsage.koreanNLP).toBeGreaterThan(0);
    });
  });

  describe('🔧 설정 관리 (Configuration Management)', () => {
    // @tdd-red
    it('should update configuration dynamically', () => {
      const newConfig: Partial<RouterConfig> = {
        dailyTokenLimit: 2000,
        enableKoreanNLP: false,
        preferredEngine: 'google-ai'
      };

      router.updateConfig(newConfig);
      
      // 설정이 적용되었는지 확인하는 방법이 필요
      expect(() => router.updateConfig(newConfig)).not.toThrow();
    });

    // @tdd-red
    it('should validate configuration parameters', () => {
      const invalidConfig = {
        dailyTokenLimit: -100,
        timeoutMs: 0
      };

      // 유효하지 않은 설정에 대한 처리
      expect(() => router.updateConfig(invalidConfig)).not.toThrow();
    });
  });

  describe('🔗 유틸리티 함수 (Utility Functions)', () => {
    // @tdd-red
    it('should provide convenience function for getting router instance', () => {
      const instance = getUnifiedAIRouter();
      
      expect(instance).toBeInstanceOf(UnifiedAIEngineRouter);
    });

    // @tdd-red
    it('should provide convenience function for routing queries', async () => {
      const result = await routeAIQuery({
        query: 'Test query',
        mode: 'auto',
        userId: 'user-1'
      });
      
      expect(result).toHaveProperty('routingInfo');
      expect(result.routingInfo).toHaveProperty('selectedEngine');
    });

    // @tdd-red
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
    });
  });
});