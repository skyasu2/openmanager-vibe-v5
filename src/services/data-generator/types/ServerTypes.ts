/**
 * 🔧 서버 타입 정의
 */

// 커스텀 환경 설정 인터페이스
export interface CustomEnvironmentConfig {
  serverArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices';
  databaseType: 'single' | 'replica' | 'sharded' | 'distributed';
  networkTopology: 'simple' | 'dmz' | 'multi-cloud' | 'hybrid';
  specialWorkload: 'standard' | 'gpu' | 'storage' | 'vm';
  scalingPolicy: 'manual' | 'auto' | 'predictive';
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
}

// 확장된 서버 인터페이스
export interface ServerInstance {
  id: string;
  name: string;
  type:
    | 'web'
    | 'api'
    | 'database'
    | 'cache'
    | 'queue'
    | 'cdn'
    | 'gpu'
    | 'storage';
  role: 'primary' | 'replica' | 'worker' | 'standalone';
  location: string;
  status: 'running' | 'stopped' | 'warning' | 'error' | 'maintenance';
  environment: 'production' | 'staging' | 'development';
  specs: {
    cpu: { cores: number; model: string; architecture?: string };
    memory: { total: number; type: string; speed?: number };
    disk: { total: number; type: string; iops?: number };
    network: { bandwidth: number; latency?: number };
    gpu?: { count: number; model: string; memory: number };
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
    requests: number;
    errors: number;
    uptime: number;
    // 특화 메트릭
    customMetrics?: {
      replication_lag?: number;
      connection_pool?: number;
      cache_hit_ratio?: number;
      gpu_utilization?: number;
      storage_iops?: number;
      container_count?: number;
    };
  };
  health: {
    score: number;
    issues: string[];
    lastCheck: string;
  };
  security?: {
    level: 'basic' | 'enhanced' | 'enterprise';
    lastSecurityScan: string;
    vulnerabilities: number;
    patchLevel: string;
  };
}

export interface ServerCluster {
  id: string;
  name: string;
  servers: ServerInstance[];
  loadBalancer: {
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
    activeConnections: number;
    totalRequests: number;
  };
  scaling: {
    current: number;
    min: number;
    max: number;
    target: number;
    policy: 'cpu' | 'memory' | 'requests';
  };
}

export interface ApplicationMetrics {
  name: string;
  version: string;
  deployments: {
    production: { servers: number; health: number };
    staging: { servers: number; health: number };
    development: { servers: number; health: number };
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
  resources: {
    totalCpu: number;
    totalMemory: number;
    totalDisk: number;
    cost: number;
  };
}

export type ServerType = ServerInstance['type'];
export type ServerRole = ServerInstance['role'];
export type ServerSpecs = ServerInstance['specs'];
