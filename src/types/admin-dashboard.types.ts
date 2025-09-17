/**
 * 📊 Admin Dashboard 관련 타입 정의
 * AdminDashboardCharts에서 분리된 타입들
 */

export interface SystemHealthAPIResponse {
  success: boolean;
  timestamp: string;
  summary: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    healthScore: number;
    serverCount: number;
    criticalIssues: number;
    warnings: number;
    dataSource: 'api' | 'fallback' | 'none';
  };
  metrics: {
    current: {
      avgCpuUsage: number;
      avgMemoryUsage: number;
      avgDiskUsage: number;
      avgResponseTime: number;
      totalAlerts: number;
      serverStatusDistribution: Record<string, number>;
      providerDistribution: Record<string, number>;
      healthScore: number;
    };
    trends: Record<
      string,
      {
        trend: 'increasing' | 'decreasing' | 'stable';
        changeRate: number;
        volatility: number;
      }
    >;
    movingAverages: Record<string, number>;
    predictions: Record<string, { nextValue: number; confidence: number }>;
  };
  anomalies: Array<{
    id: string;
    type: 'performance' | 'availability' | 'resource' | 'pattern';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    detectedAt: string;
  }>;
  recommendations: string[];
  charts: {
    performanceChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        status: string;
        trend: string;
      }>;
    };
    availabilityChart: {
      rate: number;
      status: string;
      online: number;
      total: number;
    };
    alertsChart: {
      total: number;
      bySeverity: Record<string, number>;
      trend: string;
    };
    trendsChart: {
      timePoints: string[];
      metrics: Record<string, number[]>;
    };
  };
}

export interface ChartColors {
  primary: string[];
  status: {
    healthy: string;
    warning: string;
    critical: string;
  };
  severity: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
  status?: string;
  trend?: string;
}