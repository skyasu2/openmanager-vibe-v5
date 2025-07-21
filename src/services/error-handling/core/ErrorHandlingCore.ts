/**
 * 🎯 Error Handling Core
 *
 * 에러 처리 시스템의 핵심 로직
 * - 기본 에러 처리
 * - 핸들러 등록/해제
 * - 에러 히스토리 관리
 * - 심각한 에러 감지
 */

import { ILogger } from '@/interfaces/services';
import {
  ServiceError,
  IErrorHandler,
  ErrorHandlerFunction,
  ErrorHandlingConfig,
} from '../types/ErrorTypes';

export class ErrorHandlingCore implements IErrorHandler {
  private errorHistory: ServiceError[] = [];
  private errorHandlers = new Map<string, ErrorHandlerFunction>();
  private logger?: ILogger;
  private config: ErrorHandlingConfig;

  constructor(config: ErrorHandlingConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  /**
   * 에러 처리 - 핵심 메서드
   */
  handle(error: ServiceError): void {
    try {
      // 에러 히스토리에 추가
      this.addToHistory(error);

      // 로깅
      if (this.config.enableLogging && this.logger) {
        this.logError(error);
      }

      // 등록된 핸들러 실행
      this.executeHandlers(error);

      // 심각한 에러의 경우 추가 처리
      if (this.isCriticalError(error)) {
        this.handleCriticalError(error);
      }
    } catch (handlerError) {
      console.error('에러 핸들링 실패:', handlerError);
    }
  }

  /**
   * 에러 핸들러 등록
   */
  register(errorType: string, handler: ErrorHandlerFunction): void {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * 에러 핸들러 제거
   */
  unregister(errorType: string): void {
    this.errorHandlers.delete(errorType);
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(limit?: number): ServiceError[] {
    const history = [...this.errorHistory].reverse(); // 최신 순
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 에러 히스토리 초기화
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 에러를 히스토리에 추가
   */
  private addToHistory(error: ServiceError): void {
    this.errorHistory.push({
      ...error,
      timestamp: error.timestamp || new Date(),
    });

    // 최대 크기 제한
    if (this.errorHistory.length > this.config.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * 에러 로깅
   */
  private logError(error: ServiceError): void {
    if (!this.logger) return;

    const logData = {
      code: error.code,
      service: error.service,
      context: error.context,
      severity: error.severity,
      timestamp: error.timestamp,
    };

    switch (error.severity) {
      case 'critical':
        this.logger.error(
          `CRITICAL [${error.service}]: ${error.message}`,
          error,
          logData
        );
        break;
      case 'high':
        this.logger.error(
          `HIGH [${error.service}]: ${error.message}`,
          error,
          logData
        );
        break;
      case 'medium':
        this.logger.warn(
          `MEDIUM [${error.service}]: ${error.message}`,
          logData
        );
        break;
      case 'low':
        this.logger.info(`LOW [${error.service}]: ${error.message}`, logData);
        break;
      default:
        this.logger.error(
          `[${error.service}]: ${error.message}`,
          error,
          logData
        );
    }
  }

  /**
   * 핸들러 실행
   */
  private executeHandlers(error: ServiceError): void {
    // 특정 에러 코드 핸들러 찾기
    const specificHandler = this.errorHandlers.get(error.code);
    if (specificHandler) {
      this.executeHandler(specificHandler, error);
      return;
    }

    // 기본 핸들러 실행
    const defaultHandler = this.errorHandlers.get('default');
    if (defaultHandler) {
      this.executeHandler(defaultHandler, error);
    }
  }

  /**
   * 개별 핸들러 실행
   */
  private executeHandler(
    handler: ErrorHandlerFunction,
    error: ServiceError
  ): void {
    try {
      const result = handler(error);

      // Promise 처리
      if (result instanceof Promise) {
        result.catch(handlerError => {
          console.error(`에러 핸들러 실행 실패 [${error.code}]:`, handlerError);
        });
      }
    } catch (handlerError) {
      console.error(`에러 핸들러 실행 실패 [${error.code}]:`, handlerError);
    }
  }

  /**
   * 심각한 에러 여부 판단
   */
  private isCriticalError(error: ServiceError): boolean {
    // 심각도 기반 판단
    if (error.severity === 'critical') {
      return true;
    }

    // 특정 에러 코드 기반 판단
    const criticalErrorCodes = [
      'SYSTEM_FAILURE',
      'SECURITY_BREACH',
      'MEMORY_EXHAUSTED',
      'DISK_FULL',
      'DATABASE_CONNECTION_LOST',
    ];

    return criticalErrorCodes.includes(error.code);
  }

  /**
   * 심각한 에러 처리
   */
  private handleCriticalError(error: ServiceError): void {
    console.error('🚨 심각한 에러 감지:', error);

    // 모니터링 시스템 알림
    if (this.config.enableMonitoring) {
      this.notifyMonitoringSystem(error);
    }

    // 추가 로깅
    if (this.logger) {
      this.logger.error('CRITICAL ERROR DETECTED', error, {
        action: 'immediate_attention_required',
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        service: error.service,
      });
    }
  }

  /**
   * 모니터링 시스템 알림
   */
  private notifyMonitoringSystem(error: ServiceError): void {
    // 실제 환경에서는 AlertManager, PagerDuty 등으로 알림
    try {
      // 메트릭 전송 (Prometheus 등)
      if (typeof window === 'undefined') {
        // 서버 환경에서만 실행
        console.log('📊 모니터링 시스템에 알림 전송:', {
          errorCode: error.code,
          service: error.service,
          severity: error.severity,
          timestamp: error.timestamp,
        });
      }
    } catch (notificationError) {
      console.error('모니터링 시스템 알림 실패:', notificationError);
    }
  }

  /**
   * 현재 등록된 핸들러 목록 조회
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.errorHandlers.keys());
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.logger) {
      this.logger = newConfig.logger;
    }
  }
}
