/**
 * 🔄 데이터 플로우 API - UnifiedMetricsManager 통합
 * GET/POST /api/dataflow
 * 
 * 기존 DataFlowManager 기능을 UnifiedMetricsManager로 통합하여
 * 중복을 제거하고 성능을 향상시킵니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMetricsManager } from '../../../services/UnifiedMetricsManager';

/**
 * 🔍 데이터 플로우 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 데이터 플로우 상태 조회 중...');

    // UnifiedMetricsManager에서 통합 상태 조회
    const servers = unifiedMetricsManager.getServers();
    const status = unifiedMetricsManager.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        // 데이터 플로우 상태 (UnifiedMetricsManager 기반)
        status: {
          isRunning: status.isRunning,
          serverCount: servers.length,
          lastUpdate: new Date(),
          dataFlowActive: status.isRunning,
          metricsCollecting: true
        },
        
        // 메트릭 요약
        metrics: {
          totalServers: servers.length,
          activeMetrics: servers.filter((server: any) => server.status === 'healthy').length,
          averageCpuUsage: servers.length > 0 
            ? servers.reduce((sum: number, server: any) => sum + (server.cpu_usage || server.node_cpu_usage_percent || 0), 0) / servers.length 
            : 0,
          averageMemoryUsage: servers.length > 0 
            ? servers.reduce((sum: number, server: any) => sum + (server.memory_usage || server.node_memory_usage_percent || 0), 0) / servers.length 
            : 0,
          lastUpdated: new Date().toISOString()
        },
        
        // 성능 정보
        performance: {
          dataLatency: status.performance?.avg_processing_time || 0,
          updateInterval: 5000, // 5초 간격
          memoryOptimized: true,
          cachingEnabled: true
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 데이터 플로우 상태 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '데이터 플로우 상태 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🎛️ 데이터 플로우 제어
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    console.log(`🎛️ 데이터 플로우 제어: ${action}`);

    switch (action) {
      case 'start':
        // UnifiedMetricsManager 시작
        await unifiedMetricsManager.start();
        const startStatus = unifiedMetricsManager.getStatus();
        
        return NextResponse.json({
          success: true,
          message: '데이터 플로우가 시작되었습니다.',
          status: {
            isRunning: startStatus.isRunning,
            startTime: new Date(),
            message: 'UnifiedMetricsManager 기반 데이터 플로우 활성화'
          },
          timestamp: new Date().toISOString()
        });

      case 'stop':
        // UnifiedMetricsManager 중지
        unifiedMetricsManager.stop();
        
        return NextResponse.json({
          success: true,
          message: '데이터 플로우가 중지되었습니다.',
          status: {
            isRunning: false,
            message: 'UnifiedMetricsManager 중지 완료'
          },
          timestamp: new Date().toISOString()
        });

      case 'restart':
        // 재시작: 중지 후 시작
        unifiedMetricsManager.stop();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        await unifiedMetricsManager.start();
        
        const restartStatus = unifiedMetricsManager.getStatus();
        
        return NextResponse.json({
          success: true,
          message: '데이터 플로우가 재시작되었습니다.',
          status: {
            isRunning: restartStatus.isRunning,
            restartTime: new Date(),
            message: 'UnifiedMetricsManager 재시작 완료'
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          message: `지원하지 않는 액션입니다: ${action}`,
          supportedActions: ['start', 'stop', 'restart']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 데이터 플로우 제어 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '데이터 플로우 제어에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 