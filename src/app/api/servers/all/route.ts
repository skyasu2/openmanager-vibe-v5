import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import type { Server } from '@/types/api-responses';

export const dynamic = 'force-dynamic';

/**
 * 🚀 서버 목록 API (Supabase + 메모리 기반 캐싱)
 *
 * 기능:
 * - Supabase에서 실제 서버 목록 조회
 * - 메모리 기반 캐싱 (Redis 완전 제거)
 * - 페이지네이션
 * - 필터링 (쿼리 파라미터)
 * - 응답 시간 측정
 * - 에러 처리
 */

// 메모리 기반 캐시 스토어
const memoryCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// 캐시 도우미 함수
function getCacheItem(key: string) {
  const item = memoryCache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > item.ttl) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.data;
}

function setCacheItem(key: string, data: any, ttlSeconds: number = 60) {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  });
}
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cacheHit = false;
  
  try {
    console.log('🚀 /api/servers/all - Supabase에서 서버 데이터 조회');
    
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 캐시 키 생성
    const cacheKey = `servers:all:${status || 'all'}:${page}:${limit}`;
    
    // 메모리 캐시 확인
    let servers = getCacheItem(cacheKey);
    if (servers) {
      cacheHit = true;
      console.log('✅ 메모리 캐시 히트');
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
      
      // Supabase에서 실제 서버 데이터 가져오기
      const supabase = getSupabaseClient();
      let query = supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 상태 필터링
      if (status) {
        query = query.eq('status', status);
      }

      const { data: serverData, error: serverError } = await query;

      if (serverError) {
        console.error('❌ Supabase 서버 데이터 조회 실패:', serverError);
        throw new Error(`Failed to fetch servers from database: ${serverError.message}`);
      }

      servers = serverData || [];
      
      // 메모리에 캐싱
      if (!cacheHit) {
        setCacheItem(cacheKey, servers, 60); // 60초 TTL
        console.log('💾 메모리 캐시 저장');
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
      online: servers.filter((s: Server) => s.status === 'online').length,
      warning: servers.filter((s: Server) => s.status === 'warning').length,
      critical: servers.filter((s: Server) => s.status === 'critical').length,
    };
    
    const responseTime = Date.now() - startTime;
    console.log(`📈 응답 시간: ${responseTime}ms (캐시: ${cacheHit ? 'HIT' : 'MISS'})`);
    
    // 응답 헤더 생성
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      'X-Cache-Status': cacheHit ? 'memory-hit' : 'memory-miss',
      'X-Storage': 'Supabase-PostgreSQL',
      'X-Response-Time': `${responseTime}`,
      'Server-Timing': `db;dur=${cacheHit ? 0 : 20}, memory-cache;dur=${cacheHit ? 2 : 0}, total;dur=${responseTime}`,
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
        dataSource: 'supabase-realtime',
        metadata: {
          responseTime,
          cacheHit,
          scenarioActive: false,
          supabaseQuery: true,
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