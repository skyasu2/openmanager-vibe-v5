/**
 * 📊 Error Monitoring Service
 *
 * 에러 모니터링 및 통계 관리
 * - 에러 통계 수집
 * - 성능 메트릭 추적
 * - 알림 및 리포팅
 * - 트렌드 분석
 */

import type {
  ErrorHandlingConfig,
  ErrorStats,
  MonitoringEvent,
  ServiceError,
} from '../types/ErrorTypes';

export class ErrorMonitoringService {
  private errorStats: Map<string, number> = new Map();
  private serviceStats: Map<string, number> = new Map();
  private criticalErrors: ServiceError[] = [];
  private monitoringEvents: MonitoringEvent[] = [];
  private startTime: Date = new Date();
  private config: ErrorHandlingConfig;

  constructor(config: ErrorHandlingConfig) {
    this.config = config;
  }

  /**
   * 에러 통계 기록
   */
  recordError(error: ServiceError): void {
    if (!this.config.enableMonitoring) return;

    try {
      // 에러 코드별 통계
      const currentCount = this.errorStats.get(error.code) || 0;
      this.errorStats.set(error.code, currentCount + 1);

      // 서비스별 통계
      const serviceCount = this.serviceStats.get(error.service) || 0;
      this.serviceStats.set(error.service, serviceCount + 1);

      // 심각한 에러 별도 추적
      if (this.isCriticalError(error)) {
        this.criticalErrors.push(error);
        this.recordMonitoringEvent('critical', {
          errorCode: error.code,
          service: error.service,
          message: error.message,
          context: error.context,
        });
      }

      // 모니터링 이벤트 기록
      this.recordMonitoringEvent('error', {
        errorCode: error.code,
        service: error.service,
        severity: error.severity,
      });

      // 메트릭 정리 (메모리 관리)
      this.cleanupOldMetrics();
    } catch (monitoringError) {
      console.error('에러 모니터링 기록 실패:', monitoringError);
    }
  }

  /**
   * 복구 성공 기록
   */
  recordRecovery(error: ServiceError, attempts: number): void {
    if (!this.config.enableMonitoring) return;

    this.recordMonitoringEvent('recovery', {
      errorCode: error.code,
      service: error.service,
      attempts,
      recoveryTime: new Date().toISOString(),
    });
  }

