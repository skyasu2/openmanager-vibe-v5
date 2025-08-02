/**
 * AI 성능 모니터링 및 최적화 API
 *
 * GET /api/ai/performance - 성능 통계 조회
 * POST /api/ai/performance/optimize - 최적화 실행
 * POST /api/ai/performance/benchmark - 벤치마크 실행
 * DELETE /api/ai/performance/cache - 캐시 초기화
 * - Zod 스키마로 타입 안전성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPerformanceOptimizedQueryEngine } from '@/services/ai/performance-optimized-query-engine';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import { corsHeaders } from '@/lib/api/cors';
import { aiLogger } from '@/lib/logger';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  AIPerformanceStatsResponseSchema,
  AIBenchmarkRequestSchema,
  ComparisonBenchmarkResponseSchema,
  LoadBenchmarkResponseSchema,
  CacheClearResponseSchema,
  type AIPerformanceStatsResponse,
  type AIBenchmarkRequest,
  type ComparisonBenchmarkResponse,
  type LoadBenchmarkResponse,
  type CacheClearResponse,
  type BenchmarkResponseItem,
  type AIPerformanceMetrics,
  type AIOptimizationStatus,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// GET 핸들러
const getHandler = createApiRoute()
  .response(AIPerformanceStatsResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (): Promise<AIPerformanceStatsResponse> => {
    const engine = getPerformanceOptimizedQueryEngine();
    const stats = engine.getPerformanceStats();
    const healthStatus = await engine.healthCheck();

    return {
      success: true,
      timestamp: new Date().toISOString(),
      service: 'ai-performance-monitor',

      // 성능 메트릭
      metrics: {
        totalQueries: stats.metrics.totalQueries,
        avgResponseTime: Math.round(stats.metrics.avgResponseTime),
        cacheHitRate: Math.round(stats.metrics.cacheHitRate * 100), // 백분율
        errorRate: Math.round(stats.metrics.errorRate * 100),
        parallelEfficiency: Math.round(
          stats.metrics.parallelEfficiency * 100
        ),
        optimizationsSaved: stats.metrics.optimizationsSaved,
      },

      // 최적화 상태
      optimization: {
        warmupCompleted: stats.optimization.warmupCompleted,
        preloadedEmbeddings: stats.optimization.preloadedEmbeddings,
        circuitBreakers: stats.optimization.circuitBreakers,
        cacheHitRate: Math.round(stats.optimization.cacheHitRate * 100),
      },

      // 시스템 헬스
      health: {
        status: healthStatus.status as 'healthy' | 'degraded' | 'unavailable',
        engines: Object.entries(healthStatus.engines || {}).map(([id, available]) => ({
          status: available ? 'healthy' : 'unavailable' as 'healthy' | 'degraded' | 'unavailable',
          id,
          responseTime: 0,
          lastCheck: new Date().toISOString(),
        })),
      },

      // 성능 분석
      analysis: {
        performanceGrade: calculatePerformanceGrade(stats.metrics),
        bottlenecks: identifyBottlenecks(stats.metrics),
        recommendations: generateRecommendations(
          stats.metrics,
          stats.optimization
        ),
      },
    };
  });

export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    aiLogger.error('성능 통계 조회 실패', error);
    return NextResponse.json(
      {
        success: false,
        error: '성능 통계 조회 중 오류가 발생했습니다',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(AIBenchmarkRequestSchema)
  .response(z.union([ComparisonBenchmarkResponseSchema, LoadBenchmarkResponseSchema]))
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<ComparisonBenchmarkResponse | LoadBenchmarkResponse> => {
    const {
      mode = 'comparison',
      queries = ['서버 상태', 'CPU 사용률', '메모리 상태'],
      iterations = 3,
    } = context.body;

    console.log(`🔬 성능 벤치마크 시작: ${mode} 모드, ${iterations}회 반복`);

    if (mode === 'comparison') {
      return await runComparisonBenchmark(queries, iterations);
    } else if (mode === 'load') {
      return await runLoadBenchmark(queries, iterations);
    } else {
      throw new Error(`Invalid benchmark mode: ${mode}. Supported modes: comparison, load`);
    }
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    aiLogger.error('성능 API 처리 실패', error);
    return NextResponse.json(
      {
        success: false,
        error: '요청 처리 중 오류가 발생했습니다',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE 핸들러
const deleteHandler = createApiRoute()
  .response(CacheClearResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (): Promise<CacheClearResponse> => {
    const engine = getPerformanceOptimizedQueryEngine();
    engine.clearOptimizationCache();

    return {
      success: true,
      message: 'Performance cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  });

export async function DELETE(request: NextRequest) {
  try {
    return await deleteHandler(request);
  } catch (error) {
    aiLogger.error('캐시 초기화 실패', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cache clear failed',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * 📊 기본 엔진 vs 최적화된 엔진 비교 벤치마크
 */
