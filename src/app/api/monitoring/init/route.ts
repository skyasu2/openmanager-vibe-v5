/**
 * Monitoring Initialization API
 * 
 * 🚀 실제 서버 모니터링 환경 초기화
 * - 데이터 수집기 시작
 * - 실시간 모니터링 활성화
 * - 이중화 시스템 구성
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataCollector } from '../../../../services/collectors/ServerDataCollector';

/**
 * POST /api/monitoring/init
 * 모니터링 시스템 초기화
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      environment = 'production',
      enableFailureScenarios = true,
      enableRealisticVariation = true,
      collectionInterval = 30000,
      maxServers = 50
    } = body;

    console.log('🚀 Initializing monitoring system...');
    console.log('📋 Configuration:', {
      environment,
      enableFailureScenarios,
      enableRealisticVariation,
      collectionInterval,
      maxServers
    });

    // 데이터 수집기 시작
    await serverDataCollector.startCollection();

    // 초기 서버 발견 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 초기 통계 수집
    const stats = serverDataCollector.getServerStats();
    const collectionStats = serverDataCollector.getCollectionStats();

    console.log('✅ Monitoring system initialized successfully');
    console.log(`📊 Discovered ${stats.total} servers`);

    return NextResponse.json({
      success: true,
      message: 'Monitoring system initialized successfully',
      data: {
        serversDiscovered: stats.total,
        collectionActive: collectionStats.isCollecting,
        lastUpdate: collectionStats.lastCollectionTime.toISOString(),
        configuration: {
          environment,
          enableFailureScenarios,
          enableRealisticVariation,
          collectionInterval,
          maxServers
        }
      },
      stats: {
        servers: stats,
        collection: {
          isActive: collectionStats.isCollecting,
          interval: collectionStats.config.collectionInterval,
          errors: collectionStats.collectionErrors
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Monitoring initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/monitoring/init
 * 모니터링 시스템 상태 확인
 */
export async function GET() {
  try {
    const stats = serverDataCollector.getServerStats();
    const collectionStats = serverDataCollector.getCollectionStats();

    return NextResponse.json({
      success: true,
      data: {
        initialized: collectionStats.isCollecting,
        serversCount: stats.total,
        lastUpdate: collectionStats.lastCollectionTime.toISOString(),
        errors: collectionStats.collectionErrors,
        uptime: Date.now() - collectionStats.lastCollectionTime.getTime()
      },
      stats: {
        servers: stats,
        collection: collectionStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get monitoring status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get monitoring status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/monitoring/init
 * 모니터링 시스템 종료
 */
export async function DELETE() {
  try {
    console.log('🛑 Shutting down monitoring system...');
    
    await serverDataCollector.stopCollection();

    console.log('✅ Monitoring system shut down successfully');

    return NextResponse.json({
      success: true,
      message: 'Monitoring system shut down successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to shutdown monitoring system:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Monitoring shutdown failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 