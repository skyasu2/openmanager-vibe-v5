/**
 * 📊 에러 통계 관리
 */

import type {
  ErrorStatistics as ErrorStatsInterface,
  ServiceError,
} from '../types/ErrorTypes';
import { ErrorSeverity, getErrorSeverity } from '../types/ErrorTypes';

export class ErrorStatistics {
  private errorHistory: ServiceError[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 500) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 에러를 히스토리에 추가
   */
  addError(error: ServiceError): void {
    this.errorHistory.unshift(error);

    // 히스토리 크기 제한
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(limit?: number): ServiceError[] {
    const history = [...this.errorHistory];
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 에러 히스토리 초기화
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 에러 통계 조회
   */
  getStatistics(): ErrorStatsInterface {
    const total = this.errorHistory.length;

    // 서비스별 에러 수
    const byService: Record<string, number> = {};
    this.errorHistory.forEach((error) => {
      byService[error.service] = (byService[error.service] || 0) + 1;
    });

    // 에러 코드별 에러 수
    const byCode: Record<string, number> = {};
    this.errorHistory.forEach((error) => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    // 최근 심각한 에러들 (최근 1시간)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCritical = this.errorHistory.filter((error) => {
      const severity = getErrorSeverity(error);
      const errorTimestamp = error.timestamp || new Date();
      return (
        errorTimestamp > oneHourAgo &&
        (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH)
      );
    });

    // 에러율 계산 (최근 5분간)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentErrors = this.errorHistory.filter((error) => {
      const errorTimestamp = error.timestamp || new Date();
      return errorTimestamp > fiveMinutesAgo;
    });
    const errorRate = (recentErrors.length / 300) * 100; // 5분 = 300초

    return {
      total,
      byService,
      byCode,
      recentCritical,
      errorRate: Math.round(errorRate * 100) / 100, // 소수점 2자리
    };
  }

  /**
   * 서비스별 에러 통계
   */
  getServiceStatistics(service: string): {
    total: number;
    recent: number;
    codes: Record<string, number>;
    severity: Record<ErrorSeverity, number>;
  } {
    const serviceErrors = this.errorHistory.filter(
      (error) => error.service === service
    );

    // 최근 1시간 에러
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = serviceErrors.filter((error) => {
      const errorTimestamp = error.timestamp || new Date();
      return errorTimestamp > oneHourAgo;
    });

    // 에러 코드별 통계
    const codes: Record<string, number> = {};
    serviceErrors.forEach((error) => {
      codes[error.code] = (codes[error.code] || 0) + 1;
    });

    // 심각도별 통계
    const severity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    serviceErrors.forEach((error) => {
      const errorSeverity = getErrorSeverity(error);
      severity[errorSeverity]++;
    });

    return {
      total: serviceErrors.length,
      recent: recentErrors.length,
      codes,
      severity,
    };
  }

  /**
   * 에러 트렌드 분석
   */
  getErrorTrend(timeWindow: number = 24): Array<{
    hour: string;
    total: number;
    critical: number;
    high: number;
  }> {
    const trend: Array<{
      hour: string;
      total: number;
      critical: number;
      high: number;
    }> = [];
    const now = new Date();

    for (let i = 0; i < timeWindow; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(
        hour.getFullYear(),
        hour.getMonth(),
        hour.getDate(),
        hour.getHours()
      );
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourErrors = this.errorHistory.filter((error) => {
        const errorTimestamp = error.timestamp || new Date();
        return errorTimestamp >= hourStart && errorTimestamp < hourEnd;
      });

      const criticalCount = hourErrors.filter(
        (error) => getErrorSeverity(error) === ErrorSeverity.CRITICAL
      ).length;

      const highCount = hourErrors.filter(
        (error) => getErrorSeverity(error) === ErrorSeverity.HIGH
      ).length;

      trend.unshift({
        hour: hourStart.toISOString().slice(0, 13) + ':00',
        total: hourErrors.length,
        critical: criticalCount,
        high: highCount,
      });
    }

    return trend;
  }

  /**
   * 가장 빈번한 에러 조회
   */
  getMostFrequentErrors(limit = 10): Array<{
    code: string;
    service: string;
    count: number;
    lastOccurrence: Date;
    severity: ErrorSeverity;
  }> {
    const errorFrequency = new Map<
      string,
      {
        code: string;
        service: string;
        count: number;
        lastOccurrence: Date;
        severity: ErrorSeverity;
      }
    >();

    this.errorHistory.forEach((error) => {
      const key = `${error.service}:${error.code}`;
      const existing = errorFrequency.get(key);
      const errorTimestamp = error.timestamp || new Date();

      if (existing) {
        existing.count++;
        if (errorTimestamp > existing.lastOccurrence) {
          existing.lastOccurrence = errorTimestamp;
        }
      } else {
        errorFrequency.set(key, {
          code: error.code,
          service: error.service,
          count: 1,
          lastOccurrence: errorTimestamp,
          severity: getErrorSeverity(error),
        });
      }
    });

    return Array.from(errorFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 심각한 에러 패턴 탐지
   */
  detectCriticalPatterns(): Array<{
    pattern: string;
    description: string;
    severity: 'warning' | 'critical';
    affectedServices: string[];
  }> {
    const patterns: Array<{
      pattern: string;
      description: string;
      severity: 'warning' | 'critical';
      affectedServices: string[];
    }> = [];

    const recentErrors = this.getRecentErrors(15); // 최근 15분

    // 1. 동일한 에러의 급증 패턴
    const errorFreq = new Map<
      string,
      { count: number; services: Set<string> }
    >();
    recentErrors.forEach((error) => {
      const key = error.code;
      const existing = errorFreq.get(key);
      if (existing) {
        existing.count++;
        existing.services.add(error.service);
      } else {
        errorFreq.set(key, { count: 1, services: new Set([error.service]) });
      }
    });

    errorFreq.forEach((freq, code) => {
      if (freq.count > 10) {
        // 15분에 10회 이상
        patterns.push({
          pattern: 'error_spike',
          description: `에러 ${code}가 15분간 ${freq.count}회 발생`,
          severity: freq.count > 20 ? 'critical' : 'warning',
          affectedServices: Array.from(freq.services),
        });
      }
    });

    // 2. 연쇄 실패 패턴
    const serviceFailures = new Map<string, number>();
    recentErrors.forEach((error) => {
      const severity = getErrorSeverity(error);
      if (
        severity === ErrorSeverity.CRITICAL ||
        severity === ErrorSeverity.HIGH
      ) {
        serviceFailures.set(
          error.service,
          (serviceFailures.get(error.service) || 0) + 1
        );
      }
    });

    const failedServices = Array.from(serviceFailures.entries())
      .filter(([, count]) => count > 3)
      .map(([service]) => service);

    if (failedServices.length > 2) {
      patterns.push({
        pattern: 'cascade_failure',
        description: `다중 서비스 연쇄 실패 감지: ${failedServices.join(', ')}`,
        severity: 'critical',
        affectedServices: failedServices,
      });
    }

    return patterns;
  }

  /**
   * 최근 에러 조회
   */
  private getRecentErrors(minutes: number): ServiceError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter((error) => {
      const errorTimestamp = error.timestamp || new Date();
      return errorTimestamp > cutoff;
    });
  }
}
