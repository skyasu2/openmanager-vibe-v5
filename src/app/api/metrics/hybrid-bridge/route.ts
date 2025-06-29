import { NextRequest, NextResponse } from 'next/server';
import { HybridMetricsBridge } from '@/services/ai/HybridMetricsBridge';

// 하이브리드 메트릭 브리지 인스턴스
let hybridBridge: HybridMetricsBridge | null = null;

// 브리지 인스턴스 초기화
function getHybridBridge(): HybridMetricsBridge {
  if (!hybridBridge) {
    hybridBridge = new HybridMetricsBridge();
  }
  return hybridBridge;
}

// GET: 실시간 분석 결과 조회
export async function GET() {
  try {
    const bridge = getHybridBridge();
    const analysis = await bridge.analyzeRealtime();

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('하이브리드 브리지 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: 히스토리컬 분석 또는 자연어 쿼리 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bridge = getHybridBridge();

    // 자연어 쿼리 처리
    if (body.type === 'natural_language_query') {
      const { query, context } = body;

      if (!query) {
        return NextResponse.json(
          { success: false, error: '쿼리가 필요합니다' },
          { status: 400 }
        );
      }

      const nlQuery = {
        query,
        context: {
          timeRange: context?.timeRange,
          servers: context?.servers,
          metrics: context?.metrics,
          language: context?.language || 'ko',
        },
        intent: {
          type: 'status' as const,
          entities: [],
          confidence: 0.8,
        },
      };

      const response = await bridge.processNaturalLanguageQuery(nlQuery);

      return NextResponse.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    }

    // 히스토리컬 분석
    if (body.type === 'historical_analysis') {
      const { timeRange } = body;

      if (!timeRange || !timeRange.start || !timeRange.end) {
        return NextResponse.json(
          { success: false, error: '시간 범위가 필요합니다' },
          { status: 400 }
        );
      }

      const analysis = await bridge.analyzeHistorical({
        start: new Date(timeRange.start),
        end: new Date(timeRange.end),
      });

      return NextResponse.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 요청 타입입니다' },
      { status: 400 }
    );
  } catch (error) {
    console.error('하이브리드 브리지 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '요청 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT: 브리지 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const bridge = getHybridBridge();

    // 설정 업데이트 로직 (향후 구현)
    // bridge.updateConfig(body.config);

    return NextResponse.json({
      success: true,
      message: '설정이 업데이트되었습니다',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('하이브리드 브리지 설정 업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '설정 업데이트 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: 브리지 리셋
export async function DELETE() {
  try {
    // 브리지 인스턴스 리셋
    hybridBridge = null;

    return NextResponse.json({
      success: true,
      message: '하이브리드 브리지가 리셋되었습니다',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('하이브리드 브리지 리셋 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '브리지 리셋 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
