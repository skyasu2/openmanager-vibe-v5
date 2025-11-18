/**
 * AI Error Handler
 *
 * AI 서비스의 에러 처리 및 폴백 전략 관리
 * - 엔진별 폴백 체인
 * - 에러 타입별 처리
 * - 재시도 로직
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryRequest, QueryResponse } from '../SimplifiedQueryEngine';

export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelayMs: number;
  fallbackChain: string[];
  enableDetailedErrors: boolean;
}

export interface RetryContext {
  attempt: number;
  failedEngines: string[];
  processingPath: string[];
  lastError?: Error;
}

export class AIErrorHandler {
  constructor(private config: ErrorHandlerConfig) {}

  /**
   * 폴백 엔진 선택
   */
  getFallbackEngine(
    failedEngine: string,
    context: RetryContext
  ): string | null {
    const { fallbackChain } = this.config;

    // 실패한 엔진들을 제외한 다음 엔진 찾기
    for (const engine of fallbackChain) {
      if (engine !== failedEngine && !context.failedEngines.includes(engine)) {
        return engine;
      }
    }

    return null; // 더 이상 시도할 엔진이 없음
  }

  /**
   * 에러 응답 생성
   */
  createErrorResponse(
    error: unknown,
    context: RetryContext,
    request?: QueryRequest
  ): QueryResponse {
    const errorMessage = this.extractErrorMessage(error);
    const isRetryable = this.isRetryableError(error);

    return {
      success: false,
      response: this.buildErrorMessage(errorMessage, context, isRetryable),
      engine: 'fallback',
      confidence: 0,
      thinkingSteps: this.buildErrorSteps(context, errorMessage),
      metadata: {
        error: true,
        errorType: this.categorizeError(error),
        retryAttempt: context.attempt,
        failedEngines: context.failedEngines.join(','),
        detailedError: this.config.enableDetailedErrors
          ? errorMessage
          : undefined,
      },
      processingTime: 0,
    };
  }

  /**
   * 타임아웃 응답 생성
   */
  createTimeoutResponse(
    timeoutMs: number,
    context: RetryContext
  ): QueryResponse {
    return {
      success: false,
      response: `⏱️ 요청 시간이 초과되었습니다 (${timeoutMs}ms).\n\n잠시 후 다시 시도해주세요.`,
      engine: 'fallback',
      confidence: 0,
      thinkingSteps: [
        {
          step: '타임아웃 감지',
          description: `${timeoutMs}ms 후 응답 없음`,
          status: 'failed',
          timestamp: Date.now(),
        },
        ...this.buildProcessingPathSteps(context.processingPath),
      ],
      metadata: {
        timeout: true,
        timeoutMs,
        retryAttempt: context.attempt,
        failedEngines: context.failedEngines.join(','),
      },
      processingTime: timeoutMs,
    };
  }

  /**
   * 모든 엔진 실패 응답 생성
   */
  createAllEnginesFailedResponse(context: RetryContext): QueryResponse {
    return {
      success: false,
      response: `🔧 모든 AI 엔진에서 오류가 발생했습니다.\n\n시도한 엔진: ${context.failedEngines.join(', ')}\n\n시스템 관리자에게 문의해주세요.`,
      engine: 'fallback',
      confidence: 0,
      thinkingSteps: [
        ...context.failedEngines.map((engine, index) => ({
          step: `엔진 ${index + 1} 시도`,
          description: `${engine} - 실패`,
          status: 'failed' as const,
          timestamp: Date.now(),
        })),
        {
          step: '최종 결과',
          description: '모든 엔진 실패',
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      metadata: {
        allEnginesFailed: true,
        failedEngines: context.failedEngines,
        totalAttempts: context.attempt,
      },
      processingTime: 0,
    };
  }

  /**
   * 재시도 가능 여부 확인
   */
  isRetryableError(error: unknown): boolean {
    const errorMessage = this.extractErrorMessage(error).toLowerCase();

    // 일시적 오류 패턴
    const temporaryErrorPatterns = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'rate limit',
      'server error',
      '503',
      '502',
      '504',
    ];

    return temporaryErrorPatterns.some((pattern) =>
      errorMessage.includes(pattern)
    );
  }

  /**
   * 에러 분류
   */
  categorizeError(error: unknown): string {
    const errorMessage = this.extractErrorMessage(error).toLowerCase();

    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('network') || errorMessage.includes('connection'))
      return 'network';
    if (errorMessage.includes('rate limit')) return 'rate_limit';
    if (errorMessage.includes('auth') || errorMessage.includes('permission'))
      return 'auth';
    if (errorMessage.includes('quota') || errorMessage.includes('limit'))
      return 'quota';
    if (errorMessage.includes('validation') || errorMessage.includes('invalid'))
      return 'validation';
    if (errorMessage.includes('server') || errorMessage.includes('50'))
      return 'server';

    return 'unknown';
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // === Private Methods ===

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as { message: unknown }).message;
      if (typeof msg === 'string') return msg;
      try {
        return JSON.stringify(msg ?? '');
      } catch {
        return typeof msg === 'string' ? msg : 'Unknown message';
      }
    }

    return 'Unknown error occurred';
  }

  private buildErrorMessage(
    errorMessage: string,
    context: RetryContext,
    isRetryable: boolean
  ): string {
    let message = `❌ 요청 처리 중 오류가 발생했습니다.\n\n`;

    if (this.config.enableDetailedErrors) {
      message += `오류 내용: ${errorMessage}\n\n`;
    }

    if (context.failedEngines.length > 0) {
      message += `실패한 엔진: ${context.failedEngines.join(', ')}\n`;
    }

    if (isRetryable) {
      message += `\n🔄 잠시 후 다시 시도해주세요.`;
    } else {
      message += `\n⚠️ 시스템 관리자에게 문의해주세요.`;
    }

    return message;
  }

  private buildErrorSteps(context: RetryContext, errorMessage: string) {
    const steps = [...this.buildProcessingPathSteps(context.processingPath)];

    steps.push({
      step: '에러 처리',
      description: `시도 ${context.attempt}회 - ${errorMessage}`,
      status: 'completed',
      timestamp: Date.now(),
    });

    return steps;
  }

  private buildProcessingPathSteps(processingPath: string[]) {
    return processingPath.map((step, index) => ({
      step: `처리 단계 ${index + 1}`,
      description: step,
      status: 'completed' as const,
      timestamp: Date.now() - (processingPath.length - index) * 100,
    }));
  }
}
