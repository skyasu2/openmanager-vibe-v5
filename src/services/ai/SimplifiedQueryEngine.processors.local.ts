/**
 * 🏠 SimplifiedQueryEngine Local Query Processor
 *
 * Specialized processor for local RAG-based queries:
 * - Supabase RAG search integration
 * - Local response generation
 * - Fallback handling
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '../mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '../../modules/ai-agent/processors/IntentClassifier';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
} from '../../types/ai-service-types';
import type { QueryResponse } from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';

/**
 * 🏠 로컬 쿼리 프로세서 (RAG 기반)
 */
export class LocalQueryProcessor {
  private helpers: SimplifiedQueryEngineHelpers;

  constructor(
    private utils: SimplifiedQueryEngineUtils,
    private ragEngine: SupabaseRAGEngine,
    private contextLoader: CloudContextLoader,
    private mockContextLoader: MockContextLoader,
    private intentClassifier: IntentClassifier
  ) {
    this.helpers = new SimplifiedQueryEngineHelpers(mockContextLoader);
  }

  /**
   * 🔍 로컬 RAG 기반 쿼리 처리
   */
  async processLocalQuery(
    query: string,
    context: AIQueryContext,
    options: AIQueryOptions,
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): Promise<QueryResponse> {
    // ✅ 안전한 thinking steps 초기화
    thinkingSteps = this.utils.safeInitThinkingSteps(thinkingSteps);

    const ragStepStart = Date.now();
    thinkingSteps.push({
      step: '로컬 RAG 검색',
      description: 'Supabase 벡터 검색 실행',
      status: 'pending',
      timestamp: ragStepStart,
    });

    let ragResult;
    const maxResults = options?.maxResults || 5;
    const threshold = options?.threshold || 0.7;

    try {
      ragResult = await this.ragEngine.searchSimilar(query, {
        maxResults,
        threshold,
        category: options?.category,
        enableMCP: false, // MCP는 이미 별도로 처리
      });

      // ✅ 안전한 배열 접근
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'completed',
        description: `${ragResult.totalResults}개 관련 문서 발견`,
        duration: Date.now() - ragStepStart,
      });
    } catch (ragError) {
      // RAG 검색 실패 시 에러 처리
      console.error('RAG 검색 실패:', ragError);

      // ✅ 안전한 배열 접근
      this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
        status: 'failed',
        description: 'RAG 검색 실패',
        duration: Date.now() - ragStepStart,
      });

      // RAG 실패 시 에러 응답 반환
      return {
        success: false,
        response: '죄송합니다. 검색 중 오류가 발생했습니다.',
        engine: 'local-rag',
        confidence: 0,
        thinkingSteps,
        error: ragError instanceof Error ? ragError.message : 'RAG 검색 실패',
        processingTime: Date.now() - startTime,
      };
    }

    // 3단계: 응답 생성
    const responseStepStart = Date.now();
    thinkingSteps.push({
      step: '로컬 응답 생성',
      description: 'RAG 결과 기반 응답 생성',
      status: 'pending',
      timestamp: responseStepStart,
    });

    const response = await this.helpers.generateLocalResponse(
      query,
      ragResult,
      mcpContext,
      context
    );

    // ✅ 안전한 배열 접근
    this.utils.safeUpdateLastThinkingStep(thinkingSteps, {
      status: 'completed',
      duration: Date.now() - responseStepStart,
    });

    return {
      success: true,
      response,
      engine: 'local-rag',
      confidence: this.helpers.calculateConfidence(ragResult),
      thinkingSteps,
      metadata: {
        ragResults: ragResult.totalResults,
        sources:
          ragResult.results?.map((r) => r.metadata?.source).filter(Boolean) ||
          [],
        mcpFiles: mcpContext?.files?.length || 0,
      },
      processingTime: Date.now() - startTime,
    };
  }
}
