import { NextRequest, NextResponse } from 'next/server';
import { adaptiveConfigManager } from '../../../../utils/VercelPlanDetector';

/**
 * 🎯 적응형 서버 구성 API
 * GET /api/config/adaptive
 * 
 * Vercel 플랜을 자동 감지하여 최적 서버 구성을 제공합니다.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'system';
    const environment = searchParams.get('environment') || 'production';

    // 적응형 구성 데이터 생성
    const adaptiveConfig = {
      type,
      environment,
      settings: {
        autoScaling: {
          enabled: true,
          minInstances: environment === 'production' ? 2 : 1,
          maxInstances: environment === 'production' ? 10 : 3,
          targetCpuUtilization: 70
        },
        monitoring: {
          enabled: true,
          interval: environment === 'production' ? 30 : 60,
          alertThreshold: 85
        },
        caching: {
          enabled: true,
          ttl: environment === 'production' ? 3600 : 1800,
          strategy: 'adaptive'
        },
        performance: {
          optimization: environment === 'production' ? 'aggressive' : 'balanced',
          compression: true,
          bundleAnalysis: environment !== 'production'
        }
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        configId: `adaptive-${Date.now()}`
      }
    };

    return NextResponse.json({
      success: true,
      data: adaptiveConfig
    });
  } catch (error) {
    console.error('적응형 구성 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '적응형 구성 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 플랜 재감지 강제 실행 API
 * POST /api/config/adaptive
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, environment, settings } = body;

    // 적응형 구성 업데이트 (시뮬레이션)
    const updatedConfig = {
      id: `config-${Date.now()}`,
      type: type || 'system',
      environment: environment || 'production',
      settings: {
        autoScaling: {
          enabled: settings?.autoScaling?.enabled !== false,
          minInstances: settings?.autoScaling?.minInstances || 1,
          maxInstances: settings?.autoScaling?.maxInstances || 5,
          targetCpuUtilization: settings?.autoScaling?.targetCpuUtilization || 70
        },
        monitoring: {
          enabled: settings?.monitoring?.enabled !== false,
          interval: settings?.monitoring?.interval || 30,
          alertThreshold: settings?.monitoring?.alertThreshold || 85
        },
        caching: {
          enabled: settings?.caching?.enabled !== false,
          ttl: settings?.caching?.ttl || 3600,
          strategy: settings?.caching?.strategy || 'adaptive'
        },
        performance: {
          optimization: settings?.performance?.optimization || 'balanced',
          compression: settings?.performance?.compression !== false,
          bundleAnalysis: settings?.performance?.bundleAnalysis || false
        }
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        configId: `adaptive-${Date.now()}`
      }
    };

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: '적응형 구성이 업데이트되었습니다'
    });
  } catch (error) {
    console.error('적응형 구성 업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '적응형 구성 업데이트 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 🎛️ 성능 기반 구성 조정 API
 * PUT /api/config/adaptive
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    const {
      performanceMetrics,
      currentConfig
    } = await request.json();

    if (!performanceMetrics || !currentConfig) {
      return NextResponse.json({
        success: false,
        error: 'performanceMetrics와 currentConfig가 필요합니다',
        required: {
          performanceMetrics: {
            memoryUsage: 'number (0-100)',
            responseTime: 'number (ms)',
            errorRate: 'number (0-100)'
          },
          currentConfig: 'OptimalServerConfig object'
        }
      }, { status: 400 });
    }

    console.log('🎛️ 성능 기반 구성 조정 시작...', performanceMetrics);

    // 성능 메트릭을 기반으로 구성 조정
    const adjustedConfig = await adaptiveConfigManager.adjustConfigByPerformance(
      currentConfig,
      performanceMetrics
    );

    const responseTime = Date.now() - startTime;

    // 조정 이유 분석
    const adjustmentReasons = [];

    if (performanceMetrics.memoryUsage > 80) {
      adjustmentReasons.push('높은 메모리 사용률로 인한 서버 수 감소');
    }
    if (performanceMetrics.responseTime > 2000) {
      adjustmentReasons.push('응답 지연으로 인한 생성 간격 증가');
    }
    if (performanceMetrics.errorRate > 5) {
      adjustmentReasons.push('높은 에러율로 인한 보수적 구성 적용');
    }
    if (adjustmentReasons.length === 0) {
      adjustmentReasons.push('성능 메트릭이 양호하여 조정 불필요');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      adjusted: adjustedConfig.serverCount !== currentConfig.serverCount ||
        adjustedConfig.generationInterval !== currentConfig.generationInterval,
      originalConfig: {
        serverCount: currentConfig.serverCount,
        generationInterval: currentConfig.generationInterval
      },
      adjustedConfig: {
        serverCount: adjustedConfig.serverCount,
        generationInterval: adjustedConfig.generationInterval,
        aiEnabled: adjustedConfig.aiEnabled
      },
      performanceMetrics,
      adjustmentReasons,
      message: adjustmentReasons.length > 1 ?
        '성능 이슈로 인한 구성 조정 완료' :
        '현재 성능이 양호하여 구성 유지'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : '구성 조정 실패',
      message: '성능 기반 구성 조정에 실패했습니다'
    }, { status: 500 });
  }
} 