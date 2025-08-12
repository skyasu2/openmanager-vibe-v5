/**
 * 임베딩 서비스 - Google AI API를 활용한 텍스트 임베딩 생성
 *
 * 무료 티어 최적화:
 * - 384차원 벡터 사용 (메모리 절약)
 * - LRU 캐싱으로 중복 요청 방지
 * - 배치 처리 지원
 */

import { aiLogger } from '@/lib/logger';

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

interface EmbeddingOptions {
  dimension?: number;
  model?: string;
}

class EmbeddingService {
  private cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_TTL = 3600000; // 1시간
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_DIMENSION = 384; // 무료 티어 최적화
  private readonly API_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models';
  
  // 캐시 히트율 추적을 위한 카운터
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * 텍스트의 임베딩 벡터 생성
   */
  async createEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';

    // 입력 검증
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다');
    }

    // 텍스트 길이 제한 (토큰 절약)
    const truncatedText = text.substring(0, 2000);

    // 캐시 확인
    const cacheKey = `${model}_${dimension}_${truncatedText}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.cacheHits++;
      aiLogger.debug('캐시에서 임베딩 반환');
      return cached;
    }
    
    // 캐시 미스
    this.cacheMisses++;

    try {
      // Google AI API 호출
      const response = await fetch(
        `${this.API_ENDPOINT}/${model}:embedContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_AI_API_KEY,
          },
          body: JSON.stringify({
            model: `models/${model}`,
            content: {
              parts: [{ text: truncatedText }],
            },
            outputDimensionality: dimension,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`임베딩 API 오류: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const embedding = data.embedding.values;

      // 캐시에 저장
      this.saveToCache(cacheKey, embedding);

      return embedding;
    } catch (error) {
      aiLogger.error('임베딩 생성 실패:', error);
      // 폴백: 빈 임베딩 반환 (서비스 중단 방지)
      return new Array(dimension).fill(0);
    }
  }

  /**
   * 배치 임베딩 생성 (효율적인 대량 처리)
   */
  async createBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';

    // 빈 텍스트 필터링
    const validTexts = texts.filter(text => text && text.trim().length > 0);

    if (validTexts.length === 0) {
      return [];
    }

    // 캐시된 결과와 새로 생성할 텍스트 분리
    const results: (number[] | null)[] = new Array(texts.length);
    const toProcess: { index: number; text: string }[] = [];

    texts.forEach((text, index) => {
      if (!text || text.trim().length === 0) {
        results[index] = new Array(dimension).fill(0);
        return;
      }

      const truncatedText = text.substring(0, 2000);
      const cacheKey = `${model}_${dimension}_${truncatedText}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        this.cacheHits++;
        results[index] = cached;
      } else {
        this.cacheMisses++;
        toProcess.push({ index, text: truncatedText });
      }
    });

    // 새로 생성이 필요한 텍스트만 처리
    if (toProcess.length > 0) {
      try {
        const response = await fetch(
          `${this.API_ENDPOINT}/${model}:batchEmbedContents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': process.env.GOOGLE_AI_API_KEY,
            },
            body: JSON.stringify({
              requests: toProcess.map(item => ({
                model: `models/${model}`,
                content: {
                  parts: [{ text: item.text }],
                },
                outputDimensionality: dimension,
              })),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`배치 임베딩 API 오류: ${response.status}`);
        }

        const data = await response.json();

        // 결과를 캐시에 저장하고 results 배열에 할당
        data.embeddings.forEach((embedding: { values: number[] }, i: number) => {
          const item = toProcess[i];
          const values = embedding.values;

          const cacheKey = `${model}_${dimension}_${item.text}`;
          this.saveToCache(cacheKey, values);

          results[item.index] = values;
        });
      } catch (error) {
        aiLogger.error('배치 임베딩 생성 실패:', error);
        // 실패한 항목들은 빈 임베딩으로 채움
        toProcess.forEach(item => {
          results[item.index] = new Array(dimension).fill(0);
        });
      }
    }

    return results.filter((r): r is number[] => r !== null);
  }

  /**
   * 캐시에서 임베딩 조회
   */
  private getFromCache(key: string): number[] | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // TTL 확인
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.embedding;
  }

  /**
   * 캐시에 임베딩 저장
   */
  private saveToCache(key: string, embedding: number[]): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // LRU: 가장 오래된 항목 제거
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    aiLogger.info('임베딩 캐시 초기화됨');
  }

  /**
   * 캐시 통계
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    hits: number;
    misses: number;
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: Math.round(hitRate * 10) / 10, // 소수점 1자리까지
      hits: this.cacheHits,
      misses: this.cacheMisses,
    };
  }
}

// 싱글톤 인스턴스
export const embeddingService = new EmbeddingService();
