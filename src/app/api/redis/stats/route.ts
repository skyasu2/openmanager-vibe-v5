/**
 * 🔍 하이브리드 Redis 성능 모니터링 API
 *
 * OpenManager Vibe v5.30.1 - Redis Stats Endpoint
 * - Mock/Real Redis 사용 패턴 분석
 * - 메모리 사용량 및 응답 시간 측정
 * - 하이브리드 시스템 통계 확인
 * - Zod 스키마와 타입 안전성 적용
 */

import smartRedis from '@/lib/redis';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import { 
  RedisStatsResponseSchema,
  RedisTestRequestSchema,
  type RedisStatsResponse,
  type RedisStats,
  type UsageStats,
  type PerformanceTest,
  type BenchmarkResult,
  type HybridTestResult,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// Next.js App Router 런타임 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Redis 통계 핸들러
const redisStatsHandler = createApiRoute()
  .response(RedisStatsResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<RedisStatsResponse> => {
    const startTime = Date.now();
    const sessionCacheKey = 'redis-health-check-session';

    // 브라우저 환경에서 세션 캐시 확인
    if (typeof window !== 'undefined') {
      try {
        const cachedHealth = sessionStorage.getItem(sessionCacheKey);
        if (cachedHealth) {
          const cached = JSON.parse(cachedHealth);
          const cacheAge = Date.now() - cached.timestamp;

          // 세션 캐시가 30분 이내면 재사용
          if (cacheAge < 30 * 60 * 1000) {
            console.log('📦 Redis 헬스체크 세션 캐시 사용');
            return {
              ...cached.data,
              cached: true,
              cacheAge: Math.round(cacheAge / 1000),
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Redis 세션 캐시 확인 실패:', error);
      }
    }

    // 🔧 하이브리드 Redis 통계 수집
    const hybridStats = await smartRedis.getStats() as RedisStats;

    // 📊 사용량 통계 (사용량 모니터링 제거됨)
    const usageStats: UsageStats = {
      redis: {
        canUse: true,
        commands: 0,
        lastReset: new Date().toISOString(),
      },
      supabase: {
        canUse: true,
        requests: 0,
        transferMB: 0,
        lastReset: new Date().toISOString(),
      },
    };

    // 🏥 시스템 건강도 판단
    const _systemHealth = determineSystemHealth(hybridStats, usageStats);

    // 📈 성능 메트릭 계산
    const performanceMetrics = {
      responseTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    const responseData = {
      success: true,
      _systemHealth,
      hybridStats,
      usageStats,
      performance: performanceMetrics,
      timestamp: new Date().toISOString(),
      version: '5.44.1',
      cached: false,
    };

    // 검증 (개발 환경에서 유용)
    if (process.env.NODE_ENV === 'development') {
      const validation = RedisStatsResponseSchema.safeParse(responseData);
      if (!validation.success) {
        console.error('Redis stats response validation failed:', validation.error);
      }
    }

    return responseData;
  });

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔴 Redis 상태 확인 시작...');

    // 🎯 세션 기반 헬스체크 캐싱 (시스템 시작 시 한 번만)
    const sessionCacheKey = 'redis-health-check-session';

    // 브라우저 환경에서 세션 캐시 확인
    if (typeof window !== 'undefined') {
      try {
        const cachedHealth = sessionStorage.getItem(sessionCacheKey);
        if (cachedHealth) {
          const cached = JSON.parse(cachedHealth);
          const cacheAge = Date.now() - cached.timestamp;

          // 세션 캐시가 30분 이내면 재사용
          if (cacheAge < 30 * 60 * 1000) {
            console.log('📦 Redis 헬스체크 세션 캐시 사용');
            return NextResponse.json({
              ...cached.data,
              cached: true,
              cacheAge: Math.round(cacheAge / 1000),
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Redis 세션 캐시 확인 실패:', error);
      }
    }

    const response = await redisStatsHandler(request);

    // 세션 캐시에 저장 (시스템 시작 시 한 번만 체크)
    if (typeof window !== 'undefined') {
      try {
        const jsonResponse = await response.clone().json();
        sessionStorage.setItem(
          sessionCacheKey,
          JSON.stringify({
            data: jsonResponse,
            timestamp: Date.now(),
          })
        );
        console.log('💾 Redis 헬스체크 세션 캐시에 저장');
      } catch (error) {
        console.warn('⚠️ Redis 세션 캐시 저장 실패:', error);
      }
    }

    console.log('✅ Redis 상태 확인 완료');

    return response;
  } catch (error) {
    console.error('❌ Redis stats failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        _systemHealth: '🔴 위험',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 🧮 Mock Redis 사용 비율 계산
 */
function _calculateMockUsageRatio(stats: RedisStats): string {
  const mockOps = (stats.mockRedis?.sets || 0) + (stats.mockRedis?.hits || 0);
  const totalOps = mockOps;

  if (totalOps === 0) return '0%';
  return `${Math.round((mockOps / totalOps) * 100)}%`;
}

/**
 * 🏥 시스템 건강도 판단
 */
function determineSystemHealth(hybridStats: RedisStats, usageStats: UsageStats): string {
  const mockHealthy = hybridStats.mockRedis?.size !== undefined;
  const realHealthy = hybridStats.realRedis?.status === 'connected';
  const usageHealthy = usageStats.redis.canUse && usageStats.supabase.canUse;

  if (mockHealthy && realHealthy && usageHealthy) {
    return '🟢 최적';
  } else if (mockHealthy && (realHealthy || usageHealthy)) {
    return '🟡 양호';
  } else if (mockHealthy) {
    return '🟠 제한적';
  } else {
    return '🔴 위험';
  }
}

/**
 * 📊 상세 통계 수집
 */
async function _collectDetailedStats() {
  const performanceTests = await runPerformanceTests();

  return {
    performance: performanceTests,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || null,
      useMockRedis: process.env.USE_MOCK_REDIS,
      buildTime: typeof window === 'undefined',
    },
    recommendations: generateRecommendations(performanceTests),
  };
}

/**
 * ⚡ 성능 테스트 실행
 */
async function runPerformanceTests(): Promise<PerformanceTest> {
  const tests: PerformanceTest = {
    mockRedis: { get: 0, set: 0, ping: 0 },
    realRedis: { get: 0, set: 0, ping: 0 },
  };

  try {
    const mockStart = Date.now();
    await smartRedis.ping('performance-test-mock');
    tests.mockRedis.ping = Date.now() - mockStart;

    const mockSetStart = Date.now();
    await smartRedis.set(
      'perf-test',
      'mock-data',
      { ex: 60 },
      'performance-test'
    );
    tests.mockRedis.set = Date.now() - mockSetStart;

    const mockGetStart = Date.now();
    await smartRedis.get('perf-test', 'performance-test');
    tests.mockRedis.get = Date.now() - mockGetStart;

    const realStart = Date.now();
    await smartRedis.ping('keep-alive');
    tests.realRedis.ping = Date.now() - realStart;
  } catch (error) {
    console.warn('⚠️ 성능 테스트 일부 실패:', error);
  }

  return tests;
}

/**
 * 💡 성능 개선 권장사항 생성
 */
function generateRecommendations(performanceTests: PerformanceTest): string[] {
  const recommendations: string[] = [];

  if (performanceTests.mockRedis.ping > 10) {
    recommendations.push(
      'Mock Redis 응답 시간이 느립니다. 메모리 정리를 고려하세요.'
    );
  }

  if (performanceTests.realRedis.ping > 100) {
    recommendations.push(
      'Real Redis 응답 시간이 느립니다. 네트워크 상태를 확인하세요.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '하이브리드 Redis 시스템이 최적 상태로 운영되고 있습니다.'
    );
  }

  return recommendations;
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(RedisTestRequestSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context) => {
    const { action, context: testContext, dataSize } = context.body;

    switch (action) {
      case 'test-hybrid': {
        // 하이브리드 시스템 테스트
        const testResult = await testHybridSystem(testContext, dataSize);
        return {
          success: true,
          result: testResult,
          timestamp: new Date().toISOString(),
        };
      }

      case 'benchmark': {
        // 벤치마크 실행
        const benchmarkResult = await runBenchmark();
        return {
          success: true,
          benchmark: benchmarkResult,
          timestamp: new Date().toISOString(),
        };
      }

      default:
        throw new Error('지원하지 않는 액션입니다.');
    }
  });

/**
 * 📈 실시간 모니터링을 위한 POST 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'POST 요청 처리 실패',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 하이브리드 시스템 테스트
 */
async function testHybridSystem(context?: string, dataSize?: number): Promise<HybridTestResult> {
  const testData = 'x'.repeat(dataSize || 1000);

  const mockTest = await smartRedis.set(
    'hybrid-test-mock',
    testData,
    { ex: 60 },
    'test'
  );
  const realTest = await smartRedis.set(
    'hybrid-test-real',
    testData,
    { ex: 60 },
    'keep-alive'
  );

  return {
    mockRedis: { success: mockTest === 'OK' },
    realRedis: { success: realTest === 'OK' },
    context: context || 'default',
    dataSize: dataSize || 1000,
  };
}

/**
 * 📊 벤치마크 실행
 */
async function runBenchmark(): Promise<BenchmarkResult> {
  const iterations = 10;
  const results: BenchmarkResult['results'] = {
    mock: { total: 0, average: 0, operations: [] as number[] },
    real: { total: 0, average: 0, operations: [] as number[] },
  };

  // Mock Redis 벤치마크
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await smartRedis.set(
      `bench-mock-${i}`,
      `data-${i}`,
      { ex: 60 },
      'benchmark'
    );
    await smartRedis.get(`bench-mock-${i}`, 'benchmark');
    const duration = Date.now() - start;
    results.mock.operations.push(duration);
    results.mock.total += duration;
  }
  results.mock.average = results.mock.total / iterations;

  // Real Redis 벤치마크 (keep-alive 컨텍스트)
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await smartRedis.set(
      `bench-real-${i}`,
      `data-${i}`,
      { ex: 60 },
      'keep-alive'
    );
    await smartRedis.get(`bench-real-${i}`, 'keep-alive');
    const duration = Date.now() - start;
    results.real.operations.push(duration);
    results.real.total += duration;
  }
  results.real.average = results.real.total / iterations;

  return {
    iterations,
    results,
    comparison: {
      mockFaster: results.mock.average < results.real.average,
      speedDifference: `${Math.abs(results.mock.average - results.real.average).toFixed(2)}ms`,
    },
  };
}
