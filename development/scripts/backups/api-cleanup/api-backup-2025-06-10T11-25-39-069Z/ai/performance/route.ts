import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor, perf } from '@/utils/performance-monitor';
import { MasterAIEngine } from '@/services/ai/MasterAIEngine';

/**
 * 📊 AI 성능 측정 API
 *
 * GET: 성능 리포트 조회
 * POST: 성능 벤치마크 실행
 */

export async function GET() {
  try {
    // 현재 시스템 상태
    const currentMemory = PerformanceMonitor.getMemoryUsage();
    const currentCPU = await PerformanceMonitor.getCPUUsage();

    // 성능 리포트 생성
    const report = PerformanceMonitor.generatePerformanceReport();

    // AI 엔진 상태
    const masterEngine = new MasterAIEngine();
    const engineStatuses = masterEngine.getEngineStatuses();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      currentStatus: {
        memory: currentMemory,
        cpu: currentCPU,
        engines: engineStatuses,
      },
      performanceReport: report,
      metadata: {
        version: 'v5.37.4',
        system: 'OpenManager Vibe Performance Monitor',
      },
    });
  } catch (error) {
    console.error('❌ 성능 측정 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '성능 측정 실패',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      engineType = 'correlation',
      testQuery = '서버 상태 분석',
      iterations = 5,
      includeAccuracy = false,
    } = body;

    console.log(`🔍 AI 성능 벤치마크 시작: ${engineType} (${iterations}회)`);

    const results = [];
    const masterEngine = new MasterAIEngine();

    // 여러 번 실행하여 평균 성능 측정
    for (let i = 0; i < iterations; i++) {
      const testFunction = async () => {
        return await masterEngine.query({
          engine: engineType as any,
          query: testQuery,
          data: generateTestData(engineType),
          options: {
            use_cache: false, // 정확한 측정을 위해 캐시 비활성화
            enable_thinking_log: false,
          },
        });
      };

      // 예상 결과 (정확도 측정용)
      const expectedResults = includeAccuracy
        ? generateExpectedResults(engineType)
        : undefined;

      const benchmark = await PerformanceMonitor.runBenchmark(
        engineType,
        testFunction,
        expectedResults
      );

      results.push(benchmark);

      // 잠시 대기 (시스템 안정화)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 평균값 계산
    const avgBenchmark = calculateAverageBenchmark(results);

    // 성능 개선사항 분석
    const improvements = analyzePerformanceImprovements(results);

    return NextResponse.json({
      success: true,
      benchmarkResults: {
        engineType,
        iterations,
        individual: results,
        average: avgBenchmark,
        improvements,
        recommendations: generatePerformanceRecommendations(avgBenchmark),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 성능 벤치마크 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '벤치마크 실행 실패',
      },
      { status: 500 }
    );
  }
}

// 실시간 성능 모니터링 시작
export async function PUT() {
  try {
    const monitoring = PerformanceMonitor.startRealTimeMonitoring(3000); // 3초 간격

    // 30초 후 자동 중지
    setTimeout(() => {
      clearInterval(monitoring);
      console.log('📊 실시간 모니터링 종료');
    }, 30000);

    return NextResponse.json({
      success: true,
      message: '실시간 성능 모니터링 시작 (30초간)',
      monitoringId: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '모니터링 시작 실패',
      },
      { status: 500 }
    );
  }
}

// 측정 데이터 초기화
export async function DELETE() {
  try {
    PerformanceMonitor.clearMeasurements();

    return NextResponse.json({
      success: true,
      message: '성능 측정 데이터 초기화 완료',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '초기화 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 테스트 데이터 생성
 */
function generateTestData(engineType: string) {
  switch (engineType) {
    case 'correlation':
      return {
        servers: Array.from({ length: 10 }, (_, i) => ({
          id: `server-${i}`,
          cpu: 30 + Math.random() * 40,
          memory: 40 + Math.random() * 30,
          disk: 20 + Math.random() * 20,
        })),
      };

    case 'anomaly':
      return Array.from({ length: 50 }, () => 20 + Math.random() * 60);

    case 'prediction':
      return Array.from(
        { length: 24 },
        (_, i) => 50 + Math.sin(i / 4) * 20 + Math.random() * 10
      );

    default:
      return { test: true };
  }
}

/**
 * 📋 예상 결과 생성 (정확도 측정용)
 */
function generateExpectedResults(engineType: string) {
  switch (engineType) {
    case 'correlation':
      return [
        { status: '정상상태', confidence: 0.85 },
        { status: '정상상태', confidence: 0.82 },
        { status: '경고상태', confidence: 0.75 },
      ];

    default:
      return [{ status: '정상상태', confidence: 0.8 }];
  }
}

/**
 * 📊 평균 벤치마크 계산
 */
function calculateAverageBenchmark(results: any[]) {
  if (results.length === 0) return null;

  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime.responseTime, 0) /
      results.length
  );

  const avgMemory = Math.round(
    results.reduce((sum, r) => sum + r.memoryUsage.rss, 0) / results.length
  );

  const avgAccuracy = Math.round(
    results.reduce((sum, r) => sum + r.accuracy.accuracy, 0) / results.length
  );

  return {
    responseTime: `${avgResponseTime}ms`,
    memoryUsage: `${avgMemory}MB`,
    accuracy: `${avgAccuracy}%`,
    sampleSize: results.length,
  };
}

/**
 * 📈 성능 개선사항 분석
 */
function analyzePerformanceImprovements(results: any[]) {
  if (results.length < 2) return { message: '비교할 데이터가 부족합니다.' };

  const first = results[0];
  const last = results[results.length - 1];

  const responseTimeImprovement = Math.round(
    ((first.responseTime.responseTime - last.responseTime.responseTime) /
      first.responseTime.responseTime) *
      100
  );

  const memoryOptimization = last.memoryUsage.optimization;

  return {
    responseTimeChange: `${responseTimeImprovement > 0 ? '+' : ''}${responseTimeImprovement}%`,
    memoryOptimization,
    trend:
      responseTimeImprovement > 0
        ? '개선'
        : responseTimeImprovement < 0
          ? '악화'
          : '안정',
    consistency: calculateConsistency(results),
  };
}

/**
 * 📊 일관성 점수 계산
 */
function calculateConsistency(results: any[]): string {
  const responseTimes = results.map(r => r.responseTime.responseTime);
  const mean =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const variance =
    responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
    responseTimes.length;
  const stdDev = Math.sqrt(variance);
  const coefficient = (stdDev / mean) * 100;

  if (coefficient < 10) return '매우 일관적';
  if (coefficient < 20) return '일관적';
  if (coefficient < 30) return '보통';
  return '불안정';
}

/**
 * 💡 성능 최적화 권장사항
 */
function generatePerformanceRecommendations(benchmark: any) {
  const recommendations = [];

  if (benchmark && typeof benchmark === 'object') {
    const responseTime = parseInt(benchmark.responseTime);
    const memoryUsage = parseInt(benchmark.memoryUsage);

    if (responseTime > 500) {
      recommendations.push(
        '⚡ 응답 시간 최적화: 캐싱 활용 또는 알고리즘 개선 필요'
      );
    }

    if (memoryUsage > 200) {
      recommendations.push(
        '💾 메모리 사용량 최적화: 메모리 누수 확인 또는 가비지 컬렉션 최적화'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ 현재 성능이 양호합니다. 지속적인 모니터링을 권장합니다.'
      );
    }
  }

  return recommendations;
}
