export type ServerStatus =
  | 'running'
  | 'stopped'
  | 'error'
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'offline'
  | 'maintenance'
  | 'online'
  | 'active'
  | 'inactive';

export interface ServerHealth {
  score: number;
  trend: number[];
  status: ServerStatus;
  issues?: string[];
  lastChecked?: string;
}

export interface ServerSpecs {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  network_speed?: string;
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp?: string;
  uptime?: number;
}
