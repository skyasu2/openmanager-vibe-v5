/**
 * Configuration management for Multi-AI MCP Server
 *
 * Environment variables:
 * - MULTI_AI_CWD: Working directory for AI CLI execution (default: process.cwd())
 * - MULTI_AI_MAX_BUFFER: Max buffer size for CLI output (default: 10MB)
 * - MULTI_AI_TIMEOUT: Unified timeout for all AIs (default: 300s, 5min for communication failure detection)
 * - MULTI_AI_ENABLE_PROGRESS: Enable progress notifications (default: true)
 * - MULTI_AI_DEBUG: Enable debug logging (default: false)
 * - MULTI_AI_MAX_RETRY_ATTEMPTS: Maximum retry attempts (default: 2)
 * - MULTI_AI_RETRY_BACKOFF_BASE: Retry backoff base in ms (default: 1000)
 * - MULTI_AI_MEMORY_CRITICAL_THRESHOLD: Memory critical threshold 0-100 (default: 95)
 * - MULTI_AI_MEMORY_WARNING_THRESHOLD: Memory warning threshold 0-100 (default: 85)
 *
 * Note: Timeout purpose is to detect communication failure (통신 두절), not to measure AI response time.
 * All AIs use the same timeout since they face the same communication failure risk.
 *
 * Memory Management:
 * - Start with: node --max-old-space-size=512 dist/index.js (512MB heap)
 * - Critical threshold: 95% (down from 90% for better AI query success rate)
 * - Warning threshold: 85% (down from 80%)
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
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout for communication failure detection
        1000, // 1s min
        600000, // 10min max
        'MULTI_AI_TIMEOUT'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
    },
    gemini: {
      simple: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
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
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
      medium: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
      complex: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        1000,
        600000,
        'MULTI_AI_TIMEOUT'
      ),
    },
    mcp: {
      requestTimeout: parseIntWithValidation(
        process.env.MULTI_AI_TIMEOUT,
        300000, // 5min unified timeout
        60000, // 1min min
        600000, // 10min max
        'MULTI_AI_TIMEOUT'
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
