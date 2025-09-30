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
  specialWorkload: 'standard' | 'gpu' | 'storage' | 'vm';
  scalingPolicy: 'manual' | 'auto' | 'predictive';
  securityLevel: 'basic' | 'enhanced' | 'enterprise';

  // 🔧 EnvironmentConfigManager 호환성을 위한 추가 속성들
  mode?: 'development' | 'production' | 'gcp-real-data';
  enableMockData?: boolean;
  enableRealtime?: boolean;
  maxServers?: number;
  updateInterval?: number;
  performanceMode?:
    | 'high'
    | 'balanced'
    | 'eco'
    | 'minimal'
    | 'development'
    | 'production';
  cacheEnabled?: boolean;
  features?: {
    networkTopology?: boolean;
    demoScenarios?: boolean;
    baselineOptimization?: boolean;
    autoRotate?: boolean;
    [key: string]: unknown;
  };
}

// 서버 인스턴스 인터페이스 (server.ts와 완전 호환)
export interface ServerInstance {
  id: string;
  name: string;
  status:
    | 'running'
    | 'stopped'
    | 'error'
    | 'warning' // 🔧 수정: 'healthy' 제거 (타입 통합)
    | 'critical'
    | 'offline'
    | 'maintenance'
    | 'online'
    | 'active'
    | 'inactive';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  lastCheck: string;
  type: string;
  environment: string;
  region: string;
  version: string;
  tags: string[];
  alerts: number;

  // 🔧 기본 속성들 (필수) - server.ts와 호환
  location: string;
  lastUpdated: string;
  provider: string;

  // 🔧 확장된 속성들 - 누락된 속성 오류 해결
  health?: {
    score: number;
    trend: number[];
    status:
      | 'running'
      | 'stopped'
      | 'error'
      | 'warning' // 🔧 수정: 'healthy' 제거 (타입 통합)
      | 'critical'
      | 'offline'
      | 'maintenance'
      | 'online'
      | 'active'
      | 'inactive';
    issues?: string[];
    lastChecked?: string;
  };

  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string;
  };

  requests?: {
    total: number;
    success: number;
    errors: number;
    averageTime: number;
  };

  errors?: {
    count: number;
    recent: string[];
    lastError?: string;
  };

  custom?: {
    updateInterval?: number;
    enableMockData?: boolean;
    [key: string]: unknown;
  };

  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: number | { in: number; out: number };
    timestamp?: string;
    uptime?: number;

    // 🔧 korean-ai-engine 및 기타 모듈 호환성을 위한 추가 속성들
    requests?: number;
    errors?: number;
    customMetrics?: Record<string, any>;
  };

  // 🔧 ServerInstanceManager 호환성을 위한 추가 속성들
  security?: {
    level: string;
    lastSecurityScan: string;
    vulnerabilities: number;
    patchLevel: string;
  };

  // 추가 필드들 (선택적)
  role?: 'primary' | 'replica' | 'worker' | 'standalone';
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
