/**
 * 🧠 Supabase RAG (Retrieval-Augmented Generation) 엔진 (Redis-Free)
 *
 * ✅ PostgreSQL pgvector 기반 벡터 검색
 * ✅ 임베딩 생성 및 관리
 * ✅ 컨텍스트 기반 응답 생성
 * ✅ 메모리 기반 캐싱 (Redis 완전 제거)
 * ✅ MCP 컨텍스트 통합
 */

import { PostgresVectorDB } from './postgres-vector-db';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { embeddingService } from './embedding-service';
import type { AIMetadata, MCPContext } from '@/types/ai-service-types';

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

// 메모리 기반 RAG 캐시 클래스
class MemoryRAGCache {
  private embeddingCache = new Map<string, { 
    embedding: number[]; 
    timestamp: number; 
    hits: number; 
  }>();
  private searchCache = new Map<string, { 
    result: RAGSearchResult; 
    timestamp: number; 
    hits: number; 
  }>();
  
  private maxEmbeddingSize = 1000; // 최대 1000개 임베딩
  private maxSearchSize = 100; // 최대 100개 검색 결과
  private ttlSeconds = 300; // 5분 TTL

  // 임베딩 캐시 관리
  getEmbedding(key: string): number[] | null {
    const item = this.embeddingCache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttlSeconds * 1000) {
      this.embeddingCache.delete(key);
      return null;
    }
    
