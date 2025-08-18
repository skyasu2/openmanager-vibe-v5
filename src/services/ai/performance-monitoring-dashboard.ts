/**
 * AI 성능 모니터링 대시보드
 * 실시간 성능 추적, 분석, 최적화 제안
 */

import { EventEmitter } from 'events';
import type {
  PerformanceMetric,
  PerformanceSummary,
  PerformanceTrend,
  AutoOptimizationResult,
  OptimizationInfo,
  PerformanceAlert,
  ComplexityScore,
} from '@/types/performance';

interface PerformanceOptimizationResult {
  success: boolean;
  message: string;
  metrics?: {
    before: PerformanceMetric;
    after: PerformanceMetric;
    improvement: number;
  };
  optimizationSteps?: string[];
  totalTime?: number;
  parallelTasks?: string[];
  engineUsed?: string;
}

export class PerformanceMonitoringDashboard {
  private static instance: PerformanceMonitoringDashboard;

  private metrics: PerformanceMetric[] = [];
  private maxMetricHistory = 10000; // 최대 1만개 기록
  private alerts: PerformanceAlert[] = [];
  private eventEmitter = new EventEmitter();

  // 성능 임계값 설정
  private thresholds = {
    responseTime: 2000, // 2초
    memoryUsage: 512, // 512MB
    cacheHitRate: 0.8, // 80%
    accuracy: 0.85, // 85%
  };

  private constructor() {
    this.startPerformanceMonitoring();
  }

  public static getInstance(): PerformanceMonitoringDashboard {
    if (!PerformanceMonitoringDashboard.instance) {
      PerformanceMonitoringDashboard.instance =
        new PerformanceMonitoringDashboard();
    }
    return PerformanceMonitoringDashboard.instance;
  }

