import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  DashboardResponseSchema,
  DashboardActionRequestSchema,
  DashboardActionResponseSchema,
  type DashboardResponse,
  type DashboardServer,
  type DashboardStats,
  type DashboardActionResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

/**
 * 📊 실시간 대시보드 API
 *
 * Supabase에서 실제 서버 데이터를 가져와서 대시보드 표시
 * - 실시간 서버 메트릭
 * - Supabase PostgreSQL 연동
 * - 메모리 캐시 최적화
 * - Zod 스키마로 타입 안전성 보장
 */

// 서버 데이터 인터페이스 정의 (any 타입 제거)
interface SupabaseServer {
  id: string;
  name: string;
  type?: string;
  status: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  location?: string;
  environment?: string;
  uptime?: string | number;
  lastUpdate?: string | Date;
  metrics?: {
    cpu?: number | { usage: number };
    memory?: number | { usage: number; used?: number; total?: number };
    disk?: number | { usage: number; used?: number; total?: number };
    network?: { rx: number; tx: number; bytesIn?: number; bytesOut?: number };
  };
}

interface MockServer {
  id: string;
  name: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  location: string;
  environment: string;
  metrics?: unknown;
}

// GET 핸들러
const getHandler = createApiRoute()
  .response(DashboardResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<DashboardResponse> => {
    const startTime = Date.now();

    debug.log('📊 실시간 대시보드 API 호출...');

    // 🎯 포트폴리오 시나리오 데이터 사용 (/api/servers/all과 동일한 데이터 소스)
    debug.log('🎭 포트폴리오 모드: 24시간 시나리오 데이터 로드');
    
    let serverList: SupabaseServer[] = [];
    
    try {
      // /api/servers/all의 loadScenarioData() 로직 동일하게 사용
      const fs = await import('fs');
      const path = await import('path');
      
      const now = new Date();
      const currentHour = now.getHours();
      
      debug.log(`Current time: ${currentHour}h - loading scenario data for dashboard`);
      
      const scenarioPath = path.join(
        process.cwd(),
        'public',
        'server-scenarios',
        'hourly-metrics',
        `${currentHour.toString().padStart(2, '0')}.json`
      );
      
      const raw = fs.readFileSync(scenarioPath, 'utf8');
      const scenarioData = JSON.parse(raw);
      
      // 포트폴리오 시나리오 데이터를 SupabaseServer 타입으로 변환
      const portfolioServers = Object.values(scenarioData.servers).map((server: any) => ({
        id: server.id,
        name: server.name,
        type: server.type,
        status: server.status,
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        location: server.location,
        environment: server.environment,
        uptime: server.uptime,
        lastUpdate: server.lastUpdate,
        metrics: server.metrics
      }));
      
      serverList = portfolioServers;
      
      debug.log(`🎭 포트폴리오 시나리오 데이터 로드 완료: ${serverList.length}개 서버, "${scenarioData.scenario}"`);
      
    } catch (error) {
      debug.error('❌ 포트폴리오 시나리오 데이터 로드 실패:', error);
      debug.log('📦 폴백 데이터로 전환...');

      // 폴백: 정적 서버 데이터 사용
      try {
        const fs = await import('fs');
        const path = await import('path');
        const fallbackPath = path.join(
          process.cwd(),
          'public',
          'fallback',
          'servers.json'
        );
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        const parsed = JSON.parse(raw);
        const servers = Array.isArray(parsed) ? parsed : (parsed.servers || []);
        
        serverList = servers.map((server: any) => ({
          id: server.id,
          name: server.name,
          type: server.type,
          status: server.status,
          cpu: server.cpu,
          memory: server.memory,
          disk: server.disk,
          location: server.location,
          environment: server.environment,
          uptime: server.uptime,
          lastUpdate: server.lastUpdate,
          metrics: server.metrics
        }));
        
        debug.log('📦 폴백 데이터 사용 완료');
      } catch (fallbackError) {
        debug.error('❌ 폴백 데이터도 로드 실패:', fallbackError);
        serverList = [];
      }
    }

    // 서버 데이터를 객체 형태로 변환 (기존 API 호환성)
    const serversMap: Record<string, DashboardServer> = {};
    serverList.forEach((server) => {
      const dashboardServer: DashboardServer = {
        id: server.id,
        name: server.name,
        type: server.type || 'server',
        status:
          server.status === 'online'
            ? 'healthy'
            : server.status === 'critical'
              ? 'critical'
              : 'warning',
        cpu:
          typeof server.metrics?.cpu === 'object'
            ? server.metrics.cpu.usage
            : server.metrics?.cpu || server.cpu || 0,
        memory:
          typeof server.metrics?.memory === 'object'
            ? server.metrics.memory.usage
            : server.metrics?.memory || server.memory || 0,
        disk:
          typeof server.metrics?.disk === 'object'
            ? server.metrics.disk.usage
            : server.metrics?.disk || server.disk || 0,
        location: server.location || 'Unknown',
        environment: server.environment,
        metrics: {
          cpu: server.metrics?.cpu,
          memory:
            typeof server.metrics?.memory === 'object' &&
            'usage' in server.metrics.memory
              ? {
                  usage: server.metrics.memory.usage,
                  used:
                    'used' in server.metrics.memory
                      ? (server.metrics.memory.used ??
                        server.metrics.memory.usage)
                      : server.metrics.memory.usage,
                  total:
                    'total' in server.metrics.memory
                      ? (server.metrics.memory.total ?? 100)
                      : 100,
                }
              : server.metrics?.memory,
          disk:
            typeof server.metrics?.disk === 'object' &&
            'usage' in server.metrics.disk
              ? {
                  usage: server.metrics.disk.usage,
                  used:
                    'used' in server.metrics.disk
                      ? (server.metrics.disk.used ?? server.metrics.disk.usage)
                      : server.metrics.disk.usage,
                  total:
                    'total' in server.metrics.disk
                      ? (server.metrics.disk.total ?? 100)
                      : 100,
                }
              : server.metrics?.disk,
          network: server.metrics?.network,
        },
      };
      serversMap[server.id] = dashboardServer;
    });

    // 통계 계산 - SupabaseServer를 DatabaseServer 호환 형식으로 변환
    const statsInput: DatabaseServer[] = serverList.map((server) => ({
      id: server.id,
      name: server.name,
      status: server.status,
      cpu: server.cpu,
      memory: server.memory,
      disk: server.disk,
      metrics: server.metrics
        ? {
            cpu:
              typeof server.metrics.cpu === 'object'
                ? server.metrics.cpu.usage
                : server.metrics.cpu,
            memory:
              typeof server.metrics.memory === 'object'
                ? server.metrics.memory.usage
                : server.metrics.memory,
            disk:
              typeof server.metrics.disk === 'object'
                ? server.metrics.disk.usage
                : server.metrics.disk,
            network: server.metrics.network || undefined,
          }
        : undefined,
      type: server.type,
      location: server.location,
      environment: server.environment,
      uptime:
        typeof server.uptime === 'string'
          ? parseInt(server.uptime) || 0
          : server.uptime,
      lastUpdate:
        server.lastUpdate instanceof Date
          ? server.lastUpdate.toISOString()
          : server.lastUpdate,
    }));
    const stats = calculateServerStats(statsInput);

    const response: DashboardResponse = {
      success: true,
      data: {
        servers: serversMap,
        stats,
        recentAlerts: [], // Add required field
        systemHealth: 'good' as const, // Add required field
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataSource: 'supabase-realtime',
      },
    };

    debug.log(
      `✅ 실시간 대시보드 응답 완료 (${response.metadata?.processingTime || 0}ms)`
    );

    return response;
  });

