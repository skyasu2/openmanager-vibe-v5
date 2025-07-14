/**
 * 🌐 GCP 서버 데이터 생성기 타입 정의
 *
 * 기존 AI 엔진 호환성을 유지하면서 GCP 환경에 최적화된 타입들
 */

import { TimeSeriesMetrics } from '@/types/ai-agent-input-schema';

// TimeSeriesMetrics를 re-export
export type { TimeSeriesMetrics } from '@/types/ai-agent-input-schema';

// ===== 기본 데이터셋 구조 =====

export interface BaselineDataset {
  servers: ServerData[];
  scenarios: ScenarioConfig;
  generated_at: string;
  dataset_version: string;
}

export interface ServerData {
  id: string;
  name: string;
  type: string;
  status?: string; // 상태 정보 추가
  specs: ServerSpecs;
  baseline_metrics: BaselineMetrics;
  historical_patterns?: {
    daily_cycle: number[];
    weekly_cycle: number[];
    anomaly_patterns: Record<string, any>;
  };
}

export interface ServerSpecs {
  cpu: { cores: number; model: string };
  memory: { total: number; type: string };
  disk: { total: number; type: string };
  network: { bandwidth: number; type: string };
}

export interface BaselineMetrics {
  cpu: { usage: number; load1: number };
  memory: { used: number; available: number };
  disk: { utilization: number; io: { read: number; write: number } };
  network: { io: { rx: number; tx: number } };
}

export interface ScenarioConfig {
  normal: { probability: number; load_multiplier: number };
  warning: { probability: number; load_multiplier: number };
  critical: { probability: number; load_multiplier: number };
}

