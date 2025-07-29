/**
 * 🎯 UnifiedAdminDashboard 타입 정의
 *
 * 통합 관리자 대시보드에서 사용되는 모든 타입 정의
 */

// ============================================================================
// 시스템 상태 관련 타입
// ============================================================================

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'inactive';
  performance: {
    score: number;
    status: 'good' | 'warning' | 'critical' | 'inactive';
    metrics: {
      avgResponseTime: number;
      successRate: number;
      errorRate: number;
      fallbackRate: number;
    };
  };
  logging: {
    status: 'active' | 'inactive';
    totalLogs: number;
    errorRate: number;
    lastLogTime?: string;
  };
  engines: {
    active: number;
    total: number;
    engines: Array<{
      name: string;
      status: 'active' | 'inactive' | 'error' | '_initializing';
      lastUsed?: string;
      performance?: number;
    }>;
  };
  infrastructure: {
    environment: string;
    uptime: number;
    memoryUsage: number;
    connections: number;
  };
}

// ============================================================================
// 알림 관련 타입
// ============================================================================

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: 'performance' | 'logging' | 'engine' | 'system';
  acknowledged?: boolean;
}

// ============================================================================
// 대시보드 데이터 타입
// ============================================================================

export interface DashboardData {
  status: SystemStatus;
  alerts: SystemAlert[];
  quickStats: {
    totalRequests: number;
    activeUsers: number;
    systemUptime: number;
    lastUpdate: string;
  };
}

// ============================================================================
// GCP 무료 티어 관련 타입
// ============================================================================

export interface GCPQuotaStatus {
  computeEngine: {
    used: number;
    limit: number;
    percentage: number;
  };
  cloudFunctions: {
    invocations: number;
    limit: number;
    percentage: number;
  };
  cloudStorage: {
    usedGB: number;
    limitGB: number;
    percentage: number;
  };
  ai: {
    requests: number;
    limit: number;
    percentage: number;
  };
}

// ============================================================================
// 성능 메트릭 타입
// ============================================================================

export interface PerformanceMetric {
  timestamp: string;
  value: number;
  label: string;
}

export interface PerformanceChartData {
  responseTime: PerformanceMetric[];
  requestRate: PerformanceMetric[];
  errorRate: PerformanceMetric[];
}

// ============================================================================
// 탭 관련 타입
// ============================================================================

export type DashboardTab =
  | 'overview'
  | 'performance'
  | 'logging'
  | 'ai-engines'
  | 'alerts'
  | 'settings';

// ============================================================================
// 상수 정의
// ============================================================================

export const STATUS_COLORS = {
  healthy: '#10B981',
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  error: '#EF4444',
  active: '#10B981',
  inactive: '#6B7280',
} as const;

export const REFRESH_INTERVALS = {
  fast: 5000, // 5초
  normal: 10000, // 10초
  slow: 30000, // 30초
} as const;

export const ALERT_PRIORITIES = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
} as const;
