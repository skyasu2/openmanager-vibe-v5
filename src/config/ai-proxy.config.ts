/**
 * AI Proxy Configuration (Zod Schema)
 *
 * @description
 * Cloud Run 프록시 타임아웃 및 설정 중앙화
 * Zod 스키마로 타입 안전성 및 런타임 검증 보장
 *
 * @created 2026-01-26
 *
 * @note maxDuration vs Timeout 차이점
 * - maxDuration: Next.js 빌드 타임 상수 (라우트 파일에서 정적 export)
 * - timeout: 런타임에 사용되는 실제 타임아웃 (이 config에서 관리)
 *
 * Vercel 티어 변경 시:
 * 1. VERCEL_TIER 환경변수 변경 (free → pro)
 * 2. 각 라우트 파일의 maxDuration 주석 참고하여 값 변경
 */

import { z } from 'zod';
import { logger } from '@/lib/logging';

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Vercel 티어 스키마
 */
const VercelTierSchema = z.enum(['free', 'pro']).default('free');

/**
 * 타임아웃 설정 스키마
 */
const TimeoutConfigSchema = z.object({
  min: z.number().min(1000).max(60000),
  max: z.number().min(1000).max(60000),
  default: z.number().min(1000).max(60000),
});

/**
 * AI Proxy 설정 스키마
 */
const AIProxyConfigSchema = z.object({
  /** Vercel 티어 (free: 10초, pro: 60초) */
  tier: VercelTierSchema,

  /** 티어별 maxDuration (빌드 타임 참조용) */
  maxDuration: z.object({
    free: z.literal(10),
    pro: z.literal(60),
  }),

  /** 엔드포인트별 타임아웃 설정 */
  timeouts: z.object({
    supervisor: TimeoutConfigSchema,
    'incident-report': TimeoutConfigSchema,
    'intelligent-monitoring': TimeoutConfigSchema,
    'analyze-server': TimeoutConfigSchema,
  }),

  /** 캐시 TTL 설정 (초) */
  cacheTTL: z.object({
    'supervisor-status': z.number().default(300),
    supervisor: z.number().default(1800),
    'incident-report': z.number().default(3600),
    'intelligent-monitoring': z.number().default(600),
  }),
});

// ============================================================================
// Types
// ============================================================================

export type VercelTier = z.infer<typeof VercelTierSchema>;
export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;
export type AIProxyConfig = z.infer<typeof AIProxyConfigSchema>;
export type ProxyEndpoint = keyof AIProxyConfig['timeouts'];
export type CacheEndpoint = keyof AIProxyConfig['cacheTTL'];

// ============================================================================
// Tier-specific Timeout Presets
// ============================================================================

/**
 * Free tier 타임아웃 (10초 제한, 1초 안전 마진)
 */
const FREE_TIER_TIMEOUTS = {
  supervisor: { min: 3000, max: 9000, default: 5000 },
  'incident-report': { min: 5000, max: 9000, default: 7000 },
  'intelligent-monitoring': { min: 3000, max: 9000, default: 5000 },
  'analyze-server': { min: 3000, max: 9000, default: 5000 },
} as const;

/**
 * Pro tier 타임아웃 (60초 제한, 5초 안전 마진)
 */
const PRO_TIER_TIMEOUTS = {
  supervisor: { min: 15000, max: 55000, default: 30000 },
  'incident-report': { min: 20000, max: 45000, default: 30000 },
  'intelligent-monitoring': { min: 10000, max: 30000, default: 15000 },
  'analyze-server': { min: 8000, max: 25000, default: 12000 },
} as const;

// ============================================================================
// Config Loader
// ============================================================================

/**
 * 환경변수에서 설정 로드 및 검증
 */
