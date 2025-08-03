/**
 * 🧪 테스트 헬퍼 유틸리티
 *
 * 공통으로 사용되는 테스트 유틸리티 함수들
 */

import { waitFor as vitestWaitFor } from '@testing-library/react';
import type { waitForOptions } from '@testing-library/react';

/**
 * 기본 타임아웃이 설정된 waitFor 래퍼
 * 비동기 테스트의 안정성을 높이기 위해 기본 5초 타임아웃 설정
 */
export const waitFor = async <T>(
  callback: () => T | Promise<T>,
  options?: waitForOptions
): Promise<T> => {
  return vitestWaitFor(callback, {
    timeout: 5000, // 기본 5초
    ...options,
  });
};

/**
 * 특정 시간 동안 대기하는 유틸리티
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 재시도 로직이 포함된 테스트 유틸리티
 */
export const retryUntil = async <T>(
  fn: () => T | Promise<T>,
  condition: (result: T) => boolean,
  options: {
    maxRetries?: number;
    interval?: number;
    timeout?: number;
  } = {}
): Promise<T> => {
  const { maxRetries = 10, interval = 100, timeout = 5000 } = options;
  const startTime = Date.now();

  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();

    if (condition(result)) {
      return result;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout after ${timeout}ms`);
    }

    await delay(interval);
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
};
