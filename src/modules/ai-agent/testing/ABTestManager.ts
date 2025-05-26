import { UserInteractionLog } from '@/types/ai-learning';
import { RegexPattern } from '../improvement/PatternSuggester';

export interface TestResult {
  testId: string;
  patternId: string;
  testGroup: string;
  startDate: Date;
  endDate?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  metrics: TestMetrics;
  sampleSize: number;
  confidenceLevel: number;
  statisticalSignificance: boolean;
}

export interface TestMetrics {
  totalQueries: number;
  successfulMatches: number;
  averageConfidence: number;
  userSatisfactionRate: number;
  responseTime: number;
  errorRate: number;
  conversionRate: number; // 성공적인 응답 비율
}

export interface Comparison {
  comparisonId: string;
  controlPattern: RegexPattern;
  testPattern: RegexPattern;
  controlMetrics: TestMetrics;
  testMetrics: TestMetrics;
  improvement: {
    confidence: number;
    satisfaction: number;
    responseTime: number;
    errorRate: number;
    overall: number;
  };
  recommendation: 'adopt' | 'reject' | 'continue_testing';
  reasoning: string[];
  createdAt: Date;
}

export interface ABTestConfig {
  testDuration: number; // days
  minSampleSize: number;
  confidenceLevel: number;
  significanceThreshold: number;
  trafficSplit: number; // 0.1 = 10% traffic to test pattern
}

export class ABTestManager {
  private config: ABTestConfig;
  private activeTests: Map<string, TestResult> = new Map();
  private testHistory: TestResult[] = [];

  constructor(config?: Partial<ABTestConfig>) {
    this.config = {
      testDuration: 7, // 7일
      minSampleSize: 50,
      confidenceLevel: 0.95,
      significanceThreshold: 0.05,
      trafficSplit: 0.1,
      ...config
    };
  }

  /**
   * 새로운 패턴 테스트 시작
   */
  async testNewPattern(
    pattern: RegexPattern, 
    testGroup: string = 'default'
  ): Promise<TestResult> {
    const testId = this.generateTestId();
    
    const testResult: TestResult = {
      testId,
      patternId: pattern.id,
      testGroup,
      startDate: new Date(),
      status: 'running',
      metrics: this.initializeMetrics(),
      sampleSize: 0,
      confidenceLevel: this.config.confidenceLevel,
      statisticalSignificance: false
    };

    this.activeTests.set(testId, testResult);

    console.log(`🧪 [ABTestManager] 새로운 패턴 테스트 시작:`, {
      testId,
      patternId: pattern.id,
      pattern: pattern.pattern,
      category: pattern.category,
      testGroup
    });

    return testResult;
  }

  /**
   * 패턴 성능 비교
   */
  async comparePatternPerformance(
    oldPattern: RegexPattern, 
    newPattern: RegexPattern,
    interactions: UserInteractionLog[]
  ): Promise<Comparison> {
    const comparisonId = this.generateComparisonId();

    // 기존 패턴 성능 분석
    const controlMetrics = await this.analyzePatternPerformance(oldPattern, interactions);
    
    // 새 패턴 성능 분석 (시뮬레이션)
    const testMetrics = await this.simulatePatternPerformance(newPattern, interactions);

    // 개선 효과 계산
    const improvement = this.calculateImprovement(controlMetrics, testMetrics);

    // 권장사항 결정
    const recommendation = this.determineRecommendation(improvement);
    const reasoning = this.generateReasoning(improvement, controlMetrics, testMetrics);

    const comparison: Comparison = {
      comparisonId,
      controlPattern: oldPattern,
      testPattern: newPattern,
      controlMetrics,
      testMetrics,
      improvement,
      recommendation,
      reasoning,
      createdAt: new Date()
    };

    console.log(`📊 [ABTestManager] 패턴 성능 비교 완료:`, {
      comparisonId,
      controlPattern: oldPattern.pattern,
      testPattern: newPattern.pattern,
      recommendation,
      overallImprovement: improvement.overall
    });

    return comparison;
  }

  /**
   * 테스트 결과 업데이트
   */
  async updateTestResult(testId: string, interaction: UserInteractionLog): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return;

    // 메트릭 업데이트
    test.metrics.totalQueries++;
    test.sampleSize++;

    // 패턴 매칭 성공 여부 확인
    const pattern = await this.getPatternById(test.patternId);
    if (pattern && this.testPatternMatch(pattern.pattern, interaction.query)) {
      test.metrics.successfulMatches++;
    }

    // 신뢰도 업데이트
    test.metrics.averageConfidence = this.updateRunningAverage(
      test.metrics.averageConfidence,
      interaction.confidence,
      test.metrics.totalQueries
    );

    // 사용자 만족도 업데이트
    if (interaction.userFeedback) {
      const satisfaction = interaction.userFeedback === 'helpful' ? 1 : 0;
      test.metrics.userSatisfactionRate = this.updateRunningAverage(
        test.metrics.userSatisfactionRate,
        satisfaction,
        test.metrics.totalQueries
      );
    }

