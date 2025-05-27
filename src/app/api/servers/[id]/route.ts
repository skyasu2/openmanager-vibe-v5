/**
 * Individual Server API
 * 
 * 🔄 개별 서버 정보 조회 API
 * - 특정 서버 상세 정보
 * - 실시간 메트릭 데이터
 * - 서버별 히스토리
 */

import { NextRequest, NextResponse } from 'next/server';

// 개별 서버 데이터 생성 (ID 기반)
function generateServerById(serverId: string) {
  const serverTypes = ['API', 'Database', 'Web', 'Cache', 'Worker'];
  const locations = ['US-East-1', 'US-West-2', 'EU-Central-1', 'AP-Tokyo-1', 'AP-Seoul-1'];
  const providers = ['aws', 'azure', 'gcp', 'kubernetes', 'onpremise'];
  const environments = ['production', 'staging', 'development'];
  
  // ID에서 숫자 추출
  const serverNum = serverId.replace(/\D/g, '') || '001';
  const index = parseInt(serverNum);
  
  const type = serverTypes[index % serverTypes.length];
  const location = locations[index % locations.length];
  const provider = providers[index % providers.length];
  const environment = environments[index % environments.length];
  
  // 서버 상태 결정 (ID 기반으로 일관성 유지)
  let status = 'online';
  let cpu = Math.floor((index * 7) % 60) + 10; // 10-70%
  let memory = Math.floor((index * 11) % 50) + 30; // 30-80%
  
  if (index === 1) { // 첫 번째 서버는 높은 CPU 사용률
    status = 'critical';
    cpu = 89;
    memory = 76;
  } else if (index <= 4) { // 몇 개는 경고 상태
    status = 'warning';
    cpu = Math.floor((index * 13) % 20) + 70; // 70-90%
  }

  return {
    id: serverId,
    hostname: `${type.toLowerCase()}-${location.toLowerCase().replace('-', '')}-${serverNum.padStart(3, '0')}`,
    ipAddress: `10.${Math.floor((index * 17) % 255)}.${Math.floor((index * 19) % 255)}.${Math.floor((index * 23) % 255)}`,
    status,
    location,
    environment,
    provider,
    instanceType: provider === 'aws' ? 't3.medium' : provider === 'kubernetes' ? 'worker-node' : 'standard',
    cluster: provider === 'kubernetes' ? 'production-cluster' : undefined,
    zone: location.split('-').pop(),
    tags: {
      team: ['devops', 'backend', 'frontend', 'data'][index % 4],
      project: ['web-app', 'api-service', 'data-pipeline', 'monitoring'][index % 4],
      cost_center: ['engineering', 'product', 'infrastructure'][index % 3]
    },
    metrics: {
      cpu,
      memory,
      disk: Math.floor((index * 29) % 40) + 40, // 40-80%
      network: {
        bytesIn: Math.floor((index * 31) % 1000000),
        bytesOut: Math.floor((index * 37) % 1000000),
        packetsIn: Math.floor((index * 41) % 10000),
        packetsOut: Math.floor((index * 43) % 10000),
        latency: Math.floor((index * 47) % 50) + 1,
        connections: Math.floor((index * 53) % 100) + 10
      },
      processes: Math.floor((index * 59) % 200) + 50,
      loadAverage: [
        ((index * 61) % 400) / 100,
        ((index * 67) % 400) / 100,
        ((index * 71) % 400) / 100
      ],
      uptime: Math.floor((index * 73) % (365 * 24 * 3600)), // 초 단위
      temperature: Math.floor((index * 79) % 30) + 40, // 40-70도
      powerUsage: Math.floor((index * 83) % 200) + 100 // 100-300W
    },
    lastUpdate: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    alerts: status !== 'online' ? [{
      id: `alert-${serverId}`,
      severity: status === 'critical' ? 'critical' : 'medium',
      type: 'cpu',
      message: status === 'critical' ? 'CPU 사용률이 매우 높습니다' : 'CPU 사용률이 높습니다',
      timestamp: new Date().toISOString(),
      acknowledged: false
    }] : [],
    services: [
      {
        name: 'nginx',
        status: 'running',
        port: 80,
        pid: Math.floor((index * 89) % 10000) + 1000,
        uptime: Math.floor((index * 97) % 86400),
        memoryUsage: Math.floor((index * 101) % 100) + 50,
        cpuUsage: Math.floor((index * 103) % 10) + 1
      },
      {
        name: type.toLowerCase(),
        status: status === 'critical' ? 'failed' : 'running',
        port: type === 'Database' ? 5432 : type === 'API' ? 8080 : 3000,
        pid: Math.floor((index * 107) % 10000) + 1000,
        uptime: Math.floor((index * 109) % 86400),
        memoryUsage: Math.floor((index * 113) % 200) + 100,
        cpuUsage: Math.floor((index * 127) % 20) + 5
      }
    ],
    // 추가 상세 정보
    history: {
      cpuHistory: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: Math.max(10, cpu + Math.sin((index + i) * 0.5) * 15)
      })),
      memoryHistory: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: Math.max(20, memory + Math.cos((index + i) * 0.3) * 10)
      }))
    }
  };
}

/**
 * GET /api/servers/[id]
 * 개별 서버 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    console.log(`🔍 Fetching server data for: ${serverId}`);
    
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const hours = parseInt(searchParams.get('hours') || '24');
    
    // 서버 데이터 생성
    const server = generateServerById(serverId);
    
    // 히스토리 데이터 필터링
    if (!includeHistory) {
      // history 속성을 제외한 새 객체 생성
      const { history, ...serverWithoutHistory } = server;
      return NextResponse.json({
        success: true,
        data: serverWithoutHistory,
        timestamp: new Date().toISOString()
      });
    } else if (hours !== 24) {
      // 요청된 시간만큼만 히스토리 제공
      const hoursToInclude = Math.min(hours, 24);
      server.history.cpuHistory = server.history.cpuHistory.slice(-hoursToInclude);
      server.history.memoryHistory = server.history.memoryHistory.slice(-hoursToInclude);
    }
    
    console.log(`✅ Generated data for server: ${serverId}`);

    return NextResponse.json({
      success: true,
      data: server,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error fetching server:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch server data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/servers/[id]
 * 개별 서버 정보 업데이트
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const body = await request.json();
    
    console.log(`🔄 Updating server ${serverId}:`, body);

    // 실제 환경에서는 데이터베이스 업데이트
    return NextResponse.json({
      success: true,
      message: `Server ${serverId} updated successfully`,
      data: {
        id: serverId,
        ...body,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error updating server:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update server',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/servers/[id]
 * 개별 서버 제거
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    console.log(`🗑️ Delete request for server: ${serverId}`);

    return NextResponse.json({
      success: true,
      message: `Server deletion is not allowed in demo mode for ${serverId}`
    });

  } catch (error) {
    console.error(`❌ Error deleting server:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete server',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 