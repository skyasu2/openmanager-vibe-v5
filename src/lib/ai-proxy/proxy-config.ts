/**
 * AI Proxy Configuration (Re-export)
 *
 * @deprecated 이 파일은 호환성을 위해 유지됩니다.
 * 새 코드에서는 '@/config/ai-proxy.config'를 직접 import하세요.
 *
 * @see src/config/ai-proxy.config.ts
 */

// Legacy aliases for backward compatibility
export {
  type AIProxyConfig,
  type CacheEndpoint,
  clampTimeout,
  createStandardError,
  // Error helpers
  ERROR_CODES,
  type ErrorCode,
  // Config getters
  getAIProxyConfig,
  getCacheTTL,
  getCurrentMaxDuration,
  getCurrentMaxDuration as CURRENT_MAX_DURATION,
  getDefaultTimeout,
  getMaxTimeout,
  getMinTimeout,
  // Headers
  getProxyHeaders,
  getVercelTier,
  getVercelTier as VERCEL_TIER,
  type ProxyEndpoint,
  type StandardErrorResponse,
  type TimeoutConfig,
  // Types
  type VercelTier,
} from '@/config/ai-proxy.config';

// Re-export PROXY_TIMEOUTS as a getter for backward compatibility
import { getAIProxyConfig } from '@/config/ai-proxy.config';

/**
 * @deprecated Use getAIProxyConfig().timeouts instead
 */
export const PROXY_TIMEOUTS = new Proxy(
  {} as Record<string, { min: number; max: number; default: number }>,
  {
    get(_target, prop: string) {
      const config = getAIProxyConfig();
      return config.timeouts[prop as keyof typeof config.timeouts];
    },
  }
);

/**
 * @deprecated Use getAIProxyConfig().cacheTTL instead
 */
export const CACHE_TTL = new Proxy({} as Record<string, number>, {
  get(_target, prop: string) {
    const config = getAIProxyConfig();
    return config.cacheTTL[prop as keyof typeof config.cacheTTL];
  },
});
