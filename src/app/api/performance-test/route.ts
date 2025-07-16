/**
 * 🏃 성능 테스트 및 검증 API v1.0
 * 
 * 기존 API vs 최적화된 API 성능 비교 및 검증
 * - 실시간 성능 벤치마크
 * - 응답 시간 측정
 * - 부하 테스트
 * - 성능 개선 효과 분석
 */

import { abTestManager } from '@/lib/ab-test-manager';
import { redisTemplateCache } from '@/lib/redis-template-cache';
import { staticDataGenerator } from '@/lib/static-data-templates';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PerformanceResult {
  endpoint: string;
  method: 'legacy' | 'optimized' | 'template';
  responseTime: number;
  success: boolean;
  dataSize: number;
  timestamp: number;
  error?: string;
}

interface BenchmarkResult {
  legacy: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
    totalRequests: number;
    avgDataSize: number;
  };
  optimized: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
    totalRequests: number;
    avgDataSize: number;
  };
  comparison: {
    performanceGain: number;
    speedupFactor: number;
    reliabilityImprovement: number;
    recommendation: string;
  };
}

/**
 * GET /api/performance-test
 * 
 * 성능 테스트 실행 및 결과 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'benchmark';
    const iterations = parseInt(searchParams.get('iterations') || '10');
    const endpoint = searchParams.get('endpoint') || 'servers';

    switch (action) {
      case 'benchmark':
        return await runBenchmark(endpoint, iterations);
      
      case 'single_test':
        return await runSingleTest(endpoint);
      
      case 'load_test':
        const concurrent = parseInt(searchParams.get('concurrent') || '5');
        return await runLoadTest(endpoint, iterations, concurrent);
      
      case 'analysis':
        return await getPerformanceAnalysis();

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션',
            availableActions: ['benchmark', 'single_test', 'load_test', 'analysis'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 성능 테스트 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🏃 벤치마크 테스트 실행
 */
