/**
 * 🏠 Local Query Processor - SimplifiedQueryEngine
 * 
 * Handles local RAG query processing:
 * - Supabase pgvector search
 * - Response generation from RAG results
 * - Confidence calculation
 * - MCP context integration
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { MockContextLoader } from './MockContextLoader';
import type { ComplexityScore } from './query-complexity-analyzer';
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
} from '@/types/ai-service-types';
import type {
  QueryRequest,
  QueryResponse,
} from './SimplifiedQueryEngine.types';
import { SimplifiedQueryEngineHelpers } from './SimplifiedQueryEngine.processors.helpers';

/**
 * 🏠 로컬 쿼리 프로세서
 */
export class LocalQueryProcessor {
  private ragEngine: SupabaseRAGEngine;
  private mockContextLoader: MockContextLoader;
  private helpers: SimplifiedQueryEngineHelpers;

  constructor(
    ragEngine: SupabaseRAGEngine,
    mockContextLoader: MockContextLoader,
    helpers: SimplifiedQueryEngineHelpers
  ) {
    this.ragEngine = ragEngine;
    this.mockContextLoader = mockContextLoader;
    this.helpers = helpers;
  }

  /**
   * 🏠 로컬 RAG 쿼리 처리 (최적화됨)
   */
  async processLocalQuery(
    query: string,
    context: AIQueryContext | undefined,
    options: QueryRequest['options'],
    mcpContext: MCPContext | null,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number,
    complexity?: ComplexityScore
  ): Promise<QueryResponse> {
    // RAG 검색
    const ragStepStart = Date.now();
    thinkingSteps.push({
      step: 'RAG 검색',
      description: 'Supabase 벡터 DB에서 관련 문서 검색',
      status: 'pending',
      timestamp: ragStepStart,
    });

    // 복잡도에 따라 검색 파라미터 조정
    const maxResults = complexity && complexity.score < 30 ? 3 : 5;
    const threshold = complexity && complexity.score < 30 ? 0.6 : 0.5;

    let ragResult;
    try {
      ragResult = await this.ragEngine.searchSimilar(query, {
        maxResults,
        threshold,
        category: options?.category,
        enableMCP: false, // MCP는 이미 별도로 처리
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
      thinkingSteps[thinkingSteps.length - 1].duration = Date.now() - ragStepStart;
      
      // RAG 실패 시 에러 응답 반환
      return {
        success: false,
        response: '쿼리 처리 중 오류가 발생했습니다.',
        engine: 'local-rag',
        confidence: 0,
        thinkingSteps,
        error: ragError instanceof Error ? ragError.message : '알 수 없는 오류',
        processingTime: Date.now() - startTime,
      };
    }

    // 응답 생성
    const responseStepStart = Date.now();
    thinkingSteps.push({
      step: '응답 생성',
      description: '검색 결과를 바탕으로 응답 생성',
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
      engine: 'local-rag',
      confidence: this.helpers.calculateConfidence(ragResult),
      thinkingSteps,
      metadata: {
        ragResults: ragResult.totalResults,
        cached: ragResult.cached,
        mcpUsed: !!mcpContext,
        mockMode: !!this.mockContextLoader.getMockContext(),
        complexity,
      } as AIMetadata & { complexity?: ComplexityScore; cacheHit?: boolean; mockMode?: boolean },
      processingTime: Date.now() - startTime,
    };
  }
}