/**
 * Configuration management for Multi-AI MCP Server
 *
 * Environment variables:
 * - MULTI_AI_CWD: Working directory for AI CLI execution (default: process.cwd())
 * - MULTI_AI_MAX_BUFFER: Max buffer size for CLI output (default: 10MB)
 * - MULTI_AI_CODEX_TIMEOUT_SIMPLE: Codex timeout for simple queries (default: 60s)
 * - MULTI_AI_CODEX_TIMEOUT_MEDIUM: Codex timeout for medium queries (default: 90s)
 * - MULTI_AI_CODEX_TIMEOUT_COMPLEX: Codex timeout for complex queries (default: 120s)
 * - MULTI_AI_GEMINI_TIMEOUT: Gemini timeout (default: 300s, sufficient for complex analysis)
 * - MULTI_AI_QWEN_TIMEOUT_NORMAL: Qwen normal mode timeout (default: 180s, increased from 120s)
 * - MULTI_AI_QWEN_TIMEOUT_PLAN: Qwen plan mode timeout (default: 300s, sufficient for complex planning)
 * - MULTI_AI_MCP_TIMEOUT: MCP request timeout (default: 360s, 6min for 3-AI parallel execution)
 * - MULTI_AI_ENABLE_PROGRESS: Enable progress notifications (default: true)
 * - MULTI_AI_DEBUG: Enable debug logging (default: false)
 * - MULTI_AI_MAX_RETRY_ATTEMPTS: Maximum retry attempts (default: 2)
 * - MULTI_AI_RETRY_BACKOFF_BASE: Retry backoff base in ms (default: 1000)
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
  /** Gemini timeouts by complexity */
  gemini: {
    simple: number;
    medium: number;
    complex: number;
    models: string[]; // Fallback model list (priority order)
  };
  /** Qwen timeouts by complexity */
  qwen: {
    simple: number;
    medium: number;
    complex: number;
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
      simple: parseIntWithValidation(
        process.env.MULTI_AI_CODEX_TIMEOUT_SIMPLE,
        90000, // 1.5min - reduced from 2min for faster feedback
        1000, // 1s min
        600000, // 10min max (reduced from 30min) - balanced timeout
        'MULTI_AI_CODEX_TIMEOUT_SIMPLE'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_CODEX_TIMEOUT_MEDIUM,
        180000, // 3min - reduced from 4min
        1000,
        600000, // 10min max (reduced from 30min)
        'MULTI_AI_CODEX_TIMEOUT_MEDIUM'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_CODEX_TIMEOUT_COMPLEX,
        300000, // 5min - reduced from 6min for complex queries
        1000,
        600000, // 10min max (reduced from 30min) - balanced timeout
        'MULTI_AI_CODEX_TIMEOUT_COMPLEX'
      ),
    },
    gemini: {
      simple: parseIntWithValidation(
        process.env.MULTI_AI_GEMINI_TIMEOUT_SIMPLE,
        120000, // 2min - fast for simple queries
        1000,
        600000, // 10min max
        'MULTI_AI_GEMINI_TIMEOUT_SIMPLE'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_GEMINI_TIMEOUT_MEDIUM,
        180000, // 3min - balanced for medium queries
        1000,
        600000, // 10min max
        'MULTI_AI_GEMINI_TIMEOUT_MEDIUM'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_GEMINI_TIMEOUT_COMPLEX,
        240000, // 4min - sufficient for complex queries
        1000,
        600000, // 10min max
        'MULTI_AI_GEMINI_TIMEOUT_COMPLEX'
      ),
      // Fallback model list (priority order)
      // 429 quota exceeded → try next model
      // OAuth free tier: Pro (high quality) → Flash (fast) fallback
      models: process.env.MULTI_AI_GEMINI_MODELS
        ? process.env.MULTI_AI_GEMINI_MODELS.split(',')
        : ['gemini-2.5-pro', 'gemini-2.5-flash'], // OAuth 무료티어: Pro → Flash fallback
    },
    qwen: {
      simple: parseIntWithValidation(
        process.env.MULTI_AI_QWEN_TIMEOUT_SIMPLE,
        90000, // 1.5min - same as Codex for consistency
        1000,
        600000, // 10min max
        'MULTI_AI_QWEN_TIMEOUT_SIMPLE'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_QWEN_TIMEOUT_MEDIUM,
        150000, // 2.5min - balanced for medium queries
        1000,
        600000, // 10min max
        'MULTI_AI_QWEN_TIMEOUT_MEDIUM'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_QWEN_TIMEOUT_COMPLEX,
        240000, // 4min - sufficient for complex queries (was 'plan' mode)
        1000,
        600000, // 10min max
        'MULTI_AI_QWEN_TIMEOUT_COMPLEX'
      ),
    },
    mcp: {
      requestTimeout: parseIntWithValidation(
        process.env.MULTI_AI_MCP_TIMEOUT,
        480000, // 8min - reduced from 6min for 3-AI parallel (allows 2 retries)
        60000, // 1min min
        600000, // 10min max (reduced from 30min) - balanced timeout
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
