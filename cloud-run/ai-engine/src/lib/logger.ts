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
  const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

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

export const logger = createLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(
  context: Record<string, string | number | boolean>
) {
  return logger.child(context);
}

/**
 * Request-scoped logger factory
 */
export function createRequestLogger(requestId: string, path: string) {
  return logger.child({
    requestId,
    path,
  });
}

export type Logger = typeof logger;
