import { getRedisStats, isRedisConnected } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// 🚨 무료 티어 절약: 시스템 상태 캐싱 (5분)
let systemStatusCache: {
  data: any;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 300000, // 5분 캐싱
};

/**
 * 🚨 무료 티어 최적화: 시스템 통합 상태 확인 API (5분 캐싱)
 * GET /api/system/unified/status
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    const now = Date.now();

    // 🚨 무료 티어 절약: 캐시된 결과 반환
    if (
      now - systemStatusCache.timestamp < systemStatusCache.ttl &&
      systemStatusCache.data
    ) {
      console.log('🔄 시스템 상태 캐시 사용');
      return NextResponse.json(
        {
          ...systemStatusCache.data,
          timestamp,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300', // 5분 캐싱
            'X-Cache-Status': 'HIT',
          },
        }
      );
    }

    console.log('🔍 시스템 상태 새로 체크 (5분 후 재체크)');

    // Redis 상태 확인 (캐싱된 함수 사용)
    const redisConnected = await isRedisConnected();
    let redisStats = null;

    if (redisConnected) {
      try {
        redisStats = await getRedisStats();
      } catch (error) {
        console.warn('Redis stats 조회 실패:', error);
      }
    }

    // 시스템 컴포넌트 상태
    const systemComponents = {
      redis: {
        status: redisConnected ? 'connected' : 'disconnected',
        lastCheck: timestamp,
        stats: redisStats,
      },
      database: {
        status: 'connected', // Supabase 연결 상태
        lastCheck: timestamp,
        provider: 'supabase',
      },
      aiEngines: {
        status: 'active',
        lastCheck: timestamp,
        engines: ['google-ai', 'local-rag', 'mcp-ai', 'unified'],
      },
      monitoring: {
        status: 'active',
        lastCheck: timestamp,
        activeServers: 30,
        dataPoints: 1440,
      },
    };

    // 전체 시스템 상태 결정
    const overallStatus = redisConnected ? 'healthy' : 'degraded';

    // 성능 메트릭
    const performanceMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    const responseData = {
      status: overallStatus,
      timestamp,
      components: systemComponents,
      performance: performanceMetrics,
      version: '5.44.0',
      environment: process.env.NODE_ENV || 'development',
      cached: false,
    };

    // 🚨 무료 티어 절약: 결과 캐싱
    systemStatusCache = {
      data: responseData,
      timestamp: now,
      ttl: 300000,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5분 캐싱
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (error) {
    console.error('System Unified Status Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to get system status',
        components: {
          redis: { status: 'unknown' },
          database: { status: 'unknown' },
          aiEngines: { status: 'unknown' },
          monitoring: { status: 'unknown' },
        },
        cached: false,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'X-Cache-Status': 'ERROR',
        },
      }
    );
  }
}
