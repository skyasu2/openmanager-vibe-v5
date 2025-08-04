// 🔄 중복 제거: common.ts의 타입들 재사용
import type { AlertSeverity } from './common';
import type {
  ServerHealth,
  ServerMetrics,
  ServerSpecs,
  ServerStatus,
} from './server-common';

// 다른 파일에서 사용할 수 있도록 재export
export type {
  AlertSeverity,
  ServerHealth,
  ServerMetrics,
  ServerSpecs,
  ServerStatus,
};

export interface ServerInstance {
  id: string;
  name: string;
  status: ServerStatus;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  lastCheck: string;
  type: string;
  environment: string;
  region: string;
  version: string;
  tags: string[];
  alerts: number;

  // 🔧 기본 속성들 (필수)
  location: string;
  lastUpdated: string;
  provider: string;

  // 🔧 확장된 속성들 - 누락된 속성 오류 해결
  health?: ServerHealth;

  specs?: ServerSpecs;

  requests?: {
    total: number;
    success: number;
    errors: number;
    averageTime: number;
  };

  errors?: {
    count: number;
    recent: string[];
    lastError?: string;
  };

  custom?: {
    updateInterval?: number;
    enableMockData?: boolean;
    [key: string]: unknown;
  };

  metrics?: ServerMetrics;
}

export interface Server {
  id: string;
  name: string;
  hostname?: string;
  status: 'online' | 'offline' | 'warning' | 'healthy' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network?: number; // 네트워크 사용률 추가
  uptime: string | number;
  location: string;
  alerts?: number | ServerAlert[];
  ip?: string;
  os?: string;
  type?: string;
  environment?: string;
  provider?: string;
  role?: string; // 서버 역할 추가
  lastSeen?: string; // 추가
  metrics?: {
    cpu: {
      usage: number;
      cores: number;
      temperature: number;
    };
    memory: {
      used: number;
      total: number;
      usage: number;
    };
    disk: {
      used: number;
      total: number;
      usage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      packetsIn: number;
      packetsOut: number;
    };
    timestamp: string;
    uptime: number;
  };
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string;
  };
  lastUpdate?: Date;
  services?: Service[];
  logs?: LogEntry[];
  networkInfo?: NetworkInfo;
  networkStatus?:
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'offline'
    | 'maintenance'; // 네트워크 상태를 ServerStatus와 통일
  systemInfo?: SystemInfo;
  health?: {
    score: number; // 0 ~ 100
    trend: number[]; // 최근 30개 점수
  };
  alertsSummary?: {
    total: number;
    critical: number;
    warning: number;
  };
}

export interface Service {
  name: string;
  status: 'running' | 'stopped';
  port: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface NetworkInfo {
  interface: string;
  receivedBytes: string;
  sentBytes: string;
  receivedErrors: number;
  sentErrors: number;
  status?: ServerStatus;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  uptime?: number;
  last_updated?: string;
  alerts?: ServerAlert[];
  processes?: ProcessInfo[];
}

export interface SystemInfo {
  os: string;
  uptime: string;
  processes: number;
  zombieProcesses: number;
  loadAverage: string;
  lastUpdate: string;
}

export type ServerEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'on-premise'
  | 'aws'
  | 'gcp'
  | 'azure';
export type ServerRole =
  | 'web'
  | 'app'
  | 'api'
  | 'database'
  | 'cache'
  | 'storage'
  | 'load-balancer'
  | 'backup';

export interface EnhancedServerMetrics {
  // 🔧 기본 ServerMetrics 속성들 (완전 포함)
  id: string;
  hostname: string;
  environment: ServerEnvironment;
  role: ServerRole;
  status: ServerStatus;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  responseTime: number;
  uptime: number;
  last_updated: string;
  alerts: ServerAlert[];

  // 🔧 추가된 Enhanced 속성들
  name: string;
  network_usage?: number;
  timestamp?: string;
  pattern_info?: unknown;
  correlation_metrics?: unknown;
  patternsEnabled?: boolean;
  currentLoad?: number;
  activeFailures?: number;

