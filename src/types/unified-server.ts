/**
 * 통합 서버 타입 정의
 * 모든 서버 관련 인터페이스를 이 파일에서 통합 관리
 */

import type { ServerMetrics } from './server-metrics';
import type {
  Service,
  ProcessInfo,
  ServerRole,
  ServerSpecs,
  SystemInfo,
  NetworkInfo,
  AlertSeverity,
} from './server';

// Re-export ServerMetrics for convenience
export type { ServerMetrics };

// ... (skip Server interface)

// 확장된 서버 메트릭스 (AI 분석 포함)
export interface EnhancedServerMetrics extends ServerMetrics {
  // 기본 식별 정보
  id: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  environment?: string;
  role?: string;

  // 성능 정보

  responseTime?: number;

  // 서버 식별 정보 (UI에서 필요)
  // name is inherited from ServerMetrics as required
  ip?: string;

  // AI 분석 결과
  aiAnalysis?: {
    anomalyScore: number;
    predictedIssues: string[];
    recommendations: string[];
    confidence: number;
  };

  // 트렌드 예측
  trends?: {
    cpu: 'increasing' | 'decreasing' | 'stable';
    memory: 'increasing' | 'decreasing' | 'stable';
    disk: 'increasing' | 'decreasing' | 'stable';
    network: 'increasing' | 'decreasing' | 'stable';
  };

  // 🔧 추가된 Enhanced 속성들
  network_usage?: number;
  timestamp?: string;
  pattern_info?: unknown;
  correlation_metrics?: unknown;
  patternsEnabled?: boolean;
  currentLoad?: number;
  activeFailures?: number;

  // 🔧 호환성을 위한 추가 속성들
  // cpu, memory, disk, network are inherited from ServerMetrics as required

  // 🔧 추가 호환성 필드들
  connections?: number; // 연결 수
  services?: Service[]; // 서비스 목록
  processes?: ProcessInfo[]; // 프로세스 정보

  // 🔧 서버 기본 정보 (API route에서 사용)
  location?: string; // 서버 위치
  type?: ServerRole; // 🔧 수정: ServerRole 타입 사용 (role과 중복되지만 호환성)
  provider?: string; // 클라우드 제공자
  specs?: ServerSpecs; // 서버 사양
  lastUpdate?: string; // 마지막 업데이트 (ISO 문자열)
  systemInfo?: SystemInfo; // 시스템 정보
  networkInfo?: NetworkInfo; // 네트워크 정보

  // 🔧 메타데이터 정보 (API route에서 사용)
  metadata?: {
    serverType?: ServerRole;
    timeSlot?: number;
    hour?: number;
    minute?: number;
    cycleInfo?: {
      scenario?: {
        affectedServers: string[];
        name: string;
      };
      intensity: number;
    };
    scenarios?: Array<{
      type: ServerRole;
      severity: AlertSeverity;
      description: string;
    }>;
    baseline?: {
      cpu: number;
      memory: number;
      network: number;
    };
    timeInfo?: {
      normalized: number;
      actual: number;
      cycle24h: number;
      slot10min: number;
      hour: number;
      validUntil: number;
    };
    isAffectedByCurrentCycle?: boolean;
    [key: string]: unknown;
  };

  // 🔧 기존 Server 타입과의 호환성을 위한 metrics 속성
  metrics?: {
    cpu?: {
      usage: number;
      cores?: number;
      temperature?: number;
    };
    memory?: {
      used?: number;
      total?: number;
      usage: number;
    };
    disk?: {
      used?: number;
      total?: number;
      usage: number;
    };
    network?: {
      bytesIn?: number;
      bytesOut?: number;
      packetsIn?: number;
      packetsOut?: number;
      in?: number;
      out?: number;
    };
    timestamp?: string;
    uptime?: number;
  };
}

// ... (skip other interfaces)

// 유틸리티 함수들
export const calculateServerHealth = (metrics: ServerMetrics): number => {
  const cpuValue = metrics.cpu;
  const memoryValue = metrics.memory;
  const diskValue = metrics.disk;

  const cpuHealth = Math.max(0, 100 - cpuValue);
  const memoryHealth = Math.max(0, 100 - memoryValue);
  const diskHealth = Math.max(0, 100 - diskValue);

  return Math.round((cpuHealth + memoryHealth + diskHealth) / 3);
};

export const hasHighCpuUsage = (
  metrics: ServerMetrics,
  threshold = 80
): boolean => {
  return metrics.cpu > threshold;
};

export const hasHighMemoryUsage = (
  metrics: ServerMetrics,
  threshold = 85
): boolean => {
  return metrics.memory > threshold;
};

