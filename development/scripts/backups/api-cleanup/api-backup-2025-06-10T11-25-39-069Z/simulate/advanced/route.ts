/**
 * 🚀 고도화된 서버 시뮬레이션 API v3.0
 *
 * ✨ 특징:
 * - 서버 유형별 특성 기반 데이터 생성
 * - 현실적 장애 시나리오 & 전이 모델
 * - 인과관계 기반 장애 전파
 * - 점진적 상태 변화 및 복구 흐름
 * - Redis/Supabase 저장 최적화
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedSimulationEngine } from '@/services/AdvancedSimulationEngine';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api/errorHandler';

/**
 * 📊 고도화된 시뮬레이션 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎭 고급 시뮬레이션 API 호출');

    const { searchParams } = new URL(request.url);
    const serverType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '30');

    // 실제 데이터 기반 분석 대상 조회
    let servers = await advancedSimulationEngine.getAnalysisTargets();

    // 서버 유형 필터링
    if (serverType) {
      servers = servers.filter(server => server.role === serverType);
    }

    // 서버 수 제한
    servers = servers.slice(0, limit);

    const summary = await advancedSimulationEngine.getIntegratedAIMetrics();
    const activeScenarios = await advancedSimulationEngine.getActiveScenarios();
    const status = advancedSimulationEngine.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        servers,
        summary,
        scenarios: activeScenarios,
        status,
        metadata: {
          serverCount: servers.length,
          dataSource: 'real_database_integrated',
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('❌ 고급 시뮬레이션 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '고급 시뮬레이션 처리 중 오류가 발생했습니다',
        code: 'SIMULATION_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🎮 시뮬레이션 제어 (시작/정지/설정)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, params } = body;

    let result: any = {};

    switch (action) {
      case 'start':
        if (!advancedSimulationEngine.getIsRunning()) {
          advancedSimulationEngine.start();
          result = {
            message: '고도화된 시뮬레이션이 시작되었습니다',
            status: 'started',
          };
        } else {
          result = {
            message: '시뮬레이션이 이미 실행 중입니다',
            status: 'already_running',
          };
        }
        break;

      case 'stop':
        if (advancedSimulationEngine.getIsRunning()) {
          advancedSimulationEngine.stop();
          result = {
            message: '고도화된 시뮬레이션이 정지되었습니다',
            status: 'stopped',
          };
        } else {
          result = {
            message: '시뮬레이션이 실행 중이 아닙니다',
            status: 'not_running',
          };
        }
        break;

      case 'status':
        const summary = await advancedSimulationEngine.getIntegratedAIMetrics();
        const activeScenarios =
          await advancedSimulationEngine.getActiveScenarios();

        result = {
          isRunning: advancedSimulationEngine.getIsRunning(),
          summary,
          activeScenarios,
          engineInfo: {
            version: '3.0',
            features: [
              'server_type_characteristics',
              'realistic_failure_scenarios',
              'cascade_impact_modeling',
              'gradual_state_transitions',
              'recovery_flow_simulation',
            ],
          },
        };
        break;

      case 'trigger_scenario':
        // 수동으로 특정 장애 시나리오 트리거 (개발/테스트용)
        const { scenarioId, serverId } = params || {};

        if (!scenarioId) {
          return NextResponse.json(
            {
              success: false,
              error: 'scenarioId가 필요합니다',
              timestamp: Date.now(),
            },
            { status: 400 }
          );
        }

        // 시나리오 트리거 로직은 private이므로 여기서는 상태만 반환
        result = {
          message: `시나리오 트리거 요청: ${scenarioId}`,
          note: '실제 구현은 시뮬레이션 엔진 내부에서 확률적으로 처리됩니다',
          availableScenarios: [
            'db_connection_spike',
            'disk_full_cascade',
            'k8s_node_not_ready',
            'web_service_degradation',
            'control_plane_failure',
          ],
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다',
            supportedActions: ['start', 'stop', 'status', 'trigger_scenario'],
            timestamp: Date.now(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ [AdvancedSimulation] 제어 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '고도화된 시뮬레이션 제어에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 시뮬레이션 설정 업데이트
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { settings } = body;

    // 현재는 기본 응답만 제공 (향후 확장 가능)
    const result = {
      message: '설정 업데이트 기능은 향후 구현 예정입니다',
      currentSettings: {
        updateFrequency: '30초',
        scenarioProbability: '확률 기반',
        recoveryMode: '점진적 복구',
        cascadeModeling: '활성화',
      },
      proposedSettings: settings,
    };

    return NextResponse.json({
      success: true,
      result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ [AdvancedSimulation] 설정 업데이트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '시뮬레이션 설정 업데이트에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
