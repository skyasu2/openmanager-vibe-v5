/**
 * 🎯 Data Generator Types
 * 
 * 실제 서버 데이터 생성기의 모든 타입 정의
 * - 서버 인스턴스 및 클러스터 타입
 * - 메트릭 및 성능 데이터 타입
 * - 환경 설정 및 플러그인 타입
 * - 상태 추적 및 패턴 분석 타입
 */

// ===== 기본 서버 타입 =====
export interface ServerInstance {
    id: string;
    name: string;
    type: ServerType;
    status: ServerStatus;
    location: string;
    cluster?: string;
    ip: string;
    port: number;
    uptime: number;
    lastUpdate: number;
    metrics: ServerMetrics;
    services: ServiceInfo[];
    configuration: ServerConfiguration;
    alerts: Alert[];
}

export interface ServerCluster {
    id: string;
    name: string;
    type: ClusterType;
    status: ClusterStatus;
    servers: string[];
    loadBalancer: LoadBalancerConfig;
    autoscaling: AutoscalingConfig;
    healthcheck: HealthcheckConfig;
    createdAt: number;
    lastUpdate: number;
}

export interface ApplicationMetrics {
    name: string;
    version: string;
    status: ApplicationStatus;
    instances: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
    deployments: DeploymentInfo[];
    dependencies: DependencyInfo[];
    lastUpdate: number;
}

// ===== 메트릭 데이터 타입 =====
export interface ServerMetrics {
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    disk: DiskMetrics;
    network: NetworkMetrics;
    timestamp: number;
}

export interface CPUMetrics {
    usage: number;
    cores: number;
    temperature: number;
    frequency: number;
    processes: ProcessInfo[];
    load: LoadInfo;
}

export interface MemoryMetrics {
    total: number;
    used: number;
    free: number;
    cached: number;
    buffers: number;
    swap: SwapInfo;
}

export interface DiskMetrics {
    total: number;
    used: number;
    free: number;
    readOps: number;
    writeOps: number;
    readBytes: number;
    writeBytes: number;
    partitions: PartitionInfo[];
}

export interface NetworkMetrics {
    interfaces: NetworkInterface[];
    totalRxBytes: number;
    totalTxBytes: number;
    totalPackets: number;
    connections: ConnectionInfo[];
}

// ===== 상세 정보 타입 =====
export interface ServiceInfo {
    name: string;
    port: number;
    status: ServiceStatus;
    protocol: 'http' | 'https' | 'tcp' | 'udp';
    version: string;
    healthcheck: string;
    dependencies: string[];
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    priority: number;
}

export interface LoadInfo {
    oneMinute: number;
    fiveMinute: number;
    fifteenMinute: number;
}

export interface SwapInfo {
    total: number;
    used: number;
    free: number;
}

export interface PartitionInfo {
    device: string;
    mountpoint: string;
    fstype: string;
    total: number;
    used: number;
    free: number;
}

export interface NetworkInterface {
    name: string;
    rxBytes: number;
    txBytes: number;
    rxPackets: number;
    txPackets: number;
    errors: number;
    drops: number;
}

export interface ConnectionInfo {
    localAddress: string;
    localPort: number;
    remoteAddress: string;
    remotePort: number;
    state: ConnectionState;
    protocol: 'tcp' | 'udp';
}

// ===== 설정 타입 =====
export interface ServerConfiguration {
    maxConnections: number;
    timeout: number;
    retryAttempts: number;
    logLevel: LogLevel;
    features: ConfigFeature[];
    environment: EnvironmentType;
}

export interface LoadBalancerConfig {
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted';
    healthcheck: HealthcheckConfig;
    sticky: boolean;
    timeout: number;
}

export interface AutoscalingConfig {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
    targetMemory: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
}

export interface HealthcheckConfig {
    enabled: boolean;
    path: string;
    interval: number;
    timeout: number;
    retries: number;
    successCodes: number[];
}

// ===== 알림 및 이벤트 타입 =====
export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    source: string;
    acknowledged: boolean;
    resolvedAt?: number;
    metadata: Record<string, any>;
}

export interface DeploymentInfo {
    version: string;
    deployedAt: number;
    status: DeploymentStatus;
    artifacts: string[];
    rollbackVersion?: string;
}

export interface DependencyInfo {
    name: string;
    version: string;
    type: DependencyType;
    status: DependencyStatus;
    lastChecked: number;
}

// ===== 고급 기능 타입 =====
export interface NetworkNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    status: NodeStatus;
    metadata: Record<string, any>;
}

export interface NetworkConnection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    bandwidth: number;
    latency: number;
    status: ConnectionStatus;
}

export interface BaselineDataPoint {
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    metadata: Record<string, any>;
}

