import { NextResponse } from 'next/server';
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import type { Server } from '@/types/server';
import type { EnhancedServerMetrics } from '@/types/server';
import debug from '@/utils/debug';

export async function GET() {
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

    // 캐시 미스 시 Mock 데이터 생성
    const now = new Date().toISOString();
    
    const mockServers: Server[] = [
      {
        id: 'srv-001',
        name: 'Web Server 01',
        status: 'online',
        cpu: 45,
        memory: 60,
        disk: 75,
        uptime: '7d 12h',
        location: 'US East',
        metrics: {
          cpu: { usage: 45, cores: 4, temperature: 55 },
          memory: { used: 9.6, total: 16, usage: 60 },
          disk: { used: 75, total: 100, usage: 75 },
          network: { bytesIn: 1024000, bytesOut: 2048000, packetsIn: 1500, packetsOut: 1200 },
          timestamp: now,
          uptime: 7.5 * 24 * 3600, // 7.5일을 초 단위로
        },
        lastSeen: now,
      },
      {
        id: 'srv-002', 
        name: 'API Server 01',
        status: 'warning',
        cpu: 80,
        memory: 85,
        disk: 45,
        uptime: '3d 8h',
        location: 'EU West',
        metrics: {
          cpu: { usage: 80, cores: 8, temperature: 70 },
          memory: { used: 27.2, total: 32, usage: 85 },
          disk: { used: 45, total: 100, usage: 45 },
          network: { bytesIn: 2048000, bytesOut: 4096000, packetsIn: 3000, packetsOut: 2500 },
          timestamp: now,
          uptime: 3.33 * 24 * 3600, // 3.33일을 초 단위로
        },
        lastSeen: now,
      },
    ];

    // Mock 서버를 EnhancedServerMetrics로 변환
    const enhancedServers: EnhancedServerMetrics[] = mockServers.map((server): EnhancedServerMetrics => ({
    id: server.id,
    hostname: server.name,
    environment: server.location?.includes('US') 
      ? ('production' as const)
      : server.location?.includes('EU')
      ? ('staging' as const) 
      : ('development' as const),
    role: server.name?.toLowerCase().includes('web')
      ? ('web' as const)
      : server.name?.toLowerCase().includes('api')
      ? ('api' as const)
      : ('app' as const),
    status: server.status === 'online' 
      ? ('online' as const) 
      : server.status === 'warning'
      ? ('warning' as const)
      : server.status === 'offline'
      ? ('offline' as const)
      : ('maintenance' as const),
    cpu_usage: server.metrics?.cpu?.usage || 0,
    memory_usage: server.metrics?.memory?.usage || 0,
    disk_usage: server.metrics?.disk?.usage || 0,
    network_in: server.metrics?.network?.bytesIn || 0,
    network_out: server.metrics?.network?.bytesOut || 0,
    responseTime: 100, // 기본값 100ms - 실제 구현 시 측정 필요
    uptime: 99.9, // 기본값 99.9% - 실제 구현 시 계산 필요
    last_updated: server.lastSeen || now,
    alerts: Array.isArray(server.alerts)
      ? server.alerts.map((alert) => ({
          id: typeof alert === 'object' && alert?.id ? alert.id : `alert-${Date.now()}`,
          server_id: server.id,
          type: 'custom' as const,
          message: typeof alert === 'object' && alert?.message ? alert.message : 'Unknown alert',
          severity: 'warning' as const,
          timestamp: now,
          resolved: false,
        }))
      : [],
    name: server.name,
  }));

    // 캐시에 저장 (5분 TTL)
    setCachedData(cacheKey, enhancedServers, 300);

    return NextResponse.json({
      success: true,
      data: enhancedServers,
      cached: false,
      timestamp: Date.now(),
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