/**
 * 🚨 AI Error Handler with Retry Logic
 *
 * @description
 * Centralized error handling system for AI engine operations.
 * Features:
 * - Error type classification (Rate limit, Timeout, CORS, Network, etc.)
 * - Exponential backoff retry strategy
 * - Retryability detection
 * - Detailed error logging
 *
 * @version 1.0.0
 * @date 2025-11-21
 */

/**
 * 🎯 AI Error Types (Comprehensive)
 */
export enum AIErrorType {
  // API Quota & Rate Limiting
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',

  // Timeout Errors
  TIMEOUT = 'timeout',
  PROVIDER_TIMEOUT = 'provider_timeout',

  // Network Errors
  NETWORK_ERROR = 'network_error',
  CONNECTION_REFUSED = 'connection_refused',
  DNS_ERROR = 'dns_error',

  // CORS & Security
  CORS_ERROR = 'cors_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',

  // API Errors
  INVALID_REQUEST = 'invalid_request',
  INVALID_RESPONSE = 'invalid_response',
  API_ERROR = 'api_error',

  // Provider-specific
  PROVIDER_ERROR = 'provider_error',
  PROVIDER_UNAVAILABLE = 'provider_unavailable',

  // Unknown
  UNKNOWN = 'unknown',
}

/**
 * 🎯 AI Error Details
 */
export interface AIErrorDetails {
  type: AIErrorType;
  message: string;
  originalError?: Error | unknown;
  retryable: boolean;
  retryAfter?: number; // milliseconds
  provider?: string;
  timestamp: number;
}

/**
 * 🎯 Retry Options
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  exponentialFactor?: number;
  onRetry?: (attempt: number, error: AIErrorDetails) => void;
}

/**
 * 🚨 AI Error Class
 */
export class AIError extends Error {
  public readonly type: AIErrorType;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly provider?: string;
  public readonly timestamp: number;
  public readonly originalError?: Error | unknown;

  constructor(details: AIErrorDetails) {
    super(details.message);
    this.name = 'AIError';
    this.type = details.type;
    this.retryable = details.retryable;
    this.retryAfter = details.retryAfter;
    this.provider = details.provider;
    this.timestamp = details.timestamp;
    this.originalError = details.originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIError);
    }
  }
}

/**
 * 🛡️ AI Error Handler
 */
/**
 * 🛡️ AI Error Handler
 */
