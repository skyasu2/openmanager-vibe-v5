/**
 * 🔍 향상된 로깅 시스템 v1.0
 *
 * 객체 로깅 개선:
 * - JSON.stringify로 객체 직렬화
 * - "[object Object]" 에러 방지
 * - 개발/프로덕션 환경 구분
 * - 로그 레벨 관리
 */

import config from '@/lib/config';

// 로그 레벨 정의
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

// 현재 로그 레벨 설정
const currentLogLevel = config.isDevelopment ? LogLevel.VERBOSE : LogLevel.INFO;

// 안전한 JSON 직렬화 함수
const safeStringify = (obj: unknown, maxDepth = 3): string => {
  const seen = new WeakSet();

  const replacer = (key: string, value: unknown, depth = 0): unknown => {
    // 최대 깊이 제한
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }

    // 순환 참조 검사
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }

    // 함수는 문자열로 변환
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    // Error 객체 처리
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    // Date 객체 처리
    if (value instanceof Date) {
      return value.toISOString();
    }

    // 재귀적으로 깊이 추가
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> | unknown[] = Array.isArray(value)
        ? []
        : {};
      for (const k in value) {
        (result as Record<string, unknown>)[k] = replacer(
          k,
          (value as Record<string, unknown>)[k],
          depth + 1
        );
      }
      return result;
    }

    return value;
  };

  try {
    return JSON.stringify(obj, replacer, 2);
  } catch (error) {
    return `[Stringify Error: ${String(error)}]`;
  }
};

// 로그 포맷팅 함수
const formatMessage = (
  level: string,
  message: string,
  data?: unknown
): string => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (data === undefined) {
    return `${prefix} ${message}`;
  }

  // 객체인 경우 안전하게 직렬화
  if (typeof data === 'object') {
    const serialized = safeStringify(data);
    return `${prefix} ${message}\n${serialized}`;
  }

  // 기본 타입인 경우 그대로 출력
  if (
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return `${prefix} ${message} ${String(data)}`;
  }

  try {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  } catch {
    return `${prefix} ${message} [unserializable]`;
  }
};

// 향상된 로깅 클래스
class EnhancedLogger {
  private shouldLog(level: LogLevel): boolean {
    return level <= currentLogLevel;
  }

  error(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formattedMessage = formatMessage('ERROR', message, data);
    console.error(formattedMessage);
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formattedMessage = formatMessage('WARN', message, data);
    console.warn(formattedMessage);
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formattedMessage = formatMessage('INFO', message, data);
    console.log(formattedMessage);
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formattedMessage = formatMessage('DEBUG', message, data);
    console.log(formattedMessage);
  }

  verbose(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.VERBOSE)) return;

    const formattedMessage = formatMessage('VERBOSE', message, data);
    console.log(formattedMessage);
  }

  // 객체 전용 로깅 (기존 console.log 대체용)
  object(label: string, obj: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const serialized = safeStringify(obj);
    console.log(`[OBJECT] ${label}:\n${serialized}`);
  }

  // API 응답 로깅
  apiResponse(url: string, response: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const responseRecord = response as Record<string, unknown>;
    const responseData = {
      url,
      status: responseRecord?.status,
      data: responseRecord?.data,
      timestamp: new Date().toISOString(),
    };

    this.object('API Response', responseData);
  }

  // 에러 상세 로깅
  errorDetail(context: string, error: Error | unknown): void {
    const errorData = {
      context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    };

    this.error('상세 에러 정보', errorData);
  }

  // 성능 측정 로깅
  performance(operation: string, startTime: number, data?: unknown): void {
    const duration = Date.now() - startTime;
    const perfData = {
      operation,
      duration: `${duration}ms`,
      data,
      timestamp: new Date().toISOString(),
    };

    this.debug('성능 측정', perfData);
  }
}

// 싱글톤 로거 인스턴스
const logger = new EnhancedLogger();

// 기존 console.log 대체용 헬퍼 함수들
export const logObject = (label: string, obj: unknown) => {
  logger.object(label, obj);
};

export const logError = (message: string, error?: unknown) => {
  logger.errorDetail(message, error);
};

export const logApiCall = (url: string, response: unknown) => {
  logger.apiResponse(url, response);
};

export const logPerformance = (
  operation: string,
  startTime: number,
  data?: unknown
) => {
  logger.performance(operation, startTime, data);
};

// 안전한 콘솔 출력 함수 (기존 코드 호환용)
export const safeConsoleLog = (message: string, data?: unknown) => {
  if (data === undefined) {
    console.log(message);
    return;
  }

  if (typeof data === 'object') {
    console.log(message, safeStringify(data));
  } else {
    console.log(message, data);
  }
};

// 메인 로거 내보내기
export { logger };
export default logger;
