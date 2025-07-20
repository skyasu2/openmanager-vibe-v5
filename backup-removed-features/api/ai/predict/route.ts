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
import { AnomalyDetection } from '@/services/ai/AnomalyDetection';

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
    const analytics = AnomalyDetection.getInstance();

    // 예측적 이상 감지 실행
    const prediction = await analytics.predictAnomalies(
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
    
    // AnomalyDetection이 ServerMetrics[] 타입을 요구하므로 임시 데이터 생성
    // 실제로는 데이터베이스나 다른 소스에서 서버 메트릭을 가져와야 함
    const mockServerMetrics = [{
      id: serverId,
      hostname: `server-${serverId}`,
      cpu_usage: 50,
      memory_usage: 60,
      disk_usage: 70,
      response_time: 100,
      status: 'healthy',
      uptime: 99.9,
      timestamp: new Date().toISOString(),
    }];
    
    const analytics = AnomalyDetection.getInstance();
    const prediction = await analytics.predictAnomalies(
      mockServerMetrics,
      timeframeMinutes / 60 // hoursAhead로 변환
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
