/**
 * 🚨 분산 AI 시스템 통합 에러 핸들러
 * 
 * 모든 분산 서비스의 에러를 표준화하여 처리
 * - 서비스별 에러 매핑
 * - 복구 가능 여부 판단
 * - Circuit Breaker 연동
 */

import type { 
  AIServiceType, 
  DistributedError,
  ProcessingStatus 
} from '../interfaces/distributed-ai.interface';

// 에러 코드 정의
export const ERROR_CODES = {
  // 네트워크 에러
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // 인증 에러
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 요청 에러
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 서비스별 에러
  VECTOR_SEARCH_FAILED: 'VECTOR_SEARCH_FAILED',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  NLP_PROCESSING_FAILED: 'NLP_PROCESSING_FAILED',
  CACHE_OPERATION_FAILED: 'CACHE_OPERATION_FAILED',
  
  // 시스템 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 서비스별 에러 매핑
 */
const SERVICE_ERROR_MAPPING: Record<string, { code: ErrorCode; recoverable: boolean }> = {
  // Supabase 에러
  'PGRST301': { code: ERROR_CODES.NETWORK_TIMEOUT, recoverable: true },
  'PGRST000': { code: ERROR_CODES.INTERNAL_ERROR, recoverable: false },
  '42P01': { code: ERROR_CODES.VECTOR_SEARCH_FAILED, recoverable: false },
  
  // GCP Functions 에러
  'DEADLINE_EXCEEDED': { code: ERROR_CODES.NETWORK_TIMEOUT, recoverable: true },
  'RESOURCE_EXHAUSTED': { code: ERROR_CODES.RATE_LIMIT_EXCEEDED, recoverable: true },
  'UNAUTHENTICATED': { code: ERROR_CODES.UNAUTHORIZED, recoverable: false },
  
  // Redis 에러
  'WRONGTYPE': { code: ERROR_CODES.INVALID_PARAMETERS, recoverable: false },
  'OOM': { code: ERROR_CODES.MEMORY_LIMIT_EXCEEDED, recoverable: false },
  'LOADING': { code: ERROR_CODES.SERVICE_UNAVAILABLE, recoverable: true },
};

/**
 * 분산 에러 핸들러 클래스
 */
export class DistributedErrorHandler {
  private static instance: DistributedErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<AIServiceType, DistributedError[]> = new Map();

  private constructor() {}

  static getInstance(): DistributedErrorHandler {
    if (!this.instance) {
      this.instance = new DistributedErrorHandler();
    }
    return this.instance;
  }

  /**
   * 에러를 분산 에러 형식으로 변환
   */
  createDistributedError(
    error: unknown,
    service: AIServiceType,
    context?: Record<string, unknown>
  ): DistributedError {
    // 이미 분산 에러인 경우
    if (this.isDistributedError(error)) {
      return error;
    }

    // 일반 에러 처리
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = this.mapErrorCode(error, service);
    const recoverable = this.isRecoverable(errorCode, error);

    const distributedError: DistributedError = {
      code: errorCode,
      message: errorMessage,
      service,
      recoverable,
      details: context || this.extractErrorDetails(error),
    };

    // 재시도 가능한 경우 재시도 시간 추가
    if (recoverable) {
      distributedError.retryAfter = this.calculateRetryAfter(errorCode, service);
    }

    // 에러 기록
    this.recordError(service, distributedError);

    return distributedError;
  }

  /**
   * 에러 메시지 추출
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message);
    }
    return '알 수 없는 오류가 발생했습니다';
  }

  /**
   * 에러 코드 매핑
   */
  private mapErrorCode(error: unknown, service: AIServiceType): ErrorCode {
    // HTTP 상태 코드 체크
    if (this.hasHttpStatus(error)) {
      const status = (error as { status: number }).status;
      return this.mapHttpStatusToCode(status);
    }

    // 서비스별 에러 코드 체크
    const serviceError = this.extractServiceError(error);
    if (serviceError && SERVICE_ERROR_MAPPING[serviceError]) {
      return SERVICE_ERROR_MAPPING[serviceError].code;
    }

    // 타임아웃 체크
    if (this.isTimeoutError(error)) {
      return ERROR_CODES.NETWORK_TIMEOUT;
    }

    // 네트워크 에러 체크
    if (this.isNetworkError(error)) {
      return ERROR_CODES.NETWORK_ERROR;
    }

    // 기본값
    return ERROR_CODES.INTERNAL_ERROR;
  }

  /**
   * HTTP 상태 코드를 에러 코드로 매핑
   */
  private mapHttpStatusToCode(status: number): ErrorCode {
    if (status === 401) return ERROR_CODES.UNAUTHORIZED;
    if (status === 403) return ERROR_CODES.FORBIDDEN;
    if (status === 400) return ERROR_CODES.BAD_REQUEST;
    if (status === 429) return ERROR_CODES.RATE_LIMIT_EXCEEDED;
    if (status === 503) return ERROR_CODES.SERVICE_UNAVAILABLE;
    if (status >= 500) return ERROR_CODES.INTERNAL_ERROR;
    if (status === 408) return ERROR_CODES.NETWORK_TIMEOUT;
    return ERROR_CODES.INTERNAL_ERROR;
  }

  /**
   * 복구 가능 여부 판단
   */
  private isRecoverable(code: ErrorCode, error: unknown): boolean {
    // 명시적으로 복구 불가능한 코드들
    const nonRecoverableCodes = [
      ERROR_CODES.UNAUTHORIZED,
      ERROR_CODES.FORBIDDEN,
      ERROR_CODES.BAD_REQUEST,
      ERROR_CODES.INVALID_PARAMETERS,
    ];

    if (nonRecoverableCodes.includes(code)) {
      return false;
    }

    // 네트워크 관련 에러는 대부분 복구 가능
    const networkCodes = [
      ERROR_CODES.NETWORK_TIMEOUT,
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.SERVICE_UNAVAILABLE,
    ];

    if (networkCodes.includes(code)) {
      return true;
    }

    // 서비스별 매핑 확인
    const serviceError = this.extractServiceError(error);
    if (serviceError && SERVICE_ERROR_MAPPING[serviceError]) {
      return SERVICE_ERROR_MAPPING[serviceError].recoverable;
    }

    return false;
  }

  /**
   * 재시도 대기 시간 계산 (초)
   */
  private calculateRetryAfter(code: ErrorCode, service: AIServiceType): number {
    const errorKey = `${service}:${code}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;

    // 지수 백오프
    const baseDelay = 1; // 1초
    const maxDelay = 60; // 최대 60초
    const delay = Math.min(baseDelay * Math.pow(2, errorCount), maxDelay);

    return delay;
  }

  /**
   * 에러 기록
   */
  private recordError(service: AIServiceType, error: DistributedError): void {
    // 에러 카운트 증가
    const errorKey = `${service}:${error.code}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // 최근 에러 기록
    const serviceErrors = this.lastErrors.get(service) || [];
    serviceErrors.unshift(error);
    if (serviceErrors.length > 10) {
      serviceErrors.pop();
    }
    this.lastErrors.set(service, serviceErrors);
  }

  /**
   * 서비스 에러 통계
   */
  getErrorStats(service?: AIServiceType): Record<string, unknown> {
    if (service) {
      return {
        service,
        errorCounts: this.getServiceErrorCounts(service),
        lastErrors: this.lastErrors.get(service) || [],
      };
    }

    const stats: Record<string, unknown> = {};
    for (const [svc, errors] of this.lastErrors) {
      stats[svc] = {
        errorCounts: this.getServiceErrorCounts(svc),
        lastErrors: errors,
      };
    }
    return stats;
  }

  /**
   * 서비스별 에러 카운트
   */
  private getServiceErrorCounts(service: AIServiceType): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [key, count] of this.errorCounts) {
      if (key.startsWith(`${service}:`)) {
        const code = key.split(':')[1];
        counts[code] = count;
      }
    }
    return counts;
  }

  /**
   * 에러 카운트 초기화
   */
  resetErrorCount(service?: AIServiceType, code?: ErrorCode): void {
    if (service && code) {
      this.errorCounts.delete(`${service}:${code}`);
    } else if (service) {
      for (const key of this.errorCounts.keys()) {
        if (key.startsWith(`${service}:`)) {
          this.errorCounts.delete(key);
        }
      }
    } else {
      this.errorCounts.clear();
    }
  }

  // 헬퍼 메서드들

  private isDistributedError(error: unknown): error is DistributedError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'service' in error &&
      'recoverable' in error
    );
  }

  private hasHttpStatus(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    );
  }

  private extractServiceError(error: unknown): string | null {
    if (typeof error === 'object' && error !== null) {
      if ('code' in error) return String(error.code);
      if ('error_code' in error) return String(error.error_code);
      if ('errorCode' in error) return String(error.errorCode);
    }
    return null;
  }

  private isTimeoutError(error: unknown): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('deadline') ||
      message.includes('timed out')
    );
  }

  private isNetworkError(error: unknown): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    return (
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch failed')
    );
  }

  private extractErrorDetails(error: unknown): Record<string, unknown> | undefined {
    if (typeof error === 'object' && error !== null) {
      const { message, stack, ...details } = error as Record<string, unknown>;
      return Object.keys(details).length > 0 ? details : undefined;
    }
    return undefined;
  }

  /**
   * 에러 심각도 판단
   */
  getErrorSeverity(error: DistributedError): ErrorSeverity {
    // Circuit Breaker 열림
    if (error.code === ERROR_CODES.CIRCUIT_BREAKER_OPEN) {
      return ErrorSeverity.CRITICAL;
    }

    // 메모리 한계 초과
    if (error.code === ERROR_CODES.MEMORY_LIMIT_EXCEEDED) {
      return ErrorSeverity.CRITICAL;
    }

    // 인증 실패
    if ([ERROR_CODES.UNAUTHORIZED, ERROR_CODES.FORBIDDEN].includes(error.code as ErrorCode)) {
      return ErrorSeverity.HIGH;
    }

    // 서비스 이용 불가
    if (error.code === ERROR_CODES.SERVICE_UNAVAILABLE) {
      return ErrorSeverity.HIGH;
    }

    // 네트워크 에러
    if ([ERROR_CODES.NETWORK_ERROR, ERROR_CODES.NETWORK_TIMEOUT].includes(error.code as ErrorCode)) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }
}

// 싱글톤 인스턴스 export
export const distributedErrorHandler = DistributedErrorHandler.getInstance();