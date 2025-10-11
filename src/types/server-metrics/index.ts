/**
 * 🛡️ Server Metrics Type Definitions
 * 
 * servers/all/route.ts에서 추출된 타입 정의들
 */

export interface RawServerData {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'online' | 'warning' | 'critical';
  events?: string[];
  trend?: 'stable' | 'increasing' | 'decreasing';
  type: string;
}

export interface ServerEventResult {
  hasEvent: boolean;
  impact: number;
  type: string;
  description?: string;
}

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

export interface PerformanceStats {
  responseTime: number;
  processedServers: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  timestamp: string;
}

export interface HourlyServerData {
  servers: Record<string, any>;
  scenario?: string;
}

export interface ServerTypeProfile {
  baseMetrics: {
    cpu: [number, number];
    memory: [number, number];
    disk: [number, number];
    network: [number, number];
  };
  scenarios: Record<string, {
    probability: number;
    effects: {
      cpu?: number;
      memory?: number;
      disk?: number;
      network?: number;
    };
    status?: 'warning' | 'critical';
    name?: string;
  }>;
}

export interface FileCache {
  data: HourlyServerData;
  timestamp: number;
  hash: string;
}