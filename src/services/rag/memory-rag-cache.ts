import type {
  CacheEntryMeta,
  QueryIntent,
  RAGEngineSearchResult,
} from '../../types/rag/rag-types';
import { INTENT_TTL_SECONDS } from '../../types/rag/rag-types';

// 24시간 로테이션 일자 계산 (UTC 기준)
const getCurrentScenarioDay = (): number => Math.floor(Date.now() / 86400000); // 86400000ms = 24시간

// 메모리 기반 RAG 캐시 클래스 (Phase 3: Intent 기반 TTL + 24시간 로테이션)
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
      meta?: CacheEntryMeta; // Phase 3: Intent/Category 메타데이터
    }
  >();

  private maxEmbeddingSize = 500; // 최대 500개 임베딩 (성능 최적화)
  private maxSearchSize = 100; // 최대 100개 검색 결과 (캐시 히트율 향상)
  private ttlSeconds = 10800; // 3시간 기본 TTL (Intent 없을 때)
  private lastScenarioDay = getCurrentScenarioDay(); // 24시간 로테이션 추적
  private lastRotationCheck = 0; // Phase 3.2: 마지막 로테이션 체크 시간
  private readonly rotationCheckIntervalMs = 3600000; // 1시간 간격으로 체크 (성능 최적화)

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

  // 검색 결과 캐시 관리 (Phase 3: Intent 기반 TTL)
  getSearchResult(key: string): RAGEngineSearchResult | null {
    // 24시간 로테이션 체크 (시나리오 데이터 갱신) - 최적화된 빈도
    this.checkAndRotateScenariosOptimized();

    const item = this.searchCache.get(key);
    if (!item) return null;

    // Intent 기반 TTL 계산 (안전한 접근)
    const ttl = this.getEffectiveTTL(item.meta?.intent);

    if (Date.now() - item.timestamp > ttl * 1000) {
      this.searchCache.delete(key);
      return null;
    }

    item.hits++;
    return item.result;
  }

  // Phase 3.1: 안전한 TTL 계산 (undefined 방지)
  private getEffectiveTTL(intent?: QueryIntent): number {
    if (!intent) return this.ttlSeconds;

    const intentTtl = INTENT_TTL_SECONDS[intent];
    // 타입 안전: undefined 또는 유효하지 않은 값 방지
    if (typeof intentTtl === 'number' && intentTtl > 0) {
      return intentTtl;
    }
    return this.ttlSeconds;
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

  // Phase 3: Intent/Category와 함께 검색 결과 저장
  setSearchResultWithMeta(
    key: string,
    result: RAGEngineSearchResult,
    intent?: QueryIntent,
    category?: string
  ): void {
    if (this.searchCache.size >= this.maxSearchSize) {
      this.evictLeastUsedSearch();
    }

    this.searchCache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 0,
      meta: {
        intent,
        category,
        scenarioDay: getCurrentScenarioDay(),
      },
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

  // Phase 3: 24시간 로테이션 체크 및 시나리오 캐시 무효화
  private checkAndRotateScenarios(): void {
    const currentDay = getCurrentScenarioDay();
    if (currentDay !== this.lastScenarioDay) {
      // 새로운 날 -> 시나리오 데이터 갱신 필요
      console.log(
        `🔄 24시간 시나리오 로테이션: Day ${this.lastScenarioDay} -> ${currentDay}`
      );
      this.invalidateSearchCache();
      this.lastScenarioDay = currentDay;
    }
  }

  // Phase 3.2: 최적화된 로테이션 체크 (매 호출 대신 1시간 간격)
  private checkAndRotateScenariosOptimized(): void {
    const now = Date.now();
    // 마지막 체크로부터 1시간 이내면 스킵 (성능 최적화)
    if (now - this.lastRotationCheck < this.rotationCheckIntervalMs) {
      return;
    }
    this.lastRotationCheck = now;
    this.checkAndRotateScenarios();
  }

  // Phase 3: Intent별 선택적 캐시 무효화
  invalidateByIntent(intent: QueryIntent): void {
    const keysToDelete: string[] = [];
    for (const [key, item] of this.searchCache) {
      if (item.meta?.intent === intent) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.searchCache.delete(key);
    }
    console.log(
      `🗑️ Intent '${intent}' 캐시 무효화: ${keysToDelete.length}개 항목 제거`
    );
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
