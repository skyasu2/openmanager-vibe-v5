import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SupabaseRAGEngine } from './supabase-rag-engine';
import { MockContextLoader } from './MockContextLoader';
import {
  IntentClassifier,
  IntentResult,
} from '../../modules/ai-agent/processors/IntentClassifier';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import { AIQueryContext, AIMetadata } from '../../types/ai-service-types';
import { QueryRequest, QueryResponse } from './SimplifiedQueryEngine.types';
import {
  ComplexityScore,
  ComplexityLevel,
} from './SimplifiedQueryEngine.complexity-types';
import { getGoogleAIUsageTracker } from './GoogleAIUsageTracker';
import { getEnvironmentTimeouts } from '../../utils/timeout-config';
import { getDirectGoogleAIService } from './DirectGoogleAIService';
import { recordQueryMetrics } from '../../lib/ai/metrics/AIMetricsCollector';
import { AIErrorType } from '../../lib/ai/errors/AIErrorHandler';
import type { GoogleAIModel } from './SimplifiedQueryEngine.types';

/**
 * AIRouter 인터페이스 정의 (CommandQueryProcessor에서 가져옴)
 */
interface AIRouter {
  getCommandRecommendations(
    query: string,
    options: {
      maxRecommendations?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<{
    recommendations: Array<{
      title: string;
      description: string;
      usage?: string;
    }>;
    analysis: Record<string, unknown>;
  }>;
}

/**
 * 🔄 UnifiedQueryProcessor - 통합 쿼리 프로세서
 *
 * 모드 구분 없이 자동 최적 경로 선택:
 * - Simple Path: RAG + Command (비용 $0)
 * - Complex Path: RAG + Cloud Functions + Google AI (스마트 조합)
 */
export class UnifiedQueryProcessor {
  constructor(
    private utils: SimplifiedQueryEngineUtils,
    private ragEngine: SupabaseRAGEngine,
    private mockContextLoader: MockContextLoader,
    private intentClassifier: IntentClassifier,
    private helpers: SimplifiedQueryEngineHelpers,
    private aiRouter?: unknown
  ) {}

  /**
   * 🔍 타입 가드: aiRouter가 AIRouter 인터페이스를 구현하는지 확인
   */
  private isAIRouter(router: unknown): router is AIRouter {
    return (
      router !== null &&
      router !== undefined &&
      typeof router === 'object' &&
      'getCommandRecommendations' in router &&
      typeof (router as AIRouter).getCommandRecommendations === 'function'
    );
  }

  async processQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    intentResult: IntentResult,
    complexity: ComplexityScore,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    // 1. 자동 경로 선택
    const path = this.selectOptimalPath(intentResult, complexity, query);

    // Observability: 경로 선택 이유 기록
    if (thinkingSteps) {
      thinkingSteps.push({
        step: 'Routing',
        description: `Selected optimal path: ${path}`,
        status: 'completed',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        metadata: {
          path,
          reason: this.getRoutingReason(intentResult, complexity),
        },
      });
    }

    // 2. 경로별 실행
    try {
      if (path === 'simple') {
        return await this.executeSimplePath(
          query,
          context,
          options,
          thinkingSteps,
          startTime
        );
      } else {
        return await this.executeComplexPath(
          query,
          context,
          options,
          thinkingSteps,
          startTime,
          complexity
        );
      }
    } catch (error) {
      // Graceful Degradation: Complex Path 실패 시 Simple Path로 폴백
      if (path === 'complex') {
        console.warn(
          '⚠️ Complex path failed, falling back to simple path:',
          error
        );
        if (thinkingSteps) {
          thinkingSteps.push({
            step: 'Fallback',
            description: 'Complex path failed, falling back to simple path',
            status: 'pending',
            timestamp: Date.now(),
            duration: 0,
            metadata: { error: String(error) },
          });
        }
        return await this.executeSimplePath(
          query,
          context,
          options,
          thinkingSteps,
          startTime
        );
      }
      throw error;
    }
  }

  private selectOptimalPath(
    intentResult: IntentResult,
    complexity: ComplexityScore,
    query: string
  ): 'simple' | 'complex' {
    // 1. Circuit Breaker: 즉시 단순 경로 선택 조건
    if (
      intentResult.confidence > 0.7 &&
      !intentResult.needsComplexML &&
      !intentResult.needsNLP &&
      complexity.score <= 0.5
    ) {
      return 'simple'; // 로컬 RAG + 명령어 처리 (비용 $0)
    }

    // 2. 복잡 경로 조건
    if (
      intentResult.needsComplexML ||
      intentResult.needsNLP ||
      complexity.score > 0.7 ||
      intentResult.confidence < 0.5
    ) {
      return 'complex'; // RAG + Cloud Functions + Google AI (스마트 조합)
    }

    // 3. 기본: 단순 경로 (비용 절약 우선)
    return 'simple';
  }

  private getRoutingReason(
    intentResult: IntentResult,
    complexity: ComplexityScore
  ): string {
    if (intentResult.needsComplexML) return 'Complex ML analysis required';
    if (intentResult.needsNLP) return 'Natural language processing required';
    if (complexity.score > 0.7) return 'High query complexity';
    if (intentResult.confidence < 0.5) return 'Low intent confidence';
    return 'Simple query suitable for local processing';
  }

  /**
   * 🛠️ 단순 경로 실행 (CommandQueryProcessor 로직 통합)
   */
  private async executeSimplePath(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    const commandStepStart = Date.now();

    // ✅ 안전한 thinking steps 초기화
    thinkingSteps = this.utils.safeInitThinkingSteps(thinkingSteps);

    thinkingSteps.push({
      step: '명령어 분석',
      description: '명령어 추천 요청 분석',
      status: 'pending',
      timestamp: commandStepStart,
    });

    try {
      // 🛡️ aiRouter 안전성 검증
      if (!this.isAIRouter(this.aiRouter)) {
        console.warn(
          '⚠️ aiRouter 또는 getCommandRecommendations 메서드가 사용 불가능합니다.'
        );

        // 폴백: 기본 명령어 추천 제공
        const fallbackRecommendations = {
          recommendations: [
            {
              title: '서버 목록 확인',
              description: '현재 등록된 모든 서버 조회',
              usage: 'list servers',
            },
            {
              title: '시스템 상태 조회',
              description: '시스템 전체 상태 확인',
              usage: 'status check',
            },
            {
              title: '성능 모니터링',
              description: 'CPU, 메모리 등 성능 지표 모니터링',
              usage: 'monitor performance',
            },
            {
              title: '알림 설정',
              description: '알림 규칙 및 임계값 설정',
              usage: 'configure alerts',
            },
            {
              title: '로그 분석',
              description: '시스템 로그 분석 및 조회',
              usage: 'analyze logs',
            },
          ],
          analysis: {
            queryType: 'status_check',
            complexity: 'simple',
          },
        };

        this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'completed',
          description: `기본 명령어 추천 제공 (aiRouter 비활성화)`,
          duration: Date.now() - commandStepStart,
        });

        const responseStepStart = Date.now();
        thinkingSteps.push({
          step: '명령어 응답 생성',
          description: '기본 명령어 추천 응답 포맷팅',
          status: 'pending',
          timestamp: responseStepStart,
        });

        const response = this.utils.generateFormattedResponse(
          fallbackRecommendations.recommendations,
          fallbackRecommendations.analysis,
          query,
          0.7
        );

        this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'completed',
          duration: Date.now() - responseStepStart,
        });

