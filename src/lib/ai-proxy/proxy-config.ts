/**
 * AI Proxy Configuration
 *
 * @description
 * Cloud Run 프록시 타임아웃 및 설정 중앙화
 * 일관된 프록시 동작 보장
 *
 * @created 2026-01-25
 */

// ============================================================================
// Timeout Configuration
// ============================================================================

/**
 * 엔드포인트별 타임아웃 설정 (밀리초)
 *
 * @note Vercel Pro 타임아웃: 60초
 * @note 안전 마진: 5초 (55초 최대)
 */
export const PROXY_TIMEOUTS = {
  /** AI Supervisor: 동적 타임아웃 범위 */
  supervisor: {
    min: 15000,
    max: 55000,
    default: 30000,
  },
  /** 장애 보고서: 복잡한 분석 필요 */
  'incident-report': {
    min: 20000,
    max: 45000,
    default: 30000,
  },
  /** 지능형 모니터링: 예측 분석 */
  'intelligent-monitoring': {
    min: 10000,
    max: 30000,
    default: 15000,
  },
  /** 서버 분석: 빠른 응답 기대 */
  'analyze-server': {
    min: 8000,
    max: 25000,
    default: 12000,
  },
} as const;

export type ProxyEndpoint = keyof typeof PROXY_TIMEOUTS;

// ============================================================================
// Timeout Utilities
// ============================================================================

/**
 * 엔드포인트별 기본 타임아웃 반환
 */
export function getDefaultTimeout(endpoint: ProxyEndpoint): number {
  return PROXY_TIMEOUTS[endpoint]?.default ?? 30000;
}

/**
 * 엔드포인트별 최대 타임아웃 반환
 */
export function getMaxTimeout(endpoint: ProxyEndpoint): number {
  return PROXY_TIMEOUTS[endpoint]?.max ?? 55000;
}

/**
 * 엔드포인트별 최소 타임아웃 반환
 */
export function getMinTimeout(endpoint: ProxyEndpoint): number {
  return PROXY_TIMEOUTS[endpoint]?.min ?? 10000;
}

/**
 * 타임아웃 값을 유효 범위로 클램프
 */
export function clampTimeout(endpoint: ProxyEndpoint, timeout: number): number {
  const config = PROXY_TIMEOUTS[endpoint];
  if (!config) return timeout;

  return Math.max(config.min, Math.min(config.max, timeout));
}

// ============================================================================
// Error Response Configuration
// ============================================================================

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
// Cache Configuration
// ============================================================================

/**
 * 엔드포인트별 캐시 TTL (초)
 */
export const CACHE_TTL = {
  /** 상태 쿼리: 짧은 TTL (실시간성 중요) */
  'supervisor-status': 300, // 5분
  /** 일반 쿼리: 중간 TTL */
  supervisor: 1800, // 30분
  /** 장애 보고서: 긴 TTL (자주 변경 안됨) */
  'incident-report': 3600, // 1시간
  /** 지능형 모니터링: 중간 TTL */
  'intelligent-monitoring': 600, // 10분
} as const;

export type CacheEndpoint = keyof typeof CACHE_TTL;

/**
 * 엔드포인트별 캐시 TTL 반환
 */
export function getCacheTTL(endpoint: CacheEndpoint): number {
  return CACHE_TTL[endpoint] ?? 1800;
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
