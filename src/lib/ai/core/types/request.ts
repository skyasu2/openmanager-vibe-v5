/**
 * Request Types
 *
 * 쿼리 요청 관련 타입
 */

import type { AIScenario } from './enums';

/**
 * 통합 쿼리 요청
 */
export interface UnifiedQueryRequest {
  /** 사용자 쿼리 */
  query: string;

  /** 쿼리 시나리오 */
  scenario: AIScenario;

  /** 선택적 옵션 */
  options?: UnifiedQueryOptions;

  /** 컨텍스트 정보 */
  context?: RequestContext;
}

/**
 * 쿼리 옵션
 */
export interface UnifiedQueryOptions {
  /** 온도 (0.0 ~ 1.0) */
  temperature?: number;

  /** 최대 토큰 수 */
  maxTokens?: number;

  /** RAG Provider 활성화 */
  enableRAG?: boolean;

  /** ML Provider 활성화 */
  enableML?: boolean;

  /** Rule Provider 활성화 */
  enableRules?: boolean;

  /** Thinking steps 포함 여부 */
  includeThinking?: boolean;

  /** 캐싱 사용 여부 */
  cached?: boolean;

  /** 타임아웃 (ms) */
  timeoutMs?: number;
}

/**
 * 요청 컨텍스트
 */
export interface RequestContext {
  /** 서버 ID */
  serverId?: string;

  /** 메트릭 데이터 */
  metricData?: unknown;

  /** 시간 범위 */
  timeRange?: {
    start: Date;
    end: Date;
  };

  /** 추가 메타데이터 */
  [key: string]: unknown;
}
