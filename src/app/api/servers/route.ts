import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../services/simulationEngine';

/**
 * 📊 서버 목록 조회 API
 * GET /api/servers
 * 현재 시뮬레이션 중인 모든 서버 목록을 반환합니다
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 서버 목록 조회 API 호출');

    // 시뮬레이션 엔진에서 서버 데이터 가져오기
    let servers: any[] = [];
    let isSimulationRunning = false;
    
    try {
      isSimulationRunning = simulationEngine.isRunning();
      
      if (isSimulationRunning) {
        const rawServers = simulationEngine.getServers();
        
        // 서버 데이터 정규화
        servers = rawServers.map(server => ({
          id: server.id || server.hostname,
          name: server.hostname,
          hostname: server.hostname,
          type: server.role || 'server',
          environment: server.environment || 'production',
          location: 'Seoul DC1',
          provider: 'onpremise',
          status: server.status,
          cpu: Math.round(server.cpu_usage || 0),
          memory: Math.round(server.memory_usage || 0),
          disk: Math.round(server.disk_usage || 0),
          uptime: calculateUptime(server.last_updated),
          lastUpdate: new Date(server.last_updated),
          alerts: server.alerts?.length || 0,
          services: generateMockServices(),
          specs: {
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 100
          },
          os: 'Ubuntu 22.04 LTS',
          ip: generateMockIP(),
          metrics: {
            cpu: Math.round(server.cpu_usage || 0),
            memory: Math.round(server.memory_usage || 0),
            disk: Math.round(server.disk_usage || 0),
            network_in: Math.round(server.network_in || 0),
            network_out: Math.round(server.network_out || 0),
            response_time: Math.round(server.response_time || 0)
          }
        }));
        
        console.log(`✅ 시뮬레이션에서 ${servers.length}개 서버 데이터 로드`);
      } else {
        console.log('⚠️ 시뮬레이션 엔진 중지됨, 기본 서버 데이터 반환');
      }
    } catch (simulationError) {
      console.warn('⚠️ 시뮬레이션 엔진 오류:', simulationError);
      isSimulationRunning = false;
    }

    // 시뮬레이션이 실행 중이 아니면 기본 서버 데이터 제공
    if (!isSimulationRunning || servers.length === 0) {
      servers = generateDefaultServers();
      console.log(`📋 기본 서버 데이터 ${servers.length}개 반환`);
    }

    // 응답 생성
    return NextResponse.json({
      success: true,
      message: `${servers.length}개 서버 조회 완료`,
      data: {
        servers,
        totalCount: servers.length,
        isSimulationRunning,
        summary: generateServerSummary(servers),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 서버 목록 조회 오류:', error);
    
    // 에러 시에도 기본 서버 데이터 반환
    const fallbackServers = generateDefaultServers();
    
    return NextResponse.json({
      success: true, // 사용자에게는 성공으로 표시
      message: `기본 서버 데이터 ${fallbackServers.length}개 반환 (Fallback 모드)`,
      data: {
        servers: fallbackServers,
        totalCount: fallbackServers.length,
        isSimulationRunning: false,
        summary: generateServerSummary(fallbackServers),
        timestamp: new Date().toISOString()
      },
      fallback: true,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 200 }); // 200으로 반환하여 UI 오류 방지
  }
}

/**
 * 기본 서버 데이터 생성
 */
function generateDefaultServers() {
  const servers = [
    {
      id: 'web-prod-01',
      name: 'web-prod-01',
      hostname: 'web-prod-01.openmanager.local',
      type: 'web-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'healthy',
      cpu: 45,
      memory: 67,
      disk: 23,
      uptime: '15d 4h 23m',
      lastUpdate: new Date(),
      alerts: 0,
      services: [
        { name: 'nginx', status: 'running', port: 80 },
        { name: 'nodejs', status: 'running', port: 3000 }
      ],
      specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
      os: 'Ubuntu 22.04 LTS',
      ip: '192.168.1.101',
      metrics: { cpu: 45, memory: 67, disk: 23, network_in: 150, network_out: 89, response_time: 234 }
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
      cpu: 78,
      memory: 82,
      disk: 45,
      uptime: '12d 8h 15m',
      lastUpdate: new Date(),
      alerts: 2,
      services: [
        { name: 'nodejs', status: 'running', port: 3000 },
        { name: 'redis', status: 'running', port: 6379 }
      ],
      specs: { cpu_cores: 6, memory_gb: 16, disk_gb: 200 },
      os: 'Ubuntu 22.04 LTS',
      ip: '192.168.1.102',
      metrics: { cpu: 78, memory: 82, disk: 45, network_in: 234, network_out: 156, response_time: 456 }
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
      cpu: 34,
      memory: 56,
      disk: 67,
      uptime: '25d 12h 45m',
      lastUpdate: new Date(),
      alerts: 0,
      services: [
        { name: 'postgresql', status: 'running', port: 5432 },
        { name: 'pgbouncer', status: 'running', port: 6432 }
      ],
      specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
      os: 'Ubuntu 22.04 LTS',
      ip: '192.168.1.103',
      metrics: { cpu: 34, memory: 56, disk: 67, network_in: 89, network_out: 45, response_time: 123 }
    }
  ];

  // 추가 변동성을 위한 랜덤 조정
  servers.forEach(server => {
    server.cpu += Math.floor(Math.random() * 10 - 5);
    server.memory += Math.floor(Math.random() * 10 - 5);
    server.disk += Math.floor(Math.random() * 5 - 2);
    
    // 범위 제한
    server.cpu = Math.max(0, Math.min(100, server.cpu));
    server.memory = Math.max(0, Math.min(100, server.memory));
    server.disk = Math.max(0, Math.min(100, server.disk));
    
    // 메트릭 동기화
    server.metrics.cpu = server.cpu;
    server.metrics.memory = server.memory;
    server.metrics.disk = server.disk;
  });

  return servers;
}

/**
 * 서버 요약 정보 생성
 */
function generateServerSummary(servers: any[]) {
  const summary = {
    total: servers.length,
    healthy: servers.filter(s => s.status === 'healthy').length,
    warning: servers.filter(s => s.status === 'warning').length,
    critical: servers.filter(s => s.status === 'critical').length,
    avgCpu: servers.length > 0 ? Math.round(servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length) : 0,
    avgMemory: servers.length > 0 ? Math.round(servers.reduce((sum, s) => sum + s.memory, 0) / servers.length) : 0,
    totalAlerts: servers.reduce((sum, s) => sum + s.alerts, 0)
  };

  return summary;
}

/**
 * 업타임 계산
 */
function calculateUptime(lastUpdated: string): string {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now.getTime() - updated.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${days}d ${hours}h ${minutes}m`;
}

/**
 * 모의 서비스 생성
 */
function generateMockServices() {
  const services = [
    { name: 'systemd', status: 'running', port: 0 },
    { name: 'ssh', status: 'running', port: 22 },
    { name: 'docker', status: 'running', port: 0 }
  ];
  
  return services;
}

/**
 * 모의 IP 생성
 */
function generateMockIP(): string {
  return `192.168.1.${100 + Math.floor(Math.random() * 50)}`;
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 