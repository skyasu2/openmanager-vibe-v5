/**
 * 🔄 서버 메트릭 어댑터 유틸리티
 *
 * GCPServerMetrics와 ServerInstance 간의 타입 호환성 문제 해결
 * Render.com → GCP 마이그레이션 과정에서 발생한 타입 불일치 해결
 */

// Using mock system for server metrics
import type { ServerInstance, ServerStatus } from '@/types/server';

/**
 * GCP 서버 상태를 표준 서버 상태로 변환
 */
function convertGCPStatusToServerStatus(gcpStatus: string): ServerStatus {
  switch (gcpStatus) {
    case 'healthy':
      return 'running';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'error';
    case 'ERROR':
      return 'error';
    default:
      return 'stopped';
  }
}

/**
 * GCP 서버 타입을 표준 환경으로 변환
 */
function convertGCPTypeToEnvironment(gcpType: string): string {
  switch (gcpType) {
    case 'compute-engine':
      return 'gcp-compute';
    case 'gke-node':
      return 'gcp-kubernetes';
    case 'cloud-sql':
      return 'gcp-database';
    case 'cloud-run':
      return 'gcp-serverless';
    default:
      return 'gcp';
  }
}

/**
 * GCPServerMetrics를 ServerInstance로 변환하는 어댑터 함수
 *
 * @param gcpMetrics GCP 서버 메트릭 배열
 * @returns ServerInstance 배열
 */
export function adaptGCPMetricsToServerInstances(
  gcpMetrics: unknown // GCPServerMetrics removed[]
): ServerInstance[] {
  return gcpMetrics.map((gcp: unknown): ServerInstance => {
    // 기본 속성들 매핑
    const baseInstance: ServerInstance = {
      id: gcp.id,
      name: gcp.name,
      status: convertGCPStatusToServerStatus(gcp.status),

      // 메트릭 데이터 평면화
      cpu: gcp.metrics.cpu.usage,
      memory: gcp.metrics.memory.usage,
      disk: gcp.metrics.disk.usage,
      network: (gcp.metrics.network.rx + gcp.metrics.network.tx) / 2, // 평균값 사용

      // 기본 메타데이터
      uptime: 0, // GCP에서 제공하지 않는 경우 기본값
      lastCheck: gcp.timestamp,
      type: gcp.type,
      environment: convertGCPTypeToEnvironment(gcp.type),
      region: gcp.zone,
      version: '1.0.0', // 기본값
      tags: [`gcp`, `zone:${gcp.zone}`, `project:${gcp.projectId}`],
      alerts: gcp.isErrorState ? 1 : 0,

      // 필수 속성들
      location: gcp.zone,
      lastUpdated: gcp.timestamp,
      provider: 'gcp',

      // 확장된 메트릭 정보
      metrics: {
        cpu: gcp.metrics.cpu.usage,
        memory: gcp.metrics.memory.usage,
        disk: gcp.metrics.disk.usage,
        network: (gcp.metrics.network.rx + gcp.metrics.network.tx) / 2,
        timestamp: gcp.timestamp,
        uptime: 0, // 기본값
      },

      // 서버 스펙 추정 (실제 GCP API에서 가져올 수 있으면 더 정확함)
      specs: {
        cpu_cores: gcp.metrics.cpu.cores,
        memory_gb: Math.round(gcp.metrics.memory.total / (1024 * 1024 * 1024)),
        disk_gb: Math.round(gcp.metrics.disk.total / (1024 * 1024 * 1024)),
        network_speed: '1Gbps', // 기본값
      },

      // 추가 정보
      requests: {
        total: gcp.metrics.network.connections,
        success: Math.round(gcp.metrics.network.connections * 0.95), // 95% 성공률 가정
        errors: Math.round(gcp.metrics.network.connections * 0.05),
        averageTime: gcp.status === 'healthy' ? 120 : 500, // 상태에 따른 응답시간 추정
      },

      // 에러 정보
      errors: gcp.isErrorState
        ? {
            count: 1,
            recent: [gcp.errorMessage || '알 수 없는 오류'],
            lastError: gcp.errorMessage,
          }
        : {
            count: 0,
            recent: [],
          },
    };

    return baseInstance;
  });
}

/**
 * 단일 GCPServerMetrics를 ServerInstance로 변환
 */
export function adaptSingleGCPMetricToServerInstance(
  gcpMetric: unknown // GCPServerMetrics removed
): ServerInstance {
  return adaptGCPMetricsToServerInstances([gcpMetric])[0];
}

/**
 * 역방향 어댑터: ServerInstance를 GCPServerMetrics로 변환 (필요한 경우)
 */
export function adaptServerInstanceToGCPMetrics(
  serverInstance: ServerInstance
): unknown {
  // GCPServerMetrics removed
  return {
    id: serverInstance.id,
    name: serverInstance.name,
    type: (serverInstance.type as any) || 'compute-engine',
    zone: serverInstance.region,
    projectId: 'default-project', // 기본값
    status:
      serverInstance.status === 'running'
        ? 'healthy'
        : serverInstance.status === 'warning'
          ? 'warning'
          : 'critical',
    metrics: {
      cpu: {
        usage: serverInstance.cpu,
        cores: serverInstance.specs?.cpu_cores || 2,
      },
      memory: {
        usage: serverInstance.memory,
        total: 8589934592, // 8GB 기본값
        available: 4294967296, // 4GB 기본값
      },
      disk: {
        usage: serverInstance.disk,
        total: 107374182400, // 100GB 기본값
        io: {
          read: 0, // 기본값
          write: 0, // 기본값
        },
      },
      network: {
        rx: serverInstance.network || 0,
        tx: serverInstance.network || 0,
        connections: serverInstance.requests?.total || 0,
      },
    },
    timestamp: serverInstance.lastUpdated,
    isErrorState: serverInstance.status === 'error',
    errorMessage: serverInstance.errors?.lastError,
  };
}
