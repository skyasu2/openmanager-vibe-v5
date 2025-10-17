/**
 * 🧠 쿼리 복잡도 분석기
 *
 * 쿼리의 복잡도를 분석하여 최적의 AI 엔진을 자동 선택
 */

export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  recommendedEngine: 'local-rag' | 'google-ai';
  confidence: number;
  features: {
    length: number;
    hasCode: boolean;
    hasMultipleQuestions: boolean;
    requiresReasoning: boolean;
    isFactual: boolean;
    language: 'ko' | 'en' | 'mixed';
    keywords: string[];
  };
  estimatedResponseTime: {
    local: number;
    googleAI: number;
  };
}

export class QueryComplexityAnalyzer {
  private static readonly COMPLEXITY_RULES = {
    // 단순 쿼리 패턴 (Local RAG 적합)
    simple: [
      /^(무엇|어떤|어떻게|왜|언제|누가|어디)/,
      /^(what|which|how|why|when|who|where)/i,
      /서버.*상태/,
      /설정.*방법/,
      /에러.*해결/,
    ],

    // 복잡한 쿼리 패턴 (Google AI 적합)
    complex: [
      /분석.*제안/,
      /비교.*평가/,
      /설계.*구현/,
      /최적화.*방안/,
      /전략.*수립/,
    ],
  };

  private static readonly KEYWORD_WEIGHTS = {
    // Local RAG에 유리한 키워드
    local: {
      서버: 0.8,
      상태: 0.7,
      설정: 0.6,
      에러: 0.7,
      로그: 0.8,
      CPU: 0.9,
      메모리: 0.9,
      모니터링: 0.8,
    },

    // Google AI에 유리한 키워드
    googleAI: {
      분석: 0.8,
      최적화: 0.9,
      설계: 0.9,
      구현: 0.8,
      비교: 0.7,
      평가: 0.8,
      전략: 0.9,
      아키텍처: 0.9,
    },
  };

  /**
   * 🔍 쿼리 복잡도 분석
   */
  static analyze(query: string): QueryAnalysis {
    const features = this.extractFeatures(query);
    const complexity = this.calculateComplexity(query, features);
    const recommendedEngine = this.recommendEngine(complexity, features);
    const confidence = this.calculateConfidence(
      query,
      features,
      recommendedEngine
    );

    return {
      complexity,
      recommendedEngine,
      confidence,
      features,
      estimatedResponseTime: {
        local: this.estimateLocalTime(query, features),
        googleAI: this.estimateGoogleAITime(query, features),
      },
    };
  }

  /**
   * 📊 특징 추출
   */
  private static extractFeatures(query: string): QueryAnalysis['features'] {
    return {
      length: query.length,
      hasCode: /```|`|<code>|function|class|const|let|var/.test(query),
      hasMultipleQuestions: (query.match(/\?|？/g) || []).length > 1,
      requiresReasoning: /왜|이유|원인|분석|평가|비교/.test(query),
      isFactual: /무엇|정의|설명|방법/.test(query),
      language: this.detectLanguage(query),
      keywords: this.extractKeywords(query),
    };
  }

  /**
   * 🎯 복잡도 계산
   */
  private static calculateComplexity(
    query: string,
    features: QueryAnalysis['features']
  ): QueryAnalysis['complexity'] {
    let score = 0;

    // 길이 기반 점수
    if (features.length > 200) score += 2;
    else if (features.length > 100) score += 1;

    // 특징 기반 점수
    if (features.hasCode) score += 2;
    if (features.hasMultipleQuestions) score += 2;
    if (features.requiresReasoning) score += 3;
    if (!features.isFactual) score += 1;

    // 패턴 매칭
    if (this.COMPLEXITY_RULES.complex.some((pattern) => pattern.test(query))) {
      score += 3;
    }
    if (this.COMPLEXITY_RULES.simple.some((pattern) => pattern.test(query))) {
      score -= 2;
    }

    // 복잡도 결정
    if (score <= 2) return 'simple';
    if (score <= 5) return 'medium';
    return 'complex';
  }

