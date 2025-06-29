/**
 * 🔮 통합 예측 시스템 API 엔드포인트
 *
 * Phase 4: 모든 예측 관련 기능을 통합한 단일 API
 * - PredictiveAnalysisEngine
 * - AutoIncidentReportSystem
 * - AnomalyDetectionService
 * - LightweightMLEngine
 *
 * 지원 액션:
 * - add_data_point: 데이터 포인트 추가 및 예측
 * - predict_failure: 장애 예측
 * - integrated_analysis: 통합 분석 수행
 * - predictive_report: 예측 기반 보고서 생성
 * - optimize_weights: 모델 가중치 최적화
 * - system_health: 시스템 건강 상태 조회
 * - detect_incident: 장애 감지
 * - detect_anomalies: 이상 탐지
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntegratedPredictionSystem } from '@/core/ai/systems/IntegratedPredictionSystem';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 전역 인스턴스 (메모리 효율성을 위해)
let integratedPredictionSystem: IntegratedPredictionSystem | null = null;

// 요청 스키마 정의
const IntegratedPredictionRequestSchema = z.object({
  action: z.enum([
    'add_data_point',
    'predict_failure',
    'integrated_analysis',
    'predictive_report',
    'optimize_weights',
    'system_health',
    'detect_incident',
    'detect_anomalies',
    'calculate_accuracy',
    'get_historical_data',
    'clear_historical_data',
    'update_config',
  ]),
  serverId: z.string().optional(),
  data: z.any().optional(),
  config: z.any().optional(),
});

/**
 * 🔮 통합 예측 시스템 인스턴스 가져오기
 */
function getIntegratedPredictionSystem(): IntegratedPredictionSystem {
  if (!integratedPredictionSystem) {
    console.log('🔮 IntegratedPredictionSystem 인스턴스 생성...');
    integratedPredictionSystem = new IntegratedPredictionSystem({
      predictionHorizon: 60,
      anomalyThreshold: 2.5,
      minDataPoints: 10,
      enableRealTimeLearning: true,
      enablePreemptiveReporting: true,
    });
  }
  return integratedPredictionSystem;
}

