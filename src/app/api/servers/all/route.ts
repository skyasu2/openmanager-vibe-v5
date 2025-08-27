import { NextRequest, NextResponse } from 'next/server';
import { getServersFromGCPVM } from '@/lib/gcp-vm-client';
import type { EnhancedServerMetrics } from '@/types/server';
// TODO: 누락된 모듈들 - 추후 구현 필요
// import { createServerSideAction } from '@/core/security/server-side-action';
// import { createSystemMetricsAnalytics } from '@/lib/analytics/system-metrics-analytics';

interface ServerMetrics {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number; // 선택적 속성으로 명시
  uptime: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

// 타입 가드 함수 추가 (Codex 제안)
const ensureNumber = (value: number | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

// 정렬 키 타입 정의 강화
type SortableKey = keyof Pick<ServerMetrics, 'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'name'>;

/**
 * 폴백용 목업 데이터 생성 함수
 * GCP VM 연결 실패 시 사용
 */
function generateMockServers(): EnhancedServerMetrics[] {
  return [
    // 웹 서버들 (5개)
    {
      id: 'mock-web-01',
      name: 'web-server-01',
      hostname: 'web-server-01',
      status: 'online' as const,
      cpu: 45.2,
      cpu_usage: 45.2,
      memory: 78.5,
      memory_usage: 78.5,
      disk: 65.1,
      disk_usage: 65.1,
      network: 12.3,
      network_in: 7.4,
      network_out: 4.9,
      uptime: 359280, // 99.8h in seconds
      location: 'Seoul-DC-01',
      alerts: 0,
      ip: '192.168.1.100',
      os: 'Ubuntu 22.04 LTS',
      type: 'web',
      role: 'worker',
      environment: 'production',
      provider: 'Mock-Fallback',
      specs: {
        cpu_cores: 2,
        memory_gb: 7,
        disk_gb: 260,
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '99h',
        processes: 120,
        zombieProcesses: 0,
        loadAverage: '1.80, 1.75, 1.70',
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '7 MB',
        sentBytes: '4 MB',
        receivedErrors: 0,
        sentErrors: 0,
        status: 'healthy'
      }
    },
    {
      id: 'mock-web-02',
      name: 'web-server-02',
      hostname: 'web-server-02',
      status: 'online' as const,
      cpu: 52.8,
      cpu_usage: 52.8,
      memory: 68.2,
      memory_usage: 68.2,
      disk: 58.9,
      disk_usage: 58.9,
      network: 15.7,
      network_in: 9.4,
      network_out: 6.3,
      uptime: 358200,
      location: 'Seoul-DC-01',
      alerts: 0,
      ip: '192.168.1.101',
      os: 'Ubuntu 22.04 LTS',
      type: 'web',
      role: 'worker',
      environment: 'production',
      provider: 'Mock-Fallback',
      specs: {
        cpu_cores: 3,
        memory_gb: 6,
        disk_gb: 235,
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '99h',
        processes: 135,
        zombieProcesses: 1,
        loadAverage: '2.10, 2.05, 2.00',
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '9 MB',
        sentBytes: '6 MB',
        receivedErrors: 0,
        sentErrors: 0,
        status: 'healthy'
      }
    },
    {
      id: 'mock-api-01',
      name: 'api-server-04',
      hostname: 'api-server-04',
      status: 'critical' as const,
      cpu: 92.4,
      cpu_usage: 92.4,
      memory: 95.7,
      memory_usage: 95.7,
      disk: 87.3,
      disk_usage: 87.3,
      network: 52.1,
      network_in: 31.3,
      network_out: 20.8,
      uptime: 340020,
      location: 'Seoul-DC-01',
      alerts: 3,
      ip: '192.168.1.104',
      os: 'Ubuntu 22.04 LTS',
      type: 'api',
      role: 'worker',
      environment: 'production',
      provider: 'Mock-Fallback',
      specs: {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 349,
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '94h',
        processes: 287,
        zombieProcesses: 12,
        loadAverage: '4.50, 4.12, 3.98',
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '31 MB',
        sentBytes: '21 MB',
        receivedErrors: 8,
        sentErrors: 5,
        status: 'critical'
      }
    }
    // 3개 서버만 제공 (폴백 목적)
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증 강화 (Codex 제안)
    const sortBy = (searchParams.get('sortBy') || 'name') as SortableKey;
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    
    console.log('🌐 서버 데이터 요청 - GCP VM 통합 모드');
    console.log('📊 요청 파라미터:', { sortBy, sortOrder, page, limit, search });
    
    let enhancedServers: EnhancedServerMetrics[] = [];
    let dataSource = 'unknown';
    let fallbackUsed = false;

    try {
      // 🎯 1차: GCP VM에서 데이터 가져오기 시도
      console.log('🚀 GCP VM 서버 데이터 요청 중...');
      const gcpResponse = await getServersFromGCPVM();
      
      if (gcpResponse.success && gcpResponse.data && gcpResponse.data.length > 0) {
        console.log(`✅ GCP VM 응답 성공: ${gcpResponse.data.length}개 서버, 소스: ${gcpResponse.source}`);
        enhancedServers = gcpResponse.data;
        dataSource = gcpResponse.source;
        fallbackUsed = gcpResponse.fallback;
        
        // GCP VM 응답 상세 로깅
        if (gcpResponse.scenario) {
          console.log('🎭 GCP VM 시나리오:', {
            korean: gcpResponse.scenario.korean,
            english: gcpResponse.scenario.current,
            hour: gcpResponse.scenario.hour
          });
        }
      } else {
        throw new Error(`GCP VM 응답 실패: ${JSON.stringify(gcpResponse)}`);
      }
    } catch (gcpError) {
      // 🔄 2차: 로컬 목업 데이터로 폴백
      console.warn('⚠️ GCP VM 연결 실패, 목업 데이터로 폴백:', gcpError);
      enhancedServers = generateMockServers();
      dataSource = 'local-mock';
      fallbackUsed = true;
    }

    // 검색 필터 적용 (EnhancedServerMetrics 기준)
    let filteredServers = enhancedServers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServers = enhancedServers.filter(server =>
        server.name.toLowerCase().includes(searchLower) ||
        server.hostname.toLowerCase().includes(searchLower) ||
        server.status.toLowerCase().includes(searchLower) ||
        server.type.toLowerCase().includes(searchLower)
      );
    }

    // 정렬 적용 (EnhancedServerMetrics 기준)
    filteredServers.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'cpu':
          return (a.cpu_usage - b.cpu_usage) * dir;
        case 'memory':
          return (a.memory_usage - b.memory_usage) * dir;
        case 'disk':
          return (a.disk_usage - b.disk_usage) * dir;
        case 'network':
          return ((a.network || 0) - (b.network || 0)) * dir;
        case 'uptime':
          return (a.uptime - b.uptime) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });

