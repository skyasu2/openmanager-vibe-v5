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
import { withMemoryGuard } from '../middlewares/memory-guard.js';
import { safeStringConvert } from '../utils/buffer.js';
import { createErrorResponse } from '../utils/error-handler.js';

const execFileAsync = promisify(execFile);

/**
 * Execute Gemini CLI query (internal implementation)
 * @internal
 */
async function executeGeminiQuery(
  query: string,
  model: string,
  timeout: number,
  onProgress?: ProgressCallback
): Promise<AIResponse> {
  const startTime = Date.now();

  // Early response (v3.8.0): Send immediate initial response if enabled
  if (config.earlyResponse.enabled && onProgress) {
    onProgress('gemini', config.earlyResponse.message, 0);
  }

  // Progress notification: Starting
  if (onProgress) {
    onProgress('gemini', `Gemini (${model}) 사고 시작...`, 0);
  }

  // Progress notification interval (v3.8.0): Configurable interval
  const progressInterval = setInterval(() => {
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('gemini', `Gemini (${model}) 분석 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }
  }, config.progress.interval);

  try {
    // Execute gemini CLI with model parameter (OAuth authenticated)
    // ✅ Security: Using execFile with argument array prevents command injection
    // ✅ Correct syntax: query as positional argument, then --model flag
    const result = await withTimeout(
      execFileAsync('gemini', [query, '--model', model], {
        maxBuffer: config.maxBuffer,
        cwd: config.cwd
      }),
      timeout,
      `Gemini (${model}) timeout after ${Math.floor(timeout / 1000)}s`
    );

    clearInterval(progressInterval);

    // Progress notification: Completed
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('gemini', `Gemini (${model}) 완료 (${Math.floor(elapsed / 1000)}초)`, elapsed);
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
 * Query Gemini AI with automatic retry on failure
 * Supports model fallback on 429 quota exceeded
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
      stderr: undefined,
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query'
    };
  }

  // v1.6.0 Regression: Use simple, verified timeout (no complexity detection)
  const baseTimeout = config.gemini.timeout;

  try {
    // ✅ Unified Memory Management: withMemoryGuard applies to all AIs
    // - Pre-check: Reject if heap >= 90%
    // - Post-log: Success/failure
    return await withMemoryGuard(
      'Gemini',
      async () => {
        // Try each model in fallback order
        const models = config.gemini.models;
        const errors: string[] = [];

        for (let i = 0; i < models.length; i++) {
          const model = models[i];
          const isLastModel = i === models.length - 1;

          try {
            // Use retry mechanism for resilience (per model)
            const result = await withRetry(
              () => executeGeminiQuery(query, model, baseTimeout, onProgress),
              {
                maxAttempts: config.retry.maxAttempts,
                backoffBase: config.retry.backoffBase,
                onRetry: (attempt, error) => {
                  console.error(`[Gemini ${model}] Retry attempt ${attempt}: ${error.message}`);
                },
              }
            );

            // Success
            return result;

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
      
          // Check if 429 quota exceeded
          const is429 = errorMessage.toLowerCase().includes('429') ||
                        errorMessage.toLowerCase().includes('quota exceeded') ||
                        errorMessage.toLowerCase().includes('rate limit');

          if (is429 && !isLastModel) {
            // 429 error and more models available → try next model
            console.warn(`[Gemini] ${model} quota exceeded, trying next model: ${models[i + 1]}`);
            errors.push(`${model}: quota exceeded`);
            
            if (onProgress) {
              onProgress('gemini', `${model} quota 초과, ${models[i + 1]} 시도 중...`, Date.now() - startTime);
            }
            
            continue; // Try next model
          }

          // Other error or last model failed
          const shortError = errorMessage.includes('timeout')
            ? `Gemini timeout (${Math.floor(baseTimeout / 1000)}s)`
            : errorMessage.slice(0, 200);
          
          errors.push(`${model}: ${shortError}`);

          // If last model, return error with all attempts
          if (isLastModel) {
            // ✅ DRY: Use centralized error handler
            return createErrorResponse(
              'gemini',
              error,
              startTime,
              `모든 모델 실패: ${errors.join('; ')}`
            );
          }

          // If not 429, don't fallback
            if (!is429) {
              // ✅ DRY: Use centralized error handler
              return createErrorResponse('gemini', error, startTime, shortError);
            }
          }
        }

        // Should not reach here, but handle just in case
        return {
          provider: 'gemini',
          response: '',
          stderr: undefined,
          responseTime: Date.now() - startTime,
          success: false,
          error: 'Unexpected error in model fallback'
        };
      },
      {
        enablePostCheck: config.memory.enablePostCheck,
        spikeThreshold: config.memory.spikeThreshold,
        forceGcOnCritical: config.memory.forceGcOnCritical,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // ✅ DRY: Use centralized error handler
    return createErrorResponse('gemini', error, startTime, errorMessage.slice(0, 200));
  }
}
