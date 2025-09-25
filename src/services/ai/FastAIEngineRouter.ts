/**
 * 🚀 FastAIEngineRouter - 초고속 AI 엔진 라우터
 *
 * 성능 최적화 목표: 152ms → 70-90ms
 *
 * 핵심 최적화 전략:
 * - 3단계 캐시 전략 (L1: 메모리, L2: 패턴, L3: 유사도)
 * - 5단계 병렬 파이프라인
 * - 예측적 엔진 선택
 * - Circuit Breaker 패턴
 * - 임베딩 차원 최적화 (384→256)
 * - 쿼리 복잡도 빠른 분류
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 * @performance_target 70-90ms average response time
 */

import {
  SimplifiedQueryEngine,
  type QueryRequest,
  type QueryResponse,
} from './SimplifiedQueryEngine';
import { PerformanceOptimizedQueryEngine } from './performance-optimized-query-engine';
import {
  QueryComplexityAnalyzer,
  type QueryAnalysis,
} from './QueryComplexityAnalyzer';
import { getQueryCacheManager } from './query-cache-manager';
import type { AIMetadata } from '../../types/ai-service-types';

interface FastRouterConfig {
  enablePredictiveRouting: boolean;
  enableCircuitBreaker: boolean;
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  maxResponseTime: number; // 150ms 타겟
  parallelProcessing: boolean;
  embeddingDimension: 256 | 384; // 256으로 최적화
}

interface EngineMetrics {
  avgResponseTime: number;
  successRate: number;
  errorCount: number;
  lastUsed: number;
  circuitState: 'closed' | 'open' | 'half-open';
}

interface RouteDecision {
  engine: 'local-rag' | 'google-ai' | 'performance-optimized' | 'fallback';
  confidence: number;
  estimatedTime: number;
  reasoning: string;
}

interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  hitCount: number;
  pattern: string;
}

export class FastAIEngineRouter {
  private localEngine: SimplifiedQueryEngine;
  private performanceEngine: PerformanceOptimizedQueryEngine;
  private cacheManager = getQueryCacheManager();
  private config: FastRouterConfig;

  // 성능 메트릭 추적
  private engineMetrics = new Map<string, EngineMetrics>();

  // 3단계 캐시 시스템
  private L1Cache = new Map<string, CacheEntry>(); // 정확한 매치
  private L2Cache = new Map<string, CacheEntry>(); // 패턴 매치
  private L3Cache = new Map<string, CacheEntry[]>(); // 유사도 매치

  // 빠른 패턴 인식을 위한 사전 컴파일된 패턴
  private quickPatterns = new Map<RegExp, RouteDecision>();

  constructor(config?: Partial<FastRouterConfig>) {
    this.config = {
      enablePredictiveRouting: true,
      enableCircuitBreaker: true,
      cacheStrategy: 'aggressive', // 캐시 우선
      maxResponseTime: 150,
      parallelProcessing: true,
      embeddingDimension: 256, // 성능 최적화
      ...config,
    };

    this.localEngine = new SimplifiedQueryEngine();
    this.performanceEngine = new PerformanceOptimizedQueryEngine({
      enableParallelProcessing: true,
      enablePredictiveLoading: true,
      cacheStrategy: 'adaptive',
      timeoutMs: this.config.maxResponseTime - 20, // 여유분 20ms
    });

    this.initializeOptimizations();
  }