    // 페이지네이션 적용
    const total = filteredServers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(startIndex, startIndex + limit);

    console.log(`📋 최종 응답: ${paginatedServers.length}개 서버 (전체: ${total}개)`);
    console.log('📡 데이터 소스:', { dataSource, fallbackUsed });

    // 현재 시간 기반 시나리오 정보 추가
    const currentHour = new Date().getHours();
    const scenarios = {
      0: { korean: '심야 유지보수', english: 'midnight-maintenance' },
      6: { korean: '아침 시작', english: 'morning-startup' },
      9: { korean: '업무 시작', english: 'work-hours-begin' },
      12: { korean: '점심 피크', english: 'lunch-peak' },
      14: { korean: '오후 업무', english: 'afternoon-work' },
      18: { korean: '퇴근 시간', english: 'evening-rush' },
      21: { korean: '야간 모드', english: 'night-mode' }
    };

    const timeKey = Math.floor(currentHour / 3) * 3 as keyof typeof scenarios;
    const currentScenario = scenarios[timeKey] || scenarios[12];

    return NextResponse.json({
      success: true,
      data: paginatedServers, // 페이지네이션된 서버 데이터
      source: dataSource, // 데이터 소스 정보 추가
      fallback: fallbackUsed, // 폴백 사용 여부
      scenario: {
        current: currentScenario.english,
        korean: currentScenario.korean,
        hour: currentHour
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: startIndex + limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString(),
      metadata: {
        serverCount: paginatedServers.length,
        totalServers: total,
        dataSource,
        fallbackUsed,
        gcpVmIntegration: true // GCP VM 통합 표시
      }
    });
      
  } catch (error) {
    console.error('서버 목록 조회 실패:', error);
    
    // 에러 경계 개선 (Codex 제안)
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'SERVERS_LIST_FAILED',
        message: process.env.NODE_ENV === 'development' ? error.message : '서버 목록을 불러올 수 없습니다.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.'
    }, { status: 500 });
  }
}