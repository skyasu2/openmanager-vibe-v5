/**
 * 🤖 AI 친화적 Vitals 인터페이스
 *
 * @description Gemini 아키텍처 분석 기반 - SOLID 원칙 준수 및 낮은 결합도 구현
 * @philosophy AI가 이해하고 사용하기 쉬운 단순한 인터페이스 제공
 * @pattern Strategy + Factory + Dependency Injection 패턴 적용
 */

import {
  type UniversalVital,
  universalVitals,
  type VitalCategory,
} from './universal-vitals';

// 🎯 AI 친화적 메트릭 표준 스키마
export interface AIFriendlyMetric {
  id: string;
  category: VitalCategory;
  name: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string; // ISO8601
  context: {
    testType?: string;
    environment?: string;
    duration?: number;
    source?: 'vitest' | 'playwright' | 'api' | 'manual';
  };
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    estimatedImpact: number; // 0-100 점수
    category: 'performance' | 'reliability' | 'maintainability';
  }>;
}

// 🔌 메트릭 수집 인터페이스 (DI용)
export interface MetricCollector {
  collect(
    name: string,
    value: number,
    category: VitalCategory,
    unit?: string
  ): AIFriendlyMetric;
  startTimer(name: string, category: VitalCategory): string; // 타이머 ID 반환
  endTimer(
    timerId: string,
    context?: Record<string, unknown>
  ): AIFriendlyMetric;
}

// 📊 메트릭 분석 인터페이스 (ISP 적용)
export interface MetricAnalyzer {
  analyze(metrics: AIFriendlyMetric[]): VitalsAnalysisResult;
  detectRegressions(
    current: AIFriendlyMetric[],
    baseline?: AIFriendlyMetric[]
  ): RegressionAlert[];
}

// 💡 권장사항 생성 인터페이스
export interface RecommendationEngine {
  generateRecommendations(metrics: AIFriendlyMetric[]): ActionRecommendation[];
  prioritizeActions(
    recommendations: ActionRecommendation[]
  ): ActionRecommendation[];
}

// 📈 분석 결과 타입
export interface VitalsAnalysisResult {
  overallScore: number; // 0-100
  overallRating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  categoryBreakdown: {
    [key in VitalCategory]?: {
      score: number;
      count: number;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  summary: string; // AI가 이해하기 쉬운 한 줄 요약
  keyInsights: string[]; // 핵심 통찰 3-5개
}

// 🚨 회귀 알림 타입
export interface RegressionAlert {
  metric: string;
  category: VitalCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regressionPercent: number;
  impact: string; // 사용자에게 미치는 영향 설명
  fixSuggestion: string; // 구체적 해결 방안
}

// 💡 액션 권장사항 타입
export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'reliability' | 'maintainability' | 'security';
  estimatedEffort: 'low' | 'medium' | 'high'; // 구현 난이도
  estimatedImpact: number; // 0-100 점수
  actionItems: string[]; // 구체적 실행 단계
  resources: string[]; // 참고 자료 링크
}

// 🤖 AI 전용 간단한 Vitals 수집기 (Facade Pattern)
export class AIVitalsCollector implements MetricCollector {
  private timers: Map<
    string,
    { name: string; category: VitalCategory; startTime: number }
  > = new Map();

  // 📊 즉시 메트릭 수집 (가장 간단한 방법)
  collect(
    name: string,
    value: number,
    category: VitalCategory,
    unit: string = 'ms'
  ): AIFriendlyMetric {
    // 기존 Universal Vitals 시스템 활용
    const vital = universalVitals.collectVital(name, category, value, unit);

    // AI 친화적 형태로 변환
    return this.convertToAIFriendly(vital);
  }

  // ⏱️ 타이머 시작
  startTimer(name: string, category: VitalCategory): string {
    const timerId = `${category}:${name}:${Date.now()}`;
    this.timers.set(timerId, {
      name,
      category,
      startTime: performance.now(),
    });

    return timerId;
  }

  // ⏹️ 타이머 종료 및 메트릭 수집
  endTimer(
    timerId: string,
    context: Record<string, unknown> = {}
  ): AIFriendlyMetric {
    const timer = this.timers.get(timerId);
    if (!timer) {
      throw new Error(`타이머를 찾을 수 없음: ${timerId}`);
    }

    const duration = performance.now() - timer.startTime;
    this.timers.delete(timerId);

    const vital = universalVitals.collectVital(
      timer.name,
      timer.category,
      duration,
      'ms',
      context
    );

    return this.convertToAIFriendly(vital);
  }

