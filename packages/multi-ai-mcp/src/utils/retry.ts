/**
 * Retry utility with exponential backoff
 *
 * Implements automatic retry mechanism for AI CLI calls
 * with exponential backoff to handle transient failures
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (including initial attempt) */
  maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff */
  backoffBase: number;
  /** Callback invoked on retry attempts */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Check if an error is fatal and should not be retried
 *
 * Fatal errors include:
 * - ENOENT: CLI binary not found (installation issue)
 * - Authentication failures: Invalid API keys
 * - Invalid arguments: Malformed input
 * - MCP timeout: Already exceeded maximum wait time
 *
 * @param error - The error to check
 * @returns true if error is fatal and should not be retried
 */
export function isFatalError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const errorCode = (error as NodeJS.ErrnoException).code;

  // File not found errors (CLI not installed)
  if (errorCode === 'ENOENT') {
    return true;
  }

  // Authentication failures (invalid API keys)
  if (
    message.includes('unauthorized') ||
    message.includes('authentication failed') ||
    message.includes('invalid api key') ||
    message.includes('api key not found') ||
    message.includes('401') ||
    message.includes('403 forbidden')
  ) {
    return true;
  }

  // Invalid arguments (malformed input)
  if (
    message.includes('invalid argument') ||
    message.includes('invalid input') ||
    message.includes('malformed') ||
    message.includes('syntax error')
  ) {
    return true;
  }

  // MCP timeout (already exceeded maximum wait time)
  if (
    message.includes('mcp timeout') ||
    message.includes('operation timed out') ||
    message.includes('deadline exceeded')
  ) {
    return true;
  }

  // Network errors that are likely permanent
  if (
    message.includes('network unreachable') ||
    message.includes('host not found') ||
    message.includes('dns lookup failed')
  ) {
    return true;
  }

  return false;
}

/**
 * Execute a function with automatic retry on failure
 *
 * Uses exponential backoff with jitter to prevent thundering herd:
 * - Base delay: backoffBase * 2^(attempt-1)
 * - Jitter: ±50% randomization (0.5x to 1.5x base delay)
 * - Max cap: 30 seconds
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's result
 * @throws The last error if all attempts fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => queryCodex(query),
 *   {
 *     maxAttempts: 2,
 *     backoffBase: 1000,
 *     onRetry: (attempt, error) => console.error(`Retry ${attempt}: ${error.message}`),
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is fatal and should not be retried
      if (isFatalError(lastError)) {
        throw lastError;
      }

      // Don't retry if this was the last attempt
      if (attempt >= options.maxAttempts) {
        break;
      }

      // Calculate exponential backoff delay: base * 2^(attempt-1)
      const baseDelay = options.backoffBase * Math.pow(2, attempt - 1);

      // Add jitter (±50% randomization) to prevent thundering herd
      // If 10 instances fail simultaneously, jitter distributes their retries across time
      const jitteredDelay = baseDelay * (0.5 + Math.random() * 0.5);

      // Cap at 30 seconds to prevent excessive delays
      const delay = Math.min(jitteredDelay, 30000);

      // Invoke retry callback
      options.onRetry?.(attempt, lastError);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed, throw the last error
  throw lastError!;
}

/**
 * Default retry options for AI CLI calls
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 2, // Initial attempt + 1 retry
  backoffBase: 1000, // 1 second base delay
};
