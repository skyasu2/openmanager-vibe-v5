/**
 * 🎯 Query Complexity Analyzer
 *
 * @description
 * Analyzes query complexity to determine optimal timeout values.
 * Features:
 * - Multi-factor complexity scoring
 * - Dynamic timeout calculation
 * - Provider requirement detection
 * - Complexity level classification
 *
 * @version 1.0.0
 * @date 2025-11-21
 */

/**
 * 🎯 Complexity Level
 */
export enum ComplexityLevel {
  SIMPLE = 'simple', // < 20 score
  MEDIUM = 'medium', // 20-50 score
  COMPLEX = 'complex', // 50-75 score
  VERY_COMPLEX = 'very_complex', // > 75 score
}

/**
 * 🎯 Query Complexity Result
 */
export interface QueryComplexity {
  score: number; // 0-100
  level: ComplexityLevel;
  estimatedTime: number; // milliseconds
  recommendedTimeout: number; // milliseconds
  factors: {
    length: number; // 0-30
    keywords: number; // 0-20
    context: number; // 0-25
    multiStep: number; // 0-25
  };
  requiresRAG: boolean;
  requiresML: boolean;
  requiresNLP: boolean;
}

/**
 * 🎯 Analysis Options
 */
export interface AnalysisOptions {
  hasContext?: boolean;
  requiresRAG?: boolean;
  requiresML?: boolean;
  requiresNLP?: boolean;
  customKeywords?: string[];
}

/**
 * 📊 Query Complexity Analyzer
 */
export class QueryComplexityAnalyzer {
  /**
   * 🔑 Korean Keywords (High complexity indicators)
   */
  private static readonly KOREAN_KEYWORDS = [
    '분석',
    '비교',
    '예측',
    '추천',
    '설명',
    '원인',
    '해결',
    '최적화',
    '검토',
    '진단',
    '평가',
    '조사',
    '연구',
    '탐색',
    '발견',
    '식별',
  ];

  /**
   * 🔑 Technical Keywords (High complexity indicators)
   */
  private static readonly TECHNICAL_KEYWORDS = [
    'analyze',
    'compare',
    'predict',
    'recommend',
    'explain',
    'cause',
    'solve',
    'optimize',
    'review',
    'diagnose',
    'evaluate',
    'investigate',
    'research',
    'explore',
    'discover',
    'identify',
    'performance',
    'memory',
    'cpu',
    'network',
    'error',
    'bug',
    'issue',
    'problem',
  ];

  /**
   * 🔑 Multi-step Indicators
   */
  private static readonly MULTI_STEP_INDICATORS = [
    '그리고',
    '그다음',
    '이후',
    '다음으로',
    '그런데',
    '또한',
    '뿐만아니라',
    'and then',
    'after that',
    'next',
    'also',
    'furthermore',
    'moreover',
    'additionally',
    '1.',
    '2.',
    '3.',
    'step',
    'first',
    'second',
    'finally',
  ];

  /**
   * 🎯 Main Analysis Method
   */
  static analyze(
    query: string,
    options: AnalysisOptions = {}
  ): QueryComplexity {
    const { hasContext, requiresRAG, requiresML, requiresNLP, customKeywords } =
      options;

    // Calculate complexity factors
    const lengthScore = QueryComplexityAnalyzer.calculateLengthScore(query);
    const keywordScore = QueryComplexityAnalyzer.calculateKeywordScore(
      query,
      customKeywords
    );
    const contextScore = hasContext ? 25 : 0;
    const multiStepScore =
      QueryComplexityAnalyzer.calculateMultiStepScore(query);

    // Total complexity score (0-100)
    const totalScore =
      lengthScore + keywordScore + contextScore + multiStepScore;

    // Determine complexity level
    const level = QueryComplexityAnalyzer.getComplexityLevel(totalScore);

    // Calculate estimated time and timeout
    const baseTime = QueryComplexityAnalyzer.getBaseTime(level);
    const providerTime = QueryComplexityAnalyzer.calculateProviderTime(
      requiresRAG,
      requiresML,
      requiresNLP
    );
    const estimatedTime = baseTime + providerTime;
    const recommendedTimeout = Math.min(estimatedTime * 3, 30000); // Max 30s

    return {
      score: totalScore,
      level,
      estimatedTime,
      recommendedTimeout,
      factors: {
        length: lengthScore,
        keywords: keywordScore,
        context: contextScore,
        multiStep: multiStepScore,
      },
      requiresRAG: requiresRAG ?? false,
      requiresML: requiresML ?? false,
      requiresNLP: requiresNLP ?? false,
    };
  }

  /**
   * 📏 Calculate Length Score (0-30)
   */
  private static calculateLengthScore(query: string): number {
    const length = query.trim().length;
    return Math.min(30, length / 10); // 1 point per 10 characters, max 30
  }

  /**
   * 🔑 Calculate Keyword Score (0-20)
   */
  private static calculateKeywordScore(
    query: string,
    customKeywords?: string[]
  ): number {
    const lowerQuery = query.toLowerCase();
    let keywordCount = 0;

    // Check Korean keywords
    for (const keyword of QueryComplexityAnalyzer.KOREAN_KEYWORDS) {
      if (query.includes(keyword)) keywordCount++;
    }

    // Check technical keywords
    for (const keyword of QueryComplexityAnalyzer.TECHNICAL_KEYWORDS) {
      if (lowerQuery.includes(keyword)) keywordCount++;
    }

    // Check custom keywords
    if (customKeywords) {
      for (const keyword of customKeywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) keywordCount++;
      }
    }

