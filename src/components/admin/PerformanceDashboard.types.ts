/**
 * 📊 PerformanceDashboard Types
 *
 * Type definitions for performance monitoring:
 * - Performance metrics interfaces
 * - Alert system types
 * - Dashboard data structures
 */

export interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  fallbackRate: number;
  engineStats: Record<
    string,
    {
      requests: number;
      averageResponseTime: number;
      successRate: number;
      confidence: number;
    }
  >;
  modeStats: Record<
    string,
    {
      requests: number;
      averageResponseTime: number;
      successRate: number;
    }
  >;
  hourlyStats: Array<{
    hour: string;
    requests: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  lastUpdated: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  engine: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export interface PerformanceData {
  stats: PerformanceMetrics;
  alerts: PerformanceAlert[];
  status: {
    enabled: boolean;
    metricsCount: number;
    alertsCount: number;
    lastMetricTime?: string;
  };
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number | string;
  }>;
  label?: string;
}
