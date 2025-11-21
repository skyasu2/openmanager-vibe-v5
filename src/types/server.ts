// 🔄 중복 제거: common.ts의 타입들 재사용
import type { AlertSeverity, ServiceStatus } from './common';
import type {
  ServerHealth,
  ServerMetrics,
  ServerSpecs,
  ServerStatus as CommonServerStatus,
} from './server-common';

// 🏗️ AI 교차검증 기반 새로운 타입 시스템 통합
import type { ServerStatus as EnumServerStatus } from '@/schemas';
import type {
  ServerEnvironment as EnumServerEnvironment,
  ServerRole as EnumServerRole,
} from './server-enums';
import {
  isValidServerStatus,
  isValidServerEnvironment,
  isValidServerRole,
  getDefaultServerStatus,
  getDefaultServerEnvironment,
  getDefaultServerRole,
} from './server-enums';

// 타입 충돌 방지를 위해 타입 이름 변경
export type {
  EnumServerStatus as ServerStatusEnum,
  EnumServerEnvironment as ServerEnvironmentEnum,
  EnumServerRole as ServerRoleEnum,
};

// 타입 가드와 기본값 함수들 re-export
export {
  isValidServerStatus,
  isValidServerEnvironment,
  isValidServerRole,
  getDefaultServerStatus,
  getDefaultServerEnvironment,
  getDefaultServerRole,
};

// 기존 타입들과의 호환성을 위해 재정의
export type ServerStatus = CommonServerStatus;

// 다른 파일에서 사용할 수 있도록 재export
export type { AlertSeverity, ServerHealth, ServerMetrics, ServerSpecs };

export interface ServerInstance {
  id: string;
  name: string;
  status: ServerStatus;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number | string;
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

  // 🔧 SafeServerCard 호환성을 위한 추가 속성들
  os?: string; // 운영체제 정보
  ip?: string; // IP 주소
  cpuHistory?: number[]; // CPU 사용률 히스토리
  memoryHistory?: number[]; // 메모리 사용률 히스토리
  services?: Service[]; // 서비스 목록
  responseTime?: number; // 응답 시간
  description?: string; // 서버 설명

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
  status: ServerStatus; // 🔧 수정: ServerStatus 타입으로 완전 통합 (maintenance, unknown 포함)
  cpu: number;
  memory: number;
  disk: number;
  network?: number; // 네트워크 사용률 추가
  responseTime?: number; // 응답 시간 (ms)
  uptime: string | number;
  location: string;
  alerts?: number | ServerAlert[];
  ip?: string;
  os?: string;
  type?: ServerRole; // 🔧 수정: ServerRole 타입 사용
  description?: string; // 서버 설명 추가
  environment?: ServerEnvironment; // 🔧 수정: ServerEnvironment 타입 사용
  provider?: string;
  role?: ServerRole; // 🔧 수정: ServerRole 타입 사용
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
  networkStatus?: ServerStatus; // 🔧 수정: ServerStatus 타입 사용
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
  status: ServiceStatus;
  port?: number; // optional로 변경
  environment?: ServerEnvironment; // 환경 정보 추가
  role?: ServerRole; // 서버 역할 정보 추가
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
  environment?: ServerEnvironment; // 환경 정보 추가
  role?: ServerRole; // 서버 역할 정보 추가
}

export interface SystemInfo {
  os: string;
  uptime: string;
  processes: number;
  zombieProcesses: number;
  loadAverage: string;
  lastUpdate: string;
  environment?: ServerEnvironment; // 환경 정보 추가
  role?: ServerRole; // 서버 역할 정보 추가
}

// ⚠️ DEPRECATED: 기존 타입들 - server-enums.ts 사용 권장
// 호환성을 위해 유지하되, 새 코드에서는 ServerEnvironmentEnum, ServerRoleEnum 사용
export type ServerEnvironment =
  | EnumServerEnvironment
  | 'on-premise'
  | 'aws'
  | 'gcp'
  | 'azure';
export type ServerRole = EnumServerRole | 'app' | 'fallback';

export interface EnhancedServerMetrics {
  // 🔧 기본 ServerMetrics 속성들 (완전 포함)
  id: string;
  hostname: string;
  environment: ServerEnvironment;
  role: ServerRole;
  status: ServerStatus;

  // 🔧 호환성 확장을 위한 추가 필드들 (AI 교차검증 결과 반영)
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
  cpu?: number; // cpu_usage 호환성
  memory?: number; // memory_usage 호환성
  disk?: number; // disk_usage 호환성

