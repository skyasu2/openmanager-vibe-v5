/**
 * Configuration Types
 *
 * 엔진 및 Provider 설정 타입
 */

/**
 * 캐시 설정
 */
export interface CacheConfig {
  /** 활성화 여부 */
  enabled: boolean;

  /** TTL (ms) */
  ttl: number;

  /** 최대 크기 (MB) */
  maxSize: number;
}

/**
 * Provider 설정
 */
export interface ProvidersConfig {
  rag: RAGProviderConfig;
  ml: MLProviderConfig;
  rule: RuleProviderConfig;
}

/**
 * RAG Provider 설정
 */
export interface RAGProviderConfig {
  /** 활성화 여부 */
  enabled: boolean;

  /** 최대 결과 수 */
  maxResults: number;

  /** 유사도 임계값 */
  threshold: number;
}

/**
 * ML Provider 설정
 */
export interface MLProviderConfig {
  /** 활성화 여부 */
  enabled: boolean;

  /** 사용할 모델 목록 */
  models: string[];
}

/**
 * Rule Provider 설정
 */
export interface RuleProviderConfig {
  /** 활성화 여부 */
  enabled: boolean;

  /** 신뢰도 임계값 */
  confidenceThreshold: number;
}

/**
 * 엔진 설정
 */
export interface EngineConfig {
  /** Google AI 모델 */
  model: string;

  /** 기본 온도 */
  temperature: number;

  /** 최대 토큰 */
  maxTokens: number;

  /** 타임아웃 (ms) */
  timeout: number;

  /** 캐싱 설정 */
  cache: CacheConfig;

  /** Provider 설정 */
  providers: ProvidersConfig;

  /** MCP (Multi-Cloud Platform) 활성화 여부 */
  enableMcp?: boolean;
}
