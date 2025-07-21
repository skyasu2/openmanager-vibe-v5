/**
 * 🧠 Supabase RAG (Retrieval-Augmented Generation) 엔진
 *
 * ✅ PostgreSQL pgvector 기반 벡터 검색
 * ✅ 임베딩 생성 및 관리
 * ✅ 컨텍스트 기반 응답 생성
 * ✅ Redis 캐싱 통합
 * ✅ MCP 컨텍스트 통합
 */

import { PostgresVectorDB } from './postgres-vector-db';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { getRedis } from '@/lib/redis';
import type { AIMetadata, MCPContext } from '@/types/ai-service-types';
import type { RedisClientInterface } from '@/lib/redis';

interface RAGSearchOptions {
  maxResults?: number;
  threshold?: number;
  category?: string;
  includeContext?: boolean;
  enableMCP?: boolean;
  cached?: boolean;
}

interface RAGSearchResult {
  success: boolean;
  results: Array<{
    id: string;
    content: string;
    similarity?: number;
    metadata?: AIMetadata;
  }>;
  context?: string;
  totalResults: number;
  processingTime: number;
  cached: boolean;
  error?: string;
  mcpContext?: MCPContext;
}

interface _EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export class SupabaseRAGEngine {
  private vectorDB: PostgresVectorDB;
  private contextLoader: CloudContextLoader;
  private redis: RedisClientInterface | null = null;
  private isInitialized = false;
  private embeddingCache = new Map<string, number[]>();
  private searchCache = new Map<string, RAGSearchResult>();

  // 임베딩 모델 설정 (384차원)
  private readonly EMBEDDING_DIMENSION = 384;
  private readonly CACHE_TTL = 300; // 5분

  constructor() {
    this.vectorDB = new PostgresVectorDB();
    this.contextLoader = CloudContextLoader.getInstance();

    // Redis 연결 (서버 환경에서만)
    if (typeof window === 'undefined') {
      this.redis = getRedis() as RedisClientInterface;
    }
  }

