/**
 * Shared Utils
 *
 * 🔧 모든 모듈에서 공통으로 사용하는 유틸리티 함수들
 */

import type { BaseConfig } from '../types';

/**
 * 고유 ID 생성
 */
export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (
  date: Date | string,
  format = 'YYYY-MM-DD HH:mm:ss'
): string => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 디바운스 함수
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 스로틀 함수
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 깊은 객체 병합
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        result[key] || ({} as Record<string, unknown>),
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
};

/**
 * 설정 유효성 검사
 */
export const validateConfig = (config: BaseConfig): boolean => {
  if (!config.name || typeof config.name !== 'string') {
    console.error('Config validation failed: name is required');
    return false;
  }

  if (!config.version || typeof config.version !== 'string') {
    console.error('Config validation failed: version is required');
    return false;
  }

  if (typeof config.enabled !== 'boolean') {
    console.error('Config validation failed: enabled must be boolean');
    return false;
  }

  return true;
};

/**
 * 안전한 JSON 파싱
 */
export const safeJsonParse = <T = unknown>(
  json: string,
  defaultValue: T
): T => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * 안전한 JSON 문자열화
 */
export const safeJsonStringify = (
  obj: unknown,
  defaultValue = '{}'
): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};

/**
 * 배열을 청크로 분할
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * 배열에서 중복 제거
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * 객체에서 빈 값 제거
 */
export const removeEmpty = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  const result: Partial<T> = {};

  for (const key in obj) {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }

  return result;
};

/**
 * 랜덤 문자열 생성
 */
export const randomString = (length = 8): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 슬립 함수
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