  // 🔄 Universal Vital → AI Friendly Metric 변환
  private convertToAIFriendly(vital: UniversalVital): AIFriendlyMetric {
    return {
      id: `${vital.category}:${vital.name}:${vital.timestamp}`,
      category: vital.category,
      name: vital.name,
      value: vital.value,
      unit: vital.unit,
      rating: vital.rating,
      timestamp: new Date(vital.timestamp).toISOString(),
      context: {
        testType: (vital.context?.type as string | undefined) || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        duration: vital.value,
        source:
          (vital.context?.source as
            | 'vitest'
            | 'playwright'
            | 'api'
            | 'manual'
            | undefined) || 'manual',
      },
      actionItems: (vital.recommendations || []).map((rec) => ({
        priority: this.inferPriority(vital.rating),
        action: rec,
        estimatedImpact: this.estimateImpact(vital.rating, vital.value),
        category: this.inferActionCategory(vital.category),
      })),
    };
  }

  // 🎯 우선순위 추론
  private inferPriority(
    rating: 'good' | 'needs-improvement' | 'poor'
  ): 'high' | 'medium' | 'low' {
    switch (rating) {
      case 'poor':
        return 'high';
      case 'needs-improvement':
        return 'medium';
      case 'good':
        return 'low';
    }
  }

  // 📈 임팩트 추정
  private estimateImpact(
    rating: 'good' | 'needs-improvement' | 'poor',
    _value: number
  ): number {
    const baseImpact = { poor: 80, 'needs-improvement': 50, good: 20 };
    return baseImpact[rating];
  }

  // 🏷️ 액션 카테고리 추론
  private inferActionCategory(
    vitalCategory: VitalCategory
  ): 'performance' | 'reliability' | 'maintainability' {
    switch (vitalCategory) {
      case 'web-performance':
      case 'api-performance':
      case 'build-performance':
      case 'database-performance':
        return 'performance';
      case 'reliability':
        return 'reliability';
      default:
        return 'maintainability';
    }
  }
}

// 🧠 간단한 분석기 (Strategy Pattern)
export class SimpleMetricAnalyzer implements MetricAnalyzer {
  analyze(metrics: AIFriendlyMetric[]): VitalsAnalysisResult {
    if (metrics.length === 0) {
      return {
        overallScore: 100,
        overallRating: 'excellent',
        categoryBreakdown: {},
        summary: '측정된 메트릭이 없습니다.',
        keyInsights: ['테스트를 실행하여 성능 데이터를 수집하세요.'],
      };
    }

    // 간단한 점수 계산
    const ratings = metrics.map((m) => m.rating);
    const goodCount = ratings.filter((r) => r === 'good').length;
    const needsImprovementCount = ratings.filter(
      (r) => r === 'needs-improvement'
    ).length;
    const poorCount = ratings.filter((r) => r === 'poor').length;

    const overallScore = Math.round(
      (goodCount * 100 + needsImprovementCount * 60 + poorCount * 20) /
        metrics.length
    );

    const overallRating = this.determineOverallRating(overallScore);

    return {
      overallScore,
      overallRating,
      categoryBreakdown: this.analyzeCategoryBreakdown(metrics),
      summary: this.generateSummary(overallScore, metrics.length),
      keyInsights: this.generateKeyInsights(metrics),
    };
  }

  detectRegressions(
    current: AIFriendlyMetric[],
    baseline?: AIFriendlyMetric[]
  ): RegressionAlert[] {
    if (!baseline || baseline.length === 0) {
      return [];
    }

    const alerts: RegressionAlert[] = [];

    current.forEach((currentMetric) => {
      const baselineMetric = baseline.find(
        (b) =>
          b.name === currentMetric.name && b.category === currentMetric.category
      );

      if (baselineMetric && currentMetric.value > baselineMetric.value * 1.2) {
        // 20% 임계값
        const regressionPercent =
          ((currentMetric.value - baselineMetric.value) /
            baselineMetric.value) *
          100;

        alerts.push({
          metric: currentMetric.name,
          category: currentMetric.category,
          severity:
            regressionPercent > 50
              ? 'critical'
              : regressionPercent > 30
                ? 'high'
                : 'medium',
          regressionPercent,
          impact: `성능이 ${regressionPercent.toFixed(1)}% 저하되었습니다.`,
          fixSuggestion:
            currentMetric.actionItems[0]?.action || '성능 최적화가 필요합니다.',
        });
      }
    });

    return alerts;
  }

