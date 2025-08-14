/**
 * 🤖 AI 엔진 핵심 인터페이스
 * 
 * SimplifiedQueryEngine과 UnifiedAIEngineRouter 간의 순환 의존성을
 * 해결하기 위한 공통 인터페이스 정의
 */

// AI 엔진 타입
export type AIEngineType = 
  | 'google-ai' 
  | 'local-ai' 
  | 'local-rag' 
  | 'fallback'
  | 'ultra-fast'
  | 'pattern-based'
  | 'keyword-based'
  | 'error-fallback'
  | 'preloaded'
  | `quick-${string}`;

// AI 응답 메타데이터
// 복잡도 점수 (AIMetadata 보다 먼저 정의)
export interface ComplexityScore extends Record<string, unknown> {
  score: number;
  factors: string[];
  category: 'simple' | 'moderate' | 'complex';
}

export interface AIMetadata {
  timestamp?: string | Date;
  source?: string;
  version?: string;
  tags?: string[];
  importance?: number;
  category?: string;
  [key: string]: any;
}

// AI 응답 기본 인터페이스
export interface AIResponse<T = unknown> {
  response: string;
  metadata: AIMetadata & {
    complexity?: ComplexityScore;
    cacheHit?: boolean;
  };
  data?: T;
  source: AIEngineType;
  cached?: boolean;
  processingTime?: number;
  error?: Error | null;
}

// AI 쿼리 옵션
export interface AIQueryOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
  forceEngine?: AIEngineType;
  context?: Record<string, unknown>;
  retryOnError?: boolean;
  maxRetries?: number;
  streamResponse?: boolean;
}

// AI 엔진 설정
export interface AIEngineConfig {
  type: AIEngineType;
  enabled: boolean;
  priority: number;
  maxConcurrency?: number;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  cacheConfig?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  customConfig?: Record<string, unknown>;
}

// AI 엔진 상태
export interface AIEngineStatus {
  type: AIEngineType;
  healthy: boolean;
  lastCheck: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  errors?: string[];
}

// AI 프로세서 인터페이스
export interface IAIProcessor {
  type: AIEngineType;
  
  /**
   * 쿼리 처리
   */
  process(
    query: string,
    options?: AIQueryOptions
  ): Promise<AIResponse>;
  
  /**
   * 엔진 상태 확인
   */
  checkHealth(): Promise<boolean>;
  
  /**
   * 엔진 상태 조회
   */
  getStatus(): AIEngineStatus;
  
  /**
   * 엔진 초기화
   */
  initialize(config: AIEngineConfig): Promise<void>;
  
  /**
   * 엔진 종료
   */
  shutdown(): Promise<void>;
}

// AI 엔진 라우터 인터페이스
export interface IAIEngineRouter {
  /**
   * 쿼리 라우팅
   */
  route(
    query: string,
    options?: AIQueryOptions
  ): Promise<AIResponse>;
  
  /**
   * 엔진 등록
   */
  registerEngine(
    processor: IAIProcessor,
    config: AIEngineConfig
  ): void;
  
  /**
   * 엔진 제거
   */
  unregisterEngine(type: AIEngineType): void;
  
  /**
   * 모든 엔진 상태
   */
  getAllEngineStatus(): AIEngineStatus[];
  
  /**
   * 최적 엔진 선택
   */
  selectOptimalEngine(
    query: string,
    options?: AIQueryOptions
  ): AIEngineType;
}

// 쿼리 분석 결과
export interface QueryAnalysis {
  complexity: ComplexityScore;
  intent: string;
  entities: string[];
  requiredCapabilities: string[];
  suggestedEngine: AIEngineType;
  estimatedTokens: number;
}

// 쿼리 분석기 인터페이스
export interface IQueryAnalyzer {
  /**
   * 쿼리 분석
   */
  analyze(query: string): QueryAnalysis;
  
  /**
   * 복잡도 계산
   */
  calculateComplexity(query: string): ComplexityScore;
  
  /**
   * 의도 추출
   */
  extractIntent(query: string): string;
  
  /**
   * 엔터티 추출
   */
  extractEntities(query: string): string[];
}

// 캐시 매니저 인터페이스
export interface IAICacheManager {
  /**
   * 캐시 조회
   */
  get(key: string): Promise<AIResponse | null>;
  
  /**
   * 캐시 저장
   */
  set(
    key: string,
    value: AIResponse,
    ttl?: number
  ): Promise<void>;
  
  /**
   * 캐시 삭제
   */
  delete(key: string): Promise<void>;
  
  /**
   * 캐시 초기화
   */
  clear(): Promise<void>;
  
  /**
   * 캐시 통계
   */
  getStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  };
}

// 에러 핸들러 인터페이스
export interface IAIErrorHandler {
  /**
   * 에러 처리
   */
  handle(
    error: Error,
    context: {
      engine: AIEngineType;
      query: string;
      options?: AIQueryOptions;
    }
  ): Promise<AIResponse | null>;
  
  /**
   * 폴백 전략
   */
  getFallbackStrategy(
    failedEngine: AIEngineType
  ): AIEngineType | null;
  
  /**
   * 에러 로깅
   */
  logError(
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void;
}

// AI 시스템 설정
export interface AISystemConfig {
  engines: AIEngineConfig[];
  defaultEngine: AIEngineType;
  fallbackEngine: AIEngineType;
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
  optimization: {
    enableParallelProcessing: boolean;
    enablePredictiveLoading: boolean;
    enableSmartRouting: boolean;
  };
}

// AI 시스템 메트릭
export interface AISystemMetrics {
  timestamp: Date;
  totalRequests: number;
  averageResponseTime: number;
  engineUtilization: Record<AIEngineType, number>;
  cacheHitRate: number;
  errorRate: number;
  activeConnections: number;
  queueSize: number;
}

// AI 시스템 매니저 인터페이스
export interface IAISystemManager {
  /**
   * 시스템 초기화
   */
  initialize(config: AISystemConfig): Promise<void>;
  
  /**
   * 쿼리 실행
   */
  executeQuery(
    query: string,
    options?: AIQueryOptions
  ): Promise<AIResponse>;
  
  /**
   * 시스템 상태
   */
  getSystemStatus(): {
    healthy: boolean;
    engines: AIEngineStatus[];
    metrics: AISystemMetrics;
  };
  
  /**
   * 시스템 종료
   */
  shutdown(): Promise<void>;
  
  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<AISystemConfig>): void;
}