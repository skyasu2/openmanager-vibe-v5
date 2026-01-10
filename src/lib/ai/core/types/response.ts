/**
 * Response Types
 *
 * 쿼리 응답 관련 타입
 */

import type { AIScenario } from './enums';
import type { ProviderContexts } from './provider';

/**
 * 통합 쿼리 응답
 */
export interface UnifiedQueryResponse {
  /** 성공 여부 */
  success: boolean;

  /** AI 응답 텍스트 */
  response: string;

  /** 사용된 시나리오 */
  scenario: AIScenario;

  /** 메타데이터 */
  metadata: ResponseMetadata;

  /** Provider 컨텍스트 (디버깅용) */
  contexts?: ProviderContexts;

  /** Thinking steps (옵션) */
  thinkingSteps?: ThinkingStep[];

  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 응답 메타데이터
 */
export interface ResponseMetadata {
  /** 엔진 타입 */
  engine: 'cloud-run-ai' | 'google-ai-unified';

  /** 사용된 모델 */
  model: string;

  /** 사용된 토큰 수 */
  tokensUsed: number;

  /** 처리 시간 (ms) */
  processingTime: number;

  /** 캐시 히트 여부 */
  cacheHit: boolean;

  /** 사용된 Provider 목록 */
  providersUsed: string[];

  /** 타임스탬프 */
  timestamp?: Date;
}

/**
 * Thinking step
 */
export interface ThinkingStep {
  /** 단계 이름 */
  step: string;

  /** 설명 */
  description: string;

  /** 상태 */
  status: 'pending' | 'completed' | 'failed';

  /** 타임스탬프 */
  timestamp: number;

  /** 소요 시간 (ms) */
  duration?: number;

  /** 에러 (실패 시) */
  error?: string;
}
