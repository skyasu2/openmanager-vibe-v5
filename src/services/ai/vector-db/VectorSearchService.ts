/**
 * 🔍 Vector Search Service
 *
 * PostgreSQL + pgvector 기반 벡터 검색 전담 서비스
 * PostgresVectorDB에서 분리된 검색 관련 로직
 *
 * @version 5.88.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import type {
  DocumentMetadata,
  HybridSearchResult,
  MetadataFilter,
  SearchOptions,
  SearchResult,
  VectorDocument,
} from './types';

export class VectorSearchService {
  private tableName = 'command_vectors';
  private dimension = 384;

  constructor(
    private supabase: SupabaseClient | null,
    tableName?: string
  ) {
    if (tableName) this.tableName = tableName;
  }

  /**
   * 🧮 코사인 유사도 계산 (폴백용)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('벡터 차원이 일치하지 않습니다');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i] ?? 0;
      const b = vecB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 🔍 코사인 유사도 기반 벡터 검색 (pgvector 네이티브)
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const {
        topK = 10,
        threshold = 0.3,
        metadata_filter = {},
        category,
      } = options;

      if (category) {
        const { data, error } = (await this.supabase?.rpc(
          'search_vectors_by_category',
          {
            max_results: topK,
            query_embedding: queryEmbedding,
            search_category: category,
            similarity_threshold: threshold,
          }
        )) ?? { data: null, error: new Error('No client') };

        if (error) {
          logger.error('카테고리별 벡터 검색 오류:', error);
          return this.fallbackSearch(queryEmbedding, options);
        }
        return data || [];
      }

      const { data, error } = (await this.supabase?.rpc(
        'search_similar_vectors',
        {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          max_results: topK,
        }
      )) ?? { data: null, error: new Error('No client') };

      if (error) {
        logger.error('벡터 검색 오류:', error);
        return this.fallbackSearch(queryEmbedding, options);
      }

      if (Object.keys(metadata_filter).length > 0) {
        return (data || []).filter((item: SearchResult) => {
          return Object.entries(metadata_filter).every(([key, value]) => {
            return item.metadata && item.metadata[key] === value;
          });
        });
      }

      return data || [];
    } catch (error) {
      logger.error('❌ 벡터 검색 실패:', error);
      return this.fallbackSearch(queryEmbedding, options);
    }
  }

  /**
   * 🔄 폴백 검색 (클라이언트 사이드) - 2단계 최적화
   */
  private async fallbackSearch(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    logger.warn('⚠️ pgvector 네이티브 함수 실패, 2단계 최적화 폴백 검색 시작');

    const {
      topK = 10,
      threshold = 0.3,
      metadata_filter = {},
      category,
    } = options;

    try {
      if (!this.supabase) throw new Error('Supabase client not initialized');

      // 1단계: ID + 임베딩만 조회
      let embedQuery = this.supabase
        .from(this.tableName)
        .select('id, embedding')
        .not('embedding', 'is', null);

      if (category) {
        embedQuery = embedQuery.eq('metadata->category', category);
      }
      if (Object.keys(metadata_filter).length > 0) {
        embedQuery = embedQuery.contains('metadata', metadata_filter);
      }

      const { data: embedData, error: embedError } =
        await embedQuery.limit(100);

      if (embedError || !embedData || embedData.length === 0) {
        logger.error('1단계 조회 실패:', embedError?.message);
        return [];
      }

      // 클라이언트 사이드 유사도 계산
      const candidatesWithSimilarity: Array<{
        id: string;
        similarity: number;
      }> = [];

      for (const row of embedData) {
        if (!row.embedding) continue;

        let embeddingArray: number[];
        try {
          if (typeof row.embedding === 'string') {
            embeddingArray = JSON.parse(row.embedding);
          } else if (Array.isArray(row.embedding)) {
            embeddingArray = row.embedding;
          } else {
            continue;
          }

          const similarity = this.cosineSimilarity(
            queryEmbedding,
            embeddingArray
          );
          if (similarity > threshold) {
            candidatesWithSimilarity.push({ id: row.id, similarity });
          }
        } catch (e) {
          logger.error(`임베딩 처리 오류 (${row.id}):`, e);
        }
      }

      const topCandidates = candidatesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      if (topCandidates.length === 0) return [];

      // 2단계: 상위 K개에 대해서만 content + metadata 조회
      const selectedIds = topCandidates.map((c) => c.id);
      const { data: contentData, error: contentError } = await this.supabase
        .from(this.tableName)
        .select('id, content, metadata')
        .in('id', selectedIds);

      if (contentError || !contentData) return [];

      const results: SearchResult[] = [];
      for (const candidate of topCandidates) {
        const contentDoc = contentData.find((doc) => doc.id === candidate.id);
        if (contentDoc) {
          results.push({
            id: candidate.id,
            content: contentDoc.content,
            metadata: contentDoc.metadata || {},
            similarity: candidate.similarity,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('❌ 폴백 검색 전체 실패:', error);
      return [];
    }
  }

  /**
   * 🔄 하이브리드 검색 (벡터 + 텍스트)
   */
  async hybridSearch(
    queryEmbedding: number[],
    textQuery: string,
    topK: number = 10
  ): Promise<HybridSearchResult[]> {
    try {
      const { data, error } = (await this.supabase?.rpc(
        'hybrid_search_vectors',
        {
          query_embedding: queryEmbedding,
          text_query: textQuery,
          similarity_threshold: 0.3,
          max_results: topK,
        }
      )) ?? { data: null, error: new Error('No client') };

      if (error) {
        logger.error('하이브리드 검색 오류:', error);
        const vectorResults = await this.search(queryEmbedding, { topK });
        return vectorResults.map((result) => ({
          ...result,
          vector_similarity: result.similarity,
          text_rank: 0,
          combined_score: result.similarity,
        }));
      }

      return data || [];
    } catch (error) {
      logger.error('❌ 하이브리드 검색 실패:', error);
      return [];
    }
  }

  /**
   * 🔤 키워드 기반 검색 (PostgreSQL Full-Text Search)
   */
  async searchByKeywords(
    keywords: string[],
    options: { limit?: number; category?: string } = {}
  ): Promise<
    Array<{
      id: string;
      content: string;
      metadata?: DocumentMetadata;
      score?: number;
    }>
  > {
    try {
      const { limit = 5, category } = options;
      if (keywords.length === 0) return [];

      const tsquery = keywords
        .map((keyword) => keyword.replace(/[^\w가-힣]/g, ''))
        .join(' | ');

      if (!this.supabase) throw new Error('Supabase client not initialized');

      let query = this.supabase
        .from(this.tableName)
        .select('id, content, metadata')
        .textSearch('content', tsquery, { type: 'websearch' })
        .limit(limit);

      if (category) {
        query = query.eq('metadata->category', category);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return this.fallbackKeywordSearch(keywords, options);
      }

      return data.map((row, index) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        score: 0.8 - index * 0.1,
      }));
    } catch (error) {
      logger.error('❌ 키워드 검색 실패:', error);
      return this.fallbackKeywordSearch(keywords, options);
    }
  }

  /**
   * 🔤 키워드 검색 폴백 (ILIKE 연산자)
   */
  private async fallbackKeywordSearch(
    keywords: string[],
    options: { limit?: number; category?: string } = {}
  ): Promise<
    Array<{
      id: string;
      content: string;
      metadata?: DocumentMetadata;
      score?: number;
    }>
  > {
    try {
      const { limit = 5, category } = options;
      if (!this.supabase) return [];

      let query = this.supabase
        .from(this.tableName)
        .select('id, content, metadata');

      if (keywords.length > 0) {
        const conditions = keywords.map(
          (keyword) => `content.ilike.%${keyword}%`
        );
        query = query.or(conditions.join(','));
      }

      if (category) {
        query = query.eq('metadata->category', category);
      }

      const { data, error } = await query.limit(limit);

      if (error || !data) return [];

      return data
        .map((row) => {
          const content = (row.content || '').toLowerCase();
          const matchCount = keywords.filter((keyword) =>
            content.includes(keyword.toLowerCase())
          ).length;

          return {
            id: row.id,
            content: row.content,
            metadata: row.metadata,
            score: 0.5 + (matchCount / keywords.length) * 0.3,
          };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (error) {
      logger.error('❌ 폴백 키워드 검색 실패:', error);
      return [];
    }
  }

  /**
   * 🔍 메타데이터로 문서 검색
   */
  async searchByMetadata(
    filter: MetadataFilter,
    limit: number = 10
  ): Promise<VectorDocument[]> {
    try {
      if (!this.supabase) return [];

      let query = this.supabase.from(this.tableName).select('*');

      Object.entries(filter).forEach(([key, value]) => {
        query = query.contains('metadata', { [key]: value });
      });

      const { data, error } = await query.limit(limit);

      if (error) {
        logger.error('메타데이터 검색 오류:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('❌ 메타데이터 검색 실패:', error);
      return [];
    }
  }
}
