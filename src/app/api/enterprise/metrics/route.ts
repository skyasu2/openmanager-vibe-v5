/**
 * 🏢 엔터프라이즈 메트릭 API v2.0
 *
 * 25개 핵심 메트릭 기반 로컬 생성 (Vercel 리소스 절약)
 * Google Cloud Functions 대신 가벼운 로컬 생성기 사용
 */

import { SimpleEnterpriseMetrics } from '@/services/data-generator/SimpleEnterpriseMetrics';
import { NextRequest, NextResponse } from 'next/server';

// 🏗️ 간단한 엔터프라이즈 메트릭 생성기 인스턴스
const metricsGenerator = SimpleEnterpriseMetrics.getInstance();

/**
 * 🎯 GET /api/enterprise/metrics
 * 25개 핵심 메트릭 생성 및 반환
 */
export async function GET(request: NextRequest) {
  try {
    // 🔧 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';
    const serverId = searchParams.get('serverId');
    const hours = searchParams.get('hours');
    const serverType = searchParams.get('serverType');

    let data;

    switch (action) {
      case 'current':
        // 📊 현재 모든 서버의 25개 메트릭 생성
        data = {
          metrics: metricsGenerator.generateMetrics(),
          totalServers: metricsGenerator.getAllServers().length,
          generatedAt: new Date().toISOString(),
        };
        break;

      case 'server':
        // 🔍 특정 서버의 상세 메트릭
        if (!serverId) {
          return NextResponse.json(
            {
              success: false,
              error: 'serverId 파라미터가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const allMetrics = metricsGenerator.generateMetrics();
        const serverMetrics = allMetrics.find(m => m.serverId === serverId);

        if (!serverMetrics) {
          return NextResponse.json(
            {
              success: false,
              error: `서버 ID '${serverId}'를 찾을 수 없습니다.`,
            },
            { status: 404 }
          );
        }

        data = {
          server: serverMetrics,
          scenario: metricsGenerator.getCurrentScenario(serverId),
          metrics: serverMetrics,
        };
        break;

      case 'dashboard':
        // 📈 대시보드 요약 정보
        const dashboardMetrics = metricsGenerator.generateMetrics();

        data = {
          summary: {
            totalServers: dashboardMetrics.length,
            healthyServers: dashboardMetrics.filter(
              m => m.systemHealth.serviceHealthScore >= 90
            ).length,
            warningServers: dashboardMetrics.filter(
              m =>
                m.systemHealth.serviceHealthScore >= 70 &&
                m.systemHealth.serviceHealthScore < 90
            ).length,
            criticalServers: dashboardMetrics.filter(
              m => m.systemHealth.serviceHealthScore < 70
            ).length,
            avgCpuUsage: Math.round(
              dashboardMetrics.reduce(
                (sum, m) => sum + m.systemResources.cpuUsage,
                0
              ) / dashboardMetrics.length
            ),
            avgMemoryUsage: Math.round(
              dashboardMetrics.reduce(
                (sum, m) => sum + m.systemResources.memoryUsage,
                0
              ) / dashboardMetrics.length
            ),
            totalErrors: dashboardMetrics.reduce(
              (sum, m) => sum + m.systemHealth.logErrors,
              0
            ),
          },
          servers: dashboardMetrics,
        };
        break;

      case 'scenarios':
        // 🎭 현재 활성 시나리오들
        const servers = metricsGenerator.getAllServers();
        data = {
          scenarios: servers.map(server => ({
            serverId: server.id,
            serverName: server.name,
            scenario: metricsGenerator.getCurrentScenario(server.id),
          })),
        };
        break;

      case 'status':
        // ⚙️ 생성기 상태
        data = metricsGenerator.getStatus();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션입니다: ${action}`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'local-generator',
      timestamp: new Date().toISOString(),
      action,
      params: { serverId, hours, serverType },
      performance: {
        responseTime: '< 10ms',
        metricsCount: 25,
        serversCount: metricsGenerator.getAllServers().length,
      },
    });
  } catch (error) {
    console.error('🚨 엔터프라이즈 메트릭 생성 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '메트릭 생성 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 POST /api/enterprise/metrics
 * 엔터프라이즈 메트릭 생성기 제어 (enable/disable)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!['enable', 'disable'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 액션입니다. enable 또는 disable만 허용됩니다.',
        },
        { status: 400 }
      );
    }

    // 🔧 생성기 제어
    if (action === 'enable') {
      metricsGenerator.enable();
    } else {
      metricsGenerator.disable();
    }

    const status = metricsGenerator.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        action,
        status,
        message: `엔터프라이즈 메트릭 생성기가 ${action === 'enable' ? '활성화' : '비활성화'}되었습니다.`,
      },
      source: 'local-generator',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('🚨 엔터프라이즈 메트릭 제어 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '메트릭 생성기 제어 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
