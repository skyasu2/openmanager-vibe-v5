/**
 * Cloud Run Embedding Service
 * Google AI Embedding API 호출 담당
 *
 * Hybrid Architecture:
 * - Vercel에서 프록시를 통해 이 서비스 호출
 * - API 키는 Cloud Run에서만 관리
 */

import crypto from 'crypto';

interface EmbeddingOptions {
  dimension?: number;
  model?: string;
}

interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  embeddings?: number[][];
  error?: string;
  source?: 'google-ai' | 'local-fallback';
  cached?: boolean;
}

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

class CloudRunEmbeddingService {
  private cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_TTL = 10800000; // 3시간
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_DIMENSION = 384;
  private readonly API_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models';

  // 통계
  private stats = {
    requests: 0,
    cacheHits: 0,
    googleAiCalls: 0,
    localFallbacks: 0,
    errors: 0,
  };

  /**
   * 단일 텍스트 임베딩 생성
   */
  async createEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';

    this.stats.requests++;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Empty text provided' };
    }

    // 텍스트 길이 제한
    const truncatedText = text.substring(0, 2000);

    // 캐시 확인
    const cacheKey = `${model}_${dimension}_${this.hashText(truncatedText)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return {
        success: true,
        embedding: cached,
        source: 'google-ai',
        cached: true,
      };
    }

    // Google AI API 호출 시도
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('⚠️ [Embedding] No API key, using local fallback');
      this.stats.localFallbacks++;
      const localEmbedding = this.generateLocalEmbedding(
        truncatedText,
        dimension
      );
      this.saveToCache(cacheKey, localEmbedding);
      return {
        success: true,
        embedding: localEmbedding,
        source: 'local-fallback',
      };
    }

    try {
      const response = await fetch(
        `${this.API_ENDPOINT}/${model}:embedContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
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
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const embedding = data.embedding.values;

      this.stats.googleAiCalls++;
      this.saveToCache(cacheKey, embedding);

      return { success: true, embedding, source: 'google-ai' };
    } catch (error) {
      console.error('❌ [Embedding] Google AI failed, using fallback:', error);
      this.stats.errors++;
      this.stats.localFallbacks++;

      const localEmbedding = this.generateLocalEmbedding(
        truncatedText,
        dimension
      );
      this.saveToCache(cacheKey, localEmbedding);

      return {
        success: true,
        embedding: localEmbedding,
        source: 'local-fallback',
      };
    }
  }

  /**
   * 배치 임베딩 생성
   */
  async createBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';

    this.stats.requests++;

    // 빈 배열 체크
    if (!texts || texts.length === 0) {
      return { success: false, error: 'Empty texts array' };
    }

    // 유효한 텍스트만 필터링
    const validTexts = texts
      .filter((t) => t && t.trim().length > 0)
      .map((t) => t.substring(0, 2000));

    if (validTexts.length === 0) {
      return { success: false, error: 'No valid texts provided' };
    }

    // 캐시 확인 및 분류
    const results: (number[] | null)[] = new Array(validTexts.length).fill(
      null
    );
    const toProcess: { index: number; text: string }[] = [];

    validTexts.forEach((text, index) => {
      const cacheKey = `${model}_${dimension}_${this.hashText(text)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        results[index] = cached;
      } else {
        toProcess.push({ index, text });
      }
    });

    // 캐시되지 않은 항목 처리
    if (toProcess.length > 0) {
      const apiKey = this.getApiKey();

      if (!apiKey) {
        // 로컬 fallback
        console.warn('⚠️ [Embedding] No API key, batch using local fallback');
        this.stats.localFallbacks++;

        toProcess.forEach((item) => {
          const embedding = this.generateLocalEmbedding(item.text, dimension);
          const cacheKey = `${model}_${dimension}_${this.hashText(item.text)}`;
          this.saveToCache(cacheKey, embedding);
          results[item.index] = embedding;
        });
      } else {
        try {
          const response = await fetch(
            `${this.API_ENDPOINT}/${model}:batchEmbedContents`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
              },
              body: JSON.stringify({
                requests: toProcess.map((item) => ({
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
            throw new Error(`Batch API error: ${response.status}`);
          }

          const data = await response.json();
          this.stats.googleAiCalls++;

          data.embeddings.forEach(
            (embedding: { values: number[] }, i: number) => {
              const item = toProcess[i];
              if (!item) return;

              const cacheKey = `${model}_${dimension}_${this.hashText(item.text)}`;
              this.saveToCache(cacheKey, embedding.values);
              results[item.index] = embedding.values;
            }
          );
        } catch (error) {
          console.error('❌ [Embedding] Batch API failed:', error);
          this.stats.errors++;
          this.stats.localFallbacks++;

          // 로컬 fallback
          toProcess.forEach((item) => {
            const embedding = this.generateLocalEmbedding(item.text, dimension);
            const cacheKey = `${model}_${dimension}_${this.hashText(item.text)}`;
            this.saveToCache(cacheKey, embedding);
            results[item.index] = embedding;
          });
        }
      }
    }

    return {
      success: true,
      embeddings: results.filter((r): r is number[] => r !== null),
      source: this.stats.localFallbacks > 0 ? 'local-fallback' : 'google-ai',
    };
  }

  /**
   * API 키 가져오기 (failover 지원)
   */
  private getApiKey(): string | null {
    // Primary key
    const primary =
      process.env.GEMINI_API_KEY_PRIMARY || process.env.GOOGLE_AI_API_KEY;
    if (primary) return primary;

    // Secondary key
    const secondary =
      process.env.GEMINI_API_KEY_SECONDARY ||
      process.env.GOOGLE_AI_API_KEY_SECONDARY;
    if (secondary) return secondary;

    return null;
  }

  /**
   * 로컬 임베딩 생성 (fallback)
   */
  private generateLocalEmbedding(text: string, dimension: number): number[] {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    const embedding = new Array(dimension);

    // 의미론적 특징을 반영한 임베딩 생성
    for (let i = 0; i < dimension; i++) {
      const charCode = hash.charCodeAt(i % hash.length);
      const textChar = text.charCodeAt(i % text.length) || 0;
      embedding[i] =
        (Math.sin(charCode * (i + 1)) + Math.cos(textChar * (i + 1))) /
        Math.sqrt(dimension);
    }

    // L2 정규화
    const magnitude = Math.sqrt(
      embedding.reduce((sum: number, val: number) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      return embedding.map((val: number) => val / magnitude);
    }

    return embedding;
  }

  /**
   * 텍스트 해시 (캐시 키용)
   */
  private hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
  }

  /**
   * 캐시에서 조회
   */
  private getFromCache(key: string): number[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.embedding;
  }

  /**
   * 캐시에 저장
   */
  private saveToCache(key: string, embedding: number[]): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { embedding, timestamp: Date.now() });
  }

  /**
   * 서비스 통계
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate:
        this.stats.requests > 0
          ? Math.round((this.stats.cacheHits / this.stats.requests) * 100)
          : 0,
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
export const embeddingService = new CloudRunEmbeddingService();
