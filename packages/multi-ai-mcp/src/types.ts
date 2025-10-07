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
 *
 * v3.5.0: Added stderr field to capture AI CLI warnings and error details
 */
export interface AIResponse {
  provider: AIProvider;
  response: string;
  stderr?: string;
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


