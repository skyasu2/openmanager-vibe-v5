export interface ScenarioPoint {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number; // ms
  errorRate?: number; // percentage
}

export type ServerType =
  | 'web'
  | 'api'
  | 'database'
  | 'cache'
  | 'storage'
  | 'log'
  | 'monitoring';

export type ServerStatus = 'normal' | 'warning' | 'critical';

export interface Server {
  id: string;
  name: string;
  type: ServerType;
  description: string;
}

export interface ScenarioPhase {
  name: string;
  durationHours: number;
  serverMetrics: {
    serverId: string;
    metrics: {
      cpu: number[]; // [시작값, 종료값]
      memory: number[];
      disk: number[];
      network: number[];
      responseTime?: number[];
      errorRate?: number[];
    };
    curveType: 'linear' | 'exponential' | 'spike'; // 변화 패턴
  }[];
}

export interface ScenarioTimeline {
  id: string;
  name: string;
  timeRange: [number, number];
  phases: ScenarioPhase[];
}

export interface ServerMetricsSnapshot {
  timestamp: Date;
  servers: Array<{
    id: string;
    name: string;
    type: ServerType;
    metrics: ScenarioPoint;
    status: ServerStatus;
  }>;
}
