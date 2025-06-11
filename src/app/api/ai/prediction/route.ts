import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 예측 결과 타입
interface PredictionResult {
  id: string;
  metric: string;
  serverId: string;
  predictions: Array<{
    timestamp: string;
    value: number;
    confidence: number;
  }>;
  accuracy: number;
  model: string;
  createdAt: string;
}

// 예측 히스토리 타입
interface PredictionHistory {
  id: string;
  metric: string;
  serverId: string;
  predictedValue: number;
  actualValue?: number;
  accuracy?: number;
  timestamp: string;
  model: string;
}

// 모의 예측 데이터 생성기
function generatePredictionResults(filters?: {
  metric?: string;
  serverId?: string;
  timeRange?: string;
}): PredictionResult[] {
  const metrics = ['cpu', 'memory', 'disk', 'network', 'response_time'];
  const serverIds = [
    'server-001',
    'server-002',
    'server-003',
    'server-004',
    'server-005',
  ];
  const models = [
    'LSTM',
    'ARIMA',
    'Prophet',
    'LinearRegression',
    'RandomForest',
  ];

  const results: PredictionResult[] = [];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const metric =
      filters?.metric || metrics[Math.floor(Math.random() * metrics.length)];
    const serverId =
      filters?.serverId ||
      serverIds[Math.floor(Math.random() * serverIds.length)];
    const model = models[Math.floor(Math.random() * models.length)];

    // 시간 시리즈 예측 데이터 생성
    const predictions = [];
    const baseValue = Math.random() * 80 + 10; // 10-90 범위

    for (let j = 0; j < 24; j++) {
      // 24시간 예측
      const timestamp = new Date(Date.now() + j * 60 * 60 * 1000).toISOString();
      const variation = (Math.random() - 0.5) * 20; // ±10 변동
      const trend = j * 0.5; // 시간에 따른 증가 추세
      const value = Math.max(0, Math.min(100, baseValue + variation + trend));
      const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0 신뢰도

      predictions.push({
        timestamp,
        value: Math.round(value * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    results.push({
      id: `prediction-${i + 1}`,
      metric,
      serverId,
      predictions,
      accuracy: Math.random() * 0.2 + 0.8, // 0.8-1.0 정확도
      model,
      createdAt: new Date(
        Date.now() - Math.random() * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  return results;
}

function generatePredictionHistory(
  metric: string,
  limit: number
): PredictionHistory[] {
  const serverIds = [
    'server-001',
    'server-002',
    'server-003',
    'server-004',
    'server-005',
  ];
  const models = [
    'LSTM',
    'ARIMA',
    'Prophet',
    'LinearRegression',
    'RandomForest',
  ];

  const history: PredictionHistory[] = [];

  for (let i = 0; i < limit; i++) {
    const serverId = serverIds[Math.floor(Math.random() * serverIds.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const predictedValue = Math.random() * 100;
    const actualValue = predictedValue + (Math.random() - 0.5) * 20; // 실제값은 예측값 ±10 범위
    const accuracy = Math.max(
      0,
      1 - Math.abs(predictedValue - actualValue) / 100
    );

    history.push({
      id: `history-${i + 1}`,
      metric,
      serverId,
      predictedValue: Math.round(predictedValue * 100) / 100,
      actualValue: Math.round(actualValue * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      model,
    });
  }

  return history.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const metric = searchParams.get('metric') || undefined;
    const serverId = searchParams.get('serverId') || undefined;
    const timeRange = searchParams.get('timeRange') || '24h';
    const demo = searchParams.get('demo') === 'true';

    if (demo) {
      // 데모 모드: 단순한 예측 결과 반환
      return NextResponse.json({
        success: true,
        data: {
          predictions:
            generatePredictionResults({ metric, serverId, timeRange })[0]
              ?.predictions || [],
          model: 'Demo-LSTM',
          accuracy: 0.95,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const results = generatePredictionResults({ metric, serverId, timeRange });

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      filters: { metric, serverId, timeRange },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('예측 조회 오류:', error);

    return NextResponse.json(
      {
        error: '예측 데이터 조회에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      metric,
      serverId,
      hoursAhead = 24,
      model = 'LSTM',
      confidence = 0.95,
    } = body;

    if (!metric || !serverId) {
      return NextResponse.json(
        {
          error: 'metric과 serverId는 필수입니다',
          required: ['metric', 'serverId'],
        },
        { status: 400 }
      );
    }

    // 예측 실행 시뮬레이션
    const predictions = [];
    const baseValue = Math.random() * 80 + 10;

    for (let i = 0; i < hoursAhead; i++) {
      const timestamp = new Date(Date.now() + i * 60 * 60 * 1000).toISOString();
      const variation = (Math.random() - 0.5) * 15;
      const trend = i * 0.3;
      const value = Math.max(0, Math.min(100, baseValue + variation + trend));

      predictions.push({
        timestamp,
        value: Math.round(value * 100) / 100,
        confidence: Math.random() * 0.2 + 0.8,
      });
    }

    const result: PredictionResult = {
      id: `prediction-${Date.now()}`,
      metric,
      serverId,
      predictions,
      accuracy: Math.random() * 0.2 + 0.8,
      model,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: `${metric} 메트릭에 대한 ${hoursAhead}시간 예측 완료`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('예측 생성 오류:', error);

    return NextResponse.json(
      {
        error: '예측 생성에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
