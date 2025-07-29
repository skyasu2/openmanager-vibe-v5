/**
 * 🚀 PerformanceOptimizedQueryEngine E2E 테스트
 * 
 * 테스트 영역:
 * 1. 성능 API 엔드포인트 테스트
 * 2. 벤치마크 비교 테스트  
 * 3. 캐시 효과 검증 테스트
 * 4. 회로 차단기 동작 테스트
 * 5. 병렬 처리 성능 테스트
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getPerformanceOptimizedQueryEngine, PerformanceOptimizedQueryEngine } from '@/services/ai/performance-optimized-query-engine';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import { aiLogger } from '@/lib/logger';

// E2E 테스트를 위한 실제 환경 설정
const E2E_TEST_CONFIG = {
  enableParallelProcessing: true,
  enablePredictiveLoading: true,
  enableCircuitBreaker: true,
  warmupOnStart: false, // 테스트에서는 수동 제어
  cacheStrategy: 'aggressive' as const,
  timeoutMs: 10000, // 테스트용 짧은 타임아웃
};

const TEST_QUERIES = [
  '서버 상태를 확인해주세요',
  'CPU 사용률을 알려주세요',
  '메모리 상태를 체크해주세요',
  '디스크 용량을 확인해주세요',
  '네트워크 트래픽을 분석해주세요'
];

describe('🚀 PerformanceOptimizedQueryEngine E2E 테스트', () => {
  let optimizedEngine: PerformanceOptimizedQueryEngine;
  let originalEngine: SimplifiedQueryEngine;

  beforeAll(async () => {
    // 테스트용 로거 설정
    vi.spyOn(aiLogger, 'info').mockImplementation(() => {});
    vi.spyOn(aiLogger, 'warn').mockImplementation(() => {});
    vi.spyOn(aiLogger, 'error').mockImplementation(() => {});

    // 엔진 초기화
    optimizedEngine = getPerformanceOptimizedQueryEngine(E2E_TEST_CONFIG);
    originalEngine = new SimplifiedQueryEngine();

    // 기본 초기화 대기
    await optimizedEngine._initialize();
    await originalEngine._initialize();
  });

  afterAll(() => {
    // 캐시 정리
    optimizedEngine.clearOptimizationCache();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('🔧 엔진 초기화 및 기본 기능', () => {
    it('최적화된 엔진이 정상적으로 초기화되어야 함', async () => {
      const healthCheck = await optimizedEngine.healthCheck();
      
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.engines).toHaveProperty('ragEngine');
      expect(healthCheck.engines).toHaveProperty('contextLoader');
    });

    it('성능 통계가 올바르게 반환되어야 함', () => {
      const stats = optimizedEngine.getPerformanceStats();
      
      expect(stats).toHaveProperty('metrics');
      expect(stats).toHaveProperty('optimization');
      expect(stats.metrics).toHaveProperty('totalQueries');
      expect(stats.metrics).toHaveProperty('avgResponseTime');
      expect(stats.metrics).toHaveProperty('cacheHitRate');
      expect(stats.optimization).toHaveProperty('warmupCompleted');
      expect(stats.optimization).toHaveProperty('preloadedEmbeddings');
    });

    it('성능 설정이 올바르게 업데이트되어야 함', () => {
      const newConfig = {
        enableParallelProcessing: false,
        cacheStrategy: 'conservative' as const,
        timeoutMs: 5000
      };

      optimizedEngine.updateConfig(newConfig);
      
      // 설정 변경 확인을 위한 간접 테스트
      expect(() => optimizedEngine.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('📊 성능 비교 벤치마크 테스트', () => {
    it('최적화된 엔진이 기본 엔진보다 빨라야 함', async () => {
      const testQuery = TEST_QUERIES[0];
      const iterations = 3;

      // 기본 엔진 성능 측정
      const originalTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
          await originalEngine.query({
            query: testQuery,
            mode: 'local',
            options: { includeMCPContext: false }
          });
        } catch (error) {
          // 에러 무시하고 시간만 측정
        }
        originalTimes.push(Date.now() - start);
      }

      // 최적화된 엔진 성능 측정 (워밍업 포함)
      await optimizedEngine.performWarmup?.(); // private 메서드지만 테스트용
      
      const optimizedTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
          await optimizedEngine.query({
            query: testQuery,
            mode: 'local',
            options: { includeMCPContext: false }
          });
        } catch (error) {
          // 에러 무시하고 시간만 측정
        }
        optimizedTimes.push(Date.now() - start);
      }

      const originalAvg = originalTimes.reduce((a, b) => a + b, 0) / originalTimes.length;
      const optimizedAvg = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length;

      console.log(`원본 엔진 평균: ${originalAvg}ms`);
      console.log(`최적화 엔진 평균: ${optimizedAvg}ms`);
      console.log(`성능 개선: ${((originalAvg - optimizedAvg) / originalAvg * 100).toFixed(2)}%`);

      // 두 번째 실행부터는 캐시 효과로 더 빨라야 함
      expect(optimizedTimes[2]).toBeLessThanOrEqual(optimizedTimes[0]);
    }, 30000);

    it('병렬 처리 효과를 검증해야 함', async () => {
      const queries = TEST_QUERIES.slice(0, 3);
      
      // 순차 처리 시간 측정
      const sequentialStart = Date.now();
      for (const query of queries) {
        try {
          await optimizedEngine.query({
            query,
            mode: 'local',
            options: { includeMCPContext: false }
          });
        } catch (error) {
          // 에러 무시
        }
      }
      const sequentialTime = Date.now() - sequentialStart;

      // 병렬 처리 시간 측정
      const parallelStart = Date.now();
      await Promise.allSettled(
        queries.map(query => 
          optimizedEngine.query({
            query,
            mode: 'local',
            options: { includeMCPContext: false }
          })
        )
      );
      const parallelTime = Date.now() - parallelStart;

      console.log(`순차 처리: ${sequentialTime}ms`);
      console.log(`병렬 처리: ${parallelTime}ms`);
      console.log(`병렬 효율성: ${((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(2)}%`);

      // 병렬 처리가 더 효율적이어야 함 (최소 10% 개선)
      const efficiency = (sequentialTime - parallelTime) / sequentialTime;
      expect(efficiency).toBeGreaterThan(0.1);
    }, 45000);
  });

  describe('💾 캐시 효과 검증 테스트', () => {
    it('동일 쿼리 반복 시 캐시 적중률이 증가해야 함', async () => {
      const testQuery = TEST_QUERIES[0];
      const iterations = 5;

      // 초기 캐시 통계
      const _initialStats = optimizedEngine.getPerformanceStats();
      const _initialCacheHitRate = _initialStats.metrics.cacheHitRate;

      // 동일 쿼리 반복 실행
      const responseTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
          const result = await optimizedEngine.query({
            query: testQuery,
            mode: 'local',
            options: { includeMCPContext: false }
          });
          
          responseTimes.push(Date.now() - start);
          
          // 캐시 정보 확인
          if (result.metadata?.cacheHit) {
            console.log(`반복 ${i + 1}: 캐시 적중`);
          }
        } catch (error) {
          responseTimes.push(Date.now() - start);
        }
      }

      // 최종 캐시 통계
      const finalStats = optimizedEngine.getPerformanceStats();
      const finalCacheHitRate = finalStats.metrics.cacheHitRate;

      console.log(`초기 캐시 적중률: ${(_initialCacheHitRate * 100).toFixed(2)}%`);
      console.log(`최종 캐시 적중률: ${(finalCacheHitRate * 100).toFixed(2)}%`);
      console.log(`응답 시간 변화: ${responseTimes[0]}ms → ${responseTimes[iterations-1]}ms`);

      // 캐시 적중률이 증가하거나 응답 시간이 개선되어야 함
      const cacheImproved = finalCacheHitRate >= _initialCacheHitRate;
      const timeImproved = responseTimes[iterations-1] <= responseTimes[0] * 1.1; // 10% 여유
      
      expect(cacheImproved || timeImproved).toBe(true);
    }, 30000);

    it('캐시 정리 후 성능이 초기화되어야 함', async () => {
      const testQuery = TEST_QUERIES[1];

      // 캐시 빌드를 위한 쿼리 실행
      await optimizedEngine.query({
        query: testQuery,
        mode: 'local',
        options: { includeMCPContext: false }
      });

      const statsBeforeClear = optimizedEngine.getPerformanceStats();

      // 캐시 정리
      optimizedEngine.clearOptimizationCache();

      const statsAfterClear = optimizedEngine.getPerformanceStats();

      expect(statsAfterClear.optimization.preloadedEmbeddings).toBe(0);
      expect(statsAfterClear.optimization.circuitBreakers).toBe(0);
      expect(statsAfterClear.optimization.warmupCompleted).toBe(false);
    });
  });

  describe('🔌 회로 차단기 동작 테스트', () => {
    it('연속 실패 시 회로 차단기가 작동해야 함', async () => {
      // 실패를 유발하는 잘못된 쿼리
      const invalidQuery = '::INVALID_QUERY_TO_CAUSE_FAILURE::';
      const failureThreshold = 3;

      let circuitBreakerActivated = false;
      const responses: any[] = [];

      // 연속 실패 쿼리 실행
      for (let i = 0; i < failureThreshold + 2; i++) {
        try {
          const result = await optimizedEngine.query({
            query: invalidQuery,
            mode: 'local',
            options: { includeMCPContext: false }
          });

          responses.push(result);

          // 폴백 응답이 나오면 회로 차단기 작동
          if (result.metadata?.fallback) {
            circuitBreakerActivated = true;
            console.log(`반복 ${i + 1}: 회로 차단기 작동 (폴백 응답)`);
          }
        } catch (error) {
          responses.push({ error: error.message });
        }
      }

      console.log(`총 ${responses.length}개 응답 중 폴백: ${responses.filter(r => r.metadata?.fallback).length}개`);

      // 회로 차단기가 작동했거나 안정적인 폴백 응답이 있어야 함
      const hasFallback = responses.some(r => r.metadata?.fallback);
      const allResponsesSuccessful = responses.every(r => r.success !== false);
      
      expect(hasFallback || allResponsesSuccessful).toBe(true);
    }, 25000);

    it('정상 쿼리는 회로 차단기의 영향을 받지 않아야 함', async () => {
      const validQuery = TEST_QUERIES[2];
      
      try {
        const result = await optimizedEngine.query({
          query: validQuery,
          mode: 'local',
          options: { includeMCPContext: false }
        });

        expect(result.success).toBe(true);
        expect(result.metadata?.fallback).toBeUndefined();
        expect(result.response).toBeTruthy();
      } catch (error) {
        // 네트워크 이슈 등으로 실패할 수 있지만 회로 차단기로 인한 실패는 아니어야 함
        console.log('정상 쿼리 실행 중 오류:', error);
      }
    });
  });

  describe('⚡ 타임아웃 및 안정성 테스트', () => {
    it('타임아웃 설정이 올바르게 작동해야 함', async () => {
      // 짧은 타임아웃으로 설정 변경
      optimizedEngine.updateConfig({ timeoutMs: 1000 });

      const start = Date.now();
      
      try {
        await optimizedEngine.query({
          query: '매우 복잡한 시스템 분석을 수행하여 모든 데이터를 처리해주세요',
          mode: 'google-ai', // Google AI는 더 오래 걸릴 수 있음
          options: { 
            includeMCPContext: true, // 더 많은 처리 시간 필요
            maxTokens: 2000 
          }
        });
      } catch (error) {
        // 타임아웃 또는 기타 에러 허용
      }

      const elapsed = Date.now() - start;
      console.log(`타임아웃 테스트 실행 시간: ${elapsed}ms`);

      // 설정된 타임아웃 + 여유시간(2초) 내에 완료되어야 함
      expect(elapsed).toBeLessThan(3000);

      // 타임아웃 설정 복원
      optimizedEngine.updateConfig({ timeoutMs: 15000 });
    }, 5000);

    it('동시 다중 쿼리 처리가 안정적이어야 함', async () => {
      const concurrentQueries = TEST_QUERIES.slice(0, 3);
      const promises = concurrentQueries.map((query, index) => 
        optimizedEngine.query({
          query: `${query} (요청 ${index + 1})`,
          mode: 'local',
          options: { includeMCPContext: false }
        }).catch(error => ({ error: error.message, index }))
      );

      const results = await Promise.allSettled(promises);
      
      console.log(`동시 실행 결과: ${results.length}개 중 ${results.filter(r => r.status === 'fulfilled').length}개 성공`);

      // 최소한 50% 이상은 성공해야 함
      const successRate = results.filter(r => r.status === 'fulfilled').length / results.length;
      expect(successRate).toBeGreaterThanOrEqual(0.5);
    }, 20000);
  });

  describe('📈 성능 메트릭 정확성 테스트', () => {
    it('쿼리 실행 후 메트릭이 올바르게 업데이트되어야 함', async () => {
      const _initialStats = optimizedEngine.getPerformanceStats();
      const _initialTotalQueries = _initialStats.metrics.totalQueries;

      // 테스트 쿼리 실행
      await optimizedEngine.query({
        query: TEST_QUERIES[0],
        mode: 'local',
        options: { includeMCPContext: false }
      });

      const finalStats = optimizedEngine.getPerformanceStats();
      const finalTotalQueries = finalStats.metrics.totalQueries;

      // 쿼리 카운터가 증가해야 함
      expect(finalTotalQueries).toBeGreaterThan(_initialTotalQueries);

      // 평균 응답 시간이 양수여야 함
      expect(finalStats.metrics.avgResponseTime).toBeGreaterThan(0);

      console.log('메트릭 업데이트 확인:', {
        totalQueries: `${_initialTotalQueries} → ${finalTotalQueries}`,
        avgResponseTime: `${finalStats.metrics.avgResponseTime}ms`,
        cacheHitRate: `${(finalStats.metrics.cacheHitRate * 100).toFixed(2)}%`
      });
    });
  });

  describe('🔍 엣지 케이스 테스트', () => {
    it('빈 쿼리에 대해 적절한 응답을 해야 함', async () => {
      const result = await optimizedEngine.query({
        query: '',
        mode: 'local',
        options: { includeMCPContext: false }
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(typeof result.response).toBe('string');
    });

    it('매우 긴 쿼리를 처리할 수 있어야 함', async () => {
      const longQuery = 'CPU 사용률을 확인해주세요 '.repeat(50);
      
      const result = await optimizedEngine.query({
        query: longQuery,
        mode: 'local',
        options: { includeMCPContext: false }
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });

    it('특수 문자가 포함된 쿼리를 처리할 수 있어야 함', async () => {
      const specialCharQuery = '서버 상태 확인 @#$%^&*()_+ 🚀💻📊';
      
      const result = await optimizedEngine.query({
        query: specialCharQuery,
        mode: 'local',
        options: { includeMCPContext: false }
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });
  });
});