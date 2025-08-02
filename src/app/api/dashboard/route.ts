import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';
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

/**
 * 📊 목업 데이터 전용 대시보드 API
 *
 * FixedDataSystem과 Redis를 제거하고 목업 데이터만 사용
 * - 빠른 응답 속도
 * - 외부 의존성 없음
 * - 간단한 구조
 * - Zod 스키마로 타입 안전성 보장
 */

// GET 핸들러
const getHandler = createApiRoute()
  .response(DashboardResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<DashboardResponse> => {
    const startTime = Date.now();

    console.log('📊 목업 대시보드 API 호출...');

    // 목업 시스템에서 서버 데이터 가져오기
    const mockSystem = getMockSystem();
    const servers = mockSystem.getServers();
    const systemInfo = mockSystem.getSystemInfo();

    // 서버 데이터를 객체 형태로 변환 (기존 API 호환성)
    const serversMap: Record<string, DashboardServer> = {};
    servers.forEach((server) => {
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
        cpu: {
          usage: typeof server.metrics?.cpu === 'object' ? server.metrics.cpu.usage : (server.metrics?.cpu || server.cpu || 0),
          cores: 1,
        },
        memory: {
          usage: typeof server.metrics?.memory === 'object' ? server.metrics.memory.usage : (server.metrics?.memory || server.memory || 0),
          total: 1024,
        },
        disk: {
          usage: typeof server.metrics?.disk === 'object' ? server.metrics.disk.usage : (server.metrics?.disk || server.disk || 0),
          total: 100,
        },
        network: {
          rx: (server.metrics?.network as any)?.rx || (server.metrics?.network as any)?.bytesIn || 0,
          tx: (server.metrics?.network as any)?.tx || (server.metrics?.network as any)?.bytesOut || 0,
        },
        location: server.location,
        environment: server.environment,
        uptime: typeof server.uptime === 'string' ? parseInt(server.uptime) || 0 : server.uptime,
        lastUpdate: server.lastUpdate instanceof Date ? server.lastUpdate.toISOString() : server.lastUpdate,
        tags: [], // tags 프로퍼티가 Server 타입에 없으므로 빈 배열로 설정
        metrics: server.metrics as any, // 복잡한 metrics 타입 불일치 해결을 위한 캐스팅
      };
      serversMap[server.id] = dashboardServer;
    });

    // 통계 계산
    const stats = calculateServerStats(servers as any);

    const response: DashboardResponse = {
      success: true,
      data: {
        servers: serversMap,
        stats,
        lastUpdate: new Date().toISOString(),
        dataSource: 'mock-optimized',
      },
      metadata: {
        responseTime: Date.now() - startTime,
        serversLoaded: servers.length,
        scenarioActive: !!systemInfo.scenario,
      },
    };

    console.log(
      `✅ 목업 대시보드 응답 완료 (${response.metadata?.responseTime || 0}ms)`
    );

    return response;
  });

/**
 * GET /api/dashboard
 *
 * 목업 시스템에서 대시보드 데이터 가져오기
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const response = await getHandler(request);
    const responseData = typeof response === 'object' && 'json' in response ? await response.json() : response;
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Source': 'Mock-System-v3.0',
        'X-Response-Time': `${(responseData as any).metadata?.responseTime || 0}ms`,
        'X-Server-Count': (responseData as any).data?.stats?.total?.toString() || '0',
      },
    });
  } catch (error) {
    console.error('❌ 대시보드 API 오류:', error);

    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        data: {
          servers: {},
          stats: {
            total: 0,
            healthy: 0,
            warning: 0,
            critical: 0,
            avgCpu: 0,
            avgMemory: 0,
            avgDisk: 0,
          },
          lastUpdate: new Date().toISOString(),
          dataSource: 'error',
        },
        metadata: {
          responseTime,
          serversLoaded: 0,
        },
      },
      {
        status: 500,
        headers: {
          'X-Error': 'Dashboard-Error',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  }
}

/**
 * 📊 서버 통계 계산 (유틸리티 함수)
 */
interface MockServer {
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

function calculateServerStats(servers: MockServer[]): DashboardStats {
  if (servers.length === 0) {
    return {
      total: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
      avgCpu: 0,
      avgMemory: 0,
      avgDisk: 0,
    };
  }

  const healthy = servers.filter((s) => s.status === 'online').length;
  const warning = servers.filter((s) => s.status === 'warning').length;
  const critical = servers.filter((s) => s.status === 'critical').length;

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
    total: servers.length,
    healthy,
    warning,
    critical,
    avgCpu: Math.round(totalCpu / servers.length),
    avgMemory: Math.round(totalMemory / servers.length),
    avgDisk: Math.round(totalDisk / servers.length),
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

    console.log('🔄 대시보드 액션 요청...', action);

    // 간단한 새로고침 응답
    if (action === 'refresh') {
      const mockSystem = getMockSystem();
      mockSystem.reset(); // 시스템 리셋

      return {
        success: true,
        message: '목업 시스템 새로고침 완료',
        action: 'refresh',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: '액션 처리 완료',
      action: action || 'none',
      timestamp: new Date().toISOString(),
    };
  });

/**
 * POST /api/dashboard
 *
 * 시나리오 트리거 (선택사항)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ 대시보드 POST 오류:', error);
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
