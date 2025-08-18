/**
 * 🔌 서비스 어댑터
 *
 * 기존 분산 서비스들을 새로운 통합 인터페이스와 연결
 * - 기존 코드 유지하면서 점진적 마이그레이션
 * - 인터페이스 호환성 보장
 */

import type {
  DistributedRequest,
  DistributedResponse,
  SupabaseRAGRequest,
  SupabaseRAGResponse,
  GCPFunctionRequest,
  GCPFunctionResponse,
  ThinkingStep,
} from '../interfaces/distributed-ai.interface';

import { getSupabaseRAGEngine } from '../supabase-rag-engine';
import { distributedErrorHandler } from '../errors/distributed-error-handler';
import { supabaseRealtimeAdapter as supabaseRealtimeAdapterInstance } from './supabase-realtime-adapter';
import type { RAGSearchResult } from '@/types/ai-service-types';

/**
 * Supabase RAG 어댑터
 */
export class SupabaseRAGAdapter {
  private ragEngine = getSupabaseRAGEngine();

  async search(
    request: SupabaseRAGRequest
  ): Promise<DistributedResponse<SupabaseRAGResponse>> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];

    try {
      // 생각중 단계 추가
      thinkingSteps.push({
        id: `${request.id}-1`,
        step: '벡터 검색 준비',
        description: `쿼리: ${request.query.substring(0, 50)}...`,
        status: 'processing',
        timestamp: Date.now(),
        service: 'supabase-rag',
      });

      // 기존 RAG 엔진 호출
      const result = await this.ragEngine.searchSimilar(request.query, {
        maxResults: request.maxResults,
        threshold: request.threshold,
        includeContext: request.includeContext,
        cached: true,
      });

      // 생각중 단계 완료
      thinkingSteps[0].status = 'completed';
      thinkingSteps[0].duration = Date.now() - thinkingSteps[0].timestamp;

      // 응답 변환
      const response: DistributedResponse<SupabaseRAGResponse> = {
        id: request.id,
        success: result.success,
        data: result.success
          ? {
              results: result.results.map((r) => ({
                id: r.id,
                content: r.content,
                similarity: r.similarity || 0, // Provide default if missing
                metadata: r.metadata,
              })),
              context: result.context,
              totalResults: result.totalResults,
            }
          : undefined,
        error: result.success
          ? undefined
          : distributedErrorHandler.createDistributedError(
              new Error(result.error || '검색 실패'),
              'supabase-rag'
            ),
        metadata: {
          service: 'supabase-rag',
          processingTime: Date.now() - startTime,
          cacheHit: result.cached,
          timestamp: new Date().toISOString(),
        },
        thinkingSteps,
      };

      return response;
    } catch (error) {
      thinkingSteps[0].status = 'failed';
      thinkingSteps[0].duration = Date.now() - thinkingSteps[0].timestamp;

      return {
        id: request.id,
        success: false,
        error: distributedErrorHandler.createDistributedError(
          error,
          'supabase-rag'
        ),
        metadata: {
          service: 'supabase-rag',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        thinkingSteps,
      };
    }
  }
}

/**
 * GCP Functions 어댑터
 */
export class GCPFunctionsAdapter {
  private readonly baseUrl =
    process.env.NEXT_PUBLIC_GCP_FUNCTIONS_BASE_URL || '';
  private readonly apiKey = process.env.GCP_FUNCTIONS_API_KEY || '';

  async callFunction(
    request: GCPFunctionRequest
  ): Promise<DistributedResponse<GCPFunctionResponse>> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];

    try {
      // 생각중 단계 추가
      thinkingSteps.push({
        id: `${request.id}-1`,
        step: 'GCP Function 호출',
        description: `함수: ${request.functionType}`,
        status: 'processing',
        timestamp: Date.now(),
        service: `gcp-${request.functionType === 'korean-nlp' ? 'korean-nlp' : 'ml-analytics'}`,
      });

      // GCP Function 호출
      const functionUrl = `${this.baseUrl}/${request.functionType}`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: request.query,
          context: request.context,
          ...request.parameters,
        }),
      });

      if (!response.ok) {
        throw new Error(`GCP Function error: ${response.status}`);
      }

      const data = await response.json();

      // 생각중 단계 완료
      thinkingSteps[0].status = 'completed';
      thinkingSteps[0].duration = Date.now() - thinkingSteps[0].timestamp;

      // 응답 변환
      const result: DistributedResponse<GCPFunctionResponse> = {
        id: request.id,
        success: true,
        data: {
          result: data.result || data,
          confidence: data.confidence,
          processingSteps: data.processing_steps || data.processingSteps,
        },
        metadata: {
          service: `gcp-${request.functionType === 'korean-nlp' ? 'korean-nlp' : 'ml-analytics'}`,
          processingTime: Date.now() - startTime,
          tokensUsed: data.tokens_used || data.tokensUsed,
          timestamp: new Date().toISOString(),
        },
        thinkingSteps,
      };

      return result;
    } catch (error) {
      thinkingSteps[0].status = 'failed';
      thinkingSteps[0].duration = Date.now() - thinkingSteps[0].timestamp;

      return {
        id: request.id,
        success: false,
        error: distributedErrorHandler.createDistributedError(
          error,
          `gcp-${request.functionType === 'korean-nlp' ? 'korean-nlp' : 'ml-analytics'}`
        ),
        metadata: {
          service: `gcp-${request.functionType === 'korean-nlp' ? 'korean-nlp' : 'ml-analytics'}`,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        thinkingSteps,
      };
    }
  }
}

// 싱글톤 인스턴스들
export const supabaseRAGAdapter = new SupabaseRAGAdapter();
export const gcpFunctionsAdapter = new GCPFunctionsAdapter();

// Supabase Realtime 어댑터 (Redis 대체)
export const supabaseRealtimeAdapter = supabaseRealtimeAdapterInstance;
