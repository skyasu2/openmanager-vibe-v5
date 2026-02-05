/**
 * 🔧 메트릭 값 검증 유틸리티
 *
 * Codex 제안사항 반영: 모든 메트릭에 일관된 범위 검증 적용
 * 예상치 못한 메트릭 값으로 인한 렌더링 오류 방지
 */

import { getThreshold } from '@/config/rules';
import { logger } from '@/lib/logging';
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network';

/**
 * 메트릭 값을 0-100 범위로 정규화하고 검증
 */
export function validateMetricValue(
  value: number,
  type: MetricType,
  fallbackValue: number = 0
): number {
  // 비숫자 타입을 숫자로 변환 후 NaN 처리
  const numValue = Number(value);
  if (Number.isNaN(numValue)) {
    logger.warn(
      `Invalid ${type} metric value:`,
      value,
      'Using fallback:',
      fallbackValue
    );
    return Math.max(0, Math.min(100, fallbackValue));
  }

  // Infinity 처리 - 양의 무한대는 100, 음의 무한대는 0
  if (numValue === Infinity) {
    logger.warn(`${type} metric value is Infinity, using 100`);
    return 100;
  }

  if (numValue === -Infinity) {
    logger.warn(`${type} metric value is -Infinity, using 0`);
    return 0;
  }

  // 0-100 범위로 제한
  const clampedValue = Math.max(0, Math.min(100, numValue));

  // 원본 값이 범위를 벗어났으면 경고 로그
  if (numValue !== clampedValue) {
    logger.warn(`${type} metric value ${numValue} clamped to ${clampedValue}`);
  }

  return Math.round(clampedValue * 100) / 100; // 소수점 2자리까지 반올림
}

/**
 * 실시간 메트릭 업데이트를 위한 안전한 값 생성
 */
export function generateSafeMetricValue(
  previousValue: number,
  maxVariation: number = 5,
  type: MetricType
): number {
  // NaN 입력 처리
  const safePreviousValue = Number.isFinite(previousValue) ? previousValue : 50; // 기본값 50
  const safeMaxVariation = Number.isFinite(maxVariation) ? maxVariation : 5; // 기본값 5

  const variation = (Math.random() - 0.5) * safeMaxVariation * 2;
  const newValue = safePreviousValue + variation;

  return validateMetricValue(newValue, type, safePreviousValue);
}

/**
 * 서버 메트릭 객체 전체를 검증
 */
export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export function validateServerMetrics(
  metrics: Partial<ServerMetrics> | null | undefined
): ServerMetrics {
  // null/undefined 입력 처리
  const safeMetrics = metrics || {};

  return {
    cpu: validateMetricValue(safeMetrics.cpu ?? 0, 'cpu', 0),
    memory: validateMetricValue(safeMetrics.memory ?? 0, 'memory', 0),
    disk: validateMetricValue(safeMetrics.disk ?? 0, 'disk', 0),
    network: validateMetricValue(safeMetrics.network ?? 0, 'network', 0),
  };
}

/**
 * 메트릭 값에 따른 상태 판단
 * 임계값은 system-rules.json (SSOT)에서 로드
 */
export type MetricStatus = 'normal' | 'warning' | 'critical';

export function getMetricStatus(value: number, type: MetricType): MetricStatus {
  const threshold = getThreshold(type);

  if (value >= threshold.critical) {
    return 'critical';
  } else if (value >= threshold.warning) {
    return 'warning';
  } else {
    return 'normal';
  }
}
