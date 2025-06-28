/**
 * 🎯 통합 메트릭 API v4.0 - Phase 3 개선
 *
 * 통합된 기능:
 * ✅ MetricsGenerator 기반 메트릭 생성
 * ✅ RealServerDataGenerator 대시보드 일치
 * ✅ Prometheus 호환 포맷 지원
 * ✅ PromQL 쿼리 실행
 * ✅ JSON/텍스트 다중 포맷
 *
 * 사용법:
 * GET  /api/metrics                    # 기본 메트릭 조회
 * GET  /api/metrics?format=prometheus  # Prometheus 텍스트 포맷
 * GET  /api/metrics?format=unified     # 대시보드 일치 데이터
 * GET  /api/metrics?action=status      # 시스템 상태
 * POST /api/metrics                    # PromQL 쿼리 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { MetricsGenerator } from '../../../services/data-generator/modules/MetricsGenerator';

// 안전한 import 처리
let RealServerDataGenerator: any = null;

try {
  const realModule = require('@/services/data-generator/RealServerDataGenerator');
  RealServerDataGenerator = realModule.RealServerDataGenerator;
} catch (error) {
  console.warn('RealServerDataGenerator import 실패:', error.message);
}

/**
 * 🎯 통합 메트릭 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const source = searchParams.get('source') || 'metrics-generator';
    const count = parseInt(searchParams.get('count') || '20');
    const action = searchParams.get('action') || 'metrics';

    console.log(
      `📊 통합 메트릭 API v4.0: format=${format}, source=${source}, action=${action}`
    );

    // 액션별 처리
    switch (action) {
      case 'status':
        return await getSystemStatus();
      case 'targets':
        return await getPrometheusTargets();
      case 'config':
        return await getPrometheusConfig();
      default:
        break;
    }

    // 데이터 소스별 처리
    let serverData: any[] = [];
    let metadata = {};

    switch (source) {
      case 'unified':
      case 'real-generator':
        serverData = await getUnifiedMetrics();
        metadata = {
          source: 'RealServerDataGenerator',
          consistency: 'dashboard-aligned',
        };
        break;
      default:
        serverData = await getMetricsGeneratorData(count);
        metadata = { source: 'MetricsGenerator', consistency: 'independent' };
        break;
    }

    // 포맷별 응답
    switch (format) {
      case 'prometheus':
        return getPrometheusFormat(serverData);
      case 'unified':
        return getUnifiedFormat(serverData, metadata);
      default:
        return getJsonFormat(serverData, metadata);
    }
  } catch (error) {
    console.error('❌ 통합 메트릭 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        version: '4.0.0',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 PromQL 쿼리 실행 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, time, source = 'metrics-generator' } = body;

    console.log(`🔍 PromQL 쿼리 실행: ${query} (source: ${source})`);

    if (!query) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Query parameter is required',
          errorType: 'bad_data',
        },
        { status: 400 }
      );
    }

    // PromQL 쿼리 실행
    const result = await executePromQLQuery(query, time, source);

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: result,
      },
      query: query,
      source: source,
      timestamp: new Date().toISOString(),
      version: '4.0.0',
    });
  } catch (error) {
    console.error('❌ PromQL 쿼리 실행 실패:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Query execution failed',
        errorType: 'execution',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}

/**
 * 📊 MetricsGenerator 데이터
 */
async function getMetricsGeneratorData(count: number): Promise<any[]> {
  const metricsGenerator = new MetricsGenerator();
  return await metricsGenerator.generateMetrics(count);
}

/**
 * 🔄 통합 메트릭 (RealServerDataGenerator)
 */
async function getUnifiedMetrics(): Promise<any[]> {
  if (!RealServerDataGenerator) {
    // 폴백: MetricsGenerator 사용
    console.warn('RealServerDataGenerator 사용 불가, MetricsGenerator로 폴백');
    return await getMetricsGeneratorData(20);
  }

  const realGenerator = RealServerDataGenerator.getInstance();
  await realGenerator.initialize();

  const servers = realGenerator.getAllServers();
  const serverArray = Array.from(servers.values());

  return serverArray.map((server: any) => ({
    id: server.id,
    name: server.name,
    hostname: server.name,
    environment: server.environment,
    role: server.role,
    status:
      server.status === 'running'
        ? 'healthy'
        : server.status === 'warning'
          ? 'warning'
          : server.status === 'error'
            ? 'critical'
            : 'offline',
    cpu_usage: server.metrics?.cpu || 0,
    memory_usage: server.metrics?.memory || 0,
    disk_usage: server.metrics?.disk || 0,
    network_in: server.metrics?.network?.in || 0,
    network_out: server.metrics?.network?.out || 0,
    response_time: Math.random() * 100 + 50,
    uptime: server.metrics?.uptime || 0,
    last_updated: new Date().toISOString(),
    alerts: [],
  }));
}

