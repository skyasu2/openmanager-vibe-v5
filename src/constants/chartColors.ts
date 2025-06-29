/**
 * 🎨 Chart Colors Constants
 *
 * ✅ 차트 색상 설정 전용 모듈
 * ✅ 단일 책임: 색상 상수 관리만 담당
 * ✅ SOLID 원칙 적용
 */

import type {
  ColorPalette,
  SeverityColors,
  StatusColors,
} from '../types/dashboard';

// 🎨 기본 색상 팔레트
export const COLORS: ColorPalette = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
};

// 🟢 상태별 색상 매핑
export const STATUS_COLORS: StatusColors = {
  healthy: COLORS.success,
  warning: COLORS.warning,
  critical: COLORS.danger,
  good: COLORS.success,
  excellent: COLORS.success,
};

// 🚨 심각도별 색상 매핑
export const SEVERITY_COLORS: SeverityColors = {
  critical: COLORS.danger,
  high: '#FF6B6B',
  medium: COLORS.warning,
  low: '#FFA726',
};

// 📊 차트별 특화 색상 세트
export const CHART_COLORS = {
  // 성능 차트 색상 (CPU, Memory, Disk)
  performance: {
    CPU: COLORS.danger,
    Memory: COLORS.warning,
    Disk: COLORS.info,
    Network: COLORS.purple,
    Response: COLORS.primary,
  },

  // 가용성 차트 색상
  availability: {
    online: COLORS.success,
    offline: COLORS.danger,
    maintenance: COLORS.warning,
    unknown: '#9CA3AF',
  },

  // 트렌드 차트 색상
  trends: {
    CPU: COLORS.danger,
    Memory: COLORS.warning,
    Alerts: COLORS.info,
    Response: COLORS.purple,
    Throughput: COLORS.indigo,
  },

  // 알림 분포 색상
  alerts: {
    critical: COLORS.danger,
    warning: COLORS.warning,
    info: COLORS.info,
    success: COLORS.success,
  },
};

// 🎯 헬스 스코어 색상 함수
export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
};

// 🔄 상태 기반 색상 획득 함수
export const getStatusColor = (status: keyof StatusColors): string => {
  return STATUS_COLORS[status] || COLORS.primary;
};

// ⚠️ 심각도 기반 색상 획득 함수
export const getSeverityColor = (severity: keyof SeverityColors): string => {
  return SEVERITY_COLORS[severity] || COLORS.primary;
};

// 📈 데이터 포인트별 색상 매핑
export const getChartDataColor = (dataKey: string): string => {
  const colorMap: Record<string, string> = {
    CPU: CHART_COLORS.performance.CPU,
    Memory: CHART_COLORS.performance.Memory,
    Disk: CHART_COLORS.performance.Disk,
    Network: CHART_COLORS.performance.Network,
    Response: CHART_COLORS.performance.Response,
    Alerts: CHART_COLORS.trends.Alerts,
    online: CHART_COLORS.availability.online,
    offline: CHART_COLORS.availability.offline,
    critical: CHART_COLORS.alerts.critical,
    warning: CHART_COLORS.alerts.warning,
    info: CHART_COLORS.alerts.info,
    success: CHART_COLORS.alerts.success,
  };

  return colorMap[dataKey] || COLORS.primary;
};

// 🌈 동적 색상 생성 (다수의 데이터 포인트용)
export const generateColorPalette = (count: number): string[] => {
  const baseColors = Object.values(COLORS);
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
};

// 📋 CSS 클래스명 생성 헬퍼
export const getHealthScoreClasses = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getSeverityClasses = (
  severity: keyof SeverityColors
): Record<string, string> => {
  const classMap = {
    critical: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
    },
    high: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
    },
    medium: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    low: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
    },
  };

  return classMap[severity] || classMap.low;
};
