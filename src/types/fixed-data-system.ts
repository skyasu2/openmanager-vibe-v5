/**
 * 🎯 고정 데이터 시스템 타입 정의
 * 
 * 실시간 → 고정 데이터 + 타임스탬프 시스템을 위한 타입들
 * 5개 장애 시나리오 구현을 위한 인터페이스
 */

// ==============================================
// 🚨 장애 시나리오 타입 정의
// ==============================================

export type FailureScenario = 
  | 'cpu_overload'     // CPU 과부하 (80-95% 사용률)
  | 'memory_leak'      // 메모리 누수 (지속적 증가 패턴)
  | 'storage_full'     // 디스크 용량 부족 (90%+ 사용률)
  | 'network_issue'    // 네트워크 문제 (높은 지연시간, 패킷 손실)
  | 'database_slow';   // 데이터베이스 지연 (응답시간 증가)

export interface ScenarioConfig {
  id: FailureScenario;
  name: string;
  description: string;
  duration: number;        // 시나리오 지속 시간 (분)
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
  triggerConditions: {
    timeRange: string;     // '09:00-17:00' 업무시간 가중치
    probability: number;   // 발생 확률 (0-1)
    prerequisites?: string[]; // 선행 조건
  };
}

export interface ActiveScenario {
  scenario: FailureScenario;
  serverId: string;
  startTime: Date;
  endTime: Date;
  intensity: number;       // 시나리오 강도 (0-1)
  isRecovering: boolean;   // 복구 중 여부
}

// ==============================================
// 🗂️ 고정 서버 템플릿 타입
// ==============================================

export interface MetricRange {
  min: number;
  max: number;
  normal: number;
}

export interface BaselineMetrics {
  cpu: MetricRange;
  memory: MetricRange;
  disk: MetricRange;
  network: {
    latency: MetricRange;
    throughput: MetricRange;
  };
  response_time: MetricRange;
}

export interface FailurePattern {
  enabled: boolean;
  metrics: Partial<ServerMetrics>;
  progressionCurve: 'linear' | 'exponential' | 'step' | 'random';
  recoveryTime: number;    // 복구 시간 (분)
  cascadeRisk: number;     // 연쇄 장애 위험도 (0-1)
}

export interface FixedServerTemplate {
  id: string;
  name: string;
  type: 'web' | 'app' | 'database' | 'cache' | 'load_balancer';
  baselineMetrics: BaselineMetrics;
  failurePatterns: {
    [key in FailureScenario]: FailurePattern;
  };
  dependencies: string[];  // 의존성 서버 IDs
  location: string;
  environment: 'production' | 'staging' | 'development';
  priority: 'critical' | 'high' | 'medium' | 'low'; // 시스템 우선순위
}

// ==============================================
// 📊 런타임 메트릭 타입
// ==============================================

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    latency: number;
    throughput: number;
    in: number;
    out: number;
  };
  response_time: number;
  request_count: number;
  error_rate: number;
  uptime: number;
}

export interface ServerStatus {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  metrics: ServerMetrics;
  activeScenarios: FailureScenario[];
  lastUpdate: Date;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  source: FailureScenario | 'system';
  serverId: string;
}

// ==============================================
// 🔄 동적 타임스탬프 매니저 타입
// ==============================================

export interface TimestampManagerConfig {
  updateInterval: number;  // 업데이트 간격 (ms)
  variationRange: number;  // 변동 범위 (0-1)
  timeBasedWeights: {
    businessHours: number; // 업무시간 가중치
    nightTime: number;     // 야간 가중치
    weekend: number;       // 주말 가중치
  };
}

export interface ScenarioTransformation {
  serverId: string;
  scenario: FailureScenario;
  baseMetrics: ServerMetrics;
  transformedMetrics: ServerMetrics;
  intensity: number;
  timestamp: Date;
}

// ==============================================
// 🏛️ 시스템 인터페이스
// ==============================================

export interface FixedDataSystemConfig {
  enableScenarios: boolean;
  maxConcurrentScenarios: number;
  scenarioRotationInterval: number; // 시나리오 변경 간격 (분)
  cascadeFailureEnabled: boolean;
  redisPrefix: string;
  backupToSupabase: boolean;
}

export interface SystemState {
  servers: Map<string, ServerStatus>;
  activeScenarios: Map<string, ActiveScenario[]>;
  lastUpdate: Date;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  totalAlerts: number;
  config: FixedDataSystemConfig;
}

// ==============================================
// 🧪 테스트 지원 타입
// ==============================================

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  verify: () => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export interface MockDataSet {
  servers: FixedServerTemplate[];
  scenarios: ScenarioConfig[];
  expectedResults: {
    [key in FailureScenario]: {
      affectedServers: string[];
      expectedMetrics: Partial<ServerMetrics>;
      duration: number;
    };
  };
}

// ==============================================
// 🎛️ API 호환성 타입
// ==============================================

export interface DashboardApiResponse {
  success: boolean;
  data: {
    servers: Record<string, any>;
    stats: {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
      avgCpu: number;
      avgMemory: number;
      avgDisk: number;
    };
    lastUpdate: string;
    dataSource: string;
  };
  metadata?: {
    responseTime: number;
    cacheHit: boolean;
    redisKeys: number;
    serversLoaded: number;
    activeScenarios: number;
    systemHealth: string;
  };
}

// ==============================================
// 🔧 유틸리티 타입
// ==============================================

export type ServerType = FixedServerTemplate['type'];
export type MetricName = keyof ServerMetrics;
export type ScenarioSeverity = ScenarioConfig['severity'];
export type SystemEnvironment = FixedServerTemplate['environment'];

// 조건부 타입 - 시나리오별 영향을 받는 메트릭
export type AffectedMetrics<T extends FailureScenario> = 
  T extends 'cpu_overload' ? 'cpu' | 'response_time' :
  T extends 'memory_leak' ? 'memory' | 'response_time' :
  T extends 'storage_full' ? 'disk' | 'response_time' :
  T extends 'network_issue' ? 'network' | 'response_time' :
  T extends 'database_slow' ? 'response_time' | 'error_rate' :
  never;

// 유니온 타입 - 모든 가능한 상태
export type ServerState = 'initializing' | 'running' | 'failing' | 'recovering' | 'offline';
export type ScenarioState = 'inactive' | 'pending' | 'active' | 'recovering' | 'completed';

// ==============================================
// 📈 성능 모니터링 타입
// ==============================================

export interface PerformanceMetrics {
  redisResponseTime: number;
  scenarioProcessingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTime: number;
  errorRate: number;
}

export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  components: {
    redis: 'healthy' | 'degraded' | 'critical';
    scenarios: 'healthy' | 'degraded' | 'critical';
    api: 'healthy' | 'degraded' | 'critical';
  };
  performance: PerformanceMetrics;
  recommendations: string[];
}