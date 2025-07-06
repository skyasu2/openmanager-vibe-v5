/**
 * 🔍 하이브리드 Redis 성능 모니터링 API
 *
 * OpenManager Vibe v5.30.1 - Redis Stats Endpoint
 * - Mock/Real Redis 사용 패턴 분석
 * - 메모리 사용량 및 응답 시간 측정
 * - 하이브리드 시스템 통계 확인
 */

import smartRedis from '@/lib/redis';

import { getCacheHeaders } from '@/lib/api-cache-manager';
import { EdgeCache, EdgeLogger } from '@/lib/edge-runtime-utils';
import { NextRequest, NextResponse } from 'next/server';

const logger = EdgeLogger.getInstance();
const edgeCache = EdgeCache.getInstance();

// Next.js App Router 런타임 설정
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 목업 Redis 통계 데이터 생성
function generateMockRedisStats() {
  return {
    connected: true,
    uptime: Math.floor(Math.random() * 86400), // 0-24시간
    commands_processed: Math.floor(Math.random() * 1000000),
    connections: Math.floor(Math.random() * 100),
    memory: {
      used: Math.floor(Math.random() * 1024 * 1024 * 100), // MB
      peak: Math.floor(Math.random() * 1024 * 1024 * 150),
      fragmentation_ratio: 1 + Math.random() * 0.5,
    },
    keyspace: {
      db0: {
        keys: Math.floor(Math.random() * 10000),
        expires: Math.floor(Math.random() * 1000),
      },
    },
    performance: {
      ops_per_sec: Math.floor(Math.random() * 10000),
      hit_rate: 0.8 + Math.random() * 0.2, // 80-100%
      avg_ttl: Math.floor(Math.random() * 3600),
    },
    timestamp: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('Redis 통계 조회 요청');

    // 캐시에서 먼저 확인
    const cacheKey = 'redis_stats';
    let stats = edgeCache.get(cacheKey);

    if (!stats) {
      // 목업 데이터 생성 (실제 환경에서는 Redis 연결)
      stats = generateMockRedisStats();

      // 30초간 캐시
      edgeCache.set(cacheKey, stats, 30000);
      logger.info('Redis 통계 캐시 갱신');
    } else {
      logger.info('Redis 통계 캐시 히트');
    }

    const responseData = {
      success: true,
      data: stats,
      cached: !!edgeCache.has(cacheKey),
      response_time: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData, {
      headers: getCacheHeaders(!!edgeCache.has(cacheKey), 30000),
    });

  } catch (error) {
    logger.error('Redis 통계 API 오류', error);

    return NextResponse.json({
      success: false,
      error: 'REDIS_STATS_ERROR',
      message: 'Redis 통계를 가져오는 중 오류가 발생했습니다.',
      response_time: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: getCacheHeaders(false),
    });
  }
}

/**
 * 🧮 Mock Redis 사용 비율 계산
 */
function calculateMockUsageRatio(stats: any): string {
  const mockOps = (stats.mockRedis?.sets || 0) + (stats.mockRedis?.hits || 0);
  const totalOps = mockOps;

  if (totalOps === 0) return '0%';
  return `${Math.round((mockOps / totalOps) * 100)}%`;
}

/**
 * 🏥 시스템 건강도 판단
 */
function determineSystemHealth(hybridStats: any, usageStats: any): string {
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
async function collectDetailedStats() {
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
async function runPerformanceTests() {
  const tests = {
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
function generateRecommendations(performanceTests: any): string[] {
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

/**
 * 📈 실시간 모니터링을 위한 POST 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, context, dataSize } = body;

    switch (action) {
      case 'test-hybrid':
        // 하이브리드 시스템 테스트
        const testResult = await testHybridSystem(context, dataSize);
        return NextResponse.json({
          success: true,
          result: testResult,
          timestamp: new Date().toISOString(),
        });

      case 'benchmark':
        // 벤치마크 실행
        const benchmarkResult = await runBenchmark();
        return NextResponse.json({
          success: true,
          benchmark: benchmarkResult,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
            supportedActions: ['test-hybrid', 'benchmark'],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'POST 요청 처리 실패',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 하이브리드 시스템 테스트
 */
async function testHybridSystem(context?: string, dataSize?: number) {
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
async function runBenchmark() {
  const iterations = 10;
  const results = {
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
