/**
 * GCP Functions 유틸리티 함수들
 */

import type {
  Result,
  GCPFunctionError,
  RateLimitConfig,
  RateLimitState
} from './gcp-functions.types';

import { GCPFunctionErrorCode } from './gcp-functions.types';

// Rate limiting 상태 저장소 (클라이언트 사이드)
const rateLimitStates = new Map<string, RateLimitState>();

/**
 * 간단한 클라이언트 사이드 Rate limiting
 */
export function checkRateLimit(
  functionName: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const state = rateLimitStates.get(functionName) || {
    requests: [],
    lastReset: now
  };

  // 윈도우가 지났으면 리셋
  if (now - state.lastReset >= config.windowMs) {
    state.requests = [];
    state.lastReset = now;
  }

  // 만료된 요청들 제거
  state.requests = state.requests.filter(
    timestamp => now - timestamp < config.windowMs
  );

  // 제한 확인
  if (state.requests.length >= config.maxRequests) {
    return false;
  }

  // 현재 요청 추가
  state.requests.push(now);
  rateLimitStates.set(functionName, state);

  return true;
}

/**
 * 기본 보안 헤더 생성
 */
export function createSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Request-ID': crypto.randomUUID(),
    'X-Client-Name': 'openmanager-vibe-v5',
    'X-Request-Time': new Date().toISOString(),
  };
}

/**
 * 타임아웃과 함께 fetch 실행
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createGCPError(
        GCPFunctionErrorCode.TIMEOUT,
        `Request timed out after ${timeout}ms`,
        undefined,
        url
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 재시도 로직 (지수백오프)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 마지막 시도였다면 에러 던지기
      if (attempt === maxRetries) {
        throw lastError;
      }

      // HTTP 상태 코드 확인 (재시도할 만한 에러인지)
      const shouldRetry = isRetryableError(lastError);
      if (!shouldRetry) {
        throw lastError;
      }

      // 지수백오프 지연
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 200; // 200ms 지터
      await new Promise(resolve => setTimeout(resolve, delay + jitter));

      console.warn(
        `🔄 재시도 ${attempt + 1}/${maxRetries} (${delay + Math.round(jitter)}ms 지연)`
      );
    }
  }

  throw lastError!;
}

/**
 * 재시도 가능한 에러인지 확인
 */
function isRetryableError(error: Error): boolean {
  // GCP Function Error인 경우
  if ('code' in error) {
    const gcpError = error as GCPFunctionError;
    return (
      gcpError.code === GCPFunctionErrorCode.TIMEOUT ||
      gcpError.code === GCPFunctionErrorCode.SERVER_ERROR ||
      (gcpError.status !== undefined && gcpError.status >= 500)
    );
  }

  // 네트워크 에러
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * GCP Function Error 생성
 */
export function createGCPError(
  code: GCPFunctionErrorCode,
  message: string,
  status?: number,
  functionName?: string,
  details?: string
): GCPFunctionError {
  const error = new Error(message) as GCPFunctionError;
  error.code = code;
  error.status = status;
  error.functionName = functionName;
  error.details = details;
  return error;
}

/**
 * HTTP 에러를 GCP Function Error로 변환
 */
export function convertHttpError(
  response: Response,
  functionName: string
): GCPFunctionError {
  const status = response.status;
  let code: GCPFunctionErrorCode;
  let message: string;

  if (status >= 500) {
    code = GCPFunctionErrorCode.SERVER_ERROR;
    message = `Server error: ${status}`;
  } else if (status >= 400) {
    code = GCPFunctionErrorCode.CLIENT_ERROR;
    message = `Client error: ${status}`;
  } else {
    code = GCPFunctionErrorCode.UNKNOWN_ERROR;
    message = `Unexpected status: ${status}`;
  }

  return createGCPError(code, message, status, functionName);
}

/**
 * URL 안전하게 조합
 */
export function createSafeUrl(baseUrl: string, path: string): URL {
  try {
    return new URL(path, baseUrl);
  } catch (error) {
    throw createGCPError(
      GCPFunctionErrorCode.CLIENT_ERROR,
      `Invalid URL: ${baseUrl}/${path}`,
      undefined,
      path
    );
  }
}

/**
 * 응답 데이터 검증
 */
export function validateResponse<T>(data: unknown): Result<T> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid response data format',
      code: 400
    };
  }

  // 기본적인 응답 구조 확인
  const response = data as any;
  if (typeof response.success !== 'boolean') {
    return {
      success: false,
      error: 'Response missing success field',
      code: 400
    };
  }

  if (response.success) {
    return {
      success: true,
      data: response.data as T
    };
  } else {
    return {
      success: false,
      error: response.error || 'Unknown error',
      code: response.code
    };
  }
}

/**
 * 디버그 로깅 (개발환경에서만)
 */
export function debugLog(functionName: string, message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 [${functionName}] ${message}`, data || '');
  }
}