  // 🔧 호환성을 위한 추가 속성들
  network?: number; // network_in/network_out의 합계 또는 평균
  
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

export interface ServerAlert {
  id: string;
  server_id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'responseTime' | 'custom';
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  resolved: boolean;
  relatedServers?: string[];
  rootCause?: string;
}

export interface FailureScenario {
  id: string;
  name: string;
  servers: string[];
  steps: FailureStep[];
  probability: number;
}

export interface FailureStep {
  delay: number; // ms
  server_id: string;
  metric: keyof Pick<
    ServerMetrics,
    | 'cpu'
    | 'memory'
    | 'disk'
    | 'network'
  >;
  value: number;
  alert?: Omit<ServerAlert, 'id' | 'server_id' | 'timestamp'>;
}

export interface SimulationState {
  isRunning: boolean;
  startTime: number | null;
  servers: ServerMetrics[];
  activeScenarios: string[];
  dataCount: number;
  intervalId: NodeJS.Timeout | null;
}

export interface DataStorage {
  realtime_metrics: ServerMetrics[];
  daily_metrics: ServerMetrics[];
  last_cleanup: string;
}

export interface ServerTypeDefinition {
  type: ServerRole;
  tags: string[];
  characteristics: {
    cpuWeight: number;
    memoryWeight: number;
    diskWeight: number;
    networkWeight: number;
    responseTimeBase: number;
    stabilityFactor: number;
  };
  failureProne: string[];
  dependencies: ServerRole[];
}

export const SERVER_TYPE_DEFINITIONS: Record<ServerRole, ServerTypeDefinition> =
  {
    web: {
      type: 'web',
      tags: ['nginx', 'apache', 'frontend', 'http'],
      characteristics: {
        cpuWeight: 0.7,
        memoryWeight: 0.5,
        diskWeight: 0.3,
        networkWeight: 1.2,
        responseTimeBase: 120,
        stabilityFactor: 0.8,
      },
      failureProne: ['high_traffic', 'ssl_issues', 'frontend_errors'],
      dependencies: ['api', 'cache'],
    },
    app: {
      type: 'app',
      tags: ['node', 'nginx', 'java', 'dotnet', 'application', 'business-logic'],
      characteristics: {
        cpuWeight: 0.9,
        memoryWeight: 0.8,
        diskWeight: 0.5,
        networkWeight: 0.9,
        responseTimeBase: 150,
        stabilityFactor: 0.75,
      },
      failureProne: ['memory_leak', 'thread_pool_exhausted', 'gc_pressure'],
      dependencies: ['database', 'cache', 'api'],
    },
    api: {
      type: 'api',
      tags: ['node', 'nginx', 'express', 'fastapi', 'rest', 'graphql'],
      characteristics: {
        cpuWeight: 0.8,
        memoryWeight: 0.6,
        diskWeight: 0.4,
        networkWeight: 1.0,
        responseTimeBase: 200,
        stabilityFactor: 0.7,
      },
      failureProne: ['memory_leak', 'connection_timeout', 'rate_limit'],
      dependencies: ['database', 'cache'],
    },
    database: {
      type: 'database',
      tags: ['postgres', 'mysql', 'mongodb', 'read/write_heavy'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.9,
        diskWeight: 1.0,
        networkWeight: 0.8,
        responseTimeBase: 50,
        stabilityFactor: 0.9,
      },
      failureProne: ['disk_full', 'slow_queries', 'connection_pool_exhausted'],
      dependencies: ['storage'],
    },
    cache: {
      type: 'cache',
      tags: ['redis', 'memcached', 'in-memory'],
      characteristics: {
        cpuWeight: 0.4,
        memoryWeight: 1.2,
        diskWeight: 0.2,
        networkWeight: 1.1,
        responseTimeBase: 20,
        stabilityFactor: 0.8,
      },
      failureProne: ['memory_eviction', 'cache_miss_spike'],
      dependencies: [],
    },
    storage: {
      type: 'storage',
      tags: ['nfs', 'netapp', 'slow_iops', 'backup'],
      characteristics: {
        cpuWeight: 0.3,
        memoryWeight: 0.4,
        diskWeight: 1.2,
        networkWeight: 0.6,
        responseTimeBase: 500,
        stabilityFactor: 0.6,
      },
      failureProne: ['disk_full', 'io_bottleneck', 'hardware_failure'],
      dependencies: [],
    },
    'load-balancer': {
      type: 'load-balancer',
      tags: ['nginx', 'haproxy', 'traefik', 'ingress'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.4,
        diskWeight: 0.2,
        networkWeight: 1.3,
        responseTimeBase: 80,
        stabilityFactor: 0.8,
      },
      failureProne: ['backend_unavailable', 'ssl_certificate_expired'],
      dependencies: ['web', 'api'],
    },
    backup: {
      type: 'backup',
      tags: ['backup', 'archive', 'scheduled'],
      characteristics: {
        cpuWeight: 0.4,
        memoryWeight: 0.3,
        diskWeight: 1.1,
        networkWeight: 0.7,
        responseTimeBase: 1000,
        stabilityFactor: 0.9,
      },
      failureProne: ['backup_failure', 'storage_corruption'],
      dependencies: ['storage', 'database'],
    },
  };

export interface RealisticFailureScenario {
  id: string;
  name: string;
  description: string;
  triggerCondition: {
    serverType: ServerRole;
    metric: keyof ServerMetrics;
    threshold: number;
    operator: '>' | '<' | '=' | '>=' | '<=';
  };
  cascadeEffect: {
    targetServerType: ServerRole;
    delayMs: number;
    impact: {
      metric: keyof ServerMetrics;
      multiplier: number;
    };
    alertMessage: string;
    severity: AlertSeverity;
  }[];
  recoveryTimeMs: number;
  probability: number;
}

export const FAILURE_IMPACT_GRAPH: Record<ServerRole, ServerRole[]> = {
  app: ['database', 'cache', 'api'],
  api: ['database', 'cache'],
  web: ['api', 'load-balancer'],
  storage: ['database', 'backup'],
  database: ['api', 'backup', 'app'],
  cache: ['api', 'app'],
  'load-balancer': ['web'],
  backup: ['storage'],
};

export interface SystemOverview {
  total: number;
  online: number;
  warning: number;
  offline: number;
  avgCpu: number;
  avgMemory: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RealtimeServersResponse {
  servers: Server[];
  summary: {
    servers: SystemOverview;
  };
  pagination: PaginationInfo;
  success: boolean;
  data: Server[];
  timestamp: number;
  count: number;
}

export interface ProcessInfo {
  pid: number;
  name:
    | 'kernel_task'
    | 'System'
    | 'svchost.exe'
    | 'chrome.exe'
    | 'node' | 'nginx'
    | 'python'
    | 'java'
    | 'spindump'
    | 'WindowServer'
    | 'launchd';
  cpu: number;
  memory: number;
  user: 'root' | 'system' | 'NETWORK SERVICE' | 'admin' | 'guest';
}

export interface ServerMetadata {
  id: string;
  ip: string;
  name: string;
  location: string;
  os: string;
  type: string;
  isActive: boolean;
  processes: ProcessInfo[];
}

export interface MetricsHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network:
    | number
    | {
        bytesReceived: number;
        bytesSent: number;
      };
  responseTime?: number;
  connections?: number;
}

export interface TimeSeriesMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  processes?: ProcessInfo[];
}
