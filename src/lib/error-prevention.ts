/**
 * Vercel Error Prevention System
 * 
 * 이 파일은 Vercel 플랫폼에서 발생할 수 있는 다양한 오류들을 사전에 방지하기 위한
 * 종합적인 오류 방지 시스템을 제공합니다.
 */

// Vercel 오류 코드 정의
export const VERCEL_ERROR_CODES = {
  // 애플리케이션 오류
  MIDDLEWARE_INVOCATION_FAILED: 'MIDDLEWARE_INVOCATION_FAILED', // 500
  MIDDLEWARE_INVOCATION_TIMEOUT: 'MIDDLEWARE_INVOCATION_TIMEOUT', // 504
  FUNCTION_INVOCATION_FAILED: 'FUNCTION_INVOCATION_FAILED', // 500
  FUNCTION_INVOCATION_TIMEOUT: 'FUNCTION_INVOCATION_TIMEOUT', // 504
  FUNCTION_PAYLOAD_TOO_LARGE: 'FUNCTION_PAYLOAD_TOO_LARGE', // 413
  INFINITE_LOOP_DETECTED: 'INFINITE_LOOP_DETECTED', // 508
  TOO_MANY_FORKS: 'TOO_MANY_FORKS', // 502
  
  // 요청 오류
  REQUEST_HEADER_TOO_LARGE: 'REQUEST_HEADER_TOO_LARGE', // 431
  URL_TOO_LONG: 'URL_TOO_LONG', // 414
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND', // 404
} as const;

// 오류 방지 설정
export const ERROR_PREVENTION_CONFIG = {
  // 미들웨어 설정
  MIDDLEWARE_TIMEOUT_MS: 5000, // 5초
  MIDDLEWARE_MAX_EXECUTION_TIME: 1000, // 1초
  
  // 함수 설정
  FUNCTION_TIMEOUT_MS: 10000, // 10초
  FUNCTION_MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  
  // 요청 설정
  MAX_URL_LENGTH: 2048,
  MAX_HEADER_SIZE: 8192,
  
  // 성능 임계값
  SLOW_RESPONSE_THRESHOLD: 3000, // 3초
  MEMORY_WARNING_THRESHOLD: 80, // 80%
} as const;

/**
 * 미들웨어 실행 시간 모니터링
 * MIDDLEWARE_INVOCATION_TIMEOUT (504) 방지
 */
export function withMiddlewareTimeout<T>(
  fn: () => Promise<T> | T,
  timeoutMs: number = ERROR_PREVENTION_CONFIG.MIDDLEWARE_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Middleware timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        result
          .then(resolve)
          .catch(reject)
          .finally(() => clearTimeout(timeout));
      } else {
        clearTimeout(timeout);
        resolve(result);
      }
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * 함수 페이로드 크기 검증
 * FUNCTION_PAYLOAD_TOO_LARGE (413) 방지
 */
export function validatePayloadSize(data: any): boolean {
  try {
    const serialized = JSON.stringify(data);
    const sizeInBytes = new Blob([serialized]).size;
    
    if (sizeInBytes > ERROR_PREVENTION_CONFIG.FUNCTION_MAX_PAYLOAD_SIZE) {
      console.warn(
        `[Error Prevention] Payload size warning: ${sizeInBytes} bytes exceeds limit of ${ERROR_PREVENTION_CONFIG.FUNCTION_MAX_PAYLOAD_SIZE} bytes`
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Error Prevention] Failed to validate payload size:', error);
    return false;
  }
}

/**
 * URL 길이 검증
 * URL_TOO_LONG (414) 방지
 */
export function validateUrlLength(url: string): boolean {
  if (url.length > ERROR_PREVENTION_CONFIG.MAX_URL_LENGTH) {
    console.warn(
      `[Error Prevention] URL too long: ${url.length} characters exceeds limit of ${ERROR_PREVENTION_CONFIG.MAX_URL_LENGTH}`
    );
    return false;
  }
  return true;
}

/**
 * 요청 헤더 크기 검증
 * REQUEST_HEADER_TOO_LARGE (431) 방지
 */
export function validateHeaderSize(headers: Headers | Record<string, string>): boolean {
  try {
    let totalSize = 0;
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        totalSize += key.length + value.length + 4; // +4 for ": " and "\r\n"
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        totalSize += key.length + value.length + 4;
      });
    }
    
    if (totalSize > ERROR_PREVENTION_CONFIG.MAX_HEADER_SIZE) {
      console.warn(
        `[Error Prevention] Headers too large: ${totalSize} bytes exceeds limit of ${ERROR_PREVENTION_CONFIG.MAX_HEADER_SIZE} bytes`
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Error Prevention] Failed to validate header size:', error);
    return false;
  }
}

