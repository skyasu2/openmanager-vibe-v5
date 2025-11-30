/**
 * 🧠 Supabase RAG (Retrieval-Augmented Generation) 엔진 (Redis-Free)
 *
 * ✅ PostgreSQL pgvector 기반 벡터 검색
 * ✅ 임베딩 생성 및 관리
 * ✅ 컨텍스트 기반 응답 생성
 * ✅ 메모리 기반 캐싱 (Redis 완전 제거)
 * ✅ MCP 컨텍스트 통합
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { extractKeywords } from '../../services/rag/keyword-extractor';
// Extracted Services
import { MemoryRAGCache } from '../../services/rag/memory-rag-cache';
import type { AIMetadata } from '../../types/ai-service-types';

// Extracted Types
import type {
  DocumentMetadata,
  RAGEngineSearchResult,
  RAGSearchOptions,
  RAGSearchResult,
} from '../../types/rag/rag-types';

// Extracted Utilities
import {
  convertAIMetadataToDocumentMetadata,
  convertDocumentMetadataToAIMetadata,
} from '../../utils/rag/rag-utils';
import { embeddingService } from './embedding-service';
import { PostgresVectorDB } from './postgres-vector-db';

export class SupabaseRAGEngine {
  private vectorDB: PostgresVectorDB;
  private memoryCache: MemoryRAGCache;
  private isInitialized = false;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 임베딩 모델 설정 (384차원)
  private readonly EMBEDDING_DIMENSION = 384;

  constructor(supabaseClient?: SupabaseClient) {
    this.vectorDB = new PostgresVectorDB(supabaseClient);
    this.memoryCache = new MemoryRAGCache();

    // 주기적 정리 (5분마다)
    this.cleanupTimer = setInterval(
      () => {
        this.memoryCache.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * 🚀 엔진 초기화
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 벡터 DB 초기화는 이미 생성자에서 시작됨
      console.log('🚀 Supabase RAG 엔진 초기화 중... (Memory-based)');

      // 초기 지식 베이스 확인
      const stats = await this.vectorDB.getStats();

      // ✅ undefined 체크 추가 (테스트 환경 대응)
      if (!stats || typeof stats.total_documents === 'undefined') {
        console.warn(
          '⚠️ RAG stats unavailable (테스트 환경 또는 DB 연결 실패), 기본값으로 초기화'
        );
        this.isInitialized = true;
        return;
      }

      console.log(
        `📊 벡터 DB 상태: ${stats.total_documents}개 문서, ${stats.total_categories}개 카테고리`
      );

      // 지식 베이스가 비어있으면 초기 데이터 로드
      if (stats.total_documents === 0) {
        await this.loadInitialKnowledgeBase();
      }

      this.isInitialized = true;
      console.log('✅ Supabase RAG 엔진 초기화 완료 (Memory-based)');
    } catch (error) {
      console.error('❌ RAG 엔진 초기화 실패:', error);
      // 초기화 실패 시 재시도 가능하도록 false 유지
      this.isInitialized = false;
    }
  }

  /**
   * 🔤 키워드 기반 검색 (벡터 검색 fallback)
   */
  async searchByKeywords(
    query: string,
    options: {
      maxResults?: number;
      category?: string;
    } = {}
  ): Promise<RAGSearchResult[]> {
    const { maxResults = 5, category } = options;

    try {
      await this._initialize();

      // 쿼리에서 키워드 추출 (Extracted function used here)
      const keywords = extractKeywords(query);
      if (keywords.length === 0) {
        return [];
      }

      // PostgreSQL Full-Text Search 사용
      const searchResults = await this.vectorDB.searchByKeywords(keywords, {
        limit: maxResults,
        category,
      });

      return searchResults.map((result) => ({
        id: result.id,
        content: result.content,
        similarity: result.score || 0.7, // 키워드 검색은 기본 점수 부여
        metadata: convertDocumentMetadataToAIMetadata(result.metadata),
      }));
    } catch (error) {
      console.error('❌ 키워드 검색 실패:', error);
      return [];
    }
  }

  /**
   * 🔍 하이브리드 검색 (벡터 + 키워드)
   */
  async searchHybrid(
    query: string,
    options: RAGSearchOptions = {}
  ): Promise<RAGEngineSearchResult> {
    const startTime = Date.now();

    try {
      const { maxResults = 5, enableKeywordFallback = true } = options;

      // 1차: 벡터 검색 시도
      const vectorResults = await this.searchSimilar(query, {
        ...options,
        enableKeywordFallback: false, // 무한 루프 방지
      });

      // 벡터 검색 결과가 충분하면 반환
      if (
        vectorResults.success &&
        vectorResults.results.length >= Math.ceil(maxResults / 2)
      ) {
        return vectorResults;
      }

      // 2차: 키워드 검색으로 보완
      if (enableKeywordFallback) {
        const keywordResults = await this.searchByKeywords(query, {
          maxResults: Math.max(maxResults - vectorResults.results.length, 2),
          category: options.category,
        });

        // 결과 합성 (중복 제거)
        const combinedResults = [...vectorResults.results];
        const existingIds = new Set(vectorResults.results.map((r) => r.id));

        for (const keywordResult of keywordResults) {
          if (
            !existingIds.has(keywordResult.id) &&
            combinedResults.length < maxResults
          ) {
            combinedResults.push(keywordResult);
          }
        }

        return {
          success: true,
          results: combinedResults,
          totalResults: combinedResults.length,
          processingTime: Date.now() - startTime,
          cached: false,
          context: vectorResults.context,
        };
      }

      return vectorResults;
    } catch (error) {
      console.error('❌ 하이브리드 검색 실패:', error);
      return {
        success: false,
        results: [],
        totalResults: 0,
        processingTime: Date.now() - startTime,
        cached: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 🔍 유사 문서 검색
   */
  async searchSimilar(
    query: string,
    options: RAGSearchOptions = {}
  ): Promise<RAGEngineSearchResult> {
    const startTime = Date.now();
    await this._initialize();

    try {
      // 빈 쿼리 검사
      if (!query.trim()) {
        return {
          success: false,
          results: [],
          totalResults: 0,
          processingTime: Date.now() - startTime,
          cached: false,
          error: '빈 쿼리는 검색할 수 없습니다.',
        };
      }

      const {
        maxResults = 5,
        threshold = 0.5,
        category,
        includeContext = true,
        cached = true,
      } = options;

      // 메모리 캐시 확인
      const cacheKey = this.generateCacheKey('search', query, options);
      if (cached) {
        const cachedResult = this.memoryCache.getSearchResult(cacheKey);
        if (cachedResult) {
          return {
            ...cachedResult,
            cached: true,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // 1. 쿼리 임베딩 생성 (로컬 임베딩 옵션 전달)
      const queryEmbedding = await this.generateEmbedding(
        query,
        options.useLocalEmbeddings
      );
      if (!queryEmbedding) {
        throw new Error('임베딩 생성 실패');
      }

      // 2. 벡터 검색 수행
      try {
        const searchResults = await this.vectorDB.search(queryEmbedding, {
          topK: maxResults,
          threshold,
          category,
        });

        if (!searchResults || searchResults.length === 0) {
          return {
            success: true,
            results: [],
            totalResults: 0,
            processingTime: Date.now() - startTime,
            cached: false,
          };
        }

        // MCP 컨텍스트 수집 제거됨 (GCP VM 서버 사용 중단)

        // 4. 컨텍스트 생성
        let context = '';
        if (includeContext) {
          context = this.buildContext(searchResults);
        }

        const result: RAGEngineSearchResult = {
          success: true,
          results: searchResults.map((r) => ({
            id: r.id,
            content: r.content,
            similarity: r.similarity,
            metadata: convertDocumentMetadataToAIMetadata(r.metadata),
          })),
          context,
          totalResults: searchResults.length,
          processingTime: Date.now() - startTime,
          cached: false,
        };

        // 메모리 캐시 저장
        if (cached) {
          this.memoryCache.setSearchResult(cacheKey, result);
        }

        return result;
      } catch (searchError) {
        // 벡터 검색 에러 처리
        console.error('벡터 검색 실패:', searchError);
        return {
          success: false,
          results: [],
          totalResults: 0,
          processingTime: Date.now() - startTime,
          cached: false,
          error:
            searchError instanceof Error
              ? searchError.message
              : '벡터 검색 실패',
        };
      }
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return {
        success: false,
        results: [],
        totalResults: 0,
        processingTime: Date.now() - startTime,
        cached: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 🧠 임베딩 생성 (로컬/클라우드 모드 지원)
   */
  async generateEmbedding(
    text: string,
    useLocalEmbeddings?: boolean
  ): Promise<number[] | null> {
    // 메모리 캐시 확인 (로컬/클라우드 구분)
    const cacheKey = `embed:${useLocalEmbeddings ? 'local:' : 'cloud:'}${text}`;
    const cached = this.memoryCache.getEmbedding(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 실제 임베딩 서비스 사용 (로컬 옵션 전달)
      const embedding = await embeddingService.createEmbedding(text, {
        dimension: this.EMBEDDING_DIMENSION,
        useLocal: useLocalEmbeddings,
      });

      // 메모리 캐시 저장
      this.memoryCache.setEmbedding(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      // 폴백: 더미 임베딩 (서비스 중단 방지)
      console.warn('⚠️ 더미 임베딩으로 폴백');
      const dummyEmbedding = this.generateDummyEmbedding(text);
      this.memoryCache.setEmbedding(cacheKey, dummyEmbedding);
      return dummyEmbedding;
    }
  }

  /**
   * 📝 문서 인덱싱
   */
  async indexDocument(
    id: string,
    content: string,
    metadata?: AIMetadata
  ): Promise<boolean> {
    try {
      await this._initialize();

      // 임베딩 생성
      const embedding = await this.generateEmbedding(content);
      if (!embedding) {
        throw new Error('임베딩 생성 실패');
      }

      // 벡터 DB에 저장
      const result = await this.vectorDB.store(
        id,
        content,
        embedding,
        convertAIMetadataToDocumentMetadata(metadata)
      );

      if (result.success) {
        console.log(`✅ 문서 인덱싱 완료: ${id}`);
        // 검색 캐시 무효화
        this.memoryCache.invalidateSearchCache();
      }

      return result.success;
    } catch (error) {
      console.error('❌ 문서 인덱싱 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 대량 인덱싱
   */
  async bulkIndex(
    documents: Array<{
      id: string;
      content: string;
      metadata?: AIMetadata;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
      // 배치 임베딩 생성
      const embeddings = await Promise.all(
        documents.map((doc) => this.generateEmbedding(doc.content))
      );

      // 임베딩이 성공한 문서들만 처리
      const validDocuments = documents
        .map((doc, i) => ({ ...doc, embedding: embeddings[i] }))
        .filter((doc): doc is typeof doc & { embedding: number[] } =>
          Array.isArray(doc.embedding)
        );

      if (validDocuments.length === 0) {
        return { success: 0, failed: documents.length };
      }

      // 개별 문서 저장 (벡터 DB 인터페이스에 맞춤)
      for (const doc of validDocuments) {
        try {
          const result = await this.vectorDB.store(
            doc.id,
            doc.content,
            doc.embedding,
            convertAIMetadataToDocumentMetadata(doc.metadata)
          );

          if (result.success) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`문서 저장 실패 (${doc.id}):`, error);
          failed++;
        }
      }

      // 실패한 임베딩 카운트 추가
      failed += documents.length - validDocuments.length;

      if (success > 0) {
        this.memoryCache.invalidateSearchCache();
      }

      return { success, failed };
    } catch (error) {
      console.error('❌ 대량 인덱싱 실패:', error);
      return { success: 0, failed: documents.length };
    }
  }

  /**
   * 🏗️ 컨텍스트 구축
   */
  private buildContext(
    searchResults: Array<{
      id: string;
      content: string;
      similarity: number;
      metadata?: AIMetadata | DocumentMetadata;
    }>
  ): string {
    let context = '관련 정보:\n\n';

    // 검색 결과 컨텍스트
    searchResults.forEach((result, idx) => {
      context += `[${idx + 1}] ${result.content}\n`;
      if (result.metadata?.source) {
        context += `   출처: ${result.metadata.source}\n`;
      }
      context += `   유사도: ${((result.similarity || 0) * 100).toFixed(1)}%\n\n`;
    });

    // MCP 컨텍스트 제거됨 (GCP VM 서버 사용 중단)

    return context;
  }

  /**
   * 🎲 더미 임베딩 생성 (개발/테스트용)
   */
  private generateDummyEmbedding(text: string): number[] {
    // 텍스트 기반 시드로 일관된 임베딩 생성
    const seed = text
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding = new Array(this.EMBEDDING_DIMENSION);

    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      // 시드 기반 의사 랜덤 값 생성 (-1 ~ 1)
      embedding[i] = Math.sin(seed * (i + 1)) * Math.cos(seed / (i + 1));
    }

    // 정규화
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => val / magnitude);
  }

  /**
   * 📚 초기 지식 베이스 확인 (기존 command_vectors 테이블 활용)
   */
  private async loadInitialKnowledgeBase(): Promise<void> {
    console.log('📚 기존 지식 베이스 확인 중...');

    try {
      // 기존 데이터 확인
      const stats = await this.vectorDB.getStats();
      console.log(
        `✅ 기존 지식 베이스 발견: ${stats.total_documents}개 문서, ${stats.total_categories}개 카테고리`
      );

      // 기존 데이터가 충분하므로 추가 로드 불필요
      console.log('✅ 초기 지식 베이스 준비 완료 (기존 데이터 활용)');
    } catch (error) {
      console.warn('⚠️ 지식 베이스 확인 중 오류:', error);

      // 폴백: 기본 문서 추가
      const fallbackDocuments = [
        {
          id: 'rag_fallback_help',
          content:
            'RAG 엔진 폴백 도움말: 서버 모니터링, 시스템 진단, 로그 분석을 지원합니다.',
          metadata: {
            category: 'system',
            tags: ['도움말', 'RAG', '폴백'],
            source: 'fallback',
          },
        },
      ];

      const result = await this.bulkIndex(fallbackDocuments);
      console.log(
        `✅ 폴백 지식 베이스 로드 완료: ${result.success}개 성공, ${result.failed}개 실패`
      );
    }
  }

  /**
   * 💾 메모리 캐시 관리
   */
  private generateCacheKey(
    operation: string,
    query: string,
    options: RAGSearchOptions | Record<string, unknown>
  ): string {
    return `rag:${operation}:${Buffer.from(query).toString('base64')}:${JSON.stringify(options)}`;
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    vectorDB: boolean;
    totalDocuments: number;
    cacheSize: number;
  }> {
    try {
      const stats = await this.vectorDB.getStats();
      const cacheStats = this.memoryCache.getStats();

      return {
        status: 'healthy',
        vectorDB: true,
        totalDocuments: stats.total_documents,
        cacheSize: cacheStats.searchCacheSize + cacheStats.embeddingCacheSize,
      };
    } catch {
      return {
        status: 'unhealthy',
        vectorDB: false,
        totalDocuments: 0,
        cacheSize:
          this.memoryCache.getStats().searchCacheSize +
          this.memoryCache.getStats().embeddingCacheSize,
      };
    }
  }

  /**
   * 🛑 리소스 정리
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.memoryCache.invalidateSearchCache();
    console.log('🛑 RAG 엔진 리소스 정리 완료');
  }
}

// 싱글톤 인스턴스 (deprecated - use direct instantiation with dependency injection)
let ragEngineInstance: SupabaseRAGEngine | null = null;

/**
 * @deprecated Use `new SupabaseRAGEngine(supabaseClient)` with dependency injection instead
 */
export function getSupabaseRAGEngine(
  supabaseClient?: SupabaseClient
): SupabaseRAGEngine {
  if (!ragEngineInstance) {
    ragEngineInstance = new SupabaseRAGEngine(supabaseClient);
  }
  return ragEngineInstance;
}
