/**
 * 벡터 인덱싱 서비스 - 문서 임베딩 생성 및 관리
 *
 * 무료 티어 최적화:
 * - 작은 배치 크기 (10개)
 * - 레이트 리미팅 (1초 딜레이)
 * - 선택적 인덱싱
 * - 자동 정리 기능
 */

import { supabaseAdmin } from '@/lib/supabase-server';
// import { performanceMonitor } from '@/lib/monitoring/performance'; // TODO: performance monitoring 모듈 구현 필요
import { embeddingService } from '../embedding-service';
import { aiLogger } from '@/lib/logger';
// import type { Incident } from '@/types/ai-types'; // TODO: incident 타입 정의 필요

interface IndexingOptions {
  batchSize?: number;
  dimension?: number;
  model?: string;
  category?: string;
}

interface IndexingResult {
  indexed: number;
  failed: number;
  errors: string[];
}

interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  category?: string;
}

export class VectorIndexingService {
  private static instance: VectorIndexingService;
  private readonly DEFAULT_BATCH_SIZE = 10; // 무료 티어용 작은 배치
  private readonly EMBEDDING_DIMENSION = 384;
  private readonly RATE_LIMIT_DELAY = 1000; // 1초 딜레이
  private readonly MIN_CONTENT_LENGTH = 50; // 최소 콘텐츠 길이
  private readonly MAX_CONTENT_LENGTH = 5000; // 최대 콘텐츠 길이

  private constructor() {}

  static getInstance(): VectorIndexingService {
    if (!this.instance) {
      this.instance = new VectorIndexingService();
    }
    return this.instance;
  }

