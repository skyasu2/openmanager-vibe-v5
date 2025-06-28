import { NextRequest, NextResponse } from 'next/server';
import { AdvancedSimulationEngine } from '../../../../services/AdvancedSimulationEngine';
// import { prometheusFormatter } from '../../../../modules/data-generation/PrometheusMetricsFormatter'; // 🗑️ 프로메테우스 제거
import type { EnhancedServerMetrics } from '../../../../types/server';

/**
 * 📊 개별 서버 정보 조회 API - Enhanced & Prometheus Compatible
 * GET /api/servers/[id]
 * 특정 서버의 상세 정보, 히스토리 및 Prometheus 메트릭을 반환합니다
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const simulationEngine = new AdvancedSimulationEngine();

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const range = searchParams.get('range') || '24h';
    const format = searchParams.get('format') || 'enhanced'; // enhanced | legacy | prometheus
    const includeMetrics = searchParams.get('include_metrics') === 'true';
    const includePatterns = searchParams.get('include_patterns') === 'true';

    console.log(
      `📊 서버 [${id}] 정보 조회: history=${includeHistory}, range=${range}, format=${format}`
    );

    // 1. 고급 시뮬레이션 엔진 상태 확인
    const isRunning = simulationEngine.getIsRunning();
    if (!isRunning) {
      console.log('⚠️ 고급 시뮬레이션 엔진이 실행되지 않음. 시작 시도...');
      simulationEngine.start();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. 메트릭 데이터 생성 및 특정 서버 찾기
    const metrics = await simulationEngine.generateAdvancedMetrics();
    let server = metrics.find(m => m.server_id === id);

    if (!server) {
      // hostname으로도 검색
      server = metrics.find(m => m.server_id?.includes(id));
    }

    if (!server) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server not found',
          message: `서버 '${id}'를 찾을 수 없습니다`,
          available_servers: metrics.map(m => ({
            id: m.server_id,
            hostname: m.server_id,
          })),
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    console.log(`✅ 서버 [${id}] 발견: ${server.server_id} (메트릭 데이터)`);

    // 3. 응답 형식에 따른 처리
    if (format === 'prometheus') {
      // 🗑️ Prometheus 형식은 더 이상 지원하지 않음
      return NextResponse.json(
        {
          error: 'Prometheus format is no longer supported',
          message: 'Please use JSON format instead',
          server_id: server.server_id,
        },
        { status: 410 } // Gone
      );
    } else if (format === 'legacy') {
      // 레거시 형식
      const legacyServer = {
        id: server.server_id,
        hostname: server.server_id,
        name: `OpenManager-${server.server_id}`,
        type: 'app',
        environment: 'production',
        location: 'Seoul-DC-1',
        provider: 'AWS',
        status:
          server.cpu > 80 ? 'warning' : server.cpu > 95 ? 'critical' : 'online',
        cpu: Math.round(server.cpu),
        memory: Math.round(server.memory),
        disk: Math.round(server.disk),
        uptime: formatUptime(Math.random() * 8760 * 3600),
        lastUpdate: new Date(server.timestamp),
        alerts: server.cpu > 80 ? 1 : 0,
        services: generateServices('app'),
        specs: generateSpecs(server.server_id || id),
        os: generateSpecs(server.server_id || id).os,
        ip: generateIP(server.server_id || id),
        metrics: {
          cpu: Math.round(server.cpu),
          memory: Math.round(server.memory),
          disk: Math.round(server.disk),
          network_in: Math.round(server.network),
          network_out: Math.round(server.network * 0.8),
          response_time: Math.round(Math.random() * 500 + 100),
        },
      };

      // 히스토리 데이터 생성 (요청시)
      let history = null;
      if (includeHistory) {
        history = generateServerHistory(legacyServer as any, range);
      }

      return NextResponse.json({
        success: true,
        server: legacyServer,
        history,
        meta: {
          format: 'legacy',
          include_history: includeHistory,
          range,
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      });
    } else {
      // Enhanced 형식 (기본)
      const enhancedResponse = {
        // 기본 서버 정보
        server_info: {
          id: server.server_id,
          hostname: server.server_id,
          environment: 'production',
          role: 'app',
          status:
            server.cpu > 80
              ? 'warning'
              : server.cpu > 95
                ? 'critical'
                : 'healthy',
          uptime: formatUptime(Math.random() * 8760 * 3600),
          last_updated: server.timestamp,
        },

        // 현재 메트릭
        current_metrics: {
          cpu_usage: server.cpu,
          memory_usage: server.memory,
          disk_usage: server.disk,
          network_in: server.network,
          network_out: server.network * 0.8,
          response_time: Math.random() * 500 + 100,
        },

        // 리소스 정보
        resources: generateSpecs(server.server_id || id),
        network: {
          ip: generateIP(server.server_id || id),
          hostname: server.server_id || id,
          interface: 'eth0',
        },

        // 알람 정보
        alerts:
          server.cpu > 80
            ? [
                {
                  id: 'cpu-high',
                  severity: 'warning',
                  message: 'High CPU usage detected',
                  timestamp: server.timestamp,
                },
              ]
            : [],

        // 서비스 정보
        services: generateServices('app'),
      };

      // 패턴 정보 포함 (요청시)
      if (includePatterns && server.scenario) {
        (enhancedResponse as any).pattern_info = server.scenario;
        (enhancedResponse as any).correlation_metrics = {
          confidence: server.confidence,
          data_source: server.data_source,
        };
      }

      // 히스토리 데이터 (요청시)
      if (includeHistory) {
        (enhancedResponse as any).history = generateServerHistory(
          enhancedResponse as any,
          range
        );
      }

      // 메타데이터
      const response = {
        meta: {
          request_info: {
            server_id: id,
            format,
            include_history: includeHistory,
            include_metrics: includeMetrics,
            include_patterns: includePatterns,
            range,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
          simulation_info: simulationEngine.getStatus(),
        },
        data: enhancedResponse,
      };

      return NextResponse.json(response, {
        headers: {
          'X-Server-Id': server.server_id || id,
          'X-Hostname': server.server_id || id,
          'X-Server-Status':
            server.cpu > 80
              ? 'warning'
              : server.cpu > 95
                ? 'critical'
                : 'healthy',
          'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
        },
      });
    }
  } catch (error) {
    console.error(`❌ 서버 [${(await params).id}] 정보 조회 실패:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server information retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : '서버 정보 조회 중 오류가 발생했습니다',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🌍 환경별 위치 반환
 */
