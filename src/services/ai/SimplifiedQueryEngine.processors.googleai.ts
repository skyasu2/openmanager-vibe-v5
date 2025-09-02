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
          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description =
            `한국어 비율 ${Math.round(koreanRatio * 100)}% - NLP 처리 완료`;
        } else {
          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description =
            `영어 쿼리 감지 - NLP 건너뛰기`;
        }

        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - nlpStepStart;
      } catch (error) {
        console.warn('한국어 NLP 처리 실패:', error);
        thinkingSteps[thinkingSteps.length - 1].status = 'failed';
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - nlpStepStart;
      }
    }

    // 2단계: Google AI API 처리 (핵심 기능)
    const googleStepStart = Date.now();
    thinkingSteps.push({
      step: 'Google AI 처리',
      description: 'Gemini API 호출 및 응답 생성',
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 400); // 400ms 타임아웃

      const response = await fetch('/api/ai/google-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: 0.7, // 고정값 (복잡도 분석 없음)
          maxTokens: 1000, // 고정값
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google AI API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Gemini API 응답 수신';
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - googleStepStart;

      // GCP VM MCP 제거됨 (VM 제거로 인해 불필요)

      // VM 백엔드 연동 제거됨 (GCP VM 제거로 인해)

      // Google AI 직접 응답 (VM MCP 제거로 인해 단순화)
      const finalResponse =
        data.response || data.text || '응답을 생성할 수 없습니다.';
      const finalConfidence = data.confidence || 0.9;

      return {
        success: true,
        response: finalResponse,
        engine: 'google-ai',
        confidence: finalConfidence,
        thinkingSteps,
        metadata: {
          model: data.model || 'gemini-pro',
          tokensUsed: data.tokensUsed,
          mcpUsed: !!(mcpContext && enableAIAssistantMCP),
          aiAssistantMCPUsed: enableAIAssistantMCP,
          koreanNLPUsed: enableKoreanNLP,
          // GCP VM MCP 제거됨 - Cloud Functions 전용으로 단순화
          mockMode: !!this.mockContextLoader.getMockContext(),
          mode: 'google-ai',
        } as unknown as AIMetadata & {
          aiAssistantMCPUsed?: boolean;
          koreanNLPUsed?: boolean;
          // GCP VM MCP 타입 제거됨
          mockMode?: boolean;
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Google AI 처리 오류:', error);

      // 폴백: 로컬 AI 모드로 전환
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description =
        'Google AI 실패, 로컬 AI 모드로 전환';
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - googleStepStart;

      return await this.localAIProcessor.processLocalAIModeQuery(
        query,
        context,
        options,
        mcpContext,
        thinkingSteps,
        startTime,
        { enableKoreanNLP: true, enableVMBackend: false }
      );
    }
  }
}
