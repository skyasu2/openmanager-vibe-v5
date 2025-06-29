/**
 * 🔄 Chart Data Transforms
 *
 * ✅ 차트 데이터 변환 전용 유틸리티
 * ✅ 단일 책임: 데이터 변환만 담당
 * ✅ SOLID 원칙 적용
 */

import { CHART_COLORS, getChartDataColor } from '../constants/chartColors';
import type {
  ChartDataPoint,
  SystemHealthAPIResponse,
  TrendDataPoint,
} from '../types/dashboard';

// 📊 성능 차트 데이터 변환
export const transformPerformanceChartData = (
  data: SystemHealthAPIResponse | null
): ChartDataPoint[] => {
  if (!data?.charts.performanceChart) return [];

  const { labels, datasets } = data.charts.performanceChart;
  return labels.map((label, index) => ({
    name: label,
    value: datasets[0]?.data[index] || 0,
    color: getChartDataColor(label),
  }));
};

// 🥧 가용성 도넛 차트 데이터 변환
export const transformAvailabilityChartData = (
  data: SystemHealthAPIResponse | null
): ChartDataPoint[] => {
  if (!data?.charts.availabilityChart) return [];

  const { online, total } = data.charts.availabilityChart;
  const offline = total - online;

  return [
    {
      name: '온라인',
      value: online,
      color: CHART_COLORS.availability.online,
    },
    {
      name: '오프라인',
      value: offline,
      color: CHART_COLORS.availability.offline,
    },
  ];
};

// 📢 알림 분포 차트 데이터 변환
export const transformAlertsChartData = (
  data: SystemHealthAPIResponse | null
): ChartDataPoint[] => {
  if (!data?.charts.alertsChart?.bySeverity) return [];

  const { bySeverity } = data.charts.alertsChart;

  return Object.entries(bySeverity)
    .filter(([_, count]) => count > 0)
    .map(([severity, count]) => ({
      name: severity,
      value: count,
      color: getChartDataColor(severity),
    }));
};

// 📈 트렌드 차트 데이터 변환
export const transformTrendsChartData = (
  data: SystemHealthAPIResponse | null
): TrendDataPoint[] => {
  if (!data?.charts.trendsChart) return [];

  const { timePoints, metrics } = data.charts.trendsChart;

  return timePoints.map((time, index) => ({
    time,
    CPU: metrics.CPU?.[index] || 0,
    Memory: metrics.Memory?.[index] || 0,
    Alerts: metrics.Alerts?.[index] || 0,
    Response: metrics.Response?.[index] || 0,
    Network: metrics.Network?.[index] || 0,
  }));
};

// 🎯 요약 카드 데이터 변환
export const transformSummaryCardsData = (
  data: SystemHealthAPIResponse | null
) => {
  if (!data) return [];

  const { summary } = data;

  return [
    {
      id: 'health-score',
      title: '헬스 스코어',
      value: `${summary.healthScore}/100`,
      status:
        summary.healthScore >= 80
          ? 'healthy'
          : summary.healthScore >= 60
            ? 'warning'
            : 'critical',
      metric: summary.healthScore,
      unit: '%',
    },
    {
      id: 'server-count',
      title: '서버 수',
      value: summary.serverCount,
      status: 'healthy' as const,
      metric: summary.serverCount,
      unit: '개',
    },
    {
      id: 'critical-issues',
      title: '심각한 이슈',
      value: summary.criticalIssues,
      status: summary.criticalIssues === 0 ? 'healthy' : 'critical',
      metric: summary.criticalIssues,
      unit: '개',
    },
    {
      id: 'warnings',
      title: '경고',
      value: summary.warnings,
      status: summary.warnings === 0 ? 'healthy' : 'warning',
      metric: summary.warnings,
      unit: '개',
    },
  ];
};

// 🚨 이상 징후 데이터 변환
export const transformAnomaliesData = (
  data: SystemHealthAPIResponse | null,
  maxItems: number = 5
) => {
  if (!data?.anomalies) return [];

  return data.anomalies.slice(0, maxItems).map(anomaly => ({
    ...anomaly,
    detectedAtFormatted: new Date(anomaly.detectedAt).toLocaleString('ko-KR'),
    severityLevel: getSeverityLevel(anomaly.severity),
    actionRequired: getActionRequired(anomaly.severity, anomaly.type),
  }));
};

