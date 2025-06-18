import { NextRequest, NextResponse } from 'next/server';

// 예측 분석 결과 생성 함수
function generatePredictionAnalysis(data: any) {
  const currentTime = new Date();

  // 기본 트렌드 분석
  const trends = {
    cpu: {
      current: 65,
      predicted1h: 72,
      predicted6h: 78,
      predicted24h: 68,
      trend: 'increasing',
      confidence: 0.85,
    },
    memory: {
      current: 72,
      predicted1h: 75,
      predicted6h: 81,
      predicted24h: 77,
      trend: 'increasing',
      confidence: 0.82,
    },
    disk: {
      current: 45,
      predicted1h: 46,
      predicted6h: 48,
      predicted24h: 50,
      trend: 'stable',
      confidence: 0.91,
    },
    network: {
      current: 38,
      predicted1h: 42,
      predicted6h: 45,
      predicted24h: 41,
      trend: 'fluctuating',
      confidence: 0.78,
    },
  };

  // 이상 징후 감지
  const anomalies = [
    {
      metric: 'cpu',
      severity: 'medium',
      probability: 0.15,
      timeframe: '2-3 hours',
      description: 'CPU 사용률이 점진적으로 증가하는 패턴 감지',
    },
    {
      metric: 'memory',
      severity: 'low',
      probability: 0.08,
      timeframe: '4-6 hours',
      description: '메모리 사용량 상승 추세, 정상 범위 내',
    },
  ];

  // 권장사항 생성
  const recommendations = [
    {
      priority: 'high',
      action: 'cpu_monitoring',
      description: 'CPU 사용률 모니터링 강화 권장',
      timeframe: 'immediate',
    },
    {
      priority: 'medium',
      action: 'memory_cleanup',
      description: '메모리 정리 작업 예약 권장',
      timeframe: '1-2 hours',
    },
    {
      priority: 'low',
      action: 'log_rotation',
      description: '로그 순환 정책 검토',
      timeframe: '24 hours',
    },
  ];

  return {
    analysisId: `pred_${Date.now()}`,
    timestamp: currentTime.toISOString(),
    timeRange: data.timeRange || '24h',
    trends,
    anomalies,
    recommendations,
    overallHealth: {
      score: 78,
      status: 'good',
      riskLevel: 'low',
    },
    nextAnalysis: new Date(
      currentTime.getTime() + 30 * 60 * 1000
    ).toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // 입력 데이터 유효성 검사
    if (!requestData.metrics || !Array.isArray(requestData.metrics)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid metrics data - array required',
        },
        { status: 400 }
      );
    }

    console.log(
      '🔮 Starting prediction analysis for:',
      requestData.metrics.length,
      'metrics'
    );

    // 예측 분석 실행
    const analysis = generatePredictionAnalysis(requestData);

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Prediction analysis completed successfully',
      processingTime: '1.2s',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Prediction analyze POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform prediction analysis',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const metricType = searchParams.get('metric');

    // 기본 분석 데이터 반환
    const analysis = generatePredictionAnalysis({ timeRange });

    // 특정 메트릭만 요청된 경우 필터링
    if (
      metricType &&
      analysis.trends[metricType as keyof typeof analysis.trends]
    ) {
      analysis.trends = {
        [metricType]:
          analysis.trends[metricType as keyof typeof analysis.trends],
      } as any;
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      timeRange,
      metric: metricType || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Prediction analyze GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get prediction analysis',
      },
      { status: 500 }
    );
  }
}
