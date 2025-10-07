/**
 * Timeout Management - v1.6.1
 *
 * Simple timeout management with increased safety margins.
 * No complexity detection - single timeout per AI.
 */

/**
 * Calculate retry timeout with exponential backoff
 * 50% increase per retry attempt
 *
 * @param originalTimeout - Original timeout in milliseconds
 * @param attempt - Retry attempt number (0-indexed)
 * @returns Adjusted timeout in milliseconds
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
 *
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns Promise that rejects on timeout
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