export const AIErrorHandler = {
  toErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error);
      } catch {
        return '[unserializable error object]';
      }
    }
    if (
      typeof error === 'number' ||
      typeof error === 'boolean' ||
      typeof error === 'bigint' ||
      typeof error === 'symbol'
    ) {
      return String(error);
    }
    return 'Unknown error';
  },

  /**
   * 🔍 Detect Error Type from Error Object
   */
  detectErrorType(error: unknown, provider?: string): AIErrorType {
    if (!error) return AIErrorType.UNKNOWN;

    const errorMessage = this.toErrorMessage(error).toLowerCase();
    const errorName = error instanceof Error ? error.name.toLowerCase() : '';

    // Rate Limit Detection
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429') ||
      errorName.includes('ratelimit')
    ) {
      return AIErrorType.RATE_LIMIT;
    }

    // Quota Exceeded
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('resource exhausted') ||
      errorMessage.includes('limit exceeded')
    ) {
      return AIErrorType.QUOTA_EXCEEDED;
    }

    // Timeout Detection
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorName.includes('timeout')
    ) {
      return provider ? AIErrorType.PROVIDER_TIMEOUT : AIErrorType.TIMEOUT;
    }

    // CORS Detection
    if (
      errorMessage.includes('cors') ||
      errorMessage.includes('cross-origin') ||
      errorMessage.includes('blocked by cors')
    ) {
      return AIErrorType.CORS_ERROR;
    }

    // Authentication/Authorization
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401') ||
      errorMessage.includes('authentication')
    ) {
      return AIErrorType.AUTHENTICATION_ERROR;
    }

    if (
      errorMessage.includes('forbidden') ||
      errorMessage.includes('403') ||
      errorMessage.includes('authorization')
    ) {
      return AIErrorType.AUTHORIZATION_ERROR;
    }

    // Network Errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch failed') ||
      errorName.includes('network')
    ) {
      return AIErrorType.NETWORK_ERROR;
    }

    if (
      errorMessage.includes('connection refused') ||
      errorMessage.includes('econnrefused')
    ) {
      return AIErrorType.CONNECTION_REFUSED;
    }

    if (
      errorMessage.includes('dns') ||
      errorMessage.includes('enotfound') ||
      errorMessage.includes('getaddrinfo')
    ) {
      return AIErrorType.DNS_ERROR;
    }

    // Invalid Request/Response
    if (
      errorMessage.includes('invalid request') ||
      errorMessage.includes('bad request') ||
      errorMessage.includes('400')
    ) {
      return AIErrorType.INVALID_REQUEST;
    }

    if (
      errorMessage.includes('invalid response') ||
      errorMessage.includes('parse') ||
      errorMessage.includes('json')
    ) {
      return AIErrorType.INVALID_RESPONSE;
    }

    // Provider Unavailable
    if (
      errorMessage.includes('unavailable') ||
      errorMessage.includes('503') ||
      errorMessage.includes('service unavailable')
    ) {
      return AIErrorType.PROVIDER_UNAVAILABLE;
    }

    // Provider-specific error
    if (provider) {
      return AIErrorType.PROVIDER_ERROR;
    }

    // Generic API error
    if (
      errorMessage.includes('api') ||
      errorMessage.includes('500') ||
      errorMessage.includes('internal server')
    ) {
      return AIErrorType.API_ERROR;
    }

    return AIErrorType.UNKNOWN;
  },

  /**
   * 🔄 Check if Error is Retryable
   */
  isRetryable(errorType: AIErrorType): boolean {
    const retryableTypes: AIErrorType[] = [
      AIErrorType.RATE_LIMIT,
      AIErrorType.TIMEOUT,
      AIErrorType.PROVIDER_TIMEOUT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.CONNECTION_REFUSED,
      AIErrorType.PROVIDER_UNAVAILABLE,
      AIErrorType.API_ERROR,
    ];

    return retryableTypes.includes(errorType);
  },

  /**
   * 🔄 Get Retry Delay for Error Type
   */
  getRetryDelay(
    errorType: AIErrorType,
    attempt: number,
    baseDelay: number = 1000
  ): number {
    // Rate limit: longer delay
    if (errorType === AIErrorType.RATE_LIMIT) {
      return Math.min(baseDelay * 2 ** attempt * 2, 30000); // Max 30s
    }

    // Quota exceeded: very long delay
    if (errorType === AIErrorType.QUOTA_EXCEEDED) {
      return Math.min(baseDelay * 2 ** attempt * 5, 60000); // Max 60s
    }

    // Standard exponential backoff
    return Math.min(baseDelay * 2 ** attempt, 10000); // Max 10s
  },

  /**
   * 🔄 Retry with Exponential Backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
    provider?: string
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay: _maxDelay = 10000,
      exponentialFactor: _exponentialFactor = 2,
      onRetry,
    } = options;

    let lastError: AIErrorDetails | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const errorType = this.detectErrorType(error, provider);
        const retryable = this.isRetryable(errorType);

        lastError = {
          type: errorType,
          message: this.toErrorMessage(error),
          originalError: error,
          retryable,
          provider,
          timestamp: Date.now(),
        };

        // Don't retry if not retryable or max attempts reached
        if (!retryable || attempt === maxRetries) {
          throw new AIError(lastError);
        }

        // Calculate delay with exponential backoff
        // Special handling for specific error types
        const actualDelay = this.getRetryDelay(errorType, attempt, baseDelay);

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Log retry attempt
        console.warn(
          `🔄 Retrying (attempt ${attempt + 1}/${maxRetries}) after ${actualDelay}ms due to ${errorType}`
        );

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, actualDelay));
      }
    }

    // Should never reach here, but TypeScript requires it
    throw new AIError(
      lastError ?? {
        type: AIErrorType.UNKNOWN,
        message: 'Unknown error occurred during retry',
        retryable: false,
        timestamp: Date.now(),
      }
    );
  },

  /**
   * 🛡️ Create AI Error from Unknown Error
   */
  createAIError(error: unknown, provider?: string): AIError {
    const errorType = this.detectErrorType(error, provider);
    const retryable = this.isRetryable(errorType);

    return new AIError({
      type: errorType,
      message: this.toErrorMessage(error),
      originalError: error,
      retryable,
      provider,
      timestamp: Date.now(),
    });
  },

  /**
   * 📊 Log Error Details
   */
  logError(error: AIError | AIErrorDetails, context?: string): void {
    const errorInfo =
      error instanceof AIError
        ? {
            type: error.type,
            message: error.message,
            retryable: error.retryable,
            provider: error.provider,
            timestamp: error.timestamp,
            originalError: error.originalError,
          }
        : error;

    console.error(`🚨 AI Error ${context ? `[${context}]` : ''}:`, {
      ...errorInfo,
      message: this.toErrorMessage(errorInfo.message),
      time: new Date(errorInfo.timestamp).toISOString(),
    });
  },
};

/**
 * 🎯 Helper function for common retry pattern
 */
export async function retryAIOperation<T>(
  operation: () => Promise<T>,
  provider?: string,
  options?: RetryOptions
): Promise<T> {
  return AIErrorHandler.retryWithBackoff(operation, options, provider);
}
