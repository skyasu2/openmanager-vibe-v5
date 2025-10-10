/**
 * Error handling utilities for AI clients
 *
 * Centralized error response creation to follow DRY principle
 * Part of MCP infrastructure layer (pure AI communication channel)
 */

import { safeStringConvert } from './buffer.js';
import type { AIResponse, AIProvider } from '../types.js';

/**
 * Create standardized error response from AI execution error
 *
 * This utility extracts stdout/stderr from Node.js execFile errors
 * and creates a consistent AIResponse object.
 *
 * @param provider - AI provider name ('codex' | 'gemini' | 'qwen')
 * @param error - Error object from AI execution
 * @param startTime - Execution start timestamp (Date.now())
 * @param errorMessage - Short error message to include
 * @returns Standardized AIResponse with error details
 *
 * @example
 * ```typescript
 * try {
 *   // AI execution
 * } catch (error) {
 *   return createErrorResponse('codex', error, startTime, 'Timeout');
 * }
 * ```
 */
export function createErrorResponse(
  provider: AIProvider,
  error: unknown,
  startTime: number,
  errorMessage: string
): AIResponse {
  // Extract stdout/stderr from error object (Node.js execFile error includes these)
  // ✅ Memory-safe: Use safeStringConvert to limit size and prevent OOM
  const errorOutput = error as { stdout?: string | Buffer; stderr?: string | Buffer };
  const stdout = safeStringConvert(errorOutput.stdout);
  const stderr = safeStringConvert(errorOutput.stderr) || errorMessage;

  return {
    provider,
    response: stdout,
    stderr: stderr || undefined,
    responseTime: Date.now() - startTime,
    success: false,
    error: errorMessage.slice(0, 200), // Limit error message length
  };
}
