import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 예측 분석 타입
interface PredictionAnalytics {
  summary: {
    totalPredictions: number;
    avgAccuracy: number;
    bestModel: string;
    successRate: number;
  };
  modelPerformance: Array<{
    model: string;
    predictions: number;
    avgAccuracy: number;
    successRate: number;
    avgExecutionTime: number;
  }>;
  metricAnalysis: Array<{
    metric: string;
    predictions: number;
    avgAccuracy: number;
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  }>;
  timeSeriesAnalysis: Array<{
    date: string;
    predictions: number;
    accuracy: number;
    failures: number;
  }>;
  insights: {
    recommendations: string[];
    issues: string[];
    opportunities: string[];
  };
}

// 분석 데이터 생성기
function generatePredictionAnalytics(timeRange: string): PredictionAnalytics {
  const models = [
    'LSTM',
    'ARIMA',
    'Prophet',
    'LinearRegression',
    'RandomForest',
  ];
  const metrics = ['cpu', 'memory', 'disk', 'network', 'response_time'];

  // 시간 범위에 따른 데이터 포인트 수 결정
  const days = getTimeRangeDays(timeRange);
  const totalPredictions = Math.floor(Math.random() * 1000) + 500;

  // 모델 성능 분석
  const modelPerformance = models.map(model => ({
    model,
    predictions:
      Math.floor(totalPredictions / models.length) +
      Math.floor(Math.random() * 50),
    avgAccuracy: Math.random() * 0.3 + 0.7, // 0.7-1.0
    successRate: Math.random() * 0.2 + 0.8, // 0.8-1.0
    avgExecutionTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
  }));

  // 메트릭 분석
  const metricAnalysis = metrics.map(metric => {
    const accuracy = Math.random() * 0.3 + 0.7;
    const trend =
      accuracy > 0.85
        ? 'improving'
        : accuracy > 0.75
          ? 'stable'
          : ('declining' as const);

    return {
      metric,
      predictions:
        Math.floor(totalPredictions / metrics.length) +
        Math.floor(Math.random() * 100),
      avgAccuracy: Math.round(accuracy * 100) / 100,
      trend: trend as 'improving' | 'stable' | 'declining',
      volatility: Math.random() * 0.3 + 0.1, // 0.1-0.4
    };
  });

  // 시계열 분석
  const timeSeriesAnalysis: Array<{
    date: string;
    predictions: number;
    accuracy: number;
    failures: number;
  }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dailyPredictions =
      Math.floor(totalPredictions / days) + Math.floor(Math.random() * 20);
    const accuracy = Math.random() * 0.3 + 0.7;
    const failures = Math.floor(dailyPredictions * (1 - accuracy) * 0.1);

    timeSeriesAnalysis.push({
      date: date.toISOString().split('T')[0],
      predictions: dailyPredictions,
      accuracy: Math.round(accuracy * 100) / 100,
      failures,
    });
  }

  // 전체 통계 계산
  const avgAccuracy =
    modelPerformance.reduce((sum, model) => sum + model.avgAccuracy, 0) /
    models.length;
  const bestModel = modelPerformance.reduce((best, current) =>
    current.avgAccuracy > best.avgAccuracy ? current : best
  ).model;
  const successRate =
    modelPerformance.reduce((sum, model) => sum + model.successRate, 0) /
    models.length;

  // 인사이트 생성
  const insights = generateInsights(
    modelPerformance,
    metricAnalysis,
    avgAccuracy
  );

  return {
    summary: {
      totalPredictions,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      bestModel,
      successRate: Math.round(successRate * 100) / 100,
    },
    modelPerformance: modelPerformance.map(model => ({
      ...model,
      avgAccuracy: Math.round(model.avgAccuracy * 100) / 100,
      successRate: Math.round(model.successRate * 100) / 100,
    })),
    metricAnalysis,
    timeSeriesAnalysis: timeSeriesAnalysis.reverse(),
    insights,
  };
}

