import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMockSystem } from '@/mock';

// 조건부 Redis import
let redis: any = null;
if (process.env.NODE_ENV !== 'test') {
  // 프로덕션에서는 실제 Redis 사용
  import('@/lib/upstash-redis').then(module => {
    redis = module.redis;
  });
}

export const dynamic = 'force-dynamic';

/**
 * 🚀 서버 목록 API (TDD로 개선됨)
 *
 * 기능:
 * - 서버 목록 조회
 * - Redis 캐싱
 * - 페이지네이션
 * - 필터링 (쿼리 파라미터)
 * - 응답 시간 측정
 * - 에러 처리
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cacheHit = false;
  
  try {
    console.log('🚀 /api/servers/all - 서버 데이터 조회');
    
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 캐시 키 생성
    const cacheKey = `servers:all:${status || 'all'}:${page}:${limit}`;
    
    // Redis 캐시 확인
    let servers = null;
    
    // 테스트 환경에서는 mock redis 사용
    if (process.env.NODE_ENV === 'test') {
      try {
        const testRedisModule = await import('@/lib/redis/test-redis');
        const testRedis = testRedisModule.default;
        if (testRedis) {
          try {
            const cached = await testRedis.get(cacheKey);
            if (cached) {
              servers = JSON.parse(cached as string);
              cacheHit = true;
              console.log('✅ Redis 캐시 히트');
            }
          } catch (redisError) {
            console.error('❌ Redis 에러 (계속 진행):', redisError);
          }
        }
      } catch (importError) {
        console.error('❌ test-redis import 실패:', importError);
      }
    } else if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          servers = JSON.parse(cached as string);
          cacheHit = true;
          console.log('✅ Redis 캐시 히트');
        }
      } catch (redisError) {
        console.error('❌ Redis 에러 (계속 진행):', redisError);
        // Redis 에러는 무시하고 계속 진행
      }
    }
    
    // 캐시가 없으면 데이터 조회
    if (!servers) {
      // 시뮬레이션: DB 연결 오류
      if (process.env.SIMULATE_DB_ERROR === 'true') {
        throw new Error('Database connection failed');
      }
      
      // 시뮬레이션: 서비스 불가
      if (process.env.SIMULATE_SERVICE_UNAVAILABLE === 'true') {
        return NextResponse.json(
          {
            success: false,
            error: 'Service temporarily unavailable',
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
      
      // 목업 시스템에서 데이터 가져오기
      const mockSystem = getMockSystem();
      servers = mockSystem.getServers();
      
      // 상태 필터링
      if (status) {
        servers = servers.filter(s => s.status === status);
      }
      
      // Redis에 캐싱 (실패해도 계속 진행)
      if (!cacheHit) {
        if (process.env.NODE_ENV === 'test') {
          try {
            const testRedisModule = await import('@/lib/redis/test-redis');
            const testRedis = testRedisModule.default;
            if (testRedis) {
              try {
                await testRedis.setex(cacheKey, 60, JSON.stringify(servers));
              } catch (redisError) {
                console.error('❌ Redis 캐싱 실패:', redisError);
              }
            }
          } catch (importError) {
            console.error('❌ test-redis import 실패:', importError);
          }
        } else if (redis) {
          try {
            await redis.setex(cacheKey, 60, JSON.stringify(servers));
          } catch (redisError) {
            console.error('❌ Redis 캐싱 실패:', redisError);
          }
        }
      }
    }
    
    // 페이지네이션 계산
    const totalCount = servers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServers = servers.slice(startIndex, endIndex);
    
    // 통계 정보 계산
    const stats = {
      total: totalCount,
      online: servers.filter((s: any) => s.status === 'online').length,
      warning: servers.filter((s: any) => s.status === 'warning').length,
      critical: servers.filter((s: any) => s.status === 'critical').length,
    };
    
    const responseTime = Date.now() - startTime;
    console.log(`📈 응답 시간: ${responseTime}ms (캐시: ${cacheHit ? 'HIT' : 'MISS'})`);
    
    // 응답 헤더 생성
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      'X-Cache-Status': cacheHit ? 'hit' : 'miss',
      'X-Response-Time': `${responseTime}`,
      'Server-Timing': `db;dur=${cacheHit ? 0 : 20}, cache;dur=${cacheHit ? 5 : 0}, total;dur=${responseTime}`,
    });
    
    return NextResponse.json(
      {
        success: true,
        servers: paginatedServers,
        count: paginatedServers.length,
        totalCount,
        page,
        limit,
        totalPages,
        stats,
        timestamp: new Date().toISOString(),
        fromCache: cacheHit,
        optimized: true,
        serverless: true,
        dataSource: 'mock-enhanced',
        metadata: {
          responseTime,
          cacheHit,
          scenarioActive: true,
          mockVersion: '3.1',
        },
      },
      { 
        status: 200,
        headers 
      }
    );
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ /api/servers/all 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch servers',
        timestamp: new Date().toISOString(),
        optimized: false,
        serverless: true,
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}`,
        }
      }
    );
  }
}