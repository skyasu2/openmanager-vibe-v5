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
  id?: string;
  hostname?: string;
  environment?: string;
  role?: string;
  status?: ServerStatus;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
  response_time?: number;
  last_updated?: string;
  alerts?: any[];
}
