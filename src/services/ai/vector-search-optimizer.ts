/**
 * 🚀 벡터 검색 최적화 서비스
 * 
 * Supabase pgvector 검색 성능 최적화
 * - IVFFlat 인덱스 생성 및 관리
 * - 카테고리별 파티셔닝
 * - 검색 쿼리 최적화
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { aiLogger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

interface IndexInfo {
  name: string;
  type: string;
  table: string;
  column: string;
  created: boolean;
}

interface OptimizationResult {
  success: boolean;
  indexesCreated: number;
  partitionsCreated: number;
  functionsOptimized: number;
  errors: string[];
}

export class VectorSearchOptimizer {
  private supabase: SupabaseClient;
  private indexes: Map<string, IndexInfo> = new Map();

  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * 전체 벡터 검색 최적화 실행
   */
  async optimizeVectorSearch(): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      success: true,
      indexesCreated: 0,
      partitionsCreated: 0,
      functionsOptimized: 0,
      errors: []
    };

    try {
      aiLogger.info('벡터 검색 최적화 시작');

      // 1. 인덱스 최적화
      const indexResult = await this.createOptimizedIndexes();
      result.indexesCreated = indexResult.created;
      if (indexResult.errors.length > 0) {
        result.errors.push(...indexResult.errors);
      }

      // 2. 파티셔닝 전략 (주석 처리 - 복잡도가 높아 단계적 적용 필요)
      // const partitionResult = await this.implementPartitioning();
      // result.partitionsCreated = partitionResult.created;

      // 3. 검색 함수 최적화
      const functionResult = await this.optimizeSearchFunctions();
      result.functionsOptimized = functionResult.optimized;
      if (functionResult.errors.length > 0) {
        result.errors.push(...functionResult.errors);
      }

      // 4. 통계 업데이트
      await this.updateStatistics();

      aiLogger.info('벡터 검색 최적화 완료', result);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      aiLogger.error('벡터 검색 최적화 실패', error);
    }

    return result;
  }

  /**
   * 최적화된 인덱스 생성
   */
  private async createOptimizedIndexes(): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    try {
      // 1. 기본 벡터 인덱스 확인 및 생성
      const checkIndexSQL = `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'command_vectors' 
        AND indexname LIKE '%embedding%';
      `;

      const { data: existingIndexes, error: checkError } = await this.supabase
        .rpc('execute_query', { query: checkIndexSQL });

      if (checkError) {
        errors.push(`인덱스 확인 실패: ${checkError.message}`);
        return { created, errors };
      }

      // 2. IVFFlat 인덱스가 없으면 생성
      const hasIVFFlat = existingIndexes?.some((idx: any) => 
        idx.indexname.includes('ivfflat')
      );

      if (!hasIVFFlat) {
        // pgvector 확장 확인
        const checkExtensionSQL = `
          SELECT * FROM pg_extension WHERE extname = 'vector';
        `;
        
        const { data: extensionData } = await this.supabase
          .rpc('execute_query', { query: checkExtensionSQL });

        if (!extensionData || extensionData.length === 0) {
          errors.push('pgvector 확장이 설치되지 않았습니다');
          return { created, errors };
        }

        // IVFFlat 인덱스 생성
        const createIVFIndexSQL = `
          CREATE INDEX IF NOT EXISTS embedding_ivfflat_idx 
          ON command_vectors 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100);
        `;

        const { error: createError } = await this.supabase
          .rpc('execute_sql', { query: createIVFIndexSQL });

        if (createError) {
          errors.push(`IVFFlat 인덱스 생성 실패: ${createError.message}`);
        } else {
          created++;
          aiLogger.info('IVFFlat 인덱스 생성 완료');
        }
      }

      // 3. 카테고리별 부분 인덱스 생성
      const categories = ['system', 'user', 'admin', 'monitoring'];
      
      for (const category of categories) {
        const indexName = `idx_${category}_embeddings`;
        const checkCategoryIndexSQL = `
          SELECT 1 FROM pg_indexes 
          WHERE indexname = '${indexName}';
        `;

        const { data: hasIndex } = await this.supabase
          .rpc('execute_query', { query: checkCategoryIndexSQL });

        if (!hasIndex || hasIndex.length === 0) {
          const createCategoryIndexSQL = `
            CREATE INDEX ${indexName}
            ON command_vectors (embedding)
            WHERE category = '${category}';
          `;

          const { error: categoryError } = await this.supabase
            .rpc('execute_sql', { query: createCategoryIndexSQL });

          if (categoryError) {
            errors.push(`${category} 카테고리 인덱스 생성 실패: ${categoryError.message}`);
          } else {
            created++;
            aiLogger.info(`${category} 카테고리 인덱스 생성 완료`);
          }
        }
      }

      // 4. 메타데이터 인덱스 (JSON 필드)
      const createMetadataIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_metadata_gin
        ON command_vectors USING gin (metadata);
      `;

      const { error: metadataError } = await this.supabase
        .rpc('execute_sql', { query: createMetadataIndexSQL });

      if (!metadataError) {
        created++;
      }

    } catch (error) {
      errors.push(`인덱스 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { created, errors };
  }

  /**
   * 검색 함수 최적화
   */
  private async optimizeSearchFunctions(): Promise<{ optimized: number; errors: string[] }> {
    let optimized = 0;
    const errors: string[] = [];

    try {
      // 최적화된 검색 함수 생성
      const optimizedSearchFunction = `
        CREATE OR REPLACE FUNCTION search_vectors_optimized(
          query_embedding vector(384),
          match_threshold float DEFAULT 0.5,
          match_count int DEFAULT 5,
          search_category text DEFAULT NULL
        )
        RETURNS TABLE (
          id uuid,
          content text,
          similarity float,
          metadata jsonb,
          category text
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          -- IVFFlat 검색을 위한 프로브 수 설정
          -- 값이 높을수록 정확도 증가, 속도 감소
          SET LOCAL ivfflat.probes = 10;
          
          -- 카테고리별 검색
          IF search_category IS NOT NULL THEN
            RETURN QUERY
            SELECT 
              cv.id,
              cv.content,
              1 - (cv.embedding <=> query_embedding) as similarity,
              cv.metadata,
              cv.category
            FROM command_vectors cv
            WHERE 
              cv.category = search_category
              AND 1 - (cv.embedding <=> query_embedding) > match_threshold
            ORDER BY cv.embedding <=> query_embedding
            LIMIT match_count;
          ELSE
            -- 전체 검색
            RETURN QUERY
            SELECT 
              cv.id,
              cv.content,
              1 - (cv.embedding <=> query_embedding) as similarity,
              cv.metadata,
              cv.category
            FROM command_vectors cv
            WHERE 
              1 - (cv.embedding <=> query_embedding) > match_threshold
            ORDER BY cv.embedding <=> query_embedding
            LIMIT match_count;
          END IF;
        END;
        $$;
      `;

      const { error: functionError } = await this.supabase
        .rpc('execute_sql', { query: optimizedSearchFunction });

      if (functionError) {
        errors.push(`검색 함수 최적화 실패: ${functionError.message}`);
      } else {
        optimized++;
        aiLogger.info('검색 함수 최적화 완료');
      }

      // 배치 검색 함수
      const batchSearchFunction = `
        CREATE OR REPLACE FUNCTION batch_search_vectors(
          query_embeddings vector(384)[],
          match_threshold float DEFAULT 0.5,
          match_count int DEFAULT 5
        )
        RETURNS TABLE (
          query_index int,
          id uuid,
          content text,
          similarity float,
          metadata jsonb
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
          i int;
        BEGIN
          FOR i IN 1..array_length(query_embeddings, 1) LOOP
            RETURN QUERY
            SELECT 
              i as query_index,
              cv.id,
              cv.content,
              1 - (cv.embedding <=> query_embeddings[i]) as similarity,
              cv.metadata
            FROM command_vectors cv
            WHERE 
              1 - (cv.embedding <=> query_embeddings[i]) > match_threshold
            ORDER BY cv.embedding <=> query_embeddings[i]
            LIMIT match_count;
          END LOOP;
        END;
        $$;
      `;

      const { error: batchError } = await this.supabase
        .rpc('execute_sql', { query: batchSearchFunction });

      if (!batchError) {
        optimized++;
        aiLogger.info('배치 검색 함수 생성 완료');
      }

    } catch (error) {
      errors.push(`함수 최적화 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { optimized, errors };
  }

  /**
   * 테이블 통계 업데이트
   */
  private async updateStatistics(): Promise<void> {
    try {
      const updateStatsSQL = `
        ANALYZE command_vectors;
      `;

      await this.supabase.rpc('execute_sql', { query: updateStatsSQL });
      aiLogger.info('테이블 통계 업데이트 완료');
    } catch (error) {
      aiLogger.error('통계 업데이트 실패', error);
    }
  }

  /**
   * 검색 성능 벤치마크
   */
  async benchmarkSearch(sampleSize: number = 10): Promise<{
    avgSearchTime: number;
    minSearchTime: number;
    maxSearchTime: number;
    successRate: number;
  }> {
    const results: number[] = [];
    let successCount = 0;

    try {
      // 샘플 쿼리 생성
      for (let i = 0; i < sampleSize; i++) {
        const startTime = Date.now();
        
        // 더미 임베딩 생성 (실제로는 실제 임베딩 사용)
        const dummyEmbedding = new Array(384).fill(0).map(() => Math.random() * 2 - 1);
        
        const { error } = await this.supabase
          .rpc('search_vectors_optimized', {
            query_embedding: dummyEmbedding,
            match_threshold: 0.5,
            match_count: 5
          });

        const searchTime = Date.now() - startTime;
        
        if (!error) {
          results.push(searchTime);
          successCount++;
        }
      }

      if (results.length === 0) {
        return {
          avgSearchTime: 0,
          minSearchTime: 0,
          maxSearchTime: 0,
          successRate: 0
        };
      }

      return {
        avgSearchTime: results.reduce((a, b) => a + b, 0) / results.length,
        minSearchTime: Math.min(...results),
        maxSearchTime: Math.max(...results),
        successRate: successCount / sampleSize
      };
    } catch (error) {
      aiLogger.error('벤치마크 실행 실패', error);
      return {
        avgSearchTime: 0,
        minSearchTime: 0,
        maxSearchTime: 0,
        successRate: 0
      };
    }
  }

  /**
   * 인덱스 상태 확인
   */
  async getIndexStatus(): Promise<Array<{
    indexName: string;
    tableName: string;
    indexType: string;
    size: string;
  }>> {
    try {
      const indexStatusSQL = `
        SELECT 
          i.indexname as "indexName",
          i.tablename as "tableName",
          am.amname as "indexType",
          pg_size_pretty(pg_relation_size(i.indexname::regclass)) as size
        FROM pg_indexes i
        JOIN pg_class c ON c.relname = i.indexname
        JOIN pg_am am ON c.relam = am.oid
        WHERE i.tablename = 'command_vectors'
        ORDER BY pg_relation_size(i.indexname::regclass) DESC;
      `;

      const { data, error } = await this.supabase
        .rpc('execute_query', { query: indexStatusSQL });

      if (error) {
        aiLogger.error('인덱스 상태 조회 실패', error);
        return [];
      }

      return data || [];
    } catch (error) {
      aiLogger.error('인덱스 상태 확인 중 오류', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
let optimizerInstance: VectorSearchOptimizer | null = null;

export function getVectorSearchOptimizer(): VectorSearchOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new VectorSearchOptimizer();
  }
  return optimizerInstance;
}