/**
 * Configuration management for Multi-AI MCP Server
 *
 * Environment variables:
 * - MULTI_AI_CWD: Working directory for AI CLI execution (default: process.cwd())
 * - MULTI_AI_MAX_BUFFER: Max buffer size for CLI output (default: 10MB)
 * - MULTI_AI_CODEX_TIMEOUT_SIMPLE: Codex timeout for simple queries (default: 30s)
 * - MULTI_AI_CODEX_TIMEOUT_MEDIUM: Codex timeout for medium queries (default: 90s)
 * - MULTI_AI_CODEX_TIMEOUT_COMPLEX: Codex timeout for complex queries (default: 120s)
 * - MULTI_AI_GEMINI_TIMEOUT: Gemini timeout (default: 30s)
 * - MULTI_AI_QWEN_TIMEOUT_NORMAL: Qwen normal mode timeout (default: 30s)
 * - MULTI_AI_QWEN_TIMEOUT_PLAN: Qwen plan mode timeout (default: 60s)
 */

interface MultiAIConfig {
  /** Working directory for AI CLI execution */
  cwd: string;
  /** Maximum buffer size for CLI output (bytes) */
  maxBuffer: number;
  /** Codex timeouts by complexity */
  codex: {
    simple: number;
    medium: number;
    complex: number;
  };
  /** Gemini timeout */
  gemini: {
    timeout: number;
  };
  /** Qwen timeouts by mode */
  qwen: {
    normal: number;
    plan: number;
  };
}

/**
 * Get configuration from environment variables with defaults
 */
export function getConfig(): MultiAIConfig {
  return {
    cwd: process.env.MULTI_AI_CWD || process.cwd(),
    maxBuffer: parseInt(process.env.MULTI_AI_MAX_BUFFER || '10485760', 10), // 10MB
    codex: {
      simple: parseInt(process.env.MULTI_AI_CODEX_TIMEOUT_SIMPLE || '30000', 10),
      medium: parseInt(process.env.MULTI_AI_CODEX_TIMEOUT_MEDIUM || '90000', 10),
      complex: parseInt(process.env.MULTI_AI_CODEX_TIMEOUT_COMPLEX || '120000', 10),
    },
    gemini: {
      timeout: parseInt(process.env.MULTI_AI_GEMINI_TIMEOUT || '30000', 10),
    },
    qwen: {
      normal: parseInt(process.env.MULTI_AI_QWEN_TIMEOUT_NORMAL || '30000', 10),
      plan: parseInt(process.env.MULTI_AI_QWEN_TIMEOUT_PLAN || '60000', 10),
    },
  };
}

/**
 * Global config instance
 * Can be overridden for testing or custom configurations
 */
export let config: MultiAIConfig = getConfig();

/**
 * Update configuration (useful for testing or runtime configuration)
 */
export function setConfig(newConfig: Partial<MultiAIConfig>): void {
  config = { ...config, ...newConfig };
}
