/**
 * 🎯 쿼리 프로세서 기본 클래스
 *
 * 모든 AI 엔진이 상속받을 추상 클래스로
 * 공통 로직을 제공하여 중복 코드를 제거합니다.
 */

import type {
  AIEngineConfig,
  AIEngineStatus,
  AIEngineType,
  AIQueryOptions,
  AIResponse,
  ComplexityScore,
  IAIProcessor,
} from './AIEngineInterface';

// 기본 설정값
const DEFAULT_CONFIG: Partial<AIEngineConfig> = {
  enabled: true,
  priority: 10,
  maxConcurrency: 5,
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    backoffFactor: 2,
    initialDelay: 1000,
    retryDelay: 1000,
    exponentialBackoff: true,
  },
  cacheConfig: {
    enabled: true,
    ttl: 3600000, // 1시간
    maxSize: 100,
  },
};

/**
 * 쿼리 프로세서 기본 클래스
 */
export abstract class QueryProcessorBase implements IAIProcessor {
  protected config: AIEngineConfig;
  public status: AIEngineStatus;
  protected initialized: boolean = false;

  // IAIProcessor interface properties
  public get engineType(): AIEngineType {
    return this.type;
  }

  constructor(
    public readonly type: AIEngineType,
    config?: Partial<AIEngineConfig>
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      type: this.type,
      ...config,
    } as AIEngineConfig;

