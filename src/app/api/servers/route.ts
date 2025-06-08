/**
 * 🖥️ 독립적 서버 모니터링 API
 *
 * OpenManager 7.0 - 서버 모니터링 시스템 전용 API
 * 서버 데이터 생성기와 독립적으로 운영되며 API를 통해서만 데이터 교환
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 서버 모니터링용 API - GET 요청
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('id');
    const format = searchParams.get('format') || 'dashboard';

    const dataGenerator = RealServerDataGenerator.getInstance();

    if (serverId) {
      // 특정 서버 조회
      const server = dataGenerator.getServerById(serverId);
      if (!server) {
        return NextResponse.json(
          { error: '서버를 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      // 대시보드 형식으로 변환
      const dashboardServer = convertToDashboardFormat(server);
      return NextResponse.json(dashboardServer);
    }

    // 전체 서버 목록 조회
    const servers = dataGenerator.getAllServers();
    const clusters = dataGenerator.getAllClusters();
    const applications = dataGenerator.getAllApplications();

    if (format === 'summary') {
      // 요약 정보만 반환
      const summary = dataGenerator.getDashboardSummary();
      return NextResponse.json(summary);
    }

    // 대시보드 형식으로 변환
    const dashboardServers = servers.map(convertToDashboardFormat);

    return NextResponse.json({
      servers: dashboardServers,
      clusters: clusters.map(convertClusterToDashboardFormat),
      applications: applications.map(convertApplicationToDashboardFormat),
      summary: {
        total: servers.length,
        online: servers.filter(s => s.status === 'running').length,
        warning: servers.filter(s => s.status === 'warning').length,
        offline: servers.filter(
          s => s.status === 'stopped' || s.status === 'error'
        ).length,
        maintenance: servers.filter(s => s.status === 'maintenance').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 서버 모니터링 API 오류:', error);
    return NextResponse.json(
      { error: '서버 데이터 조회 실패' },
      { status: 500 }
    );
  }
}

// 서버 제어 API - POST 요청 (모니터링 시스템에서 제어 명령 전송)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId, parameters } = body;

    const dataGenerator = RealServerDataGenerator.getInstance();

    switch (action) {
      case 'restart':
        // 서버 재시작 시뮬레이션
        const server = dataGenerator.getServerById(serverId);
        if (server) {
          // 상태를 일시적으로 maintenance로 변경 후 running으로 복원
          server.status = 'maintenance';
          setTimeout(() => {
            server.status = 'running';
          }, 5000);
          return NextResponse.json({
            success: true,
            message: `서버 ${serverId} 재시작 완료`,
          });
        }
        break;

      case 'update_config':
        // 환경 설정 업데이트
        if (parameters) {
          dataGenerator.updateEnvironmentConfig(parameters);
          return NextResponse.json({
            success: true,
            message: '환경 설정 업데이트 완료',
          });
        }
        break;

      case 'demo_scenario':
        // 시나리오 변경
        if (parameters?.scenario) {
          dataGenerator.setDemoScenario(parameters.scenario);
          return NextResponse.json({
            success: true,
            message: `시나리오 변경: ${parameters.scenario}`,
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({ error: '요청 처리 실패' }, { status: 400 });
  } catch (error) {
    console.error('❌ 서버 제어 API 오류:', error);
    return NextResponse.json({ error: '서버 제어 실패' }, { status: 500 });
  }
}

// 🔄 서버 데이터를 대시보드 형식으로 변환
function convertToDashboardFormat(server: any) {
  return {
    id: server.id,
    name: server.name,
    status: mapServerStatus(server.status),
    location: server.location,
    type: server.type.toUpperCase(),
    cpu: Math.round(server.metrics.cpu),
    memory: Math.round(server.metrics.memory),
    disk: Math.round(server.metrics.disk),
    network_usage: Math.round(
      (server.metrics.network.in + server.metrics.network.out) / 2
    ),
    uptime: formatUptime(server.metrics.uptime),
    lastUpdate: new Date(),
    alerts: server.health.issues.length,
    health: {
      score: server.health.score,
      issues: server.health.issues,
      lastCheck: server.health.lastCheck,
    },
    specs: server.specs,
    customMetrics: server.metrics.customMetrics,
    security: server.security,
    services: generateServices(server.type),
  };
}

function convertClusterToDashboardFormat(cluster: any) {
  return {
    id: cluster.id,
    name: cluster.name,
    serverCount: cluster.servers.length,
    loadBalancer: cluster.loadBalancer,
    scaling: cluster.scaling,
    health: calculateClusterHealth(cluster.servers),
  };
}

function convertApplicationToDashboardFormat(app: any) {
  return {
    name: app.name,
    version: app.version,
    deployments: app.deployments,
    performance: app.performance,
    resources: app.resources,
    health: calculateApplicationHealth(app.performance),
  };
}

// 상태 매핑
function mapServerStatus(
  status: string
): 'online' | 'offline' | 'warning' | 'maintenance' {
  switch (status) {
    case 'running':
      return 'online';
    case 'stopped':
    case 'error':
      return 'offline';
    case 'warning':
      return 'warning';
    case 'maintenance':
      return 'maintenance';
    default:
      return 'offline';
  }
}

// 업타임 포맷팅
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}

// 서비스 생성 (서버 타입별)
function generateServices(serverType: string) {
  const serviceTemplates: Record<string, any[]> = {
    web: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'apache', status: 'running', port: 443 },
    ],
    api: [
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
    database: [
      { name: 'postgresql', status: 'running', port: 5432 },
      { name: 'mysql', status: 'running', port: 3306 },
    ],
    cache: [
      { name: 'redis', status: 'running', port: 6379 },
      { name: 'memcached', status: 'running', port: 11211 },
    ],
  };

  return (
    serviceTemplates[serverType] || [
      { name: 'system', status: 'running', port: 0 },
    ]
  );
}

function calculateClusterHealth(servers: any[]) {
  const healthyCount = servers.filter(s => s.status === 'running').length;
  const healthPercentage = (healthyCount / servers.length) * 100;

  if (healthPercentage >= 90) return 'healthy';
  if (healthPercentage >= 70) return 'warning';
  return 'critical';
}

function calculateApplicationHealth(performance: any) {
  const { errorRate, availability } = performance;

  if (errorRate < 1 && availability > 99.5) return 'healthy';
  if (errorRate < 5 && availability > 95) return 'warning';
  return 'critical';
}
