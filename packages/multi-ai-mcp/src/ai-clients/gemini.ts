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
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

const GEMINI_TIMEOUT = 30000; // 30 seconds (avg response: 5s)

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
