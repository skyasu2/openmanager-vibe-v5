/**
 * Redis Module Exports
 *
 * Upstash Redis 통합을 위한 모듈
 *
 * @module redis
 */

// AI Cache
export {
  type AIResponse,
  type CacheResult,
  type CacheStats,
  generateQueryHash,
  getAIResponseCache,
  getCacheStats,
  getHealthCache,
  type HealthCheckResult,
  invalidateSessionCache,
  setAIResponseCache,
  setHealthCache,
} from './ai-cache';
// Circuit Breaker: Moved to @/lib/ai/circuit-breaker
// Use: import { executeWithCircuitBreaker } from '@/lib/ai/circuit-breaker'
// Client
export {
  checkRedisHealth,
  getRedisClient,
  isRedisDisabled,
  isRedisEnabled,
  reconnectRedis,
  redisDel,
  redisGet,
  redisMGet,
  redisSet,
  safeRedisOp,
} from './client';
// Rate Limiter
export {
  checkAISupervisorLimit,
  checkDefaultLimit,
  checkRedisRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';
