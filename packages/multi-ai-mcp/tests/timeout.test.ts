import { describe, it, expect, vi } from 'vitest';
import { detectQueryComplexity, getAdaptiveTimeout, withTimeout, calculateRetryTimeout } from '../src/utils/timeout.js';

describe('timeout utilities', () => {
  describe('detectQueryComplexity', () => {
    it('should detect simple queries', () => {
      expect(detectQueryComplexity('short')).toBe('simple');
      expect(detectQueryComplexity('a'.repeat(49))).toBe('simple');
    });

    it('should detect medium queries', () => {
      expect(detectQueryComplexity('a'.repeat(100))).toBe('medium');
      expect(detectQueryComplexity('a'.repeat(300))).toBe('medium');
    });

    it('should detect complex queries', () => {
      expect(detectQueryComplexity('a'.repeat(301))).toBe('complex');
      expect(detectQueryComplexity('a'.repeat(1000))).toBe('complex');
    });
  });

  describe('getAdaptiveTimeout', () => {
    const config = {
      simple: 1000,
      medium: 2000,
      complex: 3000
    };

    it('should return correct timeout for each complexity', () => {
      expect(getAdaptiveTimeout('simple', config)).toBe(1000);
      expect(getAdaptiveTimeout('medium', config)).toBe(2000);
      expect(getAdaptiveTimeout('complex', config)).toBe(3000);
    });
  });

  describe('calculateRetryTimeout', () => {
    it('should increase timeout by 50% per attempt', () => {
      expect(calculateRetryTimeout(100, 1)).toBe(150);
      expect(calculateRetryTimeout(100, 2)).toBe(200);
      expect(calculateRetryTimeout(100, 3)).toBe(250);
    });
  });

  describe('withTimeout', () => {
    it('should resolve when promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject when promise takes too long', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 200));
      await expect(withTimeout(promise, 10, 'Timeout!')).rejects.toThrow('Timeout!');
    });

    it('should clear timeout when promise resolves (memory leak fix)', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.resolve('success');

      await withTimeout(promise, 1000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout when promise rejects', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.reject(new Error('fail'));

      try {
        await withTimeout(promise, 1000);
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout when timeout occurs', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = new Promise((resolve) => setTimeout(resolve, 200));

      try {
        await withTimeout(promise, 10);
      } catch {
        // Expected timeout
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