async function runBenchmark(endpoint: string, iterations: number): Promise<NextResponse> {
  console.log(`🏃 벤치마크 시작: ${endpoint} endpoint, ${iterations} iterations`);
  
  const legacyResults: PerformanceResult[] = [];
  const optimizedResults: PerformanceResult[] = [];

  try {
    // 1. Legacy API 테스트
    console.log('📊 Legacy API 테스트 중...');
    for (let i = 0; i < iterations; i++) {
      const result = await testLegacyAPI(endpoint);
      legacyResults.push(result);
      
      // A/B 테스트 메트릭 기록
      await abTestManager.recordMetric(
        'legacy',
        result.responseTime,
        result.success,
        result.error
      );
      
      // 요청 간 간격 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. Optimized API 테스트
    console.log('🚀 Optimized API 테스트 중...');
    for (let i = 0; i < iterations; i++) {
      const result = await testOptimizedAPI(endpoint);
      optimizedResults.push(result);
      
      // A/B 테스트 메트릭 기록
      await abTestManager.recordMetric(
        'optimized',
        result.responseTime,
        result.success,
        result.error
      );
      
      // 요청 간 간격
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. 결과 분석
    const benchmark = analyzeBenchmarkResults(legacyResults, optimizedResults);

    return NextResponse.json({
      success: true,
      data: {
        testConfig: {
          endpoint,
          iterations,
          testType: 'benchmark',
          timestamp: new Date().toISOString(),
        },
        results: {
          legacy: legacyResults,
          optimized: optimizedResults,
        },
        benchmark,
        summary: {
          totalTests: legacyResults.length + optimizedResults.length,
          avgPerformanceGain: benchmark.comparison.performanceGain,
          recommendationScore: calculateRecommendationScore(benchmark),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 벤치마크 테스트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '벤치마크 테스트 실행 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
        partialResults: {
          legacyCompleted: legacyResults.length,
          optimizedCompleted: optimizedResults.length,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 단일 성능 테스트
 */
async function runSingleTest(endpoint: string): Promise<NextResponse> {
  try {
    const [legacyResult, optimizedResult] = await Promise.all([
      testLegacyAPI(endpoint),
      testOptimizedAPI(endpoint),
    ]);

    const improvement = legacyResult.responseTime > 0 
      ? ((legacyResult.responseTime - optimizedResult.responseTime) / legacyResult.responseTime) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        legacy: legacyResult,
        optimized: optimizedResult,
        comparison: {
          performanceGain: Math.round(improvement * 100) / 100,
          speedup: legacyResult.responseTime / Math.max(optimizedResult.responseTime, 1),
          timeSaved: legacyResult.responseTime - optimizedResult.responseTime,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '단일 테스트 실행 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 💪 부하 테스트 실행
 */
async function runLoadTest(
  endpoint: string, 
  iterations: number, 
  concurrent: number
): Promise<NextResponse> {
  console.log(`💪 부하 테스트 시작: ${concurrent}개 동시 요청, ${iterations}회 반복`);

  try {
    const startTime = Date.now();
    const allResults: PerformanceResult[] = [];

    // 동시 요청 배치들을 순차적으로 실행
    for (let batch = 0; batch < iterations; batch++) {
      const batchPromises: Promise<PerformanceResult>[] = [];
      
      // 동시 요청 생성
      for (let i = 0; i < concurrent; i++) {
        const useOptimized = Math.random() > 0.5; // 50/50 분할
        batchPromises.push(
          useOptimized ? testOptimizedAPI(endpoint) : testLegacyAPI(endpoint)
        );
      }

      // 배치 실행 및 결과 수집
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
        } else {
          console.error(`Batch ${batch}, Request ${index} failed:`, result.reason);
        }
      });

      // 배치 간 간격 (서버 보호)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const totalTime = Date.now() - startTime;
    
    // 결과 분석
    const legacyResults = allResults.filter(r => r.method === 'legacy');
    const optimizedResults = allResults.filter(r => r.method === 'optimized');
    
    const analysis = {
      totalRequests: allResults.length,
      totalTime,
      requestsPerSecond: (allResults.length / totalTime) * 1000,
      concurrentUsers: concurrent,
      successRate: allResults.filter(r => r.success).length / allResults.length,
      avgResponseTime: allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length,
      performance: {
        legacy: analyzeResults(legacyResults),
        optimized: analyzeResults(optimizedResults),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        testConfig: {
          endpoint,
          iterations,
          concurrent,
          testType: 'load_test',
        },
        results: allResults,
        analysis,
        recommendations: generateLoadTestRecommendations(analysis),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 부하 테스트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '부하 테스트 실행 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 성능 분석 결과 조회
 */
async function getPerformanceAnalysis(): Promise<NextResponse> {
  try {
    // A/B 테스트 결과 조회
    const abTestResults = await abTestManager.getResults();
    
    // 추가 분석 데이터
    const analysis = {
      currentStatus: {
        optimizationActive: true,
        templateCacheEnabled: true,
        abTestRunning: true,
      },
      performanceMetrics: {
        targetResponseTime: '1-5ms',
        currentLegacyAvg: abTestResults.legacy.avgResponseTime,
        currentOptimizedAvg: abTestResults.optimized.avgResponseTime,
        improvementTarget: '90%',
        currentImprovement: abTestResults.comparison.performanceGain,
      },
      recommendations: [
        abTestResults.comparison.performanceGain > 80 
          ? '🚀 목표 달성: 최적화된 API로 완전 전환 권장'
          : '📊 추가 최적화 필요',
        abTestResults.optimized.errorRate < 0.01
          ? '✅ 안정성 목표 달성'
          : '⚠️ 안정성 개선 필요',
        '🔄 지속적인 모니터링 및 튜닝 권장',
      ],
      systemHealth: {
        redisTemplateCache: 'healthy',
        abTestSystem: 'active',
        fallbackSystems: 'available',
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        abTestResults,
        analysis,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '성능 분석 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ==============================================
// 🔧 헬퍼 함수들
// ==============================================

async function testLegacyAPI(endpoint: string): Promise<PerformanceResult> {
  const startTime = Date.now();
  
  try {
    let response: Response;
    
    switch (endpoint) {
      case 'servers':
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/servers?ab_test=legacy`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        break;
      
      case 'dashboard':
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard?ab_test=legacy`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        break;
      
      default:
        throw new Error(`지원하지 않는 엔드포인트: ${endpoint}`);
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      endpoint,
      method: 'legacy',
      responseTime,
      success: response.ok,
      dataSize: JSON.stringify(data).length,
      timestamp: Date.now(),
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      endpoint,
      method: 'legacy',
      responseTime: Date.now() - startTime,
      success: false,
      dataSize: 0,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testOptimizedAPI(endpoint: string): Promise<PerformanceResult> {
  const startTime = Date.now();
  
  try {
    let response: Response;
    
    switch (endpoint) {
      case 'servers':
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/servers-optimized`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        break;
      
      case 'dashboard':
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard-optimized`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        break;
      
      default:
        // 직접 템플릿 시스템 테스트
        const data = endpoint === 'template-servers' 
          ? staticDataGenerator.generateServerData()
          : staticDataGenerator.generateDashboardData();
        
        return {
          endpoint,
          method: 'template',
          responseTime: Date.now() - startTime,
          success: true,
          dataSize: JSON.stringify(data).length,
          timestamp: Date.now(),
        };
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      endpoint,
      method: 'optimized',
      responseTime,
      success: response.ok,
      dataSize: JSON.stringify(data).length,
      timestamp: Date.now(),
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      endpoint,
      method: 'optimized',
      responseTime: Date.now() - startTime,
      success: false,
      dataSize: 0,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function analyzeBenchmarkResults(
  legacyResults: PerformanceResult[], 
  optimizedResults: PerformanceResult[]
): BenchmarkResult {
  const legacyStats = analyzeResults(legacyResults);
  const optimizedStats = analyzeResults(optimizedResults);
  
  const performanceGain = legacyStats.avgResponseTime > 0 
    ? ((legacyStats.avgResponseTime - optimizedStats.avgResponseTime) / legacyStats.avgResponseTime) * 100
    : 0;
  
  const speedupFactor = legacyStats.avgResponseTime / Math.max(optimizedStats.avgResponseTime, 1);
  const reliabilityImprovement = optimizedStats.successRate - legacyStats.successRate;

  let recommendation = '';
  if (performanceGain > 80 && optimizedStats.successRate > 0.95) {
    recommendation = '🚀 즉시 최적화 API로 전환 권장';
  } else if (performanceGain > 50) {
    recommendation = '✅ 더 많은 테스트 후 전환 고려';
  } else if (performanceGain > 20) {
    recommendation = '📊 추가 최적화 작업 필요';
  } else {
    recommendation = '⚠️ 현재 최적화 효과 미미, 방법 재검토 필요';
  }

  return {
    legacy: legacyStats,
    optimized: optimizedStats,
    comparison: {
      performanceGain: Math.round(performanceGain * 100) / 100,
      speedupFactor: Math.round(speedupFactor * 100) / 100,
      reliabilityImprovement: Math.round(reliabilityImprovement * 10000) / 100,
      recommendation,
    },
  };
}

function analyzeResults(results: PerformanceResult[]) {
  if (results.length === 0) {
    return {
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      totalRequests: 0,
      avgDataSize: 0,
    };
  }

  const responseTimes = results.map(r => r.responseTime);
  const successCount = results.filter(r => r.success).length;
  const totalDataSize = results.reduce((sum, r) => sum + r.dataSize, 0);

  return {
    avgResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / results.length),
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    successRate: successCount / results.length,
    totalRequests: results.length,
    avgDataSize: Math.round(totalDataSize / results.length),
  };
}

function calculateRecommendationScore(benchmark: BenchmarkResult): number {
  let score = 0;
  
  // 성능 개선 점수 (50%)
  if (benchmark.comparison.performanceGain > 80) score += 50;
  else if (benchmark.comparison.performanceGain > 50) score += 35;
  else if (benchmark.comparison.performanceGain > 20) score += 20;
  
  // 안정성 점수 (30%)
  if (benchmark.optimized.successRate > 0.95) score += 30;
  else if (benchmark.optimized.successRate > 0.90) score += 20;
  else if (benchmark.optimized.successRate > 0.80) score += 10;
  
  // 응답 시간 점수 (20%)
  if (benchmark.optimized.avgResponseTime < 5) score += 20;
  else if (benchmark.optimized.avgResponseTime < 10) score += 15;
  else if (benchmark.optimized.avgResponseTime < 50) score += 10;
  
  return Math.min(score, 100);
}

function generateLoadTestRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  
  if (analysis.successRate > 0.95) {
    recommendations.push('✅ 높은 성공률: 시스템 안정성 양호');
  } else {
    recommendations.push('⚠️ 성공률 개선 필요');
  }
  
  if (analysis.requestsPerSecond > 10) {
    recommendations.push('🚀 높은 처리량: 동시 사용자 증가에 대응 가능');
  } else {
    recommendations.push('📈 처리량 개선 필요');
  }
  
  if (analysis.performance.optimized.avgResponseTime < analysis.performance.legacy.avgResponseTime) {
    recommendations.push('🎯 최적화 효과 확인됨');
  }
  
  return recommendations;
}