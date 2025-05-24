import { NextRequest, NextResponse } from 'next/server';
import { metricsStorage } from '../../../../services/storage';

/**
 * 특정 서버 상세 정보 조회 API
 * GET /api/servers/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let serverId: string = 'unknown';
  
  try {
    const resolvedParams = await params;
    serverId = resolvedParams.id;
    
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('history') === 'true';
    const historyHours = parseInt(searchParams.get('hours') || '24');

    // 최신 메트릭 조회
    const server = await metricsStorage.getLatestMetrics(serverId);
    
    if (!server) {
      return NextResponse.json({
        success: false,
        error: 'Server not found',
        serverId
      }, { status: 404 });
    }

    // 온라인 상태 확인
    const isOnline = await metricsStorage.isServerOnline(serverId);
    server.status = isOnline ? server.status : 'offline';

    const result: any = {
      success: true,
      data: server,
      timestamp: new Date().toISOString()
    };

    // 히스토리 데이터 포함 요청시
    if (includeHistory) {
      const history = await metricsStorage.getMetricsHistory(serverId, historyHours);
      result.history = {
        period: `${historyHours}h`,
        dataPoints: history.length,
        metrics: history.map(h => ({
          timestamp: h.timestamp,
          cpu: h.cpu.usage,
          memory: h.memory.usage,
          disk: h.disk.usage,
          network: {
            bytesReceived: h.network.bytesReceived,
            bytesSent: h.network.bytesSent
          }
        }))
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error(`❌ Failed to fetch server ${serverId}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch server details',
      serverId: serverId,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 