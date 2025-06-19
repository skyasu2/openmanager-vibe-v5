import { NextRequest, NextResponse } from 'next/server';

/**
 * AI 시스템 전체 상태 API
 * GET /api/ai/status
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();

    // AI 엔진들의 상태 정보
    const aiStatus = {
      status: 'healthy',
      timestamp,
      engines: {
        googleAI: {
          status: 'active',
          lastCheck: timestamp,
          responseTime: '~100ms',
          quota: 'available',
        },
        localRAG: {
          status: 'active',
          lastCheck: timestamp,
          vectorDB: 'connected',
          indexSize: '1.2MB',
        },
        mcpAI: {
          status: 'active',
          lastCheck: timestamp,
          servers: 6,
          activeConnections: 3,
        },
        unifiedEngine: {
          status: 'active',
          lastCheck: timestamp,
          mode: 'hybrid',
          fallbackReady: true,
        },
      },
      metrics: {
        totalRequests: 9842,
        successRate: 98.5,
        averageResponseTime: 145,
        activeConnections: 12,
        memoryUsage: '45MB',
        uptime: '2h 15m',
      },
      health: {
        overall: 'healthy',
        issues: [],
        warnings: [],
      },
    };

    return NextResponse.json(aiStatus, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('AI Status API Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'AI 상태 확인 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