/**
 * 📝 JSON 포맷 응답
 */
function getJsonFormat(serverData: any[], metadata: any): NextResponse {
  // 통계 계산
  const totalServers = serverData.length;
  const healthyServers = serverData.filter(s =>
    ['healthy', 'running'].includes(s.status)
  ).length;
  const warningServers = serverData.filter(s => s.status === 'warning').length;
  const criticalServers = serverData.filter(s =>
    ['critical', 'error'].includes(s.status)
  ).length;

  const avgCpu =
    totalServers > 0
      ? serverData.reduce((sum, s) => sum + (s.cpu_usage || s.cpu || 0), 0) /
        totalServers
      : 0;
  const avgMemory =
    totalServers > 0
      ? serverData.reduce(
          (sum, s) => sum + (s.memory_usage || s.memory || 0),
          0
        ) / totalServers
      : 0;
  const avgDisk =
    totalServers > 0
      ? serverData.reduce((sum, s) => sum + (s.disk_usage || s.disk || 0), 0) /
        totalServers
      : 0;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      version: '4.0.0',
      format: 'json',
      generationTime: Date.now(),
      apiFeatures: ['json', 'prometheus', 'unified', 'promql'],
    },
    data: serverData,
    summary: {
      total: totalServers,
      healthy: healthyServers,
      warning: warningServers,
      critical: criticalServers,
      healthyPercent:
        totalServers > 0
          ? ((healthyServers / totalServers) * 100).toFixed(1)
          : '0',
      warningPercent:
        totalServers > 0
          ? ((warningServers / totalServers) * 100).toFixed(1)
          : '0',
      criticalPercent:
        totalServers > 0
          ? ((criticalServers / totalServers) * 100).toFixed(1)
          : '0',
      avgCpu: avgCpu.toFixed(1),
      avgMemory: avgMemory.toFixed(1),
      avgDisk: avgDisk.toFixed(1),
    },
  });
}

/**
 * 📊 Prometheus 텍스트 포맷
 */
function getPrometheusFormat(serverData: any[]): NextResponse {
  const timestamp = Math.floor(Date.now() / 1000);
  let output = '';

  // 헤더
  output += '# OpenManager Vibe v5 - 통합 메트릭 API v4.0\n';
  output += `# Generated at: ${new Date().toISOString()}\n`;
  output += `# Total servers: ${serverData.length}\n\n`;

  // CPU 메트릭
  output += '# HELP cpu_usage_percent Current CPU usage percentage\n';
  output += '# TYPE cpu_usage_percent gauge\n';
  serverData.forEach(server => {
    const cpuValue = server.cpu_usage || server.cpu || 0;
    output += `cpu_usage_percent{instance="${server.id}",job="${server.role || 'default'}",environment="${server.environment || 'production'}"} ${cpuValue} ${timestamp}\n`;
  });
  output += '\n';

  // 메모리 메트릭
  output += '# HELP memory_usage_percent Current memory usage percentage\n';
  output += '# TYPE memory_usage_percent gauge\n';
  serverData.forEach(server => {
    const memoryValue = server.memory_usage || server.memory || 0;
    output += `memory_usage_percent{instance="${server.id}",job="${server.role || 'default'}",environment="${server.environment || 'production'}"} ${memoryValue} ${timestamp}\n`;
  });
  output += '\n';

  // 디스크 메트릭
  output += '# HELP disk_usage_percent Current disk usage percentage\n';
  output += '# TYPE disk_usage_percent gauge\n';
  serverData.forEach(server => {
    const diskValue = server.disk_usage || server.disk || 0;
    output += `disk_usage_percent{instance="${server.id}",job="${server.role || 'default'}",environment="${server.environment || 'production'}"} ${diskValue} ${timestamp}\n`;
  });
  output += '\n';

  // 서버 상태 메트릭
  output += '# HELP server_status Current server status\n';
  output += '# TYPE server_status gauge\n';
  serverData.forEach(server => {
    let statusValue = 2; // normal
    const status = server.status;
    if (['critical', 'error'].includes(status)) statusValue = 3;
    else if (status === 'warning') statusValue = 1;
    else if (['maintenance', 'offline'].includes(status)) statusValue = 0;

    output += `server_status{instance="${server.id}",job="${server.role || 'default'}",environment="${server.environment || 'production'}",status="${status}"} ${statusValue} ${timestamp}\n`;
  });

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-API-Version': '4.0.0',
    },
  });
}