/**
 * POST: 통합 예측 시스템 액션 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 검증
    const validationResult = IntegratedPredictionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청 형식입니다.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action, serverId, data, config } = validationResult.data;
    const predictionSystem = getIntegratedPredictionSystem();

    console.log(
      `🎯 통합 예측 시스템 액션 실행: ${action} (서버: ${serverId || 'N/A'})`
    );

    let result: any;

    switch (action) {
      case 'add_data_point': {
        if (!serverId || !data) {
          return NextResponse.json(
            { success: false, error: 'serverId와 data가 필요합니다.' },
            { status: 400 }
          );
        }

        // 데이터 포인트 변환
        const dataPoint = {
          timestamp: new Date(data.timestamp || Date.now()),
          cpu: data.cpu || 0,
          memory: data.memory || 0,
          disk: data.disk || 0,
          network: data.network || 0,
          errorRate: data.errorRate || 0,
          responseTime: data.responseTime || 0,
        };

        result = await predictionSystem.addDataPoint(serverId, dataPoint);
        break;
      }

      case 'predict_failure': {
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다.' },
            { status: 400 }
          );
        }

        result = await predictionSystem.predictFailure(serverId);
        break;
      }

      case 'integrated_analysis': {
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다.' },
            { status: 400 }
          );
        }

        result = await predictionSystem.performIntegratedAnalysis(serverId);
        break;
      }

      case 'predictive_report': {
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다.' },
            { status: 400 }
          );
        }

        result = await predictionSystem.generatePredictiveReport(serverId);
        break;
      }

      case 'optimize_weights': {
        result = await predictionSystem.optimizeModelWeights();
        break;
      }

      case 'system_health': {
        result = await predictionSystem.getSystemHealth();
        break;
      }

      case 'detect_incident': {
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'metrics data가 필요합니다.' },
            { status: 400 }
          );
        }

        // ServerMetrics 변환
        const metrics = {
          serverId: data.serverId || 'unknown',
          timestamp: new Date(data.timestamp || Date.now()),
          cpu: {
            usage: data.cpu?.usage || 0,
            temperature: data.cpu?.temperature || 0,
          },
          memory: {
            usage: data.memory?.usage || 0,
            available: data.memory?.available || 0,
          },
          disk: { usage: data.disk?.usage || 0, io: data.disk?.io || 0 },
          network: { in: data.network?.in || 0, out: data.network?.out || 0 },
        };

        result = await predictionSystem.detectIncident(metrics);
        break;
      }

      case 'detect_anomalies': {
        if (!data || !Array.isArray(data.metrics)) {
          return NextResponse.json(
            { success: false, error: 'metrics 배열이 필요합니다.' },
            { status: 400 }
          );
        }

        // ServerMetrics 배열 변환
        const metricsArray = data.metrics.map((m: any) => ({
          serverId: m.serverId || 'unknown',
          timestamp: new Date(m.timestamp || Date.now()),
          cpu: {
            usage: m.cpu?.usage || 0,
            temperature: m.cpu?.temperature || 0,
          },
          memory: {
            usage: m.memory?.usage || 0,
            available: m.memory?.available || 0,
          },
          disk: { usage: m.disk?.usage || 0, io: m.disk?.io || 0 },
          network: { in: m.network?.in || 0, out: m.network?.out || 0 },
        }));

        result = await predictionSystem.detectAnomalies(
          metricsArray,
          data.logs
        );
        break;
      }

      case 'calculate_accuracy': {
        result = await predictionSystem.calculateAccuracy(serverId);
        break;
      }

      case 'get_historical_data': {
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다.' },
            { status: 400 }
          );
        }

        const hours = data?.hours || 24;
        result = predictionSystem.getHistoricalData(serverId, hours);
        break;
      }

      case 'clear_historical_data': {
        predictionSystem.clearHistoricalData(serverId);
        result = { message: `히스토리 데이터 정리 완료: ${serverId || 'ALL'}` };
        break;
      }

      case 'update_config': {
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'config가 필요합니다.' },
            { status: 400 }
          );
        }

        predictionSystem.updateConfig(config);
        result = {
          message: '설정 업데이트 완료',
          newConfig: predictionSystem.getConfig(),
        };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `지원하지 않는 액션: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      serverId,
      result,
      timestamp: new Date().toISOString(),
      systemMetrics: predictionSystem.getSystemMetrics(),
    });
  } catch (error) {
    console.error('❌ 통합 예측 시스템 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '통합 예측 시스템 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 시스템 상태 및 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const serverId = searchParams.get('serverId');

    const predictionSystem = getIntegratedPredictionSystem();

    let result: any;

    switch (action) {
      case 'status': {
        result = {
          status: 'running',
          activeServers: predictionSystem.getActiveServers(),
          systemMetrics: predictionSystem.getSystemMetrics(),
          config: predictionSystem.getConfig(),
        };
        break;
      }

      case 'health': {
        result = await predictionSystem.getSystemHealth();
        break;
      }

      case 'accuracy': {
        result = await predictionSystem.calculateAccuracy(
          serverId || undefined
        );
        break;
      }

      case 'servers': {
        result = {
          activeServers: predictionSystem.getActiveServers(),
          serverCount: predictionSystem.getActiveServers().length,
        };
        break;
      }

      case 'metrics': {
        result = predictionSystem.getSystemMetrics();
        break;
      }

      case 'config': {
        result = predictionSystem.getConfig();
        break;
      }

      case 'historical_data': {
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다.' },
            { status: 400 }
          );
        }

        const hours = parseInt(searchParams.get('hours') || '24');
        result = predictionSystem.getHistoricalData(serverId, hours);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `지원하지 않는 액션: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 통합 예측 시스템 GET API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 정보 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const config = await request.json();
    const predictionSystem = getIntegratedPredictionSystem();

    predictionSystem.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: '설정 업데이트 완료',
      newConfig: predictionSystem.getConfig(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 설정 업데이트 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '설정 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 데이터 정리
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const dataType = searchParams.get('type') || 'historical';

    const predictionSystem = getIntegratedPredictionSystem();

    if (dataType === 'historical') {
      predictionSystem.clearHistoricalData(serverId || undefined);
      return NextResponse.json({
        success: true,
        message: `히스토리 데이터 정리 완료: ${serverId || 'ALL'}`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: `지원하지 않는 데이터 타입: ${dataType}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 데이터 정리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '데이터 정리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS: CORS 지원
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
