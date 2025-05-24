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