    return Math.min(20, keywordCount * 5); // 5 points per keyword, max 20
  }

  /**
   * 🔢 Calculate Multi-step Score (0-25)
   */
  private static calculateMultiStepScore(query: string): number {
    const lowerQuery = query.toLowerCase();
    let multiStepCount = 0;

    for (const indicator of QueryComplexityAnalyzer.MULTI_STEP_INDICATORS) {
      if (indicator.includes('.')) {
        // Check for numbered lists (1. 2. 3.)
        if (query.includes(indicator)) multiStepCount++;
      } else {
        if (lowerQuery.includes(indicator.toLowerCase())) multiStepCount++;
      }
    }

    return multiStepCount > 0 ? 25 : 0; // All or nothing
  }

  /**
   * 🎯 Get Complexity Level from Score
   */
  private static getComplexityLevel(score: number): ComplexityLevel {
    if (score < 20) return ComplexityLevel.SIMPLE;
    if (score < 50) return ComplexityLevel.MEDIUM;
    if (score < 75) return ComplexityLevel.COMPLEX;
    return ComplexityLevel.VERY_COMPLEX;
  }

  /**
   * ⏱️ Get Base Time for Complexity Level
   */
  private static getBaseTime(level: ComplexityLevel): number {
    const baseTimeMap: Record<ComplexityLevel, number> = {
      [ComplexityLevel.SIMPLE]: 100, // 100ms
      [ComplexityLevel.MEDIUM]: 300, // 300ms
      [ComplexityLevel.COMPLEX]: 1000, // 1s
      [ComplexityLevel.VERY_COMPLEX]: 3000, // 3s
    };

    return baseTimeMap[level];
  }

  /**
   * 🔌 Calculate Additional Provider Time
   */
  private static calculateProviderTime(
    requiresRAG?: boolean,
    requiresML?: boolean,
    requiresNLP?: boolean
  ): number {
    let providerTime = 0;

    if (requiresRAG) providerTime += 200; // RAG: +200ms
    if (requiresML) providerTime += 500; // ML: +500ms
    if (requiresNLP) providerTime += 500; // NLP: +500ms

    return providerTime;
  }

  /**
   * 🎯 Detect Provider Requirements from Query
   */
  static detectProviderRequirements(query: string): {
    requiresRAG: boolean;
    requiresML: boolean;
    requiresNLP: boolean;
  } {
    const lowerQuery = query.toLowerCase();

    // RAG indicators: specific data requests, document search
    const requiresRAG =
      lowerQuery.includes('찾아') ||
      lowerQuery.includes('검색') ||
      lowerQuery.includes('문서') ||
      lowerQuery.includes('search') ||
      lowerQuery.includes('find') ||
      lowerQuery.includes('document');

    // ML indicators: prediction, trend analysis, anomaly detection
    const requiresML =
      lowerQuery.includes('예측') ||
      lowerQuery.includes('추세') ||
      lowerQuery.includes('이상') ||
      lowerQuery.includes('패턴') ||
      lowerQuery.includes('predict') ||
      lowerQuery.includes('trend') ||
      lowerQuery.includes('anomaly') ||
      lowerQuery.includes('pattern');

    // NLP indicators: Korean language processing, semantic analysis
    const requiresNLP = /[\uac00-\ud7af]/.test(query) && query.length > 20; // Korean text with significant length

    return { requiresRAG, requiresML, requiresNLP };
  }

  /**
   * 🎯 Smart Analysis (Auto-detect providers)
   */
  static smartAnalyze(
    query: string,
    options: Omit<
      AnalysisOptions,
      'requiresRAG' | 'requiresML' | 'requiresNLP'
    > = {}
  ): QueryComplexity {
    const providers = QueryComplexityAnalyzer.detectProviderRequirements(query);

    return QueryComplexityAnalyzer.analyze(query, {
      ...options,
      ...providers,
    });
  }

  /**
   * 📊 Get Timeout Recommendation (Simplified helper)
   */
  static getTimeout(query: string, hasContext: boolean = false): number {
    const complexity = QueryComplexityAnalyzer.smartAnalyze(query, {
      hasContext,
    });
    return complexity.recommendedTimeout;
  }

  /**
   * 📊 Get Estimated Time (Simplified helper)
   */
  static getEstimatedTime(query: string, hasContext: boolean = false): number {
    const complexity = QueryComplexityAnalyzer.smartAnalyze(query, {
      hasContext,
    });
    return complexity.estimatedTime;
  }
}

/**
 * 🎯 Helper function for quick timeout calculation
 */
export function calculateDynamicTimeout(
  query: string,
  hasContext: boolean = false
): number {
  return QueryComplexityAnalyzer.getTimeout(query, hasContext);
}

/**
 * 🎯 Helper function for quick complexity analysis
 */
export function analyzeQueryComplexity(
  query: string,
  options?: AnalysisOptions
): QueryComplexity {
  return QueryComplexityAnalyzer.smartAnalyze(query, options || {});
}
