/**
 * 🔗 Retry Utility Integration Test
 *
 * 복원력 유틸리티 통합 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ 순수 함수 테스트
 * - ✅ 외부 API 호출 없음
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';

import {
  calculateBackoff,
  defaultShouldRetry,
  RETRY_AGGRESSIVE,
  RETRY_CONSERVATIVE,
  RETRY_STANDARD,
} from '@/lib/utils/retry';

describe('Retry Utility Integration', () => {
  describe('calculateBackoff', () => {
    it('attempt 0 → baseDelay', () => {
      // Given
      const attempt = 0;
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0); // jitter 0으로 정확한 값 테스트

      // Then
      expect(delay).toBe(1000);
    });

    it('attempt 1 → baseDelay * 2', () => {
      // Given
      const attempt = 1;
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0);

      // Then
      expect(delay).toBe(2000);
    });

    it('attempt 2 → baseDelay * 4', () => {
      // Given
      const attempt = 2;
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0);

      // Then
      expect(delay).toBe(4000);
    });

    it('attempt 3 → baseDelay * 8', () => {
      // Given
      const attempt = 3;
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0);

      // Then
      expect(delay).toBe(8000);
    });

    it('maxDelay 초과 시 clamp', () => {
      // Given
      const attempt = 10; // 2^10 = 1024 * 1000 = 1,024,000ms
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0);

      // Then
      expect(delay).toBe(30000); // maxDelay로 제한
    });

    it('jitter 범위 ±10% (기본값)', () => {
      // Given
      const attempt = 0;
      const baseDelayMs = 1000;
      const maxDelayMs = 30000;
      const jitterFactor = 0.1;

      // When - 여러 번 실행하여 범위 확인
      const delays: number[] = [];
      for (let i = 0; i < 100; i++) {
        delays.push(
          calculateBackoff(attempt, baseDelayMs, maxDelayMs, jitterFactor)
        );
      }

      // Then - 모든 값이 ±10% 범위 내
      const minExpected = 900; // 1000 - 10%
      const maxExpected = 1100; // 1000 + 10%
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(minExpected);
        expect(delay).toBeLessThanOrEqual(maxExpected);
      }
    });

    it('jitter 0 → 정확한 값', () => {
      // Given
      const attempt = 2;
      const baseDelayMs = 500;
      const maxDelayMs = 10000;

      // When
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, 0);

      // Then
      expect(delay).toBe(2000); // 500 * 2^2 = 2000
    });
  });

  describe('defaultShouldRetry', () => {
    it('5xx 에러 → true', () => {
      // Given
      const error = { status: 500 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('502 Bad Gateway → true', () => {
      // Given
      const error = { status: 502 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('503 Service Unavailable → true', () => {
      // Given
      const error = { status: 503 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('4xx 에러 → false', () => {
      // Given
      const error = { status: 400 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(false);
    });

    it('401 Unauthorized → false', () => {
      // Given
      const error = { status: 401 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(false);
    });

    it('403 Forbidden → false', () => {
      // Given
      const error = { status: 403 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(false);
    });

    it('404 Not Found → false', () => {
      // Given
      const error = { status: 404 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(false);
    });

    it('TypeError (fetch) → true', () => {
      // Given
      const error = new TypeError('fetch failed');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('timeout 에러 → true', () => {
      // Given
      const error = new Error('Request timeout');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('ETIMEDOUT 에러 → true', () => {
      // Given
      const error = new Error('ETIMEDOUT');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('connection 에러 → true', () => {
      // Given
      const error = new Error('ECONNRESET');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('ECONNREFUSED 에러 → true', () => {
      // Given
      const error = new Error('ECONNREFUSED');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('network 에러 → true', () => {
      // Given
      const error = new Error('Network error');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('알 수 없는 에러 → false', () => {
      // Given
      const error = new Error('Unknown error');

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('Preset 설정', () => {
    it('RETRY_AGGRESSIVE 설정 확인', () => {
      // Then
      expect(RETRY_AGGRESSIVE.maxRetries).toBe(5);
      expect(RETRY_AGGRESSIVE.baseDelayMs).toBe(500);
      expect(RETRY_AGGRESSIVE.maxDelayMs).toBe(30000);
      expect(RETRY_AGGRESSIVE.jitterFactor).toBe(0.15);
    });

    it('RETRY_STANDARD 설정 확인', () => {
      // Then
      expect(RETRY_STANDARD.maxRetries).toBe(3);
      expect(RETRY_STANDARD.baseDelayMs).toBe(1000);
      expect(RETRY_STANDARD.maxDelayMs).toBe(30000);
      expect(RETRY_STANDARD.jitterFactor).toBe(0.1);
    });

    it('RETRY_CONSERVATIVE 설정 확인', () => {
      // Then
      expect(RETRY_CONSERVATIVE.maxRetries).toBe(2);
      expect(RETRY_CONSERVATIVE.baseDelayMs).toBe(2000);
      expect(RETRY_CONSERVATIVE.maxDelayMs).toBe(10000);
      expect(RETRY_CONSERVATIVE.jitterFactor).toBe(0.05);
    });
  });

  describe('에러 분류 조합', () => {
    it('statusCode 속성도 인식', () => {
      // Given
      const error = { statusCode: 500 };

      // When
      const result = defaultShouldRetry(error, 0);

      // Then
      expect(result).toBe(true);
    });

    it('여러 attempt에서 일관된 결과', () => {
      // Given
      const error = { status: 500 };

      // When/Then
      expect(defaultShouldRetry(error, 0)).toBe(true);
      expect(defaultShouldRetry(error, 1)).toBe(true);
      expect(defaultShouldRetry(error, 2)).toBe(true);
    });
  });
});