async function runComparisonBenchmark(queries: string[], iterations: number): Promise<ComparisonBenchmarkResponse> {
  const originalEngine = new SimplifiedQueryEngine();
  const optimizedEngine = getPerformanceOptimizedQueryEngine();

  const results = {
    originalEngine: { totalTime: 0, responses: [] as BenchmarkResponseItem[] },
    optimizedEngine: { totalTime: 0, responses: [] as BenchmarkResponseItem[] },
  };

  // 기본 엔진 테스트
  for (let i = 0; i < iterations; i++) {
    for (const query of queries) {
      const start = Date.now();
      try {
        const result = await originalEngine.query({
          query,
          mode: 'local',
          options: { includeMCPContext: false },
        });
        const responseTime = Date.now() - start;
        results.originalEngine.totalTime += responseTime;
        results.originalEngine.responses.push({
          query: query.substring(0, 20),
          iteration: i + 1,
          responseTime,
          success: result.success,
        });
      } catch {
        const responseTime = Date.now() - start;
        results.originalEngine.totalTime += responseTime;
        results.originalEngine.responses.push({
          query: query.substring(0, 20),
          iteration: i + 1,
          responseTime,
          success: false,
        });
      }
    }
  }

  // 최적화된 엔진 테스트
  for (let i = 0; i < iterations; i++) {
    for (const query of queries) {
      const start = Date.now();
      try {
        const result = await optimizedEngine.query({
          query,
          mode: 'local',
          options: { includeMCPContext: false },
        });
        const responseTime = Date.now() - start;
        results.optimizedEngine.totalTime += responseTime;
        results.optimizedEngine.responses.push({
          query: query.substring(0, 20),
          iteration: i + 1,
          responseTime,
          success: result.success,
          cached: result.metadata?.cacheHit === true,
        });
      } catch {
        const responseTime = Date.now() - start;
        results.optimizedEngine.totalTime += responseTime;
        results.optimizedEngine.responses.push({
          query: query.substring(0, 20),
          iteration: i + 1,
          responseTime,
          success: false,
          cached: false,
        });
      }
    }
  }

  // 통계 계산
  const originalAvg =
    results.originalEngine.totalTime / results.originalEngine.responses.length;
  const optimizedAvg =
    results.optimizedEngine.totalTime /
    results.optimizedEngine.responses.length;
  const improvement = ((originalAvg - optimizedAvg) / originalAvg) * 100;

  const cacheHits = results.optimizedEngine.responses.filter(
    (r) => r.cached
  ).length;
  const cacheHitRate =
    (cacheHits / results.optimizedEngine.responses.length) * 100;

  return {
    success: true,
    benchmarkType: 'comparison',
    timestamp: new Date().toISOString(),
    configuration: {
      queries: queries.length,
      iterations,
      totalQueries: queries.length * iterations,
    },
    results: {
      originalEngine: {
        avgResponseTime: Math.round(originalAvg),
        totalTime: results.originalEngine.totalTime,
        successRate: Math.round(
          (results.originalEngine.responses.filter((r) => r.success).length /
            results.originalEngine.responses.length) *
            100
        ),
        responses: results.originalEngine.responses,
      },
      optimizedEngine: {
        avgResponseTime: Math.round(optimizedAvg),
        totalTime: results.optimizedEngine.totalTime,
        successRate: Math.round(
          (results.optimizedEngine.responses.filter((r) => r.success).length /
            results.optimizedEngine.responses.length) *
            100
        ),
        cacheHitRate: Math.round(cacheHitRate),
        responses: results.optimizedEngine.responses,
      },
    },
    analysis: {
      improvementPercentage: Math.round(improvement * 100) / 100,
      timeSaved: Math.round(
        results.originalEngine.totalTime - results.optimizedEngine.totalTime
      ),
      performanceBetter: improvement > 0,
      cacheEffectiveness:
        cacheHitRate > 30 ? 'high' : cacheHitRate > 10 ? 'medium' : 'low',
    },
  };
}

/**
 * 🚀 부하 테스트 벤치마크
 */
