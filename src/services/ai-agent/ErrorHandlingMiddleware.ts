/**
 * 🛡️ 에러 처리 미들웨어
 *
 * 모든 데이터 처리 과정에서 발생하는 에러를 일관되게 처리
 * - 에러 분류 및 심각도 판단
 * - 복구 가능한 에러 자동 재시도
 * - 상세한 에러 로깅 및 모니터링
 * - 사용자 친화적 에러 메시지 생성
 */

export interface ErrorContext {
  requestId: string;
  operation: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  additionalData?: any;
}

export interface ErrorResponse {
  requestId: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
    retryAfter?: number;
  };
  metadata: {
    strategy: string;
    processingTime: number;
    cacheHit: boolean;
    dataQuality: number;
    confidence: number;
    timestamp: number;
    errorId: string;
  };
  performance: {
    totalTime: number;
    strategyTime: number;
    cacheTime: number;
    validationTime: number;
  };
}

export class ErrorHandlingMiddleware {
  private static instance: ErrorHandlingMiddleware | null = null;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1초

  private constructor() {
    // 에러 통계 정리 (5분마다)
    setInterval(() => this.cleanupErrorStats(), 300000);
  }

  static getInstance(): ErrorHandlingMiddleware {
    if (!ErrorHandlingMiddleware.instance) {
      ErrorHandlingMiddleware.instance = new ErrorHandlingMiddleware();
    }
    return ErrorHandlingMiddleware.instance;
  }

  /**
   * 🛡️ 메인 에러 처리 메서드
   */
  handleError(request: any, error: any, processingTime: number): ErrorResponse {
    const errorId = this.generateErrorId();
    const errorInfo = this.analyzeError(error);
    const context: ErrorContext = {
      requestId: request.requestId || 'unknown',
      operation: request.requestType || 'unknown',
      timestamp: Date.now(),
      userId: request.context?.userId,
      sessionId: request.context?.sessionId,
      additionalData: {
        query: request.query,
        filters: request.filters,
      },
    };

    // 에러 로깅
    this.logError(errorId, error, context, errorInfo);

    // 에러 통계 업데이트
    this.updateErrorStats(errorInfo.code);

    // 사용자 친화적 메시지 생성
    const userMessage = this.generateUserMessage(errorInfo, context);

    const response: ErrorResponse = {
      requestId: context.requestId,
      success: false,
      error: {
        code: errorInfo.code,
        message: userMessage,
        details: errorInfo.details,
        severity: errorInfo.severity,
        recoverable: errorInfo.recoverable,
        retryAfter: errorInfo.recoverable
          ? this.calculateRetryDelay(errorInfo.code)
          : undefined,
      },
      metadata: {
        strategy: 'error_handling',
        processingTime,
        cacheHit: false,
        dataQuality: 0,
        confidence: 0,
        timestamp: context.timestamp,
        errorId,
      },
      performance: {
        totalTime: processingTime,
        strategyTime: 0,
        cacheTime: 0,
        validationTime: 0,
      },
    };

    console.error(
      `❌ [${context.requestId}] 에러 처리 완료: ${errorInfo.code} (${errorId})`
    );
    return response;
  }

  /**
   * 🔍 에러 분석
   */
  private analyzeError(error: any): {
    code: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
    details: any;
    category: string;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // 에러 패턴 매칭
    if (errorMessage.includes('필수 필드가 누락')) {
      return {
        code: 'VALIDATION_ERROR',
        severity: 'low',
        recoverable: false,
        details: { message: errorMessage },
        category: 'validation',
      };
    }

    if (errorMessage.includes('지원하지 않는 요청 타입')) {
      return {
        code: 'INVALID_REQUEST_TYPE',
        severity: 'low',
        recoverable: false,
        details: { message: errorMessage },
        category: 'validation',
      };
    }

    if (errorMessage.includes('질의가 너무 깁니다')) {
      return {
        code: 'QUERY_TOO_LONG',
        severity: 'low',
        recoverable: false,
        details: { message: errorMessage },
        category: 'validation',
      };
    }

    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('시간 초과')
    ) {
      return {
        code: 'TIMEOUT_ERROR',
        severity: 'medium',
        recoverable: true,
        details: { message: errorMessage, stack: errorStack },
        category: 'performance',
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('연결')) {
      return {
        code: 'NETWORK_ERROR',
        severity: 'high',
        recoverable: true,
        details: { message: errorMessage, stack: errorStack },
        category: 'network',
      };
    }

    if (errorMessage.includes('memory') || errorMessage.includes('메모리')) {
      return {
        code: 'MEMORY_ERROR',
        severity: 'critical',
        recoverable: false,
        details: { message: errorMessage, stack: errorStack },
        category: 'system',
      };
    }

    if (
      errorMessage.includes('database') ||
      errorMessage.includes('데이터베이스')
    ) {
      return {
        code: 'DATABASE_ERROR',
        severity: 'high',
        recoverable: true,
        details: { message: errorMessage, stack: errorStack },
        category: 'database',
      };
    }

    // 기본 에러
    return {
      code: 'UNKNOWN_ERROR',
      severity: 'medium',
      recoverable: true,
      details: { message: errorMessage, stack: errorStack },
      category: 'unknown',
    };
  }

