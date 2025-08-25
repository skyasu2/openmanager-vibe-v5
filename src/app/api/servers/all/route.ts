import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { getCachedData, setCachedData } from '@/lib/cache-helper';
import type { Server } from '@/types/server';
import { isMockMode, getMockHeaders } from '@/config/mock-config';
import fs from 'fs';
import path from 'path';
import debug from '@/utils/debug';

// Supabase hourly_server_states 테이블 타입 정의 - any 타입 제거
interface HourlyServerState {
  server_id: string;
  server_name: string;
  hostname: string;
  server_type?: string;
  hour_of_day: number;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  location?: string;
  environment?: string;
  uptime?: number;
  incident_type?: string;
  incident_severity?: 'critical' | 'medium' | 'low' | null;
  affected_dependencies?: string[];
}

// 📊 서버 상태 매핑 함수
function mapSupabaseStatus(status: string): Server['status'] {
  const statusMap: Record<string, Server['status']> = {
    online: 'online',
    offline: 'offline',
    warning: 'warning',
    healthy: 'healthy',
    critical: 'offline', // critical을 offline으로 매핑 (대시보드에서 빨간색으로 표시)
    error: 'offline',
    maintenance: 'offline',
  };

  return statusMap[status] || 'offline';
}

// 🎯 24시간 포트폴리오 시나리오 데이터 로더
const loadScenarioData = (): { servers: Server[]; scenario: string; hour: number } => {
  try {
    // 현재 시간 기준 시나리오 결정 (포트폴리오용)
    const now = new Date();
    const currentHour = now.getHours();
    
    debug.log(`Current time: ${currentHour}h - loading scenario data`);
    
    // 시나리오 데이터 파일 경로
    const scenarioPath = path.join(
      process.cwd(),
      'public',
      'server-scenarios',
      'hourly-metrics',
      `${currentHour.toString().padStart(2, '0')}.json`
    );
    
    const raw = fs.readFileSync(scenarioPath, 'utf8');
    const scenarioData = JSON.parse(raw);
    
    // 서버 데이터를 Server 타입으로 변환
    const servers: Server[] = Object.values(scenarioData.servers).map((server: any) => ({
      id: server.id,
      name: server.name,
      hostname: server.hostname,
      status: server.status,
      cpu: server.cpu,
      memory: server.memory,
      disk: server.disk,
      network: server.network,
      uptime: server.uptime,
      location: server.location,
      environment: server.environment,
      provider: server.provider,
      type: server.type,
      alerts: server.alerts,
      lastSeen: server.lastUpdate,
      metrics: server.metrics
    }));
    
    debug.log(`Scenario data loaded: ${servers.length} servers, "${scenarioData.scenario}"`);
    
    return {
      servers,
      scenario: scenarioData.scenario,
      hour: currentHour
    };
  } catch (e) {
    debug.error('Scenario data load failed:', e);
    
    // 폴백: 정적 서버 데이터 사용
    try {
      const fallbackPath = path.join(
        process.cwd(),
        'public',
        'fallback',
        'servers.json'
      );
      const raw = fs.readFileSync(fallbackPath, 'utf8');
      const parsed = JSON.parse(raw);
      const servers = Array.isArray(parsed) ? parsed : (parsed.servers || []);
      
      debug.log('Using fallback data');
      return { servers, scenario: 'Fallback Mode', hour: new Date().getHours() };
    } catch (fallbackError) {
      debug.error('Fallback data also failed to load:', fallbackError);
      return { servers: [], scenario: 'No Data', hour: new Date().getHours() };
    }
  }
};

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

    debug.log(
      `API Request: page=${page}, limit=${limit}, search="${search}", status="${status}"`
    );

    // Portfolio mode: using 24-hour scenario data
    debug.log('Portfolio mode activated - using scenario data');
    const { servers: allServers, scenario, hour } = loadScenarioData();
    let filteredServers = [...allServers];
    
    // 필터/정렬/페이지네이션 적용
    if (search) {
      filteredServers = filteredServers.filter(
        (server) =>
          server.name.toLowerCase().includes(search.toLowerCase()) ||
          (server.hostname || '').toLowerCase().includes(search.toLowerCase()) ||
          (server.location || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      filteredServers = filteredServers.filter(
        (server) => server.status === status
      );
    }
    if (environment) {
      filteredServers = filteredServers.filter(
        (server) => server.environment === environment
      );
    }
    
    // 정렬 적용
    filteredServers.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'cpu':
          return (a.cpu - b.cpu) * dir;
        case 'memory':
          return (a.memory - b.memory) * dir;
        case 'disk':
          return (a.disk - b.disk) * dir;
        case 'network':
          return (a.network - b.network) * dir;
        case 'uptime':
          return (a.uptime - b.uptime) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
    
    // 페이지네이션 적용
    const totalCount = filteredServers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(
      startIndex,
      startIndex + limit
    );
    
    // 통계 정보 계산
    const stats = {
      total: totalCount,
      online: allServers.filter((s: Server) => s.status === 'healthy' || s.status === 'online').length,
      warning: allServers.filter((s: Server) => s.status === 'warning').length,
      offline: allServers.filter((s: Server) => s.status === 'critical' || s.status === 'offline').length,
    };

    const responseTime = Date.now() - startTime;
    debug.log(`Response time: ${responseTime}ms (scenario: ${scenario})`);

    // 시나리오 이름을 영어로 변환 (HTTP 헤더용)
    const scenarioEnglishMap: Record<string, string> = {
      '정상 운영': 'Normal-Operation',
      '정상화': 'Normalization', 
      '점진적 회복': 'Gradual-Recovery',
      '캐시 메모리 부족 경고': 'Cache-Memory-Warning',
      'Cache 메모리 부족 경고': 'Cache-Memory-Warning',
      'DB 복제 지연': 'DB-Replication-Lag',
      '트래픽 증가 시작': 'Traffic-Increase-Start',
      '아침 트래픽 증가': 'Morning-Traffic-Increase',
      '웹서버 CPU 스파이크': 'Web-Server-CPU-Spike',
      'API 응답시간 증가': 'API-Response-Time-Increase',
      '메시지 큐 백로그': 'Message-Queue-Backlog',
      '부하 분산으로 안정화': 'Load-Balancing-Stabilization',
      '점심 피크 트래픽': 'Lunch-Peak-Traffic',
      '스토리지 디스크 경고': 'Storage-Disk-Warning',
      'DB 슬로우 쿼리 급증': 'DB-Slow-Query-Surge',
      '모니터링 수집 지연': 'Monitoring-Collection-Delay',
      '점진적 정상화': 'Gradual-Normalization',
      '퇴근 시간 트래픽 피크': 'Evening-Traffic-Peak',
      'API 메모리 누수 감지': 'API-Memory-Leak-Detection',
      'DB 커넥션 풀 고갈': 'DB-Connection-Pool-Exhaustion',
      '웹서버 503 에러': 'Web-Server-503-Errors',
      '긴급 패치 적용': 'Emergency-Patch-Application',
      '시스템 안정화': 'System-Stabilization'
    };
    const scenarioHeaderValue = scenarioEnglishMap[scenario] || scenario.replace(/[^a-zA-Z0-9\-]/g, '-');

    // 응답 헤더 생성 (ASCII만 사용)
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache-Status': 'portfolio-scenario',
      'X-Storage': 'Static-JSON-Files', 
      'X-Response-Time': `${responseTime}`,
      'X-Current-Hour': `${hour}`,
      'X-Scenario': scenarioHeaderValue,
    });

    return NextResponse.json(
      {
        success: true,
        data: paginatedServers,
        servers: paginatedServers,
        scenario: {
          current: scenarioHeaderValue,
          korean: scenario,
          hour,
          description: "24-hour Portfolio Demonstration Scenario"
        },
        summary: {
          servers: {
            total: stats.total,
            online: stats.online,
            warning: stats.warning,
            offline: stats.offline,
            avgCpu: Math.round(
              paginatedServers.reduce((sum, s) => sum + s.cpu, 0) / paginatedServers.length || 0
            ),
            avgMemory: Math.round(
              paginatedServers.reduce((sum, s) => sum + s.memory, 0) / paginatedServers.length || 0
            ),
          },
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
        count: paginatedServers.length,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers,
      }
    );

    // 🚫 이전 Supabase 조회 로직 제거됨 - 정적 시나리오 데이터 사용으로 전환
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug.error('Server list retrieval failed:', errorMessage);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve server list',
        details: errorMessage,
        timestamp: Date.now(),
        responseTime,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Response-Time': `${responseTime}`,
        },
      }
    );
  }
}
