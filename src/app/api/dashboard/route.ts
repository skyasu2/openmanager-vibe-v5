/**
 * 🌐 통합 대시보드 API (Redis 직접 읽기 + Batch API)
 * 
 * Google Cloud → Redis → Vercel Batch API → 대시보드
 * 핵심 아키텍처: 단일 API 호출로 모든 서버 데이터 가져오기
 */

import { getRedis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

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

/**
 * GET /api/dashboard
 * 
 * Redis Pipeline으로 모든 서버 데이터를 한 번에 가져오기
 * 30초 브라우저 캐시 + SWR 최적화
 */
export async function GET(request: NextRequest): Promise<NextResponse<DashboardResponse>> {
  const startTime = Date.now();

  try {
    console.log('📊 통합 대시보드 API 호출 시작...');

    // Redis 연결 가져오기 (풀링)
    const redis = getRedis();

    // 1. 모든 서버 키를 한 번에 가져오기
    const serverKeyPattern = 'openmanager:gcp:servers:*';
    const keys = await redis.keys(serverKeyPattern);

    console.log(`🔍 Redis에서 ${keys.length}개 서버 키 발견`);

    if (keys.length === 0) {
      return NextResponse.json({
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
          dataSource: 'redis-empty',
        },
        metadata: {
          responseTime: Date.now() - startTime,
          cacheHit: false,
          redisKeys: 0,
          serversLoaded: 0,
        },
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Data-Source': 'Redis-Empty',
        },
      });
    }

    // 2. Redis Pipeline으로 모든 데이터 가져오기
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));

    console.log('🚀 Redis Pipeline 실행 중...');
    const results = await pipeline.exec();

    // 3. 서버 데이터 파싱 및 구성
    const serverData: Record<string, ServerData> = {};
    let successCount = 0;

    results?.forEach(([err, data], index) => {
      if (!err && data && typeof data === 'string') {
        try {
          const serverId = keys[index].replace('openmanager:gcp:servers:', '');
          const parsedData = JSON.parse(data) as ServerData;

          serverData[serverId] = {
            ...parsedData,
            id: serverId,
          };
          successCount++;
        } catch (parseError) {
          console.warn(`⚠️ 서버 데이터 파싱 실패 (${keys[index]}):`, parseError);
        }
      }
    });

    console.log(`✅ ${successCount}개 서버 데이터 로드 완료`);

    // 4. 통계 계산
    const servers = Object.values(serverData);
    const stats = calculateServerStats(servers);

    // 5. 응답 구성
    const responseTime = Date.now() - startTime;
    const response: DashboardResponse = {
      success: true,
      data: {
        servers: serverData,
        stats,
        lastUpdate: new Date().toISOString(),
        dataSource: 'redis-gcp',
      },
      metadata: {
        responseTime,
        cacheHit: false,
        redisKeys: keys.length,
        serversLoaded: successCount,
      },
    };

    console.log(`📊 대시보드 API 응답 완료 (${responseTime}ms)`);

    // 6. 캐싱 헤더와 함께 응답
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Source': 'Redis-GCP',
        'X-Response-Time': `${responseTime}ms`,
        'X-Server-Count': successCount.toString(),
      },
    });

  } catch (error) {
    console.error('❌ 대시보드 API 오류:', error);

    const responseTime = Date.now() - startTime;
    return NextResponse.json({
      success: false,
      error: 'Redis 연결 실패 또는 데이터 조회 오류',
      metadata: {
        responseTime,
        cacheHit: false,
        redisKeys: 0,
        serversLoaded: 0,
      },
    }, {
      status: 500,
      headers: {
        'X-Error': 'Redis-Connection-Failed',
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  }
}

/**
 * 📊 서버 통계 계산
 */
function calculateServerStats(servers: ServerData[]) {
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

  const healthy = servers.filter(s => s.status === 'healthy').length;
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
 * 서버 데이터 강제 새로고침 (캐시 무효화)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔄 대시보드 강제 새로고침 요청...');

    // Redis 캐시 무효화 (선택적)
    const redis = getRedis();
    const keys = await redis.keys('openmanager:gcp:servers:*');

    if (keys.length > 0) {
      // TTL을 1초로 설정하여 빠른 만료
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.expire(key, 1));
      await pipeline.exec();
    }

    return NextResponse.json({
      success: true,
      message: '대시보드 캐시 무효화 완료',
      invalidatedKeys: keys.length,
    });

  } catch (error) {
    console.error('❌ 대시보드 새로고침 오류:', error);
    return NextResponse.json({
      success: false,
      error: '캐시 무효화 실패',
    }, { status: 500 });
  }
}
