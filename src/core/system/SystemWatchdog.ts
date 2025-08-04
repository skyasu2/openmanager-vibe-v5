/**
 * 🐕 시스템 Watchdog
 *
 * 시스템 안정성 모니터링 및 자동 복구:
 * - 메모리 누수 감지
 * - 성능 메트릭스 수집
 * - 자동 안정성 분석
 * - 위험 상황 조기 경고
 */

import { systemLogger } from '../../lib/logger';

export interface SystemMetrics {
  cpu: Array<{ timestamp: number; value: number }>;
  memory: Array<{ timestamp: number; value: number }>;
  errorRate: number;
  restartCount: number;
  performanceScore: number;
  stabilityScore: number;
}

export interface WatchdogAlerts {
  memoryLeak: boolean;
  highErrorRate: boolean;
  performanceDegradation: boolean;
  frequentRestarts: boolean;
}

export class SystemWatchdog {
  private processManager: any; // ProcessManager 타입 (순환 참조 방지)
  private metrics: SystemMetrics = {
    cpu: [],
    memory: [],
    errorRate: 0,
    restartCount: 0,
    performanceScore: 100,
    stabilityScore: 100,
  };
  private monitoringInterval?: NodeJS.Timeout;
  private alertsHistory: Array<{
    timestamp: Date;
    type: string;
    message: string;
  }> = [];
  private readonly maxHistoryLength = 100;
  private readonly monitoringIntervalMs = 30000; // 30초 (과도한 헬스체크 방지)
  private readonly maxDataPoints = 30; // 5분간 데이터 (30 * 10초)

  constructor(processManager: any) {
    this.processManager = processManager;
  }

