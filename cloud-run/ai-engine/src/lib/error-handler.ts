/**
 * Centralized Error Handler
 *
 * Provides consistent error handling across all API endpoints.
 *
 * @version 1.0.0
 * @created 2025-12-28
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createErrorResponse, ErrorCodes, type ErrorCode } from '../types/api-response';
import { logger } from './logger';

// ============================================================================
// 1. Error Classification
// ============================================================================

/**
 * Classify error and determine appropriate HTTP status code
 */
function classifyError(error: unknown): { code: ErrorCode; status: ContentfulStatusCode } {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Authentication errors
  if (message.includes('api key') || message.includes('unauthorized') || message.includes('auth')) {
    return { code: ErrorCodes.AUTH_ERROR, status: 401 };
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('quota') || message.includes('too many')) {
    return { code: ErrorCodes.RATE_LIMIT, status: 429 };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('deadline')) {
    return { code: ErrorCodes.TIMEOUT, status: 504 };
  }

  // Model/Provider errors
  if (message.includes('model') || message.includes('provider') || message.includes('llm')) {
    return { code: ErrorCodes.MODEL_ERROR, status: 503 };
  }

  // Validation errors
  if (message.includes('required') || message.includes('invalid') || message.includes('missing')) {
    return { code: ErrorCodes.VALIDATION_ERROR, status: 400 };
  }

  // Not found
  if (message.includes('not found') || message.includes('does not exist')) {
    return { code: ErrorCodes.NOT_FOUND, status: 404 };
  }

  // Default: internal error
  return { code: ErrorCodes.INTERNAL_ERROR, status: 500 };
}

// ============================================================================
// 2. Error Handler Functions
// ============================================================================

/**
 * Handle API errors with automatic classification
 * @param c - Hono context
 * @param error - Error to handle
 * @param logPrefix - Prefix for console logging
 */
export function handleApiError(
  c: Context,
  error: unknown,
  logPrefix = 'API'
): Response {
  const { code, status } = classifyError(error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Log error with prefix
  logger.error(`❌ [${logPrefix}] Error:`, errorMessage);

  // Return standardized error response
  return c.json(createErrorResponse(errorMessage, code), status);
}

/**
 * Handle validation errors (400 Bad Request)
 */
export function handleValidationError(
  c: Context,
  message: string,
  details?: unknown
): Response {
  logger.warn(`⚠️ [Validation] ${message}`);
  return c.json(createErrorResponse(message, ErrorCodes.VALIDATION_ERROR, details), 400 as ContentfulStatusCode);
}

/**
 * Handle not found errors (404)
 */
export function handleNotFoundError(
  c: Context,
  resource: string
): Response {
  const message = `${resource} not found`;
  logger.warn(`⚠️ [NotFound] ${message}`);
  return c.json(createErrorResponse(message, ErrorCodes.NOT_FOUND), 404 as ContentfulStatusCode);
}

/**
 * Handle unauthorized errors (401)
 */
export function handleUnauthorizedError(c: Context): Response {
  logger.warn(`⚠️ [Auth] Unauthorized request`);
  return c.json(createErrorResponse('Unauthorized', ErrorCodes.UNAUTHORIZED), 401 as ContentfulStatusCode);
}

// ============================================================================
// 3. Async Error Wrapper
// ============================================================================

/**
 * Wrap async route handler with error handling
 * Use this for routes where you want automatic error handling
 */
export function withErrorHandler<T>(
  handler: (c: Context) => Promise<T>,
  logPrefix = 'API'
): (c: Context) => Promise<T | Response> {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (error) {
      return handleApiError(c, error, logPrefix);
    }
  };
}

// ============================================================================
// 4. Success Response Helper
// ============================================================================

/**
 * Create a success JSON response
 */
export function jsonSuccess<T extends object>(c: Context, data: T, status: ContentfulStatusCode = 200): Response {
  return c.json(
    {
      success: true as const,
      ...(data as Record<string, unknown>),
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Create a simple success response with data wrapper
 */
export function jsonSuccessData<T>(c: Context, data: T, status: ContentfulStatusCode = 200): Response {
  return c.json(
    {
      success: true as const,
      data,
      timestamp: new Date().toISOString(),
    },
    status
  );
}