  /**
   * 문서 인덱싱
   */
  async indexDocuments(
    documents: Document[],
    options: IndexingOptions = {}
  ): Promise<IndexingResult> {
    const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
    const dimension = options.dimension || this.EMBEDDING_DIMENSION;
    const supabase = supabaseAdmin;

    let indexed = 0;
    let failed = 0;
    const errors: string[] = [];

    // 유효한 문서만 필터링
    const validDocuments = documents.filter(doc => {
      if (!doc.content || doc.content.trim().length < this.MIN_CONTENT_LENGTH) {
        errors.push(`문서 ${doc.id}: 콘텐츠가 너무 짧습니다`);
        failed++;
        return false;
      }
      if (doc.content.length > this.MAX_CONTENT_LENGTH) {
        doc.content = doc.content.substring(0, this.MAX_CONTENT_LENGTH);
      }
      return true;
    });

    aiLogger.info(`📚 ${validDocuments.length}개 문서 인덱싱 시작`);

    // 배치 처리
    for (let i = 0; i < validDocuments.length; i += batchSize) {
      const batch = validDocuments.slice(i, i + batchSize);

      try {
        // 진행 상황 로깅
        const progress = Math.round((i / validDocuments.length) * 100);
        aiLogger.info(`🔄 인덱싱 진행률: ${progress}%`);

        // 배치 임베딩 생성
        const embeddings = await embeddingService.createBatchEmbeddings(
          batch.map(doc => doc.content),
          { dimension }
        );

        // 데이터베이스에 저장
        for (let j = 0; j < batch.length; j++) {
          const doc = batch[j];
          const embedding = embeddings[j];

          if (embedding && !embedding.every(v => v === 0)) {
            const { error } = await supabase
              .from('knowledge_base')
              .upsert({
                id: doc.id,
                content: doc.content,
                metadata: {
                  ...doc.metadata,
                  indexed_at: new Date().toISOString(),
                  content_length: doc.content.length,
                },
                embedding: embedding,
                category: doc.category || options.category || 'general',
                updated_at: new Date().toISOString(),
              })
              .select();

            if (error) {
              errors.push(`문서 ${doc.id}: ${error.message}`);
              failed++;
            } else {
              indexed++;
            }
          } else {
            errors.push(`문서 ${doc.id}: 임베딩 생성 실패`);
            failed++;
          }
        }

        // 레이트 리미팅
        if (i + batchSize < validDocuments.length) {
          await new Promise(resolve =>
            setTimeout(resolve, this.RATE_LIMIT_DELAY)
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '알 수 없는 오류';
        errors.push(`배치 ${i / batchSize + 1} 처리 실패: ${errorMsg}`);
        failed += batch.length;
        aiLogger.error('배치 인덱싱 오류:', error);
      }
    }

    // 성능 메트릭 기록
    // TODO: performance monitoring 구현 필요
    // performanceMonitor.recordMetric('vector_indexing', {
    //   indexed,
    //   failed,
    //   total: documents.length,
    //   duration: Date.now(),
    // });

    aiLogger.info(`✅ 인덱싱 완료: ${indexed}개 성공, ${failed}개 실패`);

    return { indexed, failed, errors };
  }

  /**
   * 인시던트 임베딩 업데이트
   */
  async updateIncidentEmbeddings(limit = 50): Promise<IndexingResult> {
    const supabase = supabaseAdmin;

    try {
      // 임베딩이 없는 인시던트 조회
      const { data: incidents, error } = await supabase
        .from('incident_reports')
        .select('id, title, description, resolution, severity, category')
        .is('embedding', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      if (!incidents || incidents.length === 0) {
        aiLogger.info('📊 모든 인시던트에 임베딩이 있습니다');
        return { indexed: 0, failed: 0, errors: [] };
      }

      // 문서 형식으로 변환
      const documents: Document[] = incidents.map((incident: unknown) => ({
        id: incident.id,
        content: [
          incident.title || '',
          incident.description || '',
          incident.resolution || '',
          `심각도: ${incident.severity || 'unknown'}`,
          `카테고리: ${incident.category || 'general'}`,
        ]
          .filter(Boolean)
          .join('\n'),
        metadata: {
          type: 'incident',
          severity: incident.severity,
          category: incident.category,
        },
        category: 'incident',
      }));

      // 인덱싱 수행
      const result = await this.indexDocuments(documents, {
        category: 'incident',
      });

      // 인시던트 테이블의 임베딩 업데이트
      for (const doc of documents) {
        if (result.errors.some(err => err.includes(doc.id))) {
          continue;
        }

        // knowledge_base에서 임베딩 가져와서 incident_reports에 복사
        const { data: kbData } = await supabase
          .from('knowledge_base')
          .select('embedding')
          .eq('id', doc.id)
          .single();

        if (kbData?.embedding) {
          await supabase
            .from('incident_reports')
            .update({
              embedding: kbData.embedding,
              embedding_model: 'text-embedding-004',
              embedding_updated_at: new Date().toISOString(),
            })
            .eq('id', doc.id);
        }
      }

      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      aiLogger.error('인시던트 임베딩 업데이트 실패:', error);
      return {
        indexed: 0,
        failed: limit,
        errors: [`전체 실패: ${errorMsg}`],
      };
    }
  }

  /**
   * 임베딩 통계 조회
   */
  async getEmbeddingStats(): Promise<{
    totalDocuments: number;
    documentsWithEmbedding: number;
    coveragePercent: number;
    estimatedSize: string;
    categories: Record<string, number>;
  }> {
    const supabase = supabaseAdmin;

    try {
      // 전체 통계 조회
      const { data: stats, error } = await supabase
        .from('embedding_stats')
        .select('*');

      if (error) throw error;

      // 카테고리별 통계
      const { data: categories } = await supabase
        .from('knowledge_base')
        .select('category')
        .not('embedding', 'is', null);

      const categoryCount: Record<string, number> = {};
      categories?.forEach((item: { category?: string }) => {
        const cat = item.category || 'general';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const totalStats = stats?.reduce(
        (
          acc: { totalDocuments: number; documentsWithEmbedding: number },
          stat: unknown
        ) => ({
          totalDocuments: acc.totalDocuments + (stat.total_records || 0),
          documentsWithEmbedding:
            acc.documentsWithEmbedding + (stat.records_with_embedding || 0),
        }),
        { totalDocuments: 0, documentsWithEmbedding: 0 }
      );

      return {
        totalDocuments: totalStats?.totalDocuments || 0,
        documentsWithEmbedding: totalStats?.documentsWithEmbedding || 0,
        coveragePercent: totalStats?.totalDocuments
          ? Math.round(
              (totalStats.documentsWithEmbedding / totalStats.totalDocuments) *
                100
            )
          : 0,
        estimatedSize: stats?.[0]?.estimated_embedding_size || '0 MB',
        categories: categoryCount,
      };
    } catch (error) {
      aiLogger.error('통계 조회 실패:', error);
      return {
        totalDocuments: 0,
        documentsWithEmbedding: 0,
        coveragePercent: 0,
        estimatedSize: '0 MB',
        categories: {},
      };
    }
  }

  /**
   * 오래된 임베딩 정리 (무료 티어 최적화)
   */
  async cleanupOldEmbeddings(): Promise<{ cleaned: number }> {
    const supabase = supabaseAdmin;

    try {
      const { data, error } = await supabase.rpc('cleanup_old_embeddings');

      if (error) throw error;

      aiLogger.info('🧹 오래된 임베딩 정리 완료');

      // 통계 갱신
      const stats = await this.getEmbeddingStats();
      aiLogger.info(`📊 현재 커버리지: ${stats.coveragePercent}%`);

      return { cleaned: data || 0 };
    } catch (error) {
      aiLogger.error('임베딩 정리 실패:', error);
      return { cleaned: 0 };
    }
  }

  /**
   * 문서 재인덱싱
   */
  async reindexDocument(documentId: string): Promise<boolean> {
    const supabase = supabaseAdmin;

    try {
      // 기존 문서 조회
      const { data: doc, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !doc) {
        throw new Error('문서를 찾을 수 없습니다');
      }

      // 새 임베딩 생성
      const embedding = await embeddingService.createEmbedding(doc.content, {
        dimension: this.EMBEDDING_DIMENSION,
      });

      // 업데이트
      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update({
          embedding,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      aiLogger.info(`✅ 문서 ${documentId} 재인덱싱 완료`);
      return true;
    } catch (error) {
      aiLogger.error(`문서 ${documentId} 재인덱싱 실패:`, error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 export
export const vectorIndexingService = VectorIndexingService.getInstance();
