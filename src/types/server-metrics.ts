/**
 * 서버 메트릭 타입 정의
 *
 * GCP 관련 코드 제거 후 재정의
 */

export interface ServerMetric {
  timestamp: Date;
  serverId: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  status: 'online' | 'warning' | 'critical'; // 🔧 수정: 'healthy' → 'online' (타입 통합)
  responseTime: number;
  activeConnections: number;

  // 선택적 필드들 (레거시 호환성)
  systemMetrics?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  applicationMetrics?: {
    requestCount: number;
    errorRate: number;
    responseTime: number;
  };
}

export type ServerMetricData = Omit<ServerMetric, 'timestamp'> & {
  timestamp: string;
};

// ServerDataValidator에서 사용하는 타입들
export interface RawServerData {
  id: string;
  name: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  responseTime: number;
  activeConnections: number;
}

export interface BatchServerInfo {
  id?: string;
  type?: string;
  servers: RawServerData[];
  timestamp: string;
  totalCount: number;
  baseMetrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
    responseTime: number;
    activeConnections: number;
  };
}
