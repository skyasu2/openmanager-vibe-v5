/**
 * 🐛 디버그 유틸리티 - 프로덕션에서는 로그 비활성화
 */

import { env, isDevelopment } from '@/env';

const isDebugEnabled = isDevelopment || env.NEXT_PUBLIC_DEBUG === 'true';

interface DebugLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label?: string) => void;
  groupEnd: () => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
}

/**
 * 조건부 디버그 로거
 * 개발 환경에서만 로그 출력
 */
export const debug: DebugLogger = {
  log: (...args: unknown[]) => {
    if (isDebugEnabled) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDebugEnabled) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 출력 (프로덕션에서도 필요)
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (isDebugEnabled) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDebugEnabled) console.debug(...args);
  },
  group: (label?: string) => {
    if (isDebugEnabled) console.group(label);
  },
  groupEnd: () => {
    if (isDebugEnabled) console.groupEnd();
  },
  time: (label?: string) => {
    if (isDebugEnabled) console.time(label);
  },
  timeEnd: (label?: string) => {
    if (isDebugEnabled) console.timeEnd(label);
  },
};

/**
 * 성능 측정 헬퍼
 */
export function measurePerformance<T>(label: string, fn: () => T): T {
  if (!isDebugEnabled) return fn();

  debug.time(label);
  const result = fn();
  debug.timeEnd(label);
  return result;
}

/**
 * 조건부 디버그 블록 실행
 */
export function debugBlock(fn: () => void): void {
  if (isDebugEnabled) fn();
}

export default debug;
