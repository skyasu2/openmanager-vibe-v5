/**
 * 🗄️ Local Vector Database - 의미적 검색 엔진
 * 
 * ✅ 외부 벡터 DB 불필요
 * ✅ Vercel 메모리 제한 내 동작
 * ✅ 의미적 유사성 검색 가능
 * ✅ 실시간 임베딩 캐싱
 */

import { transformersEngine } from './transformers-engine';

interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
  timestamp: number;
}

interface SearchOptions {
  topK?: number;
  threshold?: number;
  filterBy?: Record<string, any>;
  includeMetadata?: boolean;
}

interface SearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata?: Record<string, any>;
}

interface DatabaseStats {
  totalDocuments: number;
  totalSize: number;
  avgEmbeddingDimension: number;
  oldestDocument: number;
  newestDocument: number;
}

export class LocalVectorDB {
  private documents = new Map<string, VectorDocument>();
  private embeddingCache = new Map<string, number[]>();
  private maxDocuments: number;
  private maxCacheSize: number;
  private embeddingDimension = 384; // all-MiniLM-L6-v2 dimension

  constructor(options: {
    maxDocuments?: number;
    maxCacheSize?: number;
  } = {}) {
    this.maxDocuments = options.maxDocuments || 10000; // Vercel 메모리 제한 고려
    this.maxCacheSize = options.maxCacheSize || 5000;
    
    console.log('🗄️ 로컬 벡터 DB 초기화 완료');
  }

  /**
   * 📝 문서 추가
   */
  async addDocument(
    id: string, 
    text: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`📝 문서 추가 중: ${id}`);

      // 임베딩 생성
      let embedding = this.embeddingCache.get(text);
      if (!embedding) {
        embedding = await transformersEngine.generateEmbedding(text);
        
        // 캐시 크기 관리
        if (this.embeddingCache.size >= this.maxCacheSize) {
          const firstKey = this.embeddingCache.keys().next().value;
          if (firstKey !== undefined) {
            this.embeddingCache.delete(firstKey);
          }
        }
        
        this.embeddingCache.set(text, embedding);
      }

      // 문서 저장
      const document: VectorDocument = {
        id,
        text,
        embedding,
        metadata,
        timestamp: Date.now()
      };

      this.documents.set(id, document);

      // 문서 수 제한 관리
      if (this.documents.size > this.maxDocuments) {
        await this.cleanupOldDocuments();
      }

