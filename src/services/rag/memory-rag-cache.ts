import type { RAGEngineSearchResult } from '../../types/rag/rag-types';

// 메모리 기반 RAG 캐시 클래스
export class MemoryRAGCache {
  private embeddingCache = new Map<
    string,
    {
      embedding: number[];
      timestamp: number;
      hits: number;
    }
  >();
  private searchCache = new Map<
    string,
    {
      result: RAGEngineSearchResult;
      timestamp: number;
      hits: number;
    }
  >();

  private maxEmbeddingSize = 500; // 최대 500개 임베딩 (성능 최적화)
  private maxSearchSize = 100; // 최대 100개 검색 결과 (캐시 히트율 향상)
  private ttlSeconds = 10800; // 3시간 TTL (성능 최적화)

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
  getSearchResult(key: string): RAGEngineSearchResult | null {
    const item = this.searchCache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttlSeconds * 1000) {
      this.searchCache.delete(key);
      return null;
    }

    item.hits++;
    return item.result;
  }

  setSearchResult(key: string, result: RAGEngineSearchResult): void {
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
      embeddingHits: Array.from(this.embeddingCache.values()).reduce(
        (sum, item) => sum + item.hits,
        0
      ),
      searchHits: Array.from(this.searchCache.values()).reduce(
        (sum, item) => sum + item.hits,
        0
      ),
    };
  }

  // LRU 방식 퇴출
  private evictLeastUsedEmbedding(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestTime = Date.now();

    for (const [key, item] of this.embeddingCache) {
      if (
        item.hits < leastHits ||
        (item.hits === leastHits && item.timestamp < oldestTime)
      ) {
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
      if (
        item.hits < leastHits ||
        (item.hits === leastHits && item.timestamp < oldestTime)
      ) {
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
    expiredEmbeddings.forEach((key) => {
      this.embeddingCache.delete(key);
    });

    // 만료된 검색 결과 제거
    const expiredSearches: string[] = [];
    for (const [key, item] of this.searchCache) {
      if (now - item.timestamp > expireTime) {
        expiredSearches.push(key);
      }
    }
    expiredSearches.forEach((key) => {
      this.searchCache.delete(key);
    });
  }
}