  // 🔧 추가 호환성 필드들
  ip?: string; // IP 주소
  os?: string; // 운영체제
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
  metric: keyof Pick<ServerMetrics, 'cpu' | 'memory' | 'disk' | 'network'>;
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
    monitoring: {
      type: 'monitoring',
      tags: ['prometheus', 'grafana', 'metrics', 'logging'],
      characteristics: {
        cpuWeight: 0.5,
        memoryWeight: 0.6,
        diskWeight: 0.8,
        networkWeight: 0.9,
        responseTimeBase: 300,
        stabilityFactor: 0.85,
      },
      failureProne: ['disk_space', 'network_issues'],
      dependencies: [],
    },
    security: {
      type: 'security',
      tags: ['firewall', 'auth', 'ssl', 'security'],
      characteristics: {
        cpuWeight: 0.3,
        memoryWeight: 0.4,
        diskWeight: 0.5,
        networkWeight: 1.1,
        responseTimeBase: 100,
        stabilityFactor: 0.9,
      },
      failureProne: ['cert_expiry', 'auth_failure'],
      dependencies: [],
    },
    queue: {
      type: 'queue',
      tags: ['redis', 'rabbitmq', 'queue', 'jobs'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.7,
        diskWeight: 0.4,
        networkWeight: 0.8,
        responseTimeBase: 50,
        stabilityFactor: 0.8,
      },
      failureProne: ['queue_overflow', 'worker_timeout'],
      dependencies: [],
    },
    app: {
      type: 'app',
      tags: ['application', 'service', 'microservice', 'app'],
      characteristics: {
        cpuWeight: 0.7,
        memoryWeight: 0.6,
        diskWeight: 0.5,
        networkWeight: 0.9,
        responseTimeBase: 150,
        stabilityFactor: 0.7,
      },
      failureProne: ['application_crash', 'memory_leak', 'timeout'],
      dependencies: ['api', 'database'],
    },
    fallback: {
      type: 'fallback',
      tags: ['backup', 'secondary', 'emergency', 'fallback'],
      characteristics: {
        cpuWeight: 0.8,
        memoryWeight: 0.7,
        diskWeight: 0.6,
        networkWeight: 1.0,
        responseTimeBase: 250,
        stabilityFactor: 0.9,
      },
      failureProne: ['backup_system_overload', 'fallback_activation'],
      dependencies: ['api', 'database'],
    },
    log: {
      type: 'log',
      tags: ['logging', 'elk', 'splunk', 'logs'],
      characteristics: {
        cpuWeight: 0.5,
        memoryWeight: 0.6,
        diskWeight: 1.1,
        networkWeight: 0.7,
        responseTimeBase: 200,
        stabilityFactor: 0.85,
      },
      failureProne: ['disk_full', 'log_rotation_failure', 'parsing_errors'],
      dependencies: ['storage'],
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
  web: ['api', 'load-balancer'],
  api: ['database', 'cache'],
  database: ['api', 'backup'],
  cache: ['api', 'web'],
  monitoring: ['security'],
  security: ['web', 'api'],
  backup: ['storage'],
  'load-balancer': ['web'],
  queue: ['api', 'database'],
  storage: ['database', 'backup'],
  app: ['api', 'database', 'queue'],
  fallback: ['api', 'database'],
  log: ['storage', 'monitoring'],
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
    | 'node'
    | 'nginx'
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

// 🔧 타입 가드 함수들
export function isServer(obj: unknown): obj is Server {
  if (typeof obj !== 'object' || obj === null) return false;

  const server = obj as Server;
  return (
    typeof server.id === 'string' &&
    typeof server.name === 'string' &&
    isValidServerStatus(server.status) &&
    typeof server.cpu === 'number' &&
    typeof server.memory === 'number' &&
    typeof server.disk === 'number' &&
    typeof server.uptime !== 'undefined'
  );
}

export function isValidAlertSeverity(
  severity: string
): severity is AlertSeverity {
  const validSeverities: AlertSeverity[] = ['info', 'warning', 'critical'];
  return (validSeverities as string[]).includes(severity);
}

export function isValidServiceStatus(status: string): status is ServiceStatus {
  const validStatuses: ServiceStatus[] = [
    'running',
    'stopped',
    'unknown',
    'error',
    'starting',
    'stopping',
  ];
  return (validStatuses as string[]).includes(status);
}

export function isEnhancedServerMetrics(
  obj: unknown
): obj is EnhancedServerMetrics {
  if (typeof obj !== 'object' || obj === null) return false;

  const server = obj as EnhancedServerMetrics;
  return (
    typeof server.id === 'string' &&
    typeof server.hostname === 'string' &&
    isValidServerEnvironment(server.environment) &&
    isValidServerRole(server.role) &&
    isValidServerStatus(server.status) &&
    typeof server.cpu_usage === 'number' &&
    typeof server.memory_usage === 'number' &&
    typeof server.disk_usage === 'number'
  );
}
