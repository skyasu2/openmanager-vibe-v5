/**
 * 임베딩 서비스 - Cloud Run 프록시 전용
 *
 * 설계 원칙:
 * - Vercel = Proxy Only (직접 API 호출 금지)
 * - Cloud Run = AI Processing (Mistral API 호출)
 *
 * ## Migration (2025-12-31)
 * - Changed from Google AI (384d) to Mistral (1024d)
 *
 * v5.84.0: 로컬 Fallback 제거 (Cloud Run 의존성 강화)
 */

import { isCloudRunEnabled, proxyToCloudRun } from '../../lib/ai-proxy/proxy';
import { aiLogger } from '../../lib/logger';

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

interface EmbeddingOptions {
  dimension?: number;
  model?: string;
}

interface CloudRunEmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  source?: string;
  processingTime?: number;
}

class EmbeddingService {
  private cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_TTL = 10800000; // 3시간
  private readonly MAX_CACHE_SIZE = 5000; // v7.1.0: 1000 → 5000 (반복 API 호출 감소)
  private readonly DEFAULT_DIMENSION = 1024; // Mistral mistral-embed

  // 캐시 히트율 추적
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * 텍스트의 임베딩 벡터 생성 (Cloud Run Only)
   */
  async createEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'mistral-embed';

    // 1. 입력 검증
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다');
    }

    if (!isCloudRunEnabled()) {
      throw new Error('Cloud Run AI 서비스가 활성화되지 않았습니다.');
    }

    const truncatedText = text.substring(0, 2000);
    const cacheKey = `cloudrun_${dimension}_${truncatedText}`;

    // 2. 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.cacheHits++;
      aiLogger.debug(`캐시에서 Cloud Run 임베딩 반환`);
      return cached;
    }

    this.cacheMisses++;

    // 3. Cloud Run 프록시 호출
    try {
      aiLogger.debug('Cloud Run 프록시로 임베딩 요청...');

      const result = await proxyToCloudRun({
        path: '/api/ai/embedding',
        method: 'POST',
        body: {
          text: truncatedText,
          options: { dimension, model },
        },
        timeout: 10000,
      });

      if (result.success && result.data) {
        const cloudRunResult = result.data as CloudRunEmbeddingResult;

        if (cloudRunResult.success && cloudRunResult.embedding) {
          const embedding = cloudRunResult.embedding;
          this.saveToCache(cacheKey, embedding);
          aiLogger.debug(
            `Cloud Run 임베딩 완료 (${cloudRunResult.processingTime}ms)`
          );
          return embedding;
        } else {
          throw new Error(cloudRunResult.error || 'Cloud Run 임베딩 실패');
        }
      } else {
        throw new Error(result.error || 'Cloud Run 프록시 오류');
      }
    } catch (error) {
      aiLogger.error('Cloud Run 임베딩 생성 실패:', error);
      throw error; // No fallback
    }
  }

  /**
   * 배치 임베딩 생성 (Cloud Run Only)
   */
  async createBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'mistral-embed';

    if (!isCloudRunEnabled()) {
      throw new Error('Cloud Run AI 서비스가 활성화되지 않았습니다.');
    }

    const validTexts = texts.filter((text) => text && text.trim().length > 0);
    if (validTexts.length === 0) return [];

    const results: (number[] | null)[] = new Array(texts.length);
    const toProcess: { index: number; text: string }[] = [];

    // 캐시 확인 및 작업 분류
    texts.forEach((text, index) => {
      if (!text || text.trim().length === 0) {
        results[index] = new Array(dimension).fill(0);
        return;
      }

      const truncatedText = text.substring(0, 2000);
      const cacheKey = `cloudrun_${dimension}_${truncatedText}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        this.cacheHits++;
        results[index] = cached;
      } else {
        this.cacheMisses++;
        toProcess.push({ index, text: truncatedText });
      }
    });

    // Cloud Run 요청
    if (toProcess.length > 0) {
      try {
        aiLogger.debug(`Cloud Run 배치 임베딩 요청... (${toProcess.length}개)`);

        const result = await proxyToCloudRun({
          path: '/api/ai/embedding/batch',
          method: 'POST',
          body: {
            texts: toProcess.map((item) => item.text),
            options: { dimension, model },
          },
          timeout: 30000,
        });

        if (result.success && result.data) {
          const data = result.data as {
            success: boolean;
            embeddings?: number[][];
            error?: string;
          };
          if (data.success && data.embeddings) {
            data.embeddings.forEach((embedding, i) => {
              const item = toProcess[i];
              if (!item) return;

              const cacheKey = `cloudrun_${dimension}_${item.text}`;
              this.saveToCache(cacheKey, embedding);
              results[item.index] = embedding;
            });
          } else {
            throw new Error(data.error || 'Cloud Run 배치 실패');
          }
        } else {
          throw new Error(result.error || 'Cloud Run 프록시 통신 실패');
        }
      } catch (error) {
        aiLogger.error('Cloud Run 배치 임베딩 실패:', error);
        throw error; // No fallback
      }
    }

    return results.filter((r): r is number[] => r !== null);
  }

  // === Cache Methods ===

  private getFromCache(key: string): number[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return cached.embedding;
  }

  private saveToCache(key: string, embedding: number[]): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { embedding, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    aiLogger.info('임베딩 캐시 초기화됨');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hits: this.cacheHits,
      misses: this.cacheMisses,
    };
  }
}

export const embeddingService = new EmbeddingService();
