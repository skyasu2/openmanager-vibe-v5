/**
 * Servers API
 * 
 * 🔄 실제 서버 모니터링 API
 * - 동적 서버 데이터 제공
 * - 실시간 메트릭 수집
 * - 이중화 데이터 소스 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '../../../services/dataManager';
import { simulationEngine } from '../../../services/simulationEngine';

// 현실적인 서버 구성 데이터 생성 (20개 서버)
function generateTestServers() {
  const servers: any[] = [];
  
  // 서버 구성 정의
  const serverConfigs = [
    // 온프레미스 서버 (7개) - 데이터센터 IDC
    { hostname: 'web-prod-01', type: 'Web', role: 'Frontend Load Balancer', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'A-01' },
    { hostname: 'db-master-01', type: 'Database', role: 'PostgreSQL Master', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'B-03' },
    { hostname: 'cache-redis-01', type: 'Cache', role: 'Redis Cluster Master', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'A-05' },
    { hostname: 'backup-storage-01', type: 'Storage', role: 'Backup & Archive', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'C-02' },
    { hostname: 'mail-server-01', type: 'Mail', role: 'SMTP Server', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'B-01' },
    { hostname: 'file-server-nfs', type: 'Storage', role: 'NFS File Server', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'C-01' },
    { hostname: 'proxy-nginx-01', type: 'Proxy', role: 'Reverse Proxy', provider: 'onpremise', location: 'Seoul-IDC-1', environment: 'production', rack: 'A-02' },
    
    // 쿠버네티스 클러스터 (6개) - EKS 환경
    { hostname: 'k8s-master-01', type: 'Kubernetes', role: 'Control Plane Master', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    { hostname: 'k8s-worker-01', type: 'Kubernetes', role: 'Worker Node', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    { hostname: 'k8s-worker-02', type: 'Kubernetes', role: 'Worker Node', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    { hostname: 'k8s-ingress-01', type: 'Ingress', role: 'Ingress Controller', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    { hostname: 'k8s-logging-01', type: 'Logging', role: 'Log Aggregator', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    { hostname: 'k8s-monitoring-01', type: 'Monitoring', role: 'Prometheus Stack', provider: 'kubernetes', location: 'AWS-Seoul-1', environment: 'production', cluster: 'prod-cluster' },
    
    // AWS 클라우드 서버 (7개) - EC2 인스턴스
    { hostname: 'api-gateway-prod', type: 'API', role: 'API Gateway', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 't3.large' },
    { hostname: 'analytics-worker', type: 'Worker', role: 'Data Processing', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 'c5.xlarge' },
    { hostname: 'monitoring-elk', type: 'Monitoring', role: 'ELK Stack', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 'm5.large' },
    { hostname: 'jenkins-ci-cd', type: 'CI/CD', role: 'Build Server', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 't3.medium' },
    { hostname: 'grafana-metrics', type: 'Monitoring', role: 'Metrics Dashboard', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 't3.small' },
    { hostname: 'vault-secrets', type: 'Security', role: 'Secret Management', provider: 'aws', location: 'AWS-Seoul-1', environment: 'production', instanceType: 't3.micro' },
    { hostname: 'staging-web-01', type: 'Web', role: 'Staging Frontend', provider: 'aws', location: 'AWS-Seoul-1', environment: 'staging', instanceType: 't3.small' }
  ];
  
  serverConfigs.forEach((config, i) => {
    const serverNum = String(i + 1).padStart(2, '0');
    
    // 일부 서버는 의도적으로 문제 상태로 설정
    let status = 'online';
    let cpu = Math.floor(Math.random() * 60) + 10; // 10-70%
    let memory = Math.floor(Math.random() * 50) + 30; // 30-80%
    
    // 특정 서버들에 문제 상태 설정
    if (config.hostname === 'db-master-01') { // DB 서버 높은 CPU
      status = 'critical';
      cpu = 89;
      memory = 76;
    } else if (config.hostname === 'cache-redis-01' || config.hostname === 'k8s-worker-01') { // 경고 상태
      status = 'warning';
      cpu = Math.floor(Math.random() * 20) + 70; // 70-90%
    } else if (config.hostname === 'monitoring-elk') { // 오프라인 상태
      status = 'offline';
      cpu = 0;
      memory = 0;
    }

    servers.push({
      id: `server-${serverNum}`,
      hostname: config.hostname,
      ipAddress: config.provider === 'onpremise' 
        ? `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 254) + 1}`
        : `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status,
      location: config.location,
      environment: config.environment,
      provider: config.provider,
      instanceType: config.instanceType || (config.provider === 'kubernetes' ? 'worker-node' : 'standard'),
      cluster: config.cluster,
      rack: config.rack,
      role: config.role,
      zone: config.location.split('-').pop(),
      tags: {
        team: config.type === 'Database' ? 'data' : config.type === 'Web' ? 'frontend' : config.type === 'API' ? 'backend' : 'devops',
        project: config.hostname.includes('prod') ? 'production-app' : config.hostname.includes('staging') ? 'staging-env' : config.hostname.includes('dev') ? 'development' : 'infrastructure',
        cost_center: config.environment === 'production' ? 'engineering' : 'development'
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
        severity: status === 'critical' ? 'critical' : status === 'offline' ? 'critical' : 'medium',
        type: status === 'offline' ? 'connectivity' : 'cpu',
        message: status === 'critical' ? 'CPU 사용률이 매우 높습니다' : status === 'offline' ? '서버에 연결할 수 없습니다' : 'CPU 사용률이 높습니다',
        timestamp: new Date().toISOString(),
        acknowledged: false
      }] : [],
      services: [
        {
          name: 'nginx',
          status: status === 'offline' ? 'stopped' : 'running',
          port: 80,
          pid: status === 'offline' ? 0 : Math.floor(Math.random() * 10000) + 1000,
          uptime: status === 'offline' ? 0 : Math.floor(Math.random() * 86400),
          memoryUsage: Math.floor(Math.random() * 100) + 50,
          cpuUsage: Math.floor(Math.random() * 10) + 1
        },
        {
          name: config.type.toLowerCase(),
          status: status === 'critical' ? 'failed' : status === 'offline' ? 'stopped' : 'running',
          port: config.type === 'Database' ? 5432 : config.type === 'API' ? 8080 : config.type === 'Cache' ? 6379 : 3000,
          pid: status === 'offline' ? 0 : Math.floor(Math.random() * 10000) + 1000,
          uptime: status === 'offline' ? 0 : Math.floor(Math.random() * 86400),
          memoryUsage: Math.floor(Math.random() * 200) + 100,
          cpuUsage: Math.floor(Math.random() * 20) + 5
        }
      ]
    });
  });
  
  return servers;
}

/**
 * GET /api/servers
 * 서버 목록 및 메트릭 조회 API
 * 클라이언트에서 서버 데이터를 안전하게 가져오기 위한 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('id');
    const timeRange = searchParams.get('timeRange') as 'realtime' | 'daily' || 'realtime';

    // 특정 서버의 시계열 데이터 요청
    if (serverId) {
      const timeSeries = dataManager.getServerTimeSeries(serverId, timeRange);
      
      return NextResponse.json({
        success: true,
        data: {
          serverId,
          timeRange,
          metrics: timeSeries,
          count: timeSeries.length
        }
      });
    }

    // 모든 서버의 최신 상태
    const servers = dataManager.getLatestServerStates();
    const statusDistribution = dataManager.getServerStatusDistribution();
    const envDistribution = dataManager.getEnvironmentDistribution();
    const avgMetrics = dataManager.getAverageMetrics();

    return NextResponse.json({
      success: true,
      data: {
        servers,
        summary: {
          total: servers.length,
          byStatus: statusDistribution,
          byEnvironment: envDistribution,
          averageMetrics: avgMetrics
        },
        isSimulationRunning: simulationEngine.isRunning()
      }
    });

  } catch (error) {
    console.error('❌ 서버 데이터 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '서버 데이터 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
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

/**
 * 백업 서버 데이터 생성
 */
async function generateFallbackServers() {
  // 팩토리 서비스를 통한 통합된 fallback 생성
  try {
    const { ServerDataFactory } = await import('@/lib/serverDataFactory');
    return ServerDataFactory.generateFallbackServers(10);
  } catch (error) {
    console.error('Failed to import ServerDataFactory, using basic fallback:', error);
    // 기본 fallback (서비스 import 실패 시)
    return Array.from({ length: 10 }, (_, i) => ({
      id: `basic-fallback-${i + 1}`,
      hostname: `server-${String(i + 1).padStart(2, '0')}`,
      ipAddress: `192.168.1.${i + 10}`,
      status: 'online',
      location: 'Seoul DC1',
      environment: 'production',
      provider: 'onpremise',
      tags: { emergency: 'true' },
      metrics: { cpu: 50, memory: 60, disk: 40 },
      lastUpdate: new Date(),
      lastSeen: new Date(),
      alerts: [],
      services: []
    }));
  }
} 