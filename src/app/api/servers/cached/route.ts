/**
 * 🗄️ Cached Servers API
 *
 * ⚠️ DEPRECATED: /api/servers-unified 사용 권장
 * 이 엔드포인트는 호환성을 위해 유지되며, 내부적으로 SSOT 데이터를 사용합니다.
 */
import { NextResponse } from 'next/server';
import { getCachedData, setCachedData } from '@/lib/cache/cache-helper';
import { mockServers } from '@/mock/mockServerConfig';
import type { EnhancedServerMetrics } from '@/types/server';
import debug from '@/utils/debug';

export function GET() {
  try {
    const cacheKey = 'servers:cached:all';

    // 캐시에서 데이터 시도
    const cachedServers = getCachedData<EnhancedServerMetrics[]>(cacheKey);

    if (cachedServers) {
      return NextResponse.json({
        success: true,
        data: cachedServers,
        cached: true,
        timestamp: Date.now(),
      });
    }

    // 캐시 미스 시 SSOT Mock 데이터 변환
    const now = new Date().toISOString();

    // SSOT mockServers를 EnhancedServerMetrics로 변환
    const enhancedServers: EnhancedServerMetrics[] = mockServers.map(
      (server): EnhancedServerMetrics => ({
        id: server.id,
        hostname: server.hostname,
        name: server.hostname,
        environment: server.location.includes('Seoul')
          ? ('production' as const)
          : ('staging' as const),
        role: server.type as EnhancedServerMetrics['role'],
        status:
          server.status === 'online'
            ? ('online' as const)
            : server.status === 'warning'
              ? ('warning' as const)
              : server.status === 'critical'
                ? ('critical' as const)
                : ('offline' as const),
        cpu_usage: server.cpu.cores * 5, // 예상 사용률
        memory_usage: (server.memory.total / 128) * 100, // 예상 사용률
        disk_usage: (server.disk.total / 10000) * 100, // 예상 사용률
        network_in: 1024000,
        network_out: 2048000,
        responseTime: 50,
        uptime: 99.9,
        last_updated: now,
        alerts: [],
        location: server.location,
        ip: server.ip,
        os: server.os,
        provider: 'openmanager',
        specs: {
          cpu_cores: server.cpu.cores,
          memory_gb: server.memory.total,
          disk_gb: server.disk.total,
          network_speed: '1Gbps',
        },
      })
    );

    // 캐시에 저장 (5분 TTL)
    setCachedData(cacheKey, enhancedServers, 300);

    return NextResponse.json({
      success: true,
      data: enhancedServers,
      cached: false,
      timestamp: Date.now(),
      _deprecated: 'Use /api/servers-unified instead',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug.error('캐시된 서버 데이터 조회 실패:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: '캐시된 서버 데이터 조회에 실패했습니다',
        details: errorMessage,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
