/**
 * 🎯 Unified AI Engine Router - Main Router Core (Module 8/8)
 *
 * Central orchestrator that coordinates all AI routing modules:
 * - Imports and manages all 7 specialized modules
 * - Provides singleton instance management
 * - Orchestrates the main routing workflow
 * - Maintains clean separation of concerns
 * - Implements SOLID principles
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
  QueryRequest,
  QueryResponse,
  SimplifiedQueryEngine,
} from './SimplifiedQueryEngine';
import {
  getPerformanceOptimizedQueryEngine,
  type PerformanceOptimizedQueryEngine,
} from './performance-optimized-query-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';

// Import all 7 extracted modules
import {
  RouterConfig,
  RouterMetrics,
  RouteResult,
  CommandRequestContext,
  CommandRecommendation,
} from './UnifiedAIEngineRouter.types';
import { UnifiedAIEngineRouterCache } from './UnifiedAIEngineRouter.cache';
import { UnifiedAIEngineRouterCircuitBreaker } from './UnifiedAIEngineRouter.circuitBreaker';
import { UnifiedAIEngineRouterSecurity } from './UnifiedAIEngineRouter.security';
import { UnifiedAIEngineRouterCommands } from './UnifiedAIEngineRouter.commands';
import { UnifiedAIEngineRouterMetrics } from './UnifiedAIEngineRouter.metrics';
import { UnifiedAIEngineRouterUtils } from './UnifiedAIEngineRouter.utils';

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter;
  private config: RouterConfig;

  // AI 엔진 인스턴스들
  private simplifiedEngine!: SimplifiedQueryEngine;
  private performanceEngine!: PerformanceOptimizedQueryEngine;
  private ragEngine: unknown; // SupabaseRAGEngine

  // 7개 전문 모듈들
  private cacheModule: UnifiedAIEngineRouterCache;
  private circuitBreakerModule: UnifiedAIEngineRouterCircuitBreaker;
  private securityModule: UnifiedAIEngineRouterSecurity;
  private commandsModule: UnifiedAIEngineRouterCommands;
  private metricsModule: UnifiedAIEngineRouterMetrics;
  private utilsModule: UnifiedAIEngineRouterUtils;

  private constructor(config: RouterConfig) {
    // preferredEngine이 반드시 제공되어야 함
    if (!config.preferredEngine) {
      throw new Error(
        'preferredEngine 설정이 필수입니다. "local-ai" 또는 "google-ai"를 선택해주세요.'
      );
    }

    // 기본값 설정
    const defaultConfig: RouterConfig = {
      enableSecurity: true,
      strictSecurityMode: false, // 포트폴리오 수준 보안으로 완화
      dailyTokenLimit: 10000, // 무료 티어 고려
      userTokenLimit: 1000, // 사용자당 일일 제한
      preferredEngine: config.preferredEngine, // 필수 파라미터
      fallbackChain: ['performance-optimized', 'simplified'], // 모드별 내부 엔진 순서
      enableCircuitBreaker: true,
      maxRetries: 2,
      timeoutMs: 30000, // 30초
      enableKoreanNLP: true,
      koreanNLPThreshold: 0.7,
    };

    // 사용자 설정으로 덮어쓰기
    this.config = { ...defaultConfig, ...config };

    // 7개 전문 모듈 초기화
    this.cacheModule = new UnifiedAIEngineRouterCache();
    this.circuitBreakerModule = new UnifiedAIEngineRouterCircuitBreaker();
    this.securityModule = new UnifiedAIEngineRouterSecurity(this.config);
    this.commandsModule = new UnifiedAIEngineRouterCommands(this.config);
    this.metricsModule = new UnifiedAIEngineRouterMetrics(this.config);
    this.utilsModule = new UnifiedAIEngineRouterUtils();

    // 동기적으로 초기화 (테스트 환경에서 문제 방지)
    try {
      this.initializeComponents();
    } catch (error) {
      console.warn(
        '⚠️ 초기화 중 일부 컴포넌트 실패 (테스트 환경에서는 정상):',
        error
      );
    }
  }

  public static getInstance(
    config?: Partial<RouterConfig>
  ): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      // preferredEngine이 명시적으로 설정되었는지 확인
      if (!config?.preferredEngine) {
        throw new Error(
          'UnifiedAIEngineRouter 초기화 시 preferredEngine이 필요합니다.\n' +
            '- 로컬 AI 모드: { preferredEngine: "local-ai" }\n' +
            '- 구글 AI 모드: { preferredEngine: "google-ai" }'
        );
      }

      // 기본 설정과 전달된 설정을 병합
      const defaultConfig: RouterConfig = {
        enableSecurity: true,
        strictSecurityMode: false,
        dailyTokenLimit: 10000,
        userTokenLimit: 1000,
        preferredEngine: config.preferredEngine, // 필수값
        fallbackChain: ['performance-optimized', 'simplified'],
        enableCircuitBreaker: true,
        maxRetries: 2,
        timeoutMs: 30000,
        enableKoreanNLP: true,
        koreanNLPThreshold: 0.7,
      };

      const finalConfig = { ...defaultConfig, ...config };
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter(finalConfig);
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
      
      // 순환 종속성 해결: SimplifiedQueryEngine에 AI Router 주입
      (this.simplifiedEngine as any).processors?.setAIRouter?.(this);
      
      this.performanceEngine = getPerformanceOptimizedQueryEngine();
      this.ragEngine = getSupabaseRAGEngine();

      console.log('🎯 UnifiedAIEngineRouter Core 초기화 완료');
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter Core 초기화 실패:', error);
      // 테스트 환경에서는 에러를 던지지 않음
      if (process.env.NODE_ENV !== 'test') {
        throw error;
      }
    }
  }

  /**
   * 🎯 메인 라우팅 메서드 - 7개 모듈을 오케스트레이션
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
      const metrics = this.metricsModule.getMetrics();
      processingPath.push('request_received');

      // 1. 캐시 확인 (Cache Module)
      const cacheKey = this.utilsModule.generateCacheKey(request);
      const cachedResult = this.utilsModule.getCachedResponse(cacheKey);
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
          metadata: cachedResult.metadata
            ? (() => {
                const { cacheHit, ...rest } = cachedResult.metadata as Record<
                  string,
                  unknown
                >;
                return {
                  ...rest,
                  cached: true,
                };
              })()
            : undefined,
          processingTime: Date.now() - startTime,
        };
      }
      processingPath.push('cache_miss');

      // 2. 보안 검사 (Security Module)
      if (this.config.enableSecurity) {
        const securityResult = await this.securityModule.applySecurity(
          request,
          metrics
        );
        if (securityResult.riskLevel === 'critical' || securityResult.blocked) {
          return this.utilsModule.createSecurityBlockedResponse(
            securityResult,
            processingPath,
            this.config
          );
        }
        request.query = securityResult.sanitized;
        securityApplied = true;
        processingPath.push('security_applied');
      }

      // 3. 토큰 사용량 확인 (Security Module)
      if (request.userId) {
        const tokenCheck = this.securityModule.checkTokenLimits(
          request.userId,
          metrics,
          this.config
        );
        if (!tokenCheck.allowed) {
          return this.utilsModule.createTokenLimitResponse(
            tokenCheck.reason || 'token_limit_exceeded',
            processingPath
          );
        }
        processingPath.push('token_check_passed');
      }

      // 4. 모드 기반 엔진 선택
      selectedEngine = this.config.preferredEngine;
      processingPath.push(`engine_selected_${selectedEngine}`);

      // 5. Circuit Breaker 확인 (Circuit Breaker Module)
      if (this.config.enableCircuitBreaker) {
        if (this.circuitBreakerModule.isCircuitOpen(selectedEngine)) {
          processingPath.push(`circuit_open_${selectedEngine}`);

          // 폴백 엔진 찾기
          const fallbackEngine = this.circuitBreakerModule.getFallbackEngine(
            selectedEngine,
            this.config.fallbackChain
          );
          if (
            fallbackEngine &&
            !this.circuitBreakerModule.isCircuitOpen(fallbackEngine)
          ) {
            selectedEngine = fallbackEngine;
            fallbackUsed = true;
            processingPath.push(
              `circuit_breaker_fallback_to_${selectedEngine}`
            );
          } else {
            // 모든 엔진이 Circuit이 열린 상태
            return this.utilsModule.createCircuitOpenResponse(processingPath);
          }
        }
      }

      // 6. AI 엔진 실행 (폴백 지원)
      let response: QueryResponse | undefined;
      let currentEngine = selectedEngine;
      let engineAttempts = 0;
      const maxEngineAttempts = this.config.fallbackChain.length + 2;
      let lastError: Error | undefined;

      while (engineAttempts < maxEngineAttempts) {
        try {
          response = await this.executeEngine(currentEngine, request);
          processingPath.push(`engine_executed_${currentEngine}`);
          break; // 성공시 종료
        } catch (engineError) {
          lastError =
            engineError instanceof Error
              ? engineError
              : new Error(String(engineError));
          engineAttempts++;
          this.circuitBreakerModule.recordFailure(currentEngine);
          processingPath.push(`engine_failed_${currentEngine}`);

          // 다음 폴백 엔진 선택
          const nextEngine = this.circuitBreakerModule.getFallbackEngine(
            currentEngine,
            this.config.fallbackChain
          );
          if (nextEngine && engineAttempts < maxEngineAttempts) {
            currentEngine = nextEngine;
            fallbackUsed = true;
            processingPath.push(`fallback_to_${currentEngine}`);
            continue;
          } else {
            processingPath.push('all_engines_failed');
            break;
          }
        }
      }

      // 모든 시도 후에도 response가 없으면 에러 던지기
      if (!response) {
        const finalError =
          lastError || new Error('모든 AI 엔진에서 응답을 받지 못했습니다.');
        throw finalError;
      }

      // 최종 선언된 엔진 업데이트
      selectedEngine = currentEngine;
      processingPath.push(`engine_final_selected_${selectedEngine}`);

      // 7. 응답 보안 필터링 (Security Module)
      if (this.config.enableSecurity) {
        const filterResult = await this.securityModule.filterResponse(
          response.response,
          metrics
        );
        if (
          filterResult.riskLevel === 'blocked' ||
          filterResult.requiresRegeneration
        ) {
          processingPath.push('response_needs_filtering');

          // 다른 엔진으로 재시도
          const retryResponse =
            await this.utilsModule.createRetryWithFallbackResponse(
              request,
              processingPath,
              this.simplifiedEngine
            );
          if (retryResponse.success && retryResponse.response) {
            response.response = retryResponse.response;
            selectedEngine = retryResponse.engine;
            processingPath.push('retry_successful');
          } else {
            response.response = filterResult.filtered;
            processingPath.push('response_filtered');
          }
        }
      }

      // 8. 토큰 사용량 기록 (Metrics Module)
      if (request.userId && response.metadata?.tokensUsed) {
        const tokensUsed =
          typeof response.metadata.tokensUsed === 'number'
            ? response.metadata.tokensUsed
            : parseInt(String(response.metadata.tokensUsed), 10);

        if (!isNaN(tokensUsed)) {
          this.metricsModule.recordTokenUsage(request.userId, tokensUsed);
          tokensCounted = true;
          processingPath.push('tokens_recorded');
        }
      }

      // 9. 캐시 저장 (Utils Module)
      if (response.success && !response.error) {
        this.utilsModule.setCachedResponse(cacheKey, response);
        processingPath.push('response_cached');
      }

      // 10. 메트릭 업데이트 (Metrics Module)
      this.metricsModule.updateMetrics(selectedEngine, startTime, true);
      processingPath.push('metrics_updated');

      return {
        ...response,
        routingInfo: {
          selectedEngine,
          fallbackUsed,
          securityApplied,
          tokensCounted,
          processingPath,
        },
        metadata: response.metadata
          ? (() => {
              const { cacheHit, ...rest } = response.metadata as Record<
                string,
                unknown
              >;
              return {
                ...rest,
                cached: false, // 새로운 응답이므로 cached = false
              };
            })()
          : undefined,
      };
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 오류:', error);
      this.circuitBreakerModule.recordFailure(selectedEngine);
      processingPath.push('final_error');

      // 모든 엔진이 실패했으므로 바로 에러 응답 반환
      return this.utilsModule.createErrorResponse(error, processingPath);
    }
  }

  /**
   * ⚡ AI 엔진 실행 - Commands Module과 통합
   */
  private async executeEngine(
    engineName: string,
    request: QueryRequest
  ): Promise<QueryResponse> {
    let response: QueryResponse;

    switch (engineName) {
      case 'local-ai':
        // 로컬 AI 모드: Korean NLP + Supabase RAG + VM 백엔드
        response = await this.simplifiedEngine.query({
          ...request,
          mode: 'local',
          enableGoogleAI: false, // Google AI API 비활성화
          enableAIAssistantMCP: false, // AI 어시스턴트 MCP 비활성화
          enableKoreanNLP: true, // 한국어 NLP 활성화
          enableVMBackend: true, // VM 백엔드 활성화
        });
        break;

      case 'google-ai':
        // 구글 AI 모드: 모든 기능 포함
        response = await this.simplifiedEngine.query({
          ...request,
          mode: 'GOOGLE_AI',
          enableGoogleAI: true, // Google AI API 활성화
          enableAIAssistantMCP: true, // AI 어시스턴트 MCP 활성화
          enableKoreanNLP: true, // 한국어 NLP 활성화
          enableVMBackend: true, // VM 백엔드 활성화
        });
        break;

      default:
        throw new Error(
          `Unknown AI mode: ${engineName}. 지원되는 모드: 'local-ai', 'google-ai'`
        );
    }

    return response;
  }

  /**
   * 📊 통계 조회 - Metrics Module 위임
   */
  public getMetrics(): RouterMetrics {
    return this.metricsModule.getMetrics();
  }

  /**
   * 📈 성능 분석 리포트 - Metrics Module 위임
   */
  public getPerformanceReport() {
    return this.metricsModule.getPerformanceReport();
  }

  /**
   * 👥 사용자별 사용 통계 - Metrics Module 위임
   */
  public getUserStats() {
    return this.metricsModule.getUserStats();
  }

  /**
   * 📊 메트릭 히스토리 조회 - Metrics Module 위임
   */
  public getMetricsHistory(
    timeframe: 'last_hour' | 'last_day' | 'last_week' = 'last_hour'
  ) {
    return this.metricsModule.getMetricsHistory(timeframe);
  }

  /**
   * ⚙️ 설정 업데이트 - 모든 모듈에 전파
   */
  public updateConfig(newConfig: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 모든 모듈에 설정 업데이트 전파
    this.securityModule.updateSecurityConfig({
      enableSecurity: this.config.enableSecurity,
      strictMode: this.config.strictSecurityMode,
      enableKoreanProtection: this.config.enableKoreanNLP,
    });

    this.commandsModule.updateConfig(this.config);
    this.metricsModule.updateConfig(this.config);
    // Circuit breaker doesn't have updateConfig method
  }

  /**
   * 🤖 명령어 추천 시스템 - Commands Module 위임
   */
  public async getCommandRecommendations(
    query: string,
    options?: {
      includeAnalysis?: boolean;
      maxRecommendations?: number;
    }
  ): Promise<{
    recommendations: CommandRecommendation[];
    analysis: CommandRequestContext;
    formattedResponse: string;
  }> {
    return await this.commandsModule.getCommandRecommendations(query, options);
  }

  /**
   * 🔍 명령어 요청 감지 - Commands Module 위임
   */
  public detectCommandQuery(query: string) {
    return this.commandsModule.detectCommandQuery(query);
  }

  /**
   * 🔍 명령어 요청 사전 처리 - Commands Module 위임
   */
  public async processCommandQuery(
    query: string,
    nlpEntities?: Array<{ value: string; type?: string }>
  ) {
    return await this.commandsModule.processCommandQuery(query, nlpEntities);
  }

  /**
   * 📊 명령어 시스템 통계 - Commands Module 위임
   */
  public getCommandStats() {
    return this.commandsModule.getCommandStats();
  }

  /**
   * 🧹 일일 초기화 - Metrics Module 위임
   */
  public resetDailyLimits(): void {
    this.metricsModule.resetDailyLimits();
  }

  /**
   * 🔥 Circuit Breaker 리셋 - Circuit Breaker Module 위임
   */
  public resetCircuitBreakers(): void {
    this.circuitBreakerModule.resetAllCircuitBreakers();
  }

  /**
   * 💾 캐시 초기화 - Utils Module 위임
   */
  public clearCache(): void {
    this.utilsModule.clearCache();
  }

  /**
   * 📊 캐시 통계 조회 - Utils Module 위임
   */
  public getCacheStats() {
    return this.utilsModule.getCacheStats();
  }

  /**
   * 📈 보안 통계 조회 - Security Module 위임
   */
  public getSecurityStats() {
    const metrics = this.metricsModule.getMetrics();
    return this.securityModule.getSecurityStats(metrics);
  }

  /**
   * 🧹 보안 이벤트 로그 정리 - Security Module 위임
   */
  public cleanupSecurityLogs(maxAge: number = 86400000): void {
    const metrics = this.metricsModule.getMetrics();
    this.securityModule.cleanupSecurityLogs(metrics, maxAge);
  }

  /**
   * ❌ 실패 기록 - Circuit Breaker Module 위임
   */
  public recordFailure(engine: string): void {
    this.circuitBreakerModule.recordFailure(engine);
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
