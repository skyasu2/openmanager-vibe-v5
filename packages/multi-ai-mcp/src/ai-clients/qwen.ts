/**
 * Qwen AI Client
 *
 * Executes installed `qwen` CLI from WSL
 * OAuth authenticated, supports Plan Mode
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse, ProgressCallback } from '../types.js';
import { withTimeout, detectQueryComplexity, getAdaptiveTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';
import { checkMemoryBeforeQuery, logMemoryUsage } from '../utils/memory.js';

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
    // Execute qwen CLI with -p flag (CLI argument method)
    // ✅ Security: Using execFile with argument array prevents command injection
    // ✅ Performance: CLI argument method is faster than stdin (5.4s vs 5.6s)
    // ✅ Consistency: Same pattern as Codex and Gemini
    // ✅ Memory: Set Node.js heap size to 2GB to prevent OOM
    const result = await withTimeout(
      execFileAsync('qwen', ['-p', query], {
        maxBuffer: config.maxBuffer,
        cwd: config.cwd,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=2048', // 2GB heap (default: ~1.4GB)
        },
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

  // ✅ Memory: Check heap usage before query execution
  try {
    checkMemoryBeforeQuery('Qwen');
  } catch (error) {
    return {
      provider: 'qwen',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Memory check failed'
    };
  }

  // Detect query complexity and use adaptive timeout (same logic as Codex)
  const complexity = detectQueryComplexity(query);
  const baseTimeout = getAdaptiveTimeout(complexity, config.qwen);

  try {
    // Use retry mechanism for resilience
    const result = await withRetry(
      () => executeQwenQuery(query, planMode, baseTimeout, onProgress),
      {
        maxAttempts: config.retry.maxAttempts,
        backoffBase: config.retry.backoffBase,
        onRetry: (attempt, error) => {
          console.error(`[Qwen] Retry attempt ${attempt}: ${error.message}`);
        },
      }
    );

    // Log memory usage after successful query
    logMemoryUsage('Post-query Qwen');
    return result;

  } catch (error) {
    // Log memory usage even on failure (helps diagnose OOM)
    logMemoryUsage('Post-query Qwen (failed)');
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract concise error message
    const shortError = errorMessage.includes('Unknown argument')
      ? 'Qwen CLI: Invalid command format'
      : errorMessage.includes('timeout')
      ? `Qwen timeout (${Math.floor(baseTimeout / 1000)}s, ${complexity} query)`
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
