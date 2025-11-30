/**
 * 🎯 Unified Error Handling Service
 *
 * 모듈화된 에러 처리 시스템의 통합 인터페이스
 * - 모든 에러 처리 모듈 통합
 * - 단일 진입점 제공
 * - 의존성 주입 및 설정 관리
 * - 기존 API 호환성 유지
 */

import type { ILogger } from '@/interfaces/services';
import type { ErrorContext } from '@/types/ai-service-types';
import { ErrorHandlingCore } from './core/ErrorHandlingCore';
import { DefaultErrorHandlers } from './handlers/DefaultErrorHandlers';
import { ErrorMonitoringService } from './monitoring/ErrorMonitoringService';
import { RecoveryService } from './recovery/RecoveryService';
import type {
  ErrorHandlingConfig,
  ErrorStats,
  IErrorHandler,
  ServiceError,
} from './types/ErrorTypes';
import { createServiceError as createServiceErrorUtil } from './types/ErrorTypes';

export class ErrorHandlingService implements IErrorHandler {
  private core: ErrorHandlingCore;
  private recoveryService: RecoveryService;
  private monitoringService: ErrorMonitoringService;
  private config: ErrorHandlingConfig;
  private defaultHandlers: DefaultErrorHandlers;

  constructor(logger?: ILogger) {
    // 기본 설정
    this.config = {
      maxHistorySize: 500,
      enableLogging: true,
      enableMonitoring: true,
      enableRecovery: true,
      criticalThreshold: 5,
      defaultTimeout: 10000,
      logger,
    };

    // 모듈 초기화
    this.core = new ErrorHandlingCore(this.config);
    this.recoveryService = new RecoveryService(this.config);
    this.monitoringService = new ErrorMonitoringService(this.config);

    // 기본 핸들러 설정
    this.defaultHandlers = new DefaultErrorHandlers(this.core);

    // 복구 서비스와 모니터링 연동
    this.setupIntegrations();
  }

  /**
   * 에러 처리 - 메인 인터페이스
   */
  handle(error: ServiceError): void {
    try {
      // 모니터링 기록
      this.monitoringService.recordError(error);

      // 핵심 에러 처리
      this.core.handle(error);

      // 복구 시도 (비동기)
      if (this.config.enableRecovery && error.recoverable !== false) {
        void this.attemptRecoveryAsync(error);
      }
    } catch (handlingError) {
      console.error('통합 에러 처리 실패:', handlingError);
    }
  }

  /**
   * 에러 핸들러 등록
   */
  register(errorType: string, handler: (error: ServiceError) => void): void {
    this.core.register(errorType, handler);
  }

  /**
   * 에러 핸들러 제거
   */
  unregister(errorType: string): void {
    this.core.unregister(errorType);
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(limit?: number): ServiceError[] {
    return this.core.getErrorHistory(limit);
  }

  /**
   * 에러 히스토리 초기화
   */
  clearErrorHistory(): void {
    this.core.clearErrorHistory();
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats(): ErrorStats {
    return this.monitoringService.getErrorStats();
  }

  /**
   * 복구 시도 (기존 API 호환성)
   */
  async attemptRecovery(error: ServiceError): Promise<boolean> {
    const result = await this.recoveryService.attemptRecovery(error);

    if (result.success) {
      this.monitoringService.recordRecovery(error, result.attempts);
    }

    return result.success;
  }

  /**
   * 상세 모니터링 리포트
   */
  getMonitoringReport() {
    return this.monitoringService.generateMonitoringReport();
  }

  /**
   * 실시간 알림 확인
   */
  checkAlerts() {
    return this.monitoringService.checkForAlerts();
  }

  /**
   * Prometheus 메트릭 내보내기
   */
  exportMetrics(): string {
    return this.monitoringService.exportMetrics();
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.core.updateConfig(this.config);
  }

  /**
   * 시스템 상태 확인
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    details: {
      totalErrors: number;
      errorRate: number;
      criticalErrors: number;
      recoverySuccessRate: number;
    };
    alerts: Array<{ type: string; message: string }>;
  } {
    const stats = this.getErrorStats();
    const report = this.getMonitoringReport();
    const alerts = this.checkAlerts();

    return {
      status: report.health.overallHealth,
      details: {
        totalErrors: stats.total,
        errorRate: stats.errorRate,
        criticalErrors: report.health.criticalErrorsLast24h,
        recoverySuccessRate: report.health.recoverySuccessRate,
      },
      alerts: alerts.map((alert) => ({
        type: alert.type,
        message: alert.message,
      })),
    };
  }

  /**
   * 비동기 복구 시도
   */
  private async attemptRecoveryAsync(error: ServiceError): Promise<void> {
    try {
      const result = await this.recoveryService.attemptRecovery(error);

      if (result.success) {
        this.monitoringService.recordRecovery(error, result.attempts);
        console.log(`✅ 복구 성공: ${error.code}`);
      } else if (result.fallbackUrl) {
        this.monitoringService.recordFallback(error, result.fallbackUrl);
        console.log(`🔄 폴백 활성화: ${error.code} -> ${result.fallbackUrl}`);
      }
    } catch (recoveryError) {
      console.error('비동기 복구 실패:', recoveryError);
    }
  }

  /**
   * 모듈 간 통합 설정
   */
  private setupIntegrations(): void {
    // 복구 성공 시 모니터링 기록을 위한 이벤트 연동
    // 실제 구현에서는 EventEmitter 또는 Observer 패턴 사용 가능

    console.log('🔗 에러 처리 모듈 통합 완료');
  }

  /**
   * 전체 시스템 초기화
   */
  reset(): void {
    this.core.clearErrorHistory();
    this.monitoringService.reset();
    this.recoveryService.resetRecoveryState();
    console.log('🔄 에러 처리 시스템 초기화 완료');
  }
}

// 기존 API 호환성을 위한 팩토리 함수
export function createServiceError(
  code: string,
  message: string,
  service: string,
  context?: ErrorContext,
  cause?: Error
): ServiceError {
  return createServiceErrorUtil(code, message, service, context, cause);
}

// 기본 인스턴스 (싱글톤 패턴)
let defaultInstance: ErrorHandlingService | null = null;

export function getErrorHandlingService(
  logger?: ILogger
): ErrorHandlingService {
  if (!defaultInstance) {
    defaultInstance = new ErrorHandlingService(logger);
  }
  return defaultInstance;
}

// 기존 코드와의 호환성을 위한 export
export { ErrorHandlingService as default };
export type {
  ErrorStats,
  IErrorHandler,
  ServiceError,
} from './types/ErrorTypes';
