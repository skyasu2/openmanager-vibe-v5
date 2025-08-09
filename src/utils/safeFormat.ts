/**
 * 🛡️ SafeFormat Utilities
 * 타입 안전성을 보장하는 포맷팅 유틸리티
 */

/**
 * 업타임 값을 안전하게 문자열로 포맷팅
 * @param uptime - 숫자 또는 문자열 업타임 값
 * @returns 안전하게 포맷팅된 업타임 문자열
 */
export function safeFormatUptime(uptime: unknown): string {
  try {
    // null, undefined 체크
    if (uptime === null || uptime === undefined) {
      return 'N/A';
    }

    // 이미 문자열인 경우
    if (typeof uptime === 'string') {
      return uptime.trim() || 'N/A';
    }

    // 숫자인 경우 (초 단위로 가정)
    if (typeof uptime === 'number') {
      if (uptime <= 0) return '0일';

      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      if (days > 0) {
        return `${days}일 ${hours}시간`;
      } else if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      } else {
        return `${minutes}분`;
      }
    }

    // 기타 타입인 경우 문자열로 변환 시도
    const stringValue = String(uptime);
    return stringValue || 'N/A';
  } catch (error) {
    console.warn('⚠️ [safeFormatUptime] 업타임 포맷팅 실패:', error);
    return 'N/A';
  }
}

/**
 * 업타임에서 일 수를 안전하게 추출
 * @param uptime - 업타임 값
 * @returns 일 수 (숫자) 또는 0
 */
export function extractDaysFromUptime(uptime: unknown): number {
  try {
    // 문자열인 경우 "day" 또는 "일" 포함 체크
    if (typeof uptime === 'string') {
      // "5 days", "3일" 등의 패턴 매칭
      const dayMatch = uptime.match(/(\d+)\s*(day|일)/i);
      if (dayMatch) {
        return parseInt(dayMatch[1]) || 0;
      }

      // 순수 숫자 문자열인 경우
      const numericValue = parseFloat(uptime);
      if (!isNaN(numericValue)) {
        return Math.floor(numericValue / 86400); // 초를 일로 변환
      }
    }

    // 숫자인 경우 (초 단위로 가정)
    if (typeof uptime === 'number') {
      return Math.floor(uptime / 86400);
    }

    return 0;
  } catch (error) {
    console.warn('⚠️ [extractDaysFromUptime] 일 수 추출 실패:', error);
    return 0;
  }
}

/**
 * 값이 유효한 문자열인지 안전하게 체크
 * @param value - 체크할 값
 * @returns 유효한 문자열 여부
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 안전한 문자열 includes 체크
 * @param text - 체크할 텍스트
 * @param searchString - 찾을 문자열
 * @returns includes 결과 (안전)
 */
export function safeIncludes(text: unknown, searchString: string): boolean {
  try {
    if (!isValidString(text)) {
      return false;
    }
    return text.includes(searchString);
  } catch (error) {
    console.warn('⚠️ [safeIncludes] 안전한 includes 체크 실패:', error);
    return false;
  }
}

/**
 * 안전한 배열 접근
 * @param array - 배열
 * @param index - 인덱스
 * @param fallback - 기본값
 * @returns 안전한 배열 요소
 */
export function safeArrayAccess<T>(array: unknown, index: number, fallback: T): T {
  try {
    if (!Array.isArray(array) || index < 0 || index >= array.length) {
      return fallback;
    }
    return array[index] ?? fallback;
  } catch (error) {
    console.warn('⚠️ [safeArrayAccess] 안전한 배열 접근 실패:', error);
    return fallback;
  }
}

/**
 * 안전한 객체 속성 접근
 * @param obj - 객체
 * @param path - 속성 경로 (점 표기법)
 * @param fallback - 기본값
 * @returns 안전한 속성 값
 */
export function safePropertyAccess<T>(obj: unknown, path: string, fallback: T): T {
  try {
    if (!obj || typeof obj !== 'object') {
      return fallback;
    }

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return fallback;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return (current as T) ?? fallback;
  } catch (error) {
    console.warn('⚠️ [safePropertyAccess] 안전한 속성 접근 실패:', error);
    return fallback;
  }
}

/**
 * 안전한 JSON 파싱
 * @param jsonString - JSON 문자열
 * @param fallback - 기본값
 * @returns 파싱된 객체 또는 기본값
 */
export function safeJsonParse<T>(jsonString: unknown, fallback: T): T {
  try {
    if (typeof jsonString !== 'string') {
      return fallback;
    }
    return JSON.parse(jsonString) ?? fallback;
  } catch (error) {
    console.warn('⚠️ [safeJsonParse] JSON 파싱 실패:', error);
    return fallback;
  }
}

/**
 * 안전한 숫자 변환
 * @param value - 변환할 값
 * @param fallback - 기본값
 * @returns 숫자 또는 기본값
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  try {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    return fallback;
  } catch (error) {
    console.warn('⚠️ [safeNumber] 숫자 변환 실패:', error);
    return fallback;
  }
}

/**
 * 안전한 퍼센트 포맷팅
 * @param value - 값 (0-100 또는 0-1)
 * @param asDecimal - 소수점 형태인지 여부 (0-1)
 * @returns 포맷팅된 퍼센트 문자열
 */
export function safePercentage(value: unknown, asDecimal: boolean = false): string {
  try {
    const num = safeNumber(value, 0);
    const percentage = asDecimal ? num * 100 : num;
    return `${Math.round(percentage)}%`;
  } catch (error) {
    console.warn('⚠️ [safePercentage] 퍼센트 포맷팅 실패:', error);
    return '0%';
  }
}
