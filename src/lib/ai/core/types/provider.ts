/**
 * Provider Types
 *
 * Context Provider 인터페이스 및 관련 타입
 */

import type { MLData, RAGData, RuleData } from './data';
import type { AIScenario, ProviderType } from './enums';

/**
 * Provider 인터페이스
 */
export interface IContextProvider {
  /** Provider 이름 */
  readonly name: string;

  /** Provider 타입 */
  readonly type: ProviderType;

  /**
   * 컨텍스트 생성
   * @param query - 사용자 쿼리
   * @param options - Provider 옵션
   * @returns Provider 컨텍스트
   */
  getContext(
    query: string,
    options?: ProviderOptions
  ): Promise<ProviderContext>;

  /**
   * 시나리오별 활성화 여부
   * @param scenario - AI 시나리오
   * @returns 활성화 여부
   */
  isEnabled(scenario: AIScenario): boolean;
}

/**
 * Provider 옵션
 */
export interface ProviderOptions {
  /** 최대 결과 수 (RAG) */
  maxResults?: number;

  /** 유사도 임계값 (RAG) */
  threshold?: number;

  /** 입력 데이터 (ML) */
  data?: unknown;

  /** 타임아웃 (ms) */
  timeoutMs?: number;

  /** 추가 옵션 */
  [key: string]: unknown;
}

/**
 * Provider 컨텍스트
 */
export interface ProviderContext {
  /** Provider 타입 */
  type: ProviderType;

  /** 컨텍스트 데이터 */
  data: RAGData | MLData | RuleData;

  /** 메타데이터 */
  metadata: ProviderMetadata;
}

/**
 * Provider 컨텍스트 맵
 */
export interface ProviderContexts {
  rag?: ProviderContext;
  ml?: ProviderContext;
  rule?: ProviderContext;
}

/**
 * Provider 메타데이터
 */
export interface ProviderMetadata {
  /** 소스 */
  source: string;

  /** 처리 시간 (ms) */
  processingTime?: number;

  /** 캐시 히트 여부 */
  cached?: boolean;

  /** 추가 정보 */
  [key: string]: unknown;
}

/**
 * Provider 헬스 상태
 */
export interface ProviderHealthStatus {
  /** Provider 이름 */
  name: string;

  /** Provider 타입 */
  type: ProviderType;

  /** 정상 여부 */
  healthy: boolean;

  /** 응답 시간 (ms) */
  responseTime?: number;

  /** 에러 메시지 (비정상 시) */
  error?: string;
}
