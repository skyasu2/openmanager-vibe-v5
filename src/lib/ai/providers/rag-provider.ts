/**
 * RAG Provider - Supabase pgvector 기반 문서 검색
 *
 * Supabase SupabaseRAGEngine 래핑하여 Unified Engine에 통합
 *
 * 기능:
 * - pgvector 유사도 검색 (cosine similarity)
 * - 로컬 임베딩 생성 (Google AI 또는 로컬)
 * - 키워드 기반 fallback
 *
 * 최적화:
 * - 3분 TTL 캐싱 (RAG 결과 재사용)
 * - 시나리오 기반 선택적 활성화 (document-qa 중심)
 * - 검색 결과 개수 제한 (top_k)
 */

import type {
  IContextProvider,
  ProviderContext,
  RAGData,
  ProviderOptions,
  AIScenario,
} from '@/lib/ai/core/types';

// Supabase RAG Engine 임포트 (기존 구현 재사용)
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import type { RAGEngineSearchResult } from '@/services/ai/supabase-rag-engine';

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  data: RAGData;
  timestamp: number;
}

// ============================================================================
// RAG Provider
// ============================================================================

export class RAGProvider implements IContextProvider {
  readonly name = 'RAG Search';
  readonly type = 'rag' as const;

  private ragEngine: SupabaseRAGEngine;
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 3 * 60 * 1000; // 3분 (RAG는 짧은 캐싱)

  constructor() {
    // Supabase RAG Engine 초기화
    this.ragEngine = new SupabaseRAGEngine();
  }

  /**
   * 메인 엔트리 포인트: RAG 검색 컨텍스트 제공
   */
  async getContext(query: string, options?: ProviderOptions): Promise<ProviderContext> {
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return {
        type: 'rag',
        data: cached,
        metadata: {
          source: 'supabase-rag',
          confidence: 0.85,
          cached: true,
        },
      };
    }

    try {
      // Supabase RAG Engine으로 검색
      const searchOptions = {
        limit: options?.top_k || 5, // 기본 5개 문서
        threshold: options?.threshold || 0.7, // 유사도 임계값
      };

      const searchResult: RAGEngineSearchResult = await this.ragEngine.searchSimilar(
        query,
        searchOptions
      );

      if (!searchResult.success) {
        throw new Error(searchResult.error || 'RAG search failed');
      }

      const ragData: RAGData = this.transformToRAGData(searchResult);
      this.setCache(cacheKey, ragData);

      return {
        type: 'rag',
        data: ragData,
        metadata: {
          source: 'supabase-rag',
          confidence: this.calculateConfidence(searchResult),
          cached: false,
          processingTime: searchResult.metadata?.processingTime,
        },
      };
    } catch (error) {
      console.error('[RAGProvider] Search failed:', error);
      return this.getEmptyContext('search_error');
    }
  }

  /**
   * 시나리오별 활성화 여부
   * RAG는 문서 QA와 일반 쿼리에만 활성화
   */
  isEnabled(scenario: AIScenario): boolean {
    const enabledScenarios: AIScenario[] = [
      'document-qa',
      'general-query',
      'optimization-advice', // 문서 기반 최적화 제안
    ];
    return enabledScenarios.includes(scenario);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * RAG 검색 결과를 RAGData 타입으로 변환
   */
  private transformToRAGData(searchResult: RAGEngineSearchResult): RAGData {
    return {
      documents: searchResult.results.map((result: { id: string; content: string; similarity: number; metadata?: any }) => ({
        id: result.id,
        content: result.content,
        source: result.metadata?.source || 'unknown',
        similarity: result.similarity,
        metadata: {
          title: result.metadata?.title,
          section: result.metadata?.section,
          tags: result.metadata?.tags || [],
          createdAt: result.metadata?.createdAt,
          updatedAt: result.metadata?.updatedAt,
        },
      })),
      totalResults: searchResult.totalResults || searchResult.results.length,
      queryEmbedding: searchResult.queryEmbedding,
    };
  }

  /**
   * 검색 결과 신뢰도 계산
   */
  private calculateConfidence(searchResult: RAGEngineSearchResult): number {
    if (!searchResult.results || searchResult.results.length === 0) {
      return 0;
    }

    // 상위 3개 문서의 평균 유사도
    const topResults = searchResult.results.slice(0, 3);
    const avgSimilarity =
      topResults.reduce((sum: number, r: { similarity: number }) => sum + r.similarity, 0) / topResults.length;

    return avgSimilarity;
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(query: string, options?: ProviderOptions): string {
    const normalized = query.trim().toLowerCase();
    const topK = options?.top_k || 5;
    const threshold = options?.threshold || 0.7;
    return `rag:${normalized}:${topK}:${threshold}`;
  }

  /**
   * 캐시 조회
   */
  private getFromCache(key: string): RAGData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시 저장
   */
  private setCache(key: string, data: RAGData): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // 캐시 크기 제한 (최대 50개, RAG는 적게 캐싱)
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * 빈 컨텍스트 반환 (에러 시)
   */
  private getEmptyContext(reason: 'search_error' | 'no_results'): ProviderContext {
    return {
      type: 'rag',
      data: {
        documents: [],
        totalResults: 0,
      },
      metadata: {
        source: 'supabase-rag',
        confidence: 0,
        cached: false,
        error: reason,
      },
    };
  }
}
