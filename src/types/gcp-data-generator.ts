// GCP Data Generator Types
export interface GCPDataGeneratorConfig {
  projectId: string;
  region: string;
  batchSize: number;
}

export interface GeneratedData {
  id: string;
  timestamp: string;
  data: unknown;
}

// ServerMetric export 추가
export interface ServerMetric {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  response_time: number;
  status: 'healthy' | 'warning' | 'critical';
}
