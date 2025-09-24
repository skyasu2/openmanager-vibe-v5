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

    // 2단계: 쿼리 난이도 분석 및 모델 선택
    const difficultyStepStart = Date.now();
    thinkingSteps.push({
      step: '쿼리 난이도 분석',
      description: '난이도 기반 최적 모델 선택',
      status: 'pending',
      timestamp: difficultyStepStart,
    });

    let selectedModel: GoogleAIModel = 'gemini-2.5-flash'; // 기본값
    let difficultyScore = 0;
    let difficultyLevel = 'medium';

    try {
      const difficultyAnalyzer = getQueryDifficultyAnalyzer();
      const usageTracker = getGoogleAIUsageTracker();
      
      // 실제 사용량 데이터 조회
      const currentUsage = usageTracker.getCurrentUsage();
      const usageQuota = {
        'gemini-2.5-pro': { 
          daily: currentUsage['gemini-2.5-pro'].daily - currentUsage['gemini-2.5-pro'].remaining.daily,
          rpm: currentUsage['gemini-2.5-pro'].rpm - currentUsage['gemini-2.5-pro'].remaining.rpm,
        },
        'gemini-2.5-flash': { 
          daily: currentUsage['gemini-2.5-flash'].daily - currentUsage['gemini-2.5-flash'].remaining.daily,
          rpm: currentUsage['gemini-2.5-flash'].rpm - currentUsage['gemini-2.5-flash'].remaining.rpm,
        },
        'gemini-2.5-flash-lite': { 
          daily: currentUsage['gemini-2.5-flash-lite'].daily - currentUsage['gemini-2.5-flash-lite'].remaining.daily,
          rpm: currentUsage['gemini-2.5-flash-lite'].rpm - currentUsage['gemini-2.5-flash-lite'].remaining.rpm,
        },
      };

      const analysis = difficultyAnalyzer.analyze(query, context, mcpContext, usageQuota);
      
      selectedModel = analysis.recommendedModel;
      difficultyScore = analysis.score;
      difficultyLevel = analysis.level;

      const difficultyStep = thinkingSteps[thinkingSteps.length - 1];
      if (difficultyStep) {
        difficultyStep.status = 'completed';
        difficultyStep.description = `${analysis.level} (${analysis.score}점) → ${selectedModel} 선택`;
        difficultyStep.duration = Date.now() - difficultyStepStart;
      }

      console.log(`🎯 난이도 분석 완료: ${analysis.reasoning}`);
    } catch (error) {
      console.warn('난이도 분석 실패, 기본 모델 사용:', error);
      const difficultyFailedStep = thinkingSteps[thinkingSteps.length - 1];
      if (difficultyFailedStep) {
        difficultyFailedStep.status = 'failed';
        difficultyFailedStep.description = '기본 모델(gemini-2.5-flash) 사용';
        difficultyFailedStep.duration = Date.now() - difficultyStepStart;
      }
    }

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

      // Google AI API 호출 (타임아웃 설정)
      const timeouts = getEnvironmentTimeouts();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeouts.GOOGLE_AI); // 환경변수 기반 타임아웃

      // 난이도 기반 동적 파라미터 설정
      const dynamicTemperature = difficultyLevel === 'simple' ? 0.5 : 
                                 difficultyLevel === 'medium' ? 0.7 : 0.9;
      const dynamicMaxTokens = difficultyLevel === 'simple' ? 500 : 
                              difficultyLevel === 'medium' ? 1000 : 2000;

      // 서버 사이드 환경에서는 절대 URL 필요
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/ai/google-ai/generate`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Assistant': 'true',
          'X-AI-Mode': 'google-ai',
          'User-Agent': 'AI-Assistant',
          'X-Diagnostic-Mode': 'true'
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          temperature: dynamicTemperature,
          maxTokens: dynamicMaxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google AI API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      const googleStep = thinkingSteps[thinkingSteps.length - 1];
      if (googleStep) {
        googleStep.status = 'completed';
        googleStep.description = 'Gemini API 응답 수신';
        googleStep.duration = Date.now() - googleStepStart;
      }

      // 🔄 응답 구조 분석 및 데이터 추출
      const apiData = data.data || data; // 중첩 구조 대응

      // 🔄 사용량 추적: 성공한 API 호출 기록
      const usageTracker = getGoogleAIUsageTracker();
      usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: apiData.metadata?.actualTokens || apiData.metadata?.promptTokens || data.metadata?.actualTokens || 0,
        latency: Date.now() - googleStepStart,
        success: true,
        difficultyScore,
      });

      // GCP VM MCP 제거됨 (VM 제거로 인해 불필요)

      // VM 백엔드 연동 제거됨 (GCP VM 제거로 인해)

      // Google AI 직접 응답 (VM MCP 제거로 인해 단순화)
      // 🔧 응답 구조 수정: data.data.response 경로로 접근
      const finalResponse =
        apiData.response || apiData.text || data.response || data.text || '응답을 생성할 수 없습니다.';
      const finalConfidence = apiData.confidence || data.confidence || 0.9;

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: selectedModel,
          tokensUsed: apiData.metadata?.actualTokens || data.tokensUsed || 0,
          mcpUsed: !!(mcpContext && enableAIAssistantMCP),
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          // GCP VM MCP 제거됨 - Cloud Functions 전용으로 단순화
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai',
          // 난이도 분석 정보 추가
          difficultyAnalysis: {
            score: difficultyScore,
            level: difficultyLevel,
            selectedModel,
            temperature: dynamicTemperature,
            maxTokens: dynamicMaxTokens,
          },
        } as unknown as AIMetadata & {
          aiAssistantMCPUsed?: boolean;
          koreanNLPUsed?: boolean;
          mockMode?: boolean;
          difficultyAnalysis?: {
            score: number;
            level: string;
            selectedModel: GoogleAIModel;
            temperature: number;
            maxTokens: number;
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
          // 난이도 분석 정보 추가 (에러 시에도 포함)
          difficultyAnalysis: {
            score: difficultyScore,
            level: difficultyLevel,
            selectedModel,
            temperature: difficultyLevel === 'simple' ? 0.5 : 
                        difficultyLevel === 'medium' ? 0.7 : 0.9,
            maxTokens: difficultyLevel === 'simple' ? 500 : 
                      difficultyLevel === 'medium' ? 1000 : 2000,
          },
        } as AIMetadata & {
          aiAssistantMCPUsed?: boolean;
          koreanNLPUsed?: boolean;
          mockMode?: boolean;
          difficultyAnalysis?: {
            score: number;
            level: string;
            selectedModel: GoogleAIModel;
            temperature: number;
            maxTokens: number;
          };
        },
        processingTime: Date.now() - startTime,
      };
    }
  }
}
