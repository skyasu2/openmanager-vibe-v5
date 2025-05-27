/**
 * 🔌 Service Interfaces
 * 
 * 서비스 레이어의 인터페이스 정의
 * - 의존성 추상화
 * - 테스트 가능성 향상
 * - 구현체 교체 용이성
 */

import { ServerMetrics, SystemStatus, ServerStatus } from '@/types/common';

// ============================================================================
// 데이터 서비스 인터페이스
// ============================================================================

export interface IVirtualServerManager {
  initialize(): Promise<void>;
  startRealtimeGeneration(): Promise<void>;
  stopRealtimeGeneration(): void;
  getServers(): any[];
  getLatestMetrics(serverId: string): Promise<ServerMetrics | null>;
  getMetricsHistory(serverId: string, hours?: number): Promise<ServerMetrics[]>;
  getSystemStatus(): Promise<SystemStatus>;
  getGenerationStatus(): {
    isGenerating: boolean;
    serversCount: number;
    interval: number;
    duration: number;
  };
}

export interface IVirtualServerDataAdapter {
  getAllServersData(): Promise<any[]>;
  getServerData(serverId: string): Promise<any | null>;
  getSystemAnalysisData(): Promise<any>;
  getRealtimeDataStream(): Promise<any>;
  getServerHistoryForAnalysis(serverId: string, hours?: number): Promise<any>;
  clearCache(): void;
}

// ============================================================================
// 알림 서비스 인터페이스
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  actions: AlertAction[];
  conditions?: {
    duration?: number;
    serverTypes?: string[];
    environments?: string[];
  };
}

export interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'log';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  serverId: string;
  hostname: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface IAlertSystem {
  startMonitoring(): void;
  stopMonitoring(): void;
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void;
  resolveAlert(alertId: string): void;
  getActiveAlerts(): Alert[];
  getAlertHistory(limit?: number): Alert[];
  getAlertStats(): any;
  addRule(rule: AlertRule): void;
  updateRule(ruleId: string, updates: Partial<AlertRule>): void;
  deleteRule(ruleId: string): void;
  getRules(): AlertRule[];
  onAlert(listener: (alert: Alert) => void): void;
  offAlert(listener: (alert: Alert) => void): void;
  get isRunning(): boolean;
}

// ============================================================================
// 로깅 서비스 인터페이스
// ============================================================================

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  module: string;
  data?: Record<string, any>;
  error?: Error;
}

export interface ILogger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: Error, data?: Record<string, any>): void;
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  getLevel(): string;
  getLogs(limit?: number): LogEntry[];
  clearLogs(): void;
}

// ============================================================================
// 설정 서비스 인터페이스
// ============================================================================

export interface IConfigLoader {
  load(): any;
  reload(): any;
  get<K extends string>(section: K): any;
  isDevelopment(): boolean;
  isProduction(): boolean;
  isDebugEnabled(): boolean;
}

// ============================================================================
// 메트릭 서비스 인터페이스
// ============================================================================

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface IMetricsCollector {
  collect(serverId: string): Promise<ServerMetrics>;
  collectBatch(serverIds: string[]): Promise<ServerMetrics[]>;
  startCollection(): void;
  stopCollection(): void;
  isCollecting(): boolean;
}

export interface IMetricsBridge {
  sendMetrics(metrics: MetricData[]): Promise<void>;
  getMetrics(query: any): Promise<MetricData[]>;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): void;
}

// ============================================================================
// 스토리지 서비스 인터페이스
// ============================================================================

export interface StorageOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
}

export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: StorageOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
}

// ============================================================================
// 헬스체크 서비스 인터페이스
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
    timestamp: Date;
  }>;
  timestamp: Date;
  uptime: number;
  version: string;
}

export interface IHealthCheckService {
  check(): Promise<HealthCheckResult>;
  addCheck(name: string, checkFn: () => Promise<any>): void;
  removeCheck(name: string): void;
  getChecks(): string[];
  isHealthy(): Promise<boolean>;
  startPeriodicCheck(intervalMs: number): void;
  stopPeriodicCheck(): void;
}

// ============================================================================
// AI 서비스 인터페이스
// ============================================================================

export interface AIAnalysisRequest {
  type: 'system' | 'server' | 'prediction' | 'anomaly';
  serverId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  parameters?: Record<string, any>;
}

export interface AIAnalysisResult {
  id: string;
  type: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  result?: any;
  error?: string;
  duration?: number;
}

export interface IAIAnalysisService {
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
  getAnalysisHistory(limit?: number): Promise<AIAnalysisResult[]>;
  getAnalysisById(id: string): Promise<AIAnalysisResult | null>;
  cancelAnalysis(id: string): Promise<void>;
  isAnalyzing(): boolean;
}

export interface IAIAgentEngine {
  processQuery(query: string, context?: any): Promise<any>;
  startLearning(): void;
  stopLearning(): void;
  getCapabilities(): string[];
  getStatus(): any;
  configure(config: any): void;
}

// ============================================================================
// 에러 처리 인터페이스
// ============================================================================

export interface ServiceError extends Error {
  code: string;
  service: string;
  timestamp: Date;
  context?: Record<string, any>;
  cause?: Error;
}

export interface IErrorHandler {
  handle(error: ServiceError): void;
  register(errorType: string, handler: (error: ServiceError) => void): void;
  unregister(errorType: string): void;
  getErrorHistory(limit?: number): ServiceError[];
  clearErrorHistory(): void;
}

// ============================================================================
// 이벤트 시스템 인터페이스
// ============================================================================

export interface ServiceEvent {
  type: string;
  source: string;
  timestamp: Date;
  data?: any;
}

export interface IEventBus {
  emit(event: ServiceEvent): void;
  on(eventType: string, handler: (event: ServiceEvent) => void): void;
  off(eventType: string, handler: (event: ServiceEvent) => void): void;
  once(eventType: string, handler: (event: ServiceEvent) => void): void;
  removeAllListeners(eventType?: string): void;
  getListenerCount(eventType: string): number;
}

// ============================================================================
// 캐시 서비스 인터페이스
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
  stats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  }>;
} 