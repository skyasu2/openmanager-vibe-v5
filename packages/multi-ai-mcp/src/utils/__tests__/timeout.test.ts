/**
 * Tests for adaptive timeout management
 */

import { describe, it, expect } from 'vitest';
import { detectQueryComplexity } from '../timeout.js';

describe('detectQueryComplexity', () => {
  describe('Length-based classification', () => {
    it('should classify short queries as simple', () => {
      expect(detectQueryComplexity('status')).toBe('simple');
      expect(detectQueryComplexity('a'.repeat(49))).toBe('simple');
    });

    it('should classify medium-length queries as medium', () => {
      expect(detectQueryComplexity('a'.repeat(50))).toBe('medium');
      expect(detectQueryComplexity('a'.repeat(199))).toBe('medium');
    });

    it('should classify long queries as complex', () => {
      expect(detectQueryComplexity('a'.repeat(200))).toBe('complex');
      expect(detectQueryComplexity('a'.repeat(500))).toBe('complex');
    });
  });

  describe('Plan Mode adjustment', () => {
    it('should bump simple to medium with Plan Mode', () => {
      expect(detectQueryComplexity('status', false)).toBe('simple');
      expect(detectQueryComplexity('status', true)).toBe('medium');
    });

    it('should bump medium to complex with Plan Mode', () => {
      const mediumQuery = 'a'.repeat(100);
      expect(detectQueryComplexity(mediumQuery, false)).toBe('medium');
      expect(detectQueryComplexity(mediumQuery, true)).toBe('complex');
    });

    it('should keep complex as complex with Plan Mode', () => {
      const complexQuery = 'a'.repeat(300);
      expect(detectQueryComplexity(complexQuery, false)).toBe('complex');
      expect(detectQueryComplexity(complexQuery, true)).toBe('complex');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(detectQueryComplexity('')).toBe('simple');
    });

    it('should handle boundary lengths', () => {
      expect(detectQueryComplexity('a'.repeat(49))).toBe('simple');
      expect(detectQueryComplexity('a'.repeat(50))).toBe('medium');
      expect(detectQueryComplexity('a'.repeat(199))).toBe('medium');
      expect(detectQueryComplexity('a'.repeat(200))).toBe('complex');
    });
  });
});
