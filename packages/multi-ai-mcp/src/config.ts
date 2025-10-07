/**
 * Configuration management for Multi-AI MCP Server
 *
 * Environment variables:
 * - MULTI_AI_CWD: Working directory for AI CLI execution (default: process.cwd())
 * - MULTI_AI_MAX_BUFFER: Max buffer size for CLI output (default: 10MB)
 * - MULTI_AI_CODEX_TIMEOUT: Codex timeout in ms (default: 180s, 3min)
 * - MULTI_AI_GEMINI_TIMEOUT: Gemini timeout in ms (default: 300s, 5min)
 * - MULTI_AI_QWEN_TIMEOUT: Qwen timeout in ms (default: 300s, 5min)
 * - MULTI_AI_MCP_TIMEOUT: MCP request timeout in ms (default: 360s, 6min)
 * - MULTI_AI_ENABLE_PROGRESS: Enable progress notifications (default: true)
 * - MULTI_AI_DEBUG: Enable debug logging (default: false)
 * - MULTI_AI_MAX_RETRY_ATTEMPTS: Maximum retry attempts (default: 2)
 * - MULTI_AI_RETRY_BACKOFF_BASE: Retry backoff base in ms (default: 1000)
 *
 * Timeout Philosophy (v1.6.0 Regression):
 * - Simple, verified timeouts from v1.6.0 (worked well)
 * - No complexity detection (over-engineering removed)
 * - Goal: Get answers reliably, not optimize timeout
 * - Based on actual P95 response times + 50% safety margin
 *
 * Memory Management:
 * - Start with: node --max-old-space-size=512 dist/index.js (512MB heap)
 * - Critical threshold: 95%
 * - Warning threshold: 85%
 */

interface MultiAIConfig {
  /** Working directory for AI CLI execution */
  cwd: string;
  /** Maximum buffer size for CLI output (bytes) */
  maxBuffer: number;
  /** Codex timeout (single value, no complexity) */
  codex: {
    timeout: number;
  };
  /** Gemini timeout (single value, no complexity) */
  gemini: {
    timeout: number;
    models: string[]; // Fallback model list (priority order)
  };
  /** Qwen timeout (single value, no complexity) */
  qwen: {
    timeout: number;
  };
  /** MCP server configuration */
  mcp: {
    /** MCP request timeout in milliseconds */
    requestTimeout: number;
    /** Enable progress notifications to reset timeout */
    enableProgress: boolean;
  };
  /** Retry configuration */
  retry: {
    /** Maximum number of retry attempts (including initial) */
    maxAttempts: number;
    /** Base delay in milliseconds for exponential backoff */
    backoffBase: number;
  };
  /** Debug mode configuration */
  debug: {
    /** Enable debug logging to stderr */
    enabled: boolean;
  };
}

/**
 * Parse and validate integer from environment variable
 */
function parseIntWithValidation(
  envVar: string | undefined,
  defaultValue: number,
  min: number,
  max: number,
  varName: string
): number {
  const value = parseInt(envVar || String(defaultValue), 10);

  if (isNaN(value)) {
    throw new Error(
      `Invalid ${varName}: "${envVar}" is not a valid number. Using default: ${defaultValue}`
    );
  }

  if (value < min || value > max) {
    throw new Error(
      `Invalid ${varName}: ${value} is out of range [${min}, ${max}]. Using default: ${defaultValue}`
    );
  }

  return value;
}

/**
 * Get configuration from environment variables with defaults
 */
export function getConfig(): MultiAIConfig {
  return {
    cwd: process.env.MULTI_AI_CWD || process.cwd(),
    maxBuffer: parseIntWithValidation(
      process.env.MULTI_AI_MAX_BUFFER,
      10485760,
      1024 * 1024, // 1MB min
      100 * 1024 * 1024, // 100MB max
      'MULTI_AI_MAX_BUFFER'
    ),
    codex: {
      timeout: parseIntWithValidation(
        process.env.MULTI_AI_CODEX_TIMEOUT,
        180000, // 3min (P95: 54s + 50% margin, verified sufficient)
        1000, // 1s min
        600000, // 10min max
        'MULTI_AI_CODEX_TIMEOUT'
      ),
    },
    gemini: {
      timeout: parseIntWithValidation(
        process.env.MULTI_AI_GEMINI_TIMEOUT,
        300000, // 5min (P95: 64s + 3x margin, v1.6.0 verified)
        1000,
        600000,
        'MULTI_AI_GEMINI_TIMEOUT'
      ),
      // Fallback model list (priority order)
      // 429 quota exceeded → try next model
      // OAuth free tier: Pro (high quality) → Flash (fast) fallback
      models: process.env.MULTI_AI_GEMINI_MODELS
        ? process.env.MULTI_AI_GEMINI_MODELS.split(',')
        : ['gemini-2.5-pro', 'gemini-2.5-flash'],
    },
    qwen: {
      timeout: parseIntWithValidation(
        process.env.MULTI_AI_QWEN_TIMEOUT,
        300000, // 5min (Plan Mode support, v1.6.0 verified)
        1000,
        600000,
        'MULTI_AI_QWEN_TIMEOUT'
      ),
    },
    mcp: {
      requestTimeout: parseIntWithValidation(
        process.env.MULTI_AI_MCP_TIMEOUT,
        360000, // 6min (slightly longer than longest AI timeout: 5min)
        60000, // 1min min
        600000, // 10min max
        'MULTI_AI_MCP_TIMEOUT'
      ),
      enableProgress: process.env.MULTI_AI_ENABLE_PROGRESS !== 'false', // Default true
    },
    retry: {
      maxAttempts: parseIntWithValidation(
        process.env.MULTI_AI_MAX_RETRY_ATTEMPTS,
        2,
        1, // 최소 1번 (초기 시도)
        10, // 최대 10번
        'MULTI_AI_MAX_RETRY_ATTEMPTS'
      ),
      backoffBase: parseIntWithValidation(
        process.env.MULTI_AI_RETRY_BACKOFF_BASE,
        1000,
        100, // 최소 100ms
        60000, // 최대 60초
        'MULTI_AI_RETRY_BACKOFF_BASE'
      ),
    },
    debug: {
      enabled: process.env.MULTI_AI_DEBUG === 'true', // Default false
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
 * Uses deep merge to prevent loss of nested properties
 */
export function setConfig(newConfig: Partial<MultiAIConfig>): void {
  config = {
    ...config,
    ...newConfig,
    codex: newConfig.codex
      ? { ...config.codex, ...newConfig.codex }
      : config.codex,
    gemini: newConfig.gemini
      ? { ...config.gemini, ...newConfig.gemini }
      : config.gemini,
    qwen: newConfig.qwen
      ? { ...config.qwen, ...newConfig.qwen }
      : config.qwen,
    mcp: newConfig.mcp
      ? { ...config.mcp, ...newConfig.mcp }
      : config.mcp,
    retry: newConfig.retry
      ? { ...config.retry, ...newConfig.retry }
      : config.retry,
  };
}
