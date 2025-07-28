/**
 * 🚀 Enhanced Cache Service with Upstash for Redis Support v2.0
 *
 * OpenManager AI v5.16.1 - 고성능 Upstash for Redis 캐싱 통합 서비스
 * - 고성능 Upstash for Redis 연결 관리
 * - 메모리 fallback 지원
 * - 자동 TTL 및 압축
 * - 배치 작업 최적화
 * - 에러 복구 시스템
 * - 실시간 통계
 */

import type { EnhancedServerMetrics } from '../types/server';

// 메모리 기반 fallback 캐시
interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * 🚫 서버리스 호환: 캐시 서비스 비활성화
 *
 * 서버리스 환경에서는 요청별 무상태 처리가 원칙이므로
 * 전역 캐시 대신 Vercel Edge Cache 사용 권장
 */

/**
 * 🚫 서버리스 호환: 요청별 캐시 서비스
 * 전역 상태 없이 각 요청마다 새로운 인스턴스 생성
 */
export class RequestScopedCacheService {
  private initialized: boolean = false;

  constructor() {
    console.warn(
      '⚠️ 캐시 서비스 비활성화 - 서버리스에서는 Vercel Edge Cache 사용'
    );
    console.warn(
      '📊 Vercel Edge Cache: https://vercel.com/docs/concepts/edge-network/caching'
    );
  }

  /**
   * 🚫 초기화 비활성화
   */
  async initialize(): Promise<void> {
    console.warn('⚠️ 캐시 서비스 초기화 무시됨 - 서버리스 환경');
    this.initialized = true;
  }

  /**
   * 🚫 서버 메트릭 캐싱 비활성화
   */
  async cacheServerMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    console.warn('⚠️ 서버 메트릭 캐싱 무시됨 - 서버리스에서는 요청별 처리');
    console.warn('📊 Vercel Edge Cache 사용 권장');
  }

  /**
   * 🚫 캐시된 서버 데이터 조회 비활성화
   */
  async getCachedServers(): Promise<{
    servers: EnhancedServerMetrics[];
    timestamp: number;
  } | null> {
    console.warn('⚠️ 캐시된 서버 조회 무시됨 - 서버리스 환경');
    return null;
  }

  /**
   * 🚫 서버 요약 정보 조회 비활성화
   */
  async getCachedSummary(): Promise<null> {
    console.warn('⚠️ 캐시된 요약 조회 무시됨 - 서버리스 환경');
    return null;
  }

  /**
   * 🚫 개별 서버 조회 비활성화
   */
  async getCachedServer(
    serverId: string
  ): Promise<EnhancedServerMetrics | null> {
    console.warn(`⚠️ 캐시된 서버 조회 무시됨: ${serverId} - 서버리스 환경`);
    return null;
  }

  /**
   * 🚫 캐시 무효화 비활성화
   */
  async invalidateCache(pattern?: string): Promise<void> {
    console.warn('⚠️ 캐시 무효화 무시됨 - 서버리스 환경');
  }

  /**
   * 🚫 캐시 설정 비활성화
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    console.warn(`⚠️ 캐시 설정 무시됨: ${key} - 서버리스 환경`);
  }

  /**
   * 🚫 캐시 조회 비활성화
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    console.warn(`⚠️ 캐시 조회 무시됨: ${key} - 서버리스 환경`);
    return null;
  }

  /**
   * 🚫 통계 조회 비활성화
   */
  getStats(): {
    memoryCache: { size: number; keys: string[] };
    redis: null;
  } {
    console.warn('⚠️ 캐시 통계 조회 무시됨 - 서버리스 환경');
    return {
      memoryCache: { size: 0, keys: [] },
      redis: null,
    };
  }

  /**
   * 🚫 Redis 상태 확인 비활성화
   */
  async checkRedisStatus(): Promise<{
    connected: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    console.warn('⚠️ Redis 상태 확인 무시됨 - 서버리스 환경');
    return {
      connected: false,
      message: '서버리스 환경에서는 Redis 연결이 비활성화됩니다.',
    };
  }

  /**
   * 🚫 Redis 재연결 비활성화
   */
  async reconnectRedis(): Promise<boolean> {
    console.warn('⚠️ Redis 재연결 무시됨 - 서버리스 환경');
    return false;
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createCacheService(): RequestScopedCacheService {
  return new RequestScopedCacheService();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createCacheService() 사용
 */
export const EnhancedCacheService = {
  getInstance: () => {
    console.warn(
      '⚠️ EnhancedCacheService.getInstance()는 서버리스에서 사용 금지.'
    );
    console.warn('🔧 대신 createCacheService()를 사용하세요.');
    return new RequestScopedCacheService();
  },
};

/**
 * 🔄 호환성을 위한 인스턴스 export
 */
export const cacheService = new RequestScopedCacheService();
