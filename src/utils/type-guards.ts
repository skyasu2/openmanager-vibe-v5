/**
 * 타입 가드 및 유틸리티 함수
 * any 타입 제거를 위한 타입 안전성 도구
 */

/**
 * Unknown 타입을 Error로 안전하게 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러 정보를 안전하게 로깅
 */
export function logError(context: string, error: unknown): void {
  console.error(`${context}:`, getErrorMessage(error));
  if (error instanceof Error && error.stack) {
    console.debug('Stack trace:', error.stack);
  }
}

/**
 * 객체가 특정 키를 가지고 있는지 확인하는 타입 가드
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * 값이 정의되어 있는지 확인하는 타입 가드
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * 배열인지 확인하는 타입 가드
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 객체인지 확인하는 타입 가드
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 함수인지 확인하는 타입 가드
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * 숫자인지 확인하는 타입 가드
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 문자열인지 확인하는 타입 가드
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ============================================
// 🖥️ 서버 관련 타입 가드
// ============================================

import type {
    ServerAlert,
    ServerInstance,
    ServerMetricsLegacy as ServerMetrics,
    ServerStatus,
} from '@/types/unified';

/**
 * ServerInstance 타입 가드
 */
export function isServerInstance(value: unknown): value is ServerInstance {
  if (!isObject(value)) return false;

  const server = value as Record<string, unknown>;

  return (
    isString(server.id) &&
    isString(server.name) &&
    isString(server.status) &&
    isNumber(server.cpu) &&
    isNumber(server.memory) &&
    isNumber(server.disk) &&
    isNumber(server.network)
  );
}

/**
 * ServerMetrics 타입 가드
 */
export function isServerMetrics(value: unknown): value is ServerMetrics {
  if (!isObject(value)) return false;

  const metrics = value as Record<string, unknown>;

  return (
    isNumber(metrics.cpu) &&
    isNumber(metrics.memory) &&
    isNumber(metrics.disk) &&
    isNumber(metrics.network)
  );
}

/**
 * ServerStatus 타입 가드
 */
export function isValidServerStatus(value: unknown): value is ServerStatus {
  const validStatuses: ServerStatus[] = [
    'online',
    'offline',
    'running',
    'stopped',
    'healthy',
    'warning',
    'critical',
    'error',
    'maintenance',
    'active',
    'inactive',
  ];

  return isString(value) && validStatuses.includes(value as ServerStatus);
}

/**
 * ServerAlert 타입 가드
 */
export function isServerAlert(value: unknown): value is ServerAlert {
  if (!isObject(value)) return false;

  const alert = value as Record<string, unknown>;

  return (
    isString(alert.id) &&
    isString(alert.type) &&
    isString(alert.severity) &&
    isString(alert.message) &&
    isString(alert.timestamp)
  );
}

// ============================================
// 🛡️ 단언 함수
// ============================================

/**
 * 값이 정의되어 있음을 단언
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message: string = 'Value is not defined'
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}

/**
 * 값이 배열임을 단언
 */
export function assertArray<T>(
  value: unknown,
  message: string = 'Value is not an array'
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
}

/**
 * 값이 객체임을 단언
 */
export function assertObject(
  value: unknown,
  message: string = 'Value is not an object'
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(message);
  }
}

// ============================================
// 🔧 유틸리티 함수
// ============================================

/**
 * 안전한 배열 접근
 */
export function safeArrayAccess<T>(
  array: T[] | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!array || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
}

/**
 * 안전한 객체 프로퍼티 접근
 */
export function safePropertyAccess<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue;
  return obj[key] ?? defaultValue;
}

/**
 * 널리시 병합 체인
 */
export function coalesce<T>(
  ...values: (T | undefined | null)[]
): T | undefined {
  for (const value of values) {
    if (isDefined(value)) {
      return value;
    }
  }
  return undefined;
}
