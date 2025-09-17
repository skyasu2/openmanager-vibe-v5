/**
 * 📊 Admin Dashboard 차트 데이터 처리 유틸리티
 * AdminDashboardCharts에서 분리된 데이터 변환 함수들
 */

import { COLORS, SEVERITY_COLORS } from '@/constants/chart-colors';
import type { SystemHealthAPIResponse } from '@/types/admin-dashboard.types';

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  time: string;
  CPU: number;
  Memory: number;
  Alerts: number;
}

/**
 * 📊 성능 차트 데이터 변환
 */
export const getPerformanceChartData = (data: SystemHealthAPIResponse | null): ChartDataPoint[] => {
  if (!data?.charts.performanceChart) return [];

  const { labels, datasets } = data.charts.performanceChart;
  return labels.map((label, index) => ({
    name: label,
    value: datasets[0]?.data[index] || 0,
    color:
      label === 'CPU'
        ? COLORS.danger
        : label === 'Memory'
          ? COLORS.warning
          : label === 'Disk'
            ? COLORS.info
            : COLORS.primary,
  }));
};

/**
 * 🥧 가용성 도넛 차트 데이터
 */
export const getAvailabilityChartData = (data: SystemHealthAPIResponse | null): ChartDataPoint[] => {
  if (!data?.charts.availabilityChart) return [];

  const { online, total } = data.charts.availabilityChart;
  const offline = total - online;

  return [
    { name: '온라인', value: online, color: COLORS.success },
    { name: '오프라인', value: offline, color: COLORS.danger },
  ];
};

/**
 * 📢 알림 분포 차트 데이터
 */
export const getAlertsChartData = (data: SystemHealthAPIResponse | null): ChartDataPoint[] => {
  if (!data?.charts.alertsChart.bySeverity) return [];

  const { bySeverity } = data.charts.alertsChart;

  return Object.entries(bySeverity)
    .map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      color:
        SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ||
        COLORS.info,
    }))
    .filter((item) => item.value > 0);
};

/**
 * 📈 트렌드 라인 차트 데이터
 */
export const getTrendsChartData = (data: SystemHealthAPIResponse | null): TrendDataPoint[] => {
  if (!data?.charts.trendsChart) return [];

  const { timePoints, metrics } = data.charts.trendsChart;

  return timePoints.map((timePoint, index) => ({
    time: new Date(timePoint).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    CPU: metrics.cpu?.[index] || 0,
    Memory: metrics.memory?.[index] || 0,
    Alerts: metrics.alerts?.[index] || 0,
  }));
};