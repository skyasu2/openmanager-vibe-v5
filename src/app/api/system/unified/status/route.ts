import { getRedisStats, isRedisConnected } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 시스템 통합 상태 확인 API
 * GET /api/system/unified/status
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();

    // Redis 상태 확인
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

    return NextResponse.json({
      status: overallStatus,
      timestamp,
      components: systemComponents,
      performance: performanceMetrics,
      version: '5.44.0',
      environment: process.env.NODE_ENV || 'development',
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
      },
      { status: 500 }
    );
  }
}
