/**
 * Safe Buffer to String conversion utilities
 *
 * Prevents OOM errors by limiting converted size
 */

/**
 * Maximum characters to convert from Buffer/string to String
 * Prevents OOM errors when AI outputs very long responses before error
 */
const MAX_ERROR_OUTPUT_CHARS = 10000; // 10KB for error messages

/**
 * Safely convert Buffer or string to trimmed string with size limit
 *
 * @param data - Buffer or string to convert
 * @param maxChars - Maximum characters to convert (default: 10000)
 * @returns Trimmed string, limited to maxChars
 *
 * @example
 * ```typescript
 * const stdout = safeStringConvert(errorOutput.stdout);
 * const stderr = safeStringConvert(errorOutput.stderr, 5000);
 * ```
 */
export function safeStringConvert(
  data: string | Buffer | undefined,
  maxChars: number = MAX_ERROR_OUTPUT_CHARS
): string {
  if (!data) {
    return '';
  }

  // Convert Buffer to string (entire buffer for now)
  const str = typeof data === 'string' ? data : data.toString('utf8');

  // Limit size and trim
  return str.length > maxChars
    ? str.slice(0, maxChars).trim() + '... (truncated)'
    : str.trim();
}
