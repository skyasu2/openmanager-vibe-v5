import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 예측 히스토리 타입
interface PredictionHistoryEntry {
  id: string;
  metric: string;
  serverId: string;
  predictedValue: number;
  actualValue?: number;
  accuracy?: number;
  confidence: number;
  timestamp: string;
  model: string;
  status: 'pending' | 'validated' | 'failed';
  metadata?: {
    features?: string[];
    trainingData?: number;
    executionTime?: number;
  };
}

// 모의 예측 히스토리 생성기
function generatePredictionHistory(
  metric: string,
  limit: number,
  cursor: number = 0
): PredictionHistoryEntry[] {
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
  const statuses: PredictionHistoryEntry['status'][] = [
    'pending',
    'validated',
    'failed',
  ];

  const history: PredictionHistoryEntry[] = [];

  for (let i = 0; i < limit; i++) {
    const serverId = serverIds[Math.floor(Math.random() * serverIds.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const predictedValue = Math.random() * 100;
    let actualValue: number | undefined;
    let accuracy: number | undefined;

    // 상태에 따른 실제값과 정확도 계산
    if (status === 'validated') {
      actualValue = predictedValue + (Math.random() - 0.5) * 20;
      accuracy = Math.max(0, 1 - Math.abs(predictedValue - actualValue) / 100);
    } else if (status === 'failed') {
      accuracy = 0;
    }

    history.push({
      id: `history-${cursor + i + 1}`,
      metric,
      serverId,
      predictedValue: Math.round(predictedValue * 100) / 100,
      actualValue: actualValue
        ? Math.round(actualValue * 100) / 100
        : undefined,
      accuracy: accuracy ? Math.round(accuracy * 100) / 100 : undefined,
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: new Date(
        Date.now() - (cursor + i) * 60 * 60 * 1000
      ).toISOString(),
      model,
      status,
      metadata: {
        features: getModelFeatures(model),
        trainingData: Math.floor(Math.random() * 5000) + 1000,
        executionTime: Math.floor(Math.random() * 500) + 50,
      },
    });
  }

  return history.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function getModelFeatures(model: string): string[] {
  const featureMap: Record<string, string[]> = {
    LSTM: ['시계열 패턴', '장기 의존성', '순환 신경망'],
    ARIMA: ['자기회귀', '이동평균', '차분'],
    Prophet: ['계절성', '트렌드', '휴일 효과'],
    LinearRegression: ['선형 관계', '단순 회귀', '피처 가중치'],
    RandomForest: ['앙상블', '의사결정트리', '무작위 추출'],
  };

  return featureMap[model] || ['기본 피처'];
}

// 정확도 통계 계산
function calculateAccuracyStats(history: PredictionHistoryEntry[]) {
  const validatedPredictions = history.filter(
    h => h.status === 'validated' && h.accuracy !== undefined
  );

  if (validatedPredictions.length === 0) {
    return {
      averageAccuracy: 0,
      bestAccuracy: 0,
      worstAccuracy: 0,
      totalPredictions: history.length,
      validatedPredictions: 0,
    };
  }

  const accuracies = validatedPredictions.map(h => h.accuracy!);

  return {
    averageAccuracy:
      Math.round(
        (accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length) *
          100
      ) / 100,
    bestAccuracy: Math.round(Math.max(...accuracies) * 100) / 100,
    worstAccuracy: Math.round(Math.min(...accuracies) * 100) / 100,
    totalPredictions: history.length,
    validatedPredictions: validatedPredictions.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const metric = searchParams.get('metric') || 'cpu';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const cursor = parseInt(searchParams.get('cursor') || '0');
    const serverId = searchParams.get('serverId') || undefined;
    const model = searchParams.get('model') || undefined;
    const status =
      (searchParams.get('status') as PredictionHistoryEntry['status']) ||
      undefined;
    const accuracyMin = parseFloat(searchParams.get('accuracy.min') || '0');
    const accuracyMax = parseFloat(searchParams.get('accuracy.max') || '1');

    // 히스토리 데이터 생성
    let history = generatePredictionHistory(
      metric,
      Math.max(limit * 2, 50),
      cursor
    ); // 필터링을 위해 더 많이 생성

    // 필터링 적용
    if (serverId) {
      history = history.filter(h => h.serverId === serverId);
    }

    if (model) {
      history = history.filter(h => h.model === model);
    }

    if (status) {
      history = history.filter(h => h.status === status);
    }

    // 정확도 범위 필터링
    history = history.filter(h => {
      if (h.accuracy === undefined) return status === 'pending'; // pending은 정확도가 없음
      return h.accuracy >= accuracyMin && h.accuracy <= accuracyMax;
    });

    // 페이지네이션
    const startIndex = 0; // cursor는 이미 데이터 생성에 반영됨
    const endIndex = startIndex + limit;
    const paginatedHistory = history.slice(startIndex, endIndex);
    const hasNextPage = endIndex < history.length;
    const nextCursor = hasNextPage ? cursor + limit : undefined;

    // 통계 계산
    const stats = calculateAccuracyStats(history);

    return NextResponse.json({
      data: paginatedHistory,
      nextCursor,
      hasNextPage,
      totalCount: history.length,
      pageSize: limit,
      stats,
      filters: {
        metric,
        serverId,
        model,
        status,
        accuracyRange: { min: accuracyMin, max: accuracyMax },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('예측 히스토리 조회 오류:', error);

    return NextResponse.json(
      {
        error: '예측 히스토리 조회에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 특정 예측 검증 (실제값 업데이트)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, actualValue } = body;

    if (!id || actualValue === undefined) {
      return NextResponse.json(
        {
          error: 'id와 actualValue가 필요합니다',
          required: ['id', 'actualValue'],
        },
        { status: 400 }
      );
    }

    // 실제로는 DB에서 업데이트
    const mockHistory = generatePredictionHistory('cpu', 1)[0];
    const predictedValue = mockHistory.predictedValue;
    const accuracy = Math.max(
      0,
      1 - Math.abs(predictedValue - actualValue) / 100
    );

    const updatedEntry: PredictionHistoryEntry = {
      ...mockHistory,
      id,
      actualValue: Math.round(actualValue * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      status: 'validated',
    };

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: '예측 검증이 완료되었습니다',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('예측 검증 오류:', error);

    return NextResponse.json(
      {
        error: '예측 검증에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
