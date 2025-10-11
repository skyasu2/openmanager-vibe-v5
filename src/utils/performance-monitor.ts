/**
 * 🎯 OpenManager Vibe v5 - 성능 측정 시스템
 *
 * 경연대회용 실제 성능 수치 측정:
 * - 메모리 사용량 실시간 모니터링
 * - AI 응답 시간 정밀 측정
 * - 정확도 계산 및 벤치마크
 * - CPU 사용률 추적
 * - 시스템 리소스 최적화 분석
 */

export interface MemoryUsage {
  heapUsed: number; // MB
  heapTotal: number; // MB
  external: number; // MB
  rss: number; // MB
  percentage: number; // %
  optimization: string;
}

export interface ResponseTimeMetrics {
  responseTime: number; // ms
  category: 'fast' | 'normal' | 'slow';
  baseline: number;
  improvement: number; // %
}

export interface AccuracyMetrics {
  accuracy: number; // %
  precision: number; // %
  recall: number; // %
  f1Score: number; // %
  sampleSize: number;
}

interface ErrorWithMetrics extends Error {
  responseTime?: number;
  metrics?: {
    responseTime: number;
    category: 'slow' | 'medium' | 'fast';
    baseline: number;
    improvement: number;
  };
}

export interface PerformanceBenchmark {
  memoryUsage: MemoryUsage;
  responseTime: ResponseTimeMetrics;
  accuracy: AccuracyMetrics;
  timestamp: string;
  engineType: string;
}

// 타입 정의 추가
interface PerformanceSummary {
  avgResponseTime: string;
  avgMemoryUsage: string;
  avgAccuracy: string;
  totalMeasurements: number;
  period: string;
  message?: string;
}

interface PerformanceImprovements {
  responseTime: string;
  memory: string;
  accuracy: string;
  message?: string;
}

interface PerformanceReport {
  summary: PerformanceSummary;
  detailed: PerformanceBenchmark[];
  improvements: PerformanceImprovements;
}

type BaselineValue = number | string;

export class PerformanceMonitor {
  private static baselines: Map<string, BaselineValue> = new Map();
  private static measurements: PerformanceBenchmark[] = [];

  /**
   * 📊 실제 메모리 사용량 측정 (Node.js process.memoryUsage())
   */
  static getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    const totalSystemMemory = 8 * 1024 * 1024 * 1024; // 8GB 기준 (실제 환경에서는 os.totalmem() 사용)

    const heapUsed = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(usage.heapTotal / 1024 / 1024);
    const external = Math.round(usage.external / 1024 / 1024);
    const rss = Math.round(usage.rss / 1024 / 1024);

    const percentage =
      Math.round((usage.rss / totalSystemMemory) * 10000) / 100;

    // 메모리 최적화 상태 분석
    let optimization = '최적화됨';
    if (percentage > 15) optimization = '개선 필요';
    else if (percentage > 10) optimization = '보통';
    else if (percentage < 5) optimization = '매우 효율적';

