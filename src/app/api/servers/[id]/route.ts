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
    
    // 개발 환경에서만 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [API] Fetching server details for: ${serverId}`);
    }
    
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('history') === 'true';
    const historyHours = parseInt(searchParams.get('hours') || '24');

    // 최신 메트릭 조회
    const server = await metricsStorage.getLatestMetrics(serverId);
    
    if (!server) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [API] Server not found: ${serverId}`);
      }
      
      return NextResponse.json({
        success: false,
        error: 'Server not found',
        serverId,
        message: `Server with ID '${serverId}' does not exist or is not being monitored`,
        availableServers: await metricsStorage.getServerList()
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] Successfully fetched server: ${serverId}`);
    }

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 프로덕션에서는 간단한 로깅, 개발에서는 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [API] Failed to fetch server ${serverId}:`, error);
    } else {
      console.error(`❌ Server API error for ${serverId}: ${errorMessage}`);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch server details',
      serverId: serverId,
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 