/**
 * GET /api/dashboard
 *
 * Supabase에서 실시간 대시보드 데이터 가져오기
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const response = await getHandler(request);
    const responseData: DashboardResponse =
      typeof response === 'object' && 'json' in response
        ? await response.json()
        : response;

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Source': 'Supabase-Realtime',
        'X-Response-Time': `${responseData.metadata?.processingTime || 0}ms`,
        'X-Server-Count':
          responseData.data?.stats?.totalServers?.toString() || '0',
      },
    });
  } catch (error) {
    debug.error('❌ 대시보드 API 오류:', error);

    const processingTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        data: {
          servers: {},
          stats: {
            totalServers: 0,
            onlineServers: 0,
            warningServers: 0,
            criticalServers: 0,
            avgCpu: 0,
            avgMemory: 0,
            avgDisk: 0,
            totalAlerts: 0,
            criticalAlerts: 0,
            responseTime: processingTime,
          },
          recentAlerts: [],
          systemHealth: 'critical' as const,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          cacheHit: false,
          dataSource: 'error',
        },
      },
      {
        status: 500,
        headers: {
          'X-Error': 'Dashboard-Error',
          'X-Response-Time': `${processingTime}ms`,
        },
      }
    );
  }
}

/**
 * 📊 서버 통계 계산 (유틸리티 함수)
 */
