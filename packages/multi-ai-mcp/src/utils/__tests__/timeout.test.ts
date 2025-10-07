/**
 * Tests for adaptive timeout management
 */

import { describe, it, expect } from 'vitest';
import { detectQueryComplexity } from '../timeout.js';

describe('detectQueryComplexity', () => {
  describe('Length-based classification', () => {
    it('should classify short queries as simple', () => {
      expect(detectQueryComplexity('status')).toBe('simple');
      expect(detectQueryComplexity('quick check')).toBe('simple');
    });

    it('should classify medium-length queries as medium', () => {
      const mediumQuery = 'A'.repeat(150);
      expect(detectQueryComplexity(mediumQuery)).toBe('medium');
    });

    it('should classify long queries as complex', () => {
      const longQuery = 'A'.repeat(350);
      expect(detectQueryComplexity(longQuery)).toBe('complex');
    });
  });

  describe('Keyword-based override', () => {
    it('should classify queries with complex keywords as complex', () => {
      expect(detectQueryComplexity('코드 분석')).toBe('complex');
      expect(detectQueryComplexity('analyze code')).toBe('complex');
      expect(detectQueryComplexity('아키텍처 검토')).toBe('complex');
      expect(detectQueryComplexity('architecture review')).toBe('complex');
      expect(detectQueryComplexity('성능 최적화')).toBe('complex');
      expect(detectQueryComplexity('optimize performance')).toBe('complex');
    });

    it('should classify queries with simple keywords as simple', () => {
      expect(detectQueryComplexity('서버 상태 확인')).toBe('simple');
      expect(detectQueryComplexity('status check')).toBe('simple');
      expect(detectQueryComplexity('간단한 질문')).toBe('simple');
      expect(detectQueryComplexity('simple query')).toBe('simple');
    });

    it('should be case-insensitive for keywords', () => {
      expect(detectQueryComplexity('ANALYZE CODE')).toBe('complex');
      expect(detectQueryComplexity('STATUS CHECK')).toBe('simple');
    });
  });

  describe('Plan Mode adjustment', () => {
    it('should bump simple to medium with Plan Mode', () => {
      expect(detectQueryComplexity('status', false)).toBe('simple');
      expect(detectQueryComplexity('status', true)).toBe('medium');
    });

    it('should bump medium to complex with Plan Mode', () => {
      const mediumQuery = 'A'.repeat(150);
      expect(detectQueryComplexity(mediumQuery, false)).toBe('medium');
      expect(detectQueryComplexity(mediumQuery, true)).toBe('complex');
    });

    it('should keep complex as complex with Plan Mode', () => {
      const complexQuery = 'A'.repeat(350);
      expect(detectQueryComplexity(complexQuery, false)).toBe('complex');
      expect(detectQueryComplexity(complexQuery, true)).toBe('complex');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(detectQueryComplexity('')).toBe('simple');
    });

    it('should handle boundary lengths', () => {
      expect(detectQueryComplexity('A'.repeat(99))).toBe('simple');
      expect(detectQueryComplexity('A'.repeat(100))).toBe('medium');
      expect(detectQueryComplexity('A'.repeat(300))).toBe('medium');
      expect(detectQueryComplexity('A'.repeat(301))).toBe('complex');
    });

    it('should handle Korean and English mixed queries', () => {
      expect(detectQueryComplexity('서버 status 확인')).toBe('simple');
      expect(detectQueryComplexity('코드 analyze 및 optimize')).toBe('complex');
    });
  });

  describe('Real-world examples', () => {
    it('should classify actual queries correctly', () => {
      // Simple queries
      expect(detectQueryComplexity('AI 상태 확인')).toBe('simple');
      expect(detectQueryComplexity('check system status')).toBe('simple');

      // Medium queries (100-300 chars without keywords)
      const mediumQuery = 'A'.repeat(150);
      expect(detectQueryComplexity(mediumQuery)).toBe('medium');

      // Complex queries
      expect(detectQueryComplexity('Multi-AI MCP Phase 1+2 완료 후 다음 단계(Phase 3) 필요성 분석')).toBe('complex');
      expect(detectQueryComplexity('Analyze the necessity of Phase 3 after completing Multi-AI MCP Phase 1+2')).toBe('complex');

      // With keywords
      expect(detectQueryComplexity('성능 분석')).toBe('complex');
      expect(detectQueryComplexity('아키텍처 설계 검토')).toBe('complex');
    });
  });
});