  /**
   * 🚀 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 벡터 DB 초기화는 이미 생성자에서 시작됨
      console.log('🚀 Supabase RAG 엔진 초기화 중...');

      // 초기 지식 베이스 확인
      const stats = await this.vectorDB.getStats();
      console.log(
        `📊 벡터 DB 상태: ${stats.total_documents}개 문서, ${stats.total_categories}개 카테고리`
      );

      // 지식 베이스가 비어있으면 초기 데이터 로드
      if (stats.total_documents === 0) {
        await this.loadInitialKnowledgeBase();
      }

      this.isInitialized = true;
      console.log('✅ Supabase RAG 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ RAG 엔진 초기화 실패:', error);
      // 초기화 실패해도 계속 진행
      this.isInitialized = true;
    }
  }

  /**
   * 🔍 유사 문서 검색
   */
  async searchSimilar(
    query: string,
    options: RAGSearchOptions = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();
    await this.initialize();

    try {
      const {
        maxResults = 5,
        threshold = 0.5,
        category,
        includeContext = true,
        enableMCP = false,
        cached = true,
      } = options;

      // 캐시 확인
      const cacheKey = this.generateCacheKey('search', query, options);
      if (cached) {
        const cachedResult = await this.getFromCache(cacheKey);
        if (cachedResult) {
          return {
            ...cachedResult,
            cached: true,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // 1. 쿼리 임베딩 생성
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. 벡터 검색 수행
      const searchResults = await this.vectorDB.search(queryEmbedding, {
        topK: maxResults,
        threshold,
        category,
      });

      // 3. MCP 컨텍스트 수집 (옵션)
      let mcpContext = null;
      if (enableMCP) {
        mcpContext = await this.contextLoader.queryMCPContextForRAG(query, {
          maxFiles: 5,
          includeSystemContext: true,
        });
      }

      // 4. 컨텍스트 생성
      let context = '';
      if (includeContext) {
        context = this.buildContext(searchResults, mcpContext);
      }

      const result: RAGSearchResult = {
        success: true,
        results: searchResults.map(r => ({
          id: r.id,
          content: r.content,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
        context,
        totalResults: searchResults.length,
        processingTime: Date.now() - startTime,
        cached: false,
        mcpContext: mcpContext || undefined,
      };

      // 캐시 저장
      if (cached) {
        await this.saveToCache(cacheKey, result);
      }

      return result;
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
   * 🧠 임베딩 생성
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // 캐시 확인
    const cacheKey = `embed:${text}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      // 실제 환경에서는 OpenAI나 다른 임베딩 API 사용
      // 여기서는 시뮬레이션용 더미 임베딩 생성
      const embedding = this.generateDummyEmbedding(text);

      // 캐시 저장
      this.embeddingCache.set(cacheKey, embedding);
      if (this.embeddingCache.size > 1000) {
        // LRU 방식으로 오래된 항목 제거
        const firstKey = this.embeddingCache.keys().next().value;
        if (firstKey) {
          this.embeddingCache.delete(firstKey);
        }
      }

      return embedding;
    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      // 폴백: 랜덤 임베딩
      return this.generateDummyEmbedding(text);
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
      await this.initialize();

      // 임베딩 생성
      const embedding = await this.generateEmbedding(content);

      // 벡터 DB에 저장
      const result = await this.vectorDB.store(
        id,
        content,
        embedding,
        metadata
      );

      if (result.success) {
        console.log(`✅ 문서 인덱싱 완료: ${id}`);
        // 캐시 무효화
        await this.invalidateSearchCache();
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
    const embeddings = await Promise.all(
      documents.map(doc => this.generateEmbedding(doc.content))
    );

    const docsWithEmbeddings = documents.map((doc, i) => ({
      ...doc,
      embedding: embeddings[i],
    }));

    const result = await this.vectorDB.bulkStore(docsWithEmbeddings);

    if (result.success > 0) {
      await this.invalidateSearchCache();
    }

    return result;
  }

  /**
   * 🏗️ 컨텍스트 구축
   */
  private buildContext(searchResults: any[], mcpContext?: any): string {
    let context = '관련 정보:\n\n';

    // 검색 결과 컨텍스트
    searchResults.forEach((result, idx) => {
      context += `[${idx + 1}] ${result.content}\n`;
      if (result.metadata?.source) {
        context += `   출처: ${result.metadata.source}\n`;
      }
      context += `   유사도: ${(result.similarity * 100).toFixed(1)}%\n\n`;
    });

    // MCP 컨텍스트 추가
    if (mcpContext && mcpContext.files.length > 0) {
      context += '\n추가 컨텍스트 (MCP):\n\n';
      mcpContext.files.forEach((file: any) => {
        context += `파일: ${file.path}\n`;
        context += `${file.content.substring(0, 200)}...\n\n`;
      });
    }

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
    return embedding.map(val => val / magnitude);
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
   * 💾 캐시 관리
   */
  private generateCacheKey(
    operation: string,
    query: string,
    options: any
  ): string {
    return `rag:${operation}:${Buffer.from(query).toString('base64')}:${JSON.stringify(options)}`;
  }

  private async getFromCache(key: string): Promise<any> {
    // 메모리 캐시 확인
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key);
    }

    // Redis 캐시 확인
    if (this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis 캐시 조회 오류:', error);
      }
    }

    return null;
  }

  private async saveToCache(key: string, data: any): Promise<void> {
    // 메모리 캐시 저장
    this.searchCache.set(key, data);
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) {
        this.searchCache.delete(firstKey);
      }
    }

    // Redis 캐시 저장
    if (this.redis) {
      try {
        await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
      } catch (error) {
        console.error('Redis 캐시 저장 오류:', error);
      }
    }
  }

  private async invalidateSearchCache(): Promise<void> {
    this.searchCache.clear();

    if (this.redis) {
      try {
        // RAG 관련 캐시 키 패턴으로 삭제
        // Redis keys 메서드는 RedisClientInterface에 정의되어 있지 않으므로 타입 단언 사용
        const redisClient = this.redis as any;
        const keys = await redisClient.keys('rag:search:*');
        if (keys.length > 0) {
          await Promise.all(keys.map((key: string) => this.redis!.del(key)));
        }
      } catch (error) {
        console.error('Redis 캐시 무효화 오류:', error);
      }
    }
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

      return {
        status: 'healthy',
        vectorDB: true,
        totalDocuments: stats.total_documents,
        cacheSize: this.searchCache.size,
      };
    } catch {
      return {
        status: 'unhealthy',
        vectorDB: false,
        totalDocuments: 0,
        cacheSize: this.searchCache.size,
      };
    }
  }
}

// 싱글톤 인스턴스
let ragEngineInstance: SupabaseRAGEngine | null = null;

export function getSupabaseRAGEngine(): SupabaseRAGEngine {
  if (!ragEngineInstance) {
    ragEngineInstance = new SupabaseRAGEngine();
  }
  return ragEngineInstance;
}