  /**
   * 🎯 초고속 라우팅 - 70-90ms 목표
   */
  async route(request: QueryRequest): Promise<QueryResponse> {
    const startTime = performance.now(); // 고정밀 타이밍
    const { query } = request;

    try {
      // Phase 1: 초고속 캐시 확인 (1-3ms)
      const cachedResult = this.checkFastCache(query);
      if (cachedResult) {
        this.updateMetrics('cache', true, performance.now() - startTime);
        return this.enrichResponse(cachedResult, startTime, 'cache');
      }

      // Phase 2: 빠른 패턴 인식 (2-5ms)
      const quickRoute = this.quickPatternMatch(query);
      if (quickRoute) {
        const response = await this.executeQuickRoute(request, quickRoute);
        this.cacheResponse(query, response);
        return this.enrichResponse(response, startTime, 'pattern');
      }

      // Phase 3: 병렬 분석 (10-15ms)
      const routeDecision = await this.analyzeInParallel(request);

      // Phase 4: 최적 엔진 실행 (50-70ms)
      const response = await this.executeWithEngine(request, routeDecision);

      // Phase 5: 결과 캐싱 (1-2ms)
      this.cacheResponse(query, response);
      this.updateMetrics(
        routeDecision.engine,
        true,
        performance.now() - startTime
      );

      return this.enrichResponse(response, startTime, routeDecision.engine);
    } catch (error) {
      const fallbackResponse = await this.generateFallbackResponse(
        request,
        error
      );
      this.updateMetrics('fallback', false, performance.now() - startTime);

      console.warn('FastAIRouter 실패, 폴백:', {
        query: query.substring(0, 50),
        error: error instanceof Error ? error.message : error,
        time: performance.now() - startTime,
      });

      return this.enrichResponse(fallbackResponse, startTime, 'fallback');
    }
  }

  /**
   * ⚡ 1단계: 초고속 캐시 확인 (1-3ms)
   */
  private checkFastCache(query: string): QueryResponse | null {
    const normalizedQuery = this.normalizeQuery(query);

    // L1: 정확한 매치
    const l1Hit = this.L1Cache.get(normalizedQuery);
    if (l1Hit && this.isCacheValid(l1Hit)) {
      l1Hit.hitCount++;
      console.debug('L1 캐시 적중', { query: query.substring(0, 30) });
      return l1Hit.response;
    }

    // L2: 패턴 매치
    const pattern = this.generatePattern(normalizedQuery);
    const l2Hit = this.L2Cache.get(pattern);
    if (l2Hit && this.isCacheValid(l2Hit)) {
      l2Hit.hitCount++;
      console.debug('L2 캐시 적중', { pattern });
      return l2Hit.response;
    }

    // L3: 유사도 매치 (가장 빠른 구현)
    const similarEntries = this.L3Cache.get(pattern) || [];
    for (const entry of similarEntries.slice(0, 3)) {
      // 최대 3개만 확인
      if (
        this.isCacheValid(entry) &&
        this.quickSimilarity(query, entry.pattern) > 0.85
      ) {
        entry.hitCount++;
        console.debug('L3 캐시 적중', { similarity: '85%+' });
        return entry.response;
      }
    }

    return null;
  }

  /**
   * ⚡ 2단계: 빠른 패턴 인식 (2-5ms)
   */
  private quickPatternMatch(query: string): RouteDecision | null {
    const lowerQuery = query.toLowerCase();

    // 사전 컴파일된 패턴으로 빠른 매칭
    for (const [pattern, decision] of this.quickPatterns.entries()) {
      if (pattern.test(lowerQuery)) {
        console.debug('패턴 매치', { pattern: pattern.source });
        return decision;
      }
    }

    return null;
  }

  /**
   * ⚡ 3단계: 병렬 분석 (10-15ms)
   */
  private async analyzeInParallel(
    request: QueryRequest
  ): Promise<RouteDecision> {
    const { query } = request;

    // 타임아웃으로 보호된 병렬 실행
    const timeout = 15; // 15ms 제한
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timeout')), timeout)
    );

