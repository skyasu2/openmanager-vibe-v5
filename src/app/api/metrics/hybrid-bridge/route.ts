import { NextRequest, NextResponse } from 'next/server';
import { hybridMetricsBridge, TimeWindowOptions } from '@/services/metrics/HybridMetricsBridge';

/**
 * 🔗 Hybrid Metrics Bridge API
 * 
 * GET /api/metrics/hybrid-bridge
 * 
 * 기능:
 * - daily_metrics와 realtime_metrics 병합된 시계열 데이터 반환
 * - AI 분석용 최적화된 데이터 제공
 * - 특정 서버 또는 전체 서버 시계열 조회
 * - 시간 윈도우 및 필터링 옵션 지원
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const serverId = searchParams.get('serverId');
    const serverIds = searchParams.get('serverIds')?.split(',') || [];
    const duration = searchParams.get('duration') as '1h' | '6h' | '12h' | '24h' || '24h';
    const interval = searchParams.get('interval') as '1m' | '5m' | '15m' | '1h' || '5m';
    const analysisMode = searchParams.get('analysis') === 'true';
    const windowStart = searchParams.get('windowStart') ? new Date(searchParams.get('windowStart')!) : undefined;
    const windowEnd = searchParams.get('windowEnd') ? new Date(searchParams.get('windowEnd')!) : undefined;

    console.log(`🔗 HybridBridge API: ${serverId ? `server=${serverId}` : `servers=${serverIds.length}`}, duration=${duration}, analysis=${analysisMode}`);

    // 옵션 구성
    const options: TimeWindowOptions = {
      duration,
      interval,
      windowStart,
      windowEnd
    };

    // 단일 서버 시계열 조회
    if (serverId) {
      const timeSeries = await hybridMetricsBridge.getServerTimeSeries(serverId, options);
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          serverId,
          timeWindow: options,
          timeSeries,
          pointCount: timeSeries.length
        }
      });
    }

    // AI 분석 모드
    if (analysisMode) {
      const analysisData = await hybridMetricsBridge.getAIAnalysisData(serverIds, duration);
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          analysisMode: true,
          timeRange: duration,
          serverCount: analysisData.timeSeries.size,
          summary: analysisData.summary,
          timeSeries: Object.fromEntries(analysisData.timeSeries)
        }
      });
    }

    // 전체 병합 시계열 조회
    const mergedData = await hybridMetricsBridge.getMergedTimeSeries(options);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        serverCount: mergedData.serverGroups.size,
        totalPoints: mergedData.totalPoints,
        timeWindow: mergedData.timeWindow,
        dataSource: mergedData.dataSource,
        metadata: mergedData.metadata,
        timeSeries: Object.fromEntries(mergedData.serverGroups)
      },
      
      // 추가 컨텍스트 정보
      context: {
        bridgeVersion: '1.0.0',
        dataQuality: mergedData.dataSource.coverage >= 0.8 ? 'high' : 
                     mergedData.dataSource.coverage >= 0.5 ? 'medium' : 'low',
        recommendedUsage: mergedData.dataSource.coverage < 0.5 ? 
          'Consider checking data sources for missing metrics' : 
          'Data ready for analysis and prediction'
      }
    });

  } catch (error) {
    console.error('❌ HybridBridge API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 실시간 데이터 추가 및 시스템 동기화
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'append_realtime':
        // 실시간 데이터 추가
        if (!data || !data.serverId) {
          return NextResponse.json(
            { success: false, error: 'Missing serverId in data' },
            { status: 400 }
          );
        }

        hybridMetricsBridge.appendRealtimeData(data);
        
        return NextResponse.json({
          success: true,
          message: `Real-time data appended for server ${data.serverId}`,
          timestamp: new Date().toISOString()
        });

      case 'sync_health_checker':
        // SystemHealthChecker와 동기화
        await hybridMetricsBridge.syncWithHealthChecker();
        
        return NextResponse.json({
          success: true,
          message: 'Synced with SystemHealthChecker',
          timestamp: new Date().toISOString()
        });

      case 'cleanup_cache':
        // 캐시 정리
        hybridMetricsBridge.cleanup();
        
        return NextResponse.json({
          success: true,
          message: 'Cache cleaned up successfully',
          timestamp: new Date().toISOString()
        });

      case 'get_current_window':
        // 현재 20분 윈도우 데이터 반환
        const currentWindow = hybridMetricsBridge.getCurrentWindow();
        
        return NextResponse.json({
          success: true,
          data: {
            windowSizeMinutes: 20,
            serverCount: currentWindow.size,
            window: Object.fromEntries(currentWindow)
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action',
            availableActions: [
              'append_realtime',
              'sync_health_checker', 
              'cleanup_cache',
              'get_current_window'
            ]
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ HybridBridge POST API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 