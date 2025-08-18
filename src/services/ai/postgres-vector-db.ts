/**
 * 🗄️ PostgreSQL + pgvector 기반 실제 벡터 DB 구현
 *
 * ✅ Supabase PostgreSQL 기반
 * ✅ pgvector 확장 활용 (384차원 최적화)
 * ✅ 코사인 유사도 검색
 * ✅ 메타데이터 필터링
 * ✅ 하이브리드 검색 (벡터 + 텍스트)
 */

import { supabase } from '@/lib/supabase';

interface DocumentMetadata {
  category?: string;
  title?: string;
  tags?: string[];
  source?: string;
  author?: string;
  timestamp?: string;
  priority?: number;
  version?: string;
  [key: string]: unknown;
}

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: DocumentMetadata;
  created_at?: string;
  updated_at?: string;
}

interface SearchResult {
  id: string;
  content: string;
  metadata?: DocumentMetadata;
  similarity: number;
}

interface MetadataFilter {
  category?: string;
  title?: string;
  tags?: string[];
  source?: string;
  author?: string;
  priority?: number;
  [key: string]: unknown;
}

interface SearchOptions {
  topK?: number;
  threshold?: number;
  metadata_filter?: MetadataFilter;
  category?: string;
}

interface HybridSearchResult extends SearchResult {
  vector_similarity: number;
  text_rank: number;
  combined_score: number;
}

export class PostgresVectorDB {
  private tableName = 'command_vectors';
  private isInitialized = false;
  private dimension = 384; // 최적화된 차원

  constructor() {
    this._initialize();
  }