  /**
   * 🤖 엔진 추천
   */
  private static recommendEngine(
    complexity: QueryAnalysis['complexity'],
    features: QueryAnalysis['features']
  ): 'local-rag' | 'google-ai' {
    // 키워드 기반 점수 계산
    let localScore = 0;
    let googleAIScore = 0;

    features.keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();

      Object.entries(this.KEYWORD_WEIGHTS.local).forEach(([key, weight]) => {
        if (lowerKeyword.includes(key)) localScore += weight;
      });

      Object.entries(this.KEYWORD_WEIGHTS.googleAI).forEach(([key, weight]) => {
        if (lowerKeyword.includes(key)) googleAIScore += weight;
      });
    });

    // 복잡도에 따른 기본 추천
    if (complexity === 'simple' && localScore >= googleAIScore) {
      return 'local-rag';
    }

    if (complexity === 'complex' || googleAIScore > localScore * 1.5) {
      return 'google-ai';
    }

    // 중간 복잡도는 점수 기반
    return localScore > googleAIScore ? 'local-rag' : 'google-ai';
  }

  /**
   * 📊 신뢰도 계산
   */
  private static calculateConfidence(
    query: string,
    features: QueryAnalysis['features'],
    recommendedEngine: 'local-rag' | 'google-ai'
  ): number {
    let confidence = 0.5; // 기본 신뢰도

    // 명확한 패턴 매칭
    if (recommendedEngine === 'local-rag') {
      if (this.COMPLEXITY_RULES.simple.some((pattern) => pattern.test(query))) {
        confidence += 0.3;
      }
      if (features.keywords.some((k) => k in this.KEYWORD_WEIGHTS.local)) {
        confidence += 0.2;
      }
    } else {
      if (
        this.COMPLEXITY_RULES.complex.some((pattern) => pattern.test(query))
      ) {
        confidence += 0.3;
      }
      if (features.keywords.some((k) => k in this.KEYWORD_WEIGHTS.googleAI)) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * 🌐 언어 감지
   */
  private static detectLanguage(query: string): 'ko' | 'en' | 'mixed' {
    const koreanChars = (query.match(/[가-힣]/g) || []).length;
    const englishChars = (query.match(/[a-zA-Z]/g) || []).length;

    const totalChars = koreanChars + englishChars;
    if (totalChars === 0) return 'ko'; // 기본값

    const koreanRatio = koreanChars / totalChars;

    if (koreanRatio > 0.8) return 'ko';
    if (koreanRatio < 0.2) return 'en';
    return 'mixed';
  }

  /**
   * 🔑 키워드 추출
   */
  private static extractKeywords(query: string): string[] {
    // 간단한 키워드 추출 (실제로는 더 정교한 NLP 필요)
    const words = query
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());

    // 중복 제거
    return [...new Set(words)];
  }

  /**
   * ⏱️ Local 응답 시간 예측
   */
  private static estimateLocalTime(
    query: string,
    features: QueryAnalysis['features']
  ): number {
    let baseTime = 50; // 기본 50ms

    // RAG 검색 시간
    baseTime += features.keywords.length * 10;

    // 응답 생성 시간
    if (features.length > 100) baseTime += 20;

    return baseTime;
  }

  /**
   * ⏱️ Google AI 응답 시간 예측
   */
  private static estimateGoogleAITime(
    query: string,
    features: QueryAnalysis['features']
  ): number {
    let baseTime = 300; // 기본 300ms (네트워크 지연)

    // 토큰 수에 따른 시간
    baseTime += Math.floor(features.length / 4) * 2; // 대략적인 토큰 수

    // 복잡도에 따른 추가 시간
    if (features.requiresReasoning) baseTime += 100;
    if (features.hasCode) baseTime += 50;

    return baseTime;
  }
}
