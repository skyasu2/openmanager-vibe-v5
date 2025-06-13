/**
 * 📊 MCP 기반 시스템 상태 모니터링 API
 *
 * ✅ 통합 AI 시스템 헬스체크
 * ✅ Keep-Alive 시스템 상태
 * ✅ 3단계 컨텍스트 시스템 모니터링
 * ✅ FastAPI 연결 상태
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAISystem } from '../../../../core/ai/unified-ai-system';
import { keepAliveSystem } from '../../../../services/ai/keep-alive-system';
import { getMCPClient } from '@/services/mcp/official-mcp-client';

const fastApiClient = {
  async getConnectionStatus() {
    return {
      isConnected: false,
      healthStatus: 'removed',
      lastHealthCheck: Date.now(),
    };
  },
  async checkHealth() {
    return {
      isConnected: false,
      healthStatus: 'removed',
      lastHealthCheck: Date.now(),
    };
  },
  async warmup() {
    return false;
  },
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 시스템 MCP 상태 확인 시작');

    const mcpClient = getMCPClient();

    // 전체 헬스체크 (Render 서버 포함)
    const healthStatus = await mcpClient.healthCheck();
    const connectionStatus = mcpClient.getConnectionStatus();
    const stats = mcpClient.getStats();

    // Render MCP 서버 정보 추출
    const renderMCPInfo = healthStatus['render-mcp'];

    const systemStatus = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      mcp: {
        enabled: true,
        servers: {
          local: {
            filesystem: connectionStatus.filesystem || false,
            postgres: connectionStatus.postgres || false,
            'openmanager-docs': connectionStatus['openmanager-docs'] || false,
          },
          render: {
            url: 'https://openmanager-vibe-v5.onrender.com',
            ips: ['13.228.225.19', '18.142.128.26', '54.254.162.138'],
            port: 10000,
            healthy: renderMCPInfo?.status === 'healthy',
            latency: renderMCPInfo?.latency,
            uptime: renderMCPInfo?.details?.uptime,
            version: renderMCPInfo?.details?.version,
            lastCheck: new Date().toISOString(),
          },
        },
        health: healthStatus,
        stats: {
          totalServers: stats.totalServers,
          connectedServers: stats.connectedServers,
          totalTools: stats.totalTools,
          isConnected: stats.isConnected,
          renderServerIncluded: true,
        },
      },
      performance: {
        averageLatency:
          Object.values(healthStatus)
            .filter(h => h.latency)
            .reduce((sum, h) => sum + (h.latency || 0), 0) /
            Object.values(healthStatus).filter(h => h.latency).length || 0,
        healthyServers: Object.values(healthStatus).filter(
          h => h.status === 'healthy'
        ).length,
        totalChecked: Object.keys(healthStatus).length,
      },
    };

    console.log('✅ 시스템 MCP 상태 확인 완료:', {
      localServers: Object.keys(systemStatus.mcp.servers.local).length,
      renderServerHealthy: systemStatus.mcp.servers.render.healthy,
      totalHealthy: systemStatus.performance.healthyServers,
    });

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('❌ 시스템 MCP 상태 확인 오류:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        mcp: {
          enabled: false,
          servers: {
            local: {},
            render: {
              url: 'https://openmanager-vibe-v5.onrender.com',
              ips: ['13.228.225.19', '18.142.128.26', '54.254.162.138'],
              port: 10000,
              healthy: false,
              error: 'Health check failed',
            },
          },
          health: {},
          stats: {
            totalServers: 0,
            connectedServers: 0,
            totalTools: 0,
            isConnected: false,
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 시스템 액션 실행
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'ping':
        // Keep-Alive 수동 트리거
        const pingResult = await keepAliveSystem.triggerManualPing();

        return NextResponse.json({
          success: true,
          data: {
            triggered: true,
            result: pingResult ? 'success' : 'failed',
            timestamp: Date.now(),
          },
          message: pingResult ? 'Keep-Alive 핑 성공' : 'Keep-Alive 핑 실패',
          timestamp: Date.now(),
        });

      case 'health':
        // FastAPI 헬스체크 강제 실행
        const health = await fastApiClient.checkHealth();

        return NextResponse.json({
          success: true,
          data: health,
          message: 'FastAPI 헬스체크 완료',
          timestamp: Date.now(),
        });

      case 'warmup':
        // FastAPI 웜업 실행
        const warmupResult = await fastApiClient.warmup();

        return NextResponse.json({
          success: true,
          data: {
            triggered: true,
            result: warmupResult ? 'success' : 'failed',
          },
          message: warmupResult ? 'AI 엔진 웜업 성공' : 'AI 엔진 웜업 실패',
          timestamp: Date.now(),
        });

      case 'reset_stats':
        // Keep-Alive 통계 리셋
        keepAliveSystem.resetStatistics();

        return NextResponse.json({
          success: true,
          data: { reset: true },
          message: 'Keep-Alive 통계가 리셋되었습니다',
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          {
            error: '알 수 없는 액션',
            code: 'UNKNOWN_ACTION',
            available: ['ping', 'health', 'warmup', 'reset_stats'],
            timestamp: Date.now(),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [API] MCP 액션 실행 실패:', error);

    return NextResponse.json(
      {
        error: 'MCP 액션 실행 실패',
        code: 'MCP_ACTION_FAILED',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
