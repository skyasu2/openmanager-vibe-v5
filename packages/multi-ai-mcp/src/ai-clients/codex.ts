/**
 * Codex AI Client
 *
 * Executes installed `codex` CLI from WSL
 * No API calls - uses local authentication
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AIResponse } from '../types.js';
import { withTimeout, detectQueryComplexity, getAdaptiveTimeout } from '../utils/timeout.js';
import { validateQuery } from '../utils/validation.js';
import { withRetry } from '../utils/retry.js';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

const CODEX_TIMEOUTS = {
  simple: 30000,   // 30 seconds
  medium: 90000,   // 90 seconds
  complex: 120000  // 120 seconds
};

/**
 * Execute Codex CLI query (internal implementation)
 * @internal
 */
async function executeCodexQuery(query: string, timeout: number): Promise<AIResponse> {
  const startTime = Date.now();

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
    tokens,
    responseTime: Date.now() - startTime,
    success: true
  };
}

/**
 * Query Codex AI with automatic retry on failure
 *
 * @param query - The query to send to Codex
 * @returns Promise resolving to AIResponse
 *
 * @example
 * ```typescript
 * const result = await queryCodex('Analyze this code for bugs');
 * console.log(result.response);
 * ```
 */
export async function queryCodex(query: string): Promise<AIResponse> {
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

  const complexity = detectQueryComplexity(query);
  const baseTimeout = getAdaptiveTimeout(complexity, CODEX_TIMEOUTS);

  try {
    // Use retry mechanism for resilience
    return await withRetry(
      () => executeCodexQuery(query, baseTimeout),
      {
        maxAttempts: config.retry.maxAttempts,
        backoffBase: config.retry.backoffBase,
        onRetry: (attempt, error) => {
          console.error(`[Codex] Retry attempt ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract concise error message
    const shortError = errorMessage.includes('timeout')
      ? `Codex timeout (${Math.floor(baseTimeout / 1000)}s)`
      : errorMessage.slice(0, 200);

    return {
      provider: 'codex',
      response: '',
      responseTime: Date.now() - startTime,
      success: false,
      error: shortError
    };
  }
}
