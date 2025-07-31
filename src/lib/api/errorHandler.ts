import { NextResponse } from 'next/server';
import { createSafeError, safeErrorLog } from '../error-handler';

/**
 * 🚨 표준 API 에러 응답 인터페이스
 */
export interface StandardApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
  timestamp: string;
  path?: string;
  method?: string;
}

/**
 * 📊 표준 API 성공 응답 인터페이스
 */
export interface StandardApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * 🔧 API 에러 타입 정의
 */
export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

/**
 * 🎯 에러 타입별 HTTP 상태 코드 매핑
 */
const statusMap: Record<ApiErrorType, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 408,
  NETWORK_ERROR: 502,
};

/**
 * 🚨 API 에러 응답 생성
 */
export function createErrorResponse(
  message: string,
  type: ApiErrorType = 'INTERNAL_SERVER_ERROR',
  details?: any,
  status?: number
): NextResponse {
  const responseStatus = status || statusMap[type] || 500;

  return NextResponse.json(
    {
      success: false,
      error: {
        type,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status: responseStatus }
  );
}

/**
 * ✅ 표준화된 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse {
  const successResponse: StandardApiSuccess<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
  };

  return NextResponse.json(successResponse);
}

/**
 * 🔍 에러 감지 및 분류 (안전한 버전)
 */
export function classifyError(error: unknown): {
  type: ApiErrorType;
  message: string;
  details?: string;
} {
  const safeError = createSafeError(error);
  const errorMessage = safeError.message.toLowerCase();

  // 에러 메시지 기반 분류
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      type: 'NOT_FOUND',
      message: '요청한 리소스를 찾을 수 없습니다.',
      details: safeError.message,
    };
  }

  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return {
      type: 'UNAUTHORIZED',
      message: '인증이 필요합니다.',
      details: safeError.message,
    };
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      type: 'VALIDATION_ERROR',
      message: '입력 데이터가 유효하지 않습니다.',
      details: safeError.message,
    };
  }

  if (
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('503')
  ) {
    return {
      type: 'SERVICE_UNAVAILABLE',
      message: '서비스를 사용할 수 없습니다.',
      details: safeError.message,
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('시간 초과')) {
    return {
      type: 'TIMEOUT',
      message: '요청 시간이 초과되었습니다.',
      details: safeError.message,
    };
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: '네트워크 오류가 발생했습니다.',
      details: safeError.message,
    };
  }

  return {
    type: 'INTERNAL_SERVER_ERROR',
    message: '내부 서버 오류가 발생했습니다.',
    details: safeError.message,
  };
}

/**
 * 🛡️ API 엔드포인트용 에러 핸들러 래퍼
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const safeError = safeErrorLog('❌ API 에러 캐치', error);

      const { type, message, details } = classifyError(error);

      return createErrorResponse(message, type, {
        error: details,
        path: args[0]?.url ? new URL(args[0].url).pathname : undefined,
        method: args[0]?.method,
      });
    }
  };
}

/**
 * 📋 시스템 상태별 응답 생성
 */
export function createSystemStatusResponse(
  isRunning: boolean,
  data: any,
  message?: string
): NextResponse {
  if (!isRunning) {
    return createErrorResponse(
      message || '시스템이 실행 중이 아닙니다.',
      'SERVICE_UNAVAILABLE'
    );
  }

  return createSuccessResponse(data, message);
}

/**
 * 🔄 비동기 작업 에러 핸들링 (안전한 버전)
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const safeError = createSafeError(error);
    safeErrorLog('⚠️ 비동기 작업 실패', error);

    return {
      success: false,
      error: safeError.message,
      ...(fallbackValue !== undefined && { data: fallbackValue }),
    };
  }
}

/**
 * 📊 에러 통계 추적
 */
class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts = new Map<ApiErrorType, number>();
  private recentErrors: Array<{
    type: ApiErrorType;
    timestamp: string;
    path?: string;
  }> = [];

  static getInstance(): ErrorTracker {
    if (!this.instance) {
      this.instance = new ErrorTracker();
    }
    return this.instance;
  }

  trackError(type: ApiErrorType, path?: string): void {
    // 에러 카운트 증가
    this.errorCounts.set(type, (this.errorCounts.get(type) || 0) + 1);

    // 최근 에러 추가 (최대 100개)
    this.recentErrors.push({
      type,
      timestamp: new Date().toISOString(),
      path,
    });

    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{
      type: ApiErrorType;
      timestamp: string;
      path?: string;
    }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const errorsByType = Object.fromEntries(this.errorCounts.entries());

    return {
      totalErrors,
      errorsByType,
      recentErrors: [...this.recentErrors],
    };
  }
}

export const errorTracker = ErrorTracker.getInstance();
