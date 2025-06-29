/**
 * 🔮 AI 예측 엔드포인트 v5.43.0 - 경량 ML 엔진 기반
 *
 * 완전히 리팩터링된 예측 API:
 * - TensorFlow 완전 제거
 * - 경량 ML 엔진 사용
 * - Vercel 서버리스 최적화
 * - 실시간 서버 로드 예측
 */

import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalytics } from '@/services/ai/PredictiveAnalytics';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔮 AI 예측 API 호출 시작');

    const body = await request.json();
    const { serverId, timeframeMinutes = 60 } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: '서버 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 예측 분석 서비스 초기화
    const analytics = PredictiveAnalytics.getInstance();

    // 서버 로드 예측 실행
    const prediction = await analytics.predictServerLoad(
      serverId,
      timeframeMinutes
    );

    console.log(`✅ 서버 ${serverId} 예측 완료 (${timeframeMinutes}분 전망)`);

    return NextResponse.json({
      success: true,
      data: prediction,
      meta: {
        serverId,
        timeframeMinutes,
        generatedAt: new Date().toISOString(),
        engine: 'lightweight-ml-v5.43.0',
      },
    });
  } catch (error) {
    console.error('❌ AI 예측 API 오류:', error);

    return NextResponse.json(
      {
        error: '예측 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const timeframe = searchParams.get('timeframe');

    if (!serverId) {
      return NextResponse.json(
        { error: '서버 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const timeframeMinutes = timeframe ? parseInt(timeframe) : 60;
    const analytics = PredictiveAnalytics.getInstance();
    const prediction = await analytics.predictServerLoad(
      serverId,
      timeframeMinutes
    );

    return NextResponse.json({
      success: true,
      data: prediction,
      meta: {
        serverId,
        timeframeMinutes,
        generatedAt: new Date().toISOString(),
        engine: 'lightweight-ml-v5.43.0',
      },
    });
  } catch (error) {
    console.error('❌ AI 예측 API 오류:', error);

    return NextResponse.json(
      {
        error: '예측 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
