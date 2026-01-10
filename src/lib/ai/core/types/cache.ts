/**
 * Cache Types
 *
 * 캐시 관련 타입
 */

import type { UnifiedQueryResponse } from './response';

/**
 * 캐시된 응답
 */
export interface CachedResponse {
  /** 응답 */
  response: UnifiedQueryResponse;

  /** 캐시 키 */
  cacheKey: string;

  /** 캐시된 시간 */
  cachedAt: Date;

  /** 만료 시간 */
  expiresAt: Date;

  /** 히트 수 */
  hitCount: number;
}

/**
 * 캐시 통계
 */
export interface CacheStats {
  /** 총 요청 수 */
  totalRequests: number;

  /** 캐시 히트 수 */
  cacheHits: number;

  /** 캐시 미스 수 */
  cacheMisses: number;

  /** 히트율 (0.0 ~ 1.0) */
  hitRate: number;

  /** 현재 크기 (MB) */
  currentSize: number;

  /** 최대 크기 (MB) */
  maxSize: number;
}
