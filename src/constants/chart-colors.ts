/**
 * 🎨 차트 색상 팔레트 및 상수
 * AdminDashboardCharts에서 분리된 색상 정의
 */

export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
} as const;

export const STATUS_COLORS = {
  healthy: COLORS.success,
  warning: COLORS.warning,
  critical: COLORS.danger,
  good: COLORS.success,
  excellent: COLORS.success,
} as const;

export const SEVERITY_COLORS = {
  critical: COLORS.danger,
  high: '#FF6B6B',
  medium: COLORS.warning,
  low: '#FFA726',
} as const;

export const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
] as const;