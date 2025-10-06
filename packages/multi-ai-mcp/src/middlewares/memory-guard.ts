/**
 * Memory Guard Middleware
 *
 * Unified memory management for all AI clients
 * - Pre-query memory check (90% threshold)
 * - Post-query memory logging
 * - Consistent protection across Codex, Gemini, Qwen
 */

import { checkMemoryBeforeQuery, logMemoryUsage } from '../utils/memory.js';

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
export async function withMemoryGuard<T>(provider: string, operation: () => Promise<T>): Promise<T> {
  // Pre-check: Reject query if memory is critical (>=90%)
  // Throws error with recommendation to wait 10-30 seconds
  checkMemoryBeforeQuery(provider);

  try {
    // Execute operation
    const result = await operation();

    // Post-log: Success
    logMemoryUsage(`Post-query ${provider}`);

    return result;
  } catch (error) {
    // Post-log: Failure (helps diagnose OOM)
    logMemoryUsage(`Post-query ${provider} (failed)`);

    // Re-throw original error
    throw error;
  }
}