    item.hits++;
    return item.embedding;
  }

  setEmbedding(key: string, embedding: number[]): void {
    if (this.embeddingCache.size >= this.maxEmbeddingSize) {
      this.evictLeastUsedEmbedding();
    }
    
    this.embeddingCache.set(key, {
      embedding,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  // 검색 결과 캐시 관리
  getSearchResult(key: string): RAGSearchResult | null {
    const item = this.searchCache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttlSeconds * 1000) {
      this.searchCache.delete(key);
      return null;
    }
    
    item.hits++;
    return item.result;
  }

  setSearchResult(key: string, result: RAGSearchResult): void {
    if (this.searchCache.size >= this.maxSearchSize) {
      this.evictLeastUsedSearch();
    }
    
    this.searchCache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  // 캐시 무효화
  invalidateSearchCache(): void {
    this.searchCache.clear();
  }

  // 통계
  getStats() {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      searchCacheSize: this.searchCache.size,
      embeddingHits: Array.from(this.embeddingCache.values()).reduce((sum, item) => sum + item.hits, 0),
      searchHits: Array.from(this.searchCache.values()).reduce((sum, item) => sum + item.hits, 0),
    };
  }

  // LRU 방식 퇴출
  private evictLeastUsedEmbedding(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.embeddingCache) {
      if (item.hits < leastHits || (item.hits === leastHits && item.timestamp < oldestTime)) {
        leastHits = item.hits;
        oldestTime = item.timestamp;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.embeddingCache.delete(leastUsedKey);
    }
  }

  private evictLeastUsedSearch(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.searchCache) {
      if (item.hits < leastHits || (item.hits === leastHits && item.timestamp < oldestTime)) {
        leastHits = item.hits;
        oldestTime = item.timestamp;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.searchCache.delete(leastUsedKey);
    }
  }

  // 정리
  cleanup(): void {
    const now = Date.now();
    const expireTime = this.ttlSeconds * 1000;
    
    // 만료된 임베딩 제거
    const expiredEmbeddings: string[] = [];
    for (const [key, item] of this.embeddingCache) {
      if (now - item.timestamp > expireTime) {
        expiredEmbeddings.push(key);
      }
    }
    expiredEmbeddings.forEach(key => this.embeddingCache.delete(key));
    
    // 만료된 검색 결과 제거
    const expiredSearches: string[] = [];
    for (const [key, item] of this.searchCache) {
      if (now - item.timestamp > expireTime) {
        expiredSearches.push(key);
      }
    }
    expiredSearches.forEach(key => this.searchCache.delete(key));
  }
}

export class SupabaseRAGEngine {
  private vectorDB: PostgresVectorDB;
  private contextLoader: CloudContextLoader;
  private memoryCache: MemoryRAGCache;
  private isInitialized = false;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 임베딩 모델 설정 (384차원)
  private readonly EMBEDDING_DIMENSION = 384;

  constructor() {
    this.vectorDB = new PostgresVectorDB();
    this.contextLoader = CloudContextLoader.getInstance();
    this.memoryCache = new MemoryRAGCache();
    
    // 주기적 정리 (5분마다)
    this.cleanupTimer = setInterval(() => {
      this.memoryCache.cleanup();
    }, 5 * 60 * 1000);
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
        enableMCP = false,
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

      // 1. 쿼리 임베딩 생성
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('임베딩 생성 실패');
      }

      // 2. 벡터 검색 수행
      const searchResults = await this.vectorDB.search(queryEmbedding, {
        limit: maxResults,
        threshold,
        category,
      });

      if (!searchResults.success) {
        return {
          success: false,
          results: [],
          totalResults: 0,
          processingTime: Date.now() - startTime,
          cached: false,
          error: searchResults.error || '벡터 검색 실패',
        };
      }

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
        context = this.buildContext(searchResults.results || [], mcpContext);
      }

      const result: RAGSearchResult = {
        success: true,
        results: (searchResults.results || []).map(r => ({
          id: r.id,
          content: r.content,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
        context,
        totalResults: searchResults.total || 0,
        processingTime: Date.now() - startTime,
        cached: false,
        mcpContext: mcpContext || undefined,
      };

      // 메모리 캐시 저장
      if (cached) {
        this.memoryCache.setSearchResult(cacheKey, result);
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
  async generateEmbedding(text: string): Promise<number[] | null> {
    // 메모리 캐시 확인
    const cacheKey = `embed:${text}`;
    const cached = this.memoryCache.getEmbedding(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 실제 임베딩 서비스 사용
      const embedding = await embeddingService.createEmbedding(text, {
        dimension: this.EMBEDDING_DIMENSION,
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
      const result = await this.vectorDB.addDocument({
        id,
        content,
        embedding,
        metadata,
      });

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
        documents.map(doc => this.generateEmbedding(doc.content))
      );

      // 임베딩이 성공한 문서들만 처리
      const validDocuments = documents
        .map((doc, i) => ({ ...doc, embedding: embeddings[i] }))
        .filter(doc => doc.embedding !== null);

      if (validDocuments.length === 0) {
        return { success: 0, failed: documents.length };
      }

      // 개별 문서 저장 (벡터 DB 인터페이스에 맞춤)
      for (const doc of validDocuments) {
        try {
          const result = await this.vectorDB.addDocument({
            id: doc.id,
            content: doc.content,
            embedding: doc.embedding!,
            metadata: doc.metadata,
          });

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
  private buildContext(searchResults: any[], mcpContext?: any): string {
    let context = '관련 정보:\n\n';

    // 검색 결과 컨텍스트
    searchResults.forEach((result, idx) => {
      context += `[${idx + 1}] ${result.content}\n`;
      if (result.metadata?.source) {
        context += `   출처: ${result.metadata.source}\n`;
      }
      context += `   유사도: ${((result.similarity || 0) * 100).toFixed(1)}%\n\n`;
    });

    // MCP 컨텍스트 추가
    if (mcpContext && mcpContext.files && mcpContext.files.length > 0) {
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
   * 💾 메모리 캐시 관리
   */
  private generateCacheKey(
    operation: string,
    query: string,
    options: Record<string, unknown>
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
        cacheSize: this.memoryCache.getStats().searchCacheSize + this.memoryCache.getStats().embeddingCacheSize,
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

// 싱글톤 인스턴스
let ragEngineInstance: SupabaseRAGEngine | null = null;

export function getSupabaseRAGEngine(): SupabaseRAGEngine {
  if (!ragEngineInstance) {
    ragEngineInstance = new SupabaseRAGEngine();
  }
  return ragEngineInstance;
}