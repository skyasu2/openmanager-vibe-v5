import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
// server-details.schema에서 직접 import (올바른 구조를 위해)
import type {
  ServerHistory,
  ServerHistoryDataPoint,
  ServerService,
  ServerSpecs,
} from '@/schemas/server-schemas/server-details.schema';
import {
  metricsProvider,
  type ServerMetrics,
} from '@/services/metrics/MetricsProvider';
import debug from '@/utils/debug';

/**
 * 📊 Mock 시뮬레이션 개별 서버 정보 조회 API
 * GET /api/servers/[id]
 * 특정 서버의 상세 정보 및 히스토리를 반환합니다 (Mock 데이터 기반)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const startTime = Date.now();

    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const includeHistory = searchParams.get('history') === 'true';
      const range = searchParams.get('range') || '24h';
      const format = searchParams.get('format') || 'enhanced'; // enhanced | legacy | prometheus
      const includeMetrics = searchParams.get('include_metrics') === 'true';
      const includePatterns = searchParams.get('include_patterns') === 'true';

      debug.log(
        `📊 서버 [${id}] 정보 조회: history=${includeHistory}, range=${range}, format=${format}`
      );

      // MetricsProvider에서 서버 찾기 (ID 또는 hostname으로 검색)
      let metric = metricsProvider.getServerMetrics(id);

      // hostname으로도 검색 시도
      if (!metric) {
        const allMetrics = metricsProvider.getAllServerMetrics();
        metric =
          allMetrics.find((m) => m.hostname === id || m.serverId === id) ??
          null;
      }

      if (!metric) {
        const allMetrics = metricsProvider.getAllServerMetrics();
        const availableServers = allMetrics.slice(0, 10).map((m) => ({
          id: m.serverId,
          hostname: m.hostname ?? m.serverId,
        }));

        return NextResponse.json(
          {
            success: false,
            error: 'Server not found',
            message: `서버 '${id}'를 찾을 수 없습니다`,
            available_servers: availableServers,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      debug.log(
        `✅ 서버 [${id}] 발견: ${metric.hostname ?? metric.serverId} (${metric.environment ?? 'unknown'}/${metric.serverType})`
      );

      // MetricsProvider에서 가져온 specs 계산
      const specs = getSpecsFromMetric(metric);
      const ip = generateIP(metric.serverId);
      const uptimeSeconds =
        metric.bootTimeSeconds && metric.bootTimeSeconds > 0
          ? Math.floor(Date.now() / 1000 - metric.bootTimeSeconds)
          : 86400 + metric.minuteOfDay * 60;

      // 3. 응답 형식에 따른 처리
      if (format === 'prometheus') {
        // 🗑️ Prometheus 형식은 더 이상 지원하지 않음
        return NextResponse.json(
          {
            error: 'Prometheus format is no longer supported',
            message: 'Please use JSON format instead',
            server_id: metric.serverId,
          },
          { status: 410 } // Gone
        );
      } else if (format === 'legacy') {
        // 레거시 형식
        const legacyServer = {
          id: metric.serverId,
          hostname: metric.hostname ?? metric.serverId,
          name: `OpenManager-${metric.serverId}`,
          type: metric.serverType,
          environment: metric.environment ?? 'onpremise',
          location: getLocationByEnvironment(metric.environment ?? 'onpremise'),
          provider: getProviderByEnvironment(metric.environment ?? 'onpremise'),
          status: metric.status,
          cpu: Math.round(metric.cpu),
          memory: Math.round(metric.memory),
          disk: Math.round(metric.disk),
          uptime: formatUptime(uptimeSeconds),
          lastUpdate: new Date(metric.timestamp),
          alerts: 0,
          services: generateServices(metric.serverType),
          specs,
          os: specs.os,
          ip,
          metrics: {
            cpu: Math.round(metric.cpu),
            memory: Math.round(metric.memory),
            disk: Math.round(metric.disk),
            network_in: Math.round(metric.network * 0.6),
            network_out: Math.round(metric.network * 0.4),
            response_time: metric.responseTimeMs ?? 50,
          },
        };

        // 히스토리 데이터 생성 (요청시)
        let history = null;
        if (includeHistory) {
          history = generateServerHistory(metric, range);
        }

        return NextResponse.json(
          {
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
          },
          {
            headers: {
              // Legacy 형식도 30초 캐싱
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
              'CDN-Cache-Control': 'public, s-maxage=30',
              'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
            },
          }
        );
      } else {
        // Enhanced 형식 (기본)
        const enhancedResponse = {
          // 기본 서버 정보
          server_info: {
            id: metric.serverId,
            hostname: metric.hostname ?? metric.serverId,
            environment: metric.environment ?? 'unknown',
            role: metric.serverType,
            status: metric.status,
            uptime: formatUptime(uptimeSeconds),
            last_updated: metric.timestamp,
          },

          // 현재 메트릭 (Prometheus 데이터 기반)
          current_metrics: {
            cpu_usage: metric.cpu,
            memory_usage: metric.memory,
            disk_usage: metric.disk,
            network_in: metric.network * 0.6,
            network_out: metric.network * 0.4,
            response_time: metric.responseTimeMs ?? 50,
          },

          // 리소스 정보 (MetricsProvider nodeInfo 기반)
          resources: specs,
          network: {
            ip,
            hostname: metric.hostname ?? metric.serverId,
            interface: 'eth0',
          },

          // 알람 정보
          alerts: [],

          // 서비스 정보
          services: generateServices(metric.serverType),
        };

        // 패턴 정보 포함 (요청시)
        let patternInfo: unknown;
        let correlationMetrics: unknown;
        if (includePatterns) {
          patternInfo = null;
          correlationMetrics = null;
        }

        // 히스토리 데이터 (요청시)
        let history: ServerHistory | undefined;
        if (includeHistory) {
          history = generateServerHistory(metric, range);
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
            dataSource: 'hourly-scenarios',
            scenario: 'production',
          },
          data: {
            ...enhancedResponse,
            pattern_info: patternInfo,
            correlation_metrics: correlationMetrics,
            history,
          },
        };

        return NextResponse.json(response, {
          headers: {
            'X-Server-Id': metric.serverId,
            'X-Hostname': metric.hostname ?? metric.serverId,
            'X-Server-Status': metric.status,
            'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
            // 개별 서버 정보는 30초 캐싱
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'CDN-Cache-Control': 'public, s-maxage=30',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
          },
        });
      }
    } catch (error) {
      debug.error(`❌ 서버 [${(await params).id}] 정보 조회 실패:`, error);

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
);

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
function generateServices(role: string): ServerService[] {
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
  return services.map((service) => ({
    ...service,
    status: Math.random() > 0.05 ? ('running' as const) : ('stopped' as const),
  }));
}

/**
 * 🌐 서버 ID로 IP 생성 (MetricsProvider에 IP 없을 때 fallback)
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
 * 💻 MetricsProvider의 nodeInfo로 스펙 추출
 */
