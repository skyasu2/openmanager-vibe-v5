/**
 * Stream Error Constants (SSOT)
 *
 * Shared constants for stream error handling between:
 * - API Proxy (server-side): encodes errors into stream
 * - Client Hooks: detects errors from stream content
 *
 * @created 2026-01-20
 */

// ============================================================================
// Error Markers
// ============================================================================

/**
 * Stream error marker prefix used by API proxy to encode errors
 * Format: "\n\n⚠️ 오류: {errorMessage}"
 */
export const STREAM_ERROR_MARKER = '⚠️ 오류:';

/**
 * Patterns indicating Cold Start or timeout-related errors
 * These errors trigger the ColdStartErrorBanner with auto-retry
 */
export const COLD_START_ERROR_PATTERNS = [
  'Stream error',
  'timeout',
  '504',
  'ECONNRESET',
  'fetch failed',
  'ETIMEDOUT',
  'socket hang up',
] as const;

// ============================================================================
// Error Detection
// ============================================================================

/**
 * Regex pattern to extract error message from stream content
 * Matches: "\n\n⚠️ 오류: {message}" or "^⚠️ 오류: {message}"
 * Non-greedy to avoid false positives with legitimate content
 */
export const STREAM_ERROR_REGEX = new RegExp(
  `(?:^|\\n\\n)${STREAM_ERROR_MARKER}\\s*([^\\n]+)`,
  'm'
);

/**
 * Extracts error message from stream content if present
 * Returns null if no error pattern found
 *
 * @example
 * extractStreamError("\n\n⚠️ 오류: Stream error") // "Stream error"
 * extractStreamError("Normal AI response") // null
 */
export function extractStreamError(content: string): string | null {
  if (!content?.trim()) return null;

  const match = content.match(STREAM_ERROR_REGEX);
  if (!match?.[1]) return null;

  const errorMessage = match[1].trim();
  if (!errorMessage) return null;

  // Check if it's a cold start error for special handling
  const isColdStartError = COLD_START_ERROR_PATTERNS.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );

  // Return error message regardless of type (cold start check is for caller's use)
  return isColdStartError || content.startsWith(`\n\n${STREAM_ERROR_MARKER}`)
    ? errorMessage
    : errorMessage;
}

/**
 * Checks if an error message indicates a Cold Start error
 */
export function isColdStartRelatedError(errorMessage: string): boolean {
  return COLD_START_ERROR_PATTERNS.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}
