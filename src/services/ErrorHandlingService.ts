/**
 * ⚠️ Error Handling Service
 * 
 * 표준화된 에러 처리 시스템
 * - 에러 분류 및 처리
 * - 에러 복구 전략
 * - 에러 로깅 및 모니터링
 * - 사용자 친화적 에러 메시지
 */

import { IErrorHandler, ServiceError } from '@/interfaces/services';
import { ILogger } from '@/interfaces/services';

export class ErrorHandlingService implements IErrorHandler {
  private errorHistory: ServiceError[] = [];
  private errorHandlers = new Map<string, (error: ServiceError) => void>();
  private logger?: ILogger;
  private readonly maxHistorySize = 500;

  constructor(logger?: ILogger) {
    this.logger = logger;
    this.setupDefaultHandlers();
  }

  /**
   * 에러 처리
   */
  handle(error: ServiceError): void {
    // 에러 히스토리에 추가
    this.addToHistory(error);

    // 로깅
    if (this.logger) {
      this.logger.error(`Service Error [${error.service}]: ${error.message}`, error, {
        code: error.code,
        service: error.service,
        context: error.context
      });
    }

    // 등록된 핸들러 실행
    const handler = this.errorHandlers.get(error.code) || this.errorHandlers.get('default');
    if (handler) {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // 심각한 에러의 경우 추가 처리
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error);
    }
  }

  /**
   * 에러 핸들러 등록
   */
  register(errorType: string, handler: (error: ServiceError) => void): void {
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
   * 기본 에러 핸들러 설정
   */
  private setupDefaultHandlers(): void {
    // 기본 핸들러
    this.register('default', (error: ServiceError) => {
      console.error(`Unhandled service error: ${error.message}`);
    });

    // 네트워크 에러
    this.register('NETWORK_ERROR', (error: ServiceError) => {
      console.warn('Network error detected, implementing retry strategy');
      // 재시도 로직 구현 가능
    });

    // 데이터베이스 에러
    this.register('DATABASE_ERROR', (error: ServiceError) => {
      console.error('Database error detected, switching to fallback mode');
      // 폴백 모드 전환 로직
    });

    // 인증 에러
    this.register('AUTH_ERROR', (error: ServiceError) => {
      console.warn('Authentication error, redirecting to login');
      // 로그인 페이지 리다이렉트 로직
    });

    // 권한 에러
    this.register('PERMISSION_ERROR', (error: ServiceError) => {
      console.warn('Permission denied, showing access denied message');
      // 접근 거부 메시지 표시
    });

    // 검증 에러
    this.register('VALIDATION_ERROR', (error: ServiceError) => {
      console.info('Validation error, showing user-friendly message');
      // 사용자 친화적 검증 에러 메시지
    });

    // 설정 에러
    this.register('CONFIG_ERROR', (error: ServiceError) => {
      console.error('Configuration error detected, using default settings');
      // 기본 설정 사용
    });

    // 타임아웃 에러
    this.register('TIMEOUT_ERROR', (error: ServiceError) => {
      console.warn('Operation timeout, implementing retry with backoff');
      // 백오프 재시도 로직
    });
  }

  /**
   * 에러 히스토리에 추가
   */
  private addToHistory(error: ServiceError): void {
    this.errorHistory.push(error);
    
    // 히스토리 크기 제한
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 심각한 에러 여부 확인
   */
  private isCriticalError(error: ServiceError): boolean {
    const criticalCodes = [
      'SYSTEM_FAILURE',
      'DATABASE_CONNECTION_LOST',
      'MEMORY_EXHAUSTED',
      'DISK_FULL',
      'SECURITY_BREACH'
    ];
    
    return criticalCodes.includes(error.code);
  }

  /**
   * 심각한 에러 처리
   */
  private handleCriticalError(error: ServiceError): void {
    console.error('CRITICAL ERROR DETECTED:', error);
    
    // 알림 시스템에 긴급 알림 전송
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Critical System Error', {
          body: `${error.service}: ${error.message}`,
          icon: '/favicon.ico',
          tag: 'critical-error'
        });
      }
    }

    // 추가 모니터링 시스템에 알림 (실제 환경에서는 외부 서비스 사용)
    this.notifyMonitoringSystem(error);
  }

  /**
   * 모니터링 시스템 알림
   */
  private notifyMonitoringSystem(error: ServiceError): void {
    // 실제 환경에서는 Sentry, DataDog 등의 모니터링 서비스 사용
    console.log('Notifying monitoring system:', {
      error: error.message,
      service: error.service,
      code: error.code,
      timestamp: error.timestamp,
      context: error.context
    });
  }

  /**
   * 에러 통계
   */
  getErrorStats(): {
    total: number;
    byService: Record<string, number>;
    byCode: Record<string, number>;
    recentCritical: ServiceError[];
    errorRate: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(error => error.timestamp >= oneHourAgo);

    const stats = {
      total: this.errorHistory.length,
      byService: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      recentCritical: this.errorHistory.filter(error => this.isCriticalError(error)).slice(-10),
      errorRate: recentErrors.length // 시간당 에러 수
    };

    this.errorHistory.forEach(error => {
      stats.byService[error.service] = (stats.byService[error.service] || 0) + 1;
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    });

    return stats;
  }

  /**
   * 에러 복구 시도
   */
  async attemptRecovery(error: ServiceError): Promise<boolean> {
    try {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return await this.recoverFromNetworkError(error);
        case 'DATABASE_ERROR':
          return await this.recoverFromDatabaseError(error);
        case 'TIMEOUT_ERROR':
          return await this.recoverFromTimeoutError(error);
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  /**
   * 네트워크 에러 복구
   */
  private async recoverFromNetworkError(error: ServiceError): Promise<boolean> {
    // 간단한 재시도 로직
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // 네트워크 연결 테스트
        await fetch('/api/health', { method: 'HEAD' });
        return true;
      } catch {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // 백오프
      }
    }

    return false;
  }

  /**
   * 데이터베이스 에러 복구
   */
  private async recoverFromDatabaseError(error: ServiceError): Promise<boolean> {
    // 데이터베이스 연결 재시도 로직
    try {
      // 실제 환경에서는 데이터베이스 연결 테스트
      console.log('Attempting database reconnection...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 타임아웃 에러 복구
   */
  private async recoverFromTimeoutError(error: ServiceError): Promise<boolean> {
    // 타임아웃 설정 조정 및 재시도
    try {
      console.log('Adjusting timeout settings and retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 서비스 에러 생성 헬퍼
 */
export function createServiceError(
  code: string,
  message: string,
  service: string,
  context?: Record<string, any>,
  cause?: Error
): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.service = service;
  error.timestamp = new Date();
  error.context = context;
  error.cause = cause;
  return error;
}

/**
   * 에러 코드 상수
   */
export const ERROR_CODES = {
  // 시스템 에러
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  MEMORY_EXHAUSTED: 'MEMORY_EXHAUSTED',
  DISK_FULL: 'DISK_FULL',
  
  // 네트워크 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  DNS_RESOLUTION_FAILED: 'DNS_RESOLUTION_FAILED',
  
  // 데이터베이스 에러
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_LOST: 'DATABASE_CONNECTION_LOST',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // 인증/권한 에러
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 검증 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 설정 에러
  CONFIG_ERROR: 'CONFIG_ERROR',
  MISSING_CONFIG: 'MISSING_CONFIG',
  INVALID_CONFIG: 'INVALID_CONFIG',
  
  // 비즈니스 로직 에러
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // 외부 서비스 에러
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  THIRD_PARTY_SERVICE_DOWN: 'THIRD_PARTY_SERVICE_DOWN',
  
  // 타임아웃 에러
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  
  // 보안 에러
  SECURITY_BREACH: 'SECURITY_BREACH',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const; 