/**
 * ⚡ 회로 차단기 패턴 테스트
 * 
 * 테스트 영역:
 * 1. 회로 차단기 기본 동작 (Closed → Open → Half-Open)
 * 2. 실패 임계값 및 타임아웃 설정
 * 3. 자동 복구 메커니즘
 * 4. 폴백 응답 검증
 * 5. 다중 서비스 회로 차단기
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getPerformanceOptimizedQueryEngine } from '@/services/ai/performance-optimized-query-engine';
import type { QueryRequest } from '@/services/ai/SimplifiedQueryEngine';

// 테스트용 설정
const CIRCUIT_BREAKER_CONFIG = {
  enableParallelProcessing: true,
  enablePredictiveLoading: false, // 테스트 단순화
  enableCircuitBreaker: true,
  warmupOnStart: false,
  cacheStrategy: 'conservative' as const,
  timeoutMs: 5000,
};

// 실패를 유발하는 Mock 설정
const createFailingMock = (failureCount: number) => {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount <= failureCount) {
      throw new Error(`Mock failure ${callCount}`);
    }
    return Promise.resolve({
      success: true,
      response: 'Mock success response',
      engine: 'mock',
      confidence: 0.8,
      thinkingSteps: [],
      metadata: {},
      processingTime: 100
    });
  });
};

describe('⚡ 회로 차단기 패턴 테스트', () => {
  let engine: any;

  beforeEach(async () => {
    // 새로운 엔진 인스턴스 생성
    engine = getPerformanceOptimizedQueryEngine(CIRCUIT_BREAKER_CONFIG);
    await engine.initialize();
    
    // 기존 회로 차단기 상태 초기화
    engine.clearOptimizationCache();
  });

  afterEach(() => {
    // 테스트 후 정리
    engine.clearOptimizationCache();
    jest.clearAllTimers();
  });

  describe('🔄 회로 차단기 기본 상태 전환', () => {
    
    it('연속 실패 시 회로가 열려야 함 (Closed → Open)', async () => {
      const failureThreshold = 5;
      const testQuery: QueryRequest = {
        query: 'test circuit breaker failure',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      // 내부 RAG 엔진을 실패하도록 Mock
      const mockRagEngine = {
        searchSimilar: createFailingMock(failureThreshold + 1)
      };
      
      // 엔진 내부 상태 조작 (테스트용)
      engine.ragEngine = mockRagEngine;

      const responses = [];
      let circuitOpenDetected = false;

      // 실패 임계값을 초과할 때까지 쿼리 실행
      for (let i = 0; i < failureThreshold + 2; i++) {
        try {
          const result = await engine.query(testQuery);
          responses.push(result);
          
          // 폴백 응답이 나타나면 회로 차단기가 작동한 것
          if (result.metadata?.fallback) {
            circuitOpenDetected = true;
            console.log(`🔴 회로 차단기 열림 감지 (${i + 1}번째 시도)`);
            break;
          }
        } catch (error) {
          console.log(`❌ 실패 ${i + 1}: ${error.message}`);
          responses.push({ error: error.message, attempt: i + 1 });
        }
      }

      // 회로 차단기가 작동했거나 안정적인 폴백이 제공되어야 함
      const hasValidFallback = responses.some(r => 
        r.metadata?.fallback || (r.success && r.engine === 'fallback')
      );
      
      expect(circuitOpenDetected || hasValidFallback).toBe(true);
      expect(responses.length).toBeGreaterThan(failureThreshold);
      
      console.log(`📊 총 ${responses.length}개 응답 중 폴백: ${responses.filter(r => r.metadata?.fallback).length}개`);
    }, 15000);

    it('정상 서비스는 회로 차단기의 영향을 받지 않아야 함', async () => {
      const normalQuery: QueryRequest = {
        query: 'normal query test',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      // 정상 동작하는 RAG 엔진 Mock
      const mockRagEngine = {
        searchSimilar: jest.fn().mockResolvedValue({
          results: [{ content: 'test result', score: 0.8 }],
          totalResults: 1,
          cached: false
        })
      };

      engine.ragEngine = mockRagEngine;

      // 여러 번 정상 쿼리 실행
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const result = await engine.query(normalQuery);
        responses.push(result);
        
        expect(result.success).toBe(true);
        expect(result.metadata?.fallback).toBeUndefined();
        expect(result.response).toBeTruthy();
      }

      console.log(`✅ 정상 서비스 ${responses.length}번 연속 성공`);
    });
  });

  describe('⏱️ 회로 차단기 타임아웃 및 복구', () => {
    
    it('타임아웃 후 Half-Open 상태로 전환되어야 함', async () => {
      // 짧은 타임아웃으로 테스트 (실제로는 30초)
      const mockCircuitBreaker = {
        failures: 6, // 임계값 초과
        lastFailure: Date.now() - 31000, // 31초 전 실패
        state: 'open',
        threshold: 5,
        timeout: 30000
      };

      // 회로 차단기 상태 직접 설정 (테스트용)
      engine.circuitBreakers = new Map([['local', mockCircuitBreaker]]);

      const testQuery: QueryRequest = {
        query: 'test recovery query',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      // 정상 동작하는 엔진으로 설정
      const mockRagEngine = {
        searchSimilar: jest.fn().mockResolvedValue({
          results: [{ content: 'recovery test', score: 0.9 }],
          totalResults: 1,
          cached: false
        })
      };

      engine.ragEngine = mockRagEngine;

      const result = await engine.query(testQuery);

      // Half-Open 상태에서 성공하면 정상 응답을 받아야 함
      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.metadata?.fallback).toBeUndefined();

      console.log('🟡 Half-Open 상태에서 복구 성공');
    });

    it('복구 시도 실패 시 다시 Open 상태로 돌아가야 함', async () => {
      const mockCircuitBreaker = {
        failures: 6,
        lastFailure: Date.now() - 31000,
        state: 'half-open',
        threshold: 5,
        timeout: 30000
      };

      engine.circuitBreakers = new Map([['local', mockCircuitBreaker]]);

      // 복구 시도에서 실패하는 엔진
      const mockRagEngine = {
        searchSimilar: jest.fn().mockRejectedValue(new Error('Recovery attempt failed'))
      };

      engine.ragEngine = mockRagEngine;

      const testQuery: QueryRequest = {
        query: 'test failed recovery',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      const result = await engine.query(testQuery);

      // 실패 시 폴백 응답을 받아야 함
      expect(result.metadata?.fallback || result.engine === 'fallback').toBe(true);
      expect(result.response).toBeTruthy();

      console.log('🔴 복구 실패, 다시 Open 상태로 전환');
    });
  });

  describe('🎯 다중 서비스 회로 차단기', () => {
    
    it('각 서비스별로 독립적인 회로 차단기가 작동해야 함', async () => {
      const localQuery: QueryRequest = {
        query: 'local service test',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      const googleQuery: QueryRequest = {
        query: 'google ai service test',
        mode: 'google-ai',
        options: { includeMCPContext: false }
      };

      // 로컬 서비스만 실패하도록 설정
      const failingLocalMock = {
        searchSimilar: jest.fn().mockRejectedValue(new Error('Local service down'))
      };

      engine.ragEngine = failingLocalMock;

      // Google AI는 정상 동작하도록 fetch Mock 설정
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: 'Google AI response',
          confidence: 0.9
        })
      });

      // 로컬 서비스 실패 테스트
      const localResults = [];
      for (let i = 0; i < 6; i++) { // 임계값 초과
        const result = await engine.query(localQuery);
        localResults.push(result);
      }

      // Google AI 서비스 정상 동작 테스트
      const googleResult = await engine.query(googleQuery);

      // 로컬 서비스는 폴백 응답
      const localFallbacks = localResults.filter(r => r.metadata?.fallback).length;
      expect(localFallbacks).toBeGreaterThan(0);

      // Google AI는 정상 응답
      expect(googleResult.success).toBe(true);
      expect(googleResult.engine).toBe('google-ai');

      console.log(`🔀 독립적 회로 차단기: Local 폴백 ${localFallbacks}개, Google AI 정상`);
    });

    it('전체 시스템 복구 시 모든 회로 차단기가 재설정되어야 함', async () => {
      // 여러 서비스에 실패 상태 설정
      const circuitBreakers = new Map([
        ['local', { failures: 6, lastFailure: Date.now(), state: 'open', threshold: 5, timeout: 30000 }],
        ['google-ai', { failures: 7, lastFailure: Date.now(), state: 'open', threshold: 5, timeout: 30000 }]
      ]);

      engine.circuitBreakers = circuitBreakers;

      // 초기 회로 차단기 수 확인
      const initialBreakerCount = engine.circuitBreakers.size;
      expect(initialBreakerCount).toBe(2);

      // 전체 캐시 및 회로 차단기 초기화
      engine.clearOptimizationCache();

      // 초기화 후 회로 차단기 수 확인
      const finalBreakerCount = engine.circuitBreakers.size;
      expect(finalBreakerCount).toBe(0);

      console.log(`🔄 시스템 복구: ${initialBreakerCount}개 → ${finalBreakerCount}개 회로 차단기`);
    });
  });

  describe('🛡️ 폴백 응답 품질 검증', () => {
    
    it('폴백 응답이 사용자에게 유용한 정보를 제공해야 함', async () => {
      // 강제로 회로 차단기 열기
      const openCircuitBreaker = {
        failures: 10,
        lastFailure: Date.now(),
        state: 'open',
        threshold: 5,
        timeout: 30000
      };

      engine.circuitBreakers = new Map([['local', openCircuitBreaker]]);

      const testQuery: QueryRequest = {
        query: 'emergency system status check',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      const result = await engine.query(testQuery);

      // 폴백 응답 품질 검증
      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.response.length).toBeGreaterThan(20); // 의미있는 길이
      expect(result.engine).toBe('fallback');
      expect(result.metadata?.fallback).toBe(true);
      expect(result.metadata?.reason).toBeTruthy();

      // 사용자 친화적 메시지 확인
      const userFriendlyKeywords = [
        '제한된 모드', '일시적', '기본적인 정보', 
        '시스템', '서비스', '이용'
      ];

      const hasUserFriendlyMessage = userFriendlyKeywords.some(keyword => 
        result.response.includes(keyword)
      );

      expect(hasUserFriendlyMessage).toBe(true);

      console.log(`🛡️ 폴백 응답 품질: "${result.response.substring(0, 50)}..."`);
      console.log(`🔍 폴백 이유: ${result.metadata?.reason}`);
    });

    it('폴백 응답 시간이 빨라야 함', async () => {
      const openCircuitBreaker = {
        failures: 10,
        lastFailure: Date.now(),
        state: 'open',
        threshold: 5,
        timeout: 30000
      };

      engine.circuitBreakers = new Map([['local', openCircuitBreaker]]);

      const testQuery: QueryRequest = {
        query: 'fast fallback test',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      const startTime = Date.now();
      const result = await engine.query(testQuery);
      const responseTime = Date.now() - startTime;

      expect(result.metadata?.fallback).toBe(true);
      expect(responseTime).toBeLessThan(200); // 200ms 이내
      expect(result.processingTime).toBeLessThan(100); // 내부 처리 시간도 빨라야 함

      console.log(`⚡ 폴백 응답 속도: ${responseTime}ms (처리: ${result.processingTime}ms)`);
    });
  });

  describe('📊 회로 차단기 통계 및 모니터링', () => {
    
    it('회로 차단기 상태가 성능 통계에 반영되어야 함', async () => {
      // 회로 차단기 상태 설정
      const circuitBreakers = new Map([
        ['local', { failures: 3, lastFailure: Date.now(), state: 'closed', threshold: 5, timeout: 30000 }],
        ['google-ai', { failures: 6, lastFailure: Date.now(), state: 'open', threshold: 5, timeout: 30000 }]
      ]);

      engine.circuitBreakers = circuitBreakers;

      const stats = engine.getPerformanceStats();

      expect(stats.optimization.circuitBreakers).toBe(2);

      console.log(`📊 회로 차단기 통계:`, {
        총개수: stats.optimization.circuitBreakers,
        상태: Array.from(circuitBreakers.entries()).map(([service, breaker]) => ({
          service,
          state: breaker.state,
          failures: breaker.failures
        }))
      });
    });

    it('에러율이 회로 차단기 동작에 반영되어야 함', async () => {
      let errorCount = 0;
      let totalCount = 0;

      // 에러율 생성을 위한 테스트
      const mixedResultMock = {
        searchSimilar: jest.fn().mockImplementation(() => {
          totalCount++;
          if (totalCount % 3 === 0) { // 33% 실패율
            errorCount++;
            throw new Error(`Intermittent failure ${errorCount}`);
          }
          return Promise.resolve({
            results: [{ content: 'success result', score: 0.7 }],
            totalResults: 1,
            cached: false
          });
        })
      };

      engine.ragEngine = mixedResultMock;

      const testQuery: QueryRequest = {
        query: 'error rate test',
        mode: 'local',
        options: { includeMCPContext: false }
      };

      // 여러 번 쿼리 실행하여 에러율 생성
      const results = [];
      for (let i = 0; i < 9; i++) { // 3번 실패, 6번 성공 예상
        try {
          const result = await engine.query(testQuery);
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const actualErrorRate = failureCount / results.length;

      console.log(`📈 에러율 테스트 결과:`, {
        총요청: results.length,
        성공: successCount,
        실패: failureCount,
        에러율: `${(actualErrorRate * 100).toFixed(1)}%`
      });

      expect(results.length).toBe(9);
      expect(actualErrorRate).toBeGreaterThan(0.2); // 20% 이상
      expect(actualErrorRate).toBeLessThan(0.5);    // 50% 미만
    });
  });
});