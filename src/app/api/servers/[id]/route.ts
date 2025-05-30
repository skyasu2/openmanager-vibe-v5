import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';

/**
 * 📊 개별 서버 정보 조회 API
 * GET /api/servers/[id]
 * 특정 서버의 상세 정보와 히스토리를 반환합니다
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const range = searchParams.get('range') || '24h';

    console.log(`📊 서버 [${id}] 정보 조회 API 호출 (history: ${includeHistory}, range: ${range})`);

    // 시뮬레이션 엔진에서 서버 찾기
    let server: any = null;
    let isSimulationRunning = false;
    
    try {
      isSimulationRunning = simulationEngine.isRunning();
      
      if (isSimulationRunning) {
        const servers = simulationEngine.getServers();
        server = servers.find(s => s.id === id || s.hostname === id);
        
        if (server) {
          console.log(`✅ 시뮬레이션에서 서버 [${id}] 발견`);
        } else {
          console.log(`⚠️ 시뮬레이션에서 서버 [${id}] 찾을 수 없음`);
        }
      }
    } catch (simulationError) {
      console.warn('⚠️ 시뮬레이션 엔진 오류:', simulationError);
      isSimulationRunning = false;
    }

    // 시뮬레이션에서 찾지 못했거나 실행 중이 아니면 기본 데이터 사용
    if (!server) {
      server = getDefaultServerById(id);
      if (!server) {
        return NextResponse.json({
          success: false,
          message: `서버 [${id}]를 찾을 수 없습니다`,
          error: 'Server not found'
        }, { status: 404 });
      }
      console.log(`📋 기본 서버 데이터에서 [${id}] 반환`);
    }

    // 서버 데이터 정규화
    const normalizedServer = normalizeServerData(server);
    
    // 히스토리 데이터 생성 (요청된 경우)
    let history: any[] = [];
    if (includeHistory) {
      history = generateServerHistory(id, range);
      console.log(`📈 서버 [${id}] 히스토리 ${history.length}개 생성 (${range})`);
    }

    // 응답 생성
    const response = {
      success: true,
      message: `서버 [${id}] 정보 조회 완료`,
      data: {
        server: normalizedServer,
        history: includeHistory ? history : undefined,
        isSimulationRunning,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ 서버 정보 조회 오류:`, error);
    
    return NextResponse.json({
      success: false,
      message: '서버 정보 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * 기본 서버 데이터에서 ID로 서버 찾기
 */
function getDefaultServerById(id: string) {
  const defaultServers = [
    {
      id: 'web-prod-01',
      name: 'web-prod-01',
      hostname: 'web-prod-01.openmanager.local',
      type: 'web-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'healthy',
      cpu_usage: 45,
      memory_usage: 67,
      disk_usage: 23,
      uptime: '15d 4h 23m',
      last_updated: new Date().toISOString(),
      alerts: []
    },
    {
      id: 'api-prod-01',
      name: 'api-prod-01',
      hostname: 'api-prod-01.openmanager.local',
      type: 'api-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'warning',
      cpu_usage: 78,
      memory_usage: 82,
      disk_usage: 45,
      uptime: '12d 8h 15m',
      last_updated: new Date().toISOString(),
      alerts: [
        { type: 'warning', message: 'High CPU usage detected' },
        { type: 'warning', message: 'Memory usage above threshold' }
      ]
    },
    {
      id: 'db-prod-01',
      name: 'db-prod-01',
      hostname: 'db-prod-01.openmanager.local',
      type: 'database',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'healthy',
      cpu_usage: 34,
      memory_usage: 56,
      disk_usage: 67,
      uptime: '25d 12h 45m',
      last_updated: new Date().toISOString(),
      alerts: []
    }
  ];

  return defaultServers.find(server => 
    server.id === id || 
    server.hostname === id || 
    server.name === id
  );
}

/**
 * 서버 데이터 정규화
 */
