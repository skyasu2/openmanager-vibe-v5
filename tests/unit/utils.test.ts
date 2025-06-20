import { describe, it, expect } from 'vitest';
import {
  safeErrorMessage,
  calculatePercentage,
  truncate,
  isServer,
} from '../../src/utils/utils';

describe('utils', () => {
  describe('safeErrorMessage', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error message');
      expect(safeErrorMessage(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(safeErrorMessage('String error')).toBe('String error');
    });

    it('should handle null/undefined errors with fallback', () => {
      expect(safeErrorMessage(null, 'Fallback message')).toBe(
        'Fallback message'
      );
      expect(safeErrorMessage(undefined, 'Default error')).toBe(
        'Default error'
      );
    });

    it('should handle objects with message property', () => {
      const errorObj = { message: 'Object error' };
      expect(safeErrorMessage(errorObj)).toBe('Object error');
    });

    it('should return default message when no fallback provided', () => {
      expect(safeErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다');
      expect(safeErrorMessage(undefined)).toBe(
        '알 수 없는 오류가 발생했습니다'
      );
    });

    it('should handle empty strings', () => {
      expect(safeErrorMessage('', 'Empty fallback')).toBe('Empty fallback');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate correct percentages', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33.33);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(calculatePercentage(33.333, 100)).toBe(33.33);
      expect(calculatePercentage(66.666, 100)).toBe(66.67);
    });

    it('should handle values greater than total', () => {
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Very long text that needs truncation', 10)).toBe(
        'Very long ...'
      );
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Hi', 5)).toBe('Hi');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('should handle zero length', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('isServer', () => {
    it('should detect server environment', () => {
      // In test environment, this should return true (Node.js environment)
      expect(typeof isServer()).toBe('boolean');
    });
  });
});
