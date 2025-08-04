import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import type { Server } from '@/types/server';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📊 서버 상태 매핑 함수
function mapSupabaseStatus(status: string): Server['status'] {
  const statusMap: Record<string, Server['status']> = {
    'online': 'online',
    'offline': 'offline', 
    'warning': 'warning',
    'healthy': 'healthy',
    'critical': 'warning', // critical을 warning으로 매핑
    'error': 'offline',
    'maintenance': 'offline'
  };
  
  return statusMap[status] || 'offline';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // URL 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const environment = searchParams.get('environment') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    console.log(`🔍 서버 목록 요청: page=${page}, limit=${limit}, search="${search}", status="${status}"`);
    
    // 캐시 키 생성
    const cacheKey = `servers:all:page=${page}:limit=${limit}:search=${search}:status=${status}:env=${environment}:sort=${sortBy}:order=${sortOrder}`;
    
    // 캐시에서 데이터 조회 시도
    let servers: Server[] = [];
    let totalCount = 0;
    let cacheHit = false;
    
    const cachedResult = getCachedData<{ servers: Server[]; totalCount: number }>(cacheKey);
    
    if (cachedResult) {
      servers = cachedResult.servers;
      totalCount = cachedResult.totalCount;
      cacheHit = true;
      console.log(`📦 캐시에서 데이터 로드됨: ${servers.length}개 서버`);
    } else {
      console.log('🔄 Supabase에서 새 데이터 조회 중...');
      
      // Supabase 쿼리 구성
      let query = supabase
        .from('server_metrics')
        .select('*', { count: 'exact' });
      
      // 검색 필터 적용
      if (search) {
        query = query.or(`hostname.ilike.%${search}%,environment.ilike.%${search}%`);
      }
      
      // 상태 필터 적용
      if (status) {
        query = query.eq('status', status);
      }
      
      // 환경 필터 적용
      if (environment) {
        query = query.eq('environment', environment);
      }
      
      // 정렬 적용
      const isAsc = sortOrder === 'asc';
      switch (sortBy) {
        case 'cpu':
          query = query.order('cpu_usage', { ascending: isAsc });
          break;
        case 'memory':
          query = query.order('memory_usage', { ascending: isAsc });
          break;
        case 'disk':
          query = query.order('disk_usage', { ascending: isAsc });
          break;
        case 'uptime':
          query = query.order('uptime', { ascending: isAsc });
          break;
        default:
          query = query.order('hostname', { ascending: isAsc });
      }
      
      // 페이지네이션 적용 후 데이터 조회
      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('❌ Supabase 쿼리 오류:', error);
        throw error;
      }
      
      // Supabase 데이터를 Server 타입으로 변환
      servers = (data || []).map((item: any): Server => ({
        id: item.id,
        name: item.hostname || item.id,
        hostname: item.hostname,
        status: mapSupabaseStatus(item.status),
        cpu: Math.round(item.cpu_usage || 0),
        memory: Math.round(item.memory_usage || 0),
        disk: Math.round(item.disk_usage || 0),
        network: Math.round((item.network_in || 0) + (item.network_out || 0)),
        uptime: item.uptime || 0,
        location: item.environment || 'unknown',
        environment: item.environment,
        provider: 'supabase',
        type: item.role || 'unknown',
        alerts: 0,
        lastSeen: item.last_updated,
        metrics: {
          cpu: {
            usage: item.cpu_usage || 0,
            cores: 4,
            temperature: 45
          },
          memory: {
            used: Math.round((item.memory_usage || 0) * 16),
            total: 16,
            usage: item.memory_usage || 0
          },
          disk: {
            used: Math.round((item.disk_usage || 0) * 100),
            total: 100,
            usage: item.disk_usage || 0
          },
          network: {
            bytesIn: item.network_in || 0,
            bytesOut: item.network_out || 0,
            packetsIn: 0,
            packetsOut: 0
          },
          timestamp: item.last_updated || new Date().toISOString(),
          uptime: item.uptime || 0
        }
      }));
      
      totalCount = count || 0;
      
      // 결과를 캐시에 저장 (60초 TTL)
      setCachedData(cacheKey, { servers, totalCount }, 60);
      console.log(`💾 새 데이터가 캐시에 저장됨: ${servers.length}개 서버`);
    }
    
    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServers = servers.slice(startIndex, endIndex);
    
    // 통계 정보 계산
    const stats = {
      total: totalCount,
      online: servers.filter((s: Server) => s.status === 'online').length,
      warning: servers.filter((s: Server) => s.status === 'warning').length,
      offline: servers.filter((s: Server) => s.status === 'offline').length,
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
        data: paginatedServers,
        servers: paginatedServers,
        summary: {
          servers: {
            total: stats.total,
            online: stats.online,
            warning: stats.warning,
            offline: stats.offline,
            avgCpu: Math.round(
              servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length || 0
            ),
            avgMemory: Math.round(
              servers.reduce((sum, s) => sum + s.memory, 0) / servers.length || 0
            ),
          },
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        count: paginatedServers.length,
        timestamp: Date.now(),
      },
      { 
        status: 200,
        headers 
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ 서버 목록 조회 실패:', errorMessage);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        success: false,
        error: '서버 목록 조회에 실패했습니다',
        details: errorMessage,
        timestamp: Date.now(),
        responseTime,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Response-Time': `${responseTime}`,
        }
      }
    );
  }
}