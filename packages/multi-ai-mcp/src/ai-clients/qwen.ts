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
import { withMemoryGuard } from '../middlewares/memory-guard.js';
import { safeStringConvert } from '../utils/buffer.js';
import { createErrorResponse } from '../utils/error-handler.js';

const execFileAsync = promisify(execFile);

/**
 * Rate Limit Protection
 * Qwen API has 60 RPM / 2,000 RPD limits
 */
let lastQwenQueryTime = 0;
const QWEN_MIN_INTERVAL_MS = 1000; // 1 second between queries

/**
 * Sleep utility for rate limit delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute Qwen CLI query (internal implementation)
 * @internal
 */
async function executeQwenQuery(query: string, planMode: boolean, timeout: number, onProgress?: ProgressCallback): Promise<AIResponse> {
  // Rate Limit Protection: Ensure minimum 1s interval between queries
  const now = Date.now();
  const timeSinceLastQuery = now - lastQwenQueryTime;

  if (timeSinceLastQuery < QWEN_MIN_INTERVAL_MS) {
    const waitTime = QWEN_MIN_INTERVAL_MS - timeSinceLastQuery;
    console.log(`[Qwen] Rate limit protection: waiting ${waitTime}ms...`);
    await sleep(waitTime);
  }

  lastQwenQueryTime = Date.now();
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
    // Execute qwen CLI with -p flag (CLI argument method)
    // ✅ Security: Using execFile with argument array prevents command injection
    // ✅ Performance: CLI argument method is faster than stdin (5.4s vs 5.6s)
    // ✅ Consistency: Same pattern as Codex and Gemini
    // ✅ Memory: 2GB heap managed at MCP server level (unified policy)
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
      stderr: result.stderr || undefined,
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
      stderr: undefined,
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query'
    };
  }

  // v1.6.0 Regression: Use simple, verified timeout (no complexity detection)
  // Plan Mode is always enabled by default (planMode=true), timeout is sufficient
  const baseTimeout = config.qwen.timeout;

  try {
    // ✅ Unified Memory Management: withMemoryGuard applies to all AIs
    // - Pre-check: Reject if heap >= 90%
    // - Post-log: Success/failure
    const result = await withMemoryGuard('Qwen', async () => {
      // Use retry mechanism for resilience
      return withRetry(
        () => executeQwenQuery(query, planMode, baseTimeout, onProgress),
        {
          maxAttempts: config.retry.maxAttempts,
          backoffBase: config.retry.backoffBase,
          onRetry: (attempt, error) => {
            console.error(`[Qwen] Retry attempt ${attempt}: ${error.message}`);
          },
        }
      );
    });

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract concise error message
    const shortError = errorMessage.includes('Unknown argument')
      ? 'Qwen CLI: Invalid command format'
      : errorMessage.includes('timeout')
      ? `Qwen timeout (${Math.floor(baseTimeout / 1000)}s)`
      : errorMessage.slice(0, 200);

    // ✅ DRY: Use centralized error handler
    return createErrorResponse('qwen', error, startTime, shortError);
  }
}
