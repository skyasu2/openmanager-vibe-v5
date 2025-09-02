/**
 * 🎯 성능 최적화된 SimplifiedQueryEngine
 *
 * 주요 개선사항:
 * - 지연 초기화 및 워밍업 전략
 * - 병렬 처리 및 파이프라이닝
 * - 다층 캐싱 시스템
 * - 예측적 로딩
 * - 회로 차단기 패턴
 */

import {
  SimplifiedQueryEngine,
  type QueryRequest,
  type QueryResponse,
} from './SimplifiedQueryEngine';
import { getQueryCacheManager } from './query-cache-manager';
import { getVectorSearchOptimizer } from './vector-search-optimizer';
import { aiLogger } from '../../lib/logger';
import type {
  MCPContext,
  AIQueryContext,
  AIQueryOptions,
} from '../../types/ai-service-types';

interface PerformanceConfig {
  enableParallelProcessing: boolean;
  enablePredictiveLoading: boolean;
  enableCircuitBreaker: boolean;
  warmupOnStart: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'adaptive';
  timeoutMs: number;
}

interface PerformanceMetrics {
  totalQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;
  optimizationsSaved: number;
  errorRate: number;
  parallelEfficiency: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  threshold: number;
  timeout: number;
}

interface RAGResultItem {
  content?: string;
  text?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface RAGResult {
  results: RAGResultItem[];
  query?: string;
  timestamp?: number;
  source?: string;
}

export class PerformanceOptimizedQueryEngine extends SimplifiedQueryEngine {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private warmupCompleted = false;
  private preloadedEmbeddings = new Map<string, number[]>();
  private queryQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(config?: Partial<PerformanceConfig>) {
    super();

    this.config = {
      enableParallelProcessing: true,
      enablePredictiveLoading: true,
      enableCircuitBreaker: true,
      warmupOnStart: true,
      cacheStrategy: 'adaptive',
      timeoutMs: 15000,
      ...config,
    };

    this.metrics = {
      totalQueries: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      optimizationsSaved: 0,
      errorRate: 0,
      parallelEfficiency: 0,
    };

    this.circuitBreakers = new Map();

    // 워밍업 시작
    if (this.config.warmupOnStart) {
      this.performWarmup().catch((error) => {
        aiLogger.error('워밍업 실패', error);
      });
    }
  }

  /**
   * 🔥 시스템 워밍업 - 초기화 오버헤드 제거
   */
  private async performWarmup(): Promise<void> {
    if (this.warmupCompleted) return;

    try {
      aiLogger.info('성능 최적화 엔진 워밍업 시작');
      const startTime = Date.now();

      // 1. 기본 초기화
      await super._initialize();

      // 2. 자주 사용되는 쿼리 패턴 예열
      const commonQueries = [
        '서버 상태',
        'CPU 사용률',
        '메모리 상태',
        '디스크 용량',
        '네트워크 트래픽',
      ];

      // 3. 병렬 임베딩 생성
      if (this.config.enablePredictiveLoading) {
        await Promise.allSettled(
          commonQueries.map(async (query) => {
            try {
              const embedding = await this.ragEngine.generateEmbedding(query);
              if (embedding) {
                this.preloadedEmbeddings.set(query, embedding);
              }
            } catch (error) {
              aiLogger.warn(`임베딩 예열 실패: ${query}`, error);
            }
          })
        );
      }

      // 4. 캐시 매니저 초기화
      getQueryCacheManager();
      getVectorSearchOptimizer();

      // 5. 헬스체크로 모든 엔진 확인
      await this.healthCheck();

      this.warmupCompleted = true;
      const warmupTime = Date.now() - startTime;

      aiLogger.info('워밍업 완료', {
        duration: warmupTime,
        preloadedEmbeddings: this.preloadedEmbeddings.size,
        cacheReady: true,
      });
    } catch (error) {
      aiLogger.error('워밍업 중 오류 발생', error);
      // 워밍업 실패해도 진행
      this.warmupCompleted = true;
    }
  }

