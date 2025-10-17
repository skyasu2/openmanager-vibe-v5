/**
 * 🚀 AI 성능 벤치마킹 도구
 *
 * AI 엔진들의 성능을 실시간으로 측정하고 최적화 방안을 제시
 * 목표: 152ms → 70-90ms 달성 검증
 *
 * 측정 항목:
 * - 응답 시간 (평균, 최소, 최대, P95)
 * - 캐시 히트율
 * - 엔진별 성능 비교
 * - 쿼리 복잡도별 성능
 * - 메모리 사용량
 * - 에러율
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
  SimplifiedQueryEngine,
  type QueryRequest,
  type QueryResponse,
} from './SimplifiedQueryEngine';
import { PerformanceOptimizedQueryEngine } from './performance-optimized-query-engine';
import {
  FastAIEngineRouter,
  getFastAIEngineRouter,
} from './FastAIEngineRouter';
import { QueryComplexityAnalyzer } from './QueryComplexityAnalyzer';
import { getVectorSearchOptimizer } from './vector-search-optimizer';

interface BenchmarkConfig {
  sampleSize: number;
  timeoutMs: number;
  enableDetailedMetrics: boolean;
  testCases: TestCase[];
  engines: EngineType[];
}

interface TestCase {
  query: string;
  expectedComplexity: 'simple' | 'medium' | 'complex';
  category: string;
  expectedResponseTime: number; // ms
}

interface PerformanceMetrics {
  engineName: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  cacheHitRate: number;
  memoryUsage: number; // MB
  errorCount: number;
  complexityBreakdown: {
    simple: { count: number; avgTime: number };
    medium: { count: number; avgTime: number };
    complex: { count: number; avgTime: number };
  };
}

interface BenchmarkResult {
  timestamp: string;
  totalTestsRun: number;
  overallPerformance: {
    targetAchieved: boolean; // 70-90ms 목표 달성 여부
    improvementPercentage: number; // 152ms 대비 개선율
    bestEngine: string;
    recommendation: string;
  };
  engineResults: PerformanceMetrics[];
  detailedAnalysis: {
    bottlenecks: string[];
    optimizationOpportunities: string[];
    recommendedActions: string[];
  };
}

type EngineType = 'simplified' | 'performance-optimized' | 'fast-router';

export class AIPerformanceBenchmark {
  private config: BenchmarkConfig;
  private testCases: TestCase[];

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = {
      sampleSize: 50,
      timeoutMs: 300,
      enableDetailedMetrics: true,
      engines: ['simplified', 'performance-optimized', 'fast-router'],
      testCases: this.generateTestCases(),
      ...config,
    };

    this.testCases = this.config.testCases;
  }

  /**
   * 🎯 메인 벤치마크 실행
   */
  async runBenchmark(): Promise<BenchmarkResult> {
    console.log('🚀 AI 성능 벤치마크 시작');
    const startTime = Date.now();

    // 벤치마크 전 최적화 실행
    await this.preOptimizeSystem();

    const engineResults: PerformanceMetrics[] = [];

    // 각 엔진별 테스트 실행
    for (const engineType of this.config.engines) {
      console.log(`📊 ${engineType} 엔진 테스트 중...`);
      const metrics = await this.testEngine(engineType);
      engineResults.push(metrics);
    }

    // 결과 분석
    const analysis = this.analyzeResults(engineResults);

    const result: BenchmarkResult = {
      timestamp: new Date().toISOString(),
      totalTestsRun: this.config.sampleSize * this.config.engines.length,
      overallPerformance: analysis,
      engineResults,
      detailedAnalysis: this.generateDetailedAnalysis(engineResults),
    };

    console.log('✅ 벤치마크 완료', {
      duration: Date.now() - startTime,
      targetAchieved: result.overallPerformance.targetAchieved,
      improvement: `${result.overallPerformance.improvementPercentage}%`,
    });

    return result;
  }

  /**
   * 🔧 시스템 사전 최적화
   */
  private async preOptimizeSystem(): Promise<void> {
    try {
      // Vector 검색 최적화
      const vectorOptimizer = getVectorSearchOptimizer();
      await vectorOptimizer.optimizeVectorSearch();

      // 캐시 워밍업
      await this.warmupCaches();

      console.log('✅ 시스템 사전 최적화 완료');
    } catch (error) {
      console.warn('⚠️ 사전 최적화 부분 실패', error);
    }
  }

  /**
   * 🔥 캐시 워밍업
   */
  private async warmupCaches(): Promise<void> {
    const fastRouter = getFastAIEngineRouter();

    // 자주 사용되는 쿼리들로 캐시 워밍업
    const warmupQueries = [
      '서버 상태 확인',
      'CPU 사용률',
      '메모리 상태',
      '디스크 용량',
      '네트워크 트래픽',
    ];

    const warmupPromises = warmupQueries.map(async (query) => {
      try {
        await fastRouter.route({ query, mode: 'local' });
      } catch (error) {
        // 워밍업 에러는 무시
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log('🔥 캐시 워밍업 완료');
  }

  /**
   * 📊 개별 엔진 테스트
   */
  private async testEngine(
    engineType: EngineType
  ): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      engineName: engineType,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      successRate: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      errorCount: 0,
      complexityBreakdown: {
        simple: { count: 0, avgTime: 0 },
        medium: { count: 0, avgTime: 0 },
        complex: { count: 0, avgTime: 0 },
      },
    };

    const engine = this.createEngine(engineType);
    const responseTimes: number[] = [];
    const complexityTimes: { [key: string]: number[] } = {
      simple: [],
      medium: [],
      complex: [],
    };

    let successCount = 0;
    let cacheHitCount = 0;
    const initialMemory = this.getMemoryUsage();

    // 테스트 실행
    for (let i = 0; i < this.config.sampleSize; i++) {
      const testCase = this.testCases[i % this.testCases.length];
      if (!testCase) {
        continue;
      }

      try {
        const startTime = performance.now();

        const request: QueryRequest = {
          query: testCase.query,
          mode: 'local',
          options: { timeoutMs: this.config.timeoutMs },
        };

        const response = await this.executeWithEngine(engine, request);
        const responseTime = performance.now() - startTime;

        if (response.success) {
          successCount++;
          responseTimes.push(responseTime);

          // 복잡도별 분류
          const complexity = testCase.expectedComplexity;
          if (complexityTimes[complexity]) {
            complexityTimes[complexity].push(responseTime);
          }
          metrics.complexityBreakdown[complexity].count++;

          // 캐시 히트 확인
          if (response.metadata?.cacheHit || response.metadata?.cached) {
            cacheHitCount++;
          }
        } else {
          metrics.errorCount++;
        }
      } catch (error) {
        metrics.errorCount++;
        console.warn(`테스트 ${i + 1} 실패:`, error);
      }
    }

    // 메트릭 계산
    if (responseTimes.length > 0) {
      metrics.avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      metrics.minResponseTime = Math.min(...responseTimes);
      metrics.maxResponseTime = Math.max(...responseTimes);
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    }

    metrics.successRate = successCount / this.config.sampleSize;
    metrics.cacheHitRate = cacheHitCount / Math.max(successCount, 1);
    metrics.memoryUsage = this.getMemoryUsage() - initialMemory;

    // 복잡도별 평균 시간 계산
    for (const [complexity, times] of Object.entries(complexityTimes)) {
      if (times.length > 0) {
        metrics.complexityBreakdown[
          complexity as keyof typeof metrics.complexityBreakdown
        ].avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      }
    }

    return metrics;
  }

  /**
   * 🏭 엔진 팩토리
   */
  private createEngine(type: EngineType): SimplifiedQueryEngine | PerformanceOptimizedQueryEngine | FastAIEngineRouter {
    switch (type) {
      case 'simplified':
        return new SimplifiedQueryEngine();
      case 'performance-optimized':
        return new PerformanceOptimizedQueryEngine();
      case 'fast-router':
        return getFastAIEngineRouter();
      default:
        throw new Error(`Unknown engine type: ${type}`);
    }
  }

  /**
   * 🚀 엔진 실행 (타입별 적응)
   */
  private async executeWithEngine(
    engine: SimplifiedQueryEngine | PerformanceOptimizedQueryEngine | FastAIEngineRouter,
    request: QueryRequest
  ): Promise<QueryResponse> {
    if (engine instanceof FastAIEngineRouter) {
      return await engine.route(request);
    } else {
      return await engine.query(request);
    }
  }

  /**
   * 📊 결과 분석
   */
  private analyzeResults(
    results: PerformanceMetrics[]
  ): BenchmarkResult['overallPerformance'] {
    const target = 90; // 90ms 목표
    const baseline = 152; // 기존 152ms

    // 최고 성능 엔진 찾기
    const bestEngine = results.reduce((best, current) =>
      current.avgResponseTime < best.avgResponseTime ? current : best
    );

    const bestTime = bestEngine.avgResponseTime;
    const targetAchieved = bestTime <= target;
    const improvementPercentage = Math.round(
      ((baseline - bestTime) / baseline) * 100
    );

    let recommendation = '';

    if (targetAchieved) {
      recommendation = `🎉 목표 달성! ${bestEngine.engineName}이 ${bestTime.toFixed(1)}ms로 최고 성능`;
    } else if (bestTime <= 120) {
      recommendation = `🔥 거의 달성! ${bestEngine.engineName} 추가 최적화로 목표 가능`;
    } else {
      recommendation = `⚡ 추가 최적화 필요. 현재 최고: ${bestTime.toFixed(1)}ms`;
    }

    return {
      targetAchieved,
      improvementPercentage,
      bestEngine: bestEngine.engineName,
      recommendation,
    };
  }

  /**
   * 🔍 상세 분석
   */
  private generateDetailedAnalysis(
    results: PerformanceMetrics[]
  ): BenchmarkResult['detailedAnalysis'] {
    const bottlenecks: string[] = [];
    const optimizationOpportunities: string[] = [];
    const recommendedActions: string[] = [];

    // 병목 현상 분석
    results.forEach((result) => {
      if (result.avgResponseTime > 100) {
        bottlenecks.push(
          `${result.engineName}: 평균 응답시간 ${result.avgResponseTime.toFixed(1)}ms`
        );
      }

      if (result.cacheHitRate < 0.5) {
        bottlenecks.push(
          `${result.engineName}: 낮은 캐시 히트율 ${(result.cacheHitRate * 100).toFixed(1)}%`
        );
      }

      if (result.successRate < 0.95) {
        bottlenecks.push(
          `${result.engineName}: 낮은 성공률 ${(result.successRate * 100).toFixed(1)}%`
        );
      }
    });

    // 최적화 기회
    const fastestEngine = results.reduce((fastest, current) =>
      current.avgResponseTime < fastest.avgResponseTime ? current : fastest
    );

    if (fastestEngine.avgResponseTime > 70) {
      optimizationOpportunities.push('3단계 캐시 전략 강화');
      optimizationOpportunities.push('임베딩 차원 축소 (384→256)');
      optimizationOpportunities.push('병렬 처리 파이프라인 확장');
    }

    if (results.some((r) => r.cacheHitRate < 0.8)) {
      optimizationOpportunities.push('예측적 캐싱 구현');
      optimizationOpportunities.push('쿼리 패턴 인식 개선');
    }

    // 권장 액션
    if (fastestEngine.engineName === 'fast-router') {
      recommendedActions.push('FastAIEngineRouter를 메인 엔진으로 사용');
    } else {
      recommendedActions.push('FastAIEngineRouter 추가 최적화 필요');
    }

    if (bottlenecks.length > 0) {
      recommendedActions.push('식별된 병목 현상 우선 해결');
    }

    recommendedActions.push('Vector 검색 인덱스 최적화');
    recommendedActions.push('한국어 NLP GCP Function Keep-Warm 전략');

    return {
      bottlenecks,
      optimizationOpportunities,
      recommendedActions,
    };
  }

  /**
   * 📋 테스트 케이스 생성
   */
  private generateTestCases(): TestCase[] {
    return [
      // Simple queries (목표: 50-70ms)
      {
        query: '서버 상태',
        expectedComplexity: 'simple',
        category: 'monitoring',
        expectedResponseTime: 60,
      },
      {
        query: 'CPU 사용률',
        expectedComplexity: 'simple',
        category: 'metrics',
        expectedResponseTime: 55,
      },
      {
        query: '메모리 확인',
        expectedComplexity: 'simple',
        category: 'metrics',
        expectedResponseTime: 50,
      },
      {
        query: '디스크 공간',
        expectedComplexity: 'simple',
        category: 'storage',
        expectedResponseTime: 65,
      },

      // Medium queries (목표: 70-90ms)
      {
        query: '지난 1시간 CPU 트렌드 분석',
        expectedComplexity: 'medium',
        category: 'analysis',
        expectedResponseTime: 85,
      },
      {
        query: '메모리 사용량 서버별 비교',
        expectedComplexity: 'medium',
        category: 'comparison',
        expectedResponseTime: 80,
      },
      {
        query: '네트워크 트래픽 이상 감지',
        expectedComplexity: 'medium',
        category: 'anomaly',
        expectedResponseTime: 90,
      },

      // Complex queries (목표: 90-120ms, Google AI 사용)
      {
        query: '전체 시스템 성능 최적화 방안 제시',
        expectedComplexity: 'complex',
        category: 'optimization',
        expectedResponseTime: 110,
      },
      {
        query: '서버 클러스터 부하 분산 전략 분석',
        expectedComplexity: 'complex',
        category: 'strategy',
        expectedResponseTime: 120,
      },
      {
        query: '장애 예측 및 예방 조치 권고',
        expectedComplexity: 'complex',
        category: 'prediction',
        expectedResponseTime: 100,
      },

      // 추가 실제 사용자 쿼리들
      {
        query: 'top 명령어 사용법',
        expectedComplexity: 'simple',
        category: 'command',
        expectedResponseTime: 45,
      },
      {
        query: '로그 파일 분석 방법',
        expectedComplexity: 'medium',
        category: 'troubleshooting',
        expectedResponseTime: 75,
      },
      {
        query: '데이터베이스 연결 상태',
        expectedComplexity: 'simple',
        category: 'database',
        expectedResponseTime: 55,
      },
    ];
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[index] || 0;
  }

  private getMemoryUsage(): number {
    // Node.js 환경에서 메모리 사용량 반환 (MB)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  /**
   * 📊 결과 요약 리포트 생성
   */
  generateSummaryReport(result: BenchmarkResult): string {
    const { overallPerformance, engineResults } = result;

    let report = `
🚀 AI 성능 벤치마크 리포트
═════════════════════════════

📊 전체 성능 요약:
• 목표 달성: ${overallPerformance.targetAchieved ? '✅ 성공' : '❌ 미달성'}
• 성능 개선: ${overallPerformance.improvementPercentage}% (152ms 대비)
• 최고 엔진: ${overallPerformance.bestEngine}
• 권장사항: ${overallPerformance.recommendation}

🏆 엔진별 성능 비교:
`;

    engineResults.forEach((engine) => {
      report += `
📈 ${engine.engineName.toUpperCase()}:
• 평균 응답시간: ${engine.avgResponseTime.toFixed(1)}ms
• 최소/최대: ${engine.minResponseTime.toFixed(1)}ms / ${engine.maxResponseTime.toFixed(1)}ms
• P95 응답시간: ${engine.p95ResponseTime.toFixed(1)}ms
• 성공률: ${(engine.successRate * 100).toFixed(1)}%
• 캐시 히트율: ${(engine.cacheHitRate * 100).toFixed(1)}%
• 에러 수: ${engine.errorCount}
`;
    });

    report += `
🔍 상세 분석:
병목 현상: ${result.detailedAnalysis.bottlenecks.join(', ') || '없음'}
최적화 기회: ${result.detailedAnalysis.optimizationOpportunities.join(', ')}
권장 액션: ${result.detailedAnalysis.recommendedActions.join(', ')}

📅 측정 시간: ${result.timestamp}
📊 총 테스트: ${result.totalTestsRun}회
`;

    return report;
  }

  /**
   * 🎯 빠른 성능 체크 (10개 샘플)
   */
  async quickPerformanceCheck(): Promise<{
    avgResponseTime: number;
    targetAchieved: boolean;
    recommendation: string;
  }> {
    const quickConfig: Partial<BenchmarkConfig> = {
      sampleSize: 10,
      engines: ['fast-router'], // 가장 빠른 엔진만 테스트
      testCases: this.generateTestCases().slice(0, 5), // 5개 케이스만
    };

    const originalConfig = this.config;
    this.config = { ...this.config, ...quickConfig };

    try {
      const result = await this.runBenchmark();
      const fastRouterResult = result.engineResults[0];
      if (!fastRouterResult) {
        return {
          avgResponseTime: 0,
          targetAchieved: false,
          recommendation: '벤치마크 실행 실패',
        };
      }

      return {
        avgResponseTime: fastRouterResult.avgResponseTime,
        targetAchieved: fastRouterResult.avgResponseTime <= 90,
        recommendation: result.overallPerformance.recommendation,
      };
    } finally {
      this.config = originalConfig;
    }
  }
}

// 싱글톤 인스턴스
let benchmarkInstance: AIPerformanceBenchmark | null = null;

export function getAIPerformanceBenchmark(
  config?: Partial<BenchmarkConfig>
): AIPerformanceBenchmark {
  if (!benchmarkInstance) {
    benchmarkInstance = new AIPerformanceBenchmark(config);
  }
  return benchmarkInstance;
}

/**
 * 🚀 편의 함수: 빠른 성능 체크
 */
export async function quickAIPerformanceCheck(): Promise<{
  avgResponseTime: number;
  targetAchieved: boolean;
  recommendation: string;
}> {
  const benchmark = getAIPerformanceBenchmark();
  return await benchmark.quickPerformanceCheck();
}
