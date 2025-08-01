/**
 * MCP 서버 헬스체크 API 엔드포인트
 * GET /api/mcp-monitor/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPHealthChecker } from '@/services/mcp-monitor/health-checker';
import type {
  HealthCheckResult,
  SystemHealthSummary,
} from '@/services/mcp-monitor/types';

export const runtime = 'edge';

/**
 * MCP 서버 헬스체크 실행
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('server');
    const detailed = searchParams.get('detailed') === 'true';

    const healthChecker = new MCPHealthChecker();

    if (serverId) {
      // 개별 서버 헬스체크
      const result = await healthChecker.checkServer(serverId as any);

      if (detailed) {
        const deepResult = await healthChecker.performDeepHealthCheck(
          serverId as any
        );
        return NextResponse.json(deepResult);
      }

      return NextResponse.json(result);
    } else {
      // 전체 시스템 헬스체크
      const results = await healthChecker.checkAllServers();
      const systemHealth = await healthChecker.performSystemHealthCheck();

      const response = {
        timestamp: Date.now(),
        serverResults: results,
        systemSummary: systemHealth,
        totalServers: results.length,
        healthyServers: results.filter((r) => r.success).length,
        performanceAvg:
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('MCP health check failed:', error);

    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