function getLocationByEnvironment(environment: string): string {
  const locationMap: Record<string, string> = {
    aws: 'AWS Seoul (ap-northeast-2)',
    azure: 'Azure Korea Central',
    gcp: 'GCP Seoul (asia-northeast3)',
    container: 'Container Cluster',
    idc: 'Seoul IDC',
    vdi: 'Virtual Desktop Infrastructure',
    onpremise: 'On-Premise Seoul DC1',
  };
  return locationMap[environment] || 'Unknown Location';
}

/**
 * 🏢 환경별 제공자 반환
 */
function getProviderByEnvironment(environment: string): string {
  const providerMap: Record<string, string> = {
    aws: 'Amazon Web Services',
    azure: 'Microsoft Azure',
    gcp: 'Google Cloud Platform',
    kubernetes: 'Kubernetes',
    idc: 'Internet Data Center',
    vdi: 'VMware vSphere',
    onpremise: 'On-Premise',
  };
  return providerMap[environment] || 'Unknown Provider';
}

/**
 * 🔧 역할별 서비스 생성
 */
function generateServices(
  role: string
): Array<{ name: string; status: 'running' | 'stopped'; port: number }> {
  const serviceMap: Record<string, Array<{ name: string; port: number }>> = {
    web: [
      { name: 'nginx', port: 80 },
      { name: 'nodejs', port: 3000 },
      { name: 'pm2', port: 0 },
    ],
    database: [
      { name: 'postgresql', port: 5432 },
      { name: 'redis', port: 6379 },
      { name: 'pgbouncer', port: 6432 },
    ],
    api: [
      { name: 'api-server', port: 8080 },
      { name: 'auth-service', port: 8081 },
      { name: 'rate-limiter', port: 8082 },
    ],
    cache: [
      { name: 'redis', port: 6379 },
      { name: 'memcached', port: 11211 },
      { name: 'redis-sentinel', port: 26379 },
    ],
    worker: [
      { name: 'background-process', port: 9000 },
      { name: 'queue-manager', port: 9001 },
      { name: 'scheduler', port: 9002 },
    ],
    gateway: [
      { name: 'nginx', port: 80 },
      { name: 'envoy', port: 8000 },
      { name: 'consul', port: 8500 },
    ],
    storage: [
      { name: 'minio', port: 9000 },
      { name: 'nfs-server', port: 2049 },
      { name: 'rsync', port: 873 },
    ],
    monitoring: [
      { name: 'prometheus', port: 9090 },
      { name: 'grafana', port: 3000 },
      { name: 'alertmanager', port: 9093 },
    ],
  };

  const services = serviceMap[role] || [
    { name: 'unknown-service', port: 8080 },
  ];
  return services.map(service => ({
    ...service,
    status: Math.random() > 0.05 ? ('running' as const) : ('stopped' as const),
  }));
}

