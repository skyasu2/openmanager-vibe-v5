import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMockSystem } from '@/mock';
import { getRedisClient } from '@/lib/redis';
import type { RedisClientInterface } from '@/lib/redis';

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
    
    try {
      const redis = await getRedisClient('api-response');
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          servers = typeof cached === 'string' ? JSON.parse(cached) : cached;
          cacheHit = true;
          console.log('✅ Redis 캐시 히트');
        }
      }
    } catch (redisError) {
      console.error('❌ Redis 에러 (계속 진행):', redisError);
      // Redis 에러는 무시하고 계속 진행
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
        try {
          const redis = await getRedisClient('api-response');
          if (redis) {
            await redis.setex(cacheKey, 60, JSON.stringify(servers));
          }
        } catch (redisError) {
          console.error('❌ Redis 캐싱 실패:', redisError);
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