export interface ServerMetric {
  timestamp: Date;
  serverId: string;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  applicationMetrics: {
    requestCount: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface HistoricalDataPoint {
  date: string;
  servers: ServerData[];
  metrics: {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}

// API 응답 타입들
export interface GCPDataGeneratorResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
  timestamp?: string;
}

export interface SessionResponse extends GCPDataGeneratorResponse {
  sessionId: string;
  autoStopTime?: string;
}

export interface SessionStatusResponse extends GCPDataGeneratorResponse {
  sessionId: string;
  isActive: boolean;
  wasAutoFlushed: boolean;
}

export interface MetricsResponse
  extends GCPDataGeneratorResponse<ServerMetric[]> {
  count: number;
  scenario?: string;
}

export interface HistoricalResponse
  extends GCPDataGeneratorResponse<HistoricalDataPoint[]> {
  period: string;
  count: number;
}

// Hook 상태 타입
export interface GCPServerDataState {
  dataset: BaselineDataset | null;
  realtimeMetrics: ServerMetric[];
  historicalData: HistoricalDataPoint[];
  activeSession: string | null;
  isSessionActive: boolean;
  loading: boolean;
  error: string | null;
}

// 시나리오 타입
export type ScenarioType = 'normal' | 'warning' | 'critical';

// 액션 타입
export type GCPDataGeneratorAction =
  | 'start_session'
  | 'stop_session'
  | 'session_status'
  | 'generate_metrics'
  | 'scenario_metrics'
  | 'historical_pattern';

// API 요청 바디 타입
export interface GCPDataGeneratorRequest {
  action: GCPDataGeneratorAction;
  sessionId?: string;
  scenario?: ScenarioType;
  startDate?: string;
  endDate?: string;
}

// 서버 타입 정의
export type ServerType =
  | 'nginx'
  | 'apache'
  | 'nodejs'
  | 'springboot'
  | 'postgresql'
  | 'redis'
  | 'elasticsearch'
  | 'rabbitmq';

// 간격 타입
export type IntervalType = 'daily' | 'hourly';

// 무료 티어 제한 타입
export interface FreeTierLimits {
  cloudFunctions: {
    invocations: number;
    computeTime: number; // GB-seconds
  };
  firestore: {
    reads: number;
    writes: number;
    deletes: number;
  };
  cloudStorage: {
    operations: number;
    storage: number; // GB
  };
}

// 세션 정보 타입
export interface SessionInfo {
  sessionId: string;
  userId: string;
  status: 'active' | 'stopped' | 'paused';
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  serverCount: number;
  totalMetrics: number;
  metricsGenerated: number;
  configuration?: any; // 임시로 any 타입 사용
}

// ===== 실시간 데이터 생성 =====

export interface ScenarioContext {
  type: 'normal' | 'warning' | 'critical';
  loadMultiplier: number;
  anomalyChance: number;
}

export interface GenerationOptions {
  scenario?: ScenarioContext;
  customMetrics?: Record<string, any>;
  timeMultiplier?: number;
}

export interface MetricsGenerationResult {
  metrics: TimeSeriesMetrics[];
  scenario: ScenarioContext;
  timestamp: Date;
  sessionId: string;
}

// ===== 세션 관리 =====

export interface SessionLimits {
  maxDailySessions: number;
  maxConcurrentSessions: number;
  maxSessionDuration: number; // 밀리초
  maxMetricsPerSession: number;
}

// ===== GCP 서비스 인터페이스 =====

export interface GCPFirestoreClient {
  collection(path: string): GCPFirestoreCollection;
}

export interface GCPFirestoreCollection {
  doc(id: string): GCPFirestoreDocument;
  add(data: any): Promise<{ id: string }>;
  where(field: string, operator: string, value: any): GCPFirestoreQuery;
  orderBy(field: string, direction?: 'asc' | 'desc'): GCPFirestoreQuery;
  limit(count: number): GCPFirestoreQuery;
}

export interface GCPFirestoreDocument {
  set(data: any, options?: { merge?: boolean }): Promise<void>;
  get(): Promise<{ exists: boolean; data: () => any }>;
  delete(): Promise<void>;
  collection(path: string): GCPFirestoreCollection;
}

export interface GCPFirestoreQuery {
  get(): Promise<{
    docs: Array<{ id: string; data: () => any }>;
    size: number;
  }>;
  where(field: string, operator: string, value: any): GCPFirestoreQuery;
  orderBy(field: string, direction?: 'asc' | 'desc'): GCPFirestoreQuery;
  limit(count: number): GCPFirestoreQuery;
}

export interface GCPCloudStorageClient {
  bucket(name: string): GCPCloudStorageBucket;
}

export interface GCPCloudStorageBucket {
  file(name: string): GCPCloudStorageFile;
}

export interface GCPCloudStorageFile {
  download(): Promise<[Buffer]>;
  save(data: Buffer | string): Promise<void>;
  exists(): Promise<[boolean]>;
}

// ===== API 응답 형식 =====

export interface GCPDataResponse {
  success: boolean;
  data?: {
    sessionId: string;
    metrics: TimeSeriesMetrics[];
    dataSource: 'GCP';
    timestamp: string;
    totalMetrics?: number;
    sessionInfo?: SessionInfo;
  };
  error?: string;
  metadata?: {
    responseTime: number;
    cacheHit: boolean;
    generationTime: number;
  };
}

export interface SessionStartResponse {
  success: boolean;
  data?: {
    sessionId: string;
    userId: string;
    expiresAt: string;
    estimatedCost: number;
    serverCount: number;
  };
  error?: string;
}

// ===== 설정 및 제한 =====

export interface GCPConfig {
  projectId: string;
  firestoreDatabase: string;
  cloudStorageBucket: string;
  region: string;
  sessionLimits: SessionLimits;
  freeTierLimits: FreeTierLimits;
}

export interface GCPUsageMetrics {
  currentMonth: {
    firestoreWrites: number;
    firestoreReads: number;
    functionInvocations: number;
    storageOperations: number;
    storageUsedGB: number;
  };
  limits: FreeTierLimits;
  percentageUsed: {
    firestoreWrites: number;
    firestoreReads: number;
    functionInvocations: number;
    storageOperations: number;
    storage: number;
  };
  estimatedCosts: {
    current: number;
    projected: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  timestamp: number;
  components: {
    firestore: boolean;
    cloudStorage: boolean;
    dataGeneration: boolean;
    sessionManagement: boolean;
  };
  activeSessions: number;
  totalServers: number;
  usageMetrics: GCPUsageMetrics;
}

// ===== 확장 가능한 메트릭 시스템 =====

export interface CustomMetricDefinition {
  name: string;
  type: 'gauge' | 'counter' | 'histogram';
  unit: string;
  range?: [number, number];
  increment?: boolean;
  aggregation?: 'sum' | 'avg' | 'max' | 'min';
}

export interface ExtendedTimeSeriesMetrics extends TimeSeriesMetrics {
  custom?: Record<string, number>;
  serverType?: ServerType;
  scenario?: ScenarioContext;
  anomalies?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
}

// ===== 이벤트 및 로깅 =====

export interface GCPEvent {
  type:
    | 'session_start'
    | 'session_stop'
    | 'metrics_generated'
    | 'error'
    | 'limit_exceeded';
  timestamp: number;
  sessionId?: string;
  userId?: string;
  data: any;
  severity: 'info' | 'warning' | 'error';
}

export interface GenerationLog {
  sessionId: string;
  timestamp: number;
  metricsCount: number;
  processingTime: number;
  scenario: ScenarioContext;
  errors?: string[];
  warnings?: string[];
}

// ===== 데이터 검증 =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    checkedFields: string[];
    validationTime: number;
  };
}

export interface DataIntegrityCheck {
  metricsStructure: boolean;
  timeSeriesConsistency: boolean;
  scenarioDistribution: boolean;
  resourceConstraints: boolean;
  anomalyPatterns: boolean;
}
