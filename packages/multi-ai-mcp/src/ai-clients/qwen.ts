/**
 * Qwen AI Client
 *
 * Executes installed `qwen` CLI from WSL
 * OAuth authenticated, supports Plan Mode
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse, ProgressCallback } from '../types.js';
import { withTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

/**
 * Execute Qwen CLI query (internal implementation)
 * @internal
 */
async function executeQwenQuery(query: string, planMode: boolean, timeout: number, onProgress?: ProgressCallback): Promise<AIResponse> {
  const startTime = Date.now();

  // Progress notification: Starting
  if (onProgress) {
    const mode = planMode ? 'Plan' : 'Normal';
    onProgress('qwen', `Qwen ${mode} 모드 시작...`, 0);
  }

  // Progress notification interval (every 10 seconds)
  const progressInterval = setInterval(() => {
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      const mode = planMode ? 'Plan' : 'Normal';
      onProgress('qwen', `Qwen ${mode} 실행 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }
  }, 10000);

  try {
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

    clearInterval(progressInterval);

    // Progress notification: Completed
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      const mode = planMode ? 'Plan' : 'Normal';
      onProgress('qwen', `Qwen ${mode} 완료 (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }

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
  } catch (error) {
    // Ensure interval is cleared on error
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Query Qwen AI with automatic retry on failure
 *
 * @param query - The query to send to Qwen
 * @param planMode - Whether to use Plan Mode (default: true)
 * @param onProgress - Optional progress callback for status updates
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
  planMode = true,
  onProgress?: ProgressCallback
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

  const timeout = planMode ? config.qwen.plan : config.qwen.normal;

  try {
    // Use retry mechanism for resilience
    return await withRetry(
      () => executeQwenQuery(query, planMode, timeout, onProgress),
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