  /**
   * 🧮 코사인 유사도 계산 (폴백용 - 네이티브 함수 실패 시에만 사용)
   * @deprecated pgvector 네이티브 함수 사용 권장
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('벡터 차원이 일치하지 않습니다');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * 🚀 pgvector 확장 및 테이블 초기화
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 테이블 존재 여부 확인
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (!error) {
        this.isInitialized = true;
        console.log('✅ PostgresVectorDB 초기화 완료');
      } else {
        console.error('⚠️ PostgresVectorDB 초기화 경고:', error.message);
        // 테이블이 없을 수 있으므로 계속 진행
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('❌ PostgresVectorDB 초기화 실패:', error);
      // 초기화 실패해도 계속 진행 (폴백 처리)
      this.isInitialized = true;
    }
  }

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

      // 임베딩 차원 검증
      if (embedding.length !== this.dimension) {
        throw new Error(
          `임베딩 차원이 일치하지 않습니다. 예상: ${this.dimension}, 실제: ${embedding.length}`
        );
      }

      // command_vectors 테이블에 직접 upsert
      const { error } = await supabase.from(this.tableName).upsert({
        id,
        content,
        embedding,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('문서 저장 오류:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ 문서 저장 완료: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('❌ 문서 저장 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 🔍 코사인 유사도 기반 벡터 검색 (pgvector 네이티브)
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      await this._initialize();

      const {
        topK = 10,
        threshold = 0.3,
        metadata_filter = {},
        category,
      } = options;

      // pgvector 네이티브 함수 사용
      if (category) {
        // 카테고리별 검색
        const { data, error } = await supabase.rpc(
          'search_vectors_by_category',
          {
            query_embedding: queryEmbedding,
            category: category,
            similarity_threshold: threshold,
            max_results: topK,
          }
        );

        if (error) {
          console.error('카테고리별 벡터 검색 오류:', error);
          // 폴백: 클라이언트 사이드 검색
          return this.fallbackSearch(queryEmbedding, options);
        }

        return data || [];
      } else {
        // 일반 검색
        const { data, error } = await supabase.rpc('search_similar_vectors', {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          max_results: topK,
        });

        if (error) {
          console.error('벡터 검색 오류:', error);
          // 폴백: 클라이언트 사이드 검색
          return this.fallbackSearch(queryEmbedding, options);
        }

        // 메타데이터 필터가 있는 경우 클라이언트 사이드에서 추가 필터링
        if (Object.keys(metadata_filter).length > 0) {
          return (data || []).filter((item: SearchResult) => {
            return Object.entries(metadata_filter).every(([key, value]) => {
              return item.metadata && item.metadata[key] === value;
            });
          });
        }

        return data || [];
      }
    } catch (error) {
      console.error('❌ 벡터 검색 실패:', error);
      // 폴백: 클라이언트 사이드 검색
      return this.fallbackSearch(queryEmbedding, options);
    }
  }

  /**
   * 🔄 폴백 검색 (클라이언트 사이드)
   */
  private async fallbackSearch(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    console.warn(
      '⚠️ pgvector 네이티브 함수 실패, 클라이언트 사이드 검색으로 폴백'
    );

    const {
      topK = 10,
      threshold = 0.3,
      metadata_filter = {},
      category,
    } = options;

    let query = supabase
      .from(this.tableName)
      .select('id, content, metadata, embedding')
      .not('embedding', 'is', null);

    if (category) {
      query = query.eq('metadata->category', category);
    }

    if (Object.keys(metadata_filter).length > 0) {
      query = query.contains('metadata', metadata_filter);
    }

    const { data, error } = await query.limit(100);

    if (error || !data || data.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const row of data) {
      if (!row.embedding) {
        console.warn(`문서 ${row.id}에 임베딩이 없습니다`);
        continue;
      }

      // pgvector 타입을 배열로 변환 (Supabase는 vector를 문자열로 반환할 수 있음)
      let embeddingArray: number[];
      if (typeof row.embedding === 'string') {
        // "[0.1,0.2,0.3]" 형태의 문자열을 배열로 변환
        try {
          embeddingArray = JSON.parse(row.embedding);
        } catch (e) {
          console.error(`임베딩 파싱 오류 (${row.id}):`, e);
          continue;
        }
      } else if (Array.isArray(row.embedding)) {
        embeddingArray = row.embedding;
      } else {
        console.warn(
          `알 수 없는 임베딩 형식 (${row.id}):`,
          typeof row.embedding
        );
        continue;
      }

      try {
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          embeddingArray
        );

        if (similarity > threshold) {
          results.push({
            id: row.id,
            content: row.content,
            metadata: row.metadata || {},
            similarity,
          });
        }
      } catch (e) {
        console.error(`유사도 계산 오류 (${row.id}):`, e);
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  /**
   * 🔄 하이브리드 검색 (벡터 + 텍스트) - pgvector 네이티브
   */
  async hybridSearch(
    queryEmbedding: number[],
    textQuery: string,
    topK: number = 10
  ): Promise<HybridSearchResult[]> {
    try {
      await this._initialize();

      // pgvector 네이티브 하이브리드 검색 함수 사용
      const { data, error } = await supabase.rpc('hybrid_search_vectors', {
        query_embedding: queryEmbedding,
        text_query: textQuery,
        similarity_threshold: 0.3,
        max_results: topK,
      });

      if (error) {
        console.error('하이브리드 검색 오류:', error);
        // 폴백: 벡터 검색만 수행
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
      console.error('❌ 하이브리드 검색 실패:', error);
      return [];
    }
  }

  /**
   * 📊 문서 가져오기
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    try {
      await this._initialize();

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('문서 조회 오류:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ 문서 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🗑️ 문서 삭제
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this._initialize();

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('문서 삭제 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ 문서 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 📈 카테고리별 통계
   */
  async getCategoryStats(): Promise<
    { category: string; document_count: number }[]
  > {
    try {
      await this._initialize();

      // 직접 카테고리별 count 수행
      const { data, error } = await supabase
        .from(this.tableName)
        .select('metadata')
        .not('metadata->category', 'is', null);

      if (error) {
        console.error('카테고리 통계 조회 오류:', error);
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
      console.error('❌ 카테고리 통계 조회 실패:', error);
      return [];
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

    console.log(`📊 대량 업로드 완료: 성공 ${success}개, 실패 ${failed}개`);
    return { success, failed };
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
      await this._initialize();

      const { data, error } = await supabase
        .from('vector_documents_stats')
        .select('*')
        .single();

      if (error) {
        console.error('통계 조회 오류:', error);
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
      console.error('❌ 통계 조회 실패:', error);
      return {
        total_documents: 0,
        total_categories: 0,
        avg_content_length: 0,
        last_updated: new Date().toISOString(),
      };
    }
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

      const { error } = await supabase
        .from(this.tableName)
        .update({ metadata, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('메타데이터 업데이트 오류:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ 메타데이터 업데이트 실패:', error);
      return false;
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
      console.error(
        `임베딩 차원 오류: 예상 ${this.dimension}, 실제 ${queryEmbedding.length}`
      );
      throw new Error(
        `임베딩 차원이 일치하지 않습니다. 예상: ${this.dimension}, 실제: ${queryEmbedding.length}`
      );
    }

    // 네이티브 pgvector 검색 벤치마크
    const nativeTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const { error } = await supabase.rpc('search_similar_vectors', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.3,
        max_results: 10,
      });

      if (error) {
        console.error('네이티브 검색 오류:', error);
      }
      nativeTimes.push(Date.now() - start);
    }

    // 폴백 (클라이언트 사이드) 검색 벤치마크
    const fallbackTimes: number[] = [];

    // 폴백 검색을 위해 임시로 네이티브 함수를 비활성화
    const originalSearch = this.search.bind(this);
    this.search = this.fallbackSearch.bind(this);

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await this.fallbackSearch(queryEmbedding, { topK: 10 });
      fallbackTimes.push(Date.now() - start);
    }

    // 원래 검색 함수 복원
    this.search = originalSearch;

    const nativeAvg = nativeTimes.reduce((a, b) => a + b) / nativeTimes.length;
    const fallbackAvg =
      fallbackTimes.reduce((a, b) => a + b) / fallbackTimes.length;

    return {
      nativeAvgTime: Math.round(nativeAvg),
      fallbackAvgTime: Math.round(fallbackAvg),
      speedup: Math.round((fallbackAvg / nativeAvg) * 10) / 10,
    };
  }

  /**
   * 🔍 메타데이터로 문서 검색
   */
  async searchByMetadata(
    filter: MetadataFilter,
    limit: number = 10
  ): Promise<VectorDocument[]> {
    try {
      await this._initialize();

      let query = supabase.from(this.tableName).select('*');

      // 메타데이터 필터 적용
      Object.entries(filter).forEach(([key, value]) => {
        query = query.contains('metadata', { [key]: value });
      });

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('메타데이터 검색 오류:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ 메타데이터 검색 실패:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const postgresVectorDB = new PostgresVectorDB();