function getSpecsFromMetric(metric: ServerMetrics): ServerSpecs {
  const GiB = 1024 ** 3;

  const osLabel =
    metric.os && metric.osVersion
      ? `${metric.os.charAt(0).toUpperCase() + metric.os.slice(1)} ${metric.osVersion}`
      : 'Ubuntu 22.04 LTS';

  return {
    cpu_cores: metric.nodeInfo?.cpuCores ?? 4,
    memory_gb: metric.nodeInfo
      ? Math.round(metric.nodeInfo.memoryTotalBytes / GiB)
      : 16,
    disk_gb: metric.nodeInfo
      ? Math.round(metric.nodeInfo.diskTotalBytes / GiB)
      : 500,
    os: osLabel,
  };
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
 * 📈 서버 히스토리 생성 (MetricsProvider 데이터 기반)
 */
function generateServerHistory(
  metric: ServerMetrics,
  range: string
): ServerHistory {
  const timeRangeMs = parseTimeRange(range);
  const endTime = Date.now();
  const startTime = endTime - timeRangeMs;
  const intervalMs = timeRangeMs / 100; // 100개 데이터 포인트

  const data_points: ServerHistoryDataPoint[] = [];

  // 히스토리 데이터 포인트 생성
  for (let time = startTime; time <= endTime; time += intervalMs) {
    const timeOfDay = new Date(time).getHours();
    const variation = Math.sin((timeOfDay / 24) * 2 * Math.PI) * 0.3; // 일일 패턴

    const baseCpu = metric.cpu;
    const baseMemory = metric.memory;
    const baseDisk = metric.disk;
    const baseNetwork = metric.network;

    data_points.push({
      timestamp: new Date(time).toISOString(),
      metrics: {
        cpu_usage: Math.max(
          0,
          Math.min(100, baseCpu + variation * 20 + (Math.random() - 0.5) * 10)
        ),
        memory_usage: Math.max(
          0,
          Math.min(100, baseMemory + variation * 15 + (Math.random() - 0.5) * 8)
        ),
        disk_usage: Math.max(
          0,
          Math.min(100, baseDisk + (Math.random() - 0.5) * 2)
        ),
        network_in: Math.max(
          0,
          baseNetwork + variation * 50 + (Math.random() - 0.5) * 30
        ),
        network_out: Math.max(
          0,
          baseNetwork + variation * 40 + (Math.random() - 0.5) * 25
        ),
        response_time: Math.max(
          0,
          (metric.responseTimeMs ?? 50) +
            variation * 100 +
            (Math.random() - 0.5) * 50
        ),
      },
    });
  }

  // ServerHistory 스키마와 일치하는 구조 반환
  return {
    time_range: range,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    interval_ms: intervalMs,
    data_points,
  };
}

/**
 * ⏰ 시간 범위 파싱
 */
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1), 10);

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
