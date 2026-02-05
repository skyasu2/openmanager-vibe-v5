/**
 * 🎨 서버 상태별 색상 테마 상수 정의
 *
 * 사용자 요구사항:
 * - 심각 상황(critical/offline): 빨간색 계열
 * - 경고 상황(warning): 노랑/주황 계열
 * - 정상 상황(online/healthy): 녹색 계열
 */

export interface StatusColorConfig {
  lineColor: string;
  textColor: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  status: string;
  fillColor: string;
  gradient?: string;
}

// 🎯 임계값은 외부화된 규칙 시스템 사용
// @see src/config/rules/system-rules.json (Single Source of Truth)
import { getThreshold } from '@/config/rules';

// 서버 상태별 색상 테마
export const SERVER_STATUS_COLORS = {
  // 심각/오프라인 - 빨간색 계열
  critical: {
    lineColor: '#dc2626', // red-600
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-100',
    gradient: 'from-red-500 to-red-600',
    status: '오프라인',
    fillColor: 'rgba(220, 38, 38, 0.1)',
    icon: '🚨',
    badge: 'bg-red-100 text-red-800',
    border: 'border-red-300',
  },

  // 경고 - 노랑/주황 계열
  warning: {
    lineColor: '#f59e0b', // amber-500
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-100',
    gradient: 'from-amber-500 to-amber-600',
    status: '경고',
    fillColor: 'rgba(245, 158, 11, 0.1)',
    icon: '⚠️',
    badge: 'bg-yellow-100 text-yellow-800',
    border: 'border-yellow-300',
  },

  // 정상/온라인 - 녹색 계열
  online: {
    lineColor: '#10b981', // emerald-500
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-100',
    gradient: 'from-emerald-500 to-emerald-600',
    status: '정상',
    fillColor: 'rgba(16, 185, 129, 0.1)',
    icon: '✅',
    badge: 'bg-green-100 text-green-800',
    border: 'border-green-300',
  },

  // 기본값 (상태 불명) - 회색 계열
  unknown: {
    lineColor: '#6b7280', // gray-500
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-gray-100',
    gradient: 'from-gray-500 to-gray-600',
    status: '알 수 없음',
    fillColor: 'rgba(107, 114, 128, 0.1)',
    icon: '❓',
    badge: 'bg-gray-100 text-gray-800',
    border: 'border-gray-300',
  },
};

/**
 * 서버 상태 정규화 함수
 * critical → offline 매핑
 * healthy → online 매핑
 */
export function normalizeServerStatus(
  status: string
): 'online' | 'warning' | 'critical' | 'unknown' {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus === 'offline' ||
    normalizedStatus === 'critical' ||
    normalizedStatus === 'error'
  ) {
    return 'critical';
  }

  if (normalizedStatus === 'warning' || normalizedStatus === 'degraded') {
    return 'warning';
  }

  if (
    normalizedStatus === 'online' ||
    normalizedStatus === 'healthy' ||
    normalizedStatus === 'running'
  ) {
    return 'online';
  }

  return 'unknown';
}

/**
 * 서버 상태에 따른 색상 테마 반환
 */
export function getServerStatusColors(status: string) {
  const normalized = normalizeServerStatus(status);
  return SERVER_STATUS_COLORS[normalized];
}

/**
 * 메트릭 값과 서버 상태에 따른 색상 결정
 * 서버 상태가 우선순위를 가지며, 상태가 불명확한 경우 메트릭 값 기반으로 판단
 */
export function getMetricColorConfig(
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network',
  serverStatus?: string
): StatusColorConfig {
  // 서버 상태가 있으면 우선 적용
  if (serverStatus) {
    const normalized = normalizeServerStatus(serverStatus);
    const colors = SERVER_STATUS_COLORS[normalized];

    return {
      lineColor: colors.lineColor,
      textColor: colors.textColor,
      bgColor: colors.bgColor,
      gradientFrom: colors.gradientFrom,
      gradientTo: colors.gradientTo,
      status: colors.status,
      fillColor: colors.fillColor,
    };
  }

  // 서버 상태가 없으면 메트릭 값 기반 판단
  const threshold = getThreshold(type);

  if (threshold && value >= threshold.critical) {
    const colors = SERVER_STATUS_COLORS.critical;
    return {
      lineColor: colors.lineColor,
      textColor: colors.textColor,
      bgColor: colors.bgColor,
      gradientFrom: colors.gradientFrom,
      gradientTo: colors.gradientTo,
      status: '위험',
      fillColor: colors.fillColor,
    };
  }

  if (threshold && value >= threshold.warning) {
    const colors = SERVER_STATUS_COLORS.warning;
    return {
      lineColor: colors.lineColor,
      textColor: colors.textColor,
      bgColor: colors.bgColor,
      gradientFrom: colors.gradientFrom,
      gradientTo: colors.gradientTo,
      status: '주의',
      fillColor: colors.fillColor,
    };
  }

  const colors = SERVER_STATUS_COLORS.online;
  return {
    lineColor: colors.lineColor,
    textColor: colors.textColor,
    bgColor: colors.bgColor,
    gradientFrom: colors.gradientFrom,
    gradientTo: colors.gradientTo,
    status: '정상',
    fillColor: colors.fillColor,
  };
}

/**
 * 간편한 색상 선택 헬퍼 함수
 */
export function getStatusColor(status: string): string {
  return getServerStatusColors(status).lineColor;
}

export function getStatusGradient(status: string): string {
  return getServerStatusColors(status).gradient || '';
}

export function getStatusIcon(status: string): string {
  return getServerStatusColors(status).icon || '❓';
}