      console.log(`✅ 문서 추가 완료: ${id} (총 ${this.documents.size}개)`);

    } catch (error) {
      console.error(`❌ 문서 추가 실패: ${id}`, error);
      throw error;
    }
  }

  /**
   * 📝 여러 문서 배치 추가
   */
  async addDocuments(
    documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>
  ): Promise<void> {
    console.log(`📚 ${documents.length}개 문서 배치 추가 시작`);
    
    const startTime = Date.now();
    const promises = documents.map(doc => 
      this.addDocument(doc.id, doc.text, doc.metadata)
    );

    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    console.log(`✅ 배치 추가 완료: ${duration}ms`);
  }

  /**
   * 🔍 의미적 검색
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 5,
      threshold = 0.3,
      filterBy,
      includeMetadata = true
    } = options;

    try {
      console.log(`🔍 벡터 검색 시작: "${query}"`);
      const startTime = Date.now();

      // 쿼리 임베딩 생성
      let queryEmbedding = this.embeddingCache.get(query);
      if (!queryEmbedding) {
        queryEmbedding = await transformersEngine.generateEmbedding(query);
        this.embeddingCache.set(query, queryEmbedding);
      }

      if (queryEmbedding.length === 0) {
        console.warn('⚠️ 쿼리 임베딩 생성 실패');
        return [];
      }

      // 모든 문서와 유사도 계산
      const results: SearchResult[] = [];
      
      for (const doc of this.documents.values()) {
        // 메타데이터 필터링
        if (filterBy && !this.matchesFilter(doc.metadata, filterBy)) {
          continue;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        
        // 임계값 필터링
        if (similarity >= threshold) {
          results.push({
            id: doc.id,
            text: doc.text,
            similarity,
            ...(includeMetadata && doc.metadata ? { metadata: doc.metadata } : {})
          });
        }
      }

      // 유사도 순으로 정렬하고 상위 K개 반환
      const sortedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      const duration = Date.now() - startTime;
      console.log(`✅ 검색 완료: ${sortedResults.length}개 결과, ${duration}ms`);

      return sortedResults;

    } catch (error) {
      console.error('❌ 벡터 검색 실패:', error);
      return [];
    }
  }

  /**
   * 🔍 유사 문서 찾기
   */
  async findSimilarDocuments(
    documentId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`문서를 찾을 수 없습니다: ${documentId}`);
    }

    return this.search(document.text, {
      ...options,
      topK: (options.topK || 5) + 1 // 자기 자신 제외하기 위해 +1
    }).then(results => 
      results.filter(result => result.id !== documentId)
    );
  }

  /**
   * 📊 키워드 기반 검색 (보완)
   */
  keywordSearch(
    keywords: string[],
    options: SearchOptions = {}
  ): SearchResult[] {
    const {
      topK = 10,
      filterBy,
      includeMetadata = true
    } = options;

    console.log(`🔎 키워드 검색: ${keywords.join(', ')}`);

    const results: SearchResult[] = [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());

    for (const doc of this.documents.values()) {
      // 메타데이터 필터링
      if (filterBy && !this.matchesFilter(doc.metadata, filterBy)) {
        continue;
      }

      const lowerText = doc.text.toLowerCase();
      let matchCount = 0;
      
      // 키워드 매치 카운트
      for (const keyword of lowerKeywords) {
        if (lowerText.includes(keyword)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const similarity = matchCount / lowerKeywords.length; // 간단한 스코어링
        
        results.push({
          id: doc.id,
          text: doc.text,
          similarity,
          ...(includeMetadata && doc.metadata ? { metadata: doc.metadata } : {})
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 🗑️ 문서 삭제
   */
  removeDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      console.log(`🗑️ 문서 삭제: ${id}`);
    }
    return deleted;
  }

  /**
   * 📖 문서 조회
   */
  getDocument(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * 📋 모든 문서 목록
   */
  listDocuments(limit?: number): VectorDocument[] {
    const docs = Array.from(this.documents.values());
    return limit ? docs.slice(0, limit) : docs;
  }

  /**
   * 🧹 오래된 문서 정리
   */
  private async cleanupOldDocuments(): Promise<void> {
    const docs = Array.from(this.documents.values());
    docs.sort((a, b) => a.timestamp - b.timestamp);
    
    // 가장 오래된 문서 10% 삭제
    const deleteCount = Math.floor(docs.length * 0.1);
    
    for (let i = 0; i < deleteCount; i++) {
      this.documents.delete(docs[i].id);
    }
    
    console.log(`🧹 ${deleteCount}개 오래된 문서 정리 완료`);
  }

  /**
   * 🔍 메타데이터 필터 매칭
   */
  private matchesFilter(
    metadata: Record<string, any> | undefined,
    filter: Record<string, any>
  ): boolean {
    if (!metadata) return false;

    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * 📐 코사인 유사도 계산
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 📊 데이터베이스 통계
   */
  getStats(): DatabaseStats {
    const docs = Array.from(this.documents.values());
    
    if (docs.length === 0) {
      return {
        totalDocuments: 0,
        totalSize: 0,
        avgEmbeddingDimension: 0,
        oldestDocument: 0,
        newestDocument: 0
      };
    }

    const timestamps = docs.map(d => d.timestamp);
    const embeddingDimensions = docs.map(d => d.embedding.length);
    
    return {
      totalDocuments: docs.length,
      totalSize: this.calculateTotalSize(),
      avgEmbeddingDimension: embeddingDimensions.reduce((a, b) => a + b, 0) / embeddingDimensions.length,
      oldestDocument: Math.min(...timestamps),
      newestDocument: Math.max(...timestamps)
    };
  }

  /**
   * 💾 메모리 사용량 계산
   */
  private calculateTotalSize(): number {
    let totalSize = 0;
    
    for (const doc of this.documents.values()) {
      totalSize += doc.text.length * 2; // UTF-16 문자열
      totalSize += doc.embedding.length * 8; // float64 배열
      totalSize += JSON.stringify(doc.metadata || {}).length * 2;
    }
    
    return totalSize;
  }

  /**
   * 🗑️ 전체 데이터베이스 초기화
   */
  clear(): void {
    this.documents.clear();
    this.embeddingCache.clear();
    console.log('🗑️ 벡터 DB 전체 초기화 완료');
  }

  /**
   * 💾 벡터 DB 내보내기 (JSON)
   */
  export(): any {
    return {
      documents: Array.from(this.documents.entries()),
      stats: this.getStats(),
      exportedAt: Date.now()
    };
  }

  /**
   * 📥 벡터 DB 가져오기 (JSON)
   */
  import(data: any): void {
    this.documents.clear();
    
    if (data.documents && Array.isArray(data.documents)) {
      for (const [id, doc] of data.documents) {
        this.documents.set(id, doc);
      }
    }
    
    console.log(`📥 ${this.documents.size}개 문서 가져오기 완료`);
  }
}

// 싱글톤 인스턴스
export const localVectorDB = new LocalVectorDB({
  maxDocuments: 8000, // Vercel 메모리 제한 고려
  maxCacheSize: 3000
}); 