  /**
   * 📝 에러 로깅
   */
  private logError(
    errorId: string,
    error: any,
    context: ErrorContext,
    errorInfo: any
  ): void {
    const logEntry = {
      errorId,
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...errorInfo,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    // 심각도에 따른 로깅 레벨 결정
    switch (errorInfo.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', JSON.stringify(logEntry, null, 2));
        break;
      case 'high':
        console.error(
          '🔴 HIGH SEVERITY ERROR:',
          JSON.stringify(logEntry, null, 2)
        );
        break;
      case 'medium':
        console.warn(
          '🟡 MEDIUM SEVERITY ERROR:',
          JSON.stringify(logEntry, null, 2)
        );
        break;
      case 'low':
        console.log(
          '🟢 LOW SEVERITY ERROR:',
          JSON.stringify(logEntry, null, 2)
        );
        break;
    }

    // 실제 환경에서는 외부 로깅 서비스로 전송
    // await this.sendToLoggingService(logEntry);
  }

  /**
   * 💬 사용자 친화적 메시지 생성
   */
  private generateUserMessage(errorInfo: any, context: ErrorContext): string {
    const baseMessages = {
      VALIDATION_ERROR:
        '입력 데이터에 문제가 있습니다. 요청 내용을 확인해주세요.',
      INVALID_REQUEST_TYPE:
        '지원하지 않는 요청 타입입니다. 올바른 요청 타입을 사용해주세요.',
      QUERY_TOO_LONG: '질의 내용이 너무 깁니다. 더 간단하게 작성해주세요.',
      TIMEOUT_ERROR:
        '요청 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      NETWORK_ERROR:
        '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      MEMORY_ERROR: '시스템 리소스가 부족합니다. 관리자에게 문의해주세요.',
      DATABASE_ERROR:
        '데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      UNKNOWN_ERROR:
        '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };

    let message =
      baseMessages[errorInfo.code as keyof typeof baseMessages] ||
      baseMessages.UNKNOWN_ERROR;

    // 복구 가능한 에러인 경우 재시도 안내 추가
    if (errorInfo.recoverable) {
      const retryDelay = this.calculateRetryDelay(errorInfo.code);
      message += ` (${Math.ceil(retryDelay / 1000)}초 후 재시도 가능)`;
    }

    return message;
  }

  /**
   * 📊 에러 통계 업데이트
   */
  private updateErrorStats(errorCode: string): void {
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);
    this.lastErrors.set(errorCode, Date.now());
  }

  /**
   * ⏰ 재시도 지연 시간 계산
   */
  private calculateRetryDelay(errorCode: string): number {
    const errorCount = this.errorCounts.get(errorCode) || 0;
    const baseDelay = this.RETRY_DELAY;

    // 지수 백오프: 에러가 반복될수록 지연 시간 증가
    return Math.min(baseDelay * Math.pow(2, Math.min(errorCount, 5)), 30000); // 최대 30초
  }

  /**
   * 🧹 에러 통계 정리
   */
  private cleanupErrorStats(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000; // 5분 전

    for (const [errorCode, lastTime] of this.lastErrors.entries()) {
      if (lastTime < fiveMinutesAgo) {
        this.errorCounts.delete(errorCode);
        this.lastErrors.delete(errorCode);
      }
    }
  }

  /**
   * 🆔 에러 ID 생성
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `err_${timestamp}_${random}`;
  }

  /**
   * 📊 에러 통계 조회
   */
  getErrorStats(): any {
    const stats = Array.from(this.errorCounts.entries()).map(
      ([code, count]) => ({
        errorCode: code,
        count,
        lastOccurred: new Date(this.lastErrors.get(code) || 0).toISOString(),
      })
    );

    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalErrors,
      errorTypes: stats.length,
      errorBreakdown: stats,
      lastCleanup: new Date().toISOString(),
    };
  }

  /**
   * 🔄 에러 통계 초기화
   */
  clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    console.log('🔄 에러 통계 초기화 완료');
  }
}