/**
 * 🌐 서버 ID로 IP 생성
 */
function generateIP(serverId: string): string {
  const hash = serverId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const subnet = (Math.abs(hash) % 254) + 1;
  const host = (Math.abs(hash >> 8) % 254) + 1;

  return `192.168.${subnet}.${host}`;
}

/**
 * 💻 서버 ID로 스펙 생성
 */
function generateSpecs(serverId: string): {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  os: string;
} {
  const hash = serverId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const cpuCores = (Math.abs(hash) % 16) + 2; // 2-18 cores
  const memoryGb = Math.pow(2, (Math.abs(hash >> 4) % 5) + 2); // 4, 8, 16, 32, 64 GB
  const diskGb = (Math.abs(hash >> 8) % 500) + 100; // 100-600 GB

  const osOptions = [
    'Ubuntu 22.04 LTS',
    'CentOS 8',
    'RHEL 8',
    'Amazon Linux 2',
  ];
  const os = osOptions[Math.abs(hash >> 12) % osOptions.length];

  return { cpu_cores: cpuCores, memory_gb: memoryGb, disk_gb: diskGb, os };
}

/**
 * ⏰ 업타임 포맷팅
 */
function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / (24 * 3600));
  const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

/**
 * 📈 서버 히스토리 생성 (시뮬레이션)
 */
function generateServerHistory(
  server: EnhancedServerMetrics,
  range: string
): any {
  const timeRangeMs = parseTimeRange(range);
  const endTime = Date.now();
  const startTime = endTime - timeRangeMs;
  const intervalMs = timeRangeMs / 100; // 100개 데이터 포인트

  const history = {
    time_range: range,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    interval_ms: intervalMs,
    data_points: [] as any[],
  };

  // 히스토리 데이터 포인트 생성
  for (let time = startTime; time <= endTime; time += intervalMs) {
    const timeOfDay = new Date(time).getHours();
    const variation = Math.sin((timeOfDay / 24) * 2 * Math.PI) * 0.3; // 일일 패턴

    history.data_points.push({
      timestamp: new Date(time).toISOString(),
      metrics: {
        cpu_usage: Math.max(
          0,
          Math.min(
            100,
            server.cpu_usage + variation * 20 + (Math.random() - 0.5) * 10
          )
        ),
        memory_usage: Math.max(
          0,
          Math.min(
            100,
            server.memory_usage + variation * 15 + (Math.random() - 0.5) * 8
          )
        ),
        disk_usage: Math.max(
          0,
          Math.min(100, server.disk_usage + (Math.random() - 0.5) * 2)
        ),
        network_in: Math.max(
          0,
          server.network_in + variation * 50 + (Math.random() - 0.5) * 30
        ),
        network_out: Math.max(
          0,
          server.network_out + variation * 40 + (Math.random() - 0.5) * 25
        ),
        response_time: Math.max(
          0,
          server.response_time + variation * 100 + (Math.random() - 0.5) * 50
        ),
      },
    });
  }

  return history;
}

/**
 * ⏰ 시간 범위 파싱
 */
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1));

  switch (unit) {
    case 'm':
      return value * 60 * 1000; // 분
    case 'h':
      return value * 60 * 60 * 1000; // 시간
    case 'd':
      return value * 24 * 60 * 60 * 1000; // 일
    default:
      return 24 * 60 * 60 * 1000; // 기본 24시간
  }
}