export interface DemoScenarioConfig {
    name: string;
    description: string;
    duration: number;
    effects: ScenarioEffect[];
    triggers: ScenarioTrigger[];
}

export interface ScenarioEffect {
    target: EffectTarget;
    type: EffectType;
    magnitude: number;
    duration: number;
}

export interface ScenarioTrigger {
    condition: TriggerCondition;
    action: TriggerAction;
    delay: number;
}

// ===== 환경 설정 타입 =====
export interface CustomEnvironmentConfig {
    mode: EnvironmentMode;
    serverArchitecture: ServerArchitecture;
    performanceProfile: PerformanceProfile;
    features: EnvironmentFeature[];
    limits: ResourceLimits;
    optimizations: OptimizationConfig;
}

export interface ResourceLimits {
    maxServers: number;
    maxClusters: number;
    maxApplications: number;
    memoryLimit: number;
    cpuLimit: number;
}

export interface OptimizationConfig {
    batchSize: number;
    updateInterval: number;
    cacheSize: number;
    compressionEnabled: boolean;
    lazyLoading: boolean;
}

// ===== 실시간 처리 타입 =====
export interface RealtimeDataEvent {
    id: string;
    type: EventType;
    serverId: string;
    timestamp: number;
    data: Record<string, any>;
    metadata: EventMetadata;
}

export interface EventMetadata {
    source: string;
    priority: EventPriority;
    tags: string[];
    correlationId?: string;
}

export interface DataGenerationJob {
    id: string;
    type: JobType;
    status: JobStatus;
    progress: number;
    startedAt: number;
    estimatedDuration: number;
    result?: any;
    error?: string;
}

// ===== 상태 추적 타입 =====
export interface StateSnapshot {
    timestamp: number;
    servers: Record<string, ServerState>;
    clusters: Record<string, ClusterStatus>;
    applications: Record<string, ApplicationStatus>;
    globalMetrics: GlobalMetrics;
}

export interface ServerState {
    id: string;
    metrics: ServerMetrics;
    status: ServerStatus;
    trends: StateTrend[];
    patterns: StatePattern[];
}

export interface StateTrend {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    duration: number;
}

export interface StatePattern {
    type: PatternType;
    confidence: number;
    startTime: number;
    endTime?: number;
    metadata: Record<string, any>;
}

export interface GlobalMetrics {
    totalServers: number;
    activeServers: number;
    totalCPU: number;
    totalMemory: number;
    totalDisk: number;
    totalNetwork: number;
    alertsCount: number;
}

// ===== 열거형 타입 =====
export type ServerType =
    | 'web'
    | 'api'
    | 'database'
    | 'cache'
    | 'worker'
    | 'monitor'
    | 'proxy'
    | 'storage';

export type ServerStatus =
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'maintenance'
    | 'offline';

export type ClusterType =
    | 'load-balanced'
    | 'high-availability'
    | 'microservices'
    | 'batch-processing';

export type ClusterStatus =
    | 'healthy'
    | 'degraded'
    | 'critical'
    | 'scaling';

export type ApplicationStatus =
    | 'running'
    | 'starting'
    | 'stopping'
    | 'crashed'
    | 'updating';

export type ServiceStatus =
    | 'active'
    | 'inactive'
    | 'failed'
    | 'disabled';

export type ConnectionState =
    | 'established'
    | 'listening'
    | 'time_wait'
    | 'close_wait';

export type AlertType =
    | 'performance'
    | 'security'
    | 'availability'
    | 'capacity'
    | 'custom';

export type AlertSeverity =
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'info';

export type DeploymentStatus =
    | 'pending'
    | 'in-progress'
    | 'completed'
    | 'failed'
    | 'rolled-back';

export type DependencyType =
    | 'service'
    | 'database'
    | 'cache'
    | 'external-api'
    | 'library';

export type DependencyStatus =
    | 'available'
    | 'unavailable'
    | 'degraded'
    | 'unknown';

export type NodeType =
    | 'server'
    | 'router'
    | 'switch'
    | 'firewall'
    | 'load-balancer';

export type NodeStatus =
    | 'online'
    | 'offline'
    | 'warning'
    | 'critical';

export type ConnectionType =
    | 'ethernet'
    | 'wireless'
    | 'vpn'
    | 'direct';

export type ConnectionStatus =
    | 'connected'
    | 'disconnected'
    | 'unstable'
    | 'congested';

export type DemoScenario =
    | 'normal'
    | 'high-load'
    | 'failure'
    | 'maintenance'
    | 'attack'
    | 'recovery';

export type EffectTarget =
    | 'cpu'
    | 'memory'
    | 'disk'
    | 'network'
    | 'service';

