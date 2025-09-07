/**
 * 🎯 AI Quality Assurance Engine
 *
 * 목표: 95% 이상 응답 정확도 보장
 * - 실시간 응답 품질 평가
 * - A/B 테스트 자동화
 * - 응답 일관성 검증
 * - 사용자 피드백 학습
 */

import type { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';
import { QueryComplexityAnalyzer } from './QueryComplexityAnalyzer';

interface QualityMetrics {
  accuracy: number;
  consistency: number;
  relevance: number;
  completeness: number;
  overall: number;
}

interface ResponseEvaluation {
  score: number;
  issues: string[];
  suggestions: string[];
  confidence: number;
}

interface ABTestResult {
  engineA: string;
  engineB: string;
  winnerEngine: string;
  confidenceLevel: number;
  sampleSize: number;
  qualityDifference: number;
}

export class AIQualityAssuranceEngine {
  private qualityHistory: Array<{
    timestamp: number;
    query: string;
    response: string;
    engine: string;
    qualityScore: number;
    userFeedback?: 'positive' | 'negative';
  }> = [];

  private abTests = new Map<
    string,
    {
      testId: string;
      engines: [
        'local-rag' | 'local-ai' | 'google-ai' | 'fallback',
        'local-rag' | 'local-ai' | 'google-ai' | 'fallback',
      ];
      results: Array<{
        query: string;
        responseA: QueryResponse;
        responseB: QueryResponse;
        winner: string;
        timestamp: number;
      }>;
      status: 'running' | 'completed';
    }
  >();

  private qualityBenchmarks = {
    serverMonitoring: {
      keywords: ['서버', '상태', 'CPU', '메모리', '모니터링'],
      expectedAccuracy: 0.92,
      responsePatterns: [
        /서버.*상태/,
        /CPU.*사용률/,
        /메모리.*용량/,
        /모니터링.*결과/,
      ],
    },
    errorDiagnosis: {
      keywords: ['에러', '오류', '문제', '장애', '디버깅'],
      expectedAccuracy: 0.88,
      responsePatterns: [/오류.*원인/, /해결.*방법/, /문제.*분석/],
    },
    performanceAnalysis: {
      keywords: ['성능', '최적화', '분석', '개선'],
      expectedAccuracy: 0.9,
      responsePatterns: [/성능.*분석/, /최적화.*방안/, /개선.*제안/],
    },
  };

  /**
   * 🔍 응답 품질 평가
   */
  async evaluateResponse(
    request: QueryRequest,
    response: QueryResponse
  ): Promise<ResponseEvaluation> {
    const metrics = await this.calculateQualityMetrics(request, response);
    const issues = this.identifyQualityIssues(request, response, metrics);
    const suggestions = this.generateImprovementSuggestions(issues, metrics);

    const overallScore = this.calculateOverallScore(metrics);

    // 품질 이력 저장
    this.qualityHistory.push({
      timestamp: Date.now(),
      query: request.query,
      response: response.response,
      engine: response.engine,
      qualityScore: overallScore,
    });

    return {
      score: overallScore,
      issues,
      suggestions,
      confidence: metrics.overall,
    };
  }

  /**
   * 📊 품질 메트릭 계산
   */
  private async calculateQualityMetrics(
    request: QueryRequest,
    response: QueryResponse
  ): Promise<QualityMetrics> {
    const query = request.query.toLowerCase();
    const responseText = response.response.toLowerCase();

    // 1. 정확도 (도메인별 패턴 매칭)
    const accuracy = this.evaluateAccuracy(query, responseText);

    // 2. 일관성 (이전 응답과 비교)
    const consistency = this.evaluateConsistency(query, responseText);

    // 3. 관련성 (쿼리와 응답의 연관성)
    const relevance = this.evaluateRelevance(query, responseText);

    // 4. 완성도 (응답의 완전성)
    const completeness = this.evaluateCompleteness(query, responseText);

    // 5. 전체 점수
    const overall =
      accuracy * 0.3 + consistency * 0.2 + relevance * 0.3 + completeness * 0.2;

    return {
      accuracy,
      consistency,
      relevance,
      completeness,
      overall,
    };
  }

  /**
   * 🎯 정확도 평가
   */
  private evaluateAccuracy(query: string, response: string): number {
    let maxScore = 0;

    // 도메인별 정확도 계산
    for (const [domain, config] of Object.entries(this.qualityBenchmarks)) {
      const keywordMatch = config.keywords.some((keyword) =>
        query.includes(keyword.toLowerCase())
      );

      if (keywordMatch) {
        const patternMatches = config.responsePatterns.filter((pattern) =>
          pattern.test(response)
        ).length;

        const score = Math.min(
          (patternMatches / config.responsePatterns.length) *
            config.expectedAccuracy,
          1.0
        );

        maxScore = Math.max(maxScore, score);
      }
    }

    // 기본 키워드 매칭 점수
    if (maxScore === 0) {
      const queryWords = new Set(query.split(/\s+/));
      const responseWords = new Set(response.split(/\s+/));
      const overlap = new Set(
        [...queryWords].filter((x) => responseWords.has(x))
      );
      maxScore = Math.min(overlap.size / queryWords.size, 0.8);
    }

    return maxScore;
  }

  /**
   * 🔄 일관성 평가
   */
  private evaluateConsistency(query: string, response: string): number {
    const recentSimilar = this.qualityHistory
      .filter(
        (entry) =>
          this.calculateSimilarity(query, entry.query.toLowerCase()) > 0.7
      )
      .slice(-5); // 최근 5개

    if (recentSimilar.length === 0) return 0.8; // 기본 점수

    const similarityScores = recentSimilar.map((entry) =>
      this.calculateSimilarity(response, entry.response.toLowerCase())
    );

    const avgSimilarity =
      similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length;

    // 너무 일치하거나 너무 다르면 점수 하락
    if (avgSimilarity > 0.9 || avgSimilarity < 0.3) {
      return 0.6;
    }

    return Math.min(avgSimilarity + 0.2, 1.0);
  }

  /**
   * 🎯 관련성 평가
   */
  private evaluateRelevance(query: string, response: string): number {
    // 복잡도 분석을 통한 관련성 평가
    const complexity = QueryComplexityAnalyzer.analyze(query);
    const keywords = complexity.features.keywords;

    let relevanceScore = 0;
    let keywordCount = 0;

    keywords.forEach((keyword) => {
      if (response.includes(keyword.toLowerCase())) {
        keywordCount++;
      }
    });

    relevanceScore = keywordCount / Math.max(keywords.length, 1);

    // 응답 길이 고려
    if (response.length < 10) {
      relevanceScore *= 0.5; // 너무 짧은 응답
    } else if (response.length > 1000) {
      relevanceScore *= 0.8; // 너무 긴 응답
    }

    return Math.min(relevanceScore, 1.0);
  }

  /**
   * ✅ 완성도 평가
   */
  private evaluateCompleteness(query: string, response: string): number {
    let completenessScore = 0.5; // 기본 점수

    // 질문 유형에 따른 완성도 체크
    if (query.includes('어떻게') || query.includes('방법')) {
      // 방법을 묻는 질문
      if (
        response.includes('단계') ||
        response.includes('방법') ||
        response.includes('순서')
      ) {
        completenessScore += 0.3;
      }
    }

    if (query.includes('무엇') || query.includes('뭐')) {
      // 정의를 묻는 질문
      if (
        response.includes('는') ||
        response.includes('이란') ||
        response.includes('입니다')
      ) {
        completenessScore += 0.3;
      }
    }

    if (query.includes('왜') || query.includes('이유')) {
      // 이유를 묻는 질문
      if (
        response.includes('때문') ||
        response.includes('이유') ||
        response.includes('원인')
      ) {
        completenessScore += 0.3;
      }
    }

    // 응답에 구체적인 정보가 포함되어 있는지 체크
    if (
      response.match(/\d+/) ||
      response.includes('예시') ||
      response.includes('예를 들어')
    ) {
      completenessScore += 0.2;
    }

    return Math.min(completenessScore, 1.0);
  }

  /**
   * 🚨 품질 문제 식별
   */
  private identifyQualityIssues(
    request: QueryRequest,
    response: QueryResponse,
    metrics: QualityMetrics
  ): string[] {
    const issues: string[] = [];

    if (metrics.accuracy < 0.7) {
      issues.push('accuracy_low: 응답 정확도가 낮습니다');
    }

    if (metrics.consistency < 0.6) {
      issues.push('consistency_poor: 이전 응답과 일관성이 부족합니다');
    }

    if (metrics.relevance < 0.7) {
      issues.push('relevance_low: 질문과 응답의 관련성이 낮습니다');
    }

    if (metrics.completeness < 0.6) {
      issues.push('completeness_insufficient: 응답이 불완전합니다');
    }

    if (response.response.length < 20) {
      issues.push('length_too_short: 응답이 너무 짧습니다');
    }

    if (!response.success) {
      issues.push('system_error: 시스템 오류가 발생했습니다');
    }

    return issues;
  }

  /**
   * 💡 개선 제안 생성
   */
  private generateImprovementSuggestions(
    issues: string[],
    metrics: QualityMetrics
  ): string[] {
    const suggestions: string[] = [];

    issues.forEach((issue) => {
      const issueType = issue.split(':')[0];

      switch (issueType) {
        case 'accuracy_low':
          suggestions.push('도메인 특화 지식베이스 확장 필요');
          suggestions.push('응답 패턴 학습 데이터 추가');
          break;

        case 'consistency_poor':
          suggestions.push('응답 템플릿 표준화 검토');
          suggestions.push('컨텍스트 유지 메커니즘 개선');
          break;

        case 'relevance_low':
          suggestions.push('쿼리 이해 능력 향상 필요');
          suggestions.push('키워드 가중치 조정');
          break;

        case 'completeness_insufficient':
          suggestions.push('응답 생성 로직 보강');
          suggestions.push('추가 정보 제공 기능 개선');
          break;

        case 'length_too_short':
          suggestions.push('최소 응답 길이 검증 추가');
          break;

        case 'system_error':
          suggestions.push('에러 핸들링 강화');
          suggestions.push('폴백 메커니즘 점검');
          break;
      }
    });

    return [...new Set(suggestions)]; // 중복 제거
  }

  /**
   * 📊 전체 점수 계산
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    return Math.round(metrics.overall * 100) / 100;
  }

  /**
   * 🧪 A/B 테스트 시작
   */
  async startABTest(
    engineA: 'local-rag' | 'local-ai' | 'google-ai' | 'fallback',
    engineB: 'local-rag' | 'local-ai' | 'google-ai' | 'fallback',
    testQueries: string[]
  ): Promise<string> {
    const testId = `ab_test_${Date.now()}`;

    this.abTests.set(testId, {
      testId,
      engines: [engineA, engineB],
      results: [],
      status: 'running',
    });

    // 백그라운드에서 A/B 테스트 실행
    this.executeABTest(testId, testQueries);

    return testId;
  }

  /**
   * 🎯 A/B 테스트 실행
   */
  private async executeABTest(
    testId: string,
    testQueries: string[]
  ): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) return;

    // 각 쿼리에 대해 두 엔진 비교
    for (const query of testQueries) {
      try {
        // 여기서는 시뮬레이션된 응답을 생성 (실제 구현에서는 각 엔진 호출)
        const responseA = await this.simulateEngineResponse(
          test.engines[0],
          query
        );
        const responseB = await this.simulateEngineResponse(
          test.engines[1],
          query
        );

        // 품질 비교
        const scoreA = (await this.evaluateResponse({ query }, responseA))
          .score;
        const scoreB = (await this.evaluateResponse({ query }, responseB))
          .score;

        const winner = scoreA > scoreB ? test.engines[0] : test.engines[1];

        test.results.push({
          query,
          responseA,
          responseB,
          winner,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn(`A/B 테스트 쿼리 실패: ${query}`, error);
      }
    }

    test.status = 'completed';
    console.log(`✅ A/B 테스트 완료: ${testId}`);
  }

  /**
   * 🤖 엔진 응답 시뮬레이션 (실제 구현에서는 각 엔진 호출)
   */
  private async simulateEngineResponse(
    engine: 'local-rag' | 'local-ai' | 'google-ai' | 'fallback',
    query: string
  ): Promise<QueryResponse> {
    return {
      success: true,
      response: `${engine} 엔진의 ${query}에 대한 응답`,
      engine,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 범위
      thinkingSteps: [],
      processingTime: Math.random() * 200 + 100, // 100-300ms 범위
    };
  }

  /**
   * 📈 A/B 테스트 결과 분석
   */
  getABTestResult(testId: string): ABTestResult | null {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'completed') return null;

    const engineAWins = test.results.filter(
      (r) => r.winner === test.engines[0]
    ).length;
    const engineBWins = test.results.filter(
      (r) => r.winner === test.engines[1]
    ).length;

    const totalTests = test.results.length;
    const winnerEngine =
      engineAWins > engineBWins ? test.engines[0] : test.engines[1];
    const winRate = Math.max(engineAWins, engineBWins) / totalTests;

    return {
      engineA: test.engines[0],
      engineB: test.engines[1],
      winnerEngine,
      confidenceLevel: winRate,
      sampleSize: totalTests,
      qualityDifference: Math.abs(engineAWins - engineBWins) / totalTests,
    };
  }

  /**
   * 📊 품질 통계 조회
   */
  getQualityStats() {
    const recentHistory = this.qualityHistory.slice(-100);

    if (recentHistory.length === 0) {
      return {
        averageQuality: 0,
        totalEvaluations: 0,
        qualityTrend: 'stable',
        engineComparison: {},
      };
    }

    const averageQuality =
      recentHistory.reduce((sum, entry) => sum + entry.qualityScore, 0) /
      recentHistory.length;

    const engineStats = recentHistory.reduce(
      (acc, entry) => {
        if (!acc[entry.engine]) {
          acc[entry.engine] = { total: 0, count: 0 };
        }
        const engineStats = acc[entry.engine];
        if (engineStats) {
          engineStats.total += entry.qualityScore;
          engineStats.count++;
        }
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    const engineComparison = Object.entries(engineStats).reduce(
      (acc, [engine, stats]) => {
        acc[engine] = stats.total / stats.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      averageQuality: Math.round(averageQuality * 100) / 100,
      totalEvaluations: recentHistory.length,
      qualityTrend: this.calculateTrend(recentHistory),
      engineComparison,
      targetAchievement: averageQuality >= 0.95 ? '목표 달성' : '개선 필요',
    };
  }

  /**
   * 📈 품질 트렌드 계산
   */
  private calculateTrend(
    history: typeof this.qualityHistory
  ): 'improving' | 'declining' | 'stable' {
    if (history.length < 10) return 'stable';

    const recent = history.slice(-5);
    const previous = history.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, entry) => sum + entry.qualityScore, 0) /
      recent.length;
    const previousAvg =
      previous.reduce((sum, entry) => sum + entry.qualityScore, 0) /
      previous.length;

    const difference = recentAvg - previousAvg;

    if (difference > 0.02) return 'improving';
    if (difference < -0.02) return 'declining';
    return 'stable';
  }

  /**
   * 🔢 텍스트 유사도 계산
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 👥 사용자 피드백 기록
   */
  recordUserFeedback(
    query: string,
    response: string,
    feedback: 'positive' | 'negative'
  ): void {
    const entry = this.qualityHistory.find(
      (h) => h.query === query && h.response === response
    );

    if (entry) {
      entry.userFeedback = feedback;
      console.log(
        `👥 사용자 피드백 기록: ${feedback} for "${query.substring(0, 30)}..."`
      );
    }
  }
}

// 싱글톤 인스턴스
let qualityEngineInstance: AIQualityAssuranceEngine | null = null;

export function getAIQualityEngine(): AIQualityAssuranceEngine {
  if (!qualityEngineInstance) {
    qualityEngineInstance = new AIQualityAssuranceEngine();
  }
  return qualityEngineInstance;
}
