/**
 * Gemini AI Client
 *
 * Executes installed `gemini` CLI from WSL
 * OAuth authenticated, no API costs
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse } from '../types.js';
import { withTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

const GEMINI_TIMEOUT = 30000; // 30 seconds (avg response: 5s)

/**
 * Execute Gemini CLI query (internal implementation)
 * @internal
 */
async function executeGeminiQuery(query: string): Promise<AIResponse> {
  const startTime = Date.now();

  // Execute gemini CLI (OAuth authenticated)
  // ✅ Security: Using execFile with argument array prevents command injection
  const result = await withTimeout(
    execFileAsync('gemini', [query], {
      maxBuffer: config.maxBuffer,
      cwd: config.cwd
    }),
    GEMINI_TIMEOUT,
    'Gemini timeout after 30s'
  );

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
}

/**
 * Query Gemini AI with automatic retry on failure
 *
 * @param query - The query to send to Gemini
 * @returns Promise resolving to AIResponse
 *
 * @example
 * ```typescript
 * const result = await queryGemini('Review this architecture design');
 * console.log(result.response);
 * ```
 */
export async function queryGemini(query: string): Promise<AIResponse> {
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
      () => executeGeminiQuery(query),
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
      ? 'Gemini timeout (30s)'
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
