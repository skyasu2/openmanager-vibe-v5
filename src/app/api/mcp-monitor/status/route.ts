/**
 * MCP 모니터링 시스템 상태 API 엔드포인트
 * GET /api/mcp-monitor/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGlobalMonitoringSystem } from '@/services/mcp-monitor';
import { MCP_SERVERS, SERVER_GROUPS } from '@/services/mcp-monitor/config';

export const runtime = 'edge';

/**
 * 모니터링 시스템 전체 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    const monitoringSystem = getGlobalMonitoringSystem();
    const isRunning = monitoringSystem.isRunning();

    if (!isRunning && detailed) {
      // 상세 정보 요청 시 모니터링 시스템 초기화
      await monitoringSystem.initialize();
    }

    const baseStatus = {
      timestamp: Date.now(),
      monitoringSystemRunning: isRunning,
      configuredServers: Object.keys(MCP_SERVERS).length,
      serverGroups: {
        critical: SERVER_GROUPS.critical.length,
        high: SERVER_GROUPS.high.length,
        medium: SERVER_GROUPS.medium.length,
        low: SERVER_GROUPS.low.length,
      },
    };

    if (!detailed || !isRunning) {
      return NextResponse.json(baseStatus);
    }

    // 상세 상태 정보
    const systemHealth = monitoringSystem.getSystemStatus();
    const latestMetrics = monitoringSystem.getLatestMetrics();
    const circuitBreakerStats = monitoringSystem.getCircuitBreakerStats();

    // 서버 그룹별 통계
    interface GroupStats {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      averageResponseTime: number;
    }

    const groupStats = Object.entries(SERVER_GROUPS).reduce(
      (acc, [priority, servers]) => {
        const groupMetrics = latestMetrics.filter((m) =>
          servers.includes(m.serverId as any)
        );

        acc[priority as keyof typeof SERVER_GROUPS] = {
          total: servers.length,
          healthy: groupMetrics.filter((m) => m.status === 'healthy').length,
          degraded: groupMetrics.filter((m) => m.status === 'degraded').length,
          unhealthy: groupMetrics.filter((m) => m.status === 'unhealthy')
            .length,
          averageResponseTime:
            groupMetrics.length > 0
              ? groupMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
                groupMetrics.length
              : 0,
        };

        return acc;
      },
      {} as Record<keyof typeof SERVER_GROUPS, GroupStats>
    );

    // 성능 요약
    const performanceSummary = {
      totalServers: latestMetrics.length,
      healthyServers: latestMetrics.filter((m) => m.status === 'healthy')
        .length,
      averageResponseTime:
        latestMetrics.length > 0
          ? latestMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
            latestMetrics.length
          : 0,
      systemSuccessRate:
        latestMetrics.length > 0
          ? latestMetrics.reduce((sum, m) => sum + m.successRate, 0) /
            latestMetrics.length
          : 0,
      circuitBreakersOpen: circuitBreakerStats.filter(
        (cb) => cb.state === 'open'
      ).length,
      criticalIssues: systemHealth.criticalIssues.length,
      warnings: systemHealth.warnings.length,
    };

    // 최근 이슈들
    const recentIssues = [
      ...systemHealth.criticalIssues.map((issue) => ({
        type: 'critical',
        message: issue,
      })),
      ...systemHealth.warnings.map((warning) => ({
        type: 'warning',
        message: warning,
      })),
    ];

    const detailedStatus = {
      ...baseStatus,
      systemHealth,
      performanceSummary,
      groupStats,
      recentIssues,
      uptime: 0, // MCPMonitoringSystem doesn't expose startTime
    };

    return NextResponse.json(detailedStatus);
  } catch (error) {
    console.error('MCP status API failed:', error);

    return NextResponse.json(
      {
        error: 'Status API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        monitoringSystemRunning: false,
      },
      { status: 500 }
    );
  }
}

/**
 * 모니터링 시스템 제어 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const monitoringSystem = getGlobalMonitoringSystem();

    let result = false;
    let message = '';

    switch (action) {
      case 'start':
        if (!monitoringSystem.isRunning()) {
          await monitoringSystem.initialize();
          result = true;
          message = 'Monitoring system started successfully';
        } else {
          result = true;
          message = 'Monitoring system is already running';
        }
        break;

      case 'stop':
        if (monitoringSystem.isRunning()) {
          monitoringSystem.stop();
          result = true;
          message = 'Monitoring system stopped successfully';
        } else {
          result = true;
          message = 'Monitoring system is already stopped';
        }
        break;

      case 'restart':
        monitoringSystem.stop();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await monitoringSystem.initialize();
        result = true;
        message = 'Monitoring system restarted successfully';
        break;

      case 'health-check-all': {
        const healthResults = await monitoringSystem.checkAllServersHealth();
        return NextResponse.json({
          success: true,
          results: healthResults,
          summary: {
            total: healthResults.length,
            healthy: healthResults.filter((r) => r.success).length,
            failed: healthResults.filter((r) => !r.success).length,
          },
          timestamp: Date.now(),
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: start, stop, restart, health-check-all',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      action,
      timestamp: Date.now(),
      monitoringSystemRunning: monitoringSystem.isRunning(),
    });
  } catch (error) {
    console.error('MCP status POST API failed:', error);

    return NextResponse.json(
      {
        error: 'Control action failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
