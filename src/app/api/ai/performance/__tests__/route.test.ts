/**
 * 📡 Performance API 엔드포인트 테스트
 * 
 * 테스트 영역:
 * 1. GET /api/ai/performance - 성능 통계 조회
 * 2. POST /api/ai/performance - 벤치마크 실행
 * 3. DELETE /api/ai/performance - 캐시 초기화
 * 4. 에러 처리 및 예외 상황
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/ai/performance/route';

// Mock 설정
vi.mock('@/services/ai/performance-optimized-query-engine');
vi.mock('@/services/ai/SimplifiedQueryEngine');
vi.mock('@/lib/logger');

// 테스트 헬퍼 함수
function createMockRequest(method: string, body?: any): NextRequest {
  const url = 'http://localhost:3000/api/ai/performance';
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return new NextRequest(url, options);
}

describe('📡 Performance API 엔드포인트 테스트', () => {
  
  beforeAll(() => {
    // 환경 변수 설정
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/ai/performance - 성능 통계 조회', () => {
    
    it('정상적인 성능 통계를 반환해야 함', async () => {
      // Mock 성능 엔진 설정
      const mockEngine = {
        getPerformanceStats: vi.fn().mockReturnValue({
          metrics: {
            totalQueries: 150,
            avgResponseTime: 1250,
            cacheHitRate: 0.75,
            errorRate: 0.05,
            parallelEfficiency: 0.85,
            optimizationsSaved: 25
          },
          optimization: {
            warmupCompleted: true,
            preloadedEmbeddings: 8,
            circuitBreakers: 2,
            cacheHitRate: 0.75
          }
        }),
        healthCheck: vi.fn().mockResolvedValue({
          status: 'healthy',
          engines: {
            localRAG: true,
            googleAI: true,
            mcp: true
          }
        })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('service', 'ai-performance-monitor');
      
      // 메트릭 검증
      expect(data.metrics).toEqual({
        totalQueries: 150,
        avgResponseTime: 1250,
        cacheHitRate: 75, // 백분율 변환
        errorRate: 5,
        parallelEfficiency: 85,
        optimizationsSaved: 25
      });

      // 최적화 상태 검증
      expect(data.optimization).toEqual({
        warmupCompleted: true,
        preloadedEmbeddings: 8,
        circuitBreakers: 2,
        cacheHitRate: 75
      });

      // 헬스 상태 검증
      expect(data.health).toEqual({
        status: 'healthy',
        engines: {
          localRAG: true,
          googleAI: true,
          mcp: true
        }
      });

      // 분석 결과 검증
      expect(data.analysis).toHaveProperty('performanceGrade');
      expect(data.analysis).toHaveProperty('bottlenecks');
      expect(data.analysis).toHaveProperty('recommendations');
      
      console.log('✅ 성능 통계 응답 검증 완료:', data.analysis.performanceGrade);
    });

    it('엔진 오류 시 500 에러를 반환해야 함', async () => {
      const mockEngine = {
        getPerformanceStats: vi.fn().mockImplementation(() => {
          throw new Error('Engine _initialization failed');
        })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/ai/performance - 벤치마크 실행', () => {
    
    it('비교 벤치마크를 올바르게 실행해야 함', async () => {
      // Mock 엔진들 설정
      const mockOriginalEngine = {
        query: vi.fn()
          .mockResolvedValueOnce({ success: true, processingTime: 1500 })
          .mockResolvedValueOnce({ success: true, processingTime: 1400 })
          .mockResolvedValueOnce({ success: true, processingTime: 1600 })
      };

      const mockOptimizedEngine = {
        query: vi.fn()
          .mockResolvedValueOnce({ success: true, processingTime: 800, metadata: { cacheHit: false } })
          .mockResolvedValueOnce({ success: true, processingTime: 400, metadata: { cacheHit: true } })
          .mockResolvedValueOnce({ success: true, processingTime: 350, metadata: { cacheHit: true } })
      };

      const { SimplifiedQueryEngine } = await import('@/services/ai/SimplifiedQueryEngine');
      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      
      (SimplifiedQueryEngine as vi.Mock).mockImplementation(() => mockOriginalEngine);
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockOptimizedEngine);

      const requestBody = {
        mode: 'comparison',
        queries: ['서버 상태', 'CPU 사용률', '메모리 상태'],
        iterations: 1
      };

      const request = createMockRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('benchmarkType', 'comparison');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('analysis');

      // 결과 구조 검증
      expect(data.results).toHaveProperty('originalEngine');
      expect(data.results).toHaveProperty('optimizedEngine');
      expect(data.results.originalEngine).toHaveProperty('avgResponseTime');
      expect(data.results.optimizedEngine).toHaveProperty('avgResponseTime');
      expect(data.results.optimizedEngine).toHaveProperty('cacheHitRate');

      // 성능 개선 분석
      expect(data.analysis).toHaveProperty('improvementPercentage');
      expect(data.analysis).toHaveProperty('timeSaved');
      expect(data.analysis).toHaveProperty('performanceBetter');
      expect(data.analysis).toHaveProperty('cacheEffectiveness');

      console.log('🏆 비교 벤치마크 결과:', {
        improvement: data.analysis.improvementPercentage,
        timeSaved: data.analysis.timeSaved,
        cacheHitRate: data.results.optimizedEngine.cacheHitRate
      });
    });

    it('부하 테스트 벤치마크를 올바르게 실행해야 함', async () => {
      const mockEngine = {
        query: vi.fn().mockImplementation(() => {
          const processingTime = Math.random() * 1000 + 500;
          return Promise.resolve({ 
            success: true, 
            processingTime: processingTime,
            metadata: { cacheHit: Math.random() > 0.5 }
          });
        })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const requestBody = {
        mode: 'load',
        queries: ['테스트 쿼리 1', '테스트 쿼리 2'],
        iterations: 5
      };

      const request = createMockRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('benchmarkType', 'load');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('analysis');

      // 부하 테스트 결과 검증
      expect(data.results).toHaveProperty('totalTime');
      expect(typeof data.results.totalTime).toBe('number');
      expect(data.results).toHaveProperty('avgResponseTime');
      expect(typeof data.results.avgResponseTime).toBe('number');
      expect(data.results).toHaveProperty('successRate');
      expect(typeof data.results.successRate).toBe('number');
      expect(data.results).toHaveProperty('cacheHitRate');
      expect(typeof data.results.cacheHitRate).toBe('number');
      expect(data.results).toHaveProperty('throughput');
      expect(typeof data.results.throughput).toBe('number');

      // 분석 결과 검증
      expect(data.analysis).toHaveProperty('performanceGrade');
      expect(data.analysis).toHaveProperty('bottlenecks');
      expect(Array.isArray(data.analysis.bottlenecks)).toBe(true);
      expect(data.analysis).toHaveProperty('scalability');

      // 값 범위 검증
      expect(data.results.successRate).toBeGreaterThan(0);
      expect(data.results.throughput).toBeGreaterThanOrEqual(0);

      console.log('🚀 부하 테스트 결과:', {
        throughput: data.results.throughput,
        successRate: data.results.successRate,
        grade: data.analysis.performanceGrade
      });
    });

    it('잘못된 벤치마크 모드에 대해 400 에러를 반환해야 함', async () => {
      const requestBody = {
        mode: 'invalid_mode',
        queries: ['test'],
        iterations: 1
      };

      const request = createMockRequest('POST', requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error', 'Invalid benchmark mode');
      expect(data).toHaveProperty('supportedModes');
      expect(data.supportedModes).toContain('comparison');
      expect(data.supportedModes).toContain('load');
    });

    it('잘못된 JSON 요청에 대해 500 에러를 반환해야 함', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/ai/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /api/ai/performance - 캐시 초기화', () => {
    
    it('캐시를 성공적으로 초기화해야 함', async () => {
      const mockEngine = {
        clearOptimizationCache: vi.fn()
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Performance cache cleared successfully');
      expect(data).toHaveProperty('timestamp');
      
      expect(mockEngine.clearOptimizationCache).toHaveBeenCalledTimes(1);
      
      console.log('🧹 캐시 초기화 완료:', data.timestamp);
    });

    it('캐시 초기화 실패 시 500 에러를 반환해야 함', async () => {
      const mockEngine = {
        clearOptimizationCache: vi.fn().mockImplementation(() => {
          throw new Error('Cache clear failed');
        })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error', 'Cache clear failed');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('🔍 성능 분석 알고리즘 테스트', () => {
    
    it('성능 등급을 올바르게 계산해야 함', async () => {
      // calculatePerformanceGrade 함수 테스트를 위한 다양한 메트릭 시나리오
      const testScenarios = [
        {
          metrics: { avgResponseTime: 300, cacheHitRate: 0.8, errorRate: 0.02 },
          expectedGrade: 'A+',
          description: '매우 우수한 성능'
        },
        {
          metrics: { avgResponseTime: 800, cacheHitRate: 0.6, errorRate: 0.08 },
          expectedGrade: 'A',
          description: '우수한 성능'
        },
        {
          metrics: { avgResponseTime: 1500, cacheHitRate: 0.4, errorRate: 0.12 },
          expectedGrade: 'B',
          description: '양호한 성능'
        },
        {
          metrics: { avgResponseTime: 2500, cacheHitRate: 0.2, errorRate: 0.20 },
          expectedGrade: 'C',
          description: '보통 성능'
        },
        {
          metrics: { avgResponseTime: 4000, cacheHitRate: 0.1, errorRate: 0.30 },
          expectedGrade: 'D',
          description: '개선 필요'
        }
      ];

      for (const scenario of testScenarios) {
        const mockEngine = {
          getPerformanceStats: vi.fn().mockReturnValue({
            metrics: scenario.metrics,
            optimization: {
              warmupCompleted: true,
              preloadedEmbeddings: 5,
              circuitBreakers: 1,
              cacheHitRate: scenario.metrics.cacheHitRate
            }
          }),
          healthCheck: vi.fn().mockResolvedValue({
            status: 'healthy',
            engines: { localRAG: true, googleAI: true, mcp: true }
          })
        };

        const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
        (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);
  
        const response = await GET();
        const data = await response.json();

        expect(data.analysis.performanceGrade).toBe(scenario.expectedGrade);
        console.log(`📊 ${scenario.description}: ${scenario.expectedGrade} (응답시간: ${scenario.metrics.avgResponseTime}ms, 캐시: ${(scenario.metrics.cacheHitRate * 100)}%)`);
      }
    });

    it('병목 지점을 올바르게 식별해야 함', async () => {
      const problematicMetrics = {
        avgResponseTime: 3000, // 높은 응답 시간
        cacheHitRate: 0.2,     // 낮은 캐시 적중률
        errorRate: 0.15,       // 높은 에러율
        parallelEfficiency: 0.4 // 낮은 병렬 처리 효율성
      };

      const mockEngine = {
        getPerformanceStats: vi.fn().mockReturnValue({
          metrics: problematicMetrics,
          optimization: {
            warmupCompleted: false,
            preloadedEmbeddings: 2,
            circuitBreakers: 1,
            cacheHitRate: problematicMetrics.cacheHitRate
          }
        }),
        healthCheck: vi.fn().mockResolvedValue({
          status: 'degraded',
          engines: { localRAG: true, googleAI: false, mcp: false }
        })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await GET();
      const data = await response.json();

      // 예상되는 병목 지점들
      const expectedBottlenecks = ['response_time', 'cache_efficiency', 'error_rate', 'parallel_processing'];
      
      for (const bottleneck of expectedBottlenecks) {
        expect(data.analysis.bottlenecks).toContain(bottleneck);
      }

      // 권장사항이 제공되어야 함
      expect(data.analysis.recommendations).toBeInstanceOf(Array);
      expect(data.analysis.recommendations.length).toBeGreaterThan(0);

      console.log('🔍 식별된 병목 지점:', data.analysis.bottlenecks);
      console.log('💡 권장사항:', data.analysis.recommendations);
    });
  });

  describe('🌐 CORS 및 HTTP 헤더 테스트', () => {
    
    it('모든 응답에 CORS 헤더가 포함되어야 함', async () => {
      const mockEngine = {
        getPerformanceStats: vi.fn().mockReturnValue({
          metrics: { totalQueries: 0, avgResponseTime: 0, cacheHitRate: 0, errorRate: 0, parallelEfficiency: 0, optimizationsSaved: 0 },
          optimization: { warmupCompleted: true, preloadedEmbeddings: 0, circuitBreakers: 0, cacheHitRate: 0 }
        }),
        healthCheck: vi.fn().mockResolvedValue({ status: 'healthy', engines: { ragEngine: { status: 'healthy', initialized: true } } })
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await GET();
      
      // CORS 헤더 확인
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
      
      console.log('🌐 CORS 헤더 확인 완료');
    });

    it('Content-Type이 application/json이어야 함', async () => {
      const mockEngine = {
        clearOptimizationCache: vi.fn()
      };

      const { getPerformanceOptimizedQueryEngine } = await import('@/services/ai/performance-optimized-query-engine');
      (getPerformanceOptimizedQueryEngine as vi.Mock).mockReturnValue(mockEngine);

      const response = await DELETE();
      
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      console.log('📄 Content-Type 헤더 확인 완료');
    });
  });
});