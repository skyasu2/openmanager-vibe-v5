/**
 * 🏆 AI 성능 벤치마킹 도구
 *
 * 목표: 450ms → 152ms (66% 단축) 성능 검증
 *
 * 벤치마크 항목:
 * 1. 응답 시간 측정 (평균, P95, P99)
 * 2. 캐시 적중률 분석
 * 3. 병렬 처리 효율성 측정
 * 4. 메모리 사용량 모니터링
 * 5. 네트워크 레이턴시 분석
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { getSimplifiedQueryEngine } from './SimplifiedQueryEngine';
import { getPerformanceOptimizedQueryEngine } from './performance-optimized-query-engine';
import { getUltraPerformanceAIEngine } from './ultra-performance-ai-engine';
import { getAIPerformanceOptimizer } from './performance-optimization-engine';
import type { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';

interface BenchmarkConfig {
  engines: (
    | 'simplified'
    | 'performance-optimized'
    | 'ultra-performance'
    | 'optimizer'
  )[];
  testQueries: string[];
  iterations: number;
  concurrentUsers: number;
  timeout: number;
}

interface EngineResult {
  engineName: string;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  cacheHitRate: number;
  targetAchieved: number; // 152ms 이하 달성 횟수
  targetAchievedRate: number; // 152ms 이하 달성률
  memoryUsage: number; // MB
  errorRate: number;
  throughput: number; // requests/second
}

interface DetailedResult {
  query: string;
  engineName: string;
  responseTime: number;
  success: boolean;
  cached: boolean;
  confidence: number;
  error?: string;
  timestamp: number;
  optimizations?: string[];
}

interface BenchmarkReport {
  type: 'benchmark';
  summary: {
    totalQueries: number;
    totalEngines: number;
    benchmarkDuration: number;
    bestEngine: string;
    worstEngine: string;
    overallImprovementRate: number;
  };
  engineResults: EngineResult[];
  detailedResults: DetailedResult[];
  comparison: {
    baselineEngine: string;
    improvements: Array<{
      engineName: string;
      improvementPercentage: number;
      targetAchievementImprovement: number;
    }>;
  };
  recommendations: string[];
}

export class AIPerformanceBenchmark {
  private static instance: AIPerformanceBenchmark;

  private engines = {
    simplified: getSimplifiedQueryEngine(),
    'performance-optimized': getPerformanceOptimizedQueryEngine(),
    'ultra-performance': getUltraPerformanceAIEngine(),
    optimizer: getAIPerformanceOptimizer(),
  };

  private defaultTestQueries = [
    '서버 상태 확인',
    'CPU 사용률 분석해줘',
    '메모리 사용량은 어때?',
    '디스크 용량 체크',
    '네트워크 트래픽 모니터링',
    '전체 시스템 건강상태',
    '성능 지표 요약',
    '로그 분석 결과',
    '알림 설정 확인',
    '보안 상태 검사',
    '서버 CPU 온도는?',
    '데이터베이스 성능',
    '백업 상태 확인',
    '사용자 접속 현황',
    '에러 로그 분석',
  ];

  private constructor() {}

  public static getInstance(): AIPerformanceBenchmark {
    if (!AIPerformanceBenchmark.instance) {
      AIPerformanceBenchmark.instance = new AIPerformanceBenchmark();
    }
    return AIPerformanceBenchmark.instance;
  }

  /**
   * 🚀 전체 벤치마크 실행
   */
  async runFullBenchmark(
    config?: Partial<BenchmarkConfig>
  ): Promise<BenchmarkReport> {
    const finalConfig: BenchmarkConfig = {
      engines: ['simplified', 'performance-optimized', 'ultra-performance'],
      testQueries: this.defaultTestQueries.slice(0, 10), // 처음 10개
      iterations: 3,
      concurrentUsers: 1,
      timeout: 5000,
      ...config,
    };

    console.log('🏆 AI 성능 벤치마크 시작', {
      engines: finalConfig.engines,
      queries: finalConfig.testQueries.length,
      iterations: finalConfig.iterations,
    });

    const startTime = Date.now();
    const detailedResults: DetailedResult[] = [];
    const engineResults: EngineResult[] = [];

    // 각 엔진별 벤치마크 실행
    for (const engineName of finalConfig.engines) {
      console.log(`\n⚡ ${engineName} 엔진 벤치마크 시작...`);

      const engineResult = await this.benchmarkEngine(
        engineName,
        finalConfig,
        detailedResults
      );

      engineResults.push(engineResult);

      console.log(`✅ ${engineName} 완료:`, {
        averageTime: `${engineResult.averageResponseTime.toFixed(1)}ms`,
        targetAchieved: `${engineResult.targetAchievedRate.toFixed(1)}%`,
        successRate: `${((1 - engineResult.errorRate) * 100).toFixed(1)}%`,
      });

      // 엔진 간 간격 (메모리 정리)
      await this.sleep(1000);
    }

    const benchmarkDuration = Date.now() - startTime;

    // 결과 분석
    const report = this.generateReport(
      engineResults,
      detailedResults,
      benchmarkDuration,
      finalConfig
    );

    console.log('\n📊 벤치마크 완료!', {
      duration: `${(benchmarkDuration / 1000).toFixed(1)}초`,
      bestEngine: report.summary.bestEngine,
      improvement: `${report.summary.overallImprovementRate.toFixed(1)}%`,
    });

    return report;
  }

  /**
   * 🎯 개별 엔진 벤치마크
   */
  private async benchmarkEngine(
    engineName: string,
    config: BenchmarkConfig,
    detailedResults: DetailedResult[]
  ): Promise<EngineResult> {
    const results: Array<{
      responseTime: number;
      success: boolean;
      cached: boolean;
      confidence: number;
      error?: string;
      optimizations?: string[];
    }> = [];

    let memoryUsage = 0;
    const targetThreshold = 152; // ms

    // 테스트 실행
    for (let iteration = 0; iteration < config.iterations; iteration++) {
      for (const query of config.testQueries) {
        const result = await this.executeQueryBenchmark(
          engineName,
          query,
          config.timeout
        );

        results.push(result);

        detailedResults.push({
          query,
          engineName,
          responseTime: result.responseTime,
          success: result.success,
          cached: result.cached,
          confidence: result.confidence,
          error: result.error,
          timestamp: Date.now(),
          optimizations: result.optimizations,
        });

        // 메모리 사용량 추정
        if (typeof process !== 'undefined' && process.memoryUsage) {
          memoryUsage = Math.max(
            memoryUsage,
            process.memoryUsage().heapUsed / 1024 / 1024
          );
        }

        // 과부하 방지
        await this.sleep(50);
      }
    }

    // 통계 계산
    const responseTimes = results
      .filter((r) => r.success)
      .map((r) => r.responseTime);

    const successfulTests = results.filter((r) => r.success).length;
    const cachedTests = results.filter((r) => r.cached).length;
    const targetAchieved = results.filter(
      (r) => r.success && r.responseTime <= targetThreshold
    ).length;

    const sortedTimes = responseTimes.sort((a, b) => a - b);

    return {
      engineName,
      totalTests: results.length,
      successfulTests,
      failedTests: results.length - successfulTests,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0,
      medianResponseTime:
        sortedTimes.length > 0
          ? sortedTimes[Math.floor(sortedTimes.length / 2)] ?? 0
          : 0,
      p95ResponseTime:
        sortedTimes.length > 0
          ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] ?? 0
          : 0,
      p99ResponseTime:
        sortedTimes.length > 0
          ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] ?? 0
          : 0,
      minResponseTime: sortedTimes.length > 0 ? sortedTimes[0] ?? 0 : 0,
      maxResponseTime:
        sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] ?? 0 : 0,
      cacheHitRate: results.length > 0 ? cachedTests / results.length : 0,
      targetAchieved,
      targetAchievedRate:
        successfulTests > 0 ? targetAchieved / successfulTests : 0,
      memoryUsage,
      errorRate:
        results.length > 0
          ? (results.length - successfulTests) / results.length
          : 0,
      throughput:
        responseTimes.length > 0
          ? 1000 /
            (responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length)
          : 0,
    };
  }

  /**
   * ⚡ 개별 쿼리 실행
   */
  private async executeQueryBenchmark(
    engineName: string,
    query: string,
    timeout: number
  ): Promise<{
    responseTime: number;
    success: boolean;
    cached: boolean;
    confidence: number;
    error?: string;
    optimizations?: string[];
  }> {
    const startTime = performance.now();

    try {
      const request: QueryRequest = {
        query,
        mode: 'local',
        options: {
          timeoutMs: timeout,
          cached: true,
        },
      };

      let response: QueryResponse;

      switch (engineName) {
        case 'simplified':
          response = await this.engines['simplified'].query(request);
          break;

        case 'performance-optimized':
          response = await this.engines['performance-optimized'].query(request);
          break;

        case 'ultra-performance':
          response = await this.engines['ultra-performance'].query(request);
          break;

        case 'optimizer':
          response = await this.engines['optimizer'].optimizedQuery(request);
          break;

        default:
          throw new Error(`Unknown engine: ${engineName}`);
      }

      const responseTime = performance.now() - startTime;

      // 타입 안전성을 위한 추가 타입 체크
      const responseWithOptimizations = response as QueryResponse & {
        optimizationInfo?: { optimizationsApplied?: string[] };
        optimizationSteps?: string[];
      };

      return {
        responseTime,
        success: response.success !== false,
        cached:
          response.metadata?.cached === true ||
          response.metadata?.cacheHit === true,
        confidence: response.confidence || 0,
        optimizations:
          responseWithOptimizations.optimizationInfo?.optimizationsApplied ||
          responseWithOptimizations.optimizationSteps?.map((s: string) => s) ||
          [],
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      return {
        responseTime,
        success: false,
        cached: false,
        confidence: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 📊 벤치마크 결과 분석
   */
  private generateReport(
    engineResults: EngineResult[],
    detailedResults: DetailedResult[],
    benchmarkDuration: number,
    config: BenchmarkConfig
  ): BenchmarkReport {
    const baselineEngine = engineResults.find(
      (e) => e.engineName === 'simplified'
    );
    const bestEngine = engineResults.reduce((best, current) =>
      current.averageResponseTime < best.averageResponseTime ? current : best
    );
    const worstEngine = engineResults.reduce((worst, current) =>
      current.averageResponseTime > worst.averageResponseTime ? current : worst
    );

    // 전체 개선율 계산 (simplified 엔진 대비)
    const overallImprovement = baselineEngine
      ? ((baselineEngine.averageResponseTime - bestEngine.averageResponseTime) /
          baselineEngine.averageResponseTime) *
        100
      : 0;

    // 엔진별 개선율
    const improvements = engineResults.map((engine) => ({
      engineName: engine.engineName,
      improvementPercentage: baselineEngine
        ? ((baselineEngine.averageResponseTime - engine.averageResponseTime) /
            baselineEngine.averageResponseTime) *
          100
        : 0,
      targetAchievementImprovement: baselineEngine
        ? engine.targetAchievedRate - baselineEngine.targetAchievedRate
        : engine.targetAchievedRate,
    }));

    // 추천사항 생성
    const recommendations = this.generateRecommendations(engineResults);

    return {
      type: 'benchmark' as const,
      summary: {
        totalQueries: detailedResults.length,
        totalEngines: engineResults.length,
        benchmarkDuration,
        bestEngine: bestEngine.engineName,
        worstEngine: worstEngine.engineName,
        overallImprovementRate: overallImprovement,
      },
      engineResults,
      detailedResults,
      comparison: {
        baselineEngine: 'simplified',
        improvements,
      },
      recommendations,
    };
  }

  /**
   * 💡 개선 추천사항 생성
   */
  private generateRecommendations(engineResults: EngineResult[]): string[] {
    const recommendations: string[] = [];

    const ultraEngine = engineResults.find(
      (e) => e.engineName === 'ultra-performance'
    );
    const baselineEngine = engineResults.find(
      (e) => e.engineName === 'simplified'
    );

    // 목표 달성률 분석
    if (ultraEngine && ultraEngine.targetAchievedRate < 0.8) {
      recommendations.push(
        'Ultra Performance 엔진의 152ms 목표 달성률이 낮습니다. 캐싱 전략 강화가 필요합니다.'
      );
    }

    if (ultraEngine && ultraEngine.targetAchievedRate >= 0.9) {
      recommendations.push(
        'Ultra Performance 엔진이 152ms 목표를 안정적으로 달성하고 있습니다. 운영 환경에 적용을 고려하세요.'
      );
    }

    // 캐시 적중률 분석
    const avgCacheHitRate =
      engineResults.reduce((sum, e) => sum + e.cacheHitRate, 0) /
      engineResults.length;
    if (avgCacheHitRate < 0.5) {
      recommendations.push(
        '전체적인 캐시 적중률이 낮습니다. 예측적 캐싱 알고리즘 개선이 필요합니다.'
      );
    }

    // 에러율 분석
    const highErrorEngine = engineResults.find((e) => e.errorRate > 0.1);
    if (highErrorEngine) {
      recommendations.push(
        `${highErrorEngine.engineName} 엔진의 에러율이 높습니다. 안정성 개선이 필요합니다.`
      );
    }

    // 성능 비교
    if (baselineEngine && ultraEngine) {
      const improvement =
        ((baselineEngine.averageResponseTime -
          ultraEngine.averageResponseTime) /
          baselineEngine.averageResponseTime) *
        100;
      if (improvement > 50) {
        recommendations.push(
          `Ultra Performance 엔진이 기본 엔진 대비 ${improvement.toFixed(1)}% 성능 향상을 달성했습니다.`
        );
      } else if (improvement < 20) {
        recommendations.push(
          '성능 개선이 기대치에 미치지 못합니다. 최적화 전략을 재검토하세요.'
        );
      }
    }

    // 메모리 사용량 분석
    const highMemoryEngine = engineResults.find((e) => e.memoryUsage > 100); // 100MB 초과
    if (highMemoryEngine) {
      recommendations.push(
        `${highMemoryEngine.engineName} 엔진의 메모리 사용량이 높습니다. 캐시 크기 최적화를 고려하세요.`
      );
    }

    return recommendations;
  }

  /**
   * 📈 실시간 성능 모니터링
   */
  async startRealTimeMonitoring(durationMs: number = 60000): Promise<{
    type: string;
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    cacheHitRate: number;
    memoryTrend: number[];
  }> {
    console.log('📈 실시간 성능 모니터링 시작...', {
      duration: `${durationMs / 1000}초`,
    });

    const startTime = Date.now();
    const results: Array<{
      timestamp: number;
      responseTime: number;
      success: boolean;
      cached: boolean;
      memoryUsage: number;
    }> = [];

    const testQuery = '서버 상태 확인';
    const engine = getUltraPerformanceAIEngine();

    while (Date.now() - startTime < durationMs) {
      const queryStart = performance.now();

      try {
        const result = await engine.query({
          query: testQuery,
          mode: 'local',
          options: { timeoutMs: 152, cached: true },
        });

        const responseTime = performance.now() - queryStart;
        const memoryUsage =
          typeof process !== 'undefined' && process.memoryUsage
            ? process.memoryUsage().heapUsed / 1024 / 1024
            : 0;

        results.push({
          timestamp: Date.now(),
          responseTime,
          success: result.success !== false,
          cached: result.optimizationInfo?.cacheType !== undefined,
          memoryUsage,
        });
      } catch (error) {
        results.push({
          timestamp: Date.now(),
          responseTime: performance.now() - queryStart,
          success: false,
          cached: false,
          memoryUsage: 0,
        });
      }

      await this.sleep(1000); // 1초 간격
    }

    // 통계 계산
    const successfulResults = results.filter((r) => r.success);
    const averageResponseTime =
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.responseTime, 0) /
          successfulResults.length
        : 0;

    const requestsPerSecond = results.length / (durationMs / 1000);
    const errorRate =
      results.length > 0
        ? (results.length - successfulResults.length) / results.length
        : 0;
    const cacheHitRate =
      results.length > 0
        ? results.filter((r) => r.cached).length / results.length
        : 0;
    const memoryTrend = results.map((r) => r.memoryUsage);

    console.log('📊 실시간 모니터링 완료:', {
      averageResponseTime: `${averageResponseTime.toFixed(1)}ms`,
      requestsPerSecond: requestsPerSecond.toFixed(1),
      errorRate: `${(errorRate * 100).toFixed(1)}%`,
      cacheHitRate: `${(cacheHitRate * 100).toFixed(1)}%`,
    });

    return {
      type: 'real-time-monitoring',
      averageResponseTime,
      requestsPerSecond,
      errorRate,
      cacheHitRate,
      memoryTrend,
    };
  }

  /**
   * 🎯 목표 달성 테스트
   */
  async validateTargetAchievement(
    targetMs: number = 152,
    testCount: number = 50
  ): Promise<{
    achievementRate: number;
    averageTime: number;
    successfulTests: number;
    failedTests: number;
    details: Array<{
      test: number;
      responseTime: number;
      targetAchieved: boolean;
      optimizations: string[];
    }>;
  }> {
    console.log(`🎯 ${targetMs}ms 목표 달성 테스트 시작... (${testCount}회)`);

    const engine = getUltraPerformanceAIEngine();
    const testQueries = this.defaultTestQueries.slice(0, 5);
    const details: Array<{
      test: number;
      responseTime: number;
      targetAchieved: boolean;
      optimizations: string[];
    }> = [];

    let successfulTests = 0;
    let targetAchievedCount = 0;
    const responseTimes: number[] = [];

    for (let i = 0; i < testCount; i++) {
      const queryIndex = i % testQueries.length;
      const query = testQueries[queryIndex] ?? 'default test query';
      const startTime = performance.now();

      try {
        const result = await engine.query({
          query,
          mode: 'local',
          options: { timeoutMs: targetMs + 50, cached: true },
        });

        const responseTime = performance.now() - startTime;
        const targetAchieved = responseTime <= targetMs && result.success;

        if (result.success) successfulTests++;
        if (targetAchieved) targetAchievedCount++;

        responseTimes.push(responseTime);
        details.push({
          test: i + 1,
          responseTime,
          targetAchieved,
          optimizations: result.optimizationInfo?.optimizationsApplied || [],
        });
      } catch (error) {
        details.push({
          test: i + 1,
          responseTime: performance.now() - startTime,
          targetAchieved: false,
          optimizations: ['error_occurred'],
        });
      }

      // 테스트 간격
      await this.sleep(100);
    }

    const achievementRate = testCount > 0 ? targetAchievedCount / testCount : 0;
    const averageTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    console.log('🏆 목표 달성 테스트 완료:', {
      achievementRate: `${(achievementRate * 100).toFixed(1)}%`,
      averageTime: `${averageTime.toFixed(1)}ms`,
      successRate: `${((successfulTests / testCount) * 100).toFixed(1)}%`,
    });

    return {
      achievementRate,
      averageTime,
      successfulTests,
      failedTests: testCount - successfulTests,
      details,
    };
  }

  /**
   * 🛠️ 유틸리티 메서드
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 📊 벤치마크 결과를 콘솔에 출력
   */
  printBenchmarkReport(report: BenchmarkReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 AI 성능 벤치마크 결과 리포트');
    console.log('='.repeat(60));

    console.log('\n📋 요약:');
    console.log(`- 총 쿼리: ${report.summary.totalQueries}개`);
    console.log(`- 테스트 엔진: ${report.summary.totalEngines}개`);
    console.log(
      `- 소요 시간: ${(report.summary.benchmarkDuration / 1000).toFixed(1)}초`
    );
    console.log(`- 최고 성능: ${report.summary.bestEngine}`);
    console.log(
      `- 전체 개선율: ${report.summary.overallImprovementRate.toFixed(1)}%`
    );

    console.log('\n📊 엔진별 성능:');
    report.engineResults.forEach((engine) => {
      console.log(`\n🔧 ${engine.engineName}:`);
      console.log(
        `  평균 응답시간: ${engine.averageResponseTime.toFixed(1)}ms`
      );
      console.log(`  P95 응답시간: ${engine.p95ResponseTime.toFixed(1)}ms`);
      console.log(
        `  152ms 달성률: ${(engine.targetAchievedRate * 100).toFixed(1)}%`
      );
      console.log(`  캐시 적중률: ${(engine.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`  성공률: ${((1 - engine.errorRate) * 100).toFixed(1)}%`);
      console.log(`  처리량: ${engine.throughput.toFixed(1)} req/s`);
    });

    console.log('\n📈 개선 현황:');
    report.comparison.improvements.forEach((improvement) => {
      if (improvement.improvementPercentage > 0) {
        console.log(
          `  ${improvement.engineName}: +${improvement.improvementPercentage.toFixed(1)}% 향상`
        );
      } else {
        console.log(
          `  ${improvement.engineName}: ${improvement.improvementPercentage.toFixed(1)}% 저하`
        );
      }
    });

    console.log('\n💡 추천사항:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

// 싱글톤 접근
export function getAIPerformanceBenchmark(): AIPerformanceBenchmark {
  return AIPerformanceBenchmark.getInstance();
}

// 편의 함수들
export async function quickBenchmark(): Promise<BenchmarkReport> {
  const benchmark = getAIPerformanceBenchmark();
  return benchmark.runFullBenchmark({
    engines: ['simplified', 'ultra-performance'],
    testQueries: [
      '서버 상태 확인',
      'CPU 사용률 분석',
      '메모리 사용량 확인',
      '네트워크 트래픽 상태',
      '전체 시스템 상태',
    ],
    iterations: 2,
  });
}

export async function validatePerformanceTarget(
  targetMs: number = 152
): Promise<boolean> {
  const benchmark = getAIPerformanceBenchmark();
  const result = await benchmark.validateTargetAchievement(targetMs, 20);
  return result.achievementRate >= 0.8; // 80% 이상 달성 시 성공
}
