/**
 * Unified AI Engine Router for OpenManager VIBE v5
 *
 * Central orchestrator for all AI services with:
 * - Intelligent routing between AI engines
 * - Comprehensive security layer
 * - Token usage monitoring and limits
 * - Circuit breaker patterns
 * - Performance optimization
 * - Korean NLP integration
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
  SimplifiedQueryEngine,
  QueryRequest,
  QueryResponse,
} from './SimplifiedQueryEngine';
import { 
  getPerformanceOptimizedQueryEngine,
  type PerformanceOptimizedQueryEngine 
} from './performance-optimized-query-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { 
  PromptSanitizer, 
  sanitizePrompt,
  type SanitizationResult 
} from './security/PromptSanitizer';
import {
  AIResponseFilter,
  filterAIResponse,
} from './security/AIResponseFilter';
import type { AIMetadata } from '@/types/ai-service-types';
import type { ComplexityScore } from './query-complexity-analyzer';

// Korean NLP Response 타입 정의
interface KoreanNLPResponse {
  intent?: string;
  entities?: Array<{ value: string; type?: string }>;
  semantic_analysis?: {
    main_topic?: string;
    urgency_level?: string;
  };
  response_guidance?: {
    visualization_suggestions?: string[];
  };
}

export interface RouterConfig {
  // 보안 설정
  enableSecurity: boolean;
  strictSecurityMode: boolean;

  // 토큰 사용량 제한
  dailyTokenLimit: number;
  userTokenLimit: number;

  // 엔진 선택 설정
  preferredEngine: 'auto' | 'google-ai' | 'local-rag' | 'korean-nlp';
  fallbackChain: string[];

  // 성능 설정
  enableCircuitBreaker: boolean;
  maxRetries: number;
  timeoutMs: number;

  // 한국어 처리
  enableKoreanNLP: boolean;
  koreanNLPThreshold: number;
}

export interface RouterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokenUsage: {
    daily: number;
    total: number;
    byUser: Map<string, number>;
  };
  engineUsage: {
    googleAI: number;
    localRAG: number;
    koreanNLP: number;
    fallback: number;
  };
  securityEvents: {
    promptsBlocked: number;
    responsesFiltered: number;
    threatsDetected: string[];
  };
}

export interface RouteResult extends QueryResponse {
  routingInfo: {
    selectedEngine: string;
    fallbackUsed: boolean;
    securityApplied: boolean;
    tokensCounted: boolean;
    processingPath: string[];
  };
}

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter;
  private config: RouterConfig;
  private metrics: RouterMetrics;

  // AI 엔진 인스턴스들
  private simplifiedEngine!: SimplifiedQueryEngine;
  private performanceEngine!: PerformanceOptimizedQueryEngine;
  private ragEngine: unknown; // SupabaseRAGEngine

  // 보안 컴포넌트들
  private promptSanitizer!: PromptSanitizer;
  private responseFilter!: AIResponseFilter;

  // Circuit Breaker 상태
  private circuitBreakers: Map<
    string,
    {
      failures: number;
      lastFailure: number;
      state: 'closed' | 'open' | 'half-open';
      threshold: number;
      timeout: number;
    }
  >;

  // 간단한 인메모리 캐시 (프로덕션에서는 Redis 사용)
  private cache: Map<string, {
    response: QueryResponse;
    timestamp: number;
    ttl: number;
  }>;

  private constructor(config?: Partial<RouterConfig>) {
    this.config = {
      enableSecurity: true,
      strictSecurityMode: true, // 엔터프라이즈급 보안 적용
      dailyTokenLimit: 10000, // 무료 티어 고려
      userTokenLimit: 1000, // 사용자당 일일 제한
      preferredEngine: 'auto',
      fallbackChain: ['local-rag', 'google-ai', 'korean-nlp'],
      enableCircuitBreaker: true,
      maxRetries: 2,
      timeoutMs: 30000, // 30초
      enableKoreanNLP: true,
      koreanNLPThreshold: 0.7,
      ...config,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      tokenUsage: {
        daily: 0,
        total: 0,
        byUser: new Map(),
      },
      engineUsage: {
        googleAI: 0,
        localRAG: 0,
        koreanNLP: 0,
        fallback: 0,
      },
      securityEvents: {
        promptsBlocked: 0,
        responsesFiltered: 0,
        threatsDetected: [],
      },
    };

    this.circuitBreakers = new Map();
    this.cache = new Map();
    
    // 동기적으로 초기화 (테스트 환경에서 문제 방지)
    try {
      this.initializeComponents();
    } catch (error) {
      console.warn('⚠️ 초기화 중 일부 컴포넌트 실패 (테스트 환경에서는 정상):', error);
    }
  }

  public static getInstance(
    config?: Partial<RouterConfig>
  ): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter(config);
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🚀 컴포넌트 초기화
   */
  private initializeComponents(): void {
    try {
      // AI 엔진들 초기화
      this.simplifiedEngine = new SimplifiedQueryEngine();
      this.performanceEngine = getPerformanceOptimizedQueryEngine();
      this.ragEngine = getSupabaseRAGEngine();

      // 보안 컴포넌트들 초기화
      this.promptSanitizer = PromptSanitizer.getInstance({
        enableStrictMode: this.config.strictSecurityMode,
        enableKoreanProtection: this.config.enableKoreanNLP,
      });

      this.responseFilter = AIResponseFilter.getInstance({
        enableStrictFiltering: this.config.strictSecurityMode,
      });

      console.log('🎯 UnifiedAIEngineRouter 초기화 완료');
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 초기화 실패:', error);
      // 테스트 환경에서는 에러를 던지지 않음
      if (process.env.NODE_ENV !== 'test') {
        throw error;
      }
    }
  }

  /**
   * 🎯 메인 라우팅 메서드
   */
  public async route(
    request: QueryRequest & { userId?: string }
  ): Promise<RouteResult> {
    const startTime = Date.now();
    const processingPath: string[] = [];
    let selectedEngine = 'unknown';
    let fallbackUsed = false;
    let securityApplied = false;
    let tokensCounted = false;

    try {
      this.metrics.totalRequests++;
      processingPath.push('request_received');

      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResponse(cacheKey);
      if (cachedResult) {
        processingPath.push('cache_hit');
        return {
          ...cachedResult,
          routingInfo: {
            selectedEngine: 'cache',
            fallbackUsed: false,
            securityApplied: false,
            tokensCounted: false,
            processingPath,
          },
          metadata: cachedResult.metadata ? (() => {
            const { complexity, cacheHit, ...rest } = cachedResult.metadata as any;
            return {
              ...rest,
              cached: true,
            };
          })() : undefined,
          processingTime: Date.now() - startTime,
        };
      }
      processingPath.push('cache_miss');

      // 2. 보안 검사
      if (this.config.enableSecurity) {
        const securityResult = await this.applySecurity(request);
        if (securityResult.blocked) {
          this.metrics.securityEvents.promptsBlocked++;
          return this.createSecurityBlockedResponse(
            securityResult,
            processingPath
          );
        }
        request.query = securityResult.sanitized;
        securityApplied = true;
        processingPath.push('security_applied');
      }

      // 3. 토큰 사용량 확인
      if (request.userId) {
        const tokenCheck = this.checkTokenLimits(request.userId);
        if (!tokenCheck.allowed) {
          return this.createTokenLimitResponse(
            tokenCheck.reason || 'token_limit_exceeded',
            processingPath
          );
        }
        processingPath.push('token_check_passed');
      }

      // 4. 엔진 선택
      selectedEngine = await this.selectEngine(request);
      processingPath.push(`engine_selected_${selectedEngine}`);

      // 5. Circuit Breaker 확인
      if (this.config.enableCircuitBreaker) {
        // 선택된 엔진이 Circuit이 열린 상태인지 확인
        if (this.isCircuitOpen(selectedEngine)) {
          processingPath.push(`circuit_open_${selectedEngine}`);
          
          // 폴백 엔진 찾기
          const fallbackEngine = this.getFallbackEngine(selectedEngine);
          if (fallbackEngine && !this.isCircuitOpen(fallbackEngine)) {
            selectedEngine = fallbackEngine;
            fallbackUsed = true;
            processingPath.push(`circuit_breaker_fallback_to_${selectedEngine}`);
          } else {
            // 모든 엔진이 Circuit이 열린 상태
            return this.createCircuitOpenResponse(processingPath);
          }
        }
      }

      // 6. AI 엔진 실행 (폴백 지원)
      let response: QueryResponse | undefined;
      let currentEngine = selectedEngine;
      let engineAttempts = 0;
      const maxEngineAttempts = this.config.fallbackChain.length + 2; // 선택된 엔진 + 폴백 체인 모든 엔진
      let lastError: Error | undefined;

      while (engineAttempts < maxEngineAttempts) {
        try {
          response = await this.executeEngine(currentEngine, request);
          processingPath.push(`engine_executed_${currentEngine}`);
          break; // 성공시 종료
        } catch (engineError) {
          lastError = engineError instanceof Error ? engineError : new Error(String(engineError));
          engineAttempts++;
          this.recordFailure(currentEngine);
          processingPath.push(`engine_failed_${currentEngine}`);
          
          // 다음 폴백 엔진 선택
          const nextEngine = this.getFallbackEngine(currentEngine);
          if (nextEngine && engineAttempts < maxEngineAttempts) {
            currentEngine = nextEngine;
            fallbackUsed = true;
            processingPath.push(`fallback_to_${currentEngine}`);
            continue;
          } else {
            // 모든 엔진 실패
            processingPath.push('all_engines_failed');
            break; // while 루프 종료
          }
        }
      }

      // 모든 시도 후에도 response가 없으면 에러 던지기
      if (!response) {
        const finalError = lastError || new Error('모든 AI 엔진에서 응답을 받지 못했습니다.');
        throw finalError;
      }

      // 최종 선언된 엔진 업데이트
      selectedEngine = currentEngine;

      // 7. 응답 보안 필터링
      if (this.config.enableSecurity) {
        const filterResult = filterAIResponse(response.response);
        if (
          filterResult.riskLevel === 'blocked' ||
          filterResult.requiresRegeneration
        ) {
          this.metrics.securityEvents.responsesFiltered++;
          processingPath.push('response_needs_filtering');
          
          // 다른 엔진으로 재시도
          const retryResponse = await this.retryWithDifferentEngine(
            selectedEngine,
            request,
            processingPath
          );
          if (retryResponse) {
            response = retryResponse;
            selectedEngine = retryResponse.engine; // 재시도 엔진으로 업데이트
            processingPath.push('retry_successful');
          } else {
            response.response = filterResult.filtered;
            processingPath.push('response_filtered');
          }
        }
      }

      // 8. 토큰 사용량 기록
      if (request.userId && response.metadata?.tokensUsed) {
        const tokensUsed = typeof response.metadata.tokensUsed === 'number' 
          ? response.metadata.tokensUsed 
          : parseInt(String(response.metadata.tokensUsed), 10);
        
        if (!isNaN(tokensUsed)) {
          this.recordTokenUsage(request.userId, tokensUsed);
          tokensCounted = true;
          processingPath.push('tokens_recorded');
        }
      }

      // 9. 캐시 저장 (성공적인 응답만)
      if (response.success && !response.error) {
        this.setCachedResponse(cacheKey, response);
        processingPath.push('response_cached');
      }

      // 10. 메트릭 업데이트
      this.updateMetrics(selectedEngine, startTime, true);
      processingPath.push('metrics_updated');

      this.metrics.successfulRequests++;

      return {
        ...response,
        routingInfo: {
          selectedEngine,
          fallbackUsed,
          securityApplied,
          tokensCounted,
          processingPath,
        },
        metadata: response.metadata ? (() => {
          const { complexity, cacheHit, ...rest } = response.metadata as any;
          return {
            ...rest,
            cached: false, // 새로운 응답이므로 cached = false
          };
        })() : undefined,
      };
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 오류:', error);
      this.recordFailure(selectedEngine);
      this.metrics.failedRequests++;
      processingPath.push('final_error');

      // 모든 엔진이 실패했으므로 바로 에러 응답 반환
      return this.createErrorResponse(error, processingPath);
    }
  }

  /**
   * 🛡️ 보안 적용
   */
  private async applySecurity(request: QueryRequest): Promise<SanitizationResult> {
    const sanitizationResult = sanitizePrompt(request.query);

    if (sanitizationResult.threatsDetected.length > 0) {
      this.metrics.securityEvents.threatsDetected.push(
        ...sanitizationResult.threatsDetected
      );
    }

    return sanitizationResult;
  }

  /**
   * 🎯 엔진 선택 로직
   */
  private async selectEngine(request: QueryRequest): Promise<string> {
    if (this.config.preferredEngine !== 'auto') {
      return this.config.preferredEngine;
    }

    // 쿼리 복잡도에 따른 우선 선택
    const queryLength = request.query.length;
    const hasServerContext = !!request.context?.servers;
    const hasLargeContext = request.context && Object.keys(request.context).length > 5;
    
    // 매우 복잡한 쿼리는 Google AI 우선
    if (queryLength > 200 || hasLargeContext) {
      return 'google-ai';
    }

    // 한국어 검출 및 NLP 엔진 선택 (중간 복잡도)
    if (this.config.enableKoreanNLP) {
      const koreanRatio = this.calculateKoreanRatio(request.query);
      if (koreanRatio > this.config.koreanNLPThreshold) {
        // 복잡한 한국어 쿼리는 여전히 Google AI 사용
        if (queryLength > 100 || hasServerContext) {
          return 'google-ai';
        }
        return 'korean-nlp';
      }
    }

    // 기본 복잡도 체크
    if (queryLength > 100 || hasServerContext) {
      return 'google-ai'; // 복잡한 쿼리는 Google AI
    } else {
      return 'local-rag'; // 간단한 쿼리는 로컬 RAG
    }
  }

  /**
   * 🇰🇷 한국어 비율 계산
   */
  private calculateKoreanRatio(text: string): number {
    const koreanChars = text.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || [];
    return koreanChars.length / text.length;
  }

  /**
   * ⚡ AI 엔진 실행
   */
  private async executeEngine(
    engineName: string,
    request: QueryRequest
  ): Promise<QueryResponse> {
    let response: QueryResponse;
    
    switch (engineName) {
      case 'google-ai':
        response = await this.simplifiedEngine.query({
          ...request,
          mode: 'google-ai',
        });
        break;

      case 'local-rag':
        response = await this.simplifiedEngine.query({ ...request, mode: 'local' });
        break;

      case 'korean-nlp':
        response = await this.executeKoreanNLP(request);
        break;

      case 'performance':
        response = await this.performanceEngine.query(request);
        break;

      default:
        throw new Error(`Unknown engine: ${engineName}`);
    }
    
    // 성공했을 때만 엔진 사용량 증가 (updateMetrics에서 처리됨)
    return response;
  }

  /**
   * 🇰🇷 한국어 NLP 실행
   */
  private async executeKoreanNLP(
    request: QueryRequest
  ): Promise<QueryResponse> {
    try {
      // GCP Function 호출
      const response = await fetch('/api/ai/korean-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.query,
          context: request.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Korean NLP API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      // 한국어 NLP 결과를 표준 QueryResponse 형태로 변환
      return {
        success: data.success,
        response: this.convertKoreanNLPResponse(data.data),
        engine: 'google-ai' as const, // 한국어 NLP도 Google AI 카테고리로
        confidence: data.data?.quality_metrics?.confidence || 0.8,
        thinkingSteps: [
          {
            step: '한국어 NLP 분석',
            description: `의도: ${data.data?.intent}, 엔티티: ${data.data?.entities?.length || 0}개`,
            status: 'completed',
            timestamp: Date.now(),
          },
        ],
        metadata: {
          koreanNLP: true,
          processingTime: data.data?.quality_metrics?.processing_time,
        },
        processingTime: data.data?.quality_metrics?.processing_time || 0,
      };
    } catch (error) {
      console.error('Korean NLP 실행 오류:', error);
      // 로컬 RAG로 폴백
      return await this.simplifiedEngine.query({ ...request, mode: 'local' });
    }
  }

  /**
   * 🔄 한국어 NLP 응답 변환
   */
  private convertKoreanNLPResponse(nlpData: KoreanNLPResponse | null): string {
    if (!nlpData) return '한국어 분석 결과를 가져올 수 없습니다.';

    const { intent, entities, semantic_analysis, response_guidance } = nlpData;

    let response = `분석 결과:\n`;
    response += `- 의도: ${intent}\n`;

    if (entities && entities.length > 0) {
      response += `- 감지된 요소: ${entities.map((e) => e.value).join(', ')}\n`;
    }

    if (semantic_analysis) {
      response += `- 주요 주제: ${semantic_analysis.main_topic}\n`;
      if (semantic_analysis.urgency_level !== 'low') {
        response += `- 긴급도: ${semantic_analysis.urgency_level}\n`;
      }
    }

    if (response_guidance?.visualization_suggestions && response_guidance.visualization_suggestions.length > 0) {
      response += `\n권장 시각화: ${response_guidance.visualization_suggestions.join(', ')}`;
    }

    return response;
  }

  /**
   * 🔄 다른 엔진으로 재시도
   */
  private async retryWithDifferentEngine(
    failedEngine: string,
    request: QueryRequest,
    processingPath: string[]
  ): Promise<QueryResponse | null> {
    const availableEngines = this.config.fallbackChain.filter(
      engine => engine !== failedEngine
    );

    for (const engine of availableEngines) {
      try {
        processingPath.push(`retry_with_${engine}`);
        const response = await this.executeEngine(engine, request);

        // 응답 필터링 다시 확인
        const filterResult = filterAIResponse(response.response);
        if (filterResult.riskLevel !== 'blocked') {
          return response;
        }
      } catch (error) {
        console.warn(`재시도 실패 - ${engine}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 💰 토큰 사용량 확인
   */
  private checkTokenLimits(userId: string): {
    allowed: boolean;
    reason?: string;
  } {
    // 일일 전체 한도 확인
    if (this.metrics.tokenUsage.daily >= this.config.dailyTokenLimit) {
      return { allowed: false, reason: 'daily_limit_exceeded' };
    }

    // 사용자별 한도 확인
    const userUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    if (userUsage >= this.config.userTokenLimit) {
      return { allowed: false, reason: 'user_limit_exceeded' };
    }

    return { allowed: true };
  }

  /**
   * 📊 토큰 사용량 기록
   */
  private recordTokenUsage(userId: string, tokens: number): void {
    this.metrics.tokenUsage.daily += tokens;
    this.metrics.tokenUsage.total += tokens;

    const currentUserUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    this.metrics.tokenUsage.byUser.set(userId, currentUserUsage + tokens);
  }

  /**
   * 🔌 Circuit Breaker 확인
   */
  private isCircuitOpen(engine: string): boolean {
    const breaker = this.circuitBreakers.get(engine);
    if (!breaker) return false;

    // Circuit이 열린 상태일 때
    if (breaker.state === 'open') {
      // 타임아웃이 지났으면 half-open으로 전환
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'half-open';
        console.log(`🔌 Circuit breaker ${engine} transitioned to half-open`);
        return false; // half-open은 요청을 시도해볼 수 있음
      }
      return true; // 아직 타임아웃 전이므로 열린 상태
    }

    // half-open 상태는 요청을 시도할 수 있음
    if (breaker.state === 'half-open') {
      return false;
    }

    // closed 상태는 정상
    return false;
  }

  /**
   * 🔄 폴백 엔진 선택
   */
  private getFallbackEngine(failedEngine: string): string | null {
    const fallbackIndex = this.config.fallbackChain.indexOf(failedEngine);
    if (
      fallbackIndex >= 0 &&
      fallbackIndex < this.config.fallbackChain.length - 1
    ) {
      return this.config.fallbackChain[fallbackIndex + 1];
    }
    
    // 실패한 엔진이 fallbackChain에 없으면 첫 번째 엔진부터 시작
    if (fallbackIndex === -1 && this.config.fallbackChain.length > 0) {
      // 실패한 엔진이 fallbackChain의 첫 번째가 아니라면 첫 번째 반환
      if (this.config.fallbackChain[0] !== failedEngine) {
        return this.config.fallbackChain[0];
      }
      // 첫 번째도 실패했다면 두 번째 반환
      if (this.config.fallbackChain.length > 1) {
        return this.config.fallbackChain[1];
      }
    }
    
    return null;
  }

  /**
   * 📊 메트릭 업데이트
   */
  private updateMetrics(
    engine: string,
    startTime: number,
    success: boolean
  ): void {
    const responseTime = Date.now() - startTime;

    // 평균 응답 시간 계산 (totalRequests가 0이면 첫 번째 요청)
    const totalRequests = this.metrics.totalRequests;
    if (totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) /
        totalRequests;
    }

    // 엔진별 사용량 추적
    switch (engine) {
      case 'google-ai':
        this.metrics.engineUsage.googleAI++;
        break;
      case 'local-rag':
        this.metrics.engineUsage.localRAG++;
        break;
      case 'korean-nlp':
        this.metrics.engineUsage.koreanNLP++;
        break;
      default:
        this.metrics.engineUsage.fallback++;
        break;
    }
  }

  /**
   * ❌ 실패 기록
   */
  public recordFailure(engine: string): void {
    let breaker = this.circuitBreakers.get(engine);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        threshold: 5,
        timeout: 60000, // 1분
      };
      this.circuitBreakers.set(engine, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'open';
      console.warn(`🔌 Circuit breaker opened for engine: ${engine}`);
    }
  }

  // 응답 생성 헬퍼 메서드들
  private createSecurityBlockedResponse(
    securityResult: SanitizationResult,
    processingPath: string[]
  ): RouteResult {
    return {
      success: false,
      response: '보안상 처리할 수 없는 요청입니다.',
      engine: 'fallback' as const, // 보안 필터는 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: '보안 검사',
          description: `위험 요소 탐지: ${securityResult.threatsDetected.join(', ')}`,
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'security-filter',
        fallbackUsed: false,
        securityApplied: true,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createTokenLimitResponse(
    reason: string,
    processingPath: string[]
  ): RouteResult {
    const message =
      reason === 'daily_limit_exceeded'
        ? '일일 사용 한도를 초과했습니다.'
        : '개인 사용 한도를 초과했습니다.';

    return {
      success: false,
      response: message,
      engine: 'fallback' as const, // 속도 제한은 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: '사용량 확인',
          description: reason,
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'rate-limiter',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createCircuitOpenResponse(processingPath: string[]): RouteResult {
    return {
      success: false,
      response:
        '시스템이 일시적으로 제한된 모드로 동작 중입니다. 잠시 후 다시 시도해 주세요.',
      engine: 'fallback' as const, // 회로 차단은 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: 'Circuit Breaker',
          description: '모든 엔진이 차단된 상태',
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'circuit-breaker',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createErrorResponse(
    error: Error | unknown,
    processingPath: string[]
  ): RouteResult {
    return {
      success: false,
      response: '요청을 처리하는 중 오류가 발생했습니다.',
      engine: 'fallback' as const, // 에러 핸들러는 fallback으로 분류
      confidence: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      thinkingSteps: [
        {
          step: '오류 처리',
          description:
            error instanceof Error ? error.message : '알 수 없는 오류',
          status: 'failed',
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'error-handler',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private async retryWithFallback(
    request: QueryRequest,
    processingPath: string[]
  ): Promise<RouteResult> {
    try {
      processingPath.push('fallback_attempt');
      const response = await this.simplifiedEngine.query({
        ...request,
        mode: 'local',
      });

      return {
        ...response,
        routingInfo: {
          selectedEngine: 'fallback',
          fallbackUsed: true,
          securityApplied: false,
          tokensCounted: false,
          processingPath,
        },
      };
    } catch (fallbackError) {
      return this.createErrorResponse(fallbackError, processingPath);
    }
  }

  /**
   * 📊 통계 조회
   */
  public getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfig(newConfig: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 💾 캐시 키 생성
   */
  private generateCacheKey(request: QueryRequest & { userId?: string }): string {
    const keyParts = [
      request.query,
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous'
    ];
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 💾 캐시된 응답 조회
   */
  private getCachedResponse(cacheKey: string): QueryResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // TTL 확인
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * 💾 응답 캐시 저장
   */
  private setCachedResponse(cacheKey: string, response: QueryResponse, ttl: number = 300000): void {
    // 5분 기본 TTL
    this.cache.set(cacheKey, {
      response: { ...response },
      timestamp: Date.now(),
      ttl,
    });

    // 캐시 크기 제한 (최대 1000개 엔트리)
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 🧹 일일 초기화 (토큰 사용량 리셋)
   */
  public resetDailyLimits(): void {
    this.metrics.tokenUsage.daily = 0;
    this.metrics.tokenUsage.byUser.clear();
    console.log('🔄 일일 토큰 사용량 리셋');
  }

  /**
   * 🔥 Circuit Breaker 리셋
   */
  public resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('🔌 Circuit Breaker 상태 리셋');
  }

  /**
   * 💾 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 캐시 초기화 완료');
  }
}

// 편의를 위한 유틸리티 함수
export function getUnifiedAIRouter(
  config?: Partial<RouterConfig>
): UnifiedAIEngineRouter {
  return UnifiedAIEngineRouter.getInstance(config);
}

export async function routeAIQuery(
  request: QueryRequest & { userId?: string },
  config?: Partial<RouterConfig>
): Promise<RouteResult> {
  const router = getUnifiedAIRouter(config);
  return await router.route(request);
}