// 기본 서버 인터페이스
export interface Server {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  type: ServerType;
  location: string;
  lastSeen: string;
  metrics: ServerMetrics;
  alerts?: ServerAlert[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// 서버 타입 정의
export type ServerType =
  | 'web'
  | 'database'
  | 'cache'
  | 'api'
  | 'worker'
  | 'load-balancer'
  | 'monitoring'
  | 'storage';

// 서버 메트릭은 중앙화된 타입 시스템에서 가져옴 (상단에서 import함)

// 서버 알림
export interface ServerAlert {
  id: string;
  serverId: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
  metadata?: Record<string, unknown>;
}

// 서버 인스턴스 (데이터 생성용)
export interface ServerInstance {
  id: string;
  name: string;
  type: ServerType;
  status: 'online' | 'offline' | 'warning' | 'critical';
  location: string;
  cluster?: string;
  environment: 'production' | 'staging' | 'development';
  metrics: ServerMetrics;
  configuration: ServerConfiguration;
  createdAt: string;
  updatedAt: string;
}

// 서버 설정
export interface ServerConfiguration {
  os: string;
  version: string;
  architecture: string;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  services: string[];
  ports: number[];
  environment: Record<string, string>;
}

// 서버 클러스터
export interface ServerCluster {
  id: string;
  name: string;
  description: string;
  servers: ServerInstance[];
  loadBalancer?: {
    enabled: boolean;
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
  };
  autoScaling?: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
  };
}

// MCP 서버 설정
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
  retries?: number;
  enabled: boolean;
}

// 서버 상태 요약
export interface ServerStatusSummary {
  total: number;
  online: number;
  offline: number;
  warning: number;
  critical: number;
  lastUpdated: string;
}

// 서버 성능 메트릭 포인트
export interface ServerMetricPoint {
  timestamp: string;
  value: number;
  metric: string;
  serverId: string;
}

// 서버 의존성
export interface ServerDependency {
  id: string;
  name: string;
  type: 'database' | 'api' | 'service' | 'external';
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  errorRate?: number;
}

// 우선순위가 적용된 알림
export interface PrioritizedAlert extends ServerAlert {
  priority: number;
  dependencies: ServerDependency[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  estimatedResolutionTime?: number;
}

// 서버 상태 비교
export interface ServerStateComparison {
  serverId: string;
  before: ServerMetrics;
  after: ServerMetrics;
  changes: ServerChange[];
  timestamp: string;
}

// 서버 변경사항
export interface ServerChange {
  metric: string;
  oldValue: number;
  newValue: number;
  changePercent: number;
  significance: 'minor' | 'moderate' | 'major';
}

// 서버 타입 프로필
export interface ServerTypeProfile {
  type: ServerType;
  baselineMetrics: ServerMetrics;
  thresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    disk: { warning: number; critical: number };
    network: { warning: number; critical: number };
  };
  commonServices: string[];
  recommendedPorts: number[];
}

// 서버 베이스라인 데이터
export interface ServerBaselineData {
  serverId: string;
  metrics: ServerMetrics;
  timestamp: string;
  confidence: number;
  sampleSize: number;
}

// 통합 서버 메트릭스 (UnifiedMetricsManager용)
export interface UnifiedServerMetrics extends ServerMetrics {
  serverId: string;
  serverName: string;
  serverType: ServerType;
  location: string;
  environment: string;
  tags: string[];
  correlationId?: string;
  source: 'real' | 'simulated' | 'predicted';
}

// 클라이언트용 서버 메트릭스 (프론트엔드용)
export interface ClientServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
  lastUpdated: string;
}

// 클라이언트용 서버 (프론트엔드용)
export interface ClientServer {
  id: string;
  name: string;
  type: ServerType;
  status: 'online' | 'offline' | 'warning' | 'critical';
  location: string;
  metrics: ClientServerMetrics;
  alerts: number;
  uptime: string;
}

// 서버 메타데이터
export interface ServerMetadata {
  serverId: string;
  name: string;
  type: ServerType;
  location: string;
  environment: string;
  tags: string[];
  owner: string;
  description?: string;
  documentation?: string;
  contacts: {
    primary: string;
    secondary?: string;
    oncall?: string;
  };
}

// 타입 가드 함수들
export const isServerOnline = (server: Server): boolean => {
  return server.status === 'online';
};

export const isServerCritical = (server: Server): boolean => {
  return server.status === 'critical';
};

export const getServerStatusColor = (status: Server['status']): string => {
  switch (status) {
    case 'online':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'critical':
      return 'red';
    case 'offline':
      return 'gray';
    default:
      return 'gray';
  }
};

export const formatServerUptime = (uptime: number): string => {
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
};
