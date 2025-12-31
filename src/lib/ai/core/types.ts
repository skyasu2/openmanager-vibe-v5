/**
 * 🤖 AI Engine Core Types - 중앙 집중식 타입 시스템
 *
 * 목적:
 * - 모든 AI 엔진 관련 타입을 한 곳에서 관리
 * - TypeScript strict mode 100% 준수
 * - any 타입 절대 금지
 *
 * @since v5.84.0 - Cloud Run AI Engine (Vercel AI SDK + Cerebras/Groq/Mistral)
 */

// ============================================================================
// 시나리오 타입
// ============================================================================

/**
 * AI 쿼리 시나리오 타입
 *
 * 각 시나리오마다 다른 프롬프트, Provider 활성화, 옵션이 적용됩니다.
 */
export type AIScenario =
  | 'failure-analysis' // 장애 분석
  | 'performance-report' // 성능 리포트
  | 'document-qa' // 문서 Q/A
  | 'dashboard-summary' // 대시보드 요약
  | 'general-query' // 일반 쿼리
  | 'incident-report' // 사고 리포트
  | 'optimization-advice'; // 최적화 조언

/**
 * Provider 타입
 */
export type ProviderType = 'rag' | 'ml' | 'rule';

/**
 * 컨텍스트 우선순위
 */
export type ContextPriority = 'high' | 'medium' | 'low';

// ============================================================================
// Request/Response 타입
// ============================================================================

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

// ============================================================================
// Provider 타입
// ============================================================================

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

// ============================================================================
// Provider 데이터 타입
// ============================================================================

/**
 * RAG Provider 데이터
 */
export interface RAGData {
  /** 검색된 문서 */
  documents: RAGDocument[];

  /** 총 결과 수 */
  totalResults: number;

  /** 평균 유사도 */
  avgSimilarity?: number;

  /** 쿼리 벡터 임베딩 (Supabase RAG Engine 제공) */
  queryEmbedding?: number[];
}

/**
 * RAG 문서
 */
export interface RAGDocument {
  /** 문서 ID */
  id: string;

  /** 문서 내용 */
  content: string;

  /** 문서 출처 (파일명, URL 등) */
  source: string;

  /** 유사도 점수 (0.0 ~ 1.0) */
  similarity: number;

  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * ML Provider 데이터 (Cloud Run ML Analytics)
 */
export interface MLData {
  /** 이상 탐지 결과 */
  anomalies: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    metric: string;
    value: number;
    timestamp: string;
  }>;

  /** 트렌드 분석 결과 */
  trends: Array<{
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    prediction: number;
    timeframe: string;
  }>;

  /** 패턴 인식 결과 */
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;

  /** 개선 권장사항 */
  recommendations: string[];
}

/**
 * Rule Provider 데이터 (Cloud Run Korean NLP)
 */
export interface RuleData {
  /** 추출된 키워드 (명사, 동사, 형용사) */
  keywords: string[];

  /** 인식된 엔티티 (서버명, 메트릭, 커맨드 등) */
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;

  /** 의도 분류 결과 */
  intent: {
    category: string;
    confidence: number;
    params?: Record<string, string>;
  };

  /** 도메인 특화 용어 (서버 모니터링) */
  domainTerms: string[];

  /** 정규화된 쿼리 */
  normalizedQuery: string;
}

/**
 * 규칙 힌트 (레거시 - 사용되지 않음)
 * @deprecated Use RuleData properties directly
 */
export interface RuleHint {
  /** 카테고리 */
  category: string;

  /** 제안 사항 */
  suggestion: string;

  /** 우선순위 */
  priority: 'high' | 'medium' | 'low';

  /** 신뢰도 (0.0 ~ 1.0) */
  confidence?: number;
}

// ============================================================================
// 프롬프트 타입
// ============================================================================

/**
 * AI 프롬프트 (Cloud Run AI Engine)
 * @since v5.84.0 - Renamed from GoogleAIPrompt
 */
export interface AIPrompt {
  /** 시스템 instruction */
  systemInstruction: string;

  /** 사용자 메시지 */
  userMessage: string;

  /** 예상 토큰 수 */
  estimatedTokens: number;
}

/**
 * @deprecated Use AIPrompt instead. Will be removed in v6.0
 */
export type GoogleAIPrompt = AIPrompt;

/**
 * 프롬프트 템플릿
 */
export interface PromptTemplate {
  /** 시나리오 */
  scenario: AIScenario;

  /** 시스템 instruction 템플릿 */
  systemTemplate: string;

  /** 사용자 메시지 템플릿 */
  userTemplate: string;

  /** 컨텍스트 우선순위 */
  priority: ContextPriority[];

  /** 최대 토큰 제한 */
  maxTokens?: number;
}

/**
 * 프롬프트 파라미터
 */
export interface PromptParams {
  /** 사용자 쿼리 */
  query: string;

  /** Provider 컨텍스트 */
  contexts: ProviderContexts;

  /** 옵션 */
  options?: UnifiedQueryOptions;
}

// ============================================================================
// 엔진 타입
// ============================================================================

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

  /** @deprecated Use cloudRunAIStatus instead */
  googleAIStatus?: {
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

// ============================================================================
// 캐시 타입
// ============================================================================

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

// ============================================================================
// 에러 타입
// ============================================================================

/**
 * Unified Engine 에러
 */
export class UnifiedEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UnifiedEngineError';
  }
}

/**
 * Provider 에러
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly providerType: ProviderType,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Cloud Run AI Engine 에러
 * @since v5.84.0 - Renamed from GoogleAIError
 */
export class CloudRunAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CloudRunAIError';
  }
}

/**
 * @deprecated Use CloudRunAIError instead. Will be removed in v6.0
 */
export const GoogleAIError = CloudRunAIError;

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * Partial deep (재귀적 Partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required deep (재귀적 Required)
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Pick by value type
 */
export type PickByValue<T, ValueType> = Pick<
  T,
  { [K in keyof T]-?: T[K] extends ValueType ? K : never }[keyof T]
>;

/**
 * Omit by value type
 */
export type OmitByValue<T, ValueType> = Pick<
  T,
  { [K in keyof T]-?: T[K] extends ValueType ? never : K }[keyof T]
>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Provider 타입 가드
 */
export function isRAGData(data: unknown): data is RAGData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'documents' in data &&
    'totalResults' in data &&
    Array.isArray((data as RAGData).documents)
  );
}

export function isMLData(data: unknown): data is MLData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'anomalies' in data &&
    'trends' in data &&
    Array.isArray((data as MLData).anomalies) &&
    Array.isArray((data as MLData).trends)
  );
}

export function isRuleData(data: unknown): data is RuleData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'keywords' in data &&
    'entities' in data &&
    'intent' in data &&
    Array.isArray((data as RuleData).keywords) &&
    Array.isArray((data as RuleData).entities)
  );
}

/**
 * Scenario 타입 가드
 */
export function isValidScenario(value: unknown): value is AIScenario {
  const validScenarios: AIScenario[] = [
    'failure-analysis',
    'performance-report',
    'document-qa',
    'dashboard-summary',
    'general-query',
    'incident-report',
    'optimization-advice',
  ];
  return (
    typeof value === 'string' && validScenarios.includes(value as AIScenario)
  );
}
