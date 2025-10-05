/**
 * Adaptive Timeout Management
 *
 * Based on codex-wrapper.sh logic
 * P95 response time + 1.67x safety coefficient
 */

import type { QueryComplexity, TimeoutConfig } from '../types.js';

export function detectQueryComplexity(query: string): QueryComplexity {
  const length = query.length;

  if (length < 50) {
    return 'simple';
  } else if (length < 200) {
    return 'medium';
  } else {
    return 'complex';
  }
}

export function getAdaptiveTimeout(
  complexity: QueryComplexity,
  config: TimeoutConfig
): number {
  return config[complexity];
}

export function calculateRetryTimeout(
  originalTimeout: number,
  attempt: number
): number {
  // 50% increase per retry
  return Math.floor(originalTimeout * (1 + 0.5 * attempt));
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    // ✅ Always clear timeout to prevent memory leak
    clearTimeout(timeoutId);
  });
}
