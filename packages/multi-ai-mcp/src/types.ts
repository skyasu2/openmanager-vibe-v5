/**
 * Multi-AI MCP Server Types
 *
 * OpenManager VIBE Project
 * WSL Environment Optimized
 */

export type AIProvider = 'codex' | 'gemini' | 'qwen';

export type QueryComplexity = 'simple' | 'medium' | 'complex';

export interface AIQueryRequest {
  query: string;
  includeCodex?: boolean;
  includeGemini?: boolean;
  includeQwen?: boolean;
  qwenPlanMode?: boolean;
}

export interface AIResponse {
  provider: AIProvider;
  response: string;
  tokens?: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

export interface MultiAIResult {
  query: string;
  timestamp: string;
  results: {
    codex?: AIResponse;
    gemini?: AIResponse;
    qwen?: AIResponse;
  };
  synthesis: {
    consensus: string[];
    conflicts: Conflict[];
    recommendation: string;
  };
  performance: {
    totalTime: number;
    successRate: number;
  };
}

export interface Conflict {
  issue: string;
  codexView?: string;
  geminiView?: string;
  qwenView?: string;
}

export interface TimeoutConfig {
  simple: number;
  medium: number;
  complex: number;
}

export interface AIClientConfig {
  name: AIProvider;
  command: string;
  timeouts: TimeoutConfig;
  retryEnabled: boolean;
  maxRetries: number;
}

export interface PerformanceStats {
  provider: AIProvider;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  avgTokens: number;
  timeoutRate: number;
}

/**
 * Progress notification callback
 * Used to send progress updates during long-running AI operations
 */
export type ProgressCallback = (provider: AIProvider, status: string, elapsed: number) => void;
