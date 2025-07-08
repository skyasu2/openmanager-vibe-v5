/**
 * GCP 서버 데이터 생성기 API 엔드포인트
 * TDD 방식으로 완성된 GCP 데이터 생성기 서비스
 */

import { TDDGCPDataGenerator } from '@/services/gcp/TDDGCPDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// 글로벌 인스턴스 (세션 관리용)
let gcpDataGenerator: TDDGCPDataGenerator | null = null;

function getGCPDataGenerator() {
  if (!gcpDataGenerator) {
    gcpDataGenerator = new TDDGCPDataGenerator();
  }
  return gcpDataGenerator;
}

/**
 * GET: 기본 데이터셋 생성
 */
export async function GET(request: NextRequest) {
  try {
    const generator = getGCPDataGenerator();
    const dataset = generator.generateBaselineDataset();

    return NextResponse.json({
      success: true,
      data: dataset,
      timestamp: new Date().toISOString(),
      message: '10개 서버 기본 데이터셋이 생성되었습니다.',
    });
  } catch (error) {
    console.error('GCP 데이터 생성기 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GCP 데이터 생성기에서 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 실시간 메트릭 생성 및 세션 관리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, scenario, startDate, endDate } = body;
    const generator = getGCPDataGenerator();

    switch (action) {
      case 'start_session':
        await generator.startSession(sessionId);
        return NextResponse.json({
          success: true,
          message: `세션 ${sessionId}이 시작되었습니다. 20분 후 자동 정지됩니다.`,
          sessionId,
          autoStopTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        });

      case 'generate_metrics':
        const metrics = await generator.generateRealtimeMetrics(sessionId);
        return NextResponse.json({
          success: true,
          data: metrics,
          count: metrics.length,
          timestamp: new Date().toISOString(),
        });

      case 'scenario_metrics':
        const scenarioMetrics = generator.generateScenarioMetrics(scenario);
        return NextResponse.json({
          success: true,
          data: scenarioMetrics,
          scenario,
          count: scenarioMetrics.length,
        });

      case 'historical_pattern':
        const historicalData = await generator.generateHistoricalPattern(
          startDate,
          endDate,
          'daily'
        );
        return NextResponse.json({
          success: true,
          data: historicalData,
          period: `${startDate} ~ ${endDate}`,
          count: historicalData.length,
        });

      case 'stop_session':
        await generator.stopSession(sessionId);
        return NextResponse.json({
          success: true,
          message: `세션 ${sessionId}이 정지되고 배치 데이터가 플러시되었습니다.`,
          sessionId,
        });

      case 'session_status':
        const isActive = generator.isSessionActive(sessionId);
        const wasAutoFlushed = generator.wasSessionAutoFlushed(sessionId);
        return NextResponse.json({
          success: true,
          sessionId,
          isActive,
          wasAutoFlushed,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
            supportedActions: [
              'start_session',
              'generate_metrics',
              'scenario_metrics',
              'historical_pattern',
              'stop_session',
              'session_status',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GCP 데이터 생성기 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GCP 데이터 생성기에서 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
