/**
 * 🚀 최적화된 데이터 생성기 API
 *
 * 24시간 베이스라인 + 실시간 변동 방식으로
 * 리소스 사용량을 최소화하면서 실시간 데이터 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { OptimizedDataGenerator } from '../../../../services/OptimizedDataGenerator';
import { SimulationEngine } from '@/services/simulationEngine';

const optimizedGenerator = OptimizedDataGenerator.getInstance();
const simulationEngine = new SimulationEngine();

/**
 * 📊 최적화된 데이터 생성기 API + 경연대회용 데모 시나리오
 *
 * GET: 현재 상태 + 데모 시나리오 상태 조회
 * POST: 데모 시나리오 제어 (시작/중지/재시작)
 */

export async function GET() {
  try {
    const generator = OptimizedDataGenerator.getInstance();
    const status = generator.getStatus();
    const demoStatus = generator.getDemoStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dataGenerator: {
        ...status,
        isRunning: status.isRunning,
        serversCount: status.serversCount,
        updateCounter: status.updateCounter,
        memoryUsage: status.memoryUsage,
      },
      demoScenario: demoStatus
        ? {
            ...demoStatus,
            isActive: demoStatus.isActive,
            currentPhase: demoStatus.currentPhase,
            timeRange: demoStatus.timeRange,
            koreanDescription: demoStatus.koreanDescription,
            elapsedMinutes: demoStatus.elapsedMinutes,
            nextPhaseIn: demoStatus.nextPhaseIn,
            aiAnalysisPoints: demoStatus.aiAnalysisPoints,
          }
        : {
            isActive: false,
            message: '데모 시나리오가 비활성화되어 있습니다.',
          },
    });
  } catch (error) {
    console.error('❌ 데이터 생성기 상태 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 🚀 최적화된 데이터 생성기 시작/중지 + 데모 시나리오 제어
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, enabled } = body;

    switch (action) {
      // 🎭 데모 시나리오 제어
      case 'demo-toggle':
        optimizedGenerator.toggleDemo(enabled);
        return NextResponse.json({
          success: true,
          message: `데모 시나리오가 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
          demoStatus: optimizedGenerator.getDemoStatus(),
        });

      case 'demo-restart':
        optimizedGenerator.restartDemo();
        return NextResponse.json({
          success: true,
          message: '데모 시나리오가 재시작되었습니다.',
          demoStatus: optimizedGenerator.getDemoStatus(),
        });

      // 🚀 기존 데이터 생성기 제어
      case 'start':
        if (optimizedGenerator.getStatus().isRunning) {
          return NextResponse.json(
            {
              success: false,
              error: '이미 실행 중입니다',
            },
            { status: 400 }
          );
        }

        // 시뮬레이션 엔진에서 서버 확인 및 생성
        let initialServers = simulationEngine.getServers();
        if (initialServers.length === 0) {
          // 시뮬레이션을 먼저 시작해서 서버 생성
          simulationEngine.start();
          initialServers = simulationEngine.getServers().slice(0, 30);
        }

        // 최적화된 생성기 시작
        await optimizedGenerator.start(initialServers);

        // 기존 시뮬레이션은 중지 (리소스 절약)
        if (simulationEngine.getIsRunning()) {
          simulationEngine.stop();
          console.log('🔄 기존 시뮬레이션 중지 후 최적화된 생성기로 전환');
        }

        return NextResponse.json({
          success: true,
          data: {
            message: '🎯 경연대회용 20분 시나리오 시작됨 (10초 간격)',
            status: optimizedGenerator.getStatus(),
            benefits: [
              '🏗️ 24시간 베이스라인 데이터 미리 생성 완료',
              '⚡ 실시간 변동만 계산하여 리소스 최적화',
              '🚀 Vercel 환경 최적화 (10초 간격)',
              '🎭 20분 후 자동 종료',
              `📊 ${initialServers.length}대 서버 모니터링`,
            ],
          },
        });

      case 'toggle':
        // 🎭 경연대회용 온오프 토글
        const currentStatus = optimizedGenerator.getStatus();

        if (currentStatus.isRunning) {
          optimizedGenerator.stop();
          return NextResponse.json({
            success: true,
            action: 'stopped',
            message: '데이터 생성기가 중지되었습니다.',
            data: { status: optimizedGenerator.getStatus() },
          });
        } else {
          return NextResponse.json({
            success: false,
            action: 'error',
            message:
              '토글 시작을 위해서는 POST {"action": "start"}를 사용하세요.',
          });
        }

      case 'stop':
        if (!optimizedGenerator.getStatus().isRunning) {
          return NextResponse.json(
            {
              success: false,
              error: '실행 중이 아닙니다',
            },
            { status: 400 }
          );
        }

        optimizedGenerator.stop();

        return NextResponse.json({
          success: true,
          data: {
            message: '최적화된 데이터 생성기 중지됨',
            finalStats: optimizedGenerator.getStatus(),
          },
        });

      case 'restart':
        // 재시작
        if (optimizedGenerator.getStatus().isRunning) {
          optimizedGenerator.stop();
        }

        const servers = simulationEngine.getServers();
        if (servers.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: '초기 서버 데이터가 없습니다',
            },
            { status: 400 }
          );
        }

        await optimizedGenerator.start(servers);

        return NextResponse.json({
          success: true,
          data: {
            message: '최적화된 데이터 생성기 재시작됨',
            status: optimizedGenerator.getStatus(),
          },
        });

      case 'switch-to-original':
        // 기존 시뮬레이션으로 되돌리기
        if (optimizedGenerator.getStatus().isRunning) {
          optimizedGenerator.stop();
        }

        if (!simulationEngine.getIsRunning()) {
          simulationEngine.start();
        }

        return NextResponse.json({
          success: true,
          data: {
            message: '기존 시뮬레이션 엔진으로 전환됨',
            warning: '리소스 사용량이 증가할 수 있습니다',
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 액션입니다',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 최적화된 데이터 생성기 제어 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * ⚙️ 최적화된 데이터 생성기 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    // 설정 검증
    const validKeys = [
      'usePregenerated',
      'realTimeVariationIntensity',
      'patternUpdateInterval',
      'memoryOptimizationEnabled',
      'prometheusEnabled',
    ];

    const invalidKeys = Object.keys(config || {}).filter(
      key => !validKeys.includes(key)
    );
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 설정 키: ${invalidKeys.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 설정 범위 검증
    if (
      config.realTimeVariationIntensity &&
      (config.realTimeVariationIntensity < 0.05 ||
        config.realTimeVariationIntensity > 0.5)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'realTimeVariationIntensity는 0.05-0.5 범위여야 합니다',
        },
        { status: 400 }
      );
    }

    if (
      config.patternUpdateInterval &&
      (config.patternUpdateInterval < 300000 ||
        config.patternUpdateInterval > 86400000)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'patternUpdateInterval은 5분-24시간 범위여야 합니다',
        },
        { status: 400 }
      );
    }

    // 설정 업데이트
    optimizedGenerator.updateConfig(config);

    return NextResponse.json({
      success: true,
      data: {
        message: '설정이 업데이트되었습니다',
        currentConfig: optimizedGenerator.getStatus().config,
        updatedKeys: Object.keys(config),
      },
    });
  } catch (error) {
    console.error('❌ 설정 업데이트 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
