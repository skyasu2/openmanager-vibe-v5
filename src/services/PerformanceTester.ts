/**
 * 🚀 Performance Tester v3.0 (Redis-Free)
 *
 * OpenManager AI v5.12.0 - 고성능 부하 테스트 도구
 * - 메모리 사용률 모니터링
 * - 메모리 기반 성능 메트릭
 * - API 응답시간 측정
 * - 동시 접속 부하 테스트
 * - 자동 성능 최적화 권장사항
 * - Redis 완전 제거, 메모리 기반 메트릭 수집
 */

import { memoryOptimizer } from '../utils/MemoryOptimizer';
import * as os from 'os';

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    usagePercent: number;
  };
  apiResponseTimes: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  systemMetrics?: {
    cpuUsage: number;
    loadAverage: number[];
    uptime: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
  };
}

interface LoadTestConfig {
  duration: number; // 테스트 지속 시간 (초)
  concurrency: number; // 동시 요청 수
  requestsPerSecond: number; // 초당 요청 수
  endpoints: string[]; // 테스트할 엔드포인트
}

interface LoadTestResult {
  config: LoadTestConfig;
  metrics: PerformanceMetrics[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  recommendations: string[];
}

// 메모리 기반 성능 메트릭 저장소
class MemoryMetricsStore {
  private metrics: PerformanceMetrics[] = [];
  private responseTimes: { timestamp: number; duration: number }[] = [];
  private maxSize = 1000; // 최대 1000개 메트릭 유지

  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // 메모리 사용량 제한
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize / 2); // 절반만 유지
    }
  }

  addResponseTime(timestamp: number, duration: number): void {
    this.responseTimes.push({ timestamp, duration });

    // 최근 1시간 데이터만 유지
    const oneHourAgo = Date.now() - 3600000;
    this.responseTimes = this.responseTimes.filter(
      (rt) => rt.timestamp > oneHourAgo
    );
  }

  getRecentResponseTimes(windowMs: number = 60000): number[] {
    const cutoff = Date.now() - windowMs;
    return this.responseTimes
      .filter((rt) => rt.timestamp > cutoff)
      .map((rt) => rt.duration);
  }

  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
    this.responseTimes = [];
  }

  getSize(): { metrics: number; responseTimes: number } {
    return {
      metrics: this.metrics.length,
      responseTimes: this.responseTimes.length,
    };
  }
}

export class PerformanceTester {
  private static instance: PerformanceTester;
  private isRunning: boolean = false;
  private metricsStore: MemoryMetricsStore;
  private responseTimes: number[] = [];

  constructor() {
    this.metricsStore = new MemoryMetricsStore();
  }

  static getInstance(): PerformanceTester {
    if (!this.instance) {
      this.instance = new PerformanceTester();
    }
    return this.instance;
  }

  /**
   * 🔍 현재 성능 메트릭 수집
   */
  async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    const memoryStats = memoryOptimizer.getCurrentMemoryStats();

    // 시스템 메트릭 수집 (Node.js 기반)
    const systemMetrics = this.collectSystemMetrics();