export type EffectType =
    | 'increase'
    | 'decrease'
    | 'spike'
    | 'oscillate'
    | 'flatline';

export type TriggerCondition =
    | 'time'
    | 'metric-threshold'
    | 'event'
    | 'manual';

export type TriggerAction =
    | 'start-scenario'
    | 'stop-scenario'
    | 'alert'
    | 'scale'
    | 'failover';

export type EnvironmentMode =
    | 'local'
    | 'premium'
    | 'basic'
    | 'minimal';

export type ServerArchitecture =
    | 'microservices'
    | 'monolith'
    | 'serverless'
    | 'hybrid';

export type PerformanceProfile =
    | 'high-performance'
    | 'balanced'
    | 'resource-efficient'
    | 'minimal';

export type EnvironmentFeature =
    | 'real-metrics'
    | 'ai-predictions'
    | 'auto-scaling'
    | 'monitoring'
    | 'alerting';

export type EventType =
    | 'metrics-update'
    | 'status-change'
    | 'alert-triggered'
    | 'deployment'
    | 'scaling-event';

export type EventPriority =
    | 'critical'
    | 'high'
    | 'normal'
    | 'low';

export type JobType =
    | 'data-generation'
    | 'baseline-update'
    | 'pattern-analysis'
    | 'health-check';

export type JobStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type PatternType =
    | 'daily-cycle'
    | 'weekly-cycle'
    | 'anomaly'
    | 'trend'
    | 'correlation';

export type LogLevel =
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace';

export type EnvironmentType =
    | 'development'
    | 'staging'
    | 'production'
    | 'testing';

export type ConfigFeature =
    | 'ssl'
    | 'compression'
    | 'caching'
    | 'monitoring'
    | 'backup';

// ===== 유틸리티 타입 =====
export interface DataGeneratorConfig {
    mode: EnvironmentMode;
    batchSize: number;
    updateInterval: number;
    features: {
        realMetrics: boolean;
        aiPredictions: boolean;
        autoScaling: boolean;
        monitoring: boolean;
        alerting: boolean;
    };
    limits: ResourceLimits;
    optimization: OptimizationConfig;
}

export interface PluginConfig {
    name: string;
    enabled: boolean;
    version: string;
    settings: Record<string, any>;
}

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

// ===== 상수 정의 =====
export const DATA_GENERATOR_CONSTANTS = {
    DEFAULT_BATCH_SIZE: 50,
    DEFAULT_UPDATE_INTERVAL: 10000, // 10초
    MAX_SERVERS: 1000,
    MAX_CLUSTERS: 100,
    MAX_APPLICATIONS: 500,
    CACHE_TTL: 300000, // 5분
    DEFAULT_TIMEOUT: 30000, // 30초
    METRICS_RETENTION: 86400000, // 24시간
    ALERT_RETENTION: 604800000, // 7일
    PATTERN_ANALYSIS_WINDOW: 3600000, // 1시간
    BASELINE_UPDATE_INTERVAL: 21600000, // 6시간
} as const;

export const SERVER_TYPE_CONFIGS = {
    web: {
        defaultPorts: [80, 443, 8080],
        services: ['nginx', 'apache', 'iis'],
        baseLoad: 0.3,
        scaling: { min: 1, max: 10 }
    },
    api: {
        defaultPorts: [3000, 8000, 9000],
        services: ['express', 'fastapi', 'spring'],
        baseLoad: 0.4,
        scaling: { min: 2, max: 20 }
    },
    database: {
        defaultPorts: [3306, 5432, 27017],
        services: ['mysql', 'postgresql', 'mongodb'],
        baseLoad: 0.5,
        scaling: { min: 1, max: 3 }
    },
    cache: {
        defaultPorts: [6379, 11211],
        services: ['redis', 'memcached'],
        baseLoad: 0.2,
        scaling: { min: 1, max: 5 }
    },
    worker: {
        defaultPorts: [8001, 8002, 8003],
        services: ['celery', 'sidekiq', 'rq'],
        baseLoad: 0.6,
        scaling: { min: 2, max: 50 }
    },
    monitor: {
        defaultPorts: [9090, 3001, 8080],
        services: ['prometheus', 'grafana', 'datadog'],
        baseLoad: 0.1,
        scaling: { min: 1, max: 3 }
    },
    proxy: {
        defaultPorts: [80, 443, 8080],
        services: ['nginx', 'haproxy', 'traefik'],
        baseLoad: 0.2,
        scaling: { min: 1, max: 5 }
    },
    storage: {
        defaultPorts: [2049, 445, 21],
        services: ['nfs', 'smb', 'ftp'],
        baseLoad: 0.3,
        scaling: { min: 1, max: 5 }
    }
} as const;