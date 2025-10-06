/**
 * Gemini AI Client
 *
 * Executes installed `gemini` CLI from WSL
 * OAuth authenticated, no API costs
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
 * Execute Gemini CLI query (internal implementation)
 * @internal
 */
async function executeGeminiQuery(query: string, onProgress?: ProgressCallback): Promise<AIResponse> {
  const startTime = Date.now();

  // Progress notification: Starting
  if (onProgress) {
    onProgress('gemini', 'Gemini 사고 시작...', 0);
  }

  // Progress notification interval (every 10 seconds)
  const progressInterval = setInterval(() => {
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('gemini', `Gemini 분석 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }
  }, 10000);

  try {
    // Execute gemini CLI (OAuth authenticated)
    // ✅ Security: Using execFile with argument array prevents command injection
    const timeoutMs = config.gemini.timeout;
    const result = await withTimeout(
      execFileAsync('gemini', [query], {
        maxBuffer: config.maxBuffer,
        cwd: config.cwd
      }),
      timeoutMs,
      `Gemini timeout after ${Math.floor(timeoutMs / 1000)}s`
    );

    clearInterval(progressInterval);

    // Progress notification: Completed
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('gemini', `Gemini 완료 (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }

    // Clean response (remove OAuth/credential messages)
    const response = result.stdout
      .split('\n')
      .filter(line =>
        !line.includes('ImportProcessor') &&
        !line.includes('Loaded cached credentials') &&
        line.trim().length > 0
      )
      .join('\n')
      .trim();

    return {
      provider: 'gemini',
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
 * Query Gemini AI with automatic retry on failure
 *
 * @param query - The query to send to Gemini
 * @param onProgress - Optional progress callback for status updates
 * @returns Promise resolving to AIResponse
 *
 * @example
 * ```typescript
 * const result = await queryGemini('Review this architecture design');
 * console.log(result.response);
 * ```
 */
export async function queryGemini(query: string, onProgress?: ProgressCallback): Promise<AIResponse> {
  const startTime = Date.now();

  // ✅ Security: Validate input before processing
  try {
    validateQuery(query);
  } catch (error) {
    return {
      provider: 'gemini',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query'
    };
  }

  try {
    // Use retry mechanism for resilience
    return await withRetry(
      () => executeGeminiQuery(query, onProgress),
      {
        maxAttempts: config.retry.maxAttempts,
        backoffBase: config.retry.backoffBase,
        onRetry: (attempt, error) => {
          console.error(`[Gemini] Retry attempt ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract concise error message
    const shortError = errorMessage.includes('timeout')
      ? `Gemini timeout (${Math.floor(config.gemini.timeout / 1000)}s)`
      : errorMessage.slice(0, 200);

    return {
      provider: 'gemini',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: shortError
    };
  }
}