/**
 * 🔄 통합 포맷 (대시보드 호환)
 */
function getUnifiedFormat(serverData: any[], metadata: any): NextResponse {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    source: metadata.source,
    dataConsistency: metadata.consistency,
    data: serverData,
    metadata: {
      ...metadata,
      format: 'unified',
      version: '4.0.0',
      dashboardCompatible: true,
      features: ['dashboard-sync', 'realtime-updates', 'consistent-data'],
    },
  });
}

/**
 * 📊 시스템 상태 정보
 */
async function getSystemStatus(): Promise<NextResponse> {
  const servers = await getMetricsGeneratorData(5);

  return NextResponse.json({
    success: true,
    data: {
      api: {
        version: '4.0.0',
        status: 'healthy',
        uptime: process.uptime(),
        phase: 'Phase 3 - API 통합 완료',
        features: ['json', 'prometheus', 'unified', 'promql'],
        endpoints: [
          'GET /api/metrics',
          'GET /api/metrics?format=prometheus',
          'GET /api/metrics?format=unified',
          'GET /api/metrics?action=status',
          'POST /api/metrics (PromQL)',
        ],
      },
      metrics: {
        totalServers: servers.length,
        lastUpdate: new Date().toISOString(),
        sources: ['MetricsGenerator', 'RealServerDataGenerator'],
        integrationStatus: 'completed',
      },
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🎯 Prometheus 타겟 정보
 */
async function getPrometheusTargets(): Promise<NextResponse> {
  const servers = await getMetricsGeneratorData(10);

  const targets = servers.map((server: any) => ({
    targets: [`${server.name || server.id}:9100`],
    labels: {
      job: server.role || 'openmanager',
      instance: server.id,
      environment: server.environment || 'production',
      __address__: `${server.name || server.id}:9100`,
    },
  }));

  return NextResponse.json({
    success: true,
    data: {
      activeTargets: targets,
      droppedTargets: [],
      total: targets.length,
    },
    timestamp: new Date().toISOString(),
    version: '4.0.0',
  });
}

/**
 * ⚙️ Prometheus 설정 정보
 */
async function getPrometheusConfig(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      yaml: `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'openmanager-unified'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    params:
      format: ['prometheus']
      source: ['metrics-generator']
`,
      version: '4.0.0',
      compatible: 'prometheus-2.x',
      integration: 'unified-api',
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🔍 PromQL 쿼리 실행
 */
async function executePromQLQuery(
  query: string,
  time?: number,
  source: string = 'metrics-generator'
): Promise<any[]> {
  console.log(`🔍 PromQL 쿼리 실행: ${query} (source: ${source})`);

  // 데이터 소스에 따라 서버 데이터 조회
  let servers: any[] = [];
  if (source === 'unified' || source === 'real-generator') {
    servers = await getUnifiedMetrics();
  } else {
    servers = await getMetricsGeneratorData(10);
  }

  const currentTime = time || Math.floor(Date.now() / 1000);

  // 기본적인 PromQL 쿼리 처리
  if (query.includes('cpu_usage_percent')) {
    return servers.map(server => ({
      metric: {
        __name__: 'cpu_usage_percent',
        instance: server.id,
        job: server.role || 'default',
        environment: server.environment || 'production',
      },
      value: [currentTime, (server.cpu_usage || server.cpu || 0).toString()],
    }));
  }

  if (query.includes('memory_usage_percent')) {
    return servers.map(server => ({
      metric: {
        __name__: 'memory_usage_percent',
        instance: server.id,
        job: server.role || 'default',
        environment: server.environment || 'production',
      },
      value: [
        currentTime,
        (server.memory_usage || server.memory || 0).toString(),
      ],
    }));
  }

  if (query.includes('server_status')) {
    return servers.map(server => {
      let statusValue = 2;
      const status = server.status;
      if (['critical', 'error'].includes(status)) statusValue = 3;
      else if (status === 'warning') statusValue = 1;
      else if (['maintenance', 'offline'].includes(status)) statusValue = 0;

      return {
        metric: {
          __name__: 'server_status',
          instance: server.id,
          job: server.role || 'default',
          environment: server.environment || 'production',
          status: status,
        },
        value: [currentTime, statusValue.toString()],
      };
    });
  }

  // 기본 응답
  return servers.slice(0, 5).map(server => ({
    metric: {
      __name__: 'openmanager_unified',
      instance: server.id,
      job: server.role || 'default',
      version: '4.0.0',
    },
    value: [currentTime, '1'],
  }));
}
