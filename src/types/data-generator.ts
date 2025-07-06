/**
 * 🎰 데이터 생성기 타입 정의 v3
 *
 * 각 모듈간 타입 일관성 보장을 위한 중앙 집중식 타입 정의
 */

// 환경 설정 인터페이스
export interface CustomEnvironmentConfig {
  serverArchitecture:
  | 'single'
  | 'master-slave'
  | 'load-balanced'
  | 'microservices';
  databaseType: 'single' | 'replica' | 'sharded' | 'distributed';
  networkTopology: 'simple' | 'dmz' | 'multi-cloud' | 'hybrid';
  specialWorkload: 'standard' | 'gpu' | 'storage' | 'container';
  scalingPolicy: 'manual' | 'auto' | 'predictive';
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
}

// 서버 인스턴스 인터페이스 (server.ts와 호환)
export interface ServerInstance {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'warning' | 'error' | 'maintenance' | 'healthy' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  lastCheck: string;
  type: // 🌐 웹서버
  | 'nginx'
  | 'apache'
  | 'iis'
  // 🚀 애플리케이션 서버
  | 'nodejs'
  | 'springboot'
  | 'django'
  | 'dotnet'
  | 'php'
  // 🗄️ 데이터베이스
  | 'mysql'
  | 'postgresql'
  | 'mongodb'
  | 'oracle'
  | 'mssql'
  // ⚙️ 인프라 서비스
  | 'redis'
  | 'rabbitmq'
  | 'elasticsearch'
  | 'jenkins'
  | 'prometheus'
  | 'kafka'
  // 🔄 하위 호환성 (기존 타입)
  | 'web'
  | 'api'
  | 'database'
  | 'cache'
  | 'queue'
  | 'cdn'
  | 'gpu'
  | 'storage'
  | string;
  environment: 'production' | 'staging' | 'development' | string;
  region: string;
  version: string;
  tags: string[];
  alerts: number;
  role?: 'primary' | 'replica' | 'worker' | 'standalone';
  location?: string;
  specs?: {
    cpu: { cores: number; model: string; architecture?: string };
    memory: { total: number; type: string; speed?: number };
    disk: { total: number; type: string; iops?: number };
    network: { bandwidth: number; latency?: number };
    gpu?: { count: number; model: string; memory: number };
  };
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  health?: {
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

// 서버 클러스터 인터페이스
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

// 애플리케이션 메트릭 인터페이스
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

// 시뮬레이션 설정 인터페이스
export interface SimulationConfig {
  baseLoad: number;
  peakHours: number[];
  incidents: {
    probability: number;
    duration: number;
  };
  scaling: {
    enabled: boolean;
    threshold: number;
    cooldown: number;
  };
}

// 기준선 데이터 포인트 인터페이스
export interface BaselineDataPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  metadata: {
    serverType: string;
    environment: string;
    timeOfDay: number;
  };
}

// 헬스 체크 결과 인터페이스
export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  score: number;
  issues: string[];
  lastCheck: string;
  components: {
    dataGeneration: boolean;
    monitoring: boolean;
    cache: boolean;
    redis: boolean;
  };
}

// 대시보드 요약 인터페이스
export interface DashboardSummary {
  totalServers: number;
  runningServers: number;
  totalClusters: number;
  totalApplications: number;
  averageHealth: number;
  totalCpu: number;
  totalMemory: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

// 모니터링 시스템 통신 데이터
export interface MonitoringPingData {
  timestamp: number;
  generatorStatus: 'active' | 'inactive' | 'error';
  serverCount: number;
  lastUpdate: number;
  healthScore: number;
}

// 데모 시나리오 타입
export type DemoScenario =
  | 'normal'
  | 'peak'
  | 'incident'
  | 'maintenance'
  | 'disaster';

// 네트워크 토폴로지 타입
export interface NetworkNode {
  id: string;
  name: string;
  type:
  | 'server'
  | 'switch'
  | 'router'
  | 'firewall'
  | 'load-balancer'
  | 'database'
  | 'cache'
  | 'proxy'
  | 'loadbalancer';
  location: string;
  connections: string[];
}

export interface NetworkConnection {
  id: string;
  from: string;
  to: string;
  type: 'ethernet' | 'fiber' | 'wireless' | 'vpn';
  bandwidth: number;
  latency: number;
  status: 'active' | 'inactive' | 'congested';
}
