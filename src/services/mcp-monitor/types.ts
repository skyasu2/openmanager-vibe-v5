/**
 * MCP 모니터링 시스템 타입 정의
 */

import type {
  MCPServerName,
  ServerStatus,
  CircuitBreakerState,
} from './config';

// Re-export config types
export {
  type MCPServerName,
  type ServerStatus,
  type CircuitBreakerState,
} from './config';

/**
 * MCP 서버 메트릭
 */
export interface MCPServerMetrics {
  serverId: MCPServerName;
  timestamp: number;
  status: ServerStatus;
  responseTime: number;
  successRate: number;
  errorRate: number;
  requestCount: number;
  errorCount: number;
  lastError?: string;
  uptime: number;
  memoryUsage?: number;
  circuitBreakerState: CircuitBreakerState;
}

/**
 * 헬스체크 결과
 */
export interface HealthCheckResult {
  serverId: MCPServerName;
  timestamp: number;
  success: boolean;
  responseTime: number;
  error?: string;
  metadata?: {
    version?: string;
    capabilities?: string[];
    connectionPool?: number;
  };
}

/**
 * 서버 연결 상태
 */
export interface MCPServerConnection {
  serverId: MCPServerName;
  status: ServerStatus;
  lastConnected: number;
  connectionAttempts: number;
  consecutiveFailures: number;
  circuitBreaker: {
    state: CircuitBreakerState;
    lastFailure?: number;
    nextRetry?: number;
  };
}

/**
 * 모니터링 이벤트
 */
export interface MonitoringEvent {
  id: string;
  serverId: MCPServerName;
  type:
    | 'status_change'
    | 'performance_degradation'
    | 'recovery'
    | 'circuit_breaker';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 성능 추세 데이터
 */
export interface PerformanceTrend {
  serverId: MCPServerName;
  timeWindow: '5m' | '15m' | '1h' | '24h';
  metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * 알림 규칙
 */
export interface AlertRule {
  id: string;
  name: string;
  serverId?: MCPServerName; // undefined면 모든 서버
  condition: {
    metric: keyof MCPServerMetrics;
    operator: '>' | '<' | '==' | '>=' | '<=';
    threshold: number;
    duration: number; // ms
  };
  severity: 'warning' | 'error' | 'critical';
  channels: ('console' | 'redis' | 'webhook')[];
  enabled: boolean;
}

/**
 * 시스템 상태 요약
 */
export interface SystemHealthSummary {
  timestamp: number;
  totalServers: number;
  healthyServers: number;
  degradedServers: number;
  unhealthyServers: number;
  averageResponseTime: number;
  systemStatus: 'healthy' | 'degraded' | 'unhealthy';
  criticalIssues: string[];
  warnings: string[];
}

/**
 * Circuit Breaker 통계
 */
export interface CircuitBreakerStats {
  serverId: MCPServerName;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
  stateChanges: {
    timestamp: number;
    fromState: CircuitBreakerState;
    toState: CircuitBreakerState;
    reason: string;
  }[];
}

/**
 * 자동 복구 액션
 */
export interface RecoveryAction {
  id: string;
  serverId: MCPServerName;
  type: 'restart' | 'reconnect' | 'reset_circuit_breaker' | 'clear_cache';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  triggeredBy: 'manual' | 'automatic' | 'threshold';
  startTime: number;
  endTime?: number;
  result?: {
    success: boolean;
    message: string;
    metrics?: Partial<MCPServerMetrics>;
  };
}

/**
 * 모니터링 대시보드 데이터
 */
export interface MonitoringDashboard {
  summary: SystemHealthSummary;
  servers: MCPServerMetrics[];
  recentEvents: MonitoringEvent[];
  performanceTrends: PerformanceTrend[];
  activeAlerts: AlertRule[];
  recoveryActions: RecoveryAction[];
  circuitBreakerStats: CircuitBreakerStats[];
}

/**
 * 메트릭 수집기 옵션
 */
export interface MetricsCollectorOptions {
  interval: number;
  batchSize: number;
  retentionPeriod: number;
  enableDetailedLogging: boolean;
  aggregationWindows: ('1m' | '5m' | '15m' | '1h' | '24h')[];
}

/**
 * 모니터링 설정
 */
export interface MonitoringConfiguration {
  enabled: boolean;
  collectors: MetricsCollectorOptions;
  alerting: {
    enabled: boolean;
    rules: AlertRule[];
  };
  recovery: {
    enabled: boolean;
    maxAttempts: number;
    cooldownPeriod: number;
  };
  storage: {
    backend: 'redis' | 'memory' | 'supabase';
    compression: boolean;
    encryption: boolean;
  };
}

/**
 * 실시간 모니터링 스트림
 */
export interface MonitoringStream {
  subscribe(
    callback: (data: MCPServerMetrics | MonitoringEvent) => void
  ): () => void;
  unsubscribe(
    callback: (data: MCPServerMetrics | MonitoringEvent) => void
  ): void;
  getSnapshot(): MonitoringDashboard;
  isConnected(): boolean;
}

/**
 * 성능 벤치마크 결과
 */
export interface BenchmarkResult {
  serverId: MCPServerName;
  testType: 'latency' | 'throughput' | 'stress' | 'endurance';
  duration: number;
  iterations: number;
  results: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  metadata: {
    testId: string;
    timestamp: number;
    environment: string;
    parameters: Record<string, unknown>;
  };
}
