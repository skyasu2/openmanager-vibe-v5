/**
 * 🧠 POST /api/prediction/analyze - 장애 예측 분석 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalysisEngine, MetricDataPoint } from '@/engines/PredictiveAnalysisEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, timeHorizon, analysisType, metricData } = body;

    if (!serverId) {
      return NextResponse.json(
        { success: false, error: '서버 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 시뮬레이션 데이터 생성 (실제 환경에서는 실제 메트릭 데이터 사용)
    const simulatedData: MetricDataPoint = metricData || {
      timestamp: new Date(),
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 20,
      disk: Math.random() * 60 + 30,
      network: Math.random() * 50 + 10,
      errorRate: Math.random() * 5,
      responseTime: Math.random() * 1000 + 100
    };

    // 예측 엔진 설정 업데이트 (요청된 경우)
    if (timeHorizon) {
      predictiveAnalysisEngine.updateSettings({ predictionHorizon: timeHorizon });
    }

    // 데이터 포인트 추가 및 예측 실행
    const prediction = await predictiveAnalysisEngine.addDataPoint(serverId, simulatedData);

    if (!prediction) {
      // 충분한 데이터가 없으면 기본 예측 실행
      const forcePrediction = await predictiveAnalysisEngine.predictFailure(serverId);
      
      if (!forcePrediction) {
        return NextResponse.json({
          success: false,
          message: '예측에 필요한 충분한 데이터가 없습니다',
          suggestion: '더 많은 메트릭 데이터를 수집한 후 다시 시도해주세요'
        });
      }

      return NextResponse.json({
        success: true,
        prediction: forcePrediction,
        dataStatus: 'insufficient',
        message: '제한된 데이터로 예측을 수행했습니다'
      });
    }

    return NextResponse.json({
      success: true,
      prediction,
      dataStatus: 'sufficient',
      message: '예측 분석이 성공적으로 완료되었습니다'
    });

  } catch (error) {
    console.error('🚨 예측 분석 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예측 분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { success: false, error: '서버 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 기존 예측 결과 조회
    const prediction = await predictiveAnalysisEngine.predictFailure(serverId);
    
    if (!prediction) {
      return NextResponse.json({
        success: false,
        message: '해당 서버에 대한 예측 데이터가 없습니다'
      });
    }

    return NextResponse.json({
      success: true,
      prediction,
      message: '예측 결과를 성공적으로 조회했습니다'
    });

  } catch (error) {
    console.error('🚨 예측 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예측 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 