    return {
      heapUsed,
      heapTotal,
      external,
      rss,
      percentage,
      optimization,
    };
  }

  /**
   * ⏱️ 응답 시간 정밀 측정 (performance.now() 사용)
   */
  static async measureResponseTime<T>(
    fn: () => Promise<T> | T,
    engineType: string = 'unknown'
  ): Promise<{ result: T; metrics: ResponseTimeMetrics }> {
    const start = performance.now();

    try {
      const result = await fn();
      const end = performance.now();
      const responseTime = Math.round((end - start) * 100) / 100; // 소수점 2자리

      // 기준값과 비교
      const baseline = this.getBaseline(engineType, 'responseTime') || 1000;
      const improvement = Math.round(
        ((baseline - responseTime) / baseline) * 100
      );

      // 카테고리 분류
      let category: 'fast' | 'normal' | 'slow' = 'normal';
      if (responseTime < 100) category = 'fast';
      else if (responseTime > 2000) category = 'slow';

      const metrics: ResponseTimeMetrics = {
        responseTime,
        category,
        baseline,
        improvement,
      };

      return { result, metrics };
    } catch (error) {
      const end = performance.now();
      const responseTime = Math.round((end - start) * 100) / 100;

      const errorWithMetrics = new Error(
        error instanceof Error ? error.message : String(error)
      ) as ErrorWithMetrics;
      errorWithMetrics.responseTime = responseTime;
      errorWithMetrics.metrics = {
        responseTime,
        category: 'slow' as const,
        baseline: 0,
        improvement: 0,
      };
      throw errorWithMetrics;
    }
  }

  /**
   * 🎯 AI 정확도 측정 (실제 예측 vs 실제 결과)
   */
  static calculateAccuracy(
    predictions: Array<{ status: string; confidence?: number; value?: number }>,
    actuals: Array<{ status: string; value?: number }>
  ): AccuracyMetrics {
    if (predictions.length === 0 || actuals.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        sampleSize: 0,
      };
    }

    const minLength = Math.min(predictions.length, actuals.length);
    const validPredictions = predictions.slice(0, minLength);
    const validActuals = actuals.slice(0, minLength);

    // 정확도 계산 (status 기준)
    const correctPredictions = validPredictions.filter(
      (p, i) => p.status === validActuals[i]?.status
    );
    const accuracy = Math.round((correctPredictions.length / minLength) * 100);

    // Precision, Recall, F1-Score 계산 (3-class: 정상, 경고, 위험)
    const statuses = ['정상상태', '경고상태', '위험상태'];
    let totalPrecision = 0;
    let totalRecall = 0;
    let validClasses = 0;

    statuses.forEach((status) => {
      const tp = validPredictions.filter(
        (p, i) => p.status === status && validActuals[i]?.status === status
      ).length;

      const fp = validPredictions.filter(
        (p, i) => p.status === status && validActuals[i]?.status !== status
      ).length;

      const fn = validPredictions.filter(
        (p, i) => p.status !== status && validActuals[i]?.status === status
      ).length;

      if (tp + fp > 0) {
        totalPrecision += tp / (tp + fp);
        validClasses++;
      }

      if (tp + fn > 0) {
        totalRecall += tp / (tp + fn);
      }
    });

    const precision =
      validClasses > 0 ? Math.round((totalPrecision / validClasses) * 100) : 0;
    const recall =
      validClasses > 0 ? Math.round((totalRecall / validClasses) * 100) : 0;
    const f1Score =
      precision + recall > 0
        ? Math.round((2 * precision * recall) / (precision + recall))
        : 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      sampleSize: minLength,
    };
  }

  /**
   * 💻 CPU 사용률 측정 (Node.js 기반)
   */
  static async getCPUUsage(): Promise<{ usage: number; category: string }> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);

        const totalTime = currentTime[0] * 1e6 + currentTime[1] / 1e3; // microseconds
        const userUsage = currentUsage.user;
        const systemUsage = currentUsage.system;

        const usage = Math.round(((userUsage + systemUsage) / totalTime) * 100);

        let category = '정상';
        if (usage > 80) category = '높음';
        else if (usage > 50) category = '보통';
        else if (usage < 20) category = '낮음';

        resolve({ usage, category });
      }, 100); // 100ms 샘플링
    });
  }

  /**
   * 📈 종합 성능 벤치마크 실행
   */
  static async runBenchmark<T = unknown>(
    engineType: string,
    testFunction: () => Promise<T>,
    expectedResults?: T[]
  ): Promise<PerformanceBenchmark> {
    console.log(`🔍 ${engineType} 성능 벤치마크 시작...`);

    // 메모리 사용량 측정
    const memoryBefore = this.getMemoryUsage();

    // 응답 시간 및 결과 측정
    const { result, metrics: responseTime } = await this.measureResponseTime(
      testFunction,
      engineType
    );

    const memoryAfter = this.getMemoryUsage();

    // 정확도 측정 (예상 결과가 있는 경우)
    let accuracy: AccuracyMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      sampleSize: 0,
    };
    if (expectedResults && Array.isArray(result)) {
      // Type assertion for compatibility with calculateAccuracy
      const predictions = result as Array<{
        status: string;
        confidence?: number;
        value?: number;
      }>;
      const actuals = expectedResults as Array<{
        status: string;
        value?: number;
      }>;
      accuracy = this.calculateAccuracy(predictions, actuals);
    }

    const benchmark: PerformanceBenchmark = {
      memoryUsage: {
        ...memoryAfter,
        optimization: this.calculateMemoryOptimization(
          memoryBefore,
          memoryAfter
        ),
      },
      responseTime,
      accuracy,
      timestamp: new Date().toISOString(),
      engineType,
    };

    // 측정 결과 저장
    this.measurements.push(benchmark);
    this.updateBaselines(engineType, benchmark);

    console.log(`✅ ${engineType} 벤치마크 완료:`, {
      메모리: `${benchmark.memoryUsage.rss}MB (${benchmark.memoryUsage.percentage}%)`,
      응답시간: `${benchmark.responseTime.responseTime}ms`,
      정확도: `${benchmark.accuracy.accuracy}%`,
    });

    return benchmark;
  }

  /**
   * 📊 메모리 최적화 분석
   */
  private static calculateMemoryOptimization(
    before: MemoryUsage,
    after: MemoryUsage
  ): string {
    const diff = after.rss - before.rss;
    const percentage = Math.round((diff / before.rss) * 100);

    if (percentage < -30) return '매우 효율적 (-30% 이상 절약)';
    if (percentage < -10) return `효율적 (${Math.abs(percentage)}% 절약)`;
    if (percentage < 10) return '안정적';
    if (percentage < 30) return `증가 (+${percentage}%)`;
    return `비효율적 (+${percentage}% 이상)`;
  }

  /**
   * 📋 기준값 관리
   */
  private static getBaseline(engineType: string, metric: string): number {
    const value = this.baselines.get(`${engineType}.${metric}`);
    return typeof value === 'number' ? value : 0;
  }

  private static updateBaselines(
    engineType: string,
    benchmark: PerformanceBenchmark
  ): void {
    this.baselines.set(
      `${engineType}.responseTime`,
      benchmark.responseTime.responseTime
    );
    this.baselines.set(`${engineType}.memoryUsage`, benchmark.memoryUsage.rss);
    this.baselines.set(`${engineType}.accuracy`, benchmark.accuracy.accuracy);
  }

  /**
   * 📈 성능 리포트 생성
   */
  static generatePerformanceReport(): PerformanceReport {
    const recent = this.measurements.slice(-10); // 최근 10개

    if (recent.length === 0) {
      return {
        summary: {
          avgResponseTime: '0ms',
          avgMemoryUsage: '0MB',
          avgAccuracy: '0%',
          totalMeasurements: 0,
          period: 'No data',
          message: '성능 측정 데이터가 없습니다.',
        },
        detailed: [],
        improvements: {
          responseTime: '0%',
          memory: '0%',
          accuracy: '0%',
        },
      };
    }

    const avgResponseTime = Math.round(
      recent.reduce((sum, m) => sum + m.responseTime.responseTime, 0) /
        recent.length
    );

    const avgMemory = Math.round(
      recent.reduce((sum, m) => sum + m.memoryUsage.rss, 0) / recent.length
    );

    const avgAccuracy = Math.round(
      recent.reduce((sum, m) => sum + m.accuracy.accuracy, 0) / recent.length
    );

    // 개선사항 계산
    const improvements = this.calculateImprovements(recent);

    return {
      summary: {
        avgResponseTime: `${avgResponseTime}ms`,
        avgMemoryUsage: `${avgMemory}MB`,
        avgAccuracy: `${avgAccuracy}%`,
        totalMeasurements: this.measurements.length,
        period:
          recent.length > 0
            ? `${recent[0]?.timestamp ?? 'N/A'} ~ ${recent[recent.length - 1]?.timestamp ?? 'N/A'}`
            : 'No data',
      },
      detailed: recent,
      improvements,
    };
  }

  /**
   * 📊 개선사항 계산
   */
  private static calculateImprovements(
    measurements: PerformanceBenchmark[]
  ): PerformanceImprovements {
    if (measurements.length < 2)
      return {
        responseTime: '0%',
        memory: '0%',
        accuracy: '0%',
        message: '비교할 데이터가 부족합니다.',
      };

    const first = measurements[0];
    const last = measurements[measurements.length - 1];

    if (!first || !last) {
      return {
        responseTime: '0%',
        memory: '0%',
        accuracy: '0%',
      };
    }

    const responseTimeImprovement = Math.round(
      ((first.responseTime.responseTime - last.responseTime.responseTime) /
        first.responseTime.responseTime) *
        100
    );

    const memoryImprovement = Math.round(
      ((first.memoryUsage.rss - last.memoryUsage.rss) / first.memoryUsage.rss) *
        100
    );

    const accuracyImprovement =
      last.accuracy.accuracy - first.accuracy.accuracy;

    return {
      responseTime: `${responseTimeImprovement > 0 ? '+' : ''}${responseTimeImprovement}%`,
      memory: `${memoryImprovement > 0 ? '+' : ''}${memoryImprovement}%`,
      accuracy: `${accuracyImprovement > 0 ? '+' : ''}${accuracyImprovement}%`,
    };
  }

  /**
   * 🔄 측정 데이터 초기화
   */
  static clearMeasurements(): void {
    this.measurements = [];
    this.baselines.clear();
    console.log('📊 성능 측정 데이터 초기화 완료');
  }

  /**
   * 📊 실시간 성능 모니터링
   */
  static startRealTimeMonitoring(intervalMs: number = 5000): NodeJS.Timeout {
    console.log(`🔄 실시간 성능 모니터링 시작 (${intervalMs}ms 간격)`);

    return setInterval(async () => {
      const memory = this.getMemoryUsage();
      const cpu = await this.getCPUUsage();

      console.log(
        `📊 [${new Date().toLocaleTimeString()}] 메모리: ${memory.rss}MB (${memory.percentage}%), CPU: ${cpu.usage}% (${cpu.category})`
      );
    }, intervalMs);
  }
}

// 전역 성능 측정 유틸리티
export const perf = PerformanceMonitor;
