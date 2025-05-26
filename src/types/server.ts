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

export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'offline';
export type ServerEnvironment = 'onpremise' | 'kubernetes' | 'aws' | 'gcp' | 'azure' | 'idc' | 'vdi';
export type ServerRole = 'web' | 'database' | 'storage' | 'cache' | 'gateway' | 'api' | 'worker' | 'monitoring';

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

export interface ServerAlert {
  id: string;
  server_id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'service_down';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
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
  metric: keyof Pick<ServerMetrics, 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'response_time' | 'network_in' | 'network_out'>;
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