/**
 * 🗄️ PostgreSQL + pgvector 기반 실제 벡터 DB 구현
 *
 * ✅ Supabase PostgreSQL 기반
 * ✅ pgvector 확장 활용 (384차원 최적화)
 * ✅ 코사인 유사도 검색
 * ✅ 메타데이터 필터링
 * ✅ 하이브리드 검색 (벡터 + 텍스트)
 *
 * @refactored 5.88.0 - 검색/통계 서비스 분리
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
import { VectorSearchService } from './VectorSearchService';
import { VectorStatsService } from './VectorStatsService';

export class PostgresVectorDB {
  private tableName = 'command_vectors';
  private isInitialized = false;
  private dimension = 384;
  private supabase: SupabaseClient | null = null;

  // 분리된 서비스들
  private searchService: VectorSearchService;
  private statsService: VectorStatsService;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || null;
    this.searchService = new VectorSearchService(this.supabase, this.tableName);
    this.statsService = new VectorStatsService(this.supabase, this.tableName);

    if (this.supabase) {
      void this._initialize();
    }
  }

  /**
   * 🚀 pgvector 확장 및 테이블 초기화
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.supabase) {
      logger.warn(
        '⚠️ PostgresVectorDB: Supabase client not provided, skipping initialization'
      );
      return;
    }

    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (!error) {
        this.isInitialized = true;
        logger.info('✅ PostgresVectorDB 초기화 완료');
      } else {
        logger.error('⚠️ PostgresVectorDB 초기화 경고:', error.message);
        this.isInitialized = true;
      }
    } catch (error) {
      logger.error('❌ PostgresVectorDB 초기화 실패:', error);
      this.isInitialized = true;
    }
  }

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  /**
   * 📄 문서와 벡터 저장
   */
  async store(
    id: string,
    content: string,
    embedding: number[],
    metadata?: DocumentMetadata
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this._initialize();

      if (embedding.length !== this.dimension) {
        throw new Error(
          `임베딩 차원이 일치하지 않습니다. 예상: ${this.dimension}, 실제: ${embedding.length}`
        );
      }

      if (!this.supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { error } = await this.supabase.from(this.tableName).upsert({
        id,
        content,
        embedding,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      });

      if (error) {
        logger.error('문서 저장 오류:', error);
        return { success: false, error: error.message };
      }

      logger.info(`✅ 문서 저장 완료: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('❌ 문서 저장 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 📊 문서 가져오기
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    try {
      await this._initialize();

      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('문서 조회 오류:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('❌ 문서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🗑️ 문서 삭제
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this._initialize();

      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('문서 삭제 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ 문서 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 대량 문서 업로드
   */
  async bulkStore(
    documents: Array<{
      id: string;
      content: string;
      embedding: number[];
      metadata?: DocumentMetadata;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const doc of documents) {
      const result = await this.store(
        doc.id,
        doc.content,
        doc.embedding,
        doc.metadata
      );

      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    logger.info(`📊 대량 업로드 완료: 성공 ${success}개, 실패 ${failed}개`);
    return { success, failed };
  }

  /**
   * 🧹 메타데이터 업데이트
   */
  async updateMetadata(
    id: string,
    metadata: DocumentMetadata
  ): Promise<boolean> {
    try {
      await this._initialize();

      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { error } = await this.supabase
        .from(this.tableName)
        .update({ metadata, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error('메타데이터 업데이트 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ 메타데이터 업데이트 실패:', error);
      return false;
    }
  }

  // =============================================================================
  // Search Operations (Delegated to VectorSearchService)
  // =============================================================================

  /**
   * 🔍 코사인 유사도 기반 벡터 검색
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    await this._initialize();
    return this.searchService.search(queryEmbedding, options);
  }

  /**
   * 🔄 하이브리드 검색 (벡터 + 텍스트)
   */
  async hybridSearch(
    queryEmbedding: number[],
    textQuery: string,
    topK: number = 10
  ): Promise<HybridSearchResult[]> {
    await this._initialize();
    return this.searchService.hybridSearch(queryEmbedding, textQuery, topK);
  }

  /**
   * 🔤 키워드 기반 검색
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
    await this._initialize();
    return this.searchService.searchByKeywords(keywords, options);
  }

  /**
   * 🔍 메타데이터로 문서 검색
   */
  async searchByMetadata(
    filter: MetadataFilter,
    limit: number = 10
  ): Promise<VectorDocument[]> {
    await this._initialize();
    return this.searchService.searchByMetadata(filter, limit);
  }

  // =============================================================================
  // Stats Operations (Delegated to VectorStatsService)
  // =============================================================================

  /**
   * 📈 카테고리별 통계
   */
  async getCategoryStats(): Promise<
    { category: string; document_count: number }[]
  > {
    await this._initialize();
    return this.statsService.getCategoryStats();
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
    await this._initialize();
    return this.statsService.getStats();
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
    await this._initialize();
    return this.statsService.benchmarkSearch(queryEmbedding, iterations);
  }
}

// 싱글톤 인스턴스
export const postgresVectorDB = new PostgresVectorDB();
