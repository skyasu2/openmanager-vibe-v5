export interface Service {
  type: string;
  name: string;
  status: 'active' | 'inactive' | 'failed';
}

/**
 * Server Metrics Type Definitions
 */

// ==========================================
// 서버 데이터 구조
// ==========================================

export interface RawServerData {
  // ===== Core Identity (Required) =====
  id: string;
  name: string;
  hostname: string;
  type: string;

  // ===== Status (Required) =====
  status:
    | 'online'
    | 'warning'
    | 'critical'
    | 'running'
    | 'error'
    | 'stopped'
    | 'maintenance'
    | 'unknown';

  // ===== Core Metrics (Required) =====
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;

  // ===== Environment (Optional) =====
  environment?: string;
  location?: string;
  region?: string;
  provider?: string;

  // ===== Hardware Specs (Optional) =====
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };

  // ===== Services (Optional) =====
  service?: string;
  services?: Service[];

  // ===== Additional Metadata (Optional) =====
  role?: string;
  ip?: string;
  os?: string;
  processes?: number;
  connections?: number;
  responseTime?: number;
  alerts?: number;
  lastUpdate?: string | number | Date;

  // ===== Events & Trends (Optional) =====
  events?: string[];
  trend?: 'stable' | 'increasing' | 'decreasing';
  networkStatus?: string;
}

export interface ServerMetrics {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number;
  uptime: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

export interface HourlyServerData {
  servers: Record<string, RawServerData>;
  scenario?: string;
  summary?: {
    total: number;
    online: number;
    warning: number;
    critical: number;
  };
}

// ==========================================
// 이벤트 및 시나리오
// ==========================================

export interface ServerEventResult {
  hasEvent: boolean;
  impact: number;
  type: string;
  description?: string;
}

export interface ServerTypeProfile {
  type: string;
  normalRanges: {
    cpu: [number, number];
    memory: [number, number];
    disk: [number, number];
    network: [number, number];
  };
  scenarios: {
    [key: string]: {
      name: string;
      probability: number;
      effects: {
        cpu?: number;
        memory?: number;
        disk?: number;
        network?: number;
      };
      status: 'online' | 'warning' | 'critical';
    };
  };
}

// ==========================================
// 배치 처리
// ==========================================

export interface BatchServerInfo {
  id: string;
  type: string;
  baseMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

export interface BatchMetricsResult {
  id: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  events: ServerEventResult;
}

// ==========================================
// 성능 및 캐싱
// ==========================================

export interface PerformanceStats {
  variationMode: 'realistic';
  cacheOptimization: 'disabled';
  responseTime: string;
  dataSource: string;
}

export interface FileCache {
  data: HourlyServerData;
  timestamp: number;
  hour: number;
}

// ==========================================
// 유틸리티 타입
// ==========================================

export type SortableKey = keyof Pick<
  ServerMetrics,
  'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'name'
>;

// ==========================================
// 타입 가드 및 검증 유틸리티
// ==========================================

export const ensureNumber = (
  value: number | undefined,
  fallback: number = 0
): number => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
};

// ==========================================
// Enhanced Server Metrics (for NLQ Agent)
// ==========================================

export interface EnhancedServerMetrics {
  id: string;
  name: string;
  hostname: string;
  status:
    | 'online'
    | 'offline'
    | 'warning'
    | 'critical'
    | 'maintenance'
    | 'unknown';
  cpu: number;
  cpu_usage: number;
  memory: number;
  memory_usage: number;
  disk: number;
  disk_usage: number;
  network: number;
  network_in: number;
  network_out: number;
  uptime: number;
  responseTime?: number; // Added optional
  last_updated: string;
  environment: string;
  role: string;
  type: string;
  ip?: string;
  os?: string;
  location?: string;
  provider?: string;
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string; // Added optional
  };
  lastUpdate?: string; // Added optional
  systemInfo?: any; // Added optional
  networkInfo?: any; // Added optional
  services?: Service[];
  alerts: any[];
}

/**
 * Convert RawServerData to EnhancedServerMetrics
 */
export function getServerMetrics(server: RawServerData): EnhancedServerMetrics {
  // Map status to strict union type
  let status: 'online' | 'offline' | 'warning' | 'critical' = 'offline';
  if (['online', 'warning', 'critical'].includes(server.status)) {
    status = server.status as 'online' | 'warning' | 'critical';
  }

  return {
    id: server.id,
    name: server.name,
    hostname: server.hostname,
    status,
    cpu: server.cpu,
    cpu_usage: server.cpu,
    memory: server.memory,
    memory_usage: server.memory,
    disk: server.disk,
    disk_usage: server.disk,
    network: server.network || 0,
    network_in: (server.network || 0) / 2, // Simplified estimate
    network_out: (server.network || 0) / 2, // Simplified estimate
    uptime: server.uptime,
    last_updated: new Date().toISOString(),
    environment: server.environment || 'production',
    role: server.role || 'app',
    type: server.type || server.role || 'app',
    ip: server.ip,
    os: server.os,
    location: server.location,
    provider: server.provider,
    specs: server.specs,
    services: server.services,
    alerts: [], // Default empty
  };
}
