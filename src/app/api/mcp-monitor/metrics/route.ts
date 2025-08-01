/**
 * MCP 서버 메트릭 API 엔드포인트
 * GET /api/mcp-monitor/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGlobalMonitoringSystem } from '@/services/mcp-monitor';
import type {
  MCPServerMetrics,
  SystemHealthSummary,
} from '@/services/mcp-monitor/types';

export const runtime = 'edge';

/**
 * MCP 서버 메트릭 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('server');
    const timeRange = searchParams.get('range') || '1h';
    const includeHistory = searchParams.get('history') === 'true';

    const monitoringSystem = getGlobalMonitoringSystem();

    if (!monitoringSystem.isRunning()) {
      // 모니터링 시스템이 실행 중이 아니면 초기화
      await monitoringSystem.initialize();
    }

    if (serverId) {
      // 개별 서버 메트릭
      const metrics = monitoringSystem
        .getLatestMetrics()
        .find((m) => m.serverId === serverId);

      if (!metrics) {
        return NextResponse.json(
          { error: 'Server not found', serverId },
          { status: 404 }
        );
      }

      const response = {
        server: metrics,
        circuitBreaker: monitoringSystem
          .getCircuitBreakerStats()
          .find((cb) => cb.serverId === serverId),
        timestamp: Date.now(),
      };

      return NextResponse.json(response);
    } else {
      // 전체 시스템 메트릭
      const latestMetrics = monitoringSystem.getLatestMetrics();
      const systemHealth = monitoringSystem.getSystemStatus();
      const circuitBreakerStats = monitoringSystem.getCircuitBreakerStats();

      const response = {
        timestamp: Date.now(),
        systemHealth,
        servers: latestMetrics,
        circuitBreakers: circuitBreakerStats,
        performanceSummary: {
          averageResponseTime:
            latestMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
            latestMetrics.length,
          totalRequests: latestMetrics.reduce(
            (sum, m) => sum + m.requestCount,
            0
          ),
          totalErrors: latestMetrics.reduce((sum, m) => sum + m.errorCount, 0),
          systemSuccessRate:
            latestMetrics.reduce((sum, m) => sum + m.successRate, 0) /
            latestMetrics.length,
        },
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('MCP metrics API failed:', error);

    return NextResponse.json(
      {
        error: 'Metrics API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 서버 재시작 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, action } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'serverId is required' },
        { status: 400 }
      );
    }

    const monitoringSystem = getGlobalMonitoringSystem();

    if (!monitoringSystem.isRunning()) {
      return NextResponse.json(
        { error: 'Monitoring system is not running' },
        { status: 503 }
      );
    }

    let result = false;
    let message = '';

    switch (action) {
      case 'restart':
        result = await monitoringSystem.restartServer(serverId);
        message = result
          ? 'Server restarted successfully'
          : 'Failed to restart server';
        break;

      case 'health-check': {
        const healthResult = await monitoringSystem.checkServerHealth(serverId);
        return NextResponse.json({
          success: true,
          result: healthResult,
          timestamp: Date.now(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: restart, health-check' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      serverId,
      action,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('MCP metrics POST API failed:', error);

    return NextResponse.json(
      {
        error: 'Action failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
