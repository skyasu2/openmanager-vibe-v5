/**
 * Tests for timeout utilities
 *
 * v1.6.0 Regression: Simplified timeout tests
 * - Removed complexity detection tests (over-engineering)
 * - Focus on core timeout and retry functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, calculateRetryTimeout } from '../timeout.js';

describe('Timeout Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = withTimeout(promise, 1000);

      await expect(result).resolves.toBe('success');
    });

    it('should reject when promise exceeds timeout', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000);
      });

      const result = withTimeout(promise, 1000);

      // Advance timers to trigger timeout
      vi.advanceTimersByTime(1001);

      await expect(result).rejects.toThrow('Operation timed out');
    });

    it('should use custom error message', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000);
      });

      const result = withTimeout(promise, 1000, 'Custom timeout message');

      vi.advanceTimersByTime(1001);

      await expect(result).rejects.toThrow('Custom timeout message');
    });

    it('should clear timeout on successful completion', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.resolve('success');

      await withTimeout(promise, 1000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear timeout on rejection', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.reject(new Error('failure'));

      try {
        await withTimeout(promise, 1000);
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('calculateRetryTimeout', () => {
    it('should return original timeout for first attempt', () => {
      expect(calculateRetryTimeout(1000, 0)).toBe(1000);
    });

    it('should increase timeout by 50% for second attempt', () => {
      expect(calculateRetryTimeout(1000, 1)).toBe(1500);
    });

    it('should increase timeout by 100% for third attempt', () => {
      expect(calculateRetryTimeout(1000, 2)).toBe(2000);
    });

    it('should increase timeout by 150% for fourth attempt', () => {
      expect(calculateRetryTimeout(1000, 3)).toBe(2500);
    });

    it('should handle large timeouts correctly', () => {
      expect(calculateRetryTimeout(180000, 1)).toBe(270000); // 180s → 270s
      expect(calculateRetryTimeout(300000, 1)).toBe(450000); // 300s → 450s
    });

    it('should floor the result', () => {
      expect(calculateRetryTimeout(1001, 1)).toBe(1501); // Math.floor(1501.5)
    });
  });
});