  /**
   * 🚀 최적화된 쿼리 처리
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    // 워밍업 대기 (한 번만)
    if (!this.warmupCompleted) {
      await this.performWarmup();
    }

    try {
      this.metrics.totalQueries++;

      // 1. 회로 차단기 확인
      if (this.config.enableCircuitBreaker) {
        const breakerKey = `${request.mode || 'local'}`;
        if (this.isCircuitOpen(breakerKey)) {
          return this.getFallbackResponse(request, 'Circuit breaker open');
        }
      }

      // 2. 캐시 우선 확인 (빠른 응답)
      const cacheResult = await this.getFromAdvancedCache(request);
      if (cacheResult) {
        this.updateMetrics(true, Date.now() - startTime);
        return cacheResult;
      }

      // 3. 병렬 처리 활성화된 경우
      if (this.config.enableParallelProcessing) {
        return await this.processQueryParallel(request, startTime);
      } else {
        return await this.processQuerySequential(request);
      }
    } catch (error) {
      this.recordFailure(request.mode || 'local');
      aiLogger.error('최적화된 쿼리 처리 실패', error);

      return this.getFallbackResponse(
        request,
        error instanceof Error ? error.message : '알 수 없는 오류'
      );
    }
  }

  /**
   * 🔄 병렬 쿼리 처리
   */
  private async processQueryParallel(
    request: QueryRequest,
    startTime: number
  ): Promise<QueryResponse> {
    const { query, mode = 'local', context, options } = request;

    // 병렬로 실행할 작업들 준비
    const tasks: Promise<unknown>[] = [];

    // 1. MCP 컨텍스트 수집 (필요한 경우)
    let mcpContextPromise: Promise<unknown> | null = null;
    if (options?.includeMCPContext) {
      mcpContextPromise = this.loadMCPContextAsync(query);
      tasks.push(mcpContextPromise);
    }

    // 2. 임베딩 생성 (로컬 모드용)
    let embeddingPromise: Promise<number[]> | null = null;
    if (mode === 'local') {
      embeddingPromise = this.getOptimizedEmbedding(query);
      tasks.push(embeddingPromise);
    }

    // 3. 병렬 작업 실행
    const taskResults = await Promise.allSettled(tasks);

    // 4. 결과 처리
    const mcpContext = mcpContextPromise
      ? taskResults[0].status === 'fulfilled'
        ? taskResults[0].value
        : null
      : null;

    if (mode === 'local') {
      const embeddingResult =
        embeddingPromise &&
        (taskResults.find((r) => r.status === 'fulfilled')?.value as
          | number[]
          | null
          | undefined);
      const embedding = embeddingResult === null ? undefined : embeddingResult;
      return await this.processLocalQueryOptimized(
        query,
        context,
        options || {},
        mcpContext,
        embedding,
        startTime
      );
    } else {
      return await this.processGoogleAIQueryOptimized(
        query,
        context,
        options || {},
        mcpContext,
        startTime
      );
    }
  }

  /**
   * 📈 순차 쿼리 처리 (기본 방식)
   */
  private async processQuerySequential(
    request: QueryRequest
  ): Promise<QueryResponse> {
    // 기존 SimplifiedQueryEngine 로직 사용
    return await super.query(request);
  }

  /**
   * 🧠 최적화된 임베딩 생성
   */
  private async getOptimizedEmbedding(query: string): Promise<number[]> {
    // 1. 예열된 임베딩 확인
    const preloaded = this.preloadedEmbeddings.get(query);
    if (preloaded) {
      aiLogger.debug('예열된 임베딩 사용', { query: query.substring(0, 30) });
      return preloaded;
    }

    // 2. 유사한 쿼리 패턴 확인
    for (const [
      preloadedQuery,
      embedding,
    ] of Array.from(this.preloadedEmbeddings.entries())) {
      const similarity = this.calculateQuerySimilarity(query, preloadedQuery);
      if (similarity > 0.8) {
        aiLogger.debug('유사 쿼리 임베딩 재사용', {
          original: preloadedQuery.substring(0, 30),
          current: query.substring(0, 30),
          similarity,
        });
        return embedding;
      }
    }

    // 3. 새 임베딩 생성
    const newEmbedding = await this.ragEngine.generateEmbedding(query);
    if (!newEmbedding) {
      throw new Error('Failed to generate embedding');
    }
    return newEmbedding;
  }

