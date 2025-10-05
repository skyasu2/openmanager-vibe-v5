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
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

const CODEX_TIMEOUTS = {
  simple: 30000,   // 30 seconds
  medium: 90000,   // 90 seconds
  complex: 120000  // 120 seconds
};

export async function queryCodex(
  query: string,
  attempt = 1,
  maxRetries = 2
): Promise<AIResponse> {
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
  const timeout = attempt > 1 ? Math.floor(baseTimeout * (1 + 0.5 * (attempt - 1))) : baseTimeout;

  try {
    // Execute codex CLI (already installed and authenticated in WSL)
    // ✅ Security: Using execFile with argument array prevents command injection
    const result = await withTimeout(
      execFileAsync('codex', ['exec', query], {
        maxBuffer: config.maxBuffer,
        cwd: config.cwd
      }),
      timeout,
      `Codex timeout after ${timeout}ms (attempt ${attempt})`
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Retry on timeout
    if (errorMessage.includes('timeout') && attempt < maxRetries) {
      console.error(`[Codex] Timeout on attempt ${attempt}, retrying...`);
      return queryCodex(query, attempt + 1, maxRetries);
    }

    // Extract concise error message
    const shortError = errorMessage.includes('timeout')
      ? `Codex timeout (${Math.floor(timeout / 1000)}s)`
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
