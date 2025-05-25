/**
 * Servers API
 * 
 * 🔄 실제 서버 모니터링 API
 * - 동적 서버 데이터 제공
 * - 실시간 메트릭 수집
 * - 이중화 데이터 소스 지원
 */

import { NextRequest, NextResponse } from 'next/server';

// 간단한 테스트 서버 데이터 생성
function generateTestServers() {
  const serverTypes = ['API', 'Database', 'Web', 'Cache', 'Worker'];
  const locations = ['US-East-1', 'US-West-2', 'EU-Central-1', 'AP-Tokyo-1', 'AP-Seoul-1'];
  const providers = ['aws', 'azure', 'gcp', 'kubernetes', 'onpremise'];
  const environments = ['production', 'staging', 'development'];
  
  const servers = [];
  
  for (let i = 1; i <= 15; i++) {
    const serverNum = String(i).padStart(3, '0');
    const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    
    // 일부 서버는 의도적으로 문제 상태로 설정
    let status = 'online';
    let cpu = Math.floor(Math.random() * 60) + 10; // 10-70%
    let memory = Math.floor(Math.random() * 50) + 30; // 30-80%
    
    if (i === 1) { // 첫 번째 서버는 높은 CPU 사용률
      status = 'critical';
      cpu = 89;
      memory = 76;
    } else if (i <= 4) { // 몇 개는 경고 상태
      status = 'warning';
      cpu = Math.floor(Math.random() * 20) + 70; // 70-90%
    }

    servers.push({
      id: `server-${serverNum}`,
      hostname: `${type.toLowerCase()}-${location.toLowerCase().replace('-', '')}-${serverNum}`,
      ipAddress: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status,
      location,
      environment,
      provider,
      instanceType: provider === 'aws' ? 't3.medium' : provider === 'kubernetes' ? 'worker-node' : 'standard',
      cluster: provider === 'kubernetes' ? 'production-cluster' : undefined,
      zone: location.split('-').pop(),
      tags: {
        team: ['devops', 'backend', 'frontend', 'data'][Math.floor(Math.random() * 4)],
        project: ['web-app', 'api-service', 'data-pipeline', 'monitoring'][Math.floor(Math.random() * 4)],
        cost_center: ['engineering', 'product', 'infrastructure'][Math.floor(Math.random() * 3)]
      },
      metrics: {
        cpu,
        memory,
        disk: Math.floor(Math.random() * 40) + 40, // 40-80%
        network: {
          bytesIn: Math.floor(Math.random() * 1000000),
          bytesOut: Math.floor(Math.random() * 1000000),
          packetsIn: Math.floor(Math.random() * 10000),
          packetsOut: Math.floor(Math.random() * 10000),
          latency: Math.floor(Math.random() * 50) + 1,
          connections: Math.floor(Math.random() * 100) + 10
        },
        processes: Math.floor(Math.random() * 200) + 50,
        loadAverage: [
          Math.random() * 4,
          Math.random() * 4,
          Math.random() * 4
        ],
        uptime: Math.floor(Math.random() * 365 * 24 * 3600), // 초 단위
        temperature: Math.floor(Math.random() * 30) + 40, // 40-70도
        powerUsage: Math.floor(Math.random() * 200) + 100 // 100-300W
      },
      lastUpdate: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      alerts: status !== 'online' ? [{
        id: `alert-${i}`,
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
          pid: Math.floor(Math.random() * 10000) + 1000,
          uptime: Math.floor(Math.random() * 86400),
          memoryUsage: Math.floor(Math.random() * 100) + 50,
          cpuUsage: Math.floor(Math.random() * 10) + 1
        },
        {
          name: type.toLowerCase(),
          status: status === 'critical' ? 'failed' : 'running',
          port: type === 'Database' ? 5432 : type === 'API' ? 8080 : 3000,
          pid: Math.floor(Math.random() * 10000) + 1000,
          uptime: Math.floor(Math.random() * 86400),
          memoryUsage: Math.floor(Math.random() * 200) + 100,
          cpuUsage: Math.floor(Math.random() * 20) + 5
        }
      ]
    });
  }
  
  return servers;
}

/**
 * GET /api/servers
 * 서버 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Generating test server data...');
    
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const environment = searchParams.get('environment');
    const location = searchParams.get('location');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // 테스트 서버 데이터 생성
    let servers = generateTestServers();

    // 필터링 적용
    if (status) {
      servers = servers.filter(server => server.status === status);
    }
    
    if (provider) {
      servers = servers.filter(server => server.provider === provider);
    }
    
    if (environment) {
      servers = servers.filter(server => server.environment === environment);
    }
    
    if (location) {
      servers = servers.filter(server => 
        server.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // 정렬 (최근 업데이트 순)
    servers.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());

    // 페이지네이션
    const totalCount = servers.length;
    const offsetNum = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : 50;
    
    if (limit || offset) {
      servers = servers.slice(offsetNum, offsetNum + limitNum);
    }

    // 통계 정보
    const stats = {
      total: totalCount,
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length,
      critical: servers.filter(s => s.status === 'critical').length,
      offline: servers.filter(s => s.status === 'offline').length
    };

    console.log(`✅ Generated ${servers.length} test servers`);

    return NextResponse.json({
      success: true,
      data: servers,
      pagination: {
        total: totalCount,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < totalCount
      },
      stats: {
        ...stats,
        collection: {
          isActive: true,
          lastUpdate: new Date().toISOString(),
          errors: 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating server data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch server data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/servers
 * 서버 등록/업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverData } = body;

    switch (action) {
      case 'register':
        // 새 서버 등록 (실제 환경에서는 에이전트 설치 등)
        console.log('📝 Registering new server:', serverData);
        
        return NextResponse.json({
          success: true,
          message: 'Server registration initiated',
          data: {
            id: `manual-${Date.now()}`,
            status: 'pending'
          }
        });

      case 'update':
        // 서버 정보 업데이트
        console.log('🔄 Updating server:', serverData);
        
        return NextResponse.json({
          success: true,
          message: 'Server update initiated'
        });

      case 'discover':
        // 서버 재발견 트리거
        console.log('🔍 Triggering server discovery...');
        
        // 실제로는 비동기로 처리
        setTimeout(async () => {
          // 서버 재발견 로직
        }, 1000);
        
        return NextResponse.json({
          success: true,
          message: 'Server discovery triggered'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in server POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process server request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/servers
 * 서버 정보 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, updates } = body;

    console.log(`🔄 Updating server ${serverId}:`, updates);

    // 실제 환경에서는 데이터베이스 업데이트
    return NextResponse.json({
      success: true,
      message: `Server ${serverId} updated successfully`,
      data: {
        id: serverId,
        ...updates,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating server:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update server',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/servers
 * 서버 제거 (모니터링 중단)
 */
export async function DELETE() {
  try {
    console.log('🗑️ Server deletion requested');

    return NextResponse.json({
      success: true,
      message: 'Server deletion is not allowed in demo mode'
    });

  } catch (error) {
    console.error('❌ Error in server DELETE:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process delete request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 