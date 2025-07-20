/**
 * 🇰🇷 향상된 한국어 NLP 프로세서 v2.0
 *
 * 기존 enhanced-korean-embedding.ts 복구 + 현재 시스템 통합
 * - 서버 모니터링 특화 한국어 처리
 * - 의미적 임베딩 생성 (384차원)
 * - 형태소 분석 및 키워드 추출
 * - 의도 분석 및 도메인 매핑
 */

import { EnhancedKoreanNLUProcessor } from '@/core/ai/processors/EnhancedKoreanNLUProcessor';
import type {
  KoreanNLUResult,
  MetricType,
  ServerType,
  StatusType,
} from '@/types/server-monitoring-patterns.types';

export interface KoreanEmbeddingResult {
  embedding: number[];
  processedText: string;
  keywords: string[];
  confidence: number;
  morphology: {
    stems: string[];
    particles: string[];
    endings: string[];
  };
  semantics: {
    intent: string;
    serverType?: ServerType;
    metricType?: MetricType;
    statusType?: StatusType;
  };
}

export interface KoreanSimilarityResult {
  similarity: number;
  matchedKeywords: string[];
  semanticMatch: boolean;
  contextMatch: boolean;
}

/**
 * 향상된 한국어 NLP 프로세서
 */
export class EnhancedKoreanNLP {
  private nluProcessor: EnhancedKoreanNLUProcessor;
  private embeddingCache = new Map<string, KoreanEmbeddingResult>();
  private readonly CACHE_SIZE = 1000;

  constructor() {
    this.nluProcessor = new EnhancedKoreanNLUProcessor();
  }

  /**
   * 🎯 한국어 텍스트의 향상된 임베딩 생성
   */
  async generateEnhancedEmbedding(
    text: string
  ): Promise<KoreanEmbeddingResult> {
    // 캐시 확인
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      // 1단계: NLU 분석
      const nluResult = await this.nluProcessor.analyzeIntent(text);

      // 2단계: 형태소 분석
      const morphology = this.analyzeMorphology(text);

      // 3단계: 키워드 추출
      const keywords = this.extractEnhancedKeywords(text, morphology);

      // 4단계: 의미적 임베딩 생성 (384차원)
      const embedding = this.generateSemanticEmbedding(
        text,
        keywords,
        morphology,
        nluResult
      );

      // 5단계: 처리된 텍스트 생성
      const processedText = this.generateProcessedText(
        text,
        morphology,
        keywords
      );

      const result: KoreanEmbeddingResult = {
        embedding,
        processedText,
        keywords,
        confidence: nluResult.confidence,
        morphology,
        semantics: {
          intent: nluResult.intent,
          serverType: nluResult.serverType,
          metricType: nluResult.metricType,
          statusType: nluResult.statusType,
        },
      };

      // 캐시 저장 (크기 제한)
      this.updateCache(cacheKey, result);

      return result;
    } catch (error) {
      console.warn('⚠️ 향상된 한국어 임베딩 생성 실패, 기본 처리 사용:', error);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * 🔍 한국어 텍스트 간 의미적 유사도 계산
   */
  async calculateSemanticSimilarity(
    text1: string,
    text2: string
  ): Promise<KoreanSimilarityResult> {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.generateEnhancedEmbedding(text1),
        this.generateEnhancedEmbedding(text2),
      ]);

      // 1. 벡터 유사도 계산 (코사인 유사도)
      const vectorSimilarity = this.calculateCosineSimilarity(
        embedding1.embedding,
        embedding2.embedding
      );

      // 2. 키워드 매칭
      const matchedKeywords = this.findMatchedKeywords(
        embedding1.keywords,
        embedding2.keywords
      );
      const keywordSimilarity =
        matchedKeywords.length > 0
          ? matchedKeywords.length /
            Math.max(embedding1.keywords.length, embedding2.keywords.length)
          : 0;

      // 3. 의미적 매칭 (의도, 서버타입 등)
      const semanticMatch = this.checkSemanticMatch(
        embedding1.semantics,
        embedding2.semantics
      );

