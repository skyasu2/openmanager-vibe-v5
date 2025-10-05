/**
 * Qwen AI Client
 *
 * Executes installed `qwen` CLI from WSL
 * OAuth authenticated, supports Plan Mode
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse } from '../types.js';
import { withTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

const QWEN_TIMEOUTS = {
  normal: 30000,  // 30 seconds
  plan: 60000     // 60 seconds for Plan Mode
};

/**
 * Execute Qwen CLI query (internal implementation)
 * @internal
 */
async function executeQwenQuery(query: string, planMode: boolean, timeout: number): Promise<AIResponse> {
  const startTime = Date.now();

  // Execute qwen CLI with Plan Mode
  // ✅ Security: Using execFile with argument array prevents command injection
  // Qwen CLI always requires -p flag for non-interactive mode
  const result = await withTimeout(
    execFileAsync('qwen', ['-p', query], {
      maxBuffer: config.maxBuffer,
      cwd: config.cwd
    }),
    timeout,
    `Qwen timeout after ${timeout}ms`
  );

  // Clean response (remove empty lines)
  const response = result.stdout
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n')
    .trim();

  return {
    provider: 'qwen',
    response,
    responseTime: Date.now() - startTime,
    success: true
  };
}

/**
 * Query Qwen AI with automatic retry on failure
 *
 * @param query - The query to send to Qwen
 * @param planMode - Whether to use Plan Mode (default: true)
 * @returns Promise resolving to AIResponse
 *
 * @example
 * ```typescript
 * const result = await queryQwen('Optimize this algorithm', true);
 * console.log(result.response);
 * ```
 */
export async function queryQwen(
  query: string,
  planMode = true
): Promise<AIResponse> {
  const startTime = Date.now();

  // ✅ Security: Validate input before processing
  try {
    validateQuery(query);
  } catch (error) {
    return {
      provider: 'qwen',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query'
    };
  }

  const timeout = planMode ? QWEN_TIMEOUTS.plan : QWEN_TIMEOUTS.normal;

  try {
    // Use retry mechanism for resilience
    return await withRetry(
      () => executeQwenQuery(query, planMode, timeout),
      {
        maxAttempts: config.retry.maxAttempts,
        backoffBase: config.retry.backoffBase,
        onRetry: (attempt, error) => {
          console.error(`[Qwen] Retry attempt ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract only the essential error message (first 200 chars)
    const shortError = errorMessage.includes('Unknown argument')
      ? 'Qwen CLI: Invalid command format'
      : errorMessage.slice(0, 200);

    return {
      provider: 'qwen',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: shortError
    };
  }
}
