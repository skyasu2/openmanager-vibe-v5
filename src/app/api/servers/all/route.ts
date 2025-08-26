import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  // TODO: createServerSideAction 대체 - 임시 구현
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증 강화 (Codex 제안)
    const sortBy = (searchParams.get('sortBy') || 'name') as SortableKey;
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    
    // TODO: 시스템 메트릭 분석기 초기화 - 임시 제거
    // const analytics = createSystemMetricsAnalytics();
    
    // 🎯 프로덕션용 서버 데이터 생성 (15개 서버)
    let servers: ServerMetrics[] = [
      // 웹 서버들 (5개)
      {
        name: 'web-server-01',
        cpu: 45.2,
        memory: 78.5,
        disk: 65.1,
        network: 12.3,
        uptime: 99.8,
        status: 'online'
      },
      {
        name: 'web-server-02',
        cpu: 52.8,
        memory: 68.2,
        disk: 58.9,
        network: 15.7,
        uptime: 99.5,
        status: 'online'
      },
      {
        name: 'web-server-03',
        cpu: 38.9,
        memory: 82.1,
        disk: 71.3,
        network: 9.8,
        uptime: 98.9,
        status: 'warning'
      },
      {
        name: 'web-server-04',
        cpu: 67.4,
        memory: 45.8,
        disk: 89.2,
        network: 22.1,
        uptime: 97.8,
        status: 'online'
      },
      {
        name: 'web-server-05',
        cpu: 89.3,
        memory: 91.7,
        disk: 93.4,
        network: 45.6,
        uptime: 95.2,
        status: 'critical'
      },

      // 데이터베이스 서버들 (3개)
      {
        name: 'db-server-01',
        cpu: 23.7,
        memory: 89.2,
        disk: 45.8,
        network: 8.5,
        uptime: 99.9,
        status: 'online'
      },
      {
        name: 'db-server-02',
        cpu: 34.2,
        memory: 76.5,
        disk: 67.3,
        network: 12.9,
        uptime: 99.7,
        status: 'online'
      },
      {
        name: 'db-server-03',
        cpu: 78.9,
        memory: 88.4,
        disk: 89.7,
        network: 25.3,
        uptime: 96.8,
        status: 'warning'
      },

      // API 서버들 (4개)
      {
        name: 'api-server-01',
        cpu: 67.1,
        memory: 34.5,
        disk: 78.2,
        network: 28.7,
        uptime: 98.5,
        status: 'warning'
      },
      {
        name: 'api-server-02',
        cpu: 45.8,
        memory: 67.9,
        disk: 56.4,
        network: 18.2,
        uptime: 99.2,
        status: 'online'
      },
      {
        name: 'api-server-03',
        cpu: 56.7,
        memory: 78.3,
        disk: 45.9,
        network: 21.8,
        uptime: 98.8,
        status: 'online'
      },
      {
        name: 'api-server-04',
        cpu: 92.4,
        memory: 95.7,
        disk: 87.3,
        network: 52.1,
        uptime: 94.5,
        status: 'critical'
      },

      // 로드 밸런서들 (3개)
      {
        name: 'lb-server-01',
        cpu: 12.5,
        memory: 28.9,
        disk: 35.7,
        network: 67.8,
        uptime: 99.9,
        status: 'online'
      },
      {
        name: 'lb-server-02',
        cpu: 18.2,
        memory: 34.6,
        disk: 42.1,
        network: 89.4,
        uptime: 99.8,
        status: 'online'
      },
      {
        name: 'cache-server-01',
        cpu: 67.8,
        memory: 89.5,
        disk: 23.4,
        network: 45.7,
        uptime: 99.1,
        status: 'warning'
      }
    ];
    
    // 검색 필터 적용
    if (search) {
      const searchLower = search.toLowerCase();
      servers = servers.filter(server =>
        server.name.toLowerCase().includes(searchLower) ||
        server.status.toLowerCase().includes(searchLower)
      );
    }
    
    // 정렬 적용 (타입 안전성 개선)
    servers.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'cpu':
          return (ensureNumber(a.cpu) - ensureNumber(b.cpu)) * dir;
        case 'memory':
          return (ensureNumber(a.memory) - ensureNumber(b.memory)) * dir;
        case 'disk':
          return (ensureNumber(a.disk) - ensureNumber(b.disk)) * dir;
        case 'network':
          // Qwen 최적화: undefined 체크를 상수 시간으로 처리
          const aNetwork = ensureNumber(a.network);
          const bNetwork = ensureNumber(b.network);
          return (aNetwork - bNetwork) * dir;
        case 'uptime':
          return (ensureNumber(a.uptime) - ensureNumber(b.uptime)) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
    
    // 페이지네이션 적용
    const total = servers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = servers.slice(startIndex, startIndex + limit);
    
    // TODO: 분석 데이터 수집 - analytics 임시 제거
    // analytics.track('servers_list_request', { ... });
    
    // 🔧 serverDataStore.ts에서 기대하는 구조로 응답 수정
    // 서버 데이터를 올바른 형식으로 변환
    const enhancedServers = paginatedServers.map((server, index) => ({
      id: `server-${Date.now()}-${index}`, // 고유 ID 생성
      name: server.name,
      hostname: server.name,
      status: server.status === 'online' ? 'online' : server.status,
      cpu: server.cpu,
      cpu_usage: server.cpu,
      memory: server.memory,
      memory_usage: server.memory,
      disk: server.disk,
      disk_usage: server.disk,
      network: server.network || 0,
      network_in: (server.network || 0) * 0.6,
      network_out: (server.network || 0) * 0.4,
      uptime: server.uptime * 3600, // 시간을 초로 변환
      location: 'Seoul-DC-01',
      alerts: Math.floor(Math.random() * 3),
      ip: `192.168.1.${index + 100}`,
      os: 'Ubuntu 22.04 LTS',
      type: server.name.includes('web') ? 'web' : 
            server.name.includes('db') ? 'database' : 
            server.name.includes('api') ? 'api' : 
            server.name.includes('lb') ? 'loadbalancer' : 'cache',
      role: 'worker',
      environment: 'production',
      provider: 'On-Premise',
      specs: {
        cpu_cores: Math.ceil(server.cpu / 25), // CPU 사용률 기반 코어 수 추정
        memory_gb: Math.ceil(server.memory / 12.5), // 메모리 사용률 기반 용량 추정
        disk_gb: Math.ceil(server.disk * 4), // 디스크 사용률 기반 용량 추정
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor(server.uptime)}h`,
        processes: Math.floor(Math.random() * 200) + 50,
        zombieProcesses: Math.floor(Math.random() * 5),
        loadAverage: '1.23, 1.45, 1.67',
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${Math.floor((server.network || 0) * 0.6)} MB`,
        sentBytes: `${Math.floor((server.network || 0) * 0.4)} MB`,
        receivedErrors: Math.floor(Math.random() * 10),
        sentErrors: Math.floor(Math.random() * 10),
        status: server.status === 'online' ? 'healthy' : 
                server.status === 'warning' ? 'warning' : 'critical'
      }
    }));

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

    const currentScenario = scenarios[Math.floor(currentHour / 3) * 3] || scenarios[12];

    return NextResponse.json({
      success: true,
      data: enhancedServers, // 직접 배열로 반환 (serverDataStore.ts가 기대하는 구조)
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
      timestamp: new Date().toISOString()
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