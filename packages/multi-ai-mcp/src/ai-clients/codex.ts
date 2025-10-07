/**
 * Codex AI Client
 *
 * Executes installed `codex` CLI from WSL
 * No API calls - uses local authentication
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse, ProgressCallback } from '../types.js';
import { withTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';
import { withMemoryGuard } from '../middlewares/memory-guard.js';
import { safeStringConvert } from '../utils/buffer.js';
import { createErrorResponse } from '../utils/error-handler.js';

const execFileAsync = promisify(execFile);

/**
 * Execute Codex CLI query (internal implementation)
 * @internal
 */
async function executeCodexQuery(query: string, timeout: number, onProgress?: ProgressCallback): Promise<AIResponse> {
  const startTime = Date.now();

  // Progress notification: Starting
  if (onProgress) {
    onProgress('codex', 'Codex 실행 시작...', 0);
  }

  // Progress notification interval (every 10 seconds)
  const progressInterval = setInterval(() => {
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('codex', `Codex 작업 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }
  }, 10000);

  try {
    // Execute codex CLI (already installed and authenticated in WSL)
    // ✅ Security: Using execFile with argument array prevents command injection
    const result = await withTimeout(
      execFileAsync('codex', ['exec', query], {
        maxBuffer: config.maxBuffer,
        cwd: config.cwd
      }),
      timeout,
      `Codex timeout after ${timeout}ms`
    );

    clearInterval(progressInterval);

    // Progress notification: Completed
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('codex', `Codex 완료 (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }

    // Extract tokens from output
    const tokensMatch = result.stdout.match(/tokens used: (\d+)/);
    const tokens = tokensMatch ? parseInt(tokensMatch[1]) : undefined;

    // Extract actual response (remove metadata)
    const response = result.stdout
      .split('\n')
      .filter(line => !line.includes('workdir:') && !line.includes('model:') && !line.includes('tokens used:'))
      .join('\n')
      .trim();

    return {
      provider: 'codex',
      response,
      stderr: result.stderr || undefined,
      tokens,
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
 * Query Codex AI with automatic retry on failure
 *
 * @param query - The query to send to Codex
 * @param onProgress - Optional progress callback for status updates
 * @returns Promise resolving to AIResponse
 *
 * @example
 * ```typescript
 * const result = await queryCodex('Analyze this code for bugs');
 * console.log(result.response);
 * ```
 */
export async function queryCodex(query: string, onProgress?: ProgressCallback): Promise<AIResponse> {
  const startTime = Date.now();

  // ✅ Security: Validate input before processing
  try {
    validateQuery(query);
  } catch (error) {
    return {
      provider: 'codex',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query'
    };
  }

  // v1.6.0 Regression: Use simple, verified timeout (no complexity detection)
  const baseTimeout = config.codex.timeout;

  try {
    // ✅ Unified Memory Management: withMemoryGuard applies to all AIs
    // - Pre-check: Reject if heap >= 90%
    // - Post-log: Success/failure
    const result = await withMemoryGuard('Codex', async () => {
      // Use retry mechanism for resilience
      return withRetry(
        () => executeCodexQuery(query, baseTimeout, onProgress),
        {
          maxAttempts: config.retry.maxAttempts,
          backoffBase: config.retry.backoffBase,
          onRetry: (attempt, error) => {
            console.error(`[Codex] Retry attempt ${attempt}: ${error.message}`);
          },
        }
      );
    });

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract concise error message
    const shortError = errorMessage.includes('timeout')
      ? `Codex timeout (${Math.floor(baseTimeout / 1000)}s)`
      : errorMessage.slice(0, 200);

    // ✅ DRY: Use centralized error handler
    return createErrorResponse('codex', error, startTime, shortError);
  }
}