function getTimeRangeDays(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([dw])$/);
  if (!match) return 7; // 기본값: 7일

  const [, value, unit] = match;
  const numValue = parseInt(value);

  switch (unit) {
    case 'd':
      return numValue;
    case 'w':
      return numValue * 7;
    default:
      return 7;
  }
}

function generateInsights(
  modelPerformance: any[],
  metricAnalysis: any[],
  avgAccuracy: number
): PredictionAnalytics['insights'] {
  const recommendations: string[] = [];
  const issues: string[] = [];
  const opportunities: string[] = [];

  // 모델 성능 기반 추천
  const worstModel = modelPerformance.reduce((worst, current) =>
    current.avgAccuracy < worst.avgAccuracy ? current : worst
  );

  if (worstModel.avgAccuracy < 0.75) {
    recommendations.push(
      `${worstModel.model} 모델의 성능이 낮습니다. 하이퍼파라미터 튜닝이 필요합니다.`
    );
    issues.push(
      `${worstModel.model} 모델 정확도: ${Math.round(worstModel.avgAccuracy * 100)}%`
    );
  }

  // 메트릭 분석 기반 추천
  const decliningMetrics = metricAnalysis.filter(m => m.trend === 'declining');
  if (decliningMetrics.length > 0) {
    decliningMetrics.forEach(metric => {
      issues.push(`${metric.metric} 메트릭 예측 성능이 하락 중입니다.`);
      recommendations.push(
        `${metric.metric} 메트릭에 대한 피처 엔지니어링을 검토하세요.`
      );
    });
  }

  // 전체 성능 기반 추천
  if (avgAccuracy > 0.9) {
    opportunities.push(
      '높은 예측 정확도를 활용하여 자동화 수준을 높일 수 있습니다.'
    );
  } else if (avgAccuracy < 0.8) {
    recommendations.push(
      '전체적인 모델 성능 개선이 필요합니다. 데이터 품질을 검토하세요.'
    );
  }

  // 실행 시간 기반 추천
  const slowModels = modelPerformance.filter(m => m.avgExecutionTime > 200);
  if (slowModels.length > 0) {
    slowModels.forEach(model => {
      recommendations.push(
        `${model.model} 모델의 실행 시간이 깁니다. 최적화를 고려하세요.`
      );
    });
  }

  // 기회 요소
  const improvingMetrics = metricAnalysis.filter(m => m.trend === 'improving');
  if (improvingMetrics.length > 0) {
    opportunities.push(
      `${improvingMetrics.length}개 메트릭에서 성능 개선이 관찰됩니다.`
    );
  }

  const bestModel = modelPerformance.reduce((best, current) =>
    current.avgAccuracy > best.avgAccuracy ? current : best
  );
  opportunities.push(
    `${bestModel.model} 모델이 가장 우수한 성능을 보입니다. 다른 메트릭에도 적용을 고려하세요.`
  );

  return {
    recommendations,
    issues,
    opportunities,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get('range') || '7d';

    // 분석 데이터 생성
    const analytics = generatePredictionAnalytics(range);

    return NextResponse.json({
      success: true,
      data: analytics,
      range,
      generatedAt: new Date().toISOString(),
      metadata: {
        dataPoints: analytics.summary.totalPredictions,
        modelsAnalyzed: analytics.modelPerformance.length,
        metricsAnalyzed: analytics.metricAnalysis.length,
        timeSpan: range,
      },
    });
  } catch (error) {
    console.error('예측 분석 오류:', error);

    return NextResponse.json(
      {
        error: '예측 분석에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 특정 분석 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisType = 'full', timeRange = '7d', models, metrics } = body;

    let analytics = generatePredictionAnalytics(timeRange);

    // 분석 유형에 따른 필터링
    if (analysisType === 'models' && models) {
      analytics.modelPerformance = analytics.modelPerformance.filter(m =>
        models.includes(m.model)
      );
    }

    if (analysisType === 'metrics' && metrics) {
      analytics.metricAnalysis = analytics.metricAnalysis.filter(m =>
        metrics.includes(m.metric)
      );
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      analysisType,
      filters: { models, metrics },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('맞춤 분석 오류:', error);

    return NextResponse.json(
      {
        error: '맞춤 분석에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
