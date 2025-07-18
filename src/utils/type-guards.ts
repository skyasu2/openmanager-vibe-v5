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