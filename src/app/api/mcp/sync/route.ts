import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface MCPSyncData {
  type: string;
  metrics?: {
    timestamp: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      usage: number;
    };
    cpu: {
      user: number;
      system: number;
      loadAverage: number[];
    };
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
    data?: any;
    uptime: number;
  }>;
  renderContext?: {
    timestamp: string;
    uptime: number;
    environment: string;
    region: string;
  };
}

// MCP 동기화 데이터를 저장할 간단한 메모리 스토어
const mcpSyncStore = {
  lastSync: null as string | null,
  data: null as MCPSyncData | null,
  history: [] as Array<{ timestamp: string; data: MCPSyncData }>,
};

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const mcpSource = headersList.get('X-MCP-Source');

    // MCP 서버에서 오는 요청인지 확인
    if (mcpSource !== 'render-server') {
      return NextResponse.json(
        { error: '인증되지 않은 MCP 소스입니다' },
        { status: 401 }
      );
    }

    const syncData: MCPSyncData = await request.json();

    // 동기화 데이터 저장
    mcpSyncStore.lastSync = new Date().toISOString();
    mcpSyncStore.data = syncData;

    // 히스토리에 추가 (최대 10개 유지)
    mcpSyncStore.history.push({
      timestamp: mcpSyncStore.lastSync,
      data: syncData,
    });

    if (mcpSyncStore.history.length > 10) {
      mcpSyncStore.history = mcpSyncStore.history.slice(-10);
    }

    console.log(`[MCP-SYNC] ${syncData.type} 동기화 완료:`, {
      timestamp: mcpSyncStore.lastSync,
      uptime: syncData.renderContext?.uptime,
      memoryUsage: syncData.metrics?.memory?.usage,
      logsCount: syncData.logs?.length,
    });

    return NextResponse.json({
      success: true,
      timestamp: mcpSyncStore.lastSync,
      type: syncData.type,
      message: 'MCP 동기화 완료',
      received: {
        metrics: !!syncData.metrics,
        logs: syncData.logs?.length || 0,
        renderContext: !!syncData.renderContext,
      },
    });
  } catch (error) {
    console.error('[MCP-SYNC] 동기화 실패:', error);

    return NextResponse.json(
      {
        error: '동기화 처리 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          lastSync: mcpSyncStore.lastSync,
          hasData: !!mcpSyncStore.data,
          historyCount: mcpSyncStore.history.length,
          renderStatus: mcpSyncStore.data?.renderContext || null,
        });

      case 'latest':
        return NextResponse.json({
          lastSync: mcpSyncStore.lastSync,
          data: mcpSyncStore.data,
        });

      case 'history':
        return NextResponse.json({
          history: mcpSyncStore.history,
          count: mcpSyncStore.history.length,
        });

      case 'metrics':
        if (!mcpSyncStore.data?.metrics) {
          return NextResponse.json(
            { error: '메트릭 데이터가 없습니다' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          timestamp: mcpSyncStore.lastSync,
          metrics: mcpSyncStore.data.metrics,
          renderContext: mcpSyncStore.data.renderContext,
        });

      case 'logs':
        if (!mcpSyncStore.data?.logs) {
          return NextResponse.json(
            { error: '로그 데이터가 없습니다' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          timestamp: mcpSyncStore.lastSync,
          logs: mcpSyncStore.data.logs,
          count: mcpSyncStore.data.logs.length,
        });

      default:
        return NextResponse.json({
          message: 'MCP 동기화 엔드포인트',
          availableActions: ['status', 'latest', 'history', 'metrics', 'logs'],
          lastSync: mcpSyncStore.lastSync,
          documentation: {
            POST: 'MCP 서버에서 동기화 데이터 전송',
            GET: 'action 파라미터로 동기화 데이터 조회',
          },
        });
    }
  } catch (error) {
    console.error('[MCP-SYNC] 조회 실패:', error);

    return NextResponse.json(
      {
        error: '동기화 데이터 조회 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
