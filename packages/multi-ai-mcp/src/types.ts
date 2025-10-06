/**
 * Multi-AI MCP Server Types
 *
 * v3.0.0 - Infrastructure layer only
 * OpenManager VIBE Project
 * WSL Environment Optimized
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'codex' | 'gemini' | 'qwen';

/**
 * AI response structure
 */
export interface AIResponse {
  provider: AIProvider;
  response: string;
  tokens?: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

/**
 * Progress notification callback
 * Used to send progress updates during long-running AI operations
 */
export type ProgressCallback = (provider: AIProvider, status: string, elapsed: number) => void;

/**
 * Query complexity levels for adaptive timeout
 */
export type QueryComplexity = 'simple' | 'medium' | 'complex';

/**
 * Timeout configuration for query complexity levels
 */

export interface TimeoutConfig {
  simple: number;
  medium: number;
  complex: number;
}
