/**
 * 🤖 Local AI Mode Processor - SimplifiedQueryEngine
 *
 * Handles Local AI mode query processing:
 * - Korean NLP processing (when enabled)
 * - Intent classification
 * - Supabase RAG search
 * - VM Backend integration (when enabled)
 * - No Google AI API usage
 * - No AI Assistant MCP usage
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { MockContextLoader } from './MockContextLoader';
import {
  IntentClassifier,
  IntentResult,
} from '../../modules/ai-agent/processors/IntentClassifier';
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
} from '../../types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
  NLPResult,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';

/**
 * 🤖 로컬 AI 모드 프로세서
 */
export class LocalAIModeProcessor {
  private utils: SimplifiedQueryEngineUtils;
  private ragEngine: SupabaseRAGEngine;
  private mockContextLoader: MockContextLoader;
  private intentClassifier: IntentClassifier;
  private helpers: SimplifiedQueryEngineHelpers;

  constructor(
    utils: SimplifiedQueryEngineUtils,
    ragEngine: SupabaseRAGEngine,
    mockContextLoader: MockContextLoader,
    intentClassifier: IntentClassifier,
    helpers: SimplifiedQueryEngineHelpers
  ) {
    this.utils = utils;
    this.ragEngine = ragEngine;
    this.mockContextLoader = mockContextLoader;
    this.intentClassifier = intentClassifier;
    this.helpers = helpers;
  }

