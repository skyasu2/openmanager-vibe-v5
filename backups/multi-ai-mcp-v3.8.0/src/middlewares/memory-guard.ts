/**
 * Memory Guard Middleware
 *
 * Unified memory management for all AI clients
 * - Pre-query memory check (90% threshold)
 * - Post-query memory logging
 * - Consistent protection across Codex, Gemini, Qwen
 */

import {
  checkMemoryAfterQuery,
  checkMemoryBeforeQuery,
  getMemoryUsage,
  logMemoryUsage,
  type MemoryHealthOptions,
} from '../utils/memory.js';

/**
 * Optional configuration for memory guard behaviour
 */
export interface MemoryGuardOptions extends MemoryHealthOptions {
  /** Enable post-query memory health check */
  enablePostCheck?: boolean;
}

/**
 * Execute operation with memory protection
 *
 * Applies consistent memory management to all AI clients:
 * 1. Pre-check: Reject query if heap usage >= 90%
 * 2. Execute: Run the AI query operation
 * 3. Post-log: Log memory usage (success or failure)
 *
 * @param provider - AI provider name (for logging)
 * @param operation - Async operation to execute
 * @returns Operation result
 * @throws {Error} If memory is critical (>90%) or operation fails
 *
 * @example
 * ```typescript
 * const result = await withMemoryGuard('Codex', async () => {
 *   return executeCodexQuery(query, timeout, onProgress);
 * });
 * ```
 */
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>,
  options: MemoryGuardOptions = {}
): Promise<T> {
  let beforeHeapPercent: number | undefined;

  try {
    // Pre-check: Reject query if memory is critical (>=90%)
    // Throws error with recommendation to wait 10-30 seconds
    try {
      checkMemoryBeforeQuery(provider);

      if (options.enablePostCheck) {
        beforeHeapPercent = getMemoryUsage().heapPercent;
      }
    } catch (error) {
      // Log memory state when pre-check fails (diagnostic info)
      logMemoryUsage(`Pre-check failed ${provider}`);
      throw error;
    }

    // Execute operation
    const result = await operation();

    if (options.enablePostCheck) {
      const { enablePostCheck: _ignored, ...healthOptions } = options;
      const isHealthy = checkMemoryAfterQuery(provider, beforeHeapPercent, healthOptions);

      if (!isHealthy) {
        console.warn(
          `[Memory Guard] ${provider} completed with memory warnings. ` +
          `Monitor queries or adjust thresholds if this persists.`
        );
      }
    }

    return result;
  } finally {
    // Post-log: Always log memory usage (success or failure)
    // Provides baseline for analysis regardless of outcome
    logMemoryUsage(`Post-query ${provider}`);
  }
}