function normalizeServerData(server: any) {
  const cpuUsage = typeof server.cpu_usage === 'number' ? Math.round(server.cpu_usage) : 
                   typeof server.cpu === 'number' ? Math.round(server.cpu) : 45;
  const memoryUsage = typeof server.memory_usage === 'number' ? Math.round(server.memory_usage) : 
                      typeof server.memory === 'number' ? Math.round(server.memory) : 67;
  const diskUsage = typeof server.disk_usage === 'number' ? Math.round(server.disk_usage) : 
                    typeof server.disk === 'number' ? Math.round(server.disk) : 23;

  return {
    id: server.id || server.hostname || 'unknown',
    name: server.name || server.hostname || 'Unknown Server',
    hostname: server.hostname || 'unknown.local',
    type: server.type || server.role || 'server',
    environment: server.environment || 'production',
    location: server.location || 'Seoul DC1',
    provider: server.provider || 'onpremise',
    status: mapServerStatus(server.status),
    cpu: cpuUsage,
    memory: memoryUsage,
    disk: diskUsage,
    uptime: server.uptime || calculateUptime(server.last_updated || new Date().toISOString()),
    lastUpdate: new Date(server.last_updated || Date.now()),
    alerts: Array.isArray(server.alerts) ? server.alerts.length : 0,
    services: server.services || generateMockServices(),
    specs: server.specs || {
      cpu_cores: 4,
      memory_gb: 8,
      disk_gb: 100
    },
    os: server.os || 'Ubuntu 22.04 LTS',
    ip: server.ip || generateMockIP(),
    metrics: {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network_in: Math.round(server.network_in || Math.random() * 200),
      network_out: Math.round(server.network_out || Math.random() * 150),
      response_time: Math.round(server.response_time || Math.random() * 300 + 100)
    }
  };
}

/**
 * 서버 상태 매핑
 */
function mapServerStatus(status: string): string {
  if (status === 'warning') return 'warning';
  if (status === 'critical' || status === 'offline') return 'critical';
  return 'healthy';
}

/**
 * 업타임 계산
 */
function calculateUptime(lastUpdated: string): string {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
}

/**
 * 서버 히스토리 생성
 */
function generateServerHistory(serverId: string, range: string): any[] {
  const history: any[] = [];
  const now = new Date();
  
  // 범위에 따른 데이터 포인트 수 결정
  let points = 24; // 기본 24개 (1시간 간격)
  let intervalMs = 60 * 60 * 1000; // 1시간
  
  switch (range) {
    case '1h':
      points = 60;
      intervalMs = 60 * 1000; // 1분
      break;
    case '6h':
      points = 36;
      intervalMs = 10 * 60 * 1000; // 10분
      break;
    case '24h':
      points = 24;
      intervalMs = 60 * 60 * 1000; // 1시간
      break;
    case '7d':
      points = 168;
      intervalMs = 60 * 60 * 1000; // 1시간
      break;
    case '30d':
      points = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1일
      break;
  }

  // 기본 메트릭 (서버에 따라 다르게 설정)
  let baseCpu = 45;
  let baseMemory = 67;
  let baseDisk = 23;
  
  if (serverId.includes('api')) {
    baseCpu = 65;
    baseMemory = 75;
    baseDisk = 40;
  } else if (serverId.includes('db')) {
    baseCpu = 35;
    baseMemory = 80;
    baseDisk = 60;
  }

  // 히스토리 데이터 생성
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - (points - i - 1) * intervalMs);
    
    // 시간대별 패턴 추가 (업무시간 vs 야간)
    const hour = timestamp.getHours();
    const isBusinessHour = hour >= 9 && hour <= 18;
    const multiplier = isBusinessHour ? 1.3 : 0.7;
    
    // 노이즈와 트렌드 추가
    const noise = (Math.random() - 0.5) * 20;
    const trend = Math.sin((i / points) * 2 * Math.PI) * 10;
    
    history.push({
      timestamp: timestamp.toISOString(),
      cpu: Math.max(0, Math.min(100, baseCpu * multiplier + noise + trend)),
      memory: Math.max(0, Math.min(100, baseMemory * multiplier + noise * 0.5)),
      disk: Math.max(0, Math.min(100, baseDisk + noise * 0.3)),
      network_in: Math.max(0, Math.random() * 200 * multiplier),
      network_out: Math.max(0, Math.random() * 150 * multiplier),
      response_time: Math.max(50, Math.random() * 300 + 100),
      connections: Math.floor(Math.random() * 100 * multiplier),
      requests_per_sec: Math.floor(Math.random() * 50 * multiplier)
    });
  }

  return history;
}

/**
 * Mock 서비스 생성
 */
function generateMockServices() {
  return [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'nodejs', status: 'running', port: 3000 }
  ];
}

/**
 * Mock IP 생성
 */
function generateMockIP(): string {
  return `192.168.1.${Math.floor(Math.random() * 200) + 100}`;
} 