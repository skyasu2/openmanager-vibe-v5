import { NextResponse } from 'next/server';

/**
 * 강제 시뮬레이션 초기화 API
 * POST /api/simulate/force-init
 * 
 * 목적: 서버 데이터가 없을 때 긴급하게 시뮬레이션을 시작
 */
export async function POST() {
  try {
    console.log('🚨 [Force Init] Emergency simulation initialization requested');

    // 서버 사이드에서만 실행
    if (typeof window !== 'undefined') {
      return NextResponse.json({
        success: false,
        error: 'This API can only be called from server-side'
      }, { status: 400 });
    }

    // ServerDataGenerator 시작
    const { serverDataGenerator } = await import('../../../../services/collectors/ServerDataGenerator');
    
    console.log('🔄 [Force Init] Starting realtime generation...');
    await serverDataGenerator.startRealtimeGeneration('normal');
    
    // 잠시 대기 후 서버 확인
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ServerDataCollector에서 서버 확인
    const { serverDataCollector } = await import('../../../../services/collectors/ServerDataCollector');
    const servers = serverDataCollector.getAllServers();
    
    console.log(`✅ [Force Init] Generated ${servers.length} servers successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Emergency simulation initialized successfully',
      data: {
        serversGenerated: servers.length,
        timestamp: new Date().toISOString(),
        generatorStatus: serverDataGenerator.getGenerationStatus()
      }
    });

  } catch (error) {
    console.error('❌ [Force Init] Failed to initialize simulation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize emergency simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/simulate/force-init
 * 현재 상태 확인
 */
export async function GET() {
  try {
    // 서버 사이드에서만 실행
    if (typeof window !== 'undefined') {
      return NextResponse.json({
        success: false,
        error: 'This API can only be called from server-side'
      }, { status: 400 });
    }

    const { serverDataCollector } = await import('../../../../services/collectors/ServerDataCollector');
    const { serverDataGenerator } = await import('../../../../services/collectors/ServerDataGenerator');
    
    const servers = serverDataCollector.getAllServers();
    const generatorStatus = serverDataGenerator.getGenerationStatus();
    const collectionStats = serverDataCollector.getCollectionStats();
    
    return NextResponse.json({
      success: true,
      data: {
        serversCount: servers.length,
        isGenerating: generatorStatus.isGenerating,
        isCollecting: collectionStats.isCollecting,
        lastCollectionTime: collectionStats.lastCollectionTime,
        generatorStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to get simulation status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get simulation status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 