    // 응답 시간 업데이트
    test.metrics.responseTime = this.updateRunningAverage(
      test.metrics.responseTime,
      interaction.responseTime,
      test.metrics.totalQueries
    );

    // 통계적 유의성 확인
    test.statisticalSignificance = this.checkStatisticalSignificance(test);

    // 테스트 완료 조건 확인
    if (this.shouldCompleteTest(test)) {
      await this.completeTest(testId);
    }

    this.activeTests.set(testId, test);
  }

  /**
   * 테스트 완료
   */
  async completeTest(testId: string): Promise<TestResult> {
    const test = this.activeTests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    test.status = 'completed';
    test.endDate = new Date();

    // 최종 메트릭 계산
    test.metrics.conversionRate = test.metrics.totalQueries > 0 ? 
      test.metrics.successfulMatches / test.metrics.totalQueries : 0;
    
    test.metrics.errorRate = 1 - test.metrics.conversionRate;

    // 히스토리에 추가
    this.testHistory.push(test);
    this.activeTests.delete(testId);

    console.log(`✅ [ABTestManager] 테스트 완료:`, {
      testId,
      duration: test.endDate.getTime() - test.startDate.getTime(),
      sampleSize: test.sampleSize,
      conversionRate: test.metrics.conversionRate,
      statisticalSignificance: test.statisticalSignificance
    });

    return test;
  }

  /**
   * 활성 테스트 목록 조회
   */
  getActiveTests(): TestResult[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * 테스트 히스토리 조회
   */
  getTestHistory(): TestResult[] {
    return [...this.testHistory];
  }

  /**
   * 완료된 테스트 목록 조회 (승인 권장 포함)
   */
  getCompletedTests(): TestResult[] {
    return this.testHistory.filter(test => {
      if (test.status !== 'completed') return false;
      
      // 통계적 유의성과 개선 효과를 기반으로 승인 여부 결정
      const shouldApprove = test.statisticalSignificance && 
                           test.metrics.conversionRate > 0.7 &&
                           test.metrics.userSatisfactionRate > 0.6;
      
      // shouldApprove 속성 추가
      (test as any).shouldApprove = shouldApprove;
      return true;
    });
  }

  /**
   * 패턴 성능 분석
   */
  private async analyzePatternPerformance(
    pattern: RegexPattern, 
    interactions: UserInteractionLog[]
  ): Promise<TestMetrics> {
    const relevantInteractions = interactions.filter(i => 
      this.testPatternMatch(pattern.pattern, i.query)
    );

    if (relevantInteractions.length === 0) {
      return this.initializeMetrics();
    }

    const totalQueries = relevantInteractions.length;
    const successfulMatches = relevantInteractions.filter(i => i.confidence >= 0.6).length;
    const averageConfidence = relevantInteractions.reduce((sum, i) => sum + i.confidence, 0) / totalQueries;
    
    const feedbackInteractions = relevantInteractions.filter(i => i.userFeedback);
    const userSatisfactionRate = feedbackInteractions.length > 0 ?
      feedbackInteractions.filter(i => i.userFeedback === 'helpful').length / feedbackInteractions.length : 0;
    
    const responseTime = relevantInteractions.reduce((sum, i) => sum + i.responseTime, 0) / totalQueries;
    const conversionRate = successfulMatches / totalQueries;
    const errorRate = 1 - conversionRate;

    return {
      totalQueries,
      successfulMatches,
      averageConfidence,
      userSatisfactionRate,
      responseTime,
      errorRate,
      conversionRate
    };
  }

  /**
   * 패턴 성능 시뮬레이션
   */
  private async simulatePatternPerformance(
    pattern: RegexPattern, 
    interactions: UserInteractionLog[]
  ): Promise<TestMetrics> {
    // 새 패턴이 기존 상호작용에 어떻게 작동할지 시뮬레이션
    const potentialMatches = interactions.filter(i => 
      this.testPatternMatch(pattern.pattern, i.query)
    );

    if (potentialMatches.length === 0) {
      return this.initializeMetrics();
    }

    // 패턴 신뢰도를 기반으로 성능 예측
    const baseConfidence = pattern.confidence;
    const totalQueries = potentialMatches.length;
    
    // 예상 성능 계산 (패턴 신뢰도 기반)
    const expectedSuccessRate = Math.min(baseConfidence * 1.1, 0.95); // 최대 10% 개선
    const successfulMatches = Math.round(totalQueries * expectedSuccessRate);
    
    const averageConfidence = Math.min(baseConfidence + 0.05, 0.95); // 약간의 신뢰도 향상
    const userSatisfactionRate = Math.min(expectedSuccessRate * 0.9, 0.9); // 성공률의 90%
    
    // 기존 응답 시간 기준으로 약간 개선
    const baseResponseTime = potentialMatches.reduce((sum, i) => sum + i.responseTime, 0) / totalQueries;
    const responseTime = baseResponseTime * 0.95; // 5% 개선
    
    const conversionRate = expectedSuccessRate;
    const errorRate = 1 - conversionRate;

    return {
      totalQueries,
      successfulMatches,
      averageConfidence,
      userSatisfactionRate,
      responseTime,
      errorRate,
      conversionRate
    };
  }

  /**
   * 개선 효과 계산
   */
  private calculateImprovement(control: TestMetrics, test: TestMetrics): any {
    const safeDiv = (a: number, b: number) => b === 0 ? 0 : (a - b) / b * 100;

    const confidence = safeDiv(test.averageConfidence, control.averageConfidence);
    const satisfaction = safeDiv(test.userSatisfactionRate, control.userSatisfactionRate);
    const responseTime = -safeDiv(test.responseTime, control.responseTime); // 음수가 개선
    const errorRate = -safeDiv(test.errorRate, control.errorRate); // 음수가 개선
    
    // 전체 개선 점수 (가중 평균)
    const overall = (confidence * 0.3 + satisfaction * 0.4 + responseTime * 0.2 + errorRate * 0.1);

    return {
      confidence: Math.round(confidence * 100) / 100,
      satisfaction: Math.round(satisfaction * 100) / 100,
      responseTime: Math.round(responseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      overall: Math.round(overall * 100) / 100
    };
  }

  /**
   * 권장사항 결정
   */
  private determineRecommendation(improvement: any): 'adopt' | 'reject' | 'continue_testing' {
    const { overall, satisfaction, confidence } = improvement;

    if (overall >= 10 && satisfaction >= 5 && confidence >= 5) {
      return 'adopt';
    } else if (overall <= -5 || satisfaction <= -10) {
      return 'reject';
    } else {
      return 'continue_testing';
    }
  }

  /**
   * 권장사항 근거 생성
   */
  private generateReasoning(improvement: any, control: TestMetrics, test: TestMetrics): string[] {
    const reasoning: string[] = [];

    if (improvement.overall > 10) {
      reasoning.push(`전체 성능이 ${improvement.overall}% 개선되어 채택을 권장합니다.`);
    } else if (improvement.overall < -5) {
      reasoning.push(`전체 성능이 ${Math.abs(improvement.overall)}% 저하되어 기존 패턴 유지를 권장합니다.`);
    }

    if (improvement.satisfaction > 15) {
      reasoning.push(`사용자 만족도가 ${improvement.satisfaction}% 크게 향상되었습니다.`);
    } else if (improvement.satisfaction < -10) {
      reasoning.push(`사용자 만족도가 ${Math.abs(improvement.satisfaction)}% 저하되었습니다.`);
    }

    if (improvement.confidence > 10) {
      reasoning.push(`응답 신뢰도가 ${improvement.confidence}% 향상되었습니다.`);
    }

    if (improvement.responseTime > 10) {
      reasoning.push(`응답 시간이 ${improvement.responseTime}% 개선되었습니다.`);
    }

    if (test.totalQueries < this.config.minSampleSize) {
      reasoning.push(`샘플 크기(${test.totalQueries})가 최소 요구사항(${this.config.minSampleSize})보다 작아 추가 테스트가 필요합니다.`);
    }

    return reasoning;
  }

  /**
   * 패턴 매칭 테스트
   */
  private testPatternMatch(pattern: string, query: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(query);
    } catch (error) {
      console.warn(`패턴 매칭 오류: ${pattern}`, error);
      return false;
    }
  }

  /**
   * 실행 평균 업데이트
   */
  private updateRunningAverage(currentAvg: number, newValue: number, count: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  /**
   * 통계적 유의성 확인
   */
  private checkStatisticalSignificance(test: TestResult): boolean {
    // 간단한 통계적 유의성 확인 (실제로는 더 복잡한 통계 테스트 필요)
    return test.sampleSize >= this.config.minSampleSize && 
           test.metrics.conversionRate > 0.1;
  }

  /**
   * 테스트 완료 조건 확인
   */
  private shouldCompleteTest(test: TestResult): boolean {
    const testDuration = Date.now() - test.startDate.getTime();
    const maxDuration = this.config.testDuration * 24 * 60 * 60 * 1000; // ms

    return testDuration >= maxDuration || 
           (test.sampleSize >= this.config.minSampleSize * 2 && test.statisticalSignificance);
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): TestMetrics {
    return {
      totalQueries: 0,
      successfulMatches: 0,
      averageConfidence: 0,
      userSatisfactionRate: 0,
      responseTime: 0,
      errorRate: 0,
      conversionRate: 0
    };
  }

  /**
   * 패턴 조회 (임시 구현)
   */
  private async getPatternById(patternId: string): Promise<RegexPattern | null> {
    // TODO: 실제 패턴 저장소에서 조회
    return null;
  }

  /**
   * 유틸리티 메서드들
   */
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateComparisonId(): string {
    return `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 