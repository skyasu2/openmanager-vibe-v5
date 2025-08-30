import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🚀 새로운 API v2 - 베르셀 캐시 문제 우회
 * 10개 서버 데이터를 직접 반환
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log(`🚀 [API-V2] 새로운 엔드포인트 호출됨 - ${timestamp}`);
  
  // 10개 서버 데이터 직접 정의
  const servers = [
    {
      id: "server-001",
      name: "web-server-01", 
      type: "web",
      status: "online",
      cpu: 34.38,
      memory: 28.41,
      disk: 53.92,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-01",
      ip: "192.168.1.100"
    },
    {
      id: "server-002", 
      name: "web-server-02",
      type: "web", 
      status: "online",
      cpu: 29.85,
      memory: 36.28,
      disk: 39.95,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-01", 
      ip: "192.168.1.101"
    },
    {
      id: "server-003",
      name: "api-server-01", 
      type: "api",
      status: "online",
      cpu: 47.52,
      memory: 41.49,
      disk: 29.58,
      provider: "Mock-Direct-V2", 
      location: "Seoul-DC-02",
      ip: "192.168.2.100"
    },
    {
      id: "server-004",
      name: "api-server-02",
      type: "api",
      status: "online", 
      cpu: 43.99,
      memory: 38.59,
      disk: 31.22,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-02",
      ip: "192.168.2.101"
    },
    {
      id: "server-005",
      name: "db-master-primary",
      type: "database",
      status: "online",
      cpu: 12.51,
      memory: 58.05,
      disk: 40.58,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-03", 
      ip: "192.168.3.100"
    },
    {
      id: "server-006",
      name: "db-replica-01",
      type: "database", 
      status: "warning",
      cpu: 17.46,
      memory: 44.16,
      disk: 53.22,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-03",
      ip: "192.168.3.101"
    },
    {
      id: "server-007",
      name: "redis-cache-01",
      type: "cache",
      status: "online",
      cpu: 42.0,
      memory: 58.01,
      disk: 45.0,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-04",
      ip: "192.168.4.100"
    },
    {
      id: "server-008", 
      name: "monitoring-server",
      type: "monitoring",
      status: "online",
      cpu: 26.24,
      memory: 47.98,
      disk: 78.77,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-05",
      ip: "192.168.5.100"
    },
    {
      id: "server-009",
      name: "security-server", 
      type: "security",
      status: "critical",
      cpu: 13.91,
      memory: 64.96,
      disk: 72.89,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-06",
      ip: "192.168.6.100"
    },
    {
      id: "server-010",
      name: "backup-server",
      type: "backup",
      status: "online", 
      cpu: 38.28,
      memory: 25.62,
      disk: 35.07,
      provider: "Mock-Direct-V2",
      location: "Seoul-DC-07",
      ip: "192.168.7.100"
    }
  ];

  const response = {
    success: true,
    data: servers,
    source: "api-v2-direct",
    timestamp,
    count: servers.length,
    summary: {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length, 
      critical: servers.filter(s => s.status === 'critical').length
    },
    version: "2.0.0",
    deployment_note: "베르셀 캐시 우회를 위한 새로운 API v2"
  };

  console.log(`✅ [API-V2] 10개 서버 데이터 반환 완료`);
  console.log(`📊 [API-V2] 상태: online=${response.summary.online}, warning=${response.summary.warning}, critical=${response.summary.critical}`);

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-API-Version': '2.0.0',
      'X-Server-Count': servers.length.toString(),
      'X-Timestamp': timestamp
    }
  });
}