function loadAIProxyConfig(): AIProxyConfig {
  const tier = (process.env.VERCEL_TIER as VercelTier) || 'free';
  const timeouts = tier === 'pro' ? PRO_TIER_TIMEOUTS : FREE_TIER_TIMEOUTS;

  const rawConfig = {
    tier,
    maxDuration: {
      free: 10 as const,
      pro: 60 as const,
    },
    timeouts,
    cacheTTL: {
      'supervisor-status': 300,
      supervisor: 1800,
      'incident-report': 3600,
      'intelligent-monitoring': 600,
    },
  };

  const result = AIProxyConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    logger.error('❌ AI Proxy config validation failed:', result.error.issues);
    throw new Error(
      `Invalid AI Proxy configuration: ${result.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return result.data;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _config: AIProxyConfig | null = null;

/**
 * AI Proxy 설정 가져오기 (싱글톤)
 */
export function getAIProxyConfig(): AIProxyConfig {
  if (!_config) {
    _config = loadAIProxyConfig();
    logger.info(`🔧 AI Proxy config loaded (tier: ${_config.tier})`);
  }
  return _config;
}

/**
 * 설정 재로드 (테스트용)
 */
export function reloadAIProxyConfig(): AIProxyConfig {
  _config = null;
  return getAIProxyConfig();
}

// ============================================================================
// Convenience Getters
// ============================================================================

/**
 * 현재 Vercel 티어
 */
export function getVercelTier(): VercelTier {
  return getAIProxyConfig().tier;
}

/**
 * 현재 티어의 maxDuration 값 (빌드 타임 참조용)
 * @note 실제 라우트 파일에서는 리터럴 값 사용 필요
 */
export function getCurrentMaxDuration(): 10 | 60 {
  const config = getAIProxyConfig();
  return config.maxDuration[config.tier];
}

/**
 * 엔드포인트별 기본 타임아웃
 */
export function getDefaultTimeout(endpoint: ProxyEndpoint): number {
  return getAIProxyConfig().timeouts[endpoint].default;
}

/**
 * 엔드포인트별 최대 타임아웃
 */
export function getMaxTimeout(endpoint: ProxyEndpoint): number {
  return getAIProxyConfig().timeouts[endpoint].max;
}

/**
 * 엔드포인트별 최소 타임아웃
 */
export function getMinTimeout(endpoint: ProxyEndpoint): number {
  return getAIProxyConfig().timeouts[endpoint].min;
}

/**
 * 타임아웃 값을 유효 범위로 클램프
 */
export function clampTimeout(endpoint: ProxyEndpoint, timeout: number): number {
  const config = getAIProxyConfig().timeouts[endpoint];
  return Math.max(config.min, Math.min(config.max, timeout));
}

/**
 * 캐시 TTL 가져오기 (초)
 */
export function getCacheTTL(endpoint: CacheEndpoint): number {
  return getAIProxyConfig().cacheTTL[endpoint];
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  CLOUD_RUN_UNAVAILABLE: 'CLOUD_RUN_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 표준화된 에러 응답 형식
 */
export interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  retryAfter?: number;
  timestamp: string;
}

/**
 * 표준 에러 응답 생성
 */
export function createStandardError(
  code: ErrorCode,
  message: string,
  retryAfter?: number
): StandardErrorResponse {
  const errorMessages: Record<ErrorCode, string> = {
    TIMEOUT: 'Request timeout',
    CIRCUIT_OPEN: 'AI service circuit open',
    CLOUD_RUN_UNAVAILABLE: 'Cloud Run service unavailable',
    VALIDATION_ERROR: 'Invalid request payload',
    RATE_LIMITED: 'Rate limit exceeded',
    INTERNAL_ERROR: 'Internal server error',
  };

  return {
    success: false,
    error: errorMessages[code],
    message,
    code,
    retryAfter,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Headers Configuration
// ============================================================================

/**
 * 프록시 응답에 추가할 표준 헤더
 */
export function getProxyHeaders(options: {
  sessionId?: string;
  backend?: 'cloud-run' | 'fallback' | 'cache';
  cacheStatus?: 'HIT' | 'MISS';
  retryAfter?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.sessionId) {
    headers['X-Session-Id'] = options.sessionId;
  }

  if (options.backend) {
    headers['X-Backend'] = options.backend;
  }

  if (options.cacheStatus) {
    headers['X-Cache'] = options.cacheStatus;
  }

  if (options.retryAfter) {
    headers['X-Retry-After'] = options.retryAfter.toString();
    headers['Retry-After'] = Math.ceil(options.retryAfter / 1000).toString();
  }

  if (options.backend === 'fallback') {
    headers['X-Fallback-Response'] = 'true';
  }

  return headers;
}