/**
 * 무한 루프 방지 카운터
 * INFINITE_LOOP_DETECTED (508) 방지
 */
export class LoopPrevention {
  private static counters = new Map<string, number>();
  private static readonly MAX_ITERATIONS = 100;
  
  static checkLoop(key: string): boolean {
    const current = this.counters.get(key) || 0;
    
    if (current >= this.MAX_ITERATIONS) {
      console.error(`[Error Prevention] Infinite loop detected for key: ${key}`);
      return false;
    }
    
    this.counters.set(key, current + 1);
    
    // 일정 시간 후 카운터 리셋
    setTimeout(() => {
      this.counters.delete(key);
    }, 60000); // 1분 후 리셋
    
    return true;
  }
  
  static resetCounter(key: string): void {
    this.counters.delete(key);
  }
}

/**
 * 메모리 사용량 모니터링
 * 성능 최적화 및 오류 방지
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
  warning: boolean;
} {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return {
      used: 0,
      total: 0,
      percentage: 0,
      warning: false
    };
  }

  const usage = process.memoryUsage();
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentage = Math.round((usedMB / totalMB) * 100);
  
  const warning = percentage > ERROR_PREVENTION_CONFIG.MEMORY_WARNING_THRESHOLD;
  
  if (warning) {
    console.warn(
      `[Error Prevention] High memory usage: ${percentage}% (${usedMB}MB / ${totalMB}MB)`
    );
  }
  
  return {
    used: usedMB,
    total: totalMB,
    percentage,
    warning
  };
}

/**
 * API 응답 시간 모니터링
 * FUNCTION_INVOCATION_TIMEOUT (504) 방지
 */
export function withResponseTimeMonitoring<T>(
  fn: () => Promise<T> | T,
  operationName: string = 'operation'
): Promise<T> {
  const startTime = Date.now();
  
  const monitor = () => {
    const duration = Date.now() - startTime;
    
    if (duration > ERROR_PREVENTION_CONFIG.SLOW_RESPONSE_THRESHOLD) {
      console.warn(
        `[Error Prevention] Slow ${operationName}: ${duration}ms exceeds threshold of ${ERROR_PREVENTION_CONFIG.SLOW_RESPONSE_THRESHOLD}ms`
      );
    }
    
    return duration;
  };
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        monitor();
      });
    } else {
      monitor();
      return Promise.resolve(result);
    }
  } catch (error) {
    monitor();
    throw error;
  }
}

/**
 * 종합적인 오류 방지 래퍼
 * 여러 검증을 한 번에 수행
 */
export async function withErrorPrevention<T>(
  fn: () => Promise<T> | T,
  options: {
    operationName?: string;
    validatePayload?: any;
    timeoutMs?: number;
    preventLoop?: string;
  } = {}
): Promise<T> {
  const {
    operationName = 'operation',
    validatePayload,
    timeoutMs = ERROR_PREVENTION_CONFIG.FUNCTION_TIMEOUT_MS,
    preventLoop
  } = options;
  
  // 무한 루프 검사
  if (preventLoop && !LoopPrevention.checkLoop(preventLoop)) {
    throw new Error(`Infinite loop prevented for: ${preventLoop}`);
  }
  
  // 페이로드 크기 검증
  if (validatePayload && !validatePayloadSize(validatePayload)) {
    throw new Error('Payload too large');
  }
  
  // 메모리 사용량 체크
  const memoryStatus = getMemoryUsage();
  if (memoryStatus.warning) {
    console.warn(`[Error Prevention] Starting ${operationName} with high memory usage`);
  }
  
  // 타임아웃과 응답 시간 모니터링을 함께 적용
  return withMiddlewareTimeout(
    () => withResponseTimeMonitoring(fn, operationName),
    timeoutMs
  );
}

export default {
  VERCEL_ERROR_CODES,
  ERROR_PREVENTION_CONFIG,
  withMiddlewareTimeout,
  validatePayloadSize,
  validateUrlLength,
  validateHeaderSize,
  LoopPrevention,
  getMemoryUsage,
  withResponseTimeMonitoring,
  withErrorPrevention
}; 