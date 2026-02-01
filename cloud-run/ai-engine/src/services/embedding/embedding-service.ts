/**
 * Cloud Run Embedding Service
 * Mistral AI Embedding API 호출 담당
 *
 * ## Migration from Google AI (2025-12-31)
 * - Changed from Google text-embedding-004 (384d) to Mistral mistral-embed (1024d)
 * - Uses @ai-sdk/mistral for consistent API
 *
 * Hybrid Architecture:
 * - Vercel에서 프록시를 통해 이 서비스 호출
 * - API 키는 Cloud Run에서만 관리
 */

import crypto from 'crypto';
import { createMistral } from '@ai-sdk/mistral';
import { embed, embedMany } from 'ai';
import { getMistralApiKey } from '../../lib/config-parser';
import { logger } from '../../lib/logger';

interface EmbeddingOptions {
  dimension?: number; // Ignored for Mistral (fixed 1024d)
  model?: string; // Ignored for Mistral (fixed mistral-embed)
}

interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  embeddings?: number[][];
  error?: string;
  source?: 'mistral' | 'local-fallback';
  cached?: boolean;
}

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

class CloudRunEmbeddingService {
  private cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_TTL = 10800000; // 3시간
  private readonly MAX_CACHE_SIZE = 5000; // v7.1.0: 1000 → 5000 (반복 API 호출 감소)
  private readonly DEFAULT_DIMENSION = 1024; // Mistral mistral-embed dimension
  private mistralProvider: ReturnType<typeof createMistral> | null = null;

  // 통계
  private stats = {
    requests: 0,
    cacheHits: 0,
    mistralCalls: 0,
    localFallbacks: 0,
    errors: 0,
  };

  /**
   * Get or create Mistral provider
   */
  private getMistralProvider(): ReturnType<typeof createMistral> | null {
    if (this.mistralProvider) {
      return this.mistralProvider;
    }

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      return null;
    }

    this.mistralProvider = createMistral({ apiKey });
    return this.mistralProvider;
  }

  /**
   * 단일 텍스트 임베딩 생성
   */
  async createEmbedding(
    text: string,
    _options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const dimension = this.DEFAULT_DIMENSION;

    this.stats.requests++;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Empty text provided' };
    }

    // 텍스트 길이 제한
    const truncatedText = text.substring(0, 2000);

    // 캐시 확인
    const cacheKey = `mistral_${dimension}_${this.hashText(truncatedText)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return {
        success: true,
        embedding: cached,
        source: 'mistral',
        cached: true,
      };
    }

    // Mistral API 호출 시도
    const mistral = this.getMistralProvider();
    if (!mistral) {
      logger.warn('⚠️ [Embedding] No Mistral API key, using local fallback');
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
      const model = mistral.embedding('mistral-embed');
      const { embedding: resultEmbedding } = await embed({
        model,
        value: truncatedText,
        experimental_telemetry: { isEnabled: false },
      });

      this.stats.mistralCalls++;
      this.saveToCache(cacheKey, resultEmbedding);

      return { success: true, embedding: resultEmbedding, source: 'mistral' };
    } catch (error) {
      logger.error('❌ [Embedding] Mistral AI failed, using fallback:', error);
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
    _options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const dimension = this.DEFAULT_DIMENSION;

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
      const cacheKey = `mistral_${dimension}_${this.hashText(text)}`;
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
      const mistral = this.getMistralProvider();

      if (!mistral) {
        // 로컬 fallback
        logger.warn('⚠️ [Embedding] No Mistral API key, batch using local fallback');
        this.stats.localFallbacks++;

        toProcess.forEach((item) => {
          const embedding = this.generateLocalEmbedding(item.text, dimension);
          const cacheKey = `mistral_${dimension}_${this.hashText(item.text)}`;
          this.saveToCache(cacheKey, embedding);
          results[item.index] = embedding;
        });
      } else {
        try {
          const model = mistral.embedding('mistral-embed');
          const textsToEmbed = toProcess.map((item) => item.text);

          const { embeddings } = await embedMany({
            model,
            values: textsToEmbed,
            experimental_telemetry: { isEnabled: false },
          });

          this.stats.mistralCalls++;

          embeddings.forEach((embedding, i) => {
            const item = toProcess[i];
            if (!item) return;

            const cacheKey = `mistral_${dimension}_${this.hashText(item.text)}`;
            this.saveToCache(cacheKey, embedding);
            results[item.index] = embedding;
          });
        } catch (error) {
          logger.error('❌ [Embedding] Batch API failed:', error);
          this.stats.errors++;
          this.stats.localFallbacks++;

          // 로컬 fallback
          toProcess.forEach((item) => {
            const embedding = this.generateLocalEmbedding(item.text, dimension);
            const cacheKey = `mistral_${dimension}_${this.hashText(item.text)}`;
            this.saveToCache(cacheKey, embedding);
            results[item.index] = embedding;
          });
        }
      }
    }

    return {
      success: true,
      embeddings: results.filter((r): r is number[] => r !== null),
      source: this.stats.localFallbacks > 0 ? 'local-fallback' : 'mistral',
    };
  }

  /**
   * 로컬 임베딩 생성 (fallback)
   * Note: Updated to 1024 dimensions for Mistral compatibility
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
      provider: 'mistral',
      dimension: this.DEFAULT_DIMENSION,
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