  /**
   * Watchdog 시작
   */
  start(): void {
    if (this.monitoringInterval) {
      this.stop();
    }

    systemLogger.system('🐕 시스템 Watchdog 활성화');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeStability();
      this.checkAlerts();
    }, this.monitoringIntervalMs);

    // 초기 메트릭스 수집
    this.collectMetrics();
  }

  /**
   * Watchdog 중지
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      systemLogger.system('🐕 시스템 Watchdog 비활성화');
    }
  }

  /**
   * 시스템 메트릭스 수집
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    try {
      // 메모리 사용량 수집
      const memoryUsage = process.memoryUsage();
      const memoryMB = memoryUsage.heapUsed / 1024 / 1024;

      this.metrics.memory.push({
        timestamp,
        value: memoryMB,
      });

      // CPU 사용량 추정 (Node.js에서는 정확한 CPU 사용량 측정이 어려우므로 대안 사용)
      const cpuEstimate = await this.estimateCPUUsage();
      this.metrics.cpu.push({
        timestamp,
        value: cpuEstimate,
      });

      // 오래된 데이터 정리 (최근 5분만 유지)
      const cutoffTime = timestamp - 5 * 60 * 1000; // 5분 전
      this.metrics.memory = this.metrics.memory.filter(
        m => m.timestamp > cutoffTime
      );
      this.metrics.cpu = this.metrics.cpu.filter(c => c.timestamp > cutoffTime);

      // 시스템 상태에서 오류율 및 재시작 횟수 업데이트
      if (this.processManager?.getSystemStatus) {
        const systemStatus = this.processManager.getSystemStatus();
        const totalRestarts = systemStatus.metrics?.totalRestarts || 0;

        this.metrics.restartCount = totalRestarts;
        this.metrics.errorRate = this.calculateErrorRate(systemStatus);
      }
    } catch (error) {
      systemLogger.warn('메트릭스 수집 실패:', error);
    }
  }

  /**
   * CPU 사용량 추정
   */
  private async estimateCPUUsage(): Promise<number> {
    const startTime = process.hrtime.bigint();
    const startUsage = process.cpuUsage();

    // 짧은 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = process.hrtime.bigint();
    const endUsage = process.cpuUsage(startUsage);

    const elapsedTime = Number(endTime - startTime) / 1000000; // ms로 변환
    const totalCPUTime = (endUsage.user + endUsage.system) / 1000; // ms로 변환

    const cpuPercent = Math.min(100, (totalCPUTime / elapsedTime) * 100);
    return Math.max(0, cpuPercent);
  }

  /**
   * 오류율 계산
   */
  private calculateErrorRate(systemStatus: unknown): number {
    const status = systemStatus as any;
    if (!status.processes || !Array.isArray(status.processes) || status.processes.length === 0) {
      return 0;
    }

    const totalProcesses = status.processes.length;
    const errorProcesses = status.processes.filter(
      (p: any) => p.status === 'error' || p.healthScore < 50
    ).length;

    return (errorProcesses / totalProcesses) * 100;
  }

  /**
   * 안정성 분석
   */
  private analyzeStability(): void {
    this.metrics.performanceScore = this.calculatePerformanceScore();
    this.metrics.stabilityScore = this.calculateStabilityScore();

    // 성능 저하 감지
    if (this.metrics.performanceScore < 60) {
      this.addAlert(
        'performance',
        `시스템 성능 저하 감지 (${this.metrics.performanceScore.toFixed(1)}%)`
      );
    }

    // 안정성 문제 감지
    if (this.metrics.stabilityScore < 70) {
      this.addAlert(
        'stability',
        `시스템 안정성 문제 감지 (${this.metrics.stabilityScore.toFixed(1)}%)`
      );
    }
  }

  /**
   * 성능 점수 계산
   */
  private calculatePerformanceScore(): number {
    let score = 100;

    // 메모리 사용량 기반 점수 (최근 평균)
    if (this.metrics.memory.length > 0) {
      const avgMemory =
        this.metrics.memory.reduce((sum, m) => sum + m.value, 0) /
        this.metrics.memory.length;
      if (avgMemory > 500) score -= 20; // 500MB 이상
      if (avgMemory > 1000) score -= 30; // 1GB 이상
    }

    // CPU 사용량 기반 점수
    if (this.metrics.cpu.length > 0) {
      const avgCPU =
        this.metrics.cpu.reduce((sum, c) => sum + c.value, 0) /
        this.metrics.cpu.length;
      if (avgCPU > 70) score -= 15;
      if (avgCPU > 90) score -= 25;
    }

    // 오류율 기반 점수
    if (this.metrics.errorRate > 10) score -= 20;
    if (this.metrics.errorRate > 25) score -= 30;

    return Math.max(0, score);
  }

  /**
   * 안정성 점수 계산
   */
  private calculateStabilityScore(): number {
    let score = 100;

    // 재시작 횟수 기반 점수
    if (this.metrics.restartCount > 3) score -= 20;
    if (this.metrics.restartCount > 10) score -= 40;

    // 메모리 누수 감지
    if (this.detectMemoryLeak()) {
      score -= 30;
    }

    // 최근 알람 횟수
    const recentAlerts = this.getRecentAlerts(10 * 60 * 1000); // 10분 이내
    if (recentAlerts.length > 5) score -= 25;

    return Math.max(0, score);
  }

  /**
   * 알림 확인
   */
  private checkAlerts(): void {
    const alerts = this.getCurrentAlerts();

    // 메모리 누수 알림
    if (alerts.memoryLeak) {
      this.addAlert('memory-leak', '메모리 누수 패턴 감지됨');
      this.processManager?.emit('system:memory-leak-detected');
    }

    // 높은 오류율 알림
    if (alerts.highErrorRate) {
      this.addAlert(
        'high-error-rate',
        `높은 오류율 감지 (${this.metrics.errorRate.toFixed(1)}%)`
      );
      this.processManager?.emit('system:high-error-rate', {
        errorRate: this.metrics.errorRate,
      });
    }

    // 성능 저하 알림
    if (alerts.performanceDegradation) {
      this.addAlert('performance-degradation', '시스템 성능 저하 감지');
      this.processManager?.emit('system:performance-degradation', {
        score: this.metrics.performanceScore,
      });
    }

    // 빈번한 재시작 알림
    if (alerts.frequentRestarts) {
      this.addAlert(
        'frequent-restarts',
        `빈번한 프로세스 재시작 감지 (${this.metrics.restartCount}회)`
      );
      this.processManager?.emit('system:frequent-restarts', {
        count: this.metrics.restartCount,
      });
    }
  }

  /**
   * 현재 알림 상태 확인
   */
  private getCurrentAlerts(): WatchdogAlerts {
    return {
      memoryLeak: this.detectMemoryLeak(),
      highErrorRate: this.metrics.errorRate > 15, // 15% 이상
      performanceDegradation: this.metrics.performanceScore < 70,
      frequentRestarts: this.metrics.restartCount > 5,
    };
  }

  /**
   * 메모리 누수 감지
   */
  private detectMemoryLeak(): boolean {
    if (this.metrics.memory.length < 10) return false;

    // 선형 회귀로 메모리 증가 추세 분석
    const trend = this.calculateTrend(this.metrics.memory);

    // 분당 2MB 이상 증가하면 누수로 판단
    const leakThreshold = 2; // MB/분
    const memoryIncreasePerMinute = trend.slope * 60; // 초당 → 분당 변환

    return memoryIncreasePerMinute > leakThreshold;
  }

  /**
   * 추세 계산 (선형 회귀)
   */
  private calculateTrend(data: Array<{ timestamp: number; value: number }>): {
    slope: number;
    intercept: number;
    correlation: number;
  } {
    if (data.length < 2) return { slope: 0, intercept: 0, correlation: 0 };

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.timestamp, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d) => sum + d.timestamp * d.value, 0);
    const sumXX = data.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);
    const sumYY = data.reduce((sum, d) => sum + d.value * d.value, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const correlation =
      (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return {
      slope: slope / 1000, // timestamp를 초 단위로 변환 (ms → s)
      intercept,
      correlation: isNaN(correlation) ? 0 : correlation,
    };
  }

  /**
   * 알림 추가
   */
  private addAlert(type: string, message: string): void {
    // 중복 알림 방지 (최근 5분 내 동일한 타입의 알림 확인)
    const recentSimilar = this.alertsHistory.filter(
      alert =>
        alert.type === type &&
        Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000
    );

    if (recentSimilar.length > 0) return;

    const alert = {
      timestamp: new Date(),
      type,
      message,
    };

    this.alertsHistory.push(alert);
    systemLogger.warn(`🚨 Watchdog 알림 [${type}]: ${message}`);

    // 히스토리 크기 제한
    if (this.alertsHistory.length > this.maxHistoryLength) {
      this.alertsHistory = this.alertsHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * 최근 알림 조회
   */
  private getRecentAlerts(
    timeWindowMs: number
  ): Array<{ timestamp: Date; type: string; message: string }> {
    const cutoffTime = Date.now() - timeWindowMs;
    return this.alertsHistory.filter(
      alert => alert.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * 메트릭스 조회
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * 알림 히스토리 조회
   */
  getAlertsHistory(): Array<{
    timestamp: Date;
    type: string;
    message: string;
  }> {
    return [...this.alertsHistory];
  }

  /**
   * 시스템 건강 상태 종합 평가
   */
  getHealthSummary(): {
    overall: 'healthy' | 'warning' | 'critical';
    performance: number;
    stability: number;
    alerts: WatchdogAlerts;
    recommendations: string[];
  } {
    const alerts = this.getCurrentAlerts();
    const recommendations: string[] = [];

    // 전체 건강 상태 결정
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (
      this.metrics.performanceScore < 70 ||
      this.metrics.stabilityScore < 70
    ) {
      overall = 'warning';
    }

    if (
      this.metrics.performanceScore < 50 ||
      this.metrics.stabilityScore < 50
    ) {
      overall = 'critical';
    }

    // 권장사항 생성
    if (alerts.memoryLeak) {
      recommendations.push('메모리 사용량 최적화 필요');
    }

    if (alerts.highErrorRate) {
      recommendations.push('오류 발생 원인 분석 및 수정 필요');
    }

    if (alerts.performanceDegradation) {
      recommendations.push('시스템 리소스 증설 검토');
    }

    if (alerts.frequentRestarts) {
      recommendations.push('프로세스 안정성 개선 필요');
    }

    if (recommendations.length === 0) {
      recommendations.push('시스템이 안정적으로 운영되고 있습니다');
    }

    return {
      overall,
      performance: this.metrics.performanceScore,
      stability: this.metrics.stabilityScore,
      alerts,
      recommendations,
    };
  }
}