        return {
          success: true,
          response,
          engine: 'fallback',
          confidence: 0.7,
          thinkingSteps,
          processingTime: Date.now() - startTime,
          metadata: {
            source: 'fallback-command-recommendations',
            fallbackReason: 'aiRouter unavailable',
          },
        };
      }

      const recommendationResult =
        await this.aiRouter.getCommandRecommendations(query, {
          maxRecommendations: 5,
          includeAnalysis: true,
        });

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: `${recommendationResult.recommendations.length}개 명령어 추천 생성`,
        duration: Date.now() - commandStepStart,
      });

      // 응답 생성
      const responseStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 응답 생성',
        description: '명령어 추천 응답 포맷팅',
        status: 'pending',
        timestamp: responseStepStart,
      });

      const response = this.utils.generateFormattedResponse(
        recommendationResult.recommendations,
        recommendationResult.analysis || {},
        query,
        0.95
      );

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        duration: Date.now() - responseStepStart,
      });

      return {
        success: true,
        response,
        engine: 'local-rag',
        confidence: 0.95,
        thinkingSteps,
        metadata: {
          source: 'command-recommendations',
          totalRecommendations: recommendationResult.recommendations.length,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ 명령어 처리 실패:', error);

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'failed',
        description: '명령어 분석 실패',
        duration: Date.now() - commandStepStart,
      });

      // 폴백: 기본 명령어 안내
      const fallbackResponse =
        this.utils.generateCommandFallbackResponse(query);

      return {
        success: false,
        response: fallbackResponse,
        engine: 'fallback',
        confidence: 0.3,
        thinkingSteps,
        error: error instanceof Error ? error.message : '명령어 처리 실패',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🤖 복잡 경로 실행 (GoogleAIModeProcessor 로직 통합)
   */
  private async executeComplexPath(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    complexityScore?: ComplexityScore
  ): Promise<QueryResponse> {
    const enableKoreanNLP = true;

    // 📊 메트릭: 복잡도 분석 (전달받은 점수 사용 또는 재계산)
    const complexity =
      complexityScore?.level ||
      (query.length > 200
        ? ComplexityLevel.COMPLEX
        : query.length > 100
          ? ComplexityLevel.MEDIUM
          : ComplexityLevel.SIMPLE);

    // ✅ 안전한 thinking steps 초기화
    thinkingSteps = this.utils.safeInitThinkingSteps(thinkingSteps);

    // 1단계: 한국어 NLP 처리 (활성화된 경우)
    if (enableKoreanNLP) {
      const nlpStepStart = Date.now();
      thinkingSteps.push({
        step: '한국어 NLP 처리',
        description: '한국어 자연어 처리 및 의도 분석',
        status: 'pending',
        timestamp: nlpStepStart,
      });

      try {
        const koreanRatio = this.utils.calculateKoreanRatio(query);

        if (koreanRatio > 0.3) {
          // Korean NLP 엔진 (Google AI mode에서는 Gemini API가 자체 처리)
          this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
            status: 'completed',
            description: `한국어 비율 ${Math.round(koreanRatio * 100)}% - NLP 처리 완료`,
            duration: Date.now() - nlpStepStart,
          });
        } else {
          this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
            status: 'completed',
            description: `영어 쿼리 감지 - NLP 건너뛰기`,
            duration: Date.now() - nlpStepStart,
          });
        }
      } catch (error) {
        console.warn('한국어 NLP 처리 실패:', error);
        this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
          status: 'failed',
          duration: Date.now() - nlpStepStart,
        });
      }
    }

    // 2단계: RAG 검색 (Supabase pgvector)
    const ragStepStart = Date.now();
    thinkingSteps.push({
      step: 'Supabase RAG 검색',
      description: 'pgvector 기반 유사도 검색',
      status: 'pending',
      timestamp: ragStepStart,
    });

    let ragResult;
    try {
      ragResult = await this.ragEngine.searchSimilar(query, {
        maxResults: 5,
        threshold: 0.5,
        category: options?.category,
        useLocalEmbeddings: true,
        enableKeywordFallback: true,
      });

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: `${ragResult.totalResults}개 관련 문서 발견`,
        duration: Date.now() - ragStepStart,
      });
    } catch (ragError) {
      console.error('RAG 검색 실패:', ragError);
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'failed',
        description: 'RAG 검색 실패',
        duration: Date.now() - ragStepStart,
      });
      // RAG 실패는 치명적이지 않음. 계속 진행.
      ragResult = {
        success: false,
        results: [],
        totalResults: 0,
        cached: false,
        processingTime: Date.now() - ragStepStart,
      };
    }

    // 3단계: Cloud Functions 기반 통합 분석
    const unifiedStepStart = Date.now();
    thinkingSteps.push({
      step: 'Cloud Functions 분석',
      description: 'Korean NLP + ML Analytics + Server Analyzer 실행',
      status: 'pending',
      timestamp: unifiedStepStart,
    });

    const unifiedInsights = await this.helpers.fetchUnifiedInsights(
      query,
      context,
      ragResult
    );

    this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
      status: unifiedInsights.summary ? 'completed' : 'failed',
      description: unifiedInsights.summary
        ? 'Cloud Functions 결과 수집 완료'
        : 'Cloud Functions 결과 없음',
      duration: Date.now() - unifiedStepStart,
    });

    // 4단계: 기본 모델 고정 (무료 티어 안정성 우선)
    const modelStepStart = Date.now();
    thinkingSteps.push({
      step: '모델 선택',
      description: 'Flash-Lite 기본 모델 사용 (무료 티어 최적화)',
      status: 'pending',
      timestamp: modelStepStart,
    });

    // 🎯 무료 티어 안정성 우선: Flash-Lite 고정 사용 (할당량 초과 시 대체 모델 전환 가능)
    let selectedModel: GoogleAIModel = 'gemini-2.5-flash-lite';

    this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
      status: 'completed',
      description: `Flash-Lite 모델 선택 (RPD 1,000개, 안정성 우선)`,
      duration: Date.now() - modelStepStart,
    });

    console.log(`🎯 모델 고정: ${selectedModel} (무료 티어 최적화)`);

    // 🎯 기본 모델 고정: 표준 파라미터 사용
    const standardTemperature = 0.7; // 균형잡힌 창의성
    const standardMaxTokens = 1000; // 충분한 응답 길이

    // 5단계: Google AI API 처리 (선택된 모델 사용)
    const googleStepStart = Date.now();
    thinkingSteps.push({
      step: 'Google AI 처리',
      description: `${selectedModel} 모델로 API 호출`,
      status: 'pending',
      timestamp: googleStepStart,
    });

    // 🛡️ 할당량 보호: API 호출 전 사용 가능 여부 확인
    const usageTracker = getGoogleAIUsageTracker();

    try {
      // 1. 서버 컨텍스트 조회
      const serverContext = await this.helpers.getFormattedServerContext(query);

      // 2. 기존 프롬프트 빌드
      const basePrompt = this.helpers.buildGoogleAIPrompt(
        query,
        context,
        ragResult,
        unifiedInsights.summary
      );

      // 3. 최종 프롬프트 조립 (서버 컨텍스트 포함)
      const prompt = serverContext ? basePrompt + serverContext : basePrompt;

      // 🚀 아키텍처 개선: 직접 Google AI SDK 호출
      const timeouts = getEnvironmentTimeouts();

      // 🛡️ 할당량 보호 로직
      if (!usageTracker.canUseModel(selectedModel)) {
        console.warn(
          `⚠️ [Google AI] ${selectedModel} 할당량 초과, 대체 모델 확인 중...`
        );

        // 사용 가능한 대체 모델 찾기
        const availableModels = usageTracker.getAvailableModels();

        if (availableModels.length === 0) {
          // 모든 모델 할당량 초과 - 에러 반환
          const errorMsg =
            'Google AI 모든 모델의 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
          console.error(`❌ [Google AI] ${errorMsg}`);

          throw new Error(errorMsg);
        }

        // 첫 번째 사용 가능한 모델로 전환
        const fallbackModel = availableModels.at(0);
        if (!fallbackModel) {
          throw new Error(
            'Internal error: availableModels array is empty after length check'
          );
        }
        console.log(
          `✅ [Google AI] 대체 모델 사용: ${selectedModel} → ${fallbackModel}`
        );
        selectedModel = fallbackModel;
      }

      console.log('🚀 [Google AI] 요청 시작:', {
        model: selectedModel,
        query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
        temperature: standardTemperature,
        maxTokens: standardMaxTokens,
        timeout: timeouts.GOOGLE_AI,
        promptLength: prompt.length,
      });

      const directGoogleAI = getDirectGoogleAIService();
      const apiResponse = await directGoogleAI.generateContent(prompt, {
        model: selectedModel,
        temperature: standardTemperature,
        maxTokens: standardMaxTokens,
        timeout: timeouts.GOOGLE_AI,
      });

      console.log('📊 [Google AI] 응답 상태:', {
        success: apiResponse.success,
        error: apiResponse.error,
        responseTime: apiResponse.responseTime,
        contentLength: apiResponse.content?.length,
      });

      if (!apiResponse.success) {
        console.error('❌ [Google AI] 상세 에러:', {
          error: apiResponse.error,
          model: selectedModel,
          query,
          promptLength: prompt.length,
          responseTime: apiResponse.responseTime,
        });
        throw new Error(`Google AI 직접 호출 오류: ${apiResponse.error}`);
      }

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: 'Gemini API 응답 수신',
        duration: Date.now() - googleStepStart,
      });

      // 🔄 사용량 추적: 성공한 API 호출 기록
      usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: apiResponse.usage?.totalTokens || 0,
        latency: apiResponse.responseTime,
        success: true,
        difficultyScore: 0.5,
      });

      // 🚀 직접 응답 사용
      const finalResponse = apiResponse.content || '응답을 생성할 수 없습니다.';
      const finalConfidence = 0.9;

      // 비용 계산
      const tokenCount =
        apiResponse.usage?.totalTokens ||
        Math.ceil((query.length + finalResponse.length) / 4);
      const actualCost = tokenCount * 0.000002; // $0.002 per 1K tokens

      // 📊 메트릭 기록 (성공)
      recordQueryMetrics({
        engineType: 'google-ai',
        provider: 'rag',
        query,
        complexity,
        responseTime: Date.now() - startTime,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: selectedModel,
          tokensUsed: tokenCount,
          koreanNLPUsed: enableKoreanNLP,
        },
      });

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai-rag',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: selectedModel,
          tokensUsed: tokenCount,
          koreanNLPUsed: enableKoreanNLP,
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai-rag',
          cloudFunctionsUsed: !!unifiedInsights.raw,
          cloudFunctionsCacheHit:
            unifiedInsights.raw?.metadata?.cacheHit ?? false,
          cloudFunctionsSummary: unifiedInsights.summary || undefined,
          // 비용 정보
          engineType: 'google-ai',
          savedCost: 0,
          actualCost: actualCost,
          tokenCount: tokenCount,
          // 기본 모델 고정 정보
          modelInfo: {
            selectedModel,
            temperature: standardTemperature,
            maxTokens: standardMaxTokens,
            strategy: 'fixed-model',
          },
        } as unknown as AIMetadata,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ [Google AI] 처리 오류 (catch):', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query,
        model: selectedModel,
        processingTime: Date.now() - startTime,
      });

      // 🔄 사용량 추적: 실패한 API 호출 기록
      usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: 0,
        latency: Date.now() - googleStepStart,
        success: false,
        difficultyScore: 0.5,
      });

      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'failed',
        description: 'Google AI 처리 실패',
        duration: Date.now() - googleStepStart,
      });

      // 📊 메트릭 기록 (실패)
      recordQueryMetrics({
        engineType: 'google-ai',
        provider: 'rag',
        query,
        complexity,
        responseTime: Date.now() - startTime,
        success: false,
        cacheHit: false,
        error: AIErrorType.API_ERROR,
        timestamp: Date.now(),
      });

      throw error; // 상위 레벨에서 폴백 처리를 위해 에러 throw
    }
  }
}