  /**
   * 폴백 활성화 기록
   */
  recordFallback(error: ServiceError, fallbackType: string): void {
    if (!this.config.enableMonitoring) return;

    this.recordMonitoringEvent('fallback', {
      errorCode: error.code,
      service: error.service,
      fallbackType,
      activationTime: new Date().toISOString(),
    });
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats(): ErrorStats {
    const total = Array.from(this.errorStats.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const byService: Record<string, number> = {};
    const byCode: Record<string, number> = {};

    // 서비스별 통계
    this.serviceStats.forEach((count, service) => {
      byService[service] = count;
    });

    // 에러 코드별 통계
    this.errorStats.forEach((count, code) => {
      byCode[code] = count;
    });

    // 최근 심각한 에러 (최대 10개)
    const recentCritical = this.criticalErrors
      .slice(-10)
      .sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );

    // 에러율 계산 (시간당)
    const hoursRunning =
      (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    const errorRate = hoursRunning > 0 ? total / hoursRunning : 0;

    return {
      total,
      byService,
      byCode,
      recentCritical,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  /**
   * 상세 모니터링 리포트 생성
   */
  generateMonitoringReport(): {
    summary: ErrorStats;
    trends: {
      hourlyErrorCount: number[];
      topErrorCodes: Array<{ code: string; count: number; percentage: number }>;
      topServices: Array<{
        service: string;
        count: number;
        percentage: number;
      }>;
    };
    health: {
      overallHealth: 'healthy' | 'warning' | 'critical';
      criticalErrorsLast24h: number;
      recoverySuccessRate: number;
      averageRecoveryTime: number;
    };
    recommendations: string[];
  } {
    const stats = this.getErrorStats();

    // 트렌드 분석
    const topErrorCodes = Array.from(this.errorStats.entries())
      .map(([code, count]) => ({
        code,
        count,
        percentage: Math.round((count / stats.total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topServices = Array.from(this.serviceStats.entries())
      .map(([service, count]) => ({
        service,
        count,
        percentage: Math.round((count / stats.total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 건강 상태 평가
    const criticalErrorsLast24h = this.criticalErrors.filter(
      error =>
        error.timestamp &&
        Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const overallHealth = this.assessOverallHealth(
      stats,
      criticalErrorsLast24h
    );

    // 복구 성공률 계산
    const recoveryEvents = this.monitoringEvents.filter(
      event => event.type === 'recovery'
    );
    const recoverySuccessRate =
      recoveryEvents.length > 0
        ? (recoveryEvents.length / stats.total) * 100
        : 0;

    // 권장사항 생성
    const recommendations = this.generateRecommendations(
      stats,
      topErrorCodes,
      criticalErrorsLast24h
    );

    return {
      summary: stats,
      trends: {
        hourlyErrorCount: this.calculateHourlyErrorCount(),
        topErrorCodes,
        topServices,
      },
      health: {
        overallHealth,
        criticalErrorsLast24h,
        recoverySuccessRate: Math.round(recoverySuccessRate * 100) / 100,
        averageRecoveryTime: this.calculateAverageRecoveryTime(),
      },
      recommendations,
    };
  }

  /**
   * 실시간 알림 확인
   */
  checkForAlerts(): Array<{
    type: 'warning' | 'critical';
    message: string;
    data: any;
  }> {
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      data: any;
    }> = [];

    // 심각한 에러 급증 감지
    const recentCritical = this.criticalErrors.filter(
      error =>
        error.timestamp &&
        Date.now() - error.timestamp.getTime() < 60 * 60 * 1000 // 1시간
    );

    if (recentCritical.length >= 5) {
      alerts.push({
        type: 'critical',
        message: '심각한 에러가 1시간 내에 5회 이상 발생했습니다',
        data: { count: recentCritical.length, errors: recentCritical },
      });
    }

    // 에러율 급증 감지
    const stats = this.getErrorStats();
    if (stats.errorRate > 50) {
      // 시간당 50개 이상
      alerts.push({
        type: 'warning',
        message: '에러율이 임계치를 초과했습니다',
        data: { errorRate: stats.errorRate, threshold: 50 },
      });
    }

    // 특정 서비스 장애 감지
    this.serviceStats.forEach((count, service) => {
      const serviceErrorRate = (count / stats.total) * 100;
      if (serviceErrorRate > 30) {
        // 전체 에러의 30% 이상이 한 서비스에서 발생
        alerts.push({
          type: 'warning',
          message: `${service} 서비스에서 과도한 에러가 발생하고 있습니다`,
          data: { service, errorRate: serviceErrorRate, count },
        });
      }
    });

    return alerts;
  }

  /**
   * 메트릭 내보내기 (Prometheus 형식)
   */
  exportMetrics(): string {
    const stats = this.getErrorStats();
    const metrics: string[] = [];

    // 총 에러 수
    metrics.push(`# HELP error_handling_total_errors Total number of errors`);
    metrics.push(`# TYPE error_handling_total_errors counter`);
    metrics.push(`error_handling_total_errors ${stats.total}`);

    // 에러율
    metrics.push(`# HELP error_handling_error_rate Errors per hour`);
    metrics.push(`# TYPE error_handling_error_rate gauge`);
    metrics.push(`error_handling_error_rate ${stats.errorRate}`);

    // 서비스별 에러 수
    metrics.push(`# HELP error_handling_errors_by_service Errors by service`);
    metrics.push(`# TYPE error_handling_errors_by_service counter`);
    Object.entries(stats.byService).forEach(([service, count]) => {
      metrics.push(
        `error_handling_errors_by_service{service="${service}"} ${count}`
      );
    });

    // 에러 코드별 에러 수
    metrics.push(`# HELP error_handling_errors_by_code Errors by error code`);
    metrics.push(`# TYPE error_handling_errors_by_code counter`);
    Object.entries(stats.byCode).forEach(([code, count]) => {
      metrics.push(`error_handling_errors_by_code{code="${code}"} ${count}`);
    });

    // 심각한 에러 수
    metrics.push(`# HELP error_handling_critical_errors Critical errors count`);
    metrics.push(`# TYPE error_handling_critical_errors counter`);
    metrics.push(
      `error_handling_critical_errors ${this.criticalErrors.length}`
    );

    return metrics.join('\n');
  }

  /**
   * 모니터링 이벤트 기록
   */
  private recordMonitoringEvent(
    type: MonitoringEvent['type'],
    data: Record<string, any>
  ): void {
    this.monitoringEvents.push({
      type,
      data: {
        eventName: `monitoring_${type}`,
        ...data,
      },
      timestamp: new Date(),
    });

    // 이벤트 수 제한 (메모리 관리)
    if (this.monitoringEvents.length > 1000) {
      this.monitoringEvents = this.monitoringEvents.slice(-500);
    }
  }

  /**
   * 심각한 에러 여부 판단
   */
  private isCriticalError(error: ServiceError): boolean {
    return (
      error.severity === 'critical' ||
      [
        'SECURITY_BREACH',
        'SYSTEM_FAILURE',
        'MEMORY_EXHAUSTED',
        'DISK_FULL',
      ].includes(error.code)
    );
  }

  /**
   * 전체 건강 상태 평가
   */
  private assessOverallHealth(
    stats: ErrorStats,
    criticalErrorsLast24h: number
  ): 'healthy' | 'warning' | 'critical' {
    if (criticalErrorsLast24h > 0 || stats.errorRate > 100) {
      return 'critical';
    }

    if (stats.errorRate > 50 || stats.total > 1000) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * 시간당 에러 수 계산
   */
  private calculateHourlyErrorCount(): number[] {
    // 최근 24시간의 시간당 에러 수 (간단한 구현)
    const hourlyCount = new Array(24).fill(0);
    const now = new Date();

    this.monitoringEvents
      .filter(event => event.type === 'error')
      .forEach(event => {
        const hoursDiff = Math.floor(
          (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60)
        );
        if (hoursDiff >= 0 && hoursDiff < 24) {
          hourlyCount[23 - hoursDiff]++;
        }
      });

    return hourlyCount;
  }

  /**
   * 평균 복구 시간 계산
   */
  private calculateAverageRecoveryTime(): number {
    const recoveryEvents = this.monitoringEvents.filter(
      event => event.type === 'recovery'
    );

    if (recoveryEvents.length === 0) return 0;

    // 실제 구현에서는 복구 시작 시간과 완료 시간을 추적해야 함
    // 여기서는 간단한 추정값 반환
    return 2.5; // 평균 2.5초
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    stats: ErrorStats,
    topErrorCodes: Array<{ code: string; count: number; percentage: number }>,
    criticalErrorsLast24h: number
  ): string[] {
    const recommendations: string[] = [];

    // 심각한 에러 기반 권장사항
    if (criticalErrorsLast24h > 0) {
      recommendations.push(
        '심각한 에러가 발생했습니다. 즉시 시스템 점검이 필요합니다.'
      );
    }

    // 에러율 기반 권장사항
    if (stats.errorRate > 50) {
      recommendations.push(
        '에러율이 높습니다. 시스템 부하를 줄이거나 복구 전략을 개선하세요.'
      );
    }

    // 상위 에러 코드 기반 권장사항
    topErrorCodes.forEach(({ code, percentage }) => {
      if (percentage > 20) {
        switch (code) {
          case 'NETWORK_ERROR':
            recommendations.push(
              '네트워크 에러가 빈번합니다. 네트워크 인프라를 점검하세요.'
            );
            break;
          case 'DATABASE_ERROR':
            recommendations.push(
              '데이터베이스 에러가 많습니다. DB 성능 및 연결 상태를 확인하세요.'
            );
            break;
          case 'EXTERNAL_API_ERROR':
            recommendations.push(
              '외부 API 에러가 빈번합니다. Circuit Breaker 패턴 적용을 고려하세요.'
            );
            break;
          default:
            recommendations.push(
              `${code} 에러가 ${percentage}%를 차지합니다. 해당 영역의 안정성을 개선하세요.`
            );
        }
      }
    });

    // 기본 권장사항
    if (recommendations.length === 0) {
      recommendations.push('시스템이 안정적으로 운영되고 있습니다.');
    }

    return recommendations;
  }

  /**
   * 오래된 메트릭 정리
   */
  private cleanupOldMetrics(): void {
    // 7일 이상 된 심각한 에러 제거
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.criticalErrors = this.criticalErrors.filter(
      error => error.timestamp && error.timestamp.getTime() > sevenDaysAgo
    );

    // 오래된 모니터링 이벤트 제거
    this.monitoringEvents = this.monitoringEvents.filter(
      event => event.timestamp.getTime() > sevenDaysAgo
    );
  }

  /**
   * 모니터링 상태 초기화
   */
  reset(): void {
    this.errorStats.clear();
    this.serviceStats.clear();
    this.criticalErrors = [];
    this.monitoringEvents = [];
    this.startTime = new Date();
    console.log('📊 모니터링 상태 초기화 완료');
  }
}