    // API 응답시간 통계
    const apiResponseTimes = this.calculateResponseTimeStats();

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage: {
        heapUsed: memoryStats.heapUsed,
        heapTotal: memoryStats.heapTotal,
        rss: memoryStats.rss,
        usagePercent: memoryStats.usagePercent,
      },
      apiResponseTimes,
      systemMetrics,
      throughput: {
        requestsPerSecond: this.calculateCurrentThroughput(),
        totalRequests: this.responseTimes.length,
      },
    };

    // 메트릭 저장
    this.metricsStore.addMetric(metrics);

    return metrics;
  }

  /**
   * 🖥️ 시스템 메트릭 수집
   */
  private collectSystemMetrics(): {
    cpuUsage: number;
    loadAverage: number[];
    uptime: number;
  } {
    // Node.js process 정보 활용
    const cpuUsage = process.cpuUsage();
    const totalCpuTime = cpuUsage.user + cpuUsage.system;

    return {
      cpuUsage: Math.min(100, (totalCpuTime / 1000000) % 100), // 마이크로초를 백분율로
      loadAverage: process.platform === 'win32' ? [0, 0, 0] : os.loadavg(),
      uptime: process.uptime(),
    };
  }

  /**
   * 📊 응답시간 통계 계산
   */
  private calculateResponseTimeStats(): {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const recentTimes = this.metricsStore.getRecentResponseTimes();

    if (recentTimes.length === 0) {
      return { average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const sorted = [...recentTimes].sort((a, b) => a - b);
    const len = sorted.length;

    const minValue = sorted[0] ?? 0;
    const maxValue = sorted[len - 1] ?? 0;
    const p95Value = sorted[Math.floor(len * 0.95)] ?? maxValue;
    const p99Value = sorted[Math.floor(len * 0.99)] ?? maxValue;

    return {
      average: sorted.reduce((a, b) => a + b, 0) / len,
      min: minValue,
      max: maxValue,
      p95: p95Value,
      p99: p99Value,
    };
  }

  /**
   * 📈 현재 처리량 계산
   */
  private calculateCurrentThroughput(): number {
    const recentTimes = this.metricsStore.getRecentResponseTimes(1000); // 최근 1초
    return recentTimes.length;
  }

  /**
   * 🚀 부하 테스트 실행
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('🚀 부하 테스트 시작:', config);

    this.isRunning = true;
    this.metricsStore.clear();
    this.responseTimes = [];

    const startTime = Date.now();
    const endTime = startTime + config.duration * 1000;

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const allResponseTimes: number[] = [];

    // 메트릭 수집 인터벌 - 성능 최적화
    const metricsInterval = setInterval(() => {
      void (async () => {
        if (!this.isRunning) return;

        try {
          await this.collectCurrentMetrics();
        } catch (error) {
          console.error('❌ 메트릭 수집 실패:', error);
        }
      })();
    }, 5000); // 5초마다 수집

    // 부하 생성
    const loadPromises: Promise<void>[] = [];

    for (let i = 0; i < config.concurrency; i++) {
      const promise = this.generateLoad(
        config,
        endTime,
        (responseTime, success) => {
          totalRequests++;
          allResponseTimes.push(responseTime);

          // 메트릭 저장소에 응답시간 추가
          this.metricsStore.addResponseTime(Date.now(), responseTime);

          if (success) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        }
      );

      loadPromises.push(promise);
    }

    // 모든 부하 생성 완료 대기
    await Promise.all(loadPromises);

    clearInterval(metricsInterval);
    this.isRunning = false;

    // 최종 메트릭 수집
    await this.collectCurrentMetrics();

    // 결과 분석
    const summary = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime:
        allResponseTimes.length > 0
          ? allResponseTimes.reduce((a, b) => a + b, 0) /
            allResponseTimes.length
          : 0,
      maxResponseTime:
        allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0,
      minResponseTime:
        allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0,
      throughput: totalRequests / config.duration,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
    };

    const metrics = this.metricsStore.getAllMetrics();
    const recommendations = this.generateRecommendations(summary, metrics);

    console.log('✅ 부하 테스트 완료:', summary);

    return {
      config,
      metrics,
      summary,
      recommendations,
    };
  }

  /**
   * ⚡ 부하 생성
   */
  private async generateLoad(
    config: LoadTestConfig,
    endTime: number,
    onRequest: (responseTime: number, success: boolean) => void
  ): Promise<void> {
    const requestInterval = Math.max(10, 1000 / config.requestsPerSecond); // 최소 10ms 간격

    while (Date.now() < endTime && this.isRunning) {
      const startTime = Date.now();

      try {
        // 랜덤 엔드포인트 선택
        const endpointIndex = Math.floor(
          Math.random() * config.endpoints.length
        );
        const endpoint = config.endpoints[endpointIndex];

        if (!endpoint) {
          throw new Error('No valid endpoint found');
        }

        // API 요청 실행
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000), // 10초 타임아웃
        });

        const responseTime = Date.now() - startTime;
        const success = response.ok;

        onRequest(responseTime, success);
        this.responseTimes.push(responseTime);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        onRequest(responseTime, false);

        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ 요청 실패:', error.message);
        }
      }

      // 요청 간격 조절
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, requestInterval - elapsed);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * 💡 성능 최적화 권장사항 생성
   */
  private generateRecommendations(
    summary: LoadTestResult['summary'],
    metrics: PerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // 메모리 사용률 분석
    if (metrics.length > 0) {
      const avgMemoryUsage =
        metrics.reduce((sum, m) => sum + m.memoryUsage.usagePercent, 0) /
        metrics.length;
      if (avgMemoryUsage > 80) {
        recommendations.push(
          '🧠 메모리 사용률이 높습니다. 메모리 최적화를 실행하세요.'
        );
      }
    }

    // 응답시간 분석
    if (summary.averageResponseTime > 1000) {
      recommendations.push(
        '⏱️ 평균 응답시간이 1초를 초과합니다. API 최적화가 필요합니다.'
      );
    }

    // 에러율 분석
    if (summary.errorRate > 5) {
      recommendations.push(
        '❌ 에러율이 5%를 초과합니다. 시스템 안정성을 점검하세요.'
      );
    }

    // 처리량 분석
    if (summary.throughput < 100) {
      recommendations.push('📈 처리량이 낮습니다. 서버 스케일링을 고려하세요.');
    }

    // CPU 사용률 분석
    if (metrics.length > 0) {
      const recentMetric = metrics[metrics.length - 1];
      if (
        recentMetric &&
        recentMetric.systemMetrics &&
        recentMetric.systemMetrics.cpuUsage > 80
      ) {
        recommendations.push(
          '🔥 CPU 사용률이 높습니다. 프로세스 최적화가 필요합니다.'
        );
      }
    }

    // 일반적인 권장사항
    if (recommendations.length === 0) {
      recommendations.push(
        '✅ 시스템 성능이 양호합니다. 현재 설정을 유지하세요.'
      );
    }

    return recommendations;
  }

  /**
   * 🔧 자동 성능 최적화 실행
   */
  async performAutoOptimization(): Promise<{
    memoryOptimization: unknown;
    cacheOptimization: boolean;
    systemCleanup: boolean;
  }> {
    console.log('🔧 자동 성능 최적화 시작...');

    const results = {
      memoryOptimization: null as unknown,
      cacheOptimization: false,
      systemCleanup: false,
    };

    try {
      // 1. 메모리 최적화
      const memoryStats = memoryOptimizer.getCurrentMemoryStats();
      if (memoryStats.usagePercent > 75) {
        console.log('🧠 메모리 최적화 실행...');
        results.memoryOptimization =
          await memoryOptimizer.performAggressiveOptimization();
      }

      // 2. 메트릭 저장소 정리
      try {
        const storeSize = this.metricsStore.getSize();
        if (storeSize.metrics > 500 || storeSize.responseTimes > 1000) {
          // 오래된 데이터 정리
          this.metricsStore.clear();
          console.log('🗑️ 메트릭 저장소 정리 완료');
        }
        results.cacheOptimization = true;
      } catch (error) {
        console.error('❌ 메트릭 저장소 정리 실패:', error);
      }

      // 3. 시스템 정리 (가비지 컬렉션)
      try {
        if (global.gc) {
          global.gc();
          console.log('♻️ 가비지 컬렉션 실행');
        }
        results.systemCleanup = true;
      } catch (error) {
        console.warn('⚠️ 가비지 컬렉션 실행 실패:', error);
      }

      console.log('✅ 자동 성능 최적화 완료:', results);
      return results;
    } catch (error) {
      console.error('❌ 자동 성능 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 성능 리포트 생성
   */
  generatePerformanceReport(testResult: LoadTestResult): string {
    const { config, summary, recommendations, metrics } = testResult;

    const lastMetric =
      metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
    const memoryStats = lastMetric?.memoryUsage ?? null;

    return `
# 🚀 OpenManager 성능 테스트 리포트

## 📋 테스트 설정
- **지속 시간**: ${config.duration}초
- **동시 접속**: ${config.concurrency}명
- **초당 요청**: ${config.requestsPerSecond}req/s
- **테스트 엔드포인트**: ${config.endpoints.length}개

## 📊 성능 결과
- **총 요청 수**: ${summary.totalRequests.toLocaleString()}
- **성공 요청**: ${summary.successfulRequests.toLocaleString()} (${((summary.successfulRequests / summary.totalRequests) * 100).toFixed(1)}%)
- **실패 요청**: ${summary.failedRequests.toLocaleString()} (${summary.errorRate.toFixed(1)}%)
- **평균 응답시간**: ${summary.averageResponseTime.toFixed(0)}ms
- **최대 응답시간**: ${summary.maxResponseTime.toFixed(0)}ms
- **최소 응답시간**: ${summary.minResponseTime.toFixed(0)}ms
- **처리량**: ${summary.throughput.toFixed(1)} req/s

## 💾 시스템 리소스
${
  memoryStats
    ? `
- **메모리 사용률**: ${memoryStats.usagePercent.toFixed(1)}%
- **힙 메모리**: ${(memoryStats.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(memoryStats.heapTotal / 1024 / 1024).toFixed(1)}MB
- **RSS 메모리**: ${(memoryStats.rss / 1024 / 1024).toFixed(1)}MB
`
    : '- **메모리 정보**: 수집되지 않음'
}

## 💡 최적화 권장사항
${recommendations.map((rec) => `- ${rec}`).join('\n')}

## 📈 성능 등급
${this.calculatePerformanceGrade(summary)}
    `.trim();
  }

  /**
   * 🏆 성능 등급 계산
   */
  private calculatePerformanceGrade(
    summary: LoadTestResult['summary']
  ): string {
    let score = 100;

    // 응답시간 점수 (40점)
    if (summary.averageResponseTime > 2000) score -= 40;
    else if (summary.averageResponseTime > 1000) score -= 20;
    else if (summary.averageResponseTime > 500) score -= 10;

    // 에러율 점수 (30점)
    if (summary.errorRate > 10) score -= 30;
    else if (summary.errorRate > 5) score -= 15;
    else if (summary.errorRate > 1) score -= 5;

    // 처리량 점수 (30점)
    if (summary.throughput < 50) score -= 30;
    else if (summary.throughput < 100) score -= 15;
    else if (summary.throughput < 200) score -= 5;

    if (score >= 90) return '🏆 **A등급** - 우수한 성능';
    if (score >= 80) return '🥈 **B등급** - 양호한 성능';
    if (score >= 70) return '🥉 **C등급** - 보통 성능';
    if (score >= 60) return '⚠️ **D등급** - 개선 필요';
    return '❌ **F등급** - 심각한 성능 문제';
  }

  /**
   * 🛑 테스트 중지
   */
  stopTest(): void {
    this.isRunning = false;
    console.log('🛑 부하 테스트 중지됨');
  }

  /**
   * 📈 실시간 메트릭 조회
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    const metrics = this.metricsStore.getAllMetrics();
    const lastMetric =
      metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
    return lastMetric ?? null;
  }

  /**
   * 📊 메트릭 저장소 상태
   */
  getStoreStats(): { metrics: number; responseTimes: number } {
    return this.metricsStore.getSize();
  }

  /**
   * 🔍 테스트 상태 확인
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 🧹 메트릭 정리
   */
  clearMetrics(): void {
    this.metricsStore.clear();
    this.responseTimes = [];
    console.log('🧹 성능 메트릭 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const performanceTester = PerformanceTester.getInstance();
