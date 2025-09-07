/**
 * 🔧 Enhanced Server Modal Utility Functions
 *
 * Utility functions for server modal operations:
 * - Metric color determination based on server status and values
 * - Status theme configuration for UI styling
 * - Color and gradient calculations for different server states
 */

import {
  ServerStatus,
  MetricColorResult,
  StatusTheme,
} from './EnhancedServerModal.types';

/**
 * 🎨 메트릭별 색상 결정 함수 (서버 상태 우선)
 *
 * @param value - 메트릭 값 (0-100)
 * @param type - 메트릭 타입 ('cpu' | 'memory' | 'disk' | 'network')
 * @param serverStatus - 서버 전체 상태
 * @returns 색상과 그라데이션 정보
 */
export const getMetricColorByStatus = (
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network',
  serverStatus: string
): MetricColorResult => {
  // 서버 상태 정규화 (critical → offline 매핑)
  const normalizedStatus =
    serverStatus === 'critical' ? 'offline' : serverStatus;

  // 서버 상태별 색상 정의
  if (normalizedStatus === 'offline') {
    // 심각 상황 - 빨간색 계열
    return {
      color: '#dc2626', // red-600
      gradient: 'from-red-500 to-red-600',
    };
  } else if (normalizedStatus === 'warning') {
    // 경고 상황 - 노랑/주황 계열
    return {
      color: '#f59e0b', // amber-500
      gradient: 'from-amber-500 to-amber-600',
    };
  } else if (normalizedStatus === 'healthy' || normalizedStatus === 'online') {
    // 정상 상황 - 녹색 계열
    return {
      color: '#10b981', // emerald-500
      gradient: 'from-emerald-500 to-emerald-600',
    };
  }

  // 서버 상태가 불명확한 경우 메트릭 값 기반 판단
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 60, critical: 80 },
  };

  const threshold = thresholds[type];
  if (value >= threshold.critical) {
    return {
      color: '#dc2626', // red-600
      gradient: 'from-red-500 to-red-600',
    };
  } else if (value >= threshold.warning) {
    return {
      color: '#f59e0b', // amber-500
      gradient: 'from-amber-500 to-amber-600',
    };
  } else {
    return {
      color: '#10b981', // emerald-500
      gradient: 'from-emerald-500 to-emerald-600',
    };
  }
};

/**
 * 🎨 상태별 색상 테마 가져오기
 *
 * @param status - 서버 상태
 * @returns 전체 테마 설정 객체
 */
export const getStatusTheme = (status?: ServerStatus): StatusTheme => {
  switch (status) {
    case 'healthy':
      return {
        gradient: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        badge: 'bg-green-100 text-green-800',
        icon: '✅',
      };
    case 'warning':
      return {
        gradient: 'from-yellow-500 to-amber-600',
        bgLight: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: '⚠️',
      };
    case 'critical':
    case 'offline':
      return {
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        icon: '🚨',
      };
    default:
      return {
        gradient: 'from-gray-500 to-slate-600',
        bgLight: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800',
        icon: '❓',
      };
  }
};

/**
 * 🔍 메트릭 값의 상태 분류
 *
 * @param value - 메트릭 값 (0-100)
 * @param type - 메트릭 타입
 * @returns 상태 문자열 ('normal' | 'warning' | 'critical')
 */
export const getMetricStatus = (
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network'
): 'normal' | 'warning' | 'critical' => {
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 60, critical: 80 },
  };

  const threshold = thresholds[type];

  if (value >= threshold.critical) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
};

/**
 * 📊 차트 데이터 정규화 (0-100 범위로 제한)
 *
 * @param data - 원본 데이터 배열
 * @returns 정규화된 데이터 배열
 */
export const normalizeChartData = (data: number[]): number[] => {
  return data.map((value) => Math.max(0, Math.min(100, value)));
};

/**
 * ⏱️ 업타임 문자열 포맷팅
 *
 * @param uptimeString - 원본 업타임 문자열 (예: "4320h 30m")
 * @returns 포맷된 업타임 문자열 (예: "180일 30분")
 */
export const formatUptime = (uptimeString: string): string => {
  try {
    // 시간과 분 추출
    const hourMatch = uptimeString.match(/(\d+)h/);
    const minuteMatch = uptimeString.match(/(\d+)m/);

    const hours = hourMatch ? parseInt(hourMatch[1] ?? '0', 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1] ?? '0', 10) : 0;

    // 일 단위로 변환
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      if (remainingHours > 0) {
        return `${days}일 ${remainingHours}시간`;
      } else if (minutes > 0) {
        return `${days}일 ${minutes}분`;
      } else {
        return `${days}일`;
      }
    } else if (remainingHours > 0) {
      return minutes > 0
        ? `${remainingHours}시간 ${minutes}분`
        : `${remainingHours}시간`;
    } else {
      return `${minutes}분`;
    }
  } catch {
    return uptimeString; // 파싱 실패 시 원본 반환
  }
};
