/**
 * Timeout Utilities
 *
 * v1.6.0 Regression: Simplified timeout management
 * - No complexity detection (removed over-engineering)
 * - Direct timeout values from config
 * - Goal: Get answers reliably, not optimize timeout
 */

/**
 * Calculate retry timeout with exponential backoff
 * 50% increase per retry attempt
 */
export function calculateRetryTimeout(
  originalTimeout: number,
  attempt: number
): number {
  // 50% increase per retry
  return Math.floor(originalTimeout * (1 + 0.5 * attempt));
}

/**
 * Wrap a promise with a timeout
 * Rejects if the promise doesn't resolve within timeoutMs
 */
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
