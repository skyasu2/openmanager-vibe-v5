import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import type { Server } from '@/types/server';
import { isMockMode, getMockHeaders } from '@/config/mock-config';
import { getMockServers } from '@/mock';

// 📊 서버 상태 매핑 함수
function mapSupabaseStatus(status: string): Server['status'] {
  const statusMap: Record<string, Server['status']> = {
    'online': 'online',
    'offline': 'offline', 
    'warning': 'warning',
    'healthy': 'healthy',
    'critical': 'offline', // critical을 offline으로 매핑 (대시보드에서 빨간색으로 표시)
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
    
    // Mock 모드 확인
    if (isMockMode()) {
      console.log('🎭 Mock 모드 활성화됨');
      
      // Mock 데이터 가져오기
      const mockServers = getMockServers();
      
      // 필터링 및 검색
      let filteredServers = mockServers;
      
      if (search) {
        filteredServers = filteredServers.filter(server => 
          server.name.toLowerCase().includes(search.toLowerCase()) ||
          server.location?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (status) {
        filteredServers = filteredServers.filter(server => server.status === status);
      }
      
      // 정렬
      filteredServers.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'cpu':
            comparison = a.cpu - b.cpu;
            break;
          case 'memory':
            comparison = a.memory - b.memory;
            break;
          case 'disk':
            comparison = a.disk - b.disk;
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      // 페이지네이션
      const startIndex = (page - 1) * limit;
      const paginatedServers = filteredServers.slice(startIndex, startIndex + limit);
      
      return NextResponse.json({
        success: true,
        data: {
          servers: paginatedServers,
          page,
          limit,
          total: filteredServers.length,
          totalPages: Math.ceil(filteredServers.length / limit),
        },
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          ...getMockHeaders(),
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'Cache-Control': 'no-store',
        },
      });
    }
    
    // 현재 시간 계산 (30초 = 1시간 매핑)
    const now = new Date();
    const secondsElapsed = now.getSeconds() + (now.getMinutes() * 60);
    const currentHour = Math.floor(secondsElapsed / 30) % 24; // 30초마다 1시간씩 증가
    
    // 캐시 키 생성 (현재 시간 포함)
    const cacheKey = `servers:all:hour=${currentHour}:page=${page}:limit=${limit}:search=${search}:status=${status}:env=${environment}:sort=${sortBy}:order=${sortOrder}`;
    
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
      
      // Supabase 클라이언트 가져오기
      const supabase = getSupabaseClient();
      
      // 환경변수 체크
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://dummy.supabase.co') {
        console.warn('⚠️ Supabase 환경변수 미설정 - Mock 데이터 사용');
        
        // Mock 데이터 반환
        const mockServers = getMockServers();
        return NextResponse.json({
          success: true,
          data: {
            servers: mockServers, // 전체 Mock 서버 반환 (8개)
            page,
            limit,
            total: mockServers.length,
            totalPages: Math.ceil(mockServers.length / limit),
          },
          timestamp: new Date().toISOString(),
          dataSource: 'mock-fallback',
        }, {
          headers: {
            'X-Data-Source': 'Mock-Fallback',
            'X-Response-Time': `${Date.now() - startTime}ms`,
            'Cache-Control': 'no-store',
          },
        });
      }
      
      // Supabase 쿼리 구성 - hourly_server_states 테이블 사용
      let query = supabase
        .from('hourly_server_states')
        .select('*', { count: 'exact' })
        .eq('hour_of_day', currentHour); // 현재 시간에 해당하는 데이터만 가져오기
      
      // 검색 필터 적용 - hourly_server_states 스키마에 맞춤
      if (search) {
        query = query.or(`server_name.ilike.%${search}%,hostname.ilike.%${search}%,environment.ilike.%${search}%`);
      }
      
      // 상태 필터 적용
      if (status) {
        query = query.eq('status', status);
      }
      
      // 환경 필터 적용
      if (environment) {
        query = query.eq('environment', environment);
      }
      
      // 정렬 적용 - hourly_server_states 스키마에 맞춤
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
          query = query.order('server_name', { ascending: isAsc });
      }
      
      // 전체 카운트를 위한 별도 쿼리 (페이지네이션 없이)
      const countQuery = supabase
        .from('hourly_server_states')
        .select('*', { count: 'exact', head: true })
        .eq('hour_of_day', currentHour);
      
      // 검색 필터 적용
      if (search) {
        countQuery.or(`server_name.ilike.%${search}%,hostname.ilike.%${search}%,environment.ilike.%${search}%`);
      }
      if (status) {
        countQuery.eq('status', status);
      }
      if (environment) {
        countQuery.eq('environment', environment);
      }
      
      const { count: totalCount } = await countQuery;
      
      // 페이지네이션 적용하여 실제 데이터 조회
      const { data, error } = await query
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) {
        console.error('❌ Supabase 쿼리 오류:', error);
        
        // 에러 발생 시 Mock 데이터 반환
        const mockServers = getMockServers();
        return NextResponse.json({
          success: true,
          data: {
            servers: mockServers, // 전체 Mock 서버 반환 (8개)
            page,
            limit,
            total: mockServers.length,
            totalPages: Math.ceil(mockServers.length / limit),
          },
          timestamp: new Date().toISOString(),
          dataSource: 'mock-on-error',
          error: error.message,
        }, {
          headers: {
            'X-Data-Source': 'Mock-On-Error',
            'X-Error': error.message,
            'X-Response-Time': `${Date.now() - startTime}ms`,
            'Cache-Control': 'no-store',
          },
        });
      }
      
      // Supabase hourly_server_states 데이터를 Server 타입으로 변환
      servers = (data || []).map((item: any): Server => ({
        id: item.server_id,
        name: item.server_name || item.hostname,
        hostname: item.hostname,
        status: mapSupabaseStatus(item.status),
        cpu: Math.round(item.cpu_usage || 0),
        memory: Math.round(item.memory_usage || 0),
        disk: Math.round(item.disk_usage || 0),
        network: Math.round(item.network_usage || 0),
        uptime: item.uptime || 0,
        location: item.location || item.environment || 'unknown',
        environment: item.environment,
        provider: 'supabase',
        type: item.server_type || 'unknown',
        alerts: item.incident_severity === 'critical' ? 3 : item.incident_severity === 'medium' ? 1 : 0,
        lastSeen: new Date().toISOString(), // hourly_server_states에는 last_updated가 없음
        metrics: {
          cpu: {
            usage: item.cpu_usage || 0,
            cores: 4,
            temperature: 45
          },
          memory: {
            used: Math.round((item.memory_usage || 0) * 16 / 100),
            total: 16,
            usage: item.memory_usage || 0
          },
          disk: {
            used: Math.round((item.disk_usage || 0) * 100 / 100),
            total: 100,
            usage: item.disk_usage || 0
          },
          network: {
            bytesIn: Math.round((item.network_usage || 0) * 0.6),
            bytesOut: Math.round((item.network_usage || 0) * 0.4),
            packetsIn: 0,
            packetsOut: 0
          },
          timestamp: new Date().toISOString(),
          uptime: item.uptime || 0
        }
      }));
      
      // 결과를 캐시에 저장 (60초 TTL) - totalCount 사용
      setCachedData(cacheKey, { servers, totalCount: totalCount || 0 }, 60);
      console.log(`💾 새 데이터가 캐시에 저장됨: ${servers.length}개 서버, 전체: ${totalCount}개`);
    }
    
    // 페이지네이션 정보 계산 (이미 DB에서 페이지네이션 적용됨)
    const totalPages = Math.ceil(totalCount / limit);
    
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
        data: servers,
        servers: servers,
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
        count: servers.length,
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