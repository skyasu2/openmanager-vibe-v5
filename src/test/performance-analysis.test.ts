/**
 * 🚀 SimplifiedQueryEngine 성능 분석 테스트
 * 
 * 병목 지점 측정 및 최적화 효과 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceOptimizedQueryEngine } from '@/services/ai/performance-optimized-query-engine';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type { QueryRequest } from '@/services/ai/SimplifiedQueryEngine';

// Mock dependencies
vi.mock('@/services/ai/supabase-rag-engine');
vi.mock('@/services/mcp/CloudContextLoader');
vi.mock('@/lib/logger');

interface PerformanceTestResult {
  engine: string;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  cacheHitRate?: number;
}

describe.skip('SimplifiedQueryEngine 성능 분석', () => {
  let originalEngine: SimplifiedQueryEngine;
  let optimizedEngine: PerformanceOptimizedQueryEngine;
  
  const testQueries = [
    '서버 상태를 확인해주세요',
    'CPU 사용률이 높은 서버는?',
    '메모리 부족한 서버 목록',
    '디스크 용량 80% 이상인 서버',
    '네트워크 트래픽이 많은 서버'
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    originalEngine = new SimplifiedQueryEngine();
    optimizedEngine = new PerformanceOptimizedQueryEngine({
      enableParallelProcessing: true,
      enablePredictiveLoading: true,
      enableCircuitBreaker: true,
      warmupOnStart: false, // 테스트에서는 수동 워밍업
      cacheStrategy: 'aggressive',
      timeoutMs: 5000
    });
  });

  afterEach(() => {
    if (optimizedEngine) {
      optimizedEngine.clearOptimizationCache();
    }
  });

  describe('1. 초기화 성능 분석', () => {
    it('기본 엔진 초기화 시간 측정', async () => {
      const startTime = Date.now();
      
      // 여러 번 초기화 호출 (실제 사용 패턴)
      await originalEngine._initialize();
      await originalEngine._initialize(); // 중복 호출
      await originalEngine._initialize(); // 중복 호출
      
      const initTime = Date.now() - startTime;
      
      console.log(`🔍 기본 엔진 초기화 시간: ${initTime}ms`);
      expect(initTime).toBeLessThan(5000); // 5초 이내
    });

    it('최적화된 엔진 워밍업 시간 측정', async () => {
      const startTime = Date.now();
      
      // 워밍업 수행
      await optimizedEngine._initialize();
      
      const warmupTime = Date.now() - startTime;
      const stats = optimizedEngine.getPerformanceStats();
      
      console.log(`🚀 최적화된 엔진 워밍업 시간: ${warmupTime}ms`);
      console.log(`📊 예열된 임베딩: ${stats.optimization.preloadedEmbeddings}개`);
      
      expect(warmupTime).toBeLessThan(10000); // 10초 이내
      expect(stats.optimization.warmupCompleted).toBeTruthy();
    });
  });

  describe('2. 쿼리 처리 성능 비교', () => {
    it('단일 쿼리 성능 비교 - 로컬 모드', async () => {
      const request: QueryRequest = {
        query: testQueries[0],
        mode: 'local',
        options: {
          includeMCPContext: false
        }
      };

      // 기본 엔진 테스트
      const originalStart = Date.now();
      const originalResult = await originalEngine.query(request);
      const originalTime = Date.now() - originalStart;

      // 최적화된 엔진 테스트
      const optimizedStart = Date.now();
      const optimizedResult = await optimizedEngine.query(request);
      const optimizedTime = Date.now() - optimizedStart;

      console.log(`⚡ 성능 비교 (로컬 모드):`);
      console.log(`   기본 엔진: ${originalTime}ms`);
      console.log(`   최적화 엔진: ${optimizedTime}ms`);
      console.log(`   개선율: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);

      expect(originalResult.success).toBeTruthy();
      expect(optimizedResult.success).toBeTruthy();
      expect(optimizedResult.metadata?.optimized).toBeTruthy();
    });

    it('단일 쿼리 성능 비교 - Google AI 모드', async () => {
      const request: QueryRequest = {
        query: testQueries[1],
        mode: 'google-ai',
        options: {
          includeMCPContext: false,
          maxTokens: 500 // 빠른 응답을 위해 제한
        }
      };

      // 기본 엔진 테스트
      const originalStart = Date.now();
      const originalResult = await originalEngine.query(request);
      const originalTime = Date.now() - originalStart;

      // 최적화된 엔진 테스트
      const optimizedStart = Date.now();
      const optimizedResult = await optimizedEngine.query(request);
      const optimizedTime = Date.now() - optimizedStart;

      console.log(`🌐 성능 비교 (Google AI 모드):`);
      console.log(`   기본 엔진: ${originalTime}ms`);
      console.log(`   최적화 엔진: ${optimizedTime}ms`);
      console.log(`   개선율: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);

      expect(originalResult.success).toBeTruthy();
      expect(optimizedResult.success).toBeTruthy();
    });
  });

  describe('3. 다중 쿼리 성능 분석', () => {
    it('연속 쿼리 처리 성능 측정', async () => {
      const iterations = 5;
      
      // 기본 엔진 테스트
      const originalResults = await performBatchTest(originalEngine, testQueries.slice(0, iterations));
      
      // 최적화된 엔진 테스트  
      const optimizedResults = await performBatchTest(optimizedEngine, testQueries.slice(0, iterations));

      console.log(`📊 배치 처리 성능 비교 (${iterations}개 쿼리):`);
      console.log(`   기본 엔진:`);
      console.log(`     평균 응답시간: ${originalResults.avgResponseTime}ms`);
      console.log(`     최대 응답시간: ${originalResults.maxResponseTime}ms`);
      console.log(`     성공률: ${originalResults.successRate}%`);
      
      console.log(`   최적화된 엔진:`);
      console.log(`     평균 응답시간: ${optimizedResults.avgResponseTime}ms`);
      console.log(`     최대 응답시간: ${optimizedResults.maxResponseTime}ms`);
      console.log(`     성공률: ${optimizedResults.successRate}%`);
      console.log(`     캐시 히트율: ${optimizedResults.cacheHitRate}%`);

      const improvement = ((originalResults.avgResponseTime - optimizedResults.avgResponseTime) / originalResults.avgResponseTime * 100).toFixed(1);
      console.log(`   전체 개선율: ${improvement}%`);

      expect(optimizedResults.successRate).toBeGreaterThanOrEqual(originalResults.successRate);
      expect(optimizedResults.avgResponseTime).toBeLessThanOrEqual(originalResults.avgResponseTime * 1.1); // 10% 오차 허용
    });

    it('캐시 효과 분석', async () => {
      // 동일한 쿼리 반복 실행
      const repeatQuery = testQueries[0];
      const iterations = 3;
      
      const responses = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const result = await optimizedEngine.query({
          query: repeatQuery,
          mode: 'local'
        });
        const responseTime = Date.now() - start;
        
        responses.push({
          iteration: i + 1,
          responseTime,
          cached: result.metadata?.cacheHit === true
        });
      }

      console.log(`🎯 캐시 효과 분석:`);
      responses.forEach(r => {
        console.log(`   ${r.iteration}회차: ${r.responseTime}ms (캐시: ${r.cached ? 'HIT' : 'MISS'})`);
      });

      // 첫 번째는 캐시 미스, 이후는 캐시 히트일 가능성 높음
      const firstResponse = responses[0];
      const laterResponses = responses.slice(1);
      
      expect(firstResponse.cached).toBe(false);
      
      // 캐시 히트된 응답들이 더 빨라야 함
      const cachedResponses = laterResponses.filter(r => r.cached);
      if (cachedResponses.length > 0) {
        const avgCachedTime = cachedResponses.reduce((sum, r) => sum + r.responseTime, 0) / cachedResponses.length;
        expect(avgCachedTime).toBeLessThan(firstResponse.responseTime * 0.8); // 20% 이상 빨라야 함
      }
    });
  });

  describe('4. 병목 지점 분석', () => {
    it('MCP 컨텍스트 수집 오버헤드 측정', async () => {
      const testQuery = testQueries[2];
      
      // MCP 비활성화 테스트
      const withoutMCPStart = Date.now();
      const withoutMCPResult = await optimizedEngine.query({
        query: testQuery,
        mode: 'local',
        options: { includeMCPContext: false }
      });
      const withoutMCPTime = Date.now() - withoutMCPStart;
      
      // MCP 활성화 테스트
      const withMCPStart = Date.now();
      const withMCPResult = await optimizedEngine.query({
        query: testQuery,
        mode: 'local',
        options: { includeMCPContext: true }
      });
      const withMCPTime = Date.now() - withMCPStart;
      
      const mcpOverhead = withMCPTime - withoutMCPTime;
      const overheadPercentage = (mcpOverhead / withoutMCPTime * 100).toFixed(1);
      
      console.log(`🔍 MCP 컨텍스트 오버헤드 분석:`);
      console.log(`   MCP 비활성화: ${withoutMCPTime}ms`);
      console.log(`   MCP 활성화: ${withMCPTime}ms`);
      console.log(`   오버헤드: ${mcpOverhead}ms (${overheadPercentage}%)`);
      
      expect(withoutMCPResult.success).toBe(true);
      expect(withMCPResult.success).toBe(true);
      expect(mcpOverhead).toBeGreaterThanOrEqual(0);
    });

    it('병렬 처리 효과 측정', async () => {
      // 병렬 처리 비활성화
      const sequentialEngine = new PerformanceOptimizedQueryEngine({
        enableParallelProcessing: false,
        enablePredictiveLoading: false,
        warmupOnStart: false
      });

      const testRequest: QueryRequest = {
        query: testQueries[3],
        mode: 'local',
        options: { includeMCPContext: true }
      };

      // 순차 처리 테스트
      const sequentialStart = Date.now();
      const sequentialResult = await sequentialEngine.query(testRequest);
      const sequentialTime = Date.now() - sequentialStart;

      // 병렬 처리 테스트
      const parallelStart = Date.now();
      const parallelResult = await optimizedEngine.query(testRequest);
      const parallelTime = Date.now() - parallelStart;

      const improvement = ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(1);

      console.log(`⚡ 병렬 처리 효과 분석:`);
      console.log(`   순차 처리: ${sequentialTime}ms`);
      console.log(`   병렬 처리: ${parallelTime}ms`);
      console.log(`   개선율: ${improvement}%`);

      expect(sequentialResult.success).toBeTruthy();
      expect(parallelResult.success).toBeTruthy();
      expect(parallelResult.metadata?.parallelProcessed).toBeTruthy();
    });
  });

  describe('5. 회로 차단기 동작 확인', () => {
    it('연속 실패 시 회로 차단기 활성화', async () => {
      // 실패하도록 설정된 요청 (잘못된 모드)
      const failingRequest: QueryRequest = {
        query: 'test query',
        mode: 'invalid-mode' as any,
      };

      const results = [];
      
      // 연속으로 실패 요청 보내기
      for (let i = 0; i < 7; i++) {
        const start = Date.now();
        const result = await optimizedEngine.query(failingRequest);
        const responseTime = Date.now() - start;
        
        results.push({
          attempt: i + 1,
          success: result.success,
          engine: result.engine,
          responseTime,
          isFallback: result.metadata?.fallback === true
        });
      }

      console.log(`🔌 회로 차단기 동작 분석:`);
      results.forEach(r => {
        console.log(`   ${r.attempt}회차: ${r.success ? 'SUCCESS' : 'FAIL'} (${r.responseTime}ms) ${r.isFallback ? '[FALLBACK]' : ''}`);
      });

      // 나중에 폴백 응답이 더 빨라져야 함
      const laterAttempts = results.slice(-3);
      const fallbackResponses = laterAttempts.filter(r => r.isFallback);
      
      if (fallbackResponses.length > 0) {
        const avgFallbackTime = fallbackResponses.reduce((sum, r) => sum + r.responseTime, 0) / fallbackResponses.length;
        expect(avgFallbackTime).toBeLessThan(200); // 폴백은 200ms 이내
      }
    });
  });
});

/**
 * 배치 테스트 실행 도구
 */
async function performBatchTest(
  engine: SimplifiedQueryEngine | PerformanceOptimizedQueryEngine, 
  queries: string[]
): Promise<PerformanceTestResult> {
  const results = [];
  
  for (const query of queries) {
    const start = Date.now();
    try {
      const result = await engine.query({
        query,
        mode: 'local',
        options: { includeMCPContext: false }
      });
      
      const responseTime = Date.now() - start;
      results.push({
        success: result.success,
        responseTime,
        cacheHit: result.metadata?.cacheHit === true
      });
    } catch (error) {
      const responseTime = Date.now() - start;
      results.push({
        success: false,
        responseTime,
        cacheHit: false
      });
    }
  }

  const responseTimes = results.map(r => r.responseTime);
  const successCount = results.filter(r => r.success).length;
  const cacheHits = results.filter(r => r.cacheHit).length;

  return {
    engine: engine.constructor.name,
    avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes),
    successRate: Math.round((successCount / results.length) * 100),
    cacheHitRate: Math.round((cacheHits / results.length) * 100)
  };
}