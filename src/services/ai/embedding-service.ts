/**
 * 임베딩 서비스 - Cloud Run 프록시 기반 (Hybrid Architecture)
 *
 * 설계 원칙:
 * - Vercel = Proxy Only (직접 API 호출 금지)
 * - Cloud Run = AI Processing (Google AI API 호출)
 *
 * 지원 모드:
 * - Cloud Run 프록시 모드 (기본값)
 * - 로컬 임베딩 모드 (Cloud Run 불가 시 fallback)
 *
 * 무료 티어 최적화:
 * - 384차원 벡터 사용 (메모리 절약)
 * - LRU 캐싱으로 중복 요청 방지
 */

import crypto from 'crypto';
import { isCloudRunEnabled, proxyToCloudRun } from '../../lib/ai-proxy/proxy';
import { aiLogger } from '../../lib/logger';

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

interface EmbeddingOptions {
  dimension?: number;
  model?: string;
  useLocal?: boolean; // 로컬 임베딩 강제 사용
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
  private readonly CACHE_TTL = 10800000; // 3시간 (성능 최적화)
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_DIMENSION = 384; // 무료 티어 최적화

  // 캐시 히트율 추적을 위한 카운터
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * 로컬 임베딩 사용 여부 확인
   */
  private shouldUseLocalEmbedding(options: EmbeddingOptions = {}): boolean {
    // 1. 옵션에서 명시적으로 로컬 사용 지정
    if (options.useLocal === true) {
      return true;
    }
    if (options.useLocal === false) {
      return false;
    }

    // 2. 환경변수 확인
    if (process.env.USE_LOCAL_EMBEDDINGS === 'true') {
      return true;
    }

    // 3. Cloud Run이 비활성화되면 로컬 사용
    if (!isCloudRunEnabled()) {
      return true;
    }

    // 4. 기본값: Cloud Run 프록시 사용
    return false;
  }

  /**
   * 로컬 임베딩 생성 - 개선된 의미론적 임베딩
   * TF-IDF + 한국어 특화 + 의미론적 특징 반영
   */
  private generateLocalEmbedding(
    text: string,
    dimension: number = 384
  ): number[] {
    // 텍스트 정규화 및 토큰화
    const normalizedText = text.toLowerCase().trim();

    // 한국어 형태소 분석 시뮬레이션
    const tokens = this.tokenizeKoreanText(normalizedText);

    // TF-IDF 계산을 위한 용어 빈도
    const termFreq = new Map<string, number>();
    tokens.forEach((token) => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });

    // 문서 길이 기반 정규화
    const maxFreq = Math.max(...termFreq.values());
    const normalizedTF = new Map<string, number>();
    termFreq.forEach((freq, term) => {
      normalizedTF.set(term, 0.5 + (0.5 * freq) / maxFreq);
    });

    // 임베딩 차원 동적 조정
    const dynamicDimension = this.getDynamicDimension(
      normalizedText,
      dimension
    );
    const embedding = new Array(dynamicDimension).fill(0);

    // 의미론적 특징 추출
    const semanticFeatures = this.extractSemanticFeatures(
      normalizedText,
      tokens
    );

    // 각 차원별 의미론적 값 계산
    for (let i = 0; i < dynamicDimension; i++) {
      let value = 0;

      // 1. TF-IDF 기반 값
      const termWeight = this.calculateTFIDFWeight(tokens, i);
      value += termWeight * 0.4;

      // 2. 의미론적 특징 반영
      value += semanticFeatures.technicalScore * Math.cos(i * 0.1) * 0.3;
      value += semanticFeatures.sentimentScore * Math.sin(i * 0.2) * 0.2;

      // 3. 문맥 정보 반영
      const contextWeight = this.calculateContextWeight(tokens, i);
      value += contextWeight * 0.1;

      embedding[i] = value;
    }