    try {
      const [complexity, circuitState] = await Promise.race([
        Promise.all([
          QueryComplexityAnalyzer.analyze(query),
          this.getCircuitStates(),
        ]),
        timeoutPromise,
      ]);

      return this.makeRouteDecision(complexity, circuitState, request.mode);
    } catch (error) {
      // 분석 실패 시 빠른 폴백
      console.warn('병렬 분석 실패, 빠른 결정', error);
      return this.makeFastDecision(query);
    }
  }

  /**
   * 🚀 4단계: 최적 엔진 실행 (50-70ms)
   */
  private async executeWithEngine(
    request: QueryRequest,
    decision: RouteDecision
  ): Promise<QueryResponse> {
    const timeout = Math.min(
      decision.estimatedTime + 10,
      this.config.maxResponseTime - 30
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Engine timeout')), timeout)
    );

    let executionPromise: Promise<QueryResponse>;

    switch (decision.engine) {
      case 'performance-optimized':
        executionPromise = this.performanceEngine.query(request);
        break;

      case 'local-rag':
        executionPromise = this.localEngine.query({
          ...request,
          mode: 'local',
          enableGoogleAI: false,
          options: {
            ...request.options,
            timeoutMs: timeout,
            cached: true, // 캐싱 활성화
          },
        });
        break;

      case 'google-ai':
        executionPromise = this.localEngine.query({
          ...request,
          mode: 'GOOGLE_AI',
          enableGoogleAI: true,
          options: {
            ...request.options,
            timeoutMs: timeout,
          },
        });
        break;

      default:
        executionPromise = this.generateFallbackResponse(
          request,
          'Unknown engine'
        );
    }

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      console.warn(`${decision.engine} 실행 실패, 폴백`, error);

      // 빠른 폴백: 가장 간단한 엔진
      if (decision.engine !== 'local-rag') {
        return await this.localEngine.query({
          ...request,
          mode: 'local',
          enableGoogleAI: false,
          options: { timeoutMs: 50 }, // 매우 빠른 응답
        });
      }

      throw error;
    }
  }

  /**
   * 💾 5단계: 응답 캐싱 (1-2ms)
   */
  private cacheResponse(query: string, response: QueryResponse): void {
    if (!response.success || !response.response) return;

    const normalizedQuery = this.normalizeQuery(query);
    const pattern = this.generatePattern(normalizedQuery);
    const timestamp = Date.now();

    const cacheEntry: CacheEntry = {
      response,
      timestamp,
      hitCount: 0,
      pattern: normalizedQuery,
    };

    // 빠른 응답만 캐시 (성능 기준)
    if (response.processingTime && response.processingTime < 120) {
      // L1: 정확한 쿼리
      this.L1Cache.set(normalizedQuery, cacheEntry);

      // L2: 패턴 기반
      this.L2Cache.set(pattern, cacheEntry);

      // L3: 유사도 기반
      const similarEntries = this.L3Cache.get(pattern) || [];
      similarEntries.unshift(cacheEntry);
      if (similarEntries.length > 5) similarEntries.pop(); // 최대 5개
      this.L3Cache.set(pattern, similarEntries);
    }

    // 캐시 크기 제한 (메모리 최적화)
    this.cleanupCacheIfNeeded();
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w가-힣\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generatePattern(query: string): string {
    // 핵심 키워드만 추출하여 패턴 생성
    const keywords = query
      .split(' ')
      .filter((word) => word.length > 2)
      .slice(0, 3) // 최대 3개
      .sort()
      .join('_');
    return `pattern_${keywords}`;
  }

  private quickSimilarity(a: string, b: string): number {
    // 빠른 유사도 계산 (정확도보다 속도 우선)
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const words1 = new Set(a.split(' '));
    const words2 = new Set(b.split(' '));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    const maxAge = this.getCacheMaxAge(entry.hitCount);
    return age < maxAge;
  }

  private getCacheMaxAge(hitCount: number): number {
    // 히트 수에 따른 동적 TTL
    if (hitCount > 10) return 3600000; // 1시간
    if (hitCount > 5) return 1800000; // 30분
    return 900000; // 15분
  }

  private makeRouteDecision(
    analysis: QueryAnalysis,
    circuitState: Map<string, boolean>,
    preferredMode?: string
  ): RouteDecision {
    // Circuit Breaker 확인
    if (
      analysis.recommendedEngine === 'google-ai' &&
      circuitState.get('google-ai')
    ) {
      return {
        engine: 'local-rag',
        confidence: 0.8,
        estimatedTime: analysis.estimatedResponseTime.local,
        reasoning: 'Google AI circuit open',
      };
    }

    // 단순한 쿼리는 성능 최적화 엔진 사용
    if (analysis.complexity === 'simple' && analysis.confidence > 0.8) {
      return {
        engine: 'performance-optimized',
        confidence: 0.95,
        estimatedTime: Math.min(analysis.estimatedResponseTime.local * 0.6, 70),
        reasoning: 'Simple query, performance engine',
      };
    }

    // 기본 추천 엔진 사용
    const engine =
      analysis.recommendedEngine === 'google-ai' ? 'google-ai' : 'local-rag';
    return {
      engine: engine as RouteDecision['engine'],
      confidence: analysis.confidence,
      estimatedTime:
        engine === 'google-ai'
          ? analysis.estimatedResponseTime.googleAI
          : analysis.estimatedResponseTime.local,
      reasoning: `Analysis recommendation: ${engine}`,
    };
  }

  private makeFastDecision(query: string): RouteDecision {
    // 빠른 휴리스틱 기반 결정
    const lowerQuery = query.toLowerCase();

    // 복잡한 쿼리 패턴
    const complexPatterns = [
      '분석',
      '최적화',
      '비교',
      '평가',
      'analyze',
      'optimize',
    ];
    const isComplex = complexPatterns.some((pattern) =>
      lowerQuery.includes(pattern)
    );

    if (isComplex) {
      return {
        engine: 'google-ai',
        confidence: 0.7,
        estimatedTime: 200,
        reasoning: 'Fast heuristic: complex query',
      };
    }

    return {
      engine: 'performance-optimized',
      confidence: 0.8,
      estimatedTime: 70,
      reasoning: 'Fast heuristic: simple query',
    };
  }

  private async executeQuickRoute(
    request: QueryRequest,
    decision: RouteDecision
  ): Promise<QueryResponse> {
    // 빠른 경로 실행 (패턴 매칭된 경우)
    return await this.executeWithEngine(request, decision);
  }

  private enrichResponse(
    response: QueryResponse,
    startTime: number,
    source: string
  ): QueryResponse {
    const processingTime = performance.now() - startTime;

    return {
      ...response,
      processingTime,
      metadata: {
        ...response.metadata,
        routingSource: source,
        optimizedRouting: true,
        fastRouter: true,
        targetTime: this.config.maxResponseTime,
      } as AIMetadata,
    };
  }

  private async generateFallbackResponse(
    request: QueryRequest,
    error: unknown
  ): Promise<QueryResponse> {
    return {
      success: false,
      response:
        '시스템이 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
      engine: 'fallback',
      confidence: 0.3,
      thinkingSteps: [
        {
          step: '폴백 모드',
          description: error instanceof Error ? error.message : String(error),
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        fallback: true,
        error: error instanceof Error ? error.message : String(error),
        fastRouter: true,
      } as AIMetadata,
      processingTime: 50, // 매우 빠른 폴백
      error: error instanceof Error ? error.message : String(error),
    };
  }

  private initializeOptimizations(): void {
    // 사전 컴파일된 빠른 패턴들
    this.quickPatterns.set(/^(서버|시스템)\s*(상태|status)/i, {
      engine: 'local-rag',
      confidence: 0.9,
      estimatedTime: 60,
      reasoning: 'Server status pattern',
    });

    this.quickPatterns.set(/^(cpu|메모리|memory)\s*(사용률|usage|확인)/i, {
      engine: 'performance-optimized',
      confidence: 0.95,
      estimatedTime: 50,
      reasoning: 'Resource monitoring pattern',
    });

    this.quickPatterns.set(/^(분석|optimize|최적화)\s/i, {
      engine: 'google-ai',
      confidence: 0.85,
      estimatedTime: 180,
      reasoning: 'Analysis request pattern',
    });

    // 메트릭 초기화
    const engines = [
      'local-rag',
      'google-ai',
      'performance-optimized',
      'fallback',
      'cache',
    ];
    engines.forEach((engine) => {
      this.engineMetrics.set(engine, {
        avgResponseTime: 100,
        successRate: 0.95,
        errorCount: 0,
        lastUsed: Date.now(),
        circuitState: 'closed',
      });
    });

    console.log('🚀 FastAIEngineRouter 최적화 완료');
  }

  private updateMetrics(
    engine: string,
    success: boolean,
    responseTime: number
  ): void {
    const current = this.engineMetrics.get(engine) || {
      avgResponseTime: 100,
      successRate: 0.95,
      errorCount: 0,
      lastUsed: Date.now(),
      circuitState: 'closed',
    };

    current.avgResponseTime =
      current.avgResponseTime * 0.9 + responseTime * 0.1;
    current.successRate = success
      ? Math.min(current.successRate + 0.01, 1.0)
      : Math.max(current.successRate - 0.05, 0.0);
    current.errorCount = success
      ? Math.max(current.errorCount - 1, 0)
      : current.errorCount + 1;
    current.lastUsed = Date.now();

    // Circuit Breaker 로직
    if (current.errorCount > 3 && current.successRate < 0.7) {
      current.circuitState = 'open';
    } else if (current.circuitState === 'open' && current.successRate > 0.8) {
      current.circuitState = 'closed';
    }

    this.engineMetrics.set(engine, current);
  }

  private async getCircuitStates(): Promise<Map<string, boolean>> {
    const states = new Map<string, boolean>();

    for (const [engine, metrics] of this.engineMetrics.entries()) {
      states.set(engine, metrics.circuitState === 'open');
    }

    return states;
  }

  private cleanupCacheIfNeeded(): void {
    // 캐시 크기 제한 (메모리 관리)
    const maxSize = 1000;

    if (this.L1Cache.size > maxSize) {
      // LFU (Least Frequently Used) 정리
      const entries = Array.from(this.L1Cache.entries()).sort(
        ([, a], [, b]) => a.hitCount - b.hitCount
      );

      entries.slice(0, maxSize / 2).forEach(([key]) => {
        this.L1Cache.delete(key);
      });
    }

    // L2, L3도 동일하게 정리
    if (this.L2Cache.size > maxSize) {
      const entries = Array.from(this.L2Cache.entries()).sort(
        ([, a], [, b]) => a.hitCount - b.hitCount
      );

      entries.slice(0, maxSize / 2).forEach(([key]) => {
        this.L2Cache.delete(key);
      });
    }
  }

  /**
   * 📊 성능 통계 반환
   */
  getPerformanceStats() {
    return {
      engineMetrics: Object.fromEntries(this.engineMetrics),
      cacheStats: {
        L1Size: this.L1Cache.size,
        L2Size: this.L2Cache.size,
        L3Size: this.L3Cache.size,
        quickPatternsSize: this.quickPatterns.size,
      },
      config: this.config,
      uptime: Date.now(),
    };
  }

  /**
   * 🧹 캐시 정리
   */
  clearCache(): void {
    this.L1Cache.clear();
    this.L2Cache.clear();
    this.L3Cache.clear();
    console.log('FastAIRouter 캐시 정리됨');
  }
}

// 싱글톤 인스턴스
let fastRouterInstance: FastAIEngineRouter | null = null;

export function getFastAIEngineRouter(
  config?: Partial<FastRouterConfig>
): FastAIEngineRouter {
  if (!fastRouterInstance) {
    fastRouterInstance = new FastAIEngineRouter(config);
  }
  return fastRouterInstance;
}

/**
 * 🚀 편의 함수: 빠른 AI 쿼리 처리
 */
export async function fastAIQuery(
  query: string,
  options?: {
    mode?: 'local' | 'google-ai';
    timeoutMs?: number;
    enableCache?: boolean;
  }
): Promise<QueryResponse> {
  const router = getFastAIEngineRouter();

  const rawMode = options?.mode || 'local';
  const mode = rawMode === 'google-ai' ? 'GOOGLE_AI' :
               rawMode === 'local' ? 'LOCAL' : 'LOCAL';

  const request: QueryRequest = {
    query,
    mode,
    options: {
      timeoutMs: options?.timeoutMs || 150,
      cached: options?.enableCache !== false,
    },
  };

  return await router.route(request);
}
