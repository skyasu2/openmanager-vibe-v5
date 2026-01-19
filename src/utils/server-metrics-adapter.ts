/**
 * 🔄 서버 메트릭 어댑터 유틸리티
 *
 * GCPServerMetrics와 ServerInstance 간의 타입 호환성 문제 해결
 * Render.com → GCP 마이그레이션 과정에서 발생한 타입 불일치 해결
 */

// Using mock system for server metrics
import type { ServerInstance, ServerStatus } from '@/types/server';

// Define GCPServerMetrics interface based on usage in the code
interface GCPServerMetrics {
  id: string;
  name: string;
  type: string;
  zone: string;
  projectId: string;
  status: string;
  metrics?: {
    cpu?: {
      usage: number;
      cores?: number;
    };
    memory?: {
      usage: number;
      total?: number;
      available?: number;
    };
    disk?: {
      usage: number;
      total?: number;
      io?: {
        read: number;
        write: number;
      };
    };
    network?: {
      rx: number;
      tx: number;
      connections?: number;
    };
  };
  timestamp: string;
  isErrorState?: boolean;
  errorMessage?: string;
}

/**
 * GCP 서버 상태를 표준 서버 상태로 변환
 */
function convertGCPStatusToServerStatus(gcpStatus: string): ServerStatus {
  switch (gcpStatus) {
    case 'healthy':
    case 'running': // 🔧 추가: GCP 'running' 상태 지원
      return 'online'; // 🔧 수정: 'running' → 'online' (타입 통합)
    case 'warning':
      return 'warning';
    case 'critical':
    case 'ERROR':
    case 'error': // 🔧 추가: 소문자 'error' 상태 지원
      return 'critical'; // 🔧 수정: 'error' → 'critical' (타입 통합)
    case 'stopped':
    case 'offline': // 🔧 추가: 'offline' 상태 지원
      return 'offline'; // 🔧 수정: 'stopped' → 'offline' (타입 통합)
    default:
      return 'unknown'; // 🔧 수정: 'stopped' → 'unknown' (알 수 없는 상태)
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
  gcpMetrics: GCPServerMetrics[]
): ServerInstance[] {
  if (!Array.isArray(gcpMetrics)) {
    throw new Error('GCP metrics must be an array');
  }

  return gcpMetrics.map((g: GCPServerMetrics): ServerInstance => {
    // 기본 속성들 매핑
    const baseInstance: ServerInstance = {
      id: g.id,
      name: g.name,
      status: convertGCPStatusToServerStatus(g.status),

      // 메트릭 데이터 평면화
      cpu: g.metrics?.cpu?.usage || 0,
      memory: g.metrics?.memory?.usage || 0,
      disk: g.metrics?.disk?.usage || 0,
      network:
        ((g.metrics?.network?.rx || 0) + (g.metrics?.network?.tx || 0)) / 2, // 평균값 사용

      // 기본 메타데이터
      uptime: 0, // GCP에서 제공하지 않는 경우 기본값
      lastCheck: g.timestamp,
      type: g.type,
      environment: convertGCPTypeToEnvironment(g.type),
      region: g.zone,
      version: '1.0.0', // 기본값
      tags: [`gcp`, `zone:${g.zone}`, `project:${g.projectId}`],
      alerts: g.isErrorState ? 1 : 0,

      // 필수 속성들
      location: g.zone,
      lastUpdated: g.timestamp,
      provider: 'gcp',

      // 확장된 메트릭 정보
      metrics: {
        cpu: g.metrics?.cpu?.usage || 0,
        memory: g.metrics?.memory?.usage || 0,
        disk: g.metrics?.disk?.usage || 0,
        network:
          ((g.metrics?.network?.rx || 0) + (g.metrics?.network?.tx || 0)) / 2,
        timestamp: g.timestamp,
        uptime: 0, // 기본값
      },

      // 서버 스펙 추정 (실제 GCP API에서 가져올 수 있으면 더 정확함)
      specs: {
        cpu_cores: g.metrics?.cpu?.cores || 1,
        memory_gb: Math.round(
          (g.metrics?.memory?.total || 0) / (1024 * 1024 * 1024)
        ),
        disk_gb: Math.round(
          (g.metrics?.disk?.total || 0) / (1024 * 1024 * 1024)
        ),
        network_speed: '1Gbps', // 기본값
      },

      // 추가 정보
      requests: {
        total: g.metrics?.network?.connections || 0,
        success: Math.round((g.metrics?.network?.connections || 0) * 0.95), // 95% 성공률 가정
        errors: Math.round((g.metrics?.network?.connections || 0) * 0.05),
        averageTime: g.status === 'online' ? 120 : 500, // 상태에 따른 응답시간 추정
      },

      // 에러 정보
      errors: g.isErrorState
        ? {
            count: 1,
            recent: [g.errorMessage || '알 수 없는 오류'],
            lastError: g.errorMessage,
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
  gcpMetric: GCPServerMetrics
): ServerInstance {
  const result = adaptGCPMetricsToServerInstances([gcpMetric])[0];
  if (!result) {
    throw new Error('Failed to adapt GCP metric to ServerInstance');
  }
  return result;
}

/**
 * 역방향 어댑터: ServerInstance를 GCPServerMetrics로 변환 (필요한 경우)
 */
export function adaptServerInstanceToGCPMetrics(
  serverInstance: ServerInstance
): GCPServerMetrics {
  return {
    id: serverInstance.id,
    name: serverInstance.name,
    type: serverInstance.type || 'compute-engine',
    zone: serverInstance.region,
    projectId: 'default-project', // 기본값
    status:
      serverInstance.status === 'online' // 🔧 수정: 'running' → 'online' (타입 통합)
        ? 'online' // 🔧 수정: 'healthy' → 'online' (타입 통합)
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
    isErrorState: serverInstance.status === 'critical', // 🔧 수정: 'error' → 'critical' (타입 통합)
    errorMessage: serverInstance.errors?.lastError,
  };
}
