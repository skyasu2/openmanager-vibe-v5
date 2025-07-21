import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';

/**
 * 📊 목업 데이터 전용 대시보드 API
 *
 * FixedDataSystem과 Redis를 제거하고 목업 데이터만 사용
 * - 빠른 응답 속도
 * - 외부 의존성 없음
 * - 간단한 구조
 */

interface DashboardResponse {
  success: boolean;
  data: {
    servers: Record<string, any>;
    stats: {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
      avgCpu: number;
      avgMemory: number;
      avgDisk: number;
    };
    lastUpdate: string;
    dataSource: string;
  };
  metadata?: {
    responseTime: number;
    serversLoaded: number;
    scenarioActive?: boolean;
  };
}

/**
 * GET /api/dashboard
 *
 * 목업 시스템에서 대시보드 데이터 가져오기
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<DashboardResponse>> {
  const startTime = Date.now();

  try {
    console.log('📊 목업 대시보드 API 호출...');

    // 목업 시스템에서 서버 데이터 가져오기
    const mockSystem = getMockSystem();
    const servers = mockSystem.getServers();
    const systemInfo = mockSystem.getSystemInfo();

    // 서버 데이터를 객체 형태로 변환 (기존 API 호환성)
    const serversMap: Record<string, any> = {};
    servers.forEach(server => {
      serversMap[server.id] = {
        ...server,
        // 대시보드용 추가 필드
        cpu: server.metrics?.cpu || { usage: 0, cores: 1 },
        memory: server.metrics?.memory || { usage: 0, total: 1024 },
        disk: server.metrics?.disk || { usage: 0, total: 100 },
        network: server.metrics?.network || { rx: 0, tx: 0 },
        status:
          server.status === 'online'
            ? 'healthy'
            : server.status === 'critical'
              ? 'critical'
              : 'warning',
      };
    });

    // 통계 계산
    const stats = calculateServerStats(servers);

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

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Source': 'Mock-System-v3.0',
        'X-Response-Time': `${response.metadata?.responseTime || 0}ms`,
        'X-Server-Count': servers.length.toString(),
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
function calculateServerStats(servers: any[]): any {
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

  const healthy = servers.filter(s => s.status === 'online').length;
  const warning = servers.filter(s => s.status === 'warning').length;
  const critical = servers.filter(s => s.status === 'critical').length;

  const totalCpu = servers.reduce((sum, s) => sum + (s.cpu || 0), 0);
  const totalMemory = servers.reduce((sum, s) => sum + (s.memory || 0), 0);
  const totalDisk = servers.reduce((sum, s) => sum + (s.disk || 0), 0);

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

/**
 * POST /api/dashboard
 *
 * 시나리오 트리거 (선택사항)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔄 대시보드 액션 요청...');

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // 간단한 새로고침 응답
    if (action === 'refresh') {
      const mockSystem = getMockSystem();
      mockSystem.reset(); // 시스템 리셋

      return NextResponse.json({
        success: true,
        message: '목업 시스템 새로고침 완료',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: '액션 처리 완료',
      action: action || 'none',
    });
  } catch (error) {
    console.error('❌ 대시보드 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '액션 처리 실패',
      },
      { status: 500 }
    );
  }
}
