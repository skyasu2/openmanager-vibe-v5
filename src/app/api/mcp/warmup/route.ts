import { NextRequest, NextResponse } from 'next/server';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';

/**
 * 🔥 GET /api/mcp/warmup - 모든 MCP 서버 웜업
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'normal';
    const testMode = url.searchParams.get('test') === 'true';

    const warmupService = MCPWarmupService.getInstance();

    let results;
    if (testMode) {
      // 테스트 환경용 더 적극적인 웜업
      results = await warmupService.warmupForTesting();
    } else {
      // 일반 웜업
      results = await warmupService.warmupAllServers();
    }

    const successCount = results.filter(r => r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const failedServers = results.filter(r => !r.success);

    return NextResponse.json({
      success: successCount > 0,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failedServers.length,
        totalTime: totalTime,
        averageTime: Math.round(totalTime / results.length),
      },
      servers: results,
      failedServers: failedServers.map(s => ({
        server: s.server,
        error: s.error,
        attempts: s.attempts,
      })),
      warmupMode: testMode ? 'testing' : 'normal',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('🔥 MCP 웜업 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 서버 웜업 중 오류가 발생했습니다.',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔥 POST /api/mcp/warmup - 특정 서버 웜업
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, config } = body;

    if (!serverName) {
      return NextResponse.json(
        {
          success: false,
          error: 'serverName이 필요합니다.',
        },
        { status: 400 }
      );
    }

    const warmupService = MCPWarmupService.getInstance();

    // 사용자 정의 설정이 있으면 사용, 없으면 기본 설정 사용
    const serverConfig = config || {
      name: serverName,
      url: body.url || `https://${serverName}.onrender.com`,
      healthEndpoint: body.healthEndpoint || '/health',
      timeout: body.timeout || 30000,
      retries: body.retries || 3,
    };

    const result = await warmupService.warmupServer(serverConfig);

    return NextResponse.json({
      success: result.success,
      server: result.server,
      responseTime: result.responseTime,
      attempts: result.attempts,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('🔥 단일 서버 웜업 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 웜업 중 오류가 발생했습니다.',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