async function runLoadBenchmark(queries: string[], iterations: number): Promise<LoadBenchmarkResponse> {
  const engine = getPerformanceOptimizedQueryEngine();
  const concurrency = Math.min(5, iterations); // 최대 5개 동시 실행

  const startTime = Date.now();
  const results: BenchmarkResponseItem[] = [];

  // 동시 실행을 위한 배치 처리
  for (let i = 0; i < iterations; i += concurrency) {
    const batch = [];
    for (let j = i; j < Math.min(i + concurrency, iterations); j++) {
      const query = queries[j % queries.length];
      batch.push(
        engine
          .query({
            query,
            mode: 'local',
            options: { includeMCPContext: false },
          })
          .then((result) => ({
            iteration: j + 1,
            query: query.substring(0, 20),
            responseTime: result.processingTime,
            success: result.success,
            cached: result.metadata?.cacheHit === true,
          }))
          .catch((error) => ({
            iteration: j + 1,
            query: query.substring(0, 20),
            responseTime: 0,
            success: false,
            cached: false,
            error: error.message,
          }))
      );
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const totalTime = Date.now() - startTime;
  const avgResponseTime =
    results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
  const successRate =
    (results.filter((r) => r.success).length / results.length) * 100;
  const cacheHitRate =
    (results.filter((r) => r.cached).length / results.length) * 100;
  const throughput = totalTime > 0 ? (results.length / totalTime) * 1000 : 0; // queries per second

  return {
    success: true,
    benchmarkType: 'load',
    timestamp: new Date().toISOString(),
    configuration: {
      queries: queries.length,
      iterations,
      concurrency,
      totalQueries: results.length,
    },
    results: {
      totalTime,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate),
      cacheHitRate: Math.round(cacheHitRate),
      throughput: isNaN(throughput) ? 0 : Math.round(throughput * 100) / 100,
      responses: results,
    },
    analysis: {
      performanceGrade:
        throughput > 10
          ? 'excellent'
          : throughput > 5
            ? 'good'
            : throughput > 2
              ? 'fair'
              : 'poor',
      bottlenecks: avgResponseTime > 2000 ? ['response_time'] : [],
      scalability:
        successRate > 95 ? 'high' : successRate > 80 ? 'medium' : 'low',
    },
  };
}

/**
 * 성능 등급 계산
 */
function calculatePerformanceGrade(metrics: AIPerformanceMetrics): string {
  const responseTime = metrics.avgResponseTime;
  const cacheHitRate = metrics.cacheHitRate / 100; // 백분율을 소수로 변환
  const errorRate = metrics.errorRate / 100; // 백분율을 소수로 변환

  if (responseTime < 500 && cacheHitRate > 0.7 && errorRate < 0.05) return 'A+';
  if (responseTime < 1000 && cacheHitRate > 0.5 && errorRate < 0.1) return 'A';
  if (responseTime < 2000 && cacheHitRate > 0.3 && errorRate < 0.15) return 'B';
  if (responseTime < 3000 && errorRate < 0.25) return 'C';
  return 'D';
}

/**
 * 병목 지점 식별
 */
function identifyBottlenecks(metrics: AIPerformanceMetrics): string[] {
  const bottlenecks = [];

  if (metrics.avgResponseTime > 2000) bottlenecks.push('response_time');
  if (metrics.cacheHitRate < 30) bottlenecks.push('cache_efficiency');
  if (metrics.errorRate > 10) bottlenecks.push('error_rate');
  if (metrics.parallelEfficiency < 50) bottlenecks.push('parallel_processing');

  return bottlenecks;
}

/**
 * 성능 개선 권장사항 생성
 */
function generateRecommendations(metrics: AIPerformanceMetrics, optimization: AIOptimizationStatus): string[] {
  const recommendations = [];

  if (metrics.avgResponseTime > 2000) {
    recommendations.push(
      '응답 시간이 느립니다. 벡터 인덱스 최적화를 고려하세요.'
    );
  }

  if (metrics.cacheHitRate < 30) {
    recommendations.push(
      '캐시 적중률이 낮습니다. 캐시 전략을 aggressive로 변경하세요.'
    );
  }

  if (!optimization.warmupCompleted) {
    recommendations.push(
      '워밍업이 완료되지 않았습니다. 시스템 시작 시 워밍업을 활성화하세요.'
    );
  }

  if (optimization.preloadedEmbeddings < 5) {
    recommendations.push(
      '예열된 임베딩이 부족합니다. 자주 사용되는 쿼리 패턴을 추가하세요.'
    );
  }

  if (metrics.errorRate > 10) {
    recommendations.push('오류율이 높습니다. 회로 차단기 설정을 확인하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '현재 성능이 양호합니다. 지속적인 모니터링을 권장합니다.'
    );
  }

  return recommendations;
}
