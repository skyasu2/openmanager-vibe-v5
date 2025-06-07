import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../services/simulationEngine';
import { prometheusFormatter } from '../../../modules/data-generation/PrometheusMetricsFormatter';
import type { EnhancedServerMetrics } from '../../../types/server';

/**
 * 📊 서버 목록 조회 API - Enhanced & Prometheus Compatible
 * GET /api/servers
 * 개선된 시뮬레이션 엔진에서 서버 목록과 Prometheus 메트릭을 반환합니다
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'enhanced'; // enhanced | legacy | prometheus
    const environment = searchParams.get('environment');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const includeMetrics = searchParams.get('include_metrics') === 'true';
    const includePatterns = searchParams.get('include_patterns') === 'true';

    console.log(
      `📊 서버 목록 조회: format=${format}, filters={env:${environment}, role:${role}, status:${status}}`
    );

    // 1. 시뮬레이션 엔진 상태 확인
    const currentState = simulationEngine.getState();
    if (!currentState.isRunning) {
      console.log('⚠️ 시뮬레이션 엔진이 실행되지 않음. 시작 시도...');
      simulationEngine.start();
      // 엔진 초기화를 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. 서버 데이터 조회
    let servers: EnhancedServerMetrics[] = simulationEngine.getServers();
    console.log(`📊 총 ${servers.length}개 서버 조회됨`);

    // 3. 필터링 적용
    if (environment) {
      servers = servers.filter(s => s.environment === environment);
    }
    if (role) {
      servers = servers.filter(s => s.role === role);
    }
    if (status) {
      servers = servers.filter(s => s.status === status);
    }

    console.log(`🔍 필터링 후 ${servers.length}개 서버`);

    // 4. 응답 형식에 따른 처리
    if (format === 'prometheus') {
      // Prometheus 메트릭 형식
      let allMetrics: any[] = [];

      servers.forEach(server => {
        const serverMetrics = prometheusFormatter.formatServerMetrics(server);
        allMetrics = allMetrics.concat(serverMetrics);
      });

      // 시스템 요약 메트릭 추가
      const systemMetrics =
        prometheusFormatter.generateSystemSummaryMetrics(servers);
      allMetrics = allMetrics.concat(systemMetrics);

      const prometheusText =
        prometheusFormatter.formatToPrometheusText(allMetrics);

      return new NextResponse(prometheusText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'X-Total-Servers': servers.length.toString(),
          'X-Total-Metrics': allMetrics.length.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
        },
      });
    } else if (format === 'legacy') {
      // 기존 호환성을 위한 레거시 형식
      const legacyServers = servers.map(server => ({
        id: server.id,
        hostname: server.hostname,
        name: `OpenManager-${server.id}`,
        type: server.role,
        environment: server.environment,
        location: getLocationByEnvironment(server.environment),
        provider: getProviderByEnvironment(server.environment),
        status:
          server.status === 'normal'
            ? 'online'
            : server.status === 'warning'
              ? 'warning'
              : 'offline',
        cpu: Math.round(server.cpu_usage),
        memory: Math.round(server.memory_usage),
        disk: Math.round(server.disk_usage),
        uptime: formatUptime(server.uptime),
        lastUpdate: new Date(
          server.last_updated || server.timestamp || Date.now()
        ),
        alerts: server.alerts?.length || 0,
        services: generateServices(server.role),
        specs: {
          cpu_cores: generateSpecs(server.id).cpu_cores,
          memory_gb: generateSpecs(server.id).memory_gb,
          disk_gb: generateSpecs(server.id).disk_gb,
        },
        os: generateSpecs(server.id).os,
        ip: generateIP(server.id),
      }));

      return NextResponse.json({
        success: true,
        data: legacyServers,
        meta: {
          total: legacyServers.length,
          format: 'legacy',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      });
    } else {
      // Enhanced 형식 (기본)
      const enhancedResponse = servers.map(server => {
        const serverData: any = {
          // 기본 서버 정보
          server_info: {
            id: server.id,
            hostname: server.hostname,
            environment: server.environment,
            role: server.role,
            status: server.status,
            uptime: formatUptime(server.uptime),
            last_updated: server.last_updated,
          },

          // 현재 메트릭
          current_metrics: {
            cpu_usage: server.cpu_usage,
            memory_usage: server.memory_usage,
            disk_usage: server.disk_usage,
            network_in: server.network_in,
            network_out: server.network_out,
            response_time: server.response_time,
          },

          // 리소스 정보 (동적 생성)
          resources: generateSpecs(server.id),
          network: {
            ip: generateIP(server.id),
            hostname: server.hostname,
            interface: 'eth0',
          },

          // 알람 정보
          alerts: server.alerts || [],
        };

        // 패턴 정보 포함 (요청시)
        if (includePatterns && server.pattern_info) {
          serverData.pattern_info = server.pattern_info;
          serverData.correlation_metrics = server.correlation_metrics;
        }

        // Prometheus 메트릭 포함 (요청시)
        if (includeMetrics) {
          serverData.prometheus_metrics =
            prometheusFormatter.formatServerMetrics(server);
        }

        return serverData;
      });

      // 시뮬레이션 요약 정보
      const simulationSummary = simulationEngine.getSimulationSummary();

      const response = {
        meta: {
          request_info: {
            format,
            filters: { environment, role, status },
            include_metrics: includeMetrics,
            include_patterns: includePatterns,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
          servers_summary: {
            total_servers: servers.length,
            by_environment: groupBy(servers, 'environment'),
            by_role: groupBy(servers, 'role'),
            by_status: groupBy(servers, 'status'),
            active_patterns: servers.filter(
              s => s.pattern_info && getLoadMultiplier(s.pattern_info) > 1
            ).length,
          },
          simulation_info: simulationSummary,
        },
        data: enhancedResponse,
      };

      return NextResponse.json(response, {
        headers: {
          'X-Total-Servers': servers.length.toString(),
          'X-Simulation-Running': currentState.isRunning.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
        },
      });
    }
  } catch (error) {
    console.error('❌ 서버 목록 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server list retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : '서버 목록 조회 중 오류가 발생했습니다',
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
    kubernetes: 'Kubernetes Cluster',
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
    ],
    database: [
      { name: 'postgresql', port: 5432 },
      { name: 'redis', port: 6379 },
    ],
    api: [
      { name: 'api-server', port: 8080 },
      { name: 'auth-service', port: 8081 },
    ],
    cache: [
      { name: 'redis', port: 6379 },
      { name: 'memcached', port: 11211 },
    ],
    worker: [
      { name: 'worker-process', port: 9000 },
      { name: 'queue-manager', port: 9001 },
    ],
    gateway: [
      { name: 'nginx', port: 80 },
      { name: 'envoy', port: 8000 },
    ],
    storage: [
      { name: 'minio', port: 9000 },
      { name: 'nfs-server', port: 2049 },
    ],
    monitoring: [
      { name: 'prometheus', port: 9090 },
      { name: 'grafana', port: 3000 },
    ],
  };

  const services = serviceMap[role] || [
    { name: 'unknown-service', port: 8080 },
  ];
  return services.map(service => ({
    ...service,
    status: Math.random() > 0.1 ? ('running' as const) : ('stopped' as const),
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
 * 📊 배열을 특정 키로 그룹화
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce(
    (groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    },
    {} as Record<string, number>
  );
}

/**
 * 📈 로드 멀티플라이어 추출
 */
function getLoadMultiplier(patternInfo: any): number {
  return (
    patternInfo.time_multiplier * patternInfo.seasonal_multiplier +
    (patternInfo.burst_active ? 0.5 : 0)
  );
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
