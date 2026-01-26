/**
 * AI Proxy Configuration (Re-export)
 *
 * @deprecated 이 파일은 호환성을 위해 유지됩니다.
 * 새 코드에서는 '@/config/ai-proxy.config'를 직접 import하세요.
 *
 * @see src/config/ai-proxy.config.ts
 */

export {
  // Types
  type VercelTier,
  type TimeoutConfig,
  type AIProxyConfig,
  type ProxyEndpoint,
  type CacheEndpoint,
  type ErrorCode,
  type StandardErrorResponse,
  // Config getters
  getAIProxyConfig,
  getVercelTier,
  getCurrentMaxDuration,
  getDefaultTimeout,
  getMaxTimeout,
  getMinTimeout,
  clampTimeout,
  getCacheTTL,
  // Error helpers
  ERROR_CODES,
  createStandardError,
  // Headers
  getProxyHeaders,
} from '@/config/ai-proxy.config';

// Legacy aliases for backward compatibility
export {
  getVercelTier as VERCEL_TIER,
  getCurrentMaxDuration as CURRENT_MAX_DURATION,
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