    this.status = {
      name: `${this.type} Processor`,
      type: this.type,
      available: false,
      responseTime: 0,
      successRate: 0,
      capabilities: [],
      healthy: false,
      lastCheck: new Date(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
      },
    };
  }

  private ensureMetrics(): NonNullable<AIEngineStatus['metrics']> {
    if (!this.status.metrics) {
      this.status.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
      };
    }
    return this.status.metrics;
  }

  /**
   * 초기화
   */
  async initialize(config: AIEngineConfig): Promise<void> {
    this.config = { ...this.config, ...config };

    try {
      // 구체적인 초기화 로직은 서브클래스에서 구현
      await this.doInitialize();
      this.initialized = true;
      this.status.healthy = true;
    } catch (error) {
      this.status.healthy = false;
      this.status.errors = [
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      ];
      throw error;
    }
  }

  /**
   * IAIProcessor 인터페이스 구현 - processQuery
   */
  async processQuery(
    query: string,
    options?: AIQueryOptions
  ): Promise<AIResponse> {
    return this.process(query, options);
  }

  /**
   * IAIProcessor 인터페이스 구현 - updateStatus
   */
  updateStatus(status: Partial<AIEngineStatus>): void {
    this.status = { ...this.status, ...status };
  }

  /**
   * 쿼리 처리
   */
  async process(query: string, options?: AIQueryOptions): Promise<AIResponse> {
    if (!this.initialized) {
      throw new Error(`${this.type} processor not initialized`);
    }

    const startTime = Date.now();
    const metrics = this.ensureMetrics();
    metrics.totalRequests++;

    try {
      // 옵션 병합
      const mergedOptions = this.mergeOptions(options);

      // 재시도 로직 적용
      const response = await this.executeWithRetry(
        () => this.doProcess(query, mergedOptions),
        mergedOptions
      );

      // 메트릭 업데이트
      this.updateSuccessMetrics(Date.now() - startTime);

      return response;
    } catch (error) {
      // 메트릭 업데이트
      this.updateFailureMetrics(Date.now() - startTime);

      // 에러 응답 생성
      return this.createErrorResponse(
        query,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 헬스 체크
   */
  async checkHealth(): Promise<boolean> {
    try {
      const healthy = await this.doHealthCheck();
      this.status.healthy = healthy;
      this.status.lastCheck = new Date();

      if (!healthy && !this.status.errors) {
        this.status.errors = ['Health check failed'];
      } else if (healthy) {
        delete this.status.errors;
      }

      return healthy;
    } catch (error) {
      this.status.healthy = false;
      this.status.lastCheck = new Date();
      this.status.errors = [
        `Health check error: ${error instanceof Error ? error.message : String(error)}`,
      ];
      return false;
    }
  }

  /**
   * 상태 조회
   */
  getStatus(): AIEngineStatus {
    return { ...this.status };
  }

  /**
   * 종료
   */
  async shutdown(): Promise<void> {
    try {
      await this.doShutdown();
      this.initialized = false;
      this.status.healthy = false;
    } catch (error) {
      console.error(`Error shutting down ${this.type}:`, error);
      throw error;
    }
  }

  /**
   * 재시도 로직
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: AIQueryOptions
  ): Promise<T> {
    const maxRetries =
      options.maxRetries ?? this.config.retryConfig?.maxRetries ?? 3;
    const retryDelay = this.config.retryConfig?.retryDelay ?? 1000;
    const exponentialBackoff =
      this.config.retryConfig?.exponentialBackoff ?? true;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delay = exponentialBackoff
            ? retryDelay * 2 ** attempt
            : retryDelay;

          console.log(
            `⚠️ [${this.type}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
          );

          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * 옵션 병합
   */
  protected mergeOptions(options?: AIQueryOptions): AIQueryOptions {
    return {
      maxTokens: options?.maxTokens ?? 1000,
      temperature: options?.temperature ?? 0.7,
      timeout: options?.timeout ?? this.config.timeout,
      useCache: options?.useCache ?? this.config.cacheConfig?.enabled,
      cacheTTL: options?.cacheTTL ?? this.config.cacheConfig?.ttl,
      retryOnError: options?.retryOnError ?? true,
      maxRetries: options?.maxRetries ?? this.config.retryConfig?.maxRetries,
      streamResponse: options?.streamResponse ?? false,
      ...options,
    };
  }

  /**
   * 에러 응답 생성
   */
  protected createErrorResponse(_query: string, error: Error): AIResponse {
    return {
      response: `Error processing query: ${error.message}`,
      metadata: {
        timestamp: new Date().toISOString(),
        source: this.type,
        tags: ['error'],
      },
      source: this.type,
      cached: false,
      error: error,
    };
  }

  /**
   * 성공 메트릭 업데이트
   */
  protected updateSuccessMetrics(responseTime: number): void {
    const metrics = this.ensureMetrics();
    metrics.successfulRequests++;

    // 평균 응답 시간 계산 (이동 평균)
    const totalRequests = metrics.successfulRequests;
    const currentAvg = metrics.averageResponseTime;
    metrics.averageResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * 실패 메트릭 업데이트
   */
  protected updateFailureMetrics(responseTime: number): void {
    const metrics = this.ensureMetrics();
    metrics.failedRequests++;

    // 에러가 있어도 응답 시간은 기록
    if (responseTime > 0) {
      const totalRequests = metrics.totalRequests;
      const currentAvg = metrics.averageResponseTime;
      metrics.averageResponseTime =
        (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    }
  }

  /**
   * 복잡도 계산 (기본 구현)
   */
  protected calculateComplexity(query: string): ComplexityScore {
    const wordCount = query.split(/\s+/).length;
    const hasSpecialChars = /[^a-zA-Z0-9\s가-힣]/.test(query);
    const hasNumbers = /\d/.test(query);
    const hasCode = /[{}()[];:<>]/.test(query);

    const factors: string[] = [];
    let score = 0;

    // 길이 기반 점수
    if (wordCount > 50) {
      score += 3;
      factors.push('long_query');
    } else if (wordCount > 20) {
      score += 2;
      factors.push('medium_query');
    } else {
      score += 1;
      factors.push('short_query');
    }

    // 특수 문자
    if (hasSpecialChars) {
      score += 1;
      factors.push('special_chars');
    }

    // 숫자 포함
    if (hasNumbers) {
      score += 1;
      factors.push('numeric_content');
    }

    // 코드 패턴
    if (hasCode) {
      score += 2;
      factors.push('code_pattern');
    }

    // 카테고리 결정
    let _category: 'simple' | 'moderate' | 'complex';
    if (score <= 2) {
      _category = 'simple';
    } else if (score <= 5) {
      _category = 'moderate';
    } else {
      _category = 'complex';
    }

    // ComplexityScore 인터페이스에 맞게 반환
    return {
      overall: Math.min(10, score),
      queryLength: Math.min(10, wordCount > 50 ? 8 : wordCount > 20 ? 5 : 2),
      conceptCount: Math.min(10, factors.length),
      technicalDepth: Math.min(10, hasCode ? 6 : hasSpecialChars ? 3 : 1),
      contextDependency: Math.min(10, wordCount > 30 ? 5 : 2),
    };
  }

  /**
   * 지연 유틸리티
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 추상 메서드 - 서브클래스에서 구현 필요
  protected abstract doInitialize(): Promise<void>;
  protected abstract doProcess(
    query: string,
    options: AIQueryOptions
  ): Promise<AIResponse>;
  protected abstract doHealthCheck(): Promise<boolean>;
  protected abstract doShutdown(): Promise<void>;
}
