/**
 * GCP Cloud Logging Optimized Logger
 *
 * Pino-based structured logging for Google Cloud Run.
 * - Maps Pino levels to GCP severity levels
 * - Uses 'message' key instead of 'msg' for GCP compatibility
 * - Outputs JSON for Cloud Logging parsing
 *
 * @see https://cloud.google.com/logging/docs/structured-logging
 */

import pino from 'pino';
import { version as APP_VERSION } from '../../package.json';

/**
 * GCP Severity Level Mapping
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */
const GCP_SEVERITY: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

/**
 * Create GCP-optimized Pino logger
 */
function createLogger() {
  const isDev = process.env.NODE_ENV === 'development';
  // 🎯 Free Tier 최적화: Production에서 'warn' 레벨 사용
  // GCP Cloud Logging 비용 50%+ 절감 (info 로그 생략)
  const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'warn');

  return pino({
    level: logLevel,

    // GCP-compatible message key
    messageKey: 'message',

    // Base context
    base: {
      service: 'ai-engine',
      version: APP_VERSION,
    },

    // GCP-compatible timestamp
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

    // Map Pino levels to GCP severity
    formatters: {
      level(label: string) {
        return {
          severity: GCP_SEVERITY[label] || 'DEFAULT',
          level: label,
        };
      },
    },

    // Development: pretty print
    ...(isDev && {
      transport: {
        target: 'pino/file',
        options: { destination: 1 }, // stdout
      },
    }),
  });
}

const pinoLogger = createLogger();

/**
 * Console-compatible logger wrapper
 *
 * Pino의 시그니처는 (obj, msg) | (msg) 형태이지만,
 * console.warn/error('msg', extra) 패턴을 지원하기 위해 래핑합니다.
 * 두 번째 이후 인자는 structured context로 변환됩니다.
 */
function createWrappedLogger(pino: pino.Logger): WrappedLogger {
  function wrapMethod(method: 'warn' | 'error' | 'info' | 'debug' | 'fatal') {
    return (msgOrObj: unknown, ...args: unknown[]) => {
      // Pino 표준 호출: logger.error({ err, url }, 'msg')
      if (typeof msgOrObj === 'object' && msgOrObj !== null && args.length > 0 && typeof args[0] === 'string') {
        return pino[method](msgOrObj as Record<string, unknown>, args[0]);
      }

      // console-style 호출: logger.error('msg', error)
      if (typeof msgOrObj === 'string' && args.length > 0) {
        const extra = args[0];
        if (extra instanceof Error) {
          return pino[method]({ err: extra }, msgOrObj);
        }
        return pino[method]({ extra }, msgOrObj);
      }

      // 단순 문자열: logger.error('msg')
      if (typeof msgOrObj === 'string') {
        return pino[method](msgOrObj);
      }

      // 객체만: logger.error({ err })
      return pino[method](msgOrObj as Record<string, unknown>);
    };
  }

  return {
    warn: wrapMethod('warn'),
    error: wrapMethod('error'),
    info: wrapMethod('info'),
    debug: wrapMethod('debug'),
    fatal: wrapMethod('fatal'),
    child: (bindings: Record<string, unknown>) => createWrappedLogger(pino.child(bindings)),
    get level() { return pino.level; },
    set level(val: string) { pino.level = val; },
  };
}

type LogMethod = (msgOrObj: unknown, ...args: unknown[]) => void;

type WrappedLogger = {
  warn: LogMethod;
  error: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  fatal: LogMethod;
  child: (bindings: Record<string, unknown>) => WrappedLogger;
  level: string;
};

export const logger: WrappedLogger = createWrappedLogger(pinoLogger);

/**
 * Create a child logger with additional context
 */
export function createChildLogger(
  context: Record<string, string | number | boolean>
): WrappedLogger {
  return createWrappedLogger(pinoLogger.child(context));
}

/**
 * Request-scoped logger factory
 */
export function createRequestLogger(requestId: string, path: string): WrappedLogger {
  return createWrappedLogger(pinoLogger.child({
    requestId,
    path,
  }));
}

export type Logger = WrappedLogger;
