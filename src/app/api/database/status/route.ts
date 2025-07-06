import { NextRequest, NextResponse } from 'next/server';

// 데이터베이스 상태 시뮬레이션
function getDatabaseStatus() {
  const now = Date.now();
  const uptime = now - (now % (24 * 60 * 60 * 1000)); // 오늘 시작 시간부터

  return {
    primary: {
      status: 'online',
      host: 'db.vnswjnltnhpsueosfhmw.supabase.co',
      port: 5432,
      database: 'postgres',
      connectionPool: {
        total: 20,
        active: 8,
        idle: 12,
        waiting: 0,
      },
      performance: {
        avgResponseTime: 35,
        queryCount: 1250,
        errorRate: 0.02,
      },
      replication: {
        lag: 0,
        status: 'in_sync',
      },
      uptime: Math.floor((Date.now() - uptime) / 1000),
    },
    redis: {
      status: 'online',
      host: 'charming-condor-46598.upstash.io',
      port: 6379,
      memory: {
        used: '2.5MB',
        peak: '4.1MB',
        total: '1GB',
      },
      performance: {
        avgResponseTime: 1.2,
        commandCount: 5420,
        hitRate: 0.95,
      },
      persistence: {
        lastSave: new Date(Date.now() - 300000).toISOString(),
        bgSaveInProgress: false,
      },
    },
    vector: {
      status: 'online',
      engine: 'pgvector',
      collections: 3,
      totalVectors: 1024,
      indexStatus: 'optimized',
      performance: {
        avgSearchTime: 15,
        searchCount: 156,
        accuracy: 0.92,
      },
    },
    overall: {
      status: 'healthy',
      score: 94,
      issues: [],
      lastHealthCheck: new Date().toISOString(),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component');
    const detailed = searchParams.get('detailed') === 'true';

    console.log('🔍 Database status check requested:', { component, detailed });

    const status = getDatabaseStatus();

    // 특정 컴포넌트만 요청된 경우
    if (component && status[component as keyof typeof status]) {
      const componentData = status[component as keyof typeof status];
      return NextResponse.json({
        success: true,
        component,
        data: componentData,
        timestamp: new Date().toISOString(),
      });
    }

    // 간단한 상태만 요청된 경우
    if (!detailed) {
      const simpleStatus = {
        primary: status.primary.status,
        redis: status.redis.status,
        vector: status.vector.status,
        overall: status.overall.status,
      };

      return NextResponse.json({
        success: true,
        data: simpleStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // 전체 상세 상태 반환
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Database status GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get database status',
        data: {
          primary: { status: 'error' },
          redis: { status: 'error' },
          vector: { status: 'error' },
          overall: { status: 'unhealthy', score: 0 },
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    console.log('🔧 Database action requested:', action);

    switch (action) {
      case 'health_check':
        const status = getDatabaseStatus();
        return NextResponse.json({
          success: true,
          action: 'health_check',
          data: status.overall,
          timestamp: new Date().toISOString(),
        });

      case 'refresh_connections':
        // 연결 풀 새로고침 시뮬레이션
        return NextResponse.json({
          success: true,
          action: 'refresh_connections',
          message: 'Database connections refreshed successfully',
          timestamp: new Date().toISOString(),
        });

      case 'clear_cache':
        // 캐시 클리어 시뮬레이션
        return NextResponse.json({
          success: true,
          action: 'clear_cache',
          message: 'Database cache cleared successfully',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Database status POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute database action',
      },
      { status: 500 }
    );
  }
}

/**
 * 🗄️ 데이터베이스 상태 API
 */

export async function GET_NEW(request: NextRequest) {
  try {
    // 데이터베이스 상태 확인
    const dbStatus = {
      status: 'connected',
      type: 'supabase',
      responseTime: '35ms',
      activeConnections: 12,
      maxConnections: 100,
      uptime: '99.9%',
      lastCheck: new Date().toISOString(),
      version: '15.3',
      region: 'ap-southeast-1'
    };

    return NextResponse.json({
      success: true,
      data: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 데이터베이스 상태 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get database status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
