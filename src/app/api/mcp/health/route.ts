import { NextRequest, NextResponse } from 'next/server';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';

/**
 * 🤖 MCP 서버 헬스체크 API
 *
 * 기능:
 * - MCP 서버 연결 상태 확인
 * - 워밍업 상태 조회
 * - 주기적 핑 테스트
 */

export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
    const mcpWarmupService = MCPWarmupService.getInstance();

    // 워밍업 상태 조회
    const warmupStatus = mcpWarmupService.getWarmupStatus();

    // 표준 MCP 서버만 최소한의 체크 (과도한 요청 방지)
    let healthResults = [];

    try {
      // 메인 Render MCP 서버만 체크 (1개로 축소)
      const response = await fetch(
        'https://openmanager-vibe-v5.onrender.com/health',
        {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000), // 타임아웃 증가
        }
      );

      healthResults = [
        {
          server: 'openmanager-vibe-v5',
          status: response.ok ? 'healthy' : 'degraded',
          responseCode: response.status,
          note: '표준 MCP 서버만 사용',
        },
      ];
    } catch (error) {
      healthResults = [
        {
          server: 'openmanager-vibe-v5',
          status: 'degraded',
          error: error instanceof Error ? error.message : 'Connection failed',
          note: '헬스체크 실패해도 로컬 표준 MCP 서버 사용',
        },
      ];
    }

    const responseTime = Date.now() - start;
    const healthyCount = healthResults.filter(
      r => r.status === 'healthy'
    ).length;

    return NextResponse.json({
      status: healthyCount > 0 ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      servers: healthResults,
      warmupStatus: warmupStatus,
      summary: {
        healthy: healthyCount,
        total: healthResults.length,
        percentage: Math.round((healthyCount / healthResults.length) * 100),
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - start;

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error.message,
        servers: [],
        warmupStatus: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const mcpWarmupService = MCPWarmupService.getInstance();

    if (action === 'warmup') {
      // 즉시 워밍업 실행
      const results = await mcpWarmupService.warmupAllServers();

      return NextResponse.json({
        success: true,
        action: 'warmup',
        timestamp: new Date().toISOString(),
        results: results,
      });
    } else if (action === 'start-periodic') {
      // 주기적 워밍업 시작 (1분 간격)
      mcpWarmupService.startPeriodicWarmup(1);

      return NextResponse.json({
        success: true,
        action: 'start-periodic',
        interval: '1 minute',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "warmup" or "start-periodic"',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