    // L2 정규화 (단위 벡터)
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude > 0) {
      const normalized = embedding.map((val) => val / magnitude);
      // 원래 차원으로 패딩 또는 자르기
      return this.adjustDimension(normalized, dimension);
    } else {
      // 실패 시 안전한 기본 벡터
      return this.generateFallbackEmbedding(normalizedText, dimension);
    }
  }

  /**
   * 한국어 텍스트 토큰화 (간단한 구현)
   */
  private tokenizeKoreanText(text: string): string[] {
    // 기본 토큰화 + 한국어 조사/어미 처리
    const tokens = text.split(/[\s.,!?;:()[\]{}]+/).filter((t) => t.length > 0);

    // 한국어 불용어 제거
    const stopWords = new Set([
      '이',
      '가',
      '을',
      '를',
      '의',
      '에',
      '는',
      '은',
      '와',
      '과',
      '도',
      '만',
      '까지',
      '부터',
      '로',
      '으로',
    ]);

    return tokens.filter((token) => {
      // 너무 짧거나 불용어 제거
      if (token.length < 2 || stopWords.has(token)) return false;
      // 숫자만 있는 토큰 제거
      if (/^\d+$/.test(token)) return false;
      return true;
    });
  }

  /**
   * 의미론적 특징 추출
   */
  private extractSemanticFeatures(
    text: string,
    tokens: string[]
  ): {
    technicalScore: number;
    sentimentScore: number;
    complexityScore: number;
  } {
    // 기술적 용어 점수
    const technicalTerms = [
      '서버',
      '모니터링',
      'CPU',
      '메모리',
      '성능',
      '오류',
      '로그',
      '데이터베이스',
      'API',
    ];
    const technicalCount = tokens.filter((token) =>
      technicalTerms.some((term) => token.includes(term))
    ).length;
    const technicalScore = Math.min(technicalCount / tokens.length, 1.0);

    // 감정 점수 (긍정/부정)
    const positiveTerms = ['정상', '성공', '완료', '향상', '최적화'];
    const negativeTerms = ['오류', '실패', '문제', '경고', '장애'];
    const positiveCount = tokens.filter((token) =>
      positiveTerms.some((term) => token.includes(term))
    ).length;
    const negativeCount = tokens.filter((token) =>
      negativeTerms.some((term) => token.includes(term))
    ).length;
    const sentimentScore =
      (positiveCount - negativeCount) / Math.max(tokens.length, 1);

    // 복잡도 점수 (텍스트 길이, 고유 단어 비율)
    const uniqueTokens = new Set(tokens).size;
    const complexityScore =
      Math.log(text.length + 1) / 10 + uniqueTokens / tokens.length;

    return { technicalScore, sentimentScore, complexityScore };
  }

  /**
   * TF-IDF 가중치 계산
   */
  private calculateTFIDFWeight(tokens: string[], dimension: number): number {
    const termIndex = dimension % tokens.length;
    const term = tokens[termIndex];

    // 간단한 TF-IDF 시뮬레이션
    const tf = tokens.filter((t) => t === term).length / tokens.length;
    // IDF는 고정값으로 시뮬레이션 (실제로는 문서 집합이 필요)
    const idf = Math.log(100 / (1 + Math.abs((term || '').charCodeAt(0) % 20)));

    return tf * idf;
  }

  /**
   * 문맥 가중치 계산
   */
  private calculateContextWeight(tokens: string[], dimension: number): number {
    if (tokens.length < 2) return 0;

    const idx1 = dimension % tokens.length;
    const idx2 = (dimension + 1) % tokens.length;

    // 인접 단어 간의 문맥적 관련성
    const word1 = tokens[idx1];
    const word2 = tokens[idx2];

    // 단어 길이와 첫 글자 기반 관련성 시뮬레이션
    const safeWord1 = word1 ?? '';
    const safeWord2 = word2 ?? '';
    const lengthSimilarity =
      1 -
      Math.abs(safeWord1.length - safeWord2.length) /
        Math.max(safeWord1.length, safeWord2.length || 1);
    const charSimilarity =
      safeWord1.charCodeAt(0) === safeWord2.charCodeAt(0) ? 0.5 : 0;

    return (lengthSimilarity + charSimilarity) / 2;
  }

  /**
   * 동적 차원 조정
   */
  private getDynamicDimension(text: string, baseDimension: number): number {
    const length = text.length;

    if (length < 50) return Math.floor(baseDimension * 0.67); // 256
    if (length > 200) return Math.floor(baseDimension * 1.33); // 512
    return baseDimension; // 384
  }

  /**
   * 차원 조정 (패딩 또는 자르기)
   */
  private adjustDimension(vector: number[], targetDimension: number): number[] {
    if (vector.length === targetDimension) return vector;

    if (vector.length > targetDimension) {
      // 자르기 (주요 특징 유지)
      return vector.slice(0, targetDimension);
    } else {
      // 패딩 (평균값으로 채우기)
      const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length;
      const padding = new Array(targetDimension - vector.length).fill(
        mean * 0.1
      );
      return [...vector, ...padding];
    }
  }

  /**
   * 실패 시 안전한 기본 임베딩 생성
   */
  private generateFallbackEmbedding(text: string, dimension: number): number[] {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const embedding = new Array(dimension);

    for (let i = 0; i < dimension; i++) {
      const charCode = hash.charCodeAt(i % hash.length);
      embedding[i] = Math.sin(charCode * (i + 1)) / Math.sqrt(dimension);
    }

    return embedding;
  }

  /**
   * 텍스트의 임베딩 벡터 생성
   * Hybrid Architecture: Cloud Run 프록시 또는 로컬 fallback
   */
  async createEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';
    const useLocal = this.shouldUseLocalEmbedding(options);

    // 입력 검증
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다');
    }

    // 텍스트 길이 제한 (토큰 절약)
    const truncatedText = text.substring(0, 2000);

    // 캐시 확인 (로컬/클라우드 구분)
    const cacheKey = `${useLocal ? 'local' : 'cloudrun'}_${dimension}_${truncatedText}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.cacheHits++;
      aiLogger.debug(`캐시에서 ${useLocal ? '로컬' : 'Cloud Run'} 임베딩 반환`);
      return cached;
    }

    // 캐시 미스
    this.cacheMisses++;

    let embedding: number[];

    if (useLocal) {
      // 로컬 임베딩 생성
      aiLogger.debug('로컬 임베딩 생성 중...');
      embedding = this.generateLocalEmbedding(truncatedText, dimension);

      // 캐시에 저장
      this.saveToCache(cacheKey, embedding);

      return embedding;
    } else {
      // Cloud Run 프록시를 통해 임베딩 생성
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
            embedding = cloudRunResult.embedding;

            // 캐시에 저장
            this.saveToCache(cacheKey, embedding);

            aiLogger.debug(
              `Cloud Run 임베딩 완료 (source: ${cloudRunResult.source}, ${cloudRunResult.processingTime}ms)`
            );

            return embedding;
          } else {
            throw new Error(cloudRunResult.error || 'Cloud Run 임베딩 실패');
          }
        } else {
          throw new Error(result.error || 'Cloud Run 프록시 오류');
        }
      } catch (error) {
        aiLogger.error(
          'Cloud Run 임베딩 생성 실패, 로컬 임베딩으로 fallback:',
          error
        );

        // 폴백: 로컬 임베딩 사용
        embedding = this.generateLocalEmbedding(truncatedText, dimension);

        // 로컬 캐시 키로 저장
        const localCacheKey = `local_${dimension}_${truncatedText}`;
        this.saveToCache(localCacheKey, embedding);

        return embedding;
      }
    }
  }

  /**
   * 배치 임베딩 생성 (효율적인 대량 처리)
   * Hybrid Architecture: Cloud Run 프록시 또는 로컬 fallback
   */
  async createBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    const dimension = options.dimension || this.DEFAULT_DIMENSION;
    const model = options.model || 'text-embedding-004';
    const useLocal = this.shouldUseLocalEmbedding(options);

    // 빈 텍스트 필터링
    const validTexts = texts.filter((text) => text && text.trim().length > 0);

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
      const cacheKey = `${useLocal ? 'local' : 'cloudrun'}_${dimension}_${truncatedText}`;
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
      if (useLocal) {
        // 로컬 임베딩 배치 생성
        aiLogger.debug(`로컬 임베딩 배치 생성 중... (${toProcess.length}개)`);

        toProcess.forEach((item) => {
          const embedding = this.generateLocalEmbedding(item.text, dimension);
          const cacheKey = `local_${dimension}_${item.text}`;
          this.saveToCache(cacheKey, embedding);
          results[item.index] = embedding;
        });
      } else {
        // Cloud Run 프록시 배치 호출
        try {
          aiLogger.debug(
            `Cloud Run 배치 임베딩 요청... (${toProcess.length}개)`
          );

          const result = await proxyToCloudRun({
            path: '/api/ai/embedding/batch',
            method: 'POST',
            body: {
              texts: toProcess.map((item) => item.text),
              options: { dimension, model },
            },
            timeout: 30000, // 배치 처리를 위한 긴 타임아웃
          });

          if (result.success && result.data) {
            const cloudRunResult = result.data as {
              success: boolean;
              embeddings?: number[][];
              error?: string;
            };

            if (cloudRunResult.success && cloudRunResult.embeddings) {
              // 결과를 캐시에 저장하고 results 배열에 할당
              cloudRunResult.embeddings.forEach((embedding, i) => {
                const item = toProcess[i];
                if (!item) return;

                const cacheKey = `cloudrun_${dimension}_${item.text}`;
                this.saveToCache(cacheKey, embedding);
                results[item.index] = embedding;
              });
            } else {
              throw new Error(
                cloudRunResult.error || 'Cloud Run 배치 임베딩 실패'
              );
            }
          } else {
            throw new Error(result.error || 'Cloud Run 프록시 오류');
          }
        } catch (error) {
          aiLogger.error(
            'Cloud Run 배치 임베딩 생성 실패, 로컬 임베딩으로 fallback:',
            error
          );

          // 폴백: 로컬 임베딩 사용
          toProcess.forEach((item) => {
            const embedding = this.generateLocalEmbedding(item.text, dimension);
            const cacheKey = `local_${dimension}_${item.text}`;
            this.saveToCache(cacheKey, embedding);
            results[item.index] = embedding;
          });
        }
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
    const hitRate =
      totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

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
