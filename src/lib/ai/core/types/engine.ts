/**
 * Engine Types
 *
 * Unified Engine 인터페이스 및 상태 타입
 */

import type { EngineConfig } from './config';
import type { ProviderHealthStatus } from './provider';
import type { UnifiedQueryRequest } from './request';
import type { UnifiedQueryResponse } from './response';

/**
 * Unified Engine 인터페이스
 */
export interface IUnifiedEngine {
  /**
   * 쿼리 처리
   * @param request - 통합 쿼리 요청
   * @returns 통합 쿼리 응답
   */
  query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse>;

  /**
   * 헬스 체크
   * @returns 엔진 상태
   */
  healthCheck(): Promise<EngineHealthStatus>;

  /**
   * 엔진 설정 업데이트
   * @param config - 부분 설정
   */
  configure(config: Partial<EngineConfig>): void;
}

/**
 * 엔진 헬스 상태
 */
export interface EngineHealthStatus {
  /** 정상 여부 */
  healthy: boolean;

  /** 상태 메시지 */
  message: string;

  /** Provider 상태 */
  providers: ProviderHealthStatus[];

  /** Cloud Run AI Engine 상태 */
  cloudRunAIStatus: {
    available: boolean;
    latency?: number;
    error?: string;
  };

  /** 캐시 상태 */
  cacheStatus: {
    hitRate: number;
    size: number;
    maxSize: number;
  };

  /** 타임스탬프 */
  timestamp: Date;
}
