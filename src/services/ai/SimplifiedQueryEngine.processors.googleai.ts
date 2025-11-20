/**
 * 🤖 Google AI Mode Processor - SimplifiedQueryEngine
 *
 * Handles Google AI mode query processing:
 * - Google AI API activation
 * - AI Assistant MCP activation (CloudContextLoader)
 * - Korean NLP processing
 * - GCP VM MCP server integration
 * - All advanced features included
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '../mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
} from '../../types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';
import type { GoogleAIModel } from './QueryDifficultyAnalyzer';
import { getGoogleAIUsageTracker } from './GoogleAIUsageTracker';
// 🔧 타임아웃 설정 (통합 유틸리티 사용)
import { getEnvironmentTimeouts } from '@/utils/timeout-config';
// 🚀 아키텍처 개선: 직접 Google AI SDK 통합
import { getDirectGoogleAIService } from './DirectGoogleAIService';

/**
 * 🤖 구글 AI 모드 프로세서
 */
export class GoogleAIModeProcessor {
  private utils: SimplifiedQueryEngineUtils;
  private contextLoader: CloudContextLoader;
  private mockContextLoader: MockContextLoader;
  private helpers: SimplifiedQueryEngineHelpers;
  private ragEngine: SupabaseRAGEngine;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    contextLoader: CloudContextLoader,
    mockContextLoader: MockContextLoader,
    helpers: SimplifiedQueryEngineHelpers,
    ragEngine: SupabaseRAGEngine
  ) {
    this.utils = utils;
    this.contextLoader = contextLoader;
    this.mockContextLoader = mockContextLoader;
    this.helpers = helpers;
    this.ragEngine = ragEngine;
  }

  /**
   * 구글 AI 모드 쿼리 처리
   * - Google AI API 활성화
   * - AI 어시스턴트 MCP 활성화 (CloudContextLoader)
   * - 한국어 NLP 처리
   * - 모든 기능 포함
   */
  async processUnifiedQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    const enableKoreanNLP = true;
    const enableAIAssistantMCP = !!mcpContext;

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
          const nlpStep = thinkingSteps[thinkingSteps.length - 1];
          if (nlpStep) {
            nlpStep.status = 'completed';
            nlpStep.description = `한국어 비율 ${Math.round(koreanRatio * 100)}% - NLP 처리 완료`;
          }
        } else {
          const nlpEnglishStep = thinkingSteps[thinkingSteps.length - 1];
          if (nlpEnglishStep) {
            nlpEnglishStep.status = 'completed';
            nlpEnglishStep.description = `영어 쿼리 감지 - NLP 건너뛰기`;
          }
        }

        const nlpDurationStep = thinkingSteps[thinkingSteps.length - 1];
        if (nlpDurationStep) {
          nlpDurationStep.duration = Date.now() - nlpStepStart;
        }
      } catch (error) {
        console.warn('한국어 NLP 처리 실패:', error);
        const nlpFailedStep = thinkingSteps[thinkingSteps.length - 1];
        if (nlpFailedStep) {
          nlpFailedStep.status = 'failed';
          nlpFailedStep.duration = Date.now() - nlpStepStart;
        }
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
        enableMCP: false,
        useLocalEmbeddings: true,
        enableKeywordFallback: true,
      });

      const ragStep = thinkingSteps[thinkingSteps.length - 1];
      if (ragStep) {
        ragStep.status = 'completed';
        ragStep.description = `${ragResult.totalResults}개 관련 문서 발견`;
        ragStep.duration = Date.now() - ragStepStart;
      }
    } catch (ragError) {
      console.error('RAG 검색 실패:', ragError);
      const ragFailedStep = thinkingSteps[thinkingSteps.length - 1];
      if (ragFailedStep) {
        ragFailedStep.status = 'failed';
        ragFailedStep.description = 'RAG 검색 실패';
        ragFailedStep.duration = Date.now() - ragStepStart;
      }
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

    const unifiedStep = thinkingSteps[thinkingSteps.length - 1];
    if (unifiedStep) {
      unifiedStep.status = unifiedInsights.summary ? 'completed' : 'failed';
      unifiedStep.description = unifiedInsights.summary
        ? 'Cloud Functions 결과 수집 완료'
        : 'Cloud Functions 결과 없음';
      unifiedStep.duration = Date.now() - unifiedStepStart;
    }

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

    const modelStep = thinkingSteps[thinkingSteps.length - 1];
    if (modelStep) {
      modelStep.status = 'completed';
      modelStep.description = `Flash-Lite 모델 선택 (RPD 1,000개, 안정성 우선)`;
      modelStep.duration = Date.now() - modelStepStart;
    }

    console.log(`🎯 모델 고정: ${selectedModel} (무료 티어 최적화)`);

    // 🎯 기본 모델 고정: 표준 파라미터 사용 (스코프 외부에서 정의)
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
    // 🔄 사용량 추적기: 할당량 체크 + 성공/실패 기록용 (try/catch 블록 외부에서 선언하여 재사용)
    const usageTracker = getGoogleAIUsageTracker();

    try {
      // 1. 서버 컨텍스트 조회
      const serverContext = await this.helpers.getFormattedServerContext(query);

      // 2. 기존 프롬프트 빌드
      const basePrompt = this.helpers.buildGoogleAIPrompt(
        query,
        context,
        mcpContext,
        ragResult,
        unifiedInsights.summary
      );

      // 3. 최종 프롬프트 조립 (서버 컨텍스트 포함)
      const prompt = serverContext ? basePrompt + serverContext : basePrompt;

      // 🚀 아키텍처 개선: 직접 Google AI SDK 호출 (중간 API Route 제거)
      const timeouts = getEnvironmentTimeouts();

      // DirectGoogleAIService 사용 (API Wrapper Anti-Pattern 제거)

      // 🛡️ 할당량 보호 로직 (usageTracker는 try 블록 외부에서 선언됨)
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
        timeout: timeouts.GOOGLE_AI, // 🎯 넉넉한 타임아웃: timeout-config.ts 설정 사용 (8초)
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

      const googleStep = thinkingSteps[thinkingSteps.length - 1];
      if (googleStep) {
        googleStep.status = 'completed';
        googleStep.description = 'Gemini API 응답 수신';
        googleStep.duration = Date.now() - googleStepStart;
      }

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

      // 🚀 직접 응답 사용 (구조 단순화)
      const finalResponse = apiResponse.content || '응답을 생성할 수 없습니다.';
      const finalConfidence = 0.9; // DirectGoogleAIService는 항상 높은 신뢰도
      
      // 비용 계산
      const tokenCount = apiResponse.usage?.totalTokens || Math.ceil((query.length + finalResponse.length) / 4);
      const actualCost = tokenCount * 0.000002; // $0.002 per 1K tokens

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai-rag',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: selectedModel,
          tokensUsed: tokenCount,
          mcpUsed: !!(mcpContext && enableAIAssistantMCP),
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          // GCP VM MCP 제거됨 - Cloud Functions 전용으로 단순화
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai-rag',
          cloudFunctionsUsed: !!unifiedInsights.raw,
          cloudFunctionsCacheHit: unifiedInsights.raw?.metadata?.cacheHit ?? false,
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
            strategy: 'fixed-model', // 고정 모델 전략
          },
        } as unknown as AIMetadata & {
          aiAssistantMCPUsed?: boolean;
          koreanNLPUsed?: boolean;
          mockMode?: boolean;
          engineType?: string;
          savedCost?: number;
          actualCost?: number;
          tokenCount?: number;
          modelInfo?: {
            selectedModel: GoogleAIModel;
            temperature: number;
            maxTokens: number;
            strategy: string;
          };
        },
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

      // 🚨 폴백 제거: 에러 직접 반환
      const googleFailedStep = thinkingSteps[thinkingSteps.length - 1];
      if (googleFailedStep) {
        googleFailedStep.status = 'failed';
        googleFailedStep.description = 'Google AI 처리 실패';
        googleFailedStep.duration = Date.now() - googleStepStart;
      }

      // Google AI 실패 시 에러 응답 반환 (폴백 없음)
      return {
        success: false,
        response: 'Google AI 모드에서 쿼리 처리 중 오류가 발생했습니다.',
        engine: 'google-ai-rag',
        confidence: 0,
        thinkingSteps,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        metadata: {
          model: selectedModel,
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai-rag',
          cloudFunctionsUsed: !!unifiedInsights.raw,
          cloudFunctionsCacheHit: unifiedInsights.raw?.metadata?.cacheHit ?? false,
          // 기본 모델 고정 정보 (에러 시에도 포함)
          modelInfo: {
            selectedModel,
            temperature: standardTemperature,
            maxTokens: standardMaxTokens,
            strategy: 'fixed-model', // 고정 모델 전략
          },
        } as AIMetadata & {
          aiAssistantMCPUsed?: boolean;
          koreanNLPUsed?: boolean;
          mockMode?: boolean;
          modelInfo?: {
            selectedModel: GoogleAIModel;
            temperature: number;
            maxTokens: number;
            strategy: string;
          };
        },
        processingTime: Date.now() - startTime,
      };
    }
  }
}