// 💡 권장사항 데이터 변환
export const transformRecommendationsData = (
  data: SystemHealthAPIResponse | null,
  maxItems: number = 6
) => {
  if (!data?.recommendations) return [];

  return data.recommendations
    .slice(0, maxItems)
    .map((recommendation, index) => ({
      id: `rec-${index}`,
      text: recommendation,
      priority: getPriority(recommendation),
      category: getCategory(recommendation),
      estimated_time: getEstimatedTime(recommendation),
    }));
};

// 🎪 커스텀 툴팁 데이터 변환
export const transformTooltipData = (
  active: boolean,
  payload: any[],
  label: string
) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return {
    isActive: active,
    label: label,
    data: payload.map(item => ({
      name: item.name || item.dataKey,
      value: item.value,
      color: item.color,
      unit: getUnit(item.dataKey),
      percentage: getPercentage(item.value, item.dataKey),
    })),
  };
};

// 📊 차트 메타데이터 생성
export const getChartMetadata = (chartType: string, data: any[]) => {
  return {
    type: chartType,
    dataPoints: data.length,
    isEmpty: data.length === 0,
    hasData: data.length > 0,
    lastUpdated: new Date().toISOString(),
    totalValue: data.reduce((sum, item) => sum + (item.value || 0), 0),
    averageValue:
      data.length > 0
        ? data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length
        : 0,
  };
};

// 🔍 데이터 유효성 검증
export const validateChartData = (data: any[], chartType: string): boolean => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  const requiredFields = getRequiredFields(chartType);
  return data.every(item =>
    requiredFields.every(
      field =>
        item.hasOwnProperty(field) &&
        item[field] !== undefined &&
        item[field] !== null
    )
  );
};

// 📋 헬퍼 함수들
const getSeverityLevel = (severity: string): number => {
  const levels = { low: 1, medium: 2, high: 3, critical: 4 };
  return levels[severity as keyof typeof levels] || 1;
};

const getActionRequired = (severity: string, type: string): boolean => {
  return (
    severity === 'critical' || severity === 'high' || type === 'availability'
  );
};

const getPriority = (recommendation: string): 'high' | 'medium' | 'low' => {
  if (recommendation.includes('즉시') || recommendation.includes('긴급'))
    return 'high';
  if (recommendation.includes('권장') || recommendation.includes('개선'))
    return 'medium';
  return 'low';
};

const getCategory = (recommendation: string): string => {
  if (recommendation.includes('CPU') || recommendation.includes('메모리'))
    return 'performance';
  if (recommendation.includes('보안') || recommendation.includes('인증'))
    return 'security';
  if (recommendation.includes('네트워크')) return 'network';
  return 'general';
};

const getEstimatedTime = (recommendation: string): string => {
  if (recommendation.includes('즉시')) return '< 1시간';
  if (recommendation.includes('긴급')) return '1-4시간';
  if (recommendation.includes('권장')) return '1-2일';
  return '1주일';
};

const getUnit = (dataKey: string): string => {
  const units: Record<string, string> = {
    CPU: '%',
    Memory: '%',
    Disk: '%',
    Network: 'Mbps',
    Response: 'ms',
    Alerts: '개',
    온라인: '개',
    오프라인: '개',
  };
  return units[dataKey] || '';
};

const getPercentage = (value: number, dataKey: string): string => {
  if (
    dataKey.includes('Usage') ||
    dataKey === 'CPU' ||
    dataKey === 'Memory' ||
    dataKey === 'Disk'
  ) {
    return `${value.toFixed(1)}%`;
  }
  return '';
};

const getRequiredFields = (chartType: string): string[] => {
  const fieldMap: Record<string, string[]> = {
    bar: ['name', 'value'],
    pie: ['name', 'value'],
    line: ['time'],
    donut: ['name', 'value'],
  };
  return fieldMap[chartType] || ['name', 'value'];
};
