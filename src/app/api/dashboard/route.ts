/**
 * 🌐 통합 대시보드 API (고정 데이터 시스템 v2.0)
 *
 * 고정 데이터 + 타임스탬프 시스템 → Redis → Vercel API → 대시보드
 * 핵심 아키텍처: 5개 장애 시나리오 + 실시간 타임스탬프 + 기존 API 100% 호환
 */

import { NextRequest, NextResponse } from 'next/server';
import { FixedDataSystem } from '@/lib/fixed-data-system';

interface ServerData {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  uptime: number;
  lastUpdated: string;
  source: string;
  [key: string]: any;
}

interface DashboardResponse {
  success: boolean;
  data?: {
    servers: Record<string, ServerData>;
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
  error?: string;
  metadata?: {
    responseTime: number;
    cacheHit: boolean;
    redisKeys: number;
    serversLoaded: number;
  };
}

// 🏗️ 고정 데이터 시스템 인스턴스 (싱글톤)
let fixedDataSystem: FixedDataSystem | null = null;

async function getFixedDataSystem(): Promise<FixedDataSystem | null> {
  if (!fixedDataSystem) {
    fixedDataSystem = new FixedDataSystem({
      enableScenarios: true,
      maxConcurrentScenarios: 3,
      scenarioRotationInterval: 30,
      cascadeFailureEnabled: true,
      redisPrefix: 'openmanager:fixed:',
      backupToSupabase: false // Vercel 환경에서 비활성화
    });
    
    try {
      await fixedDataSystem.initialize();
      console.log('✅ 고정 데이터 시스템 초기화 완료');
    } catch (error) {
      console.error('❌ 고정 데이터 시스템 초기화 실패:', error);
      // 폴백: Redis Template Cache 사용
      fixedDataSystem = null;
    }
  }
  
  return fixedDataSystem;
}

/**
 * GET /api/dashboard
 *
 * 고정 데이터 시스템으로 모든 서버 데이터 가져오기
 * 5개 장애 시나리오 + 실시간 타임스탬프 + 기존 API 100% 호환
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<DashboardResponse>> {
  const startTime = Date.now();

  try {
    console.log('📊 고정 데이터 시스템 대시보드 API 호출 시작...');

    // 🚀 방법 1: 고정 데이터 시스템 사용 (우선)
    try {
      const system = await getFixedDataSystem();
      if (system) {
        const apiResponse = await system.getDashboardApiResponse();
        
        console.log(`✅ 고정 데이터 시스템 응답 완료 (${apiResponse.metadata?.responseTime}ms)`);
        
        return NextResponse.json(apiResponse, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
            'X-Data-Source': 'Fixed-Data-System-v2.0',
            'X-Response-Time': `${apiResponse.metadata?.responseTime || 0}ms`,
            'X-Server-Count': apiResponse.metadata?.serversLoaded?.toString() || '0',
            'X-Active-Scenarios': apiResponse.metadata?.activeScenarios?.toString() || '0',
            'X-System-Health': apiResponse.metadata?.systemHealth || 'unknown',
          },
        });
      }
    } catch (fixedSystemError) {
      console.warn('⚠️ 고정 데이터 시스템 사용 실패, Redis 템플릿 캐시로 폴백:', fixedSystemError);
    }

    // 🔄 방법 2: Redis Template Cache 폴백
    try {
      const { redisTemplateCache } = await import('@/lib/redis-template-cache');
      const dashboardData = await redisTemplateCache.getDashboardData();
      
      if (dashboardData.success) {
        // 기존 API 형식으로 변환
        const convertedResponse: DashboardResponse = {
          success: true,
          data: {
            servers: dashboardData.data.servers || {},
            stats: {
              total: Object.keys(dashboardData.data.servers || {}).length,
              healthy: Object.values(dashboardData.data.servers || {}).filter((s: any) => s.status === 'healthy').length,
              warning: Object.values(dashboardData.data.servers || {}).filter((s: any) => s.status === 'warning').length,
              critical: Object.values(dashboardData.data.servers || {}).filter((s: any) => s.status === 'critical').length,
              avgCpu: Object.values(dashboardData.data.servers || {}).reduce((sum: number, s: any) => sum + (s.cpu || 0), 0) / Object.keys(dashboardData.data.servers || {}).length || 0,
              avgMemory: Object.values(dashboardData.data.servers || {}).reduce((sum: number, s: any) => sum + (s.memory || 0), 0) / Object.keys(dashboardData.data.servers || {}).length || 0,
              avgDisk: Object.values(dashboardData.data.servers || {}).reduce((sum: number, s: any) => sum + (s.disk || 0), 0) / Object.keys(dashboardData.data.servers || {}).length || 0,
            },
            lastUpdate: new Date().toISOString(),
            dataSource: 'redis-template-cache-fallback',
          },
          metadata: {
            responseTime: Date.now() - startTime,
            cacheHit: true,
            redisKeys: Object.keys(dashboardData.data.servers || {}).length,
            serversLoaded: Object.keys(dashboardData.data.servers || {}).length,
          },
        };
        
        console.log(`✅ Redis 템플릿 캐시 폴백 응답 완료 (${convertedResponse.metadata?.responseTime}ms)`);
        
        return NextResponse.json(convertedResponse, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
            'X-Data-Source': 'Redis-Template-Cache-Fallback',
            'X-Response-Time': `${convertedResponse.metadata?.responseTime}ms`,
            'X-Server-Count': convertedResponse.metadata?.serversLoaded?.toString() || '0',
          },
        });
      }
    } catch (redisCacheError) {
      console.warn('⚠️ Redis 템플릿 캐시 폴백도 실패:', redisCacheError);
    }

    // 🚨 방법 3: 최종 폴백 (빈 응답)
    const responseTime = Date.now() - startTime;
    const fallbackResponse: DashboardResponse = {
      success: true,
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
        dataSource: 'empty-fallback',
      },
      metadata: {
        responseTime,
        cacheHit: false,
        redisKeys: 0,
        serversLoaded: 0,
      },
    };

    console.log(`⚠️ 최종 폴백 응답 (${responseTime}ms)`);

    return NextResponse.json(fallbackResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'X-Data-Source': 'Empty-Fallback',
        'X-Response-Time': `${responseTime}ms`,
        'X-Warning': 'All-Systems-Failed',
      },
    });

  } catch (error) {
    console.error('❌ 대시보드 API 치명적 오류:', error);

    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: '모든 데이터 시스템 사용 불가',
        metadata: {
          responseTime,
          cacheHit: false,
          redisKeys: 0,
          serversLoaded: 0,
        },
      },
      {
        status: 500,
        headers: {
          'X-Error': 'All-Data-Systems-Failed',
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

  const healthy = servers.filter((s: any) => s.status === 'healthy').length;
  const warning = servers.filter((s: any) => s.status === 'warning').length;
  const critical = servers.filter((s: any) => s.status === 'critical').length;

  const totalCpu = servers.reduce((sum: number, s: any) => sum + (s.cpu || 0), 0);
  const totalMemory = servers.reduce((sum: number, s: any) => sum + (s.memory || 0), 0);
  const totalDisk = servers.reduce((sum: number, s: any) => sum + (s.disk || 0), 0);

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
 * 고정 데이터 시스템 강제 새로고침 + 시나리오 트리거
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔄 고정 데이터 시스템 강제 새로고침 요청...');

    const body = await request.json().catch(() => ({}));
    const { action, serverId, scenario } = body;

    // 🎭 시나리오 트리거 기능
    if (action === 'trigger_scenario' && serverId && scenario) {
      try {
        const system = await getFixedDataSystem();
        if (system) {
          await system.triggerScenario(serverId, scenario);
          
          return NextResponse.json({
            success: true,
            message: `시나리오 '${scenario}' 서버 '${serverId}'에서 트리거됨`,
            action: 'scenario_triggered',
            serverId,
            scenario,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (scenarioError) {
        console.error('❌ 시나리오 트리거 실패:', scenarioError);
        return NextResponse.json(
          {
            success: false,
            error: '시나리오 트리거 실패',
            details: scenarioError instanceof Error ? scenarioError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // 🔄 일반 캐시 무효화 (기본 동작)
    let invalidatedKeys = 0;
    let systemRefreshed = false;

    // 고정 데이터 시스템 새로고침
    try {
      const system = await getFixedDataSystem();
      if (system) {
        // 시스템 상태 강제 업데이트
        await system.getSystemState();
        systemRefreshed = true;
        console.log('✅ 고정 데이터 시스템 새로고침 완료');
      }
    } catch (systemError) {
      console.warn('⚠️ 고정 데이터 시스템 새로고침 실패:', systemError);
    }

    // Redis 템플릿 캐시 무효화 (폴백)
    try {
      const { redisTemplateCache } = await import('@/lib/redis-template-cache');
      await redisTemplateCache.clearCache();
      console.log('✅ Redis 템플릿 캐시 무효화 완료');
    } catch (cacheError) {
      console.warn('⚠️ Redis 템플릿 캐시 무효화 실패:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: '대시보드 시스템 새로고침 완료',
      actions: {
        systemRefreshed,
        cacheInvalidated: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ 대시보드 새로고침 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '시스템 새로고침 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