  /**
   * 📊 쿼리 유사도 계산 (간단한 구현)
   */
  private calculateQuerySimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));

    const intersection = new Set(Array.from(words1).filter((x) => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  /**
   * 🔄 MCP 컨텍스트 비동기 로딩
   */
  private async loadMCPContextAsync(query: string): Promise<unknown> {
    try {
      const contextLoader = this.contextLoader;
      return await contextLoader.queryMCPContextForRAG(query, {
        maxFiles: 3, // 성능을 위해 파일 수 제한
        includeSystemContext: false, // 필수 정보만
      });
    } catch (error) {
      aiLogger.warn('MCP 컨텍스트 로딩 실패', error);
      return null;
    }
  }

  /**
   * 🏠 최적화된 로컬 쿼리 처리
   */
  private async processLocalQueryOptimized(
    query: string,
    context: unknown,
    options: AIQueryOptions,
    mcpContext: unknown,
    embedding: number[] | undefined,
    startTime: number
  ): Promise<QueryResponse> {
    try {
      if (!embedding) {
        embedding = await this.getOptimizedEmbedding(query);
      }

      // 최적화된 벡터 검색
      const ragResult = await this.ragEngine.searchSimilar(query, {
        maxResults: 3, // 성능을 위해 결과 수 제한
        threshold: 0.6, // 임계값 상향 조정
        category:
          typeof options?.category === 'string' ? options.category : undefined,
        enableMCP: false,
        cached: true,
      });

      const response = this.generateLocalResponse(
        query,
        ragResult,
        mcpContext as MCPContext | null,
        context as AIQueryContext | undefined
      );

      return {
        success: true,
        response,
        engine: 'local-rag',
        confidence: this.calculateConfidence(ragResult),
        thinkingSteps: this.generateOptimizedThinkingSteps(),
        metadata: {
          ragResults: ragResult.totalResults,
          cached: ragResult.cached,
          mcpUsed: !!mcpContext,
          optimized: true,
          parallelProcessed: true,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(
        `로컬 쿼리 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 🌐 Google AI 처리 - 접근 제한됨
   */
  private async processGoogleAIQueryOptimized(
    query: string,
    context: unknown,
    options: AIQueryOptions,
    mcpContext: unknown,
    startTime: number
  ): Promise<QueryResponse> {
    // Google AI access restricted - only available through AI Assistant
    aiLogger.warn('Google AI 직접 접근 차단됨, 로컬 모드로 전환');
    return await this.processLocalQueryOptimized(
      query,
      context,
      options,
      mcpContext,
      undefined,
      startTime
    );
  }

  /**
   * 💾 고급 캐시 확인
   */
  private async getFromAdvancedCache(
    request: QueryRequest
  ): Promise<QueryResponse | null> {
    try {
      const cacheManager = getQueryCacheManager();

      // 1. 패턴 캐시 확인
      const patternCached = await cacheManager.getFromPatternCache(
        request.query
      );
      if (patternCached) {
        // complexity를 별도로 추출하여 metadata에서 제외
        const { complexity, ...restMetadata } = patternCached.metadata || {};

        return {
          ...patternCached,
          metadata: {
            ...restMetadata,
            cacheHit: true,
            cacheType: 'pattern',
            // complexity는 JSON 문자열로 변환하여 저장
            ...(complexity && { complexityData: JSON.stringify(complexity) }),
          },
        };
      }

      // 2. 추가 캐시 전략 (향후 구현)
      return null;
    } catch (error) {
      aiLogger.warn('캐시 확인 실패', error);
      return null;
    }
  }

  /**
   * ⚡ 간소화된 thinking steps 생성
   */
  private generateOptimizedThinkingSteps(): QueryResponse['thinkingSteps'] {
    return [
      {
        step: '최적화된 처리',
        description: `병렬 처리 및 캐싱 적용`,
        status: 'completed',
        timestamp: Date.now(),
      },
    ];
  }

  /**
   * 🔌 회로 차단기 패턴
   */
  private isCircuitOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordFailure(service: string): void {
    let breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        threshold: 5,
        timeout: 30000, // 30초
      };
      this.circuitBreakers.set(service, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'open';
      aiLogger.warn(`회로 차단기 열림: ${service}`, {
        failures: breaker.failures,
        threshold: breaker.threshold,
      });
    }
  }

  /**
   * 🆘 폴백 응답 생성
   */
  private getFallbackResponse(
    request: QueryRequest,
    reason: string
  ): QueryResponse {
    return {
      success: true,
      response:
        '현재 시스템이 일시적으로 제한된 모드로 동작중입니다. 기본적인 정보를 제공해드릴 수 있습니다.',
      engine: 'fallback',
      confidence: 0.3,
      thinkingSteps: [
        {
          step: '폴백 모드',
          description: reason,
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        fallback: true,
        reason,
      },
      processingTime: 50, // 빠른 응답
    };
  }

  /**
   * 📊 메트릭 업데이트
   */
  private updateMetrics(cacheHit: boolean, responseTime: number): void {
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalQueries - 1) +
        responseTime) /
      this.metrics.totalQueries;

    if (cacheHit) {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate * (this.metrics.totalQueries - 1) + 1) /
        this.metrics.totalQueries;
    } else {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate * (this.metrics.totalQueries - 1)) /
        this.metrics.totalQueries;
    }
  }

  /**
   * 📈 성능 통계 반환
   */
  getPerformanceStats(): {
    metrics: PerformanceMetrics;
    optimization: {
      warmupCompleted: boolean;
      preloadedEmbeddings: number;
      circuitBreakers: number;
      cacheHitRate: number;
    };
  } {
    return {
      metrics: { ...this.metrics },
      optimization: {
        warmupCompleted: this.warmupCompleted,
        preloadedEmbeddings: this.preloadedEmbeddings.size,
        circuitBreakers: this.circuitBreakers.size,
        cacheHitRate: this.metrics.cacheHitRate,
      },
    };
  }

  /**
   * 🔄 성능 설정 업데이트
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    aiLogger.info('성능 설정 업데이트됨', newConfig);
  }

  /**
   * 🧹 캐시 정리
   */
  clearOptimizationCache(): void {
    this.preloadedEmbeddings.clear();
    this.circuitBreakers.clear();
    this.warmupCompleted = false;
    aiLogger.info('최적화 캐시 정리됨');
  }

  /**
   * 🏠 로컬 응답 생성
   */
  private generateLocalResponse(
    query: string,
    ragResult: RAGResult | null,
    mcpContext: MCPContext | null,
    context?: AIQueryContext
  ): string {
    try {
      // RAG 결과가 있으면 그를 기반으로 응답 생성
      if (ragResult && ragResult.results && ragResult.results.length > 0) {
        const topResult = ragResult.results[0];
        return `질문에 대한 답변: ${topResult.content || topResult.text || '관련 정보를 찾았습니다.'}`;
      }

      // MCP 컨텍스트가 있으면 활용
      if (mcpContext) {
        return `MCP 컨텍스트를 활용한 답변: ${query}에 대한 정보를 시스템에서 찾을 수 있습니다.`;
      }

      // 기본 응답
      return `${query}에 대한 기본 정보를 제공합니다. 더 구체적인 정보가 필요하시면 자세히 설명해주세요.`;
    } catch (error) {
      aiLogger.error('로컬 응답 생성 실패', error);
      return '죄송합니다. 현재 응답을 생성할 수 없습니다.';
    }
  }

  /**
   * 🎯 신뢰도 계산
   */
  private calculateConfidence(ragResult: RAGResult | null): number {
    try {
      if (!ragResult || !ragResult.results) return 0.3;

      // 결과의 수와 품질을 기반으로 신뢰도 계산
      const resultCount = ragResult.results.length;
      const hasHighQualityResults = ragResult.results.some(
        (result: RAGResultItem) => result.score && result.score > 0.8
      );

      let confidence = 0.5; // 기본값

      if (resultCount > 0) confidence += 0.2;
      if (resultCount > 3) confidence += 0.1;
      if (hasHighQualityResults) confidence += 0.2;
      if ((ragResult as any).cached) confidence += 0.05;

      return Math.min(confidence, 0.95); // 최대 0.95
    } catch (error) {
      aiLogger.error('신뢰도 계산 실패', error);
      return 0.3;
    }
  }

  /**
   * 🌐 Google AI 프롬프트 구성
   */
  private buildGoogleAIPrompt(
    query: string,
    context?: AIQueryContext,
    mcpContext?: MCPContext | null
  ): string {
    try {
      let prompt = `사용자 질문: ${query}\n\n`;

      // 컨텍스트 추가
      if (context) {
        prompt += `컨텍스트 정보:\n`;
        if (context.user?.id) prompt += `- 사용자 ID: ${context.user.id}\n`;
        if (context.session?.id) prompt += `- 세션 ID: ${context.session.id}\n`;
        if (context.previousQueries) {
          prompt += `- 이전 질문들: ${context.previousQueries.slice(-3).join(', ')}\n`;
        }
        prompt += '\n';
      }

      // MCP 컨텍스트 추가
      if (mcpContext) {
        prompt += `시스템 컨텍스트:\n`;
        prompt += `- MCP 연결 상태: 활성화\n`;
        prompt += `- 사용 가능한 도구들이 있습니다.\n\n`;
      }

      prompt += `다음 지침을 따라 응답해주세요:
1. 한국어로 명확하고 도움이 되는 답변을 제공하세요.
2. 기술적인 내용은 구체적인 예시와 함께 설명하세요.
3. 불확실한 정보는 추측하지 말고 확인이 필요하다고 말씀하세요.
4. 답변은 간결하면서도 충분한 정보를 포함해야 합니다.`;

      return prompt;
    } catch (error) {
      aiLogger.error('Google AI 프롬프트 구성 실패', error);
      return query; // 기본값으로 질문만 반환
    }
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    engines: {
      localRAG: boolean;
      googleAI: boolean;
      mcp: boolean;
    };
  }> {
    try {
      // 부모 클래스의 healthCheck 호출
      const baseHealth = await super.healthCheck();

      // 성능 메트릭과 회로 차단기 상태를 반영한 상태 반환
      const optimizationHealth =
        this.circuitBreakers.size > 0 &&
        Array.from(this.circuitBreakers.values()).every(
          (cb) => cb.state !== 'open'
        );

      return {
        status:
          baseHealth.status === 'healthy' && optimizationHealth
            ? 'healthy'
            : 'degraded',
        engines: {
          localRAG: baseHealth.engines.localRAG && this.isInitialized,
          googleAI: baseHealth.engines.googleAI,
          mcp: baseHealth.engines.mcp,
        },
      };
    } catch {
      return {
        status: 'degraded',
        engines: {
          localRAG: false,
          googleAI: false,
          mcp: false,
        },
      };
    }
  }
}

// 싱글톤 인스턴스
let performanceEngineInstance: PerformanceOptimizedQueryEngine | null = null;

export function getPerformanceOptimizedQueryEngine(
  config?: Partial<PerformanceConfig>
): PerformanceOptimizedQueryEngine {
  if (!performanceEngineInstance) {
    performanceEngineInstance = new PerformanceOptimizedQueryEngine(config);
  }
  return performanceEngineInstance;
}
