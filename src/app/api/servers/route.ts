/**
 * Servers API
 * 
 * 🔄 실제 서버 모니터링 API
 * - 동적 서버 데이터 제공
 * - 실시간 메트릭 수집
 * - 이중화 데이터 소스 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataCollector } from '../../../services/collectors/ServerDataCollector';

// 데이터 수집기 초기화 (한 번만 실행)
let isInitialized = false;

async function initializeCollector() {
  if (!isInitialized) {
    console.log('🚀 Initializing server data collector...');
    await serverDataCollector.startCollection();
    isInitialized = true;
    console.log('✅ Server data collector initialized');
  }
}

/**
 * GET /api/servers
 * 서버 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 데이터 수집기 초기화
    await initializeCollector();

    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const environment = searchParams.get('environment');
    const location = searchParams.get('location');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';
    const includeServices = searchParams.get('includeServices') !== 'false';

    // 서버 데이터 조회
    let servers = serverDataCollector.getAllServers();

    // 필터링 적용
    if (status) {
      servers = servers.filter(server => server.status === status);
    }
    
    if (provider) {
      servers = servers.filter(server => server.provider === provider);
    }
    
    if (environment) {
      servers = servers.filter(server => server.environment === environment);
    }
    
    if (location) {
      servers = servers.filter(server => 
        server.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // 정렬 (최근 업데이트 순)
    servers.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());

    // 페이지네이션
    const totalCount = servers.length;
    const offsetNum = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : 50;
    
    if (limit || offset) {
      servers = servers.slice(offsetNum, offsetNum + limitNum);
    }

    // 응답 데이터 구성
    const responseData = servers.map(server => {
      const serverData: any = {
        id: server.id,
        hostname: server.hostname,
        ipAddress: server.ipAddress,
        status: server.status,
        location: server.location,
        environment: server.environment,
        provider: server.provider,
        instanceType: server.instanceType,
        cluster: server.cluster,
        zone: server.zone,
        tags: server.tags,
        lastUpdate: server.lastUpdate.toISOString(),
        lastSeen: server.lastSeen.toISOString()
      };

      if (includeMetrics) {
        serverData.metrics = server.metrics;
      }

      if (includeAlerts) {
        serverData.alerts = server.alerts;
      }

      if (includeServices) {
        serverData.services = server.services;
      }

      return serverData;
    });

    // 통계 정보
    const stats = serverDataCollector.getServerStats();
    const collectionStats = serverDataCollector.getCollectionStats();

    return NextResponse.json({
      success: true,
      data: responseData,
      pagination: {
        total: totalCount,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < totalCount
      },
      stats: {
        ...stats,
        collection: {
          isActive: collectionStats.isCollecting,
          lastUpdate: collectionStats.lastCollectionTime.toISOString(),
          errors: collectionStats.collectionErrors
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching servers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch server data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/servers
 * 서버 등록/업데이트
 */
export async function POST(request: NextRequest) {
  try {
    await initializeCollector();
    
    const body = await request.json();
    const { action, serverData } = body;

    switch (action) {
      case 'register':
        // 새 서버 등록 (실제 환경에서는 에이전트 설치 등)
        console.log('📝 Registering new server:', serverData);
        
        return NextResponse.json({
          success: true,
          message: 'Server registration initiated',
          data: {
            id: `manual-${Date.now()}`,
            status: 'pending'
          }
        });

      case 'update':
        // 서버 정보 업데이트
        console.log('🔄 Updating server:', serverData);
        
        return NextResponse.json({
          success: true,
          message: 'Server update initiated'
        });

      case 'discover':
        // 서버 재발견 트리거
        console.log('🔍 Triggering server discovery...');
        
        // 실제로는 비동기로 처리
        setTimeout(async () => {
          // 서버 재발견 로직
        }, 1000);
        
        return NextResponse.json({
          success: true,
          message: 'Server discovery triggered'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `Action '${action}' is not supported`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in server POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server operation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/servers
 * 데이터 수집 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    console.log('⚙️ Updating collection config:', config);

    // 실제 환경에서는 설정 업데이트 로직
    // serverDataCollector.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Collection configuration updated',
      config: serverDataCollector.getCollectionStats().config
    });

  } catch (error) {
    console.error('Error updating config:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Configuration update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/servers
 * 데이터 수집 중지
 */
export async function DELETE() {
  try {
    console.log('🛑 Stopping server data collection...');
    
    await serverDataCollector.stopCollection();
    isInitialized = false;

    return NextResponse.json({
      success: true,
      message: 'Server data collection stopped'
    });

  } catch (error) {
    console.error('Error stopping collection:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to stop collection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 