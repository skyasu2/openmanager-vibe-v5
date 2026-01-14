/**
 * 📊 Vector Stats Service
 *
 * PostgreSQL + pgvector 기반 벡터 DB 통계 및 벤치마크 전담 서비스
 * PostgresVectorDB에서 분리된 통계 관련 로직
 *
 * @version 5.88.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';

export class VectorStatsService {
  private tableName = 'command_vectors';
  private dimension = 384;

  constructor(
    private supabase: SupabaseClient | null,
    tableName?: string
  ) {
    if (tableName) this.tableName = tableName;
  }

  /**
   * 📈 카테고리별 통계
   */
  async getCategoryStats(): Promise<
    { category: string; document_count: number }[]
  > {
    try {
      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('metadata')
        .not('metadata->category', 'is', null);

      if (error) {
        logger.error('카테고리 통계 조회 오류:', error);
        return [];
      }

      // 클라이언트 사이드에서 집계
      const categoryCount: Record<string, number> = {};
      data?.forEach((row) => {
        const category = row.metadata?.category;
        if (category) {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });

      return Object.entries(categoryCount)
        .map(([category, document_count]) => ({ category, document_count }))
        .sort((a, b) => b.document_count - a.document_count);
    } catch (error) {
      logger.error('❌ 카테고리 통계 조회 실패:', error);
      return [];
    }
  }

  /**
   * 📊 전체 통계 조회
   */
  async getStats(): Promise<{
    total_documents: number;
    total_categories: number;
    avg_content_length: number;
    last_updated: string;
  }> {
    try {
      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await this.supabase
        .from('vector_documents_stats')
        .select('*')
        .single();

      if (error) {
        logger.error('통계 조회 오류:', error);
        return {
          total_documents: 0,
          total_categories: 0,
          avg_content_length: 0,
          last_updated: new Date().toISOString(),
        };
      }

      return (
        data || {
          total_documents: 0,
          total_categories: 0,
          avg_content_length: 0,
          last_updated: new Date().toISOString(),
        }
      );
    } catch (error) {
      logger.error('❌ 통계 조회 실패:', error);
      return {
        total_documents: 0,
        total_categories: 0,
        avg_content_length: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }

  /**
   * 🚀 검색 성능 벤치마크
   */
  async benchmarkSearch(
    queryEmbedding: number[],
    iterations: number = 10
  ): Promise<{
    nativeAvgTime: number;
    fallbackAvgTime: number;
    speedup: number;
  }> {
    // 임베딩 차원 검증
    if (queryEmbedding.length !== this.dimension) {
      logger.error(
        `임베딩 차원 오류: 예상 ${this.dimension}, 실제 ${queryEmbedding.length}`
      );
      throw new Error(
        `임베딩 차원이 일치하지 않습니다. 예상: ${this.dimension}, 실제: ${queryEmbedding.length}`
      );
    }

    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // 네이티브 pgvector 검색 벤치마크
    const nativeTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const { error } = await this.supabase.rpc('search_similar_vectors', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.3,
        max_results: 10,
      });

      if (error) {
        logger.error('네이티브 검색 오류:', error);
      }
      nativeTimes.push(Date.now() - start);
    }

    // 폴백 (클라이언트 사이드) 검색 벤치마크
    const fallbackTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      // 간단한 폴백 시뮬레이션 - 전체 조회 후 필터링
      const { data } = await this.supabase
        .from(this.tableName)
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(100);

      // 유사도 계산 시뮬레이션
      if (data) {
        data.forEach(() => {
          // 코사인 유사도 계산 시간 시뮬레이션
        });
      }
      fallbackTimes.push(Date.now() - start);
    }

    const nativeAvg = nativeTimes.reduce((a, b) => a + b) / nativeTimes.length;
    const fallbackAvg =
      fallbackTimes.reduce((a, b) => a + b) / fallbackTimes.length;

    return {
      nativeAvgTime: Math.round(nativeAvg),
      fallbackAvgTime: Math.round(fallbackAvg),
      speedup: Math.round((fallbackAvg / nativeAvg) * 10) / 10,
    };
  }
}
