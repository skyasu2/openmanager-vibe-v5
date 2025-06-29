/**
 * 🎯 Dashboard Types
 *
 * ✅ 대시보드 관련 타입 정의
 * ✅ 단일 책임: 타입 정의만 담당
 * ✅ SOLID 원칙 적용
 */

// 📊 시스템 헬스 API 응답 타입
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

// 📈 차트 데이터 타입들
export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface TrendDataPoint {
  time: string;
  CPU: number;
  Memory: number;
  Alerts: number;
  [key: string]: string | number;
}

export interface AnomalyItem {
  id: string;
  type: 'performance' | 'availability' | 'resource' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  detectedAt: string;
}

// 🎨 차트 색상 타입
export interface ColorPalette {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  purple: string;
  pink: string;
  indigo: string;
}

export interface StatusColors {
  healthy: string;
  warning: string;
  critical: string;
  good: string;
  excellent: string;
}

export interface SeverityColors {
  critical: string;
  high: string;
  medium: string;
  low: string;
}

// 🔄 API 상태 타입
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// 📱 대시보드 설정 타입
export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showAnomalies: boolean;
  showRecommendations: boolean;
  chartAnimations: boolean;
}

// 🎯 요약 카드 데이터 타입
export interface SummaryCardData {
  title: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

// 📊 차트 구성 타입
export interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'area' | 'donut';
  title: string;
  icon: React.ComponentType<any>;
  height: number;
  responsive: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  animationDuration: number;
}

// 🎪 커스텀 툴팁 props 타입
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export type ViewMode = 'grid' | 'list';
export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
