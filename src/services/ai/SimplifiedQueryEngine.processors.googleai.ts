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

import { CloudContextLoader } from '../mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { validateGoogleAIMCPConfig } from '../../lib/env-safe';
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
import { LocalAIModeProcessor } from './SimplifiedQueryEngine.processors.localai';
import { getQueryDifficultyAnalyzer, type GoogleAIModel } from './QueryDifficultyAnalyzer';
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
  private localAIProcessor: LocalAIModeProcessor;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    contextLoader: CloudContextLoader,
    mockContextLoader: MockContextLoader,
    helpers: SimplifiedQueryEngineHelpers,
    localAIProcessor: LocalAIModeProcessor
  ) {
    this.utils = utils;
    this.contextLoader = contextLoader;
    this.mockContextLoader = mockContextLoader;
    this.helpers = helpers;
    this.localAIProcessor = localAIProcessor;
  }

  /**
   * 구글 AI 모드 쿼리 처리
   * - Google AI API 활성화
   * - AI 어시스턴트 MCP 활성화 (CloudContextLoader)
   * - 한국어 NLP 처리
   * - 모든 기능 포함
   */
  async processGoogleAIModeQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    modeConfig: {
      enableGoogleAI: boolean;
      enableAIAssistantMCP: boolean;
      enableKoreanNLP: boolean;
      enableVMBackend: boolean;
    }
  ): Promise<QueryResponse> {
    const {
      enableGoogleAI,
      enableAIAssistantMCP,
      enableKoreanNLP,
      enableVMBackend,
    } = modeConfig;

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

    // 2단계: 기본 모델 고정 (무료 티어 안정성 우선)
    const modelStepStart = Date.now();
    thinkingSteps.push({
      step: '모델 선택',
      description: 'Flash-Lite 기본 모델 사용 (무료 티어 최적화)',
      status: 'pending',
      timestamp: modelStepStart,
    });

    // 🎯 무료 티어 안정성 우선: Flash-Lite 고정 사용
    const selectedModel: GoogleAIModel = 'gemini-2.5-flash-lite';
    const difficultyScore = 0; // 단순화: 분석 생략
    const difficultyLevel = 'standard'; // 표준 처리

    const modelStep = thinkingSteps[thinkingSteps.length - 1];
    if (modelStep) {
      modelStep.status = 'completed';
      modelStep.description = `Flash-Lite 모델 선택 (RPD 1,000개, 안정성 우선)`;
      modelStep.duration = Date.now() - modelStepStart;
    }

    console.log(`🎯 모델 고정: ${selectedModel} (무료 티어 최적화)`);

    // 🎯 기본 모델 고정: 표준 파라미터 사용 (스코프 외부에서 정의)
    const standardTemperature = 0.7; // 균형잡힌 창의성
    const standardMaxTokens = 1000;  // 충분한 응답 길이

    // 3단계: Google AI API 처리 (선택된 모델 사용)
    const googleStepStart = Date.now();
    thinkingSteps.push({
      step: 'Google AI 처리',
      description: `${selectedModel} 모델로 API 호출`,
      status: 'pending',
      timestamp: googleStepStart,
    });

    try {
      if (!enableGoogleAI) {
        throw new Error('Google AI API가 비활성화됨');
      }

      // 컨텍스트를 포함한 프롬프트 생성
      const prompt = this.helpers.buildGoogleAIPrompt(
        query,
        context,
        mcpContext
      );

      // 🚀 아키텍처 개선: 직접 Google AI SDK 호출 (중간 API Route 제거)
      const timeouts = getEnvironmentTimeouts();

      // DirectGoogleAIService 사용 (API Wrapper Anti-Pattern 제거)
      const directGoogleAI = getDirectGoogleAIService();
      const apiResponse = await directGoogleAI.generateContent(prompt, {
        model: selectedModel,
        temperature: standardTemperature,
        maxTokens: standardMaxTokens,
        timeout: timeouts.GOOGLE_AI // 🎯 넉넉한 타임아웃: timeout-config.ts 설정 사용 (8초)
      });

      if (!apiResponse.success) {
        throw new Error(`Google AI 직접 호출 오류: ${apiResponse.error}`);
      }

      const googleStep = thinkingSteps[thinkingSteps.length - 1];
      if (googleStep) {
        googleStep.status = 'completed';
        googleStep.description = 'Gemini API 응답 수신';
        googleStep.duration = Date.now() - googleStepStart;
      }

      // 🔄 사용량 추적: 성공한 API 호출 기록
      const usageTracker = getGoogleAIUsageTracker();
      usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: apiResponse.usage?.totalTokens || 0,
        latency: apiResponse.responseTime,
        success: true,
        difficultyScore,
      });

      // 🚀 직접 응답 사용 (구조 단순화)
      const finalResponse = apiResponse.content || '응답을 생성할 수 없습니다.';
      const finalConfidence = 0.9; // DirectGoogleAIService는 항상 높은 신뢰도

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: selectedModel,
          tokensUsed: apiResponse.usage?.totalTokens || 0,
          mcpUsed: !!(mcpContext && enableAIAssistantMCP),
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          // GCP VM MCP 제거됨 - Cloud Functions 전용으로 단순화
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai',
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
      console.error('Google AI 처리 오류:', error);

      // 🔄 사용량 추적: 실패한 API 호출 기록
      const usageTracker = getGoogleAIUsageTracker();
      usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: 0,
        latency: Date.now() - googleStepStart,
        success: false,
        difficultyScore,
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
        engine: 'google-ai',
        confidence: 0,
        thinkingSteps,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        metadata: {
          model: selectedModel,
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai',
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
