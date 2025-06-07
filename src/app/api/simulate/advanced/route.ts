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

/**
 * 📊 고도화된 시뮬레이션 상태 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'full'; // full | summary | health
    const serverType = searchParams.get('serverType'); // 특정 서버 유형만 조회
    const includeScenarios = searchParams.get('includeScenarios') !== 'false';

    // 서버 데이터 조회
    let servers = advancedSimulationEngine.getAnalysisTargets();

    // 서버 유형 필터링
    if (serverType) {
      servers = servers.filter(server => server.role === serverType);
    }

    const summary = advancedSimulationEngine.getIntegratedAIMetrics();
    const activeScenarios = includeScenarios
      ? advancedSimulationEngine.getActiveScenarios()
      : [];

    // 응답 형식별 처리
    let responseData;

    switch (format) {
      case 'summary':
        responseData = {
          ...summary.aiAnalysisMetrics,
          metadata: summary.metadata,
        };
        break;

      case 'health':
        responseData = {
          summary,
          healthDetails: {
            serversByType: servers.reduce((acc: any, server) => {
              const type = server.role;
              if (!acc[type]) acc[type] = [];
              acc[type].push({
                id: server.id,
                health_score: server.health_score,
                predicted_status: server.predicted_status,
                cascade_risk: server.cascade_risk,
                active_scenarios: server.active_scenarios,
              });
              return acc;
            }, {}),
            riskAnalysis: {
              highRiskServers: servers
                .filter(s => s.cascade_risk > 60)
                .map(s => ({
                  id: s.id,
                  role: s.role,
                  cascade_risk: s.cascade_risk,
                  reason:
                    s.active_scenarios.length > 0
                      ? '활성 장애 시나리오'
                      : '구조적 위험',
                })),
              dependencyIssues: servers
                .filter(s => s.dependency_health < 70)
                .map(s => ({
                  id: s.id,
                  role: s.role,
                  dependency_health: s.dependency_health,
                  dependencies: s.serverType.dependencies,
                })),
            },
          },
          activeScenarios,
        };
        break;

      case 'full':
      default:
        responseData = {
          servers: servers.map(server => ({
            ...server,
            // 민감 정보 제외하고 전송
            serverType: {
              type: server.serverType.type,
              tags: server.serverType.tags,
              characteristics: server.serverType.characteristics,
            },
          })),
          summary,
          activeScenarios,
          metadata: {
            totalMetrics: servers.length * 10, // 대략적인 메트릭 수
            lastUpdated: new Date().toISOString(),
            engineVersion: '3.0',
            isRunning: advancedSimulationEngine.getIsRunning(),
          },
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ [AdvancedSimulation] 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '고도화된 시뮬레이션 데이터 조회에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
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
        const summary = advancedSimulationEngine.getIntegratedAIMetrics();
        const activeScenarios = advancedSimulationEngine.getActiveScenarios();

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
