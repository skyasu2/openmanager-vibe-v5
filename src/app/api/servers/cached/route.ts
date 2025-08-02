/**
 * 🚀 캐시 최적화 서버 API
 *
 * Upstash Redis 캐싱을 활용한 고성능 서버 데이터 API
 * GET /api/servers/cached
 * - Zod 스키마로 타입 안전성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';
import { cacheOrFetch, createCachedResponse } from '@/lib/cache-helper';
import { CACHE_KEYS, TTL_STRATEGY } from '@/services/upstashCacheService';
import type { EnhancedServerMetrics, Server } from '@/types/server';
import type { 
  ServerStatusLiteral, 
  ServerAlert, 
  CachedServerSummary,
  CachedServersResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Server를 EnhancedServerMetrics로 변환
 */
function convertToEnhancedServerMetrics(server: Server): EnhancedServerMetrics {
  const now = new Date().toISOString();
  return {
    id: server.id,
    name: server.name,
    hostname: `${server.name}.example.com`, // hostname 생성
    status: server.status === 'healthy' ? 'online' : (server.status as ServerStatusLiteral),
    environment: 'production' as const,
    role:
      server.type === 'database'
        ? ('database' as const)
        : server.type === 'web'
          ? ('web' as const)
          : server.type === 'api'
            ? ('api' as const)
            : server.type === 'cache'
              ? ('cache' as const)
              : ('app' as const),
    cpu_usage: server.metrics?.cpu?.usage || 0,
    memory_usage: server.metrics?.memory?.usage || 0,
    disk_usage: server.metrics?.disk?.usage || 0,
    network_in: server.metrics?.network?.bytesIn || 0,
    network_out: server.metrics?.network?.bytesOut || 0,
    response_time: 100, // 기본값 100ms - 실제 구현 시 측정 필요
    uptime: 99.9, // 기본값 99.9% - 실제 구현 시 계산 필요
    last_updated: server.lastSeen || now,
    alerts: Array.isArray(server.alerts)
      ? server.alerts.map((alert) => ({
          id: typeof alert === 'object' && alert?.id ? alert.id : `alert-${Date.now()}`,
          server_id: server.id,
          type: 'custom' as const,
          message: typeof alert === 'object' && alert?.message ? alert.message : 'Unknown alert',
          severity: typeof alert === 'object' && alert?.severity ? alert.severity : 'warning',
          timestamp: typeof alert === 'object' && alert?.timestamp ? alert.timestamp : now,
          resolved: typeof alert === 'object' && alert?.resolved ? alert.resolved : false,
        }))
      : [],
    // 선택적 속성들
    network_usage:
      ((server.metrics?.network?.bytesIn || 0) +
        (server.metrics?.network?.bytesOut || 0)) /
      2,
    timestamp: now,
    patternsEnabled: false,
    currentLoad: server.metrics?.cpu?.usage || 0,
    activeFailures: 0,
    network:
      ((server.metrics?.network?.bytesIn || 0) +
        (server.metrics?.network?.bytesOut || 0)) /
      2,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const includeSummary = searchParams.get('summary') !== 'false';

    console.log('🚀 /api/servers/cached - 캐시 최적화 서버 데이터', {
      forceRefresh,
      includeSummary,
    });

    // 서버 목록 가져오기 (캐시 또는 페칭)
    const servers = await cacheOrFetch<EnhancedServerMetrics[]>(
      CACHE_KEYS.SERVER_LIST,
      async () => {
        console.log('📊 캐시 미스 - 서버 데이터 페칭');
        const mockSystem = getMockSystem();
        const baseServers = mockSystem.getServers();
        return baseServers.map(convertToEnhancedServerMetrics);
      },
      {
        ttl: TTL_STRATEGY.SERVER_LIST,
        force: forceRefresh,
      }
    );

    // 요약 정보 가져오기 (옵션)
    let summary = null;
    if (includeSummary) {
      summary = await cacheOrFetch(
        CACHE_KEYS.SERVER_SUMMARY,
        async () => {
          console.log('📊 캐시 미스 - 요약 정보 생성');
          return calculateSummary(servers);
        },
        {
          ttl: TTL_STRATEGY.SERVER_SUMMARY,
          force: forceRefresh,
        }
      );
    }

    // 개별 서버 정보도 캐싱 (백그라운드)
    cacheIndividualServers(servers);

    // 캐시 헤더가 포함된 응답 생성
    return createCachedResponse(
      {
        success: true,
        data: servers,
        count: servers.length,
        summary,
        timestamp: Date.now(),
        cached: !forceRefresh,
        optimized: true,
        serverless: true,
        dataSource: 'upstash-cached',
        metadata: {
          cacheStrategy: 'edge-optimized',
          ttl: TTL_STRATEGY.SERVER_LIST,
        },
      },
      {
        maxAge: 0,
        sMaxAge: 30,
        staleWhileRevalidate: 60,
      }
    );
  } catch (error) {
    console.error('❌ /api/servers/cached 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cached servers',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 서버 요약 정보 계산
 */
function calculateSummary(servers: EnhancedServerMetrics[]): CachedServerSummary {
  const stats = {
    total: servers.length,
    online: servers.filter((s) => s.status === 'online').length,
    warning: servers.filter((s) => s.status === 'warning').length,
    critical: servers.filter((s) => s.status === 'critical').length,
    offline: servers.filter((s) => s.status === 'offline').length,
  };

  const metrics = {
    avgCpuUsage:
      servers.reduce((sum, s) => sum + (s.metrics?.cpu?.usage || 0), 0) /
      servers.length,
    avgMemoryUsage:
      servers.reduce((sum, s) => sum + (s.metrics?.memory?.usage || 0), 0) /
      servers.length,
    avgDiskUsage:
      servers.reduce((sum, s) => sum + (s.metrics?.disk?.usage || 0), 0) /
      servers.length,
    totalBandwidth: servers.reduce(
      (sum, s) =>
        sum + (s.metrics?.network?.in || 0) + (s.metrics?.network?.out || 0),
      0
    ),
  };

  const health = {
    score: calculateHealthScore(servers),
    trend: 'stable', // 실제로는 이전 데이터와 비교 필요
    issues: servers.filter((s) => s.status !== 'online').length,
  };

  return {
    stats,
    metrics,
    health,
    timestamp: Date.now(),
  };
}

/**
 * 전체 시스템 건강 점수 계산
 */
function calculateHealthScore(servers: EnhancedServerMetrics[]): number {
  if (servers.length === 0) return 100;

  let score = 100;
  const weights = {
    offline: -30,
    critical: -20,
    warning: -10,
    highCpu: -5,
    highMemory: -5,
    highDisk: -3,
  };

  servers.forEach((server) => {
    // 상태별 감점
    if (server.status === 'offline') score += weights.offline;
    else if (server.status === 'critical') score += weights.critical;
    else if (server.status === 'warning') score += weights.warning;

    // 리소스 사용률 감점
    if (server.metrics?.cpu?.usage && server.metrics.cpu.usage > 80)
      score += weights.highCpu;
    if (server.metrics?.memory?.usage && server.metrics.memory.usage > 85)
      score += weights.highMemory;
    if (server.metrics?.disk?.usage && server.metrics.disk.usage > 90)
      score += weights.highDisk;
  });

  // 0-100 범위로 정규화
  return Math.max(0, Math.min(100, score));
}

/**
 * 개별 서버 정보 백그라운드 캐싱
 */
async function cacheIndividualServers(servers: EnhancedServerMetrics[]) {
  // 비동기로 처리하여 응답 지연 방지
  Promise.resolve().then(async () => {
    const { getCacheService } = await import('@/lib/cache-helper');
    const cache = getCacheService();

    // 상위 10개 서버만 개별 캐싱
    const topServers = servers.slice(0, 10);
    const items = topServers.map((server) => ({
      key: CACHE_KEYS.SERVER_DETAIL(server.id),
      value: server,
      ttl: TTL_STRATEGY.SERVER_DETAIL,
    }));

    try {
      await cache.mset(items);
      console.log(`✅ ${items.length}개 서버 개별 캐싱 완료`);
    } catch (error) {
      console.error('❌ 개별 서버 캐싱 실패:', error);
    }
  });
}
