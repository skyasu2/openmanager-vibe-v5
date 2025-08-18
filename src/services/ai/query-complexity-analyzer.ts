/**
 * 🧠 쿼리 복잡도 분석기
 *
 * 쿼리의 복잡도를 분석하여 적절한 AI 엔진을 자동으로 선택합니다.
 * 복잡도 점수: 0-100 (0=매우 간단, 100=매우 복잡)
 */

export interface ComplexityScore {
  score: number;
  factors: {
    length: number;
    keywords: number;
    patterns: number;
    context: number;
    language: number;
  };
  recommendation: 'local' | 'google-ai' | 'hybrid';
  confidence: number;
}

export class QueryComplexityAnalyzer {
  // 복잡한 쿼리를 나타내는 키워드
  private static readonly COMPLEX_KEYWORDS = [
    '분석',
    '비교',
    '예측',
    '추론',
    '설명',
    '이유',
    '왜',
    '어떻게',
    '전략',
    '계획',
    '최적화',
    '개선',
    '추천',
    '제안',
    '평가',
    'analyze',
    'compare',
    'predict',
    'explain',
    'why',
    'how',
    'strategy',
    'optimize',
    'recommend',
    'evaluate',
  ];

  // 간단한 쿼리를 나타내는 키워드
  private static readonly SIMPLE_KEYWORDS = [
    '상태',
    '목록',
    '개수',
    '이름',
    '값',
    '현재',
    '보기',
    'status',
    'list',
    'count',
    'name',
    'value',
    'current',
    'show',
  ];

  // 기술적 패턴 (로컬 RAG가 더 적합)
  private static readonly TECHNICAL_PATTERNS = [
    /서버\s*(상태|메트릭|성능)/,
    /CPU|메모리|디스크|네트워크/,
    /API|엔드포인트|함수/,
    /데이터베이스|쿼리|인덱스/,
    /로그|에러|경고/,
  ];

  /**
   * 쿼리 복잡도 분석
   */
  static analyze(
    query: string,
    context?: {
      previousQueries?: string[];
      userIntent?: string;
      hasServerData?: boolean;
    }
  ): ComplexityScore {
    const factors = {
      length: this.analyzeLengthComplexity(query),
      keywords: this.analyzeKeywordComplexity(query),
      patterns: this.analyzePatternComplexity(query),
      context: this.analyzeContextComplexity(context),
      language: this.analyzeLanguageComplexity(query),
    };

    // 가중치를 적용한 종합 점수 계산
    const score = Math.round(
      factors.length * 0.15 +
        factors.keywords * 0.25 +
        factors.patterns * 0.25 +
        factors.context * 0.2 +
        factors.language * 0.15
    );

    // 엔진 추천
    const recommendation = this.recommendEngine(score, factors);
    const confidence = this.calculateConfidence(factors);

    return {
      score,
      factors,
      recommendation,
      confidence,
    };
  }

  /**
   * 길이 기반 복잡도 (0-100)
   */
  private static analyzeLengthComplexity(query: string): number {
    const length = query.length;

    if (length < 20) return 10;
    if (length < 50) return 25;
    if (length < 100) return 50;
    if (length < 200) return 75;
    return 90;
  }

  /**
   * 키워드 기반 복잡도 (0-100)
   */
  private static analyzeKeywordComplexity(query: string): number {
    const lowerQuery = query.toLowerCase();
    let complexScore = 0;
    let simpleScore = 0;

    // 복잡한 키워드 검사
    for (const keyword of this.COMPLEX_KEYWORDS) {
      if (lowerQuery.includes(keyword)) {
        complexScore += 15;
      }
    }

    // 간단한 키워드 검사
    for (const keyword of this.SIMPLE_KEYWORDS) {
      if (lowerQuery.includes(keyword)) {
        simpleScore += 10;
      }
    }

    // 복잡도 점수 계산 (복잡한 키워드가 우선)
    const score = Math.min(100, Math.max(0, complexScore - simpleScore));
    return score;
  }

