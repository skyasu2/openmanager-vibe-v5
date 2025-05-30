/**
 * 📊 Redis 기반 시계열 메트릭 API
 * 
 * OpenManager AI v5.11.0 - InfluxDB 대체 솔루션
 * - Redis 기반 시계열 데이터 조회
 * - 실시간 메트릭 집계
 * - 다중 서버 비교 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisTimeSeriesService } from '../../../../services/redisTimeSeriesService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const serverId = searchParams.get('server_id');
    const serverIds = searchParams.get('server_ids')?.split(',') || [];
    const timeRange = searchParams.get('time_range') || '1h';
    const metrics = searchParams.get('metrics')?.split(',') || ['cpu_usage', 'memory_usage', 'disk_usage'];
    const format = searchParams.get('format') || 'detailed'; // 'detailed' | 'chart' | 'stats'

    console.log(`📊 시계열 메트릭 조회: format=${format}, timeRange=${timeRange}`);

    // 단일 서버 조회
    if (serverId) {
      const result = await redisTimeSeriesService.queryMetrics(serverId, timeRange, metrics);
      
      return NextResponse.json({
        success: true,
        data: formatResponse(result, format),
        metadata: {
          server_id: serverId,
          time_range: timeRange,
          metrics: metrics,
          points_count: result.points.length,
          query_time: new Date().toISOString()
        }
      });
    }

    // 다중 서버 비교 조회
    if (serverIds.length > 0) {
      const results = await redisTimeSeriesService.queryMultipleServers(
        serverIds, 
        timeRange, 
        metrics[0] || 'cpu_usage'
      );
      
      return NextResponse.json({
        success: true,
        data: formatMultiServerResponse(results, format),
        metadata: {
          server_ids: serverIds,
          time_range: timeRange,
          metric: metrics[0],
          servers_count: serverIds.length,
          query_time: new Date().toISOString()
        }
      });
    }

    // 전체 저장소 통계
    const stats = redisTimeSeriesService.getStorageStats();
    
    return NextResponse.json({
      success: true,
      data: {
        storage_stats: stats,
        available_operations: [
          'GET /api/metrics/timeseries-redis?server_id=xxx&time_range=1h&metrics=cpu_usage,memory_usage',
          'GET /api/metrics/timeseries-redis?server_ids=xxx,yyy&time_range=24h&metric=cpu_usage',
          'GET /api/metrics/timeseries-redis (현재 통계 조회)'
        ]
      },
      metadata: {
        query_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 시계열 메트릭 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 📈 단일 서버 응답 포맷팅
 */
function formatResponse(result: any, format: string) {
  switch (format) {
    case 'chart':
      // 차트용 데이터 구조
      return {
        labels: result.points.map((p: any) => new Date(p.timestamp).toISOString()),
        datasets: Object.keys(result.points[0]?.metrics || {}).map(metric => ({
          label: metric,
          data: result.points.map((p: any) => p.metrics[metric])
        }))
      };
      
    case 'stats':
      // 통계 요약만
      return {
        aggregations: result.aggregations,
        latest_point: result.points[result.points.length - 1],
        points_count: result.points.length
      };
      
    default:
      // 상세 데이터
      return result;
  }
}

/**
 * 📊 다중 서버 응답 포맷팅
 */
function formatMultiServerResponse(results: Record<string, any[]>, format: string) {
  switch (format) {
    case 'chart':
      // 다중 서버 차트 데이터
      const timestamps = new Set();
      Object.values(results).forEach(points => {
        points.forEach(point => timestamps.add(point.timestamp));
      });
      
      const sortedTimestamps = Array.from(timestamps).sort();
      
      return {
        labels: sortedTimestamps.map(ts => new Date(ts as number).toISOString()),
        datasets: Object.entries(results).map(([serverId, points]) => ({
          label: serverId,
          data: sortedTimestamps.map(ts => {
            const point = points.find(p => p.timestamp === ts);
            return point ? point.metrics.cpu_usage : null;
          })
        }))
      };
      
    case 'stats':
      // 서버별 통계 요약
      return Object.entries(results).map(([serverId, points]) => ({
        server_id: serverId,
        points_count: points.length,
        latest_value: points[points.length - 1]?.metrics.cpu_usage || 0,
        avg_value: points.length > 0 
          ? points.reduce((sum, p) => sum + p.metrics.cpu_usage, 0) / points.length 
          : 0
      }));
      
    default:
      // 상세 데이터
      return results;
  }
}

/**
 * 🔧 POST 요청 - 시계열 데이터 저장 (테스트용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { servers } = body;

    if (!servers || !Array.isArray(servers)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: 'servers array is required'
      }, { status: 400 });
    }

    // 테스트 데이터 저장
    await redisTimeSeriesService.storeMetrics(servers);
    
    return NextResponse.json({
      success: true,
      message: `${servers.length}개 서버 메트릭 저장 완료`,
      storage_stats: redisTimeSeriesService.getStorageStats()
    });

  } catch (error) {
    console.error('❌ 시계열 데이터 저장 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 