  private determineOverallRating(
    score: number
  ): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  private analyzeCategoryBreakdown(metrics: AIFriendlyMetric[]) {
    const breakdown: VitalsAnalysisResult['categoryBreakdown'] = {};

    const categories = [...new Set(metrics.map((m) => m.category))];

    categories.forEach((category) => {
      const categoryMetrics = metrics.filter((m) => m.category === category);
      const goodCount = categoryMetrics.filter(
        (m) => m.rating === 'good'
      ).length;

      breakdown[category] = {
        score: Math.round((goodCount / categoryMetrics.length) * 100),
        count: categoryMetrics.length,
        trend: 'stable', // 단순화: 실제로는 히스토리 데이터 필요
      };
    });

    return breakdown;
  }

  private generateSummary(score: number, totalMetrics: number): string {
    if (score >= 90)
      return `우수한 성능! ${totalMetrics}개 메트릭 중 대부분이 양호합니다.`;
    if (score >= 75)
      return `양호한 성능. ${totalMetrics}개 메트릭 중 일부 개선 여지가 있습니다.`;
    if (score >= 50)
      return `성능 개선 필요. ${totalMetrics}개 메트릭 중 다수가 개선이 필요합니다.`;
    return `성능 문제 발견. ${totalMetrics}개 메트릭 중 상당수가 임계값을 초과했습니다.`;
  }

  private generateKeyInsights(metrics: AIFriendlyMetric[]): string[] {
    const insights: string[] = [];

    // 가장 문제가 되는 메트릭 찾기
    const poorMetrics = metrics.filter((m) => m.rating === 'poor');
    if (poorMetrics.length > 0) {
      insights.push(`${poorMetrics.length}개 메트릭이 임계값을 초과했습니다.`);
    }

    // 카테고리별 문제점
    const categories = [...new Set(metrics.map((m) => m.category))];
    categories.forEach((category) => {
      const categoryMetrics = metrics.filter((m) => m.category === category);
      const poorInCategory = categoryMetrics.filter(
        (m) => m.rating === 'poor'
      ).length;
      if (poorInCategory > 0) {
        insights.push(`${category} 영역에서 ${poorInCategory}개 문제 발견`);
      }
    });

    return insights.slice(0, 5); // 최대 5개까지
  }
}

// 🚀 AI 전용 간단한 팩토리 함수들
export const aiVitals = {
  // 간단한 수집기 생성
  createCollector: (): MetricCollector => new AIVitalsCollector(),

  // 간단한 분석기 생성
  createAnalyzer: (): MetricAnalyzer => new SimpleMetricAnalyzer(),

  // 원샷 메트릭 수집 (가장 간단)
  quickCollect: (
    name: string,
    value: number,
    category: VitalCategory = 'test-execution'
  ): AIFriendlyMetric => {
    const collector = new AIVitalsCollector();
    return collector.collect(name, value, category);
  },

  // 원샷 분석 (가장 간단)
  quickAnalyze: (metrics: AIFriendlyMetric[]): VitalsAnalysisResult => {
    const analyzer = new SimpleMetricAnalyzer();
    return analyzer.analyze(metrics);
  },
};

// 📝 AI 사용 예시
export const aiVitalsExamples = {
  // 가장 간단한 사용법
  simple: `
// 1줄로 메트릭 수집
const metric = aiVitals.quickCollect('test-duration', 45, 'test-execution');

// 1줄로 분석
const analysis = aiVitals.quickAnalyze([metric]);
logger.info(analysis.summary); // "우수한 성능! 1개 메트릭 중 대부분이 양호합니다."
  `,

  // 타이머 사용법
  timer: `
// 타이머 시작
const collector = aiVitals.createCollector();
const timerId = collector.startTimer('api-call', 'api-performance');

// 작업 수행...
await performAPICall();

// 타이머 종료 및 메트릭 수집
const metric = collector.endTimer(timerId, { endpoint: '/api/test' });
  `,

  // 회귀 감지
  regression: `
// 회귀 감지
const analyzer = aiVitals.createAnalyzer();
const regressions = analyzer.detectRegressions(currentMetrics, baselineMetrics);
regressions.forEach(alert => {
  logger.info(\`🚨 \${alert.metric}: \${alert.impact}\`);
});
  `,
};