  /**
   * 패턴 기반 복잡도 (0-100)
   */
  private static analyzePatternComplexity(query: string): number {
    let technicalMatches = 0;

    // 기술적 패턴 매칭
    for (const pattern of this.TECHNICAL_PATTERNS) {
      if (pattern.test(query)) {
        technicalMatches++;
      }
    }

    // 기술적 패턴이 많으면 로컬 RAG가 적합 (낮은 복잡도)
    if (technicalMatches >= 2) return 20;
    if (technicalMatches === 1) return 40;

    // 질문 패턴 분석
    const questionPatterns = /\?|어떻게|왜|무엇|언제|어디|누가/g;
    const questions = query.match(questionPatterns)?.length || 0;

    if (questions >= 3) return 80;
    if (questions >= 2) return 60;
    if (questions >= 1) return 40;

    return 30;
  }

  /**
   * 컨텍스트 기반 복잡도 (0-100)
   */
  private static analyzeContextComplexity(context?: {
    previousQueries?: string[];
    userIntent?: string;
    hasServerData?: boolean;
  }): number {
    if (!context) return 0;

    let score = 0;

    // 이전 쿼리가 많으면 복잡한 대화
    if (context.previousQueries && context.previousQueries.length > 3) {
      score += 30;
    }

    // 사용자 의도가 복잡한 경우
    if (context.userIntent && context.userIntent.length > 50) {
      score += 20;
    }

    // 서버 데이터가 있으면 로컬 처리 가능
    if (context.hasServerData) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 언어 복잡도 분석 (0-100)
   */
  private static analyzeLanguageComplexity(query: string): number {
    // 한글과 영어 혼용
    const hasKorean = /[가-힣]/.test(query);
    const hasEnglish = /[a-zA-Z]/.test(query);
    const mixedLanguage = hasKorean && hasEnglish;

    // 특수문자 및 숫자
    const hasSpecialChars = /[^가-힣a-zA-Z0-9\s.,?!]/.test(query);
    const hasNumbers = /\d/.test(query);

    let score = 30; // 기본 점수

    if (mixedLanguage) score += 20;
    if (hasSpecialChars) score += 15;
    if (hasNumbers) score += 10;

    // 문장 구조 복잡도
    const sentences = query.split(/[.!?]/).filter((s) => s.trim().length > 0);
    if (sentences.length > 2) score += 20;

    return Math.min(100, score);
  }

  /**
   * 엔진 추천
   */
  private static recommendEngine(
    score: number,
    factors: ComplexityScore['factors']
  ): 'local' | 'google-ai' | 'hybrid' {
    // 기술적 패턴이 강하면 로컬 우선
    if (factors.patterns <= 30 && factors.context <= 30) {
      return 'local';
    }

    // 매우 복잡한 쿼리는 Google AI
    if (score >= 70) {
      return 'google-ai';
    }

    // 중간 복잡도는 하이브리드 (로컬 먼저, 실패 시 Google AI)
    if (score >= 40) {
      return 'hybrid';
    }

    // 간단한 쿼리는 로컬
    return 'local';
  }

  /**
   * 신뢰도 계산
   */
  private static calculateConfidence(
    factors: ComplexityScore['factors']
  ): number {
    // 각 요소의 일관성 검사
    const values = Object.values(factors);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    // 표준편차가 낮을수록 높은 신뢰도
    const confidence = Math.max(0.5, Math.min(0.95, 1 - stdDev / 50));

    return Math.round(confidence * 100) / 100;
  }

  /**
   * 쿼리 최적화 제안
   */
  static optimizeQuery(query: string, complexity: ComplexityScore): string {
    if (complexity.score < 30) {
      // 이미 간단한 쿼리
      return query;
    }

    let optimized = query;

    // 불필요한 공백 제거
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // 중복 키워드 제거
    const words = optimized.split(' ');
    const uniqueWords = [...new Set(words)];
    if (words.length > uniqueWords.length * 1.5) {
      optimized = uniqueWords.join(' ');
    }

    return optimized;
  }
}
