export interface Server {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  location: string;
  alerts: number;
  ip?: string;
  os?: string;
  lastUpdate: Date;
  services: Service[];
  logs?: LogEntry[];
  networkInfo?: NetworkInfo;
  systemInfo?: SystemInfo;
}

export interface Service {
  name: string;
  status: 'running' | 'stopped';
  port: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface NetworkInfo {
  interface: string;
  receivedBytes: string;
  sentBytes: string;
  receivedErrors: number;
  sentErrors: number;
}

export interface SystemInfo {
  os: string;
  uptime: string;
  processes: number;
  zombieProcesses: number;
  loadAverage: string;
  lastUpdate: string;
}

export type ServerStatus = 'normal' | 'warning' | 'critical' | 'maintenance';
export type ServerEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'on-premise'
  | 'aws'
  | 'kubernetes'
  | 'gcp'
  | 'azure';
export type ServerRole =
  | 'web'
  | 'api'
  | 'database'
  | 'cache'
  | 'storage'
  | 'k8s-control'
  | 'k8s-worker'
  | 'load-balancer'
  | 'backup';

export interface ServerMetrics {
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
  response_time: number;
  uptime: number;
  last_updated: string;
  alerts: ServerAlert[];
}

export interface EnhancedServerMetrics extends ServerMetrics {
  name: string;
  network_usage?: number;
  timestamp?: string;
  pattern_info?: any;
  correlation_metrics?: any;
  patternsEnabled?: boolean;
  currentLoad?: number;
  activeFailures?: number;
}

export interface ServerAlert {
  id: string;
  server_id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'custom';
  message: string;
  severity: 'info' | 'warning' | 'critical';
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
    | 'cpu_usage'
    | 'memory_usage'
    | 'disk_usage'
    | 'response_time'
    | 'network_in'
    | 'network_out'
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
    api: {
      type: 'api',
      tags: ['node', 'express', 'fastapi', 'rest', 'graphql'],
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
    'k8s-control': {
      type: 'k8s-control',
      tags: ['k8s', 'controller', 'etcd', 'api-server'],
      characteristics: {
        cpuWeight: 0.5,
        memoryWeight: 0.7,
        diskWeight: 0.6,
        networkWeight: 0.9,
        responseTimeBase: 100,
        stabilityFactor: 0.9,
      },
      failureProne: ['etcd_corruption', 'api_server_overload'],
      dependencies: [],
    },
    'k8s-worker': {
      type: 'k8s-worker',
      tags: ['kubelet', 'containerd', 'docker', 'pods'],
      characteristics: {
        cpuWeight: 0.9,
        memoryWeight: 0.8,
        diskWeight: 0.7,
        networkWeight: 1.0,
        responseTimeBase: 150,
        stabilityFactor: 0.7,
      },
      failureProne: ['pod_eviction', 'resource_exhaustion', 'node_not_ready'],
      dependencies: ['k8s-control'],
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
    severity: 'info' | 'warning' | 'critical';
  }[];
  recoveryTimeMs: number;
  probability: number;
}

export const FAILURE_IMPACT_GRAPH: Record<ServerRole, ServerRole[]> = {
  api: ['database', 'cache'],
  web: ['api', 'load-balancer'],
  'k8s-worker': ['k8s-control'],
  storage: ['database', 'backup'],
  'k8s-control': ['k8s-worker', 'api'],
  database: ['api', 'backup'],
  cache: ['api'],
  'load-balancer': ['web'],
  backup: ['storage'],
};