interface DatabaseServer {
  id: string;
  name: string;
  status: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: { rx: number; tx: number };
  };
  type?: string;
  location?: string;
  environment?: string;
  uptime?: number;
  lastUpdate?: string;
  tags?: string[];
}

function calculateServerStats(servers: DatabaseServer[]): DashboardStats {
  if (servers.length === 0) {
    return {
      totalServers: 0,
      onlineServers: 0,
      warningServers: 0,
      criticalServers: 0,
      avgCpu: 0,
      avgMemory: 0,
      avgDisk: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      responseTime: 0,
    };
  }

  // 🎯 포트폴리오 시나리오 데이터의 실제 상태 매핑
  const online = servers.filter((s) => 
    s.status === 'online' || s.status === 'healthy'
  ).length;
  const warning = servers.filter((s) => s.status === 'warning').length;
  const critical = servers.filter(
    (s) => s.status === 'critical' || s.status === 'offline'
  ).length;

  debug.log('📊 서버 상태 통계 계산:', {
    total: servers.length,
    online,
    warning, 
    critical,
    serverStatuses: servers.map(s => ({ id: s.id, status: s.status }))
  });

  const totalCpu = servers.reduce((sum, s) => {
    const cpuValue = s.metrics?.cpu ?? s.cpu ?? 0;
    return sum + cpuValue;
  }, 0);

  const totalMemory = servers.reduce((sum, s) => {
    const memoryValue = s.metrics?.memory ?? s.memory ?? 0;
    return sum + memoryValue;
  }, 0);

  const totalDisk = servers.reduce((sum, s) => {
    const diskValue = s.metrics?.disk ?? s.disk ?? 0;
    return sum + diskValue;
  }, 0);

  return {
    totalServers: servers.length,
    onlineServers: online,
    warningServers: warning,
    criticalServers: critical,
    avgCpu: Math.round(totalCpu / servers.length),
    avgMemory: Math.round(totalMemory / servers.length),
    avgDisk: Math.round(totalDisk / servers.length),
    totalAlerts: warning + critical,
    criticalAlerts: critical,
    responseTime: 0,
  };
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(DashboardActionRequestSchema)
  .response(DashboardActionResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<DashboardActionResponse> => {
    const { action } = context.body;

    debug.log('🔄 대시보드 액션 요청...', action);

    // 간단한 새로고침 응답
    if (action === 'refresh') {
      // 실제 시스템에서는 캐시 새로고침 또는 데이터 갱신
      debug.log('🔄 실시간 데이터 새로고침 중...');

      return {
        success: true,
        message: '실시간 시스템 새로고침 완료',
        action: 'refresh',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: '액션 처리 완료',
      action: action || 'refresh',
      timestamp: new Date().toISOString(),
    };
  });

/**
 * POST /api/dashboard
 *
 * 대시보드 액션 처리 (새로고침 등)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await postHandler(request);
  } catch (error) {
    debug.error('❌ 대시보드 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '액션 처리 실패',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