  /**
   * 로컬 AI 모드 쿼리 처리
   * - 한국어 NLP 처리 (enableKoreanNLP=true일 때)
   * - Supabase RAG 검색
   * - VM 백엔드 연동 (enableVMBackend=true일 때)
   * - Google AI API 사용하지 않음
   * - AI 어시스턴트 MCP 사용하지 않음
   */
  async processLocalAIModeQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    modeConfig: { enableKoreanNLP: boolean; enableVMBackend: boolean }
  ): Promise<QueryResponse> {
    const { enableKoreanNLP, enableVMBackend } = modeConfig;

    // 1단계: 한국어 NLP 처리 및 의도 분류 (활성화된 경우)
    let nlpResult: NLPResult | null = null;
    let intentResult: IntentResult | null = null;

    if (enableKoreanNLP) {
      const nlpStepStart = Date.now();
      thinkingSteps.push({
        step: '한국어 NLP 처리 및 의도 분류',
        description: '한국어 자연어 처리 및 의도 분석',
        status: 'pending',
        timestamp: nlpStepStart,
      });

      try {
        // 한국어 비율 확인
        const koreanRatio = this.utils.calculateKoreanRatio(query);

        if (koreanRatio > 0.3) {
          // 한국어가 30% 이상인 경우 NLP 처리
          const nlpAnalysis = await this.utils.callKoreanNLPFunction(query);
          
          // NLPAnalysis를 NLPResult로 변환
          if (nlpAnalysis) {
            nlpResult = {
              success: true,
              intent: nlpAnalysis.intent,
              confidence: 0.8, // 기본 신뢰도
              analysis: nlpAnalysis
            };
          } else {
            nlpResult = {
              success: false
            };
          }

          // IntentClassifier로 의도 분류 (NLP 결과와 통합)
          intentResult = await this.intentClassifier.classify(query, nlpResult);

          if (nlpResult.success) {
            thinkingSteps[thinkingSteps.length - 1].status = 'completed';
            thinkingSteps[thinkingSteps.length - 1].description =
              `한국어 비율 ${Math.round(koreanRatio * 100)}% - NLP 처리 완료 (의도: ${intentResult.intent || nlpResult.intent || 'general'}, 신뢰도: ${Math.round((intentResult.confidence || 0) * 100)}%)`;

            // NLP 결과와 Intent 분류 결과를 컨텍스트의 metadata에 추가
            if (context) {
              if (!context.metadata) {
                context.metadata = {};
              }
              // NLP 결과 저장
              context.metadata.nlpIntent = nlpResult.intent;
              // Entity 배열을 JSON 문자열로 직렬화
              if (nlpResult.entities) {
                context.metadata.nlpEntities = JSON.stringify(
                  nlpResult.entities
                );
                // 간단한 엔티티 값 목록도 저장
                context.metadata.nlpEntityValues = nlpResult.entities.map(
                  (e) => e.value
                );
              }
              context.metadata.nlpConfidence = nlpResult.confidence;
              // NLPAnalysis를 개별 속성으로 펼쳐서 저장
              if (nlpResult.analysis) {
                context.metadata.nlpAnalysisIntent = nlpResult.analysis.intent;
                if (nlpResult.analysis.sentiment) {
                  context.metadata.nlpSentiment = nlpResult.analysis.sentiment;
                }
                if (nlpResult.analysis.keywords) {
                  context.metadata.nlpKeywords = nlpResult.analysis.keywords;
                }
                if (nlpResult.analysis.topics) {
                  context.metadata.nlpTopics = nlpResult.analysis.topics;
                }
                if (nlpResult.analysis.summary) {
                  context.metadata.nlpSummary = nlpResult.analysis.summary;
                }
              }

              // IntentClassifier 결과 저장
              context.metadata.classifiedIntent = intentResult.intent;
              context.metadata.intentConfidence = intentResult.confidence;
              context.metadata.intentCategory = intentResult.category;
              context.metadata.intentPriority = intentResult.priority;
              context.metadata.urgency = intentResult.urgency;
              context.metadata.suggestedActions = intentResult.suggestedActions;

              // AI 엔진 요구사항 저장
              context.metadata.needsTimeSeries = intentResult.needsTimeSeries;
              context.metadata.needsNLP = intentResult.needsNLP;
              context.metadata.needsAnomalyDetection =
                intentResult.needsAnomalyDetection;
              context.metadata.needsComplexML = intentResult.needsComplexML;
            }
          } else {
            // NLP 실패해도 IntentClassifier는 실행
            intentResult = await this.intentClassifier.classify(query);

            thinkingSteps[thinkingSteps.length - 1].status = 'completed';
            thinkingSteps[thinkingSteps.length - 1].description =
              `한국어 NLP 처리 실패 - IntentClassifier로 의도 분류 (의도: ${intentResult.intent}, 신뢰도: ${Math.round(intentResult.confidence * 100)}%)`;

            // IntentClassifier 결과만 저장
            if (context) {
              if (!context.metadata) {
                context.metadata = {};
              }
              context.metadata.classifiedIntent = intentResult.intent;
              context.metadata.intentConfidence = intentResult.confidence;
              context.metadata.intentCategory = intentResult.category;
              context.metadata.intentPriority = intentResult.priority;
              context.metadata.urgency = intentResult.urgency;
              context.metadata.suggestedActions = intentResult.suggestedActions;
            }
          }
        } else {
          // 영어 쿼리도 IntentClassifier로 분류
          intentResult = await this.intentClassifier.classify(query);

          thinkingSteps[thinkingSteps.length - 1].status = 'completed';
          thinkingSteps[thinkingSteps.length - 1].description =
            `영어 쿼리 감지 - IntentClassifier로 의도 분류 (의도: ${intentResult.intent}, 신뢰도: ${Math.round(intentResult.confidence * 100)}%)`;

          // IntentClassifier 결과 저장
          if (context) {
            if (!context.metadata) {
              context.metadata = {};
            }
            context.metadata.classifiedIntent = intentResult.intent;
            context.metadata.intentConfidence = intentResult.confidence;
            context.metadata.intentCategory = intentResult.category;
            context.metadata.intentPriority = intentResult.priority;
            context.metadata.urgency = intentResult.urgency;
            context.metadata.suggestedActions = intentResult.suggestedActions;
          }
        }

        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - nlpStepStart;
      } catch (error) {
        console.warn('한국어 NLP 처리 및 의도 분류 실패:', error);
        thinkingSteps[thinkingSteps.length - 1].status = 'failed';
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - nlpStepStart;
      }
    } else {
      // NLP 비활성화 시에도 IntentClassifier는 실행
      const intentStepStart = Date.now();
      thinkingSteps.push({
        step: '의도 분류',
        description: 'IntentClassifier로 쿼리 의도 분석',
        status: 'pending',
        timestamp: intentStepStart,
      });

      try {
        intentResult = await this.intentClassifier.classify(query);

        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description =
          `의도 분류 완료 (의도: ${intentResult.intent}, 카테고리: ${intentResult.category}, 신뢰도: ${Math.round(intentResult.confidence * 100)}%)`;
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - intentStepStart;

        // IntentClassifier 결과 저장
        if (context) {
          if (!context.metadata) {
            context.metadata = {};
          }
          context.metadata.classifiedIntent = intentResult.intent;
          context.metadata.intentConfidence = intentResult.confidence;
          context.metadata.intentCategory = intentResult.category;
          context.metadata.intentPriority = intentResult.priority;
          context.metadata.urgency = intentResult.urgency;
          context.metadata.suggestedActions = intentResult.suggestedActions;
        }
      } catch (error) {
        console.warn('의도 분류 실패:', error);
        thinkingSteps[thinkingSteps.length - 1].status = 'failed';
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - intentStepStart;
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
        maxResults: 5, // 고정값 (복잡도 분석 없음)
        threshold: 0.5,
        category: options?.category,
        enableMCP: false, // AI 어시스턴트 MCP는 로컬 AI 모드에서 사용하지 않음
      });

      thinkingSteps[thinkingSteps.length - 1].status = 'completed';
      thinkingSteps[thinkingSteps.length - 1].description =
        `${ragResult.totalResults}개 관련 문서 발견`;
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - ragStepStart;
    } catch (ragError) {
      // RAG 검색 실패 시 에러 처리
      console.error('RAG 검색 실패:', ragError);
      thinkingSteps[thinkingSteps.length - 1].status = 'failed';
      thinkingSteps[thinkingSteps.length - 1].description = 'RAG 검색 실패';
      thinkingSteps[thinkingSteps.length - 1].duration =
        Date.now() - ragStepStart;

      // RAG 실패 시 에러 응답 반환
      return {
        success: false,
        response: '쿼리 처리 중 오류가 발생했습니다.',
        engine: 'local-ai',
        confidence: 0,
        thinkingSteps,
        error: ragError instanceof Error ? ragError.message : '알 수 없는 오류',
        processingTime: Date.now() - startTime,
      };
    }

    // VM 백엔드 연동 제거됨 (GCP VM 제거로 인해)

    // 4단계: 응답 생성
    const responseStepStart = Date.now();
    thinkingSteps.push({
      step: '로컬 AI 응답 생성',
      description: 'RAG 검색 결과 기반 응답 생성 (Google AI 사용 안함)',
      status: 'pending',
      timestamp: responseStepStart,
    });

    const response = this.helpers.generateLocalResponse(
      query,
      ragResult,
      mcpContext,
      context
    );

    thinkingSteps[thinkingSteps.length - 1].status = 'completed';
    thinkingSteps[thinkingSteps.length - 1].duration =
      Date.now() - responseStepStart;

    return {
      success: true,
      response,
      engine: 'local-ai',
      confidence: this.helpers.calculateConfidence(ragResult),
      thinkingSteps,
      metadata: {
        ragResults: ragResult.totalResults,
        cached: ragResult.cached,
        mcpUsed: !!mcpContext,
        mockMode: !!this.mockContextLoader.getMockContext(),
        koreanNLPUsed: enableKoreanNLP,
        mode: 'local-ai',
      } as AIMetadata & {
        koreanNLPUsed?: boolean;
        mockMode?: boolean;
      },
      processingTime: Date.now() - startTime,
    };
  }
}
