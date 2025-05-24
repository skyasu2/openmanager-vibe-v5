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
  ip: string;
  os: string;
  services: ServiceInfo[];
  logs: LogEntry[];
}

export interface ServiceInfo {
  name: string;
  status: string;
  port: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
} 