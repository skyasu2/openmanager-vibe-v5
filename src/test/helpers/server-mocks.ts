import type {
  Server,
  ServerInstance,
  ServerAlert,
  ServerMetrics,
  EnhancedServerMetrics,
  ServerEnvironment,
  ServerRole,
  NetworkInfo,
  ProcessInfo,
  MetricsHistory,
} from '@/types/server';
import type { AlertSeverity } from '@/types/common';

/**
 * 기본 Server Mock 생성
 */
export function createMockServer(overrides?: Partial<Server>): Server {
  const baseServer: Server = {
    id: 'server-001',
    name: 'Production Server 1',
    hostname: 'prod-server-01.example.com',
    status: 'online',
    cpu: 45.5,
    memory: 62.3,
    disk: 35.2,
    network: 128.5,
    uptime: 8640000, // 100 days in seconds
    location: 'US-East-1',
    ip: '192.168.1.100',
    os: 'Ubuntu 22.04 LTS',
    type: 'web',
    environment: 'production',
    provider: 'AWS',
    role: 'frontend',
    lastSeen: new Date().toISOString(),
    lastUpdate: new Date(),
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'node', status: 'running', port: 3000 },
    ],
    metrics: {
      cpu: {
        usage: 45.5,
        cores: 8,
        temperature: 65,
      },
      memory: {
        used: 12589,
        total: 20224,
        usage: 62.3,
      },
      disk: {
        used: 352,
        total: 1000,
        usage: 35.2,
      },
      network: {
        bytesIn: 1024000,
        bytesOut: 512000,
        packetsIn: 10000,
        packetsOut: 8000,
      },
      timestamp: new Date().toISOString(),
      uptime: 8640000,
    },
    specs: {
      cpu_cores: 8,
      memory_gb: 20,
      disk_gb: 1000,
      network_speed: '10Gbps',
    },
    health: {
      score: 92,
      trend: Array(30)
        .fill(0)
        .map(() => 85 + Math.random() * 15),
    },
    alertsSummary: {
      total: 3,
      critical: 0,
      warning: 3,
    },
  };

  return {
    ...baseServer,
    ...overrides,
  };
}

/**
 * 표준 Server Mock 생성 (테스트용 간편 함수)
 */
export function createStandardServerMock(overrides?: Partial<Server>): Server {
  return createMockServer({
    status: 'online',
    cpu: 45.5,
    memory: 62.3,
    disk: 35.2,
    ...overrides,
  });
}

/**
 * ServerInstance Mock 생성
 */
export function createMockServerInstance(
  overrides?: Partial<ServerInstance>
): ServerInstance {
  const baseInstance: ServerInstance = {
    id: 'instance-001',
    name: 'App Server Instance',
    status: 'healthy',
    cpu: 35.2,
    memory: 58.7,
    disk: 42.1,
    network: 95.3,
    uptime: 7200000,
    lastCheck: new Date().toISOString(),
    type: 'application',
    environment: 'production',
    region: 'us-east-1',
    version: 'v2.5.1',
    tags: ['production', 'critical', 'monitored'],
    alerts: 1,
    location: 'US-East-1',
    lastUpdated: new Date().toISOString(),
    provider: 'AWS',
    health: {
      score: 88,
      trend: Array(30)
        .fill(0)
        .map(() => 82 + Math.random() * 12),
      status: 'healthy',
      issues: [],
    },
    specs: {
      cpu_cores: 4,
      memory_gb: 16,
      disk_gb: 500,
      network_speed: '5Gbps',
    },
    requests: {
      total: 150000,
      success: 149850,
      errors: 150,
      averageTime: 125,
    },
    errors: {
      count: 150,
      recent: ['Connection timeout', 'Database query failed'],
      lastError: 'Connection timeout at 2024-01-20T10:30:00Z',
    },
    custom: {
      updateInterval: 30000,
      enableMockData: false,
    },
    metrics: {
      id: 'instance-001',
      hostname: 'app-instance-01',
      environment: 'production' as ServerEnvironment,
      role: 'app' as ServerRole,
      status: 'healthy',
      cpu_usage: 35.2,
      memory_usage: 58.7,
      disk_usage: 42.1,
      network_in: 50.2,
      network_out: 45.1,
      response_time: 125,
      uptime: 7200000,
      last_updated: new Date().toISOString(),
      alerts: [],
      // 호환성 필드
      cpu: 35.2,
      memory: 58.7,
      disk: 42.1,
      network: 95.3,
    },
  };

  return {
    ...baseInstance,
    ...overrides,
  };
}

/**
 * ServerMetrics Mock 생성
 */
export function createMockServerMetrics(
  overrides?: Partial<ServerMetrics>
): ServerMetrics {
  return {
    id: 'server-001',
    hostname: 'prod-server-01',
    environment: 'production' as ServerEnvironment,
    role: 'web' as ServerRole,
    status: 'healthy',
    cpu_usage: 45.5,
    memory_usage: 62.3,
    disk_usage: 35.2,
    network_in: 64.2,
    network_out: 64.3,
    response_time: 150,
    uptime: 8640000,
    last_updated: new Date().toISOString(),
    alerts: [],
    ...overrides,
  };
}

/**
 * EnhancedServerMetrics Mock 생성
 */
export function createMockEnhancedServerMetrics(
  overrides?: Partial<EnhancedServerMetrics>
): EnhancedServerMetrics {
  const baseMetrics = createMockServerMetrics();

  return {
    ...baseMetrics,
    name: 'Enhanced Production Server',
    network_usage: 128.5,
    timestamp: new Date().toISOString(),
    pattern_info: {
      detected_patterns: ['high_traffic', 'memory_spike'],
      confidence: 0.85,
    },
    correlation_metrics: {
      cpu_memory_correlation: 0.72,
      network_response_correlation: 0.89,
    },
    patternsEnabled: true,
    currentLoad: 65.5,
    activeFailures: 0,
    network: 128.5,
    ...overrides,
  };
}

/**
 * ServerAlert Mock 생성
 */
export function createMockServerAlert(
  overrides?: Partial<ServerAlert>
): ServerAlert {
  return {
    id: 'alert-001',
    server_id: 'server-001',
    type: 'cpu',
    message: 'CPU usage exceeded 80% threshold',
    severity: 'warning' as AlertSeverity,
    timestamp: new Date().toISOString(),
    resolved: false,
    relatedServers: ['server-002', 'server-003'],
    rootCause: 'High traffic load',
    ...overrides,
  };
}

/**
 * MetricsHistory Mock 생성
 */
export function createMockMetricsHistory(count: number = 10): MetricsHistory[] {
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - i * 60000).toISOString(), // 1분 간격
    cpu: 40 + Math.random() * 20,
    memory: 55 + Math.random() * 15,
    disk: 30 + Math.random() * 10,
    network: 100 + Math.random() * 50,
    responseTime: 100 + Math.random() * 100,
    connections: Math.floor(800 + Math.random() * 400),
  }));
}

/**
 * ProcessInfo Mock 생성
 */
export function createMockProcessInfo(
  overrides?: Partial<ProcessInfo>
): ProcessInfo {
  return {
    pid: 12345,
    name: 'node',
    cpu: 15.5,
    memory: 256,
    user: 'admin',
    ...overrides,
  };
}

/**
 * NetworkInfo Mock 생성
 */
export function createMockNetworkInfo(
  overrides?: Partial<NetworkInfo>
): NetworkInfo {
  return {
    interface: 'eth0',
    receivedBytes: '10.5 GB',
    sentBytes: '8.2 GB',
    receivedErrors: 0,
    sentErrors: 0,
    status: 'healthy',
    cpu_usage: 45.5,
    memory_usage: 62.3,
    disk_usage: 35.2,
    uptime: 8640000,
    last_updated: new Date().toISOString(),
    alerts: [],
    processes: [
      createMockProcessInfo({ name: 'nginx', cpu: 5.2 }),
      createMockProcessInfo({ name: 'node', cpu: 10.3 }),
    ],
    ...overrides,
  };
}

/**
 * Server 배열 생성 헬퍼
 */
export function createServerArray(
  count: number,
  createFn: (index: number) => Server = (index) =>
    createMockServer({
      id: `server-${(index + 1).toString().padStart(3, '0')}`,
      name: `server-${index + 1}`,
      hostname: `server-${index + 1}.example.com`,
      ip: `192.168.1.${100 + index}`,
    })
): Server[] {
  return Array.from({ length: count }, (_, index) => createFn(index));
}

/**
 * 다양한 상태의 Server 배열 생성
 */
export function createMixedStatusServerArray(config?: {
  online?: number;
  offline?: number;
  warning?: number;
  critical?: number;
}): Server[] {
  const { online = 5, offline = 1, warning = 2, critical = 1 } = config || {};

  const servers: Server[] = [];
  let index = 0;

  // Online servers
  for (let i = 0; i < online; i++) {
    servers.push(
      createMockServer({
        id: `server-${++index}`,
        name: `Online Server ${i + 1}`,
        status: 'online',
        cpu: 20 + Math.random() * 40,
        memory: 30 + Math.random() * 40,
        health: {
          score: 85 + Math.random() * 15,
          trend: Array(30)
            .fill(0)
            .map(() => 80 + Math.random() * 20),
        },
      })
    );
  }

  // Offline servers
  for (let i = 0; i < offline; i++) {
    servers.push(
      createMockServer({
        id: `server-${++index}`,
        name: `Offline Server ${i + 1}`,
        status: 'offline',
        cpu: 0,
        memory: 0,
        network: 0,
        health: {
          score: 0,
          trend: Array(30).fill(0),
        },
      })
    );
  }

  // Warning servers
  for (let i = 0; i < warning; i++) {
    servers.push(
      createMockServer({
        id: `server-${++index}`,
        name: `Warning Server ${i + 1}`,
        status: 'warning',
        cpu: 70 + Math.random() * 15,
        memory: 75 + Math.random() * 10,
        health: {
          score: 60 + Math.random() * 20,
          trend: Array(30)
            .fill(0)
            .map(() => 55 + Math.random() * 25),
        },
        alertsSummary: {
          total: 5,
          critical: 0,
          warning: 5,
        },
      })
    );
  }

  // Critical servers
  for (let i = 0; i < critical; i++) {
    servers.push(
      createMockServer({
        id: `server-${++index}`,
        name: `Critical Server ${i + 1}`,
        status: 'critical',
        cpu: 85 + Math.random() * 15,
        memory: 88 + Math.random() * 12,
        health: {
          score: 20 + Math.random() * 30,
          trend: Array(30)
            .fill(0)
            .map(() => 15 + Math.random() * 35),
        },
        alertsSummary: {
          total: 10,
          critical: 5,
          warning: 5,
        },
      })
    );
  }

  return servers;
}

/**
 * Mock 데이터 생성 유틸리티
 */
export const mockDataGenerators = {
  server: createMockServer,
  serverInstance: createMockServerInstance,
  serverMetrics: createMockServerMetrics,
  enhancedMetrics: createMockEnhancedServerMetrics,
  alert: createMockServerAlert,
  metricsHistory: createMockMetricsHistory,
  processInfo: createMockProcessInfo,
  networkInfo: createMockNetworkInfo,
  serverArray: createServerArray,
  mixedStatusServers: createMixedStatusServerArray,
};

/**
 * 테스트용 타입 가드
 */
export function isServer(obj: any): obj is Server {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.cpu === 'number'
  );
}

export function isServerInstance(obj: any): obj is ServerInstance {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.lastCheck === 'string' &&
    typeof obj.type === 'string' &&
    obj.health !== undefined
  );
}

export function isServerMetrics(obj: any): obj is ServerMetrics {
  return (
    obj &&
    typeof obj.hostname === 'string' &&
    typeof obj.cpu_usage === 'number' &&
    typeof obj.memory_usage === 'number' &&
    typeof obj.last_updated === 'string'
  );
}