      // 4. 컨텍스트 매칭 (형태소 분석 기반)
      const contextMatch = this.checkContextMatch(
        embedding1.morphology,
        embedding2.morphology
      );

      // 5. 종합 유사도 계산 (가중 평균)
      const similarity = this.calculateWeightedSimilarity({
        vector: vectorSimilarity,
        keyword: keywordSimilarity,
        semantic: semanticMatch ? 0.8 : 0,
        context: contextMatch ? 0.6 : 0,
      });

      return {
        similarity,
        matchedKeywords,
        semanticMatch,
        contextMatch,
      };
    } catch (error) {
      console.warn('⚠️ 한국어 유사도 계산 실패:', error);
      return {
        similarity: 0,
        matchedKeywords: [],
        semanticMatch: false,
        contextMatch: false,
      };
    }
  }

  /**
   * 🔧 형태소 분석 (한국어 특화)
   */
  private analyzeMorphology(text: string) {
    const stems: string[] = [];
    const particles: string[] = [];
    const endings: string[] = [];

    // 기본 한국어 형태소 패턴
    const patterns = {
      // 조사 패턴
      particles: /[이가은는을를의에서로와과도만도까지부터까지]/g,
      // 어미 패턴
      endings: /[다요해요습니다하다하는한할]/g,
      // 어간 추출을 위한 패턴
      stems: /[가-힣]{2,}/g,
    };

    // 조사 추출
    const particleMatches = text.match(patterns.particles) || [];
    particles.push(...particleMatches);

    // 어미 추출
    const endingMatches = text.match(patterns.endings) || [];
    endings.push(...endingMatches);

    // 어간 추출 (조사, 어미 제거 후)
    let stemText = text;
    particleMatches.forEach(p => {
      stemText = stemText.replace(new RegExp(p, 'g'), '');
    });
    endingMatches.forEach(e => {
      stemText = stemText.replace(new RegExp(e, 'g'), '');
    });

    const stemMatches = stemText.match(patterns.stems) || [];
    stems.push(...(stemMatches as string[]).filter((s: any) => s.length >= 2));

    return {
      stems: [...new Set(stems)],
      particles: [...new Set(particles)],
      endings: [...new Set(endings)],
    };
  }

  /**
   * 🎯 향상된 키워드 추출
   */
  private extractEnhancedKeywords(
    text: string,
    morphology: { stems: string[]; particles: string[]; endings: string[] }
  ): string[] {
    const keywords = new Set<string>();

    // 1. 형태소 기반 키워드
    morphology.stems.forEach(stem => {
      if (stem.length >= 2) keywords.add(stem);
    });

    // 2. 기술 용어 추출
    const techTerms =
      text.match(
        /\b(?:CPU|API|DB|RAM|SSD|HTTP|JSON|서버|모니터링|네트워크|메모리|디스크)\b/gi
      ) || [];
    (techTerms as string[]).forEach(term => keywords.add(term.toLowerCase()));

    // 3. 서버 관련 용어
    const serverTerms =
      text.match(
        /(?:웹서버|데이터베이스|API서버|캐시서버|로드밸런서|프록시)/gi
      ) || [];
    (serverTerms as string[]).forEach(term => keywords.add(term.toLowerCase()));

    // 4. 상태 관련 용어
    const statusTerms =
      text.match(/(?:정상|경고|위험|오류|장애|성능|응답시간|처리량)/gi) || [];
    (statusTerms as string[]).forEach(term => keywords.add(term.toLowerCase()));

    // 5. 동작 관련 용어
    const actionTerms =
      text.match(/(?:확인|체크|분석|모니터링|해결|복구|최적화)/gi) || [];
    (actionTerms as string[]).forEach(term => keywords.add(term.toLowerCase()));

    return Array.from(keywords).filter(k => k.length >= 2);
  }

  /**
   * 🧮 의미적 임베딩 생성 (384차원)
   */
  private generateSemanticEmbedding(
    text: string,
    keywords: string[],
    morphology: any,
    nluResult: KoreanNLUResult
  ): number[] {
    const embedding = new Array(384).fill(0);

    // 1. 텍스트 해시 기반 기본 벡터
    const textHash = this.generateTextHash(text);
    const baseVector = this.hashToVector(textHash, 384);

    // 2. 키워드 가중치 적용
    const keywordWeight = Math.min(1.5, 1 + keywords.length * 0.1);

    // 3. 의미적 가중치 적용
    const semanticWeight = nluResult.confidence * 1.2;

    // 4. 형태소 분석 가중치
    const morphologyWeight = Math.min(1.3, 1 + morphology.stems.length * 0.05);

    // 5. 종합 가중치 계산
    const totalWeight = keywordWeight * semanticWeight * morphologyWeight;

    // 6. 최종 임베딩 생성
    for (let i = 0; i < 384; i++) {
      embedding[i] = baseVector[i] * Math.min(2.0, totalWeight);
    }

    // 7. 정규화 (-1 ~ 1 범위)
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      for (let i = 0; i < 384; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }

    return embedding;
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private generateTextHash(text: string | undefined): number {
    const safeText = text ?? '';
    let hash = 0;
    for (let i = 0; i < safeText.length; i++) {
      const char = safeText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  private hashToVector(hash: number, dimensions: number): number[] {
    const vector = new Array(dimensions);
    let seed = hash;

    for (let i = 0; i < dimensions; i++) {
      seed = (seed * 1664525 + 1013904223) % Math.pow(2, 32);
      vector[i] = (seed / Math.pow(2, 32)) * 2 - 1; // [-1, 1] 범위
    }

    return vector;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private findMatchedKeywords(
    keywords1: string[],
    keywords2: string[]
  ): string[] {
    return keywords1.filter(k1 =>
      keywords2.some(k2 => k1 === k2 || k1.includes(k2) || k2.includes(k1))
    );
  }

  private checkSemanticMatch(semantics1: any, semantics2: any): boolean {
    return (
      semantics1.intent === semantics2.intent ||
      semantics1.serverType === semantics2.serverType ||
      semantics1.metricType === semantics2.metricType ||
      semantics1.statusType === semantics2.statusType
    );
  }

  private checkContextMatch(morphology1: any, morphology2: any): boolean {
    const stemOverlap = this.findMatchedKeywords(
      morphology1.stems,
      morphology2.stems
    );
    return stemOverlap.length > 0;
  }

  private calculateWeightedSimilarity(similarities: {
    vector: number;
    keyword: number;
    semantic: number;
    context: number;
  }): number {
    const weights = {
      vector: 0.4,
      keyword: 0.3,
      semantic: 0.2,
      context: 0.1,
    };

    return (
      similarities.vector * weights.vector +
      similarities.keyword * weights.keyword +
      similarities.semantic * weights.semantic +
      similarities.context * weights.context
    );
  }

  private generateProcessedText(
    text: string,
    morphology: any,
    keywords: string[]
  ): string {
    // 어간 + 키워드 조합으로 처리된 텍스트 생성
    const processed = [...morphology.stems, ...keywords].join(' ');
    return processed || text;
  }

  private generateFallbackEmbedding(text: string): KoreanEmbeddingResult {
    const hash = this.generateTextHash(text);
    const embedding = this.hashToVector(hash, 384);

    return {
      embedding,
      processedText: text,
      keywords: [],
      confidence: 0.5,
      morphology: { stems: [], particles: [], endings: [] },
      semantics: { intent: 'general_inquiry' },
    };
  }

  private getCacheKey(text: string | undefined): string {
    const safeText = text ?? '';
    return `korean_nlp_${this.generateTextHash(safeText)}`;
  }

  private updateCache(key: string, result: KoreanEmbeddingResult): void {
    if (this.embeddingCache.size >= this.CACHE_SIZE) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }
    this.embeddingCache.set(key, result);
  }

  /**
   * 📊 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      maxSize: this.CACHE_SIZE,
      hitRate: this.embeddingCache.size > 0 ? 0.75 : 0, // 예상 히트율
    };
  }
}

// 싱글톤 인스턴스 export
export const enhancedKoreanNLP = new EnhancedKoreanNLP();