  /**
   * 성능 메트릭 기록
   */
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
    });

    // 최대 히스토리 크기 유지
    if (this.metrics.length > this.maxMetricHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricHistory);
    }

    // 실시간 알림 체크
    this.checkThresholds(metric);

    // 이벤트 발송
    this.eventEmitter.emit('metricRecorded', metric);
  }

  /**
   * 성능 요약 생성
   */
  public generateSummary(
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): PerformanceSummary {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantMetrics = this.metrics.filter(
      (m) => new Date(m.timestamp) >= cutoffTime
    );

    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        targetAchievementRate: 0,
        cacheHitRate: 0,
        peakMemoryUsage: 0,
        topOptimizations: [],
        topBottlenecks: [],
        message: '데이터 없음',
        period: timeRange,
      };
    }

    const totalRequests = relevantMetrics.length;
    const avgResponseTime = this.calculateAverage(
      relevantMetrics,
      'responseTime'
    );
    const cacheHits = relevantMetrics.filter((m) => m.cacheHit).length;
    const cacheHitRate = cacheHits / totalRequests;
    const targetAchievements = relevantMetrics.filter(
      (m) => m.responseTime <= this.thresholds.responseTime
    ).length;
    const targetAchievementRate = targetAchievements / totalRequests;
    const peakMemoryUsage = Math.max(
      ...relevantMetrics.map((m) => m.memoryUsage)
    );

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      targetAchievementRate: Math.round(targetAchievementRate * 100),
      cacheHitRate: Math.round(cacheHitRate * 100),
      peakMemoryUsage: Math.round(peakMemoryUsage),
      topOptimizations: this.getTopOptimizations(),
      topBottlenecks: this.getTopBottlenecks(),
      avgResponseTimeDisplay: `${Math.round(avgResponseTime)}ms`,
      period: timeRange,
      message: `${timeRange} 기간 성능 요약`,
    };
  }

  /**
   * 성능 트렌드 분석
   */
  public analyzeTrends(
    timeRange: '24h' | '7d' | '30d' = '24h'
  ): PerformanceTrend[] {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantMetrics = this.metrics.filter(
      (m) => new Date(m.timestamp) >= cutoffTime
    );

    // 시간대별로 그룹화 (1시간 단위)
    const hourlyGroups = this.groupMetricsByHour(relevantMetrics);

    return Array.from(hourlyGroups.entries()).map(([hour, metrics]) => ({
      period: hour,
      avgResponseTime: this.calculateAverage(metrics, 'responseTime'),
      memoryUsage: this.calculateAverage(metrics, 'memoryUsage'),
      accuracy: this.calculateAverage(metrics, 'accuracy'),
      cacheHitRate: metrics.filter((m) => m.cacheHit).length / metrics.length,
      timestamp: new Date(hour).toISOString(),
    }));
  }

  /**
   * 자동 성능 최적화 실행
   */
  public async performAutoOptimization(): Promise<AutoOptimizationResult | null> {
    try {
      const recentMetrics = this.getRecentMetrics(100);
      if (recentMetrics.length < 10) {
        return null;
      }

      const summary = this.generateSummary('1h');
      const optimizations: string[] = [];
      let successfulTests = 0;
      let failedTests = 0;
      const testDetails: Array<{
        test: number;
        responseTime: number;
        targetAchieved: boolean;
        optimizations: string[];
      }> = [];

      // 캐시 최적화 테스트
      if (summary.cacheHitRate < 80) {
        optimizations.push('캐시 크기 증가');
        const testResult = await this.testCacheOptimization();
        testDetails.push({
          test: 1,
          responseTime: testResult.responseTime,
          targetAchieved: testResult.targetAchieved,
          optimizations: ['cache-size-increase'],
        });

        if (testResult.success) successfulTests++;
        else failedTests++;
      }

      // 메모리 최적화 테스트
      if (summary.peakMemoryUsage > 400) {
        optimizations.push('메모리 사용량 최적화');
        const testResult = await this.testMemoryOptimization();
        testDetails.push({
          test: 2,
          responseTime: testResult.responseTime,
          targetAchieved: testResult.targetAchieved,
          optimizations: ['memory-optimization'],
        });

        if (testResult.success) successfulTests++;
        else failedTests++;
      }

      // 응답 시간 최적화 테스트
      if (summary.avgResponseTime > 1500) {
        optimizations.push('응답 시간 최적화');
        const testResult = await this.testResponseTimeOptimization();
        testDetails.push({
          test: 3,
          responseTime: testResult.responseTime,
          targetAchieved: testResult.targetAchieved,
          optimizations: ['response-time-optimization'],
        });

        if (testResult.success) successfulTests++;
        else failedTests++;
      }

      return {
        achievementRate:
          (successfulTests / (successfulTests + failedTests)) * 100,
        averageTime: this.calculateAverage(testDetails, 'responseTime'),
        successfulTests,
        failedTests,
        details: testDetails,
      };
    } catch (error) {
      console.error('자동 최적화 실행 중 오류:', error);
      return null;
    }
  }

  /**
   * 성능 알림 가져오기
   */
  public getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  /**
   * 알림 확인 처리
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * 성능 모니터링 시작
   */
  private startPerformanceMonitoring(): void {
    // 매 5분마다 성능 체크
    setInterval(
      () => {
        this.performHealthCheck();
      },
      5 * 60 * 1000
    );

    // 매시간마다 자동 최적화 검토
    setInterval(
      async () => {
        const summary = this.generateSummary('1h');
        if (this.shouldTriggerAutoOptimization(summary)) {
          await this.performAutoOptimization();
        }
      },
      60 * 60 * 1000
    );
  }

  /**
   * 임계값 체크 및 알림 생성
   */
  private checkThresholds(metric: PerformanceMetric): void {
    // 응답 시간 체크
    if (metric.responseTime > this.thresholds.responseTime) {
      this.createAlert(
        'warning',
        `응답 시간 임계값 초과: ${metric.responseTime}ms`,
        this.thresholds.responseTime,
        metric.responseTime
      );
    }

    // 메모리 사용량 체크
    if (metric.memoryUsage > this.thresholds.memoryUsage) {
      this.createAlert(
        'warning',
        `메모리 사용량 임계값 초과: ${metric.memoryUsage}MB`,
        this.thresholds.memoryUsage,
        metric.memoryUsage
      );
    }

    // 정확도 체크
    if (metric.accuracy < this.thresholds.accuracy) {
      this.createAlert(
        'error',
        `정확도 임계값 미달: ${(metric.accuracy * 100).toFixed(1)}%`,
        this.thresholds.accuracy * 100,
        metric.accuracy * 100
      );
    }
  }

  /**
   * 알림 생성
   */
  private createAlert(
    type: 'warning' | 'error' | 'info',
    message: string,
    threshold: number,
    currentValue: number
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      threshold,
      currentValue,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // 최대 1000개 알림 유지
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    this.eventEmitter.emit('alertCreated', alert);
  }

  // 헬퍼 메소드들
  private getCutoffTime(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private calculateAverage(
    metrics: PerformanceMetric[],
    field: keyof PerformanceMetric
  ): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => {
      const value = metric[field];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    return sum / metrics.length;
  }

  private getRecentMetrics(count: number): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  private groupMetricsByHour(
    metrics: PerformanceMetric[]
  ): Map<string, PerformanceMetric[]> {
    const groups = new Map<string, PerformanceMetric[]>();

    metrics.forEach((metric) => {
      const hour = new Date(metric.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!groups.has(hourKey)) {
        groups.set(hourKey, []);
      }
      groups.get(hourKey).push(metric);
    });

    return groups;
  }

  private getTopOptimizations(): string[] {
    // 최근 성공한 최적화들을 반환 (모킹)
    return ['캐시 히트율 개선', '메모리 사용량 최적화', '병렬 처리 개선'];
  }

  private getTopBottlenecks(): string[] {
    // 주요 병목 지점들을 반환 (모킹)
    return ['AI 모델 로딩 시간', '데이터베이스 쿼리 지연', 'API 응답 시간'];
  }

  private shouldTriggerAutoOptimization(summary: PerformanceSummary): boolean {
    return (
      summary.avgResponseTime > this.thresholds.responseTime ||
      summary.cacheHitRate < 70 ||
      summary.peakMemoryUsage > this.thresholds.memoryUsage
    );
  }

  private performHealthCheck(): void {
    // 시스템 헬스 체크 로직
    const recentMetrics = this.getRecentMetrics(50);
    if (recentMetrics.length > 0) {
      const avgResponseTime = this.calculateAverage(
        recentMetrics,
        'responseTime'
      );

      if (avgResponseTime > this.thresholds.responseTime * 1.5) {
        this.createAlert(
          'error',
          `시스템 성능 저하 감지: 평균 응답 시간 ${Math.round(avgResponseTime)}ms`,
          this.thresholds.responseTime,
          avgResponseTime
        );
      }
    }
  }

  // 최적화 테스트 메소드들
  private async testCacheOptimization(): Promise<{
    success: boolean;
    responseTime: number;
    targetAchieved: boolean;
  }> {
    // 캐시 최적화 테스트 (모킹)
    const responseTime = Math.random() * 1000 + 500;
    return {
      success: responseTime < this.thresholds.responseTime,
      responseTime,
      targetAchieved: responseTime < this.thresholds.responseTime,
    };
  }

  private async testMemoryOptimization(): Promise<{
    success: boolean;
    responseTime: number;
    targetAchieved: boolean;
  }> {
    // 메모리 최적화 테스트 (모킹)
    const responseTime = Math.random() * 800 + 400;
    return {
      success: responseTime < this.thresholds.responseTime,
      responseTime,
      targetAchieved: responseTime < this.thresholds.responseTime,
    };
  }

  private async testResponseTimeOptimization(): Promise<{
    success: boolean;
    responseTime: number;
    targetAchieved: boolean;
  }> {
    // 응답 시간 최적화 테스트 (모킹)
    const responseTime = Math.random() * 600 + 300;
    return {
      success: responseTime < this.thresholds.responseTime,
      responseTime,
      targetAchieved: responseTime < this.thresholds.responseTime,
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  public on(
    event: 'metricRecorded' | 'alertCreated',
    listener: (...args: any[]) => void
  ): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  public off(
    event: 'metricRecorded' | 'alertCreated',
    listener: (...args: any[]) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }
}
