/**
 * 🧠 QueryComplexityAnalyzer 단위 테스트
 * 
 * 쿼리 복잡도 분석기의 모든 기능을 테스트합니다.
 */

import { describe, it, expect } from 'vitest';
import { QueryComplexityAnalyzer } from '../query-complexity-analyzer';
import type { ComplexityScore } from '../query-complexity-analyzer';

describe('QueryComplexityAnalyzer', () => {
  describe('analyze', () => {
    it('should analyze simple query', () => {
      const result = QueryComplexityAnalyzer.analyze('서버 상태');
      
      expect(result.score).toBeLessThan(30);
      expect(result.recommendation).toBe('local');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should analyze complex query', () => {
      const result = QueryComplexityAnalyzer.analyze(
        '왜 서버의 CPU 사용률이 높아졌는지 분석하고, 향후 예측 및 최적화 전략을 제안해주세요. 또한 비교 분석도 포함해주세요.'
      );
      
      expect(result.score).toBeGreaterThan(45);
      expect(result.recommendation).toBe('hybrid');
    });

    it('should analyze medium complexity query', () => {
      const result = QueryComplexityAnalyzer.analyze(
        '서버 성능을 개선하려면 어떻게 해야 하나요?'
      );
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(70);
      expect(result.recommendation).toBe('local');
    });

    it('should handle empty query', () => {
      const result = QueryComplexityAnalyzer.analyze('');
      
      expect(result.score).toBeLessThanOrEqual(20);
      expect(result.recommendation).toBe('local');
    });

    it('should consider context', () => {
      const withoutContext = QueryComplexityAnalyzer.analyze('서버 분석');
      const withContext = QueryComplexityAnalyzer.analyze('서버 분석', {
        previousQueries: ['서버 상태', 'CPU 사용률', '메모리 사용률', '네트워크 상태'],
        hasServerData: false,
      });
      
      expect(withContext.score).toBeGreaterThan(withoutContext.score);
    });

    it('should detect technical patterns', () => {
      const technicalQueries = [
        '서버 상태 확인',
        'CPU 메트릭 확인',
        '데이터베이스 쿼리 성능',
        'API 엔드포인트 목록',
        '로그 에러 확인',
      ];
      
      technicalQueries.forEach(query => {
        const result = QueryComplexityAnalyzer.analyze(query);
        expect(result.factors.patterns).toBeLessThanOrEqual(40);
      });
    });

    it('should detect complex keywords', () => {
      const complexKeywords = [
        '분석', '비교', '예측', '추론', '설명', '이유', '왜', '어떻게',
        '전략', '계획', '최적화', '개선', '추천', '제안', '평가',
      ];
      
      complexKeywords.forEach(keyword => {
        const result = QueryComplexityAnalyzer.analyze(`서버 ${keyword}`);
        expect(result.factors.keywords).toBeGreaterThan(0);
      });
    });

    it('should detect simple keywords', () => {
      const simpleKeywords = [
        '상태', '목록', '개수', '이름', '값', '현재', '보기',
      ];
      
      simpleKeywords.forEach(keyword => {
        const result = QueryComplexityAnalyzer.analyze(`서버 ${keyword}`);
        expect(result.factors.keywords).toBeLessThan(50);
      });
    });

    it('should analyze query length', () => {
      const lengths = [
        { query: '짧은 쿼리', expectedRange: [0, 20] },
        { query: '이것은 중간 길이의 쿼리입니다. 약간 더 길게 작성해봅니다.', expectedRange: [20, 50] },
        { query: '이것은 매우 긴 쿼리입니다. '.repeat(10), expectedRange: [70, 100] },
      ];
      
      lengths.forEach(({ query, expectedRange }) => {
        const result = QueryComplexityAnalyzer.analyze(query);
        expect(result.factors.length).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(result.factors.length).toBeLessThanOrEqual(expectedRange[1]);
      });
    });

    it('should analyze language complexity', () => {
      const queries = [
        { query: '한글만 사용', expectedComplexity: 'low' },
        { query: 'English only', expectedComplexity: 'low' },
        { query: '한글과 English 혼용', expectedComplexity: 'medium' },
        { query: '한글 + 특수문자!@# 및 123 숫자', expectedComplexity: 'high' },
      ];
      
      queries.forEach(({ query, expectedComplexity }) => {
        const result = QueryComplexityAnalyzer.analyze(query);
        
        if (expectedComplexity === 'low') {
          expect(result.factors.language).toBeLessThan(50);
        } else if (expectedComplexity === 'medium') {
          expect(result.factors.language).toBeGreaterThanOrEqual(50);
          expect(result.factors.language).toBeLessThan(70);
        } else {
          expect(result.factors.language).toBeGreaterThanOrEqual(50);
        }
      });
    });

    it('should calculate confidence correctly', () => {
      const result = QueryComplexityAnalyzer.analyze('서버 상태 확인');
      
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should handle queries with multiple questions', () => {
      const result = QueryComplexityAnalyzer.analyze(
        '왜 서버가 느린가요? 어떻게 해결할 수 있나요? 또 다른 방법은 무엇인가요?'
      );
      
      expect(result.factors.patterns).toBeGreaterThanOrEqual(60);
    });

    it('should handle context with server data', () => {
      const result = QueryComplexityAnalyzer.analyze('서버 분석', {
        hasServerData: true,
      });
      
      expect(result.factors.context).toBeLessThan(20);
    });

    it('should handle long user intent', () => {
      const result = QueryComplexityAnalyzer.analyze('분석', {
        userIntent: '사용자는 서버의 전반적인 성능을 분석하고, 문제점을 찾아내며, 개선 방안을 제시하기를 원합니다.',
      });
      
      expect(result.factors.context).toBeGreaterThan(0);
    });

    it('should provide consistent results for same query', () => {
      const query = '서버 성능 최적화 방법';
      const result1 = QueryComplexityAnalyzer.analyze(query);
      const result2 = QueryComplexityAnalyzer.analyze(query);
      
      expect(result1).toEqual(result2);
    });

    it('should handle mixed technical and complex patterns', () => {
      const result = QueryComplexityAnalyzer.analyze(
        'CPU 메트릭을 분석하고 향후 예측해주세요'
      );
      
      expect(result.factors.patterns).toBeGreaterThan(20);
      expect(result.factors.keywords).toBeGreaterThan(0);
    });
  });

  describe('optimizeQuery', () => {
    it('should not optimize simple queries', () => {
      const query = '서버 상태';
      const complexity: ComplexityScore = {
        score: 20,
        factors: { length: 10, keywords: 10, patterns: 20, context: 0, language: 30 },
        recommendation: 'local',
        confidence: 0.8,
      };
      
      const optimized = QueryComplexityAnalyzer.optimizeQuery(query, complexity);
      expect(optimized).toBe(query);
    });

    it('should remove extra spaces', () => {
      const query = '서버   상태     확인';
      const complexity: ComplexityScore = {
        score: 40,
        factors: { length: 30, keywords: 40, patterns: 40, context: 0, language: 30 },
        recommendation: 'hybrid',
        confidence: 0.8,
      };
      
      const optimized = QueryComplexityAnalyzer.optimizeQuery(query, complexity);
      expect(optimized).toBe('서버 상태 확인');
    });

    it('should remove duplicate words', () => {
      const query = '서버 서버 상태 상태 확인 확인';
      const complexity: ComplexityScore = {
        score: 50,
        factors: { length: 40, keywords: 50, patterns: 50, context: 0, language: 30 },
        recommendation: 'hybrid',
        confidence: 0.8,
      };
      
      const optimized = QueryComplexityAnalyzer.optimizeQuery(query, complexity);
      expect(optimized).toBe('서버 상태 확인');
    });

    it('should handle edge cases', () => {
      const complexity: ComplexityScore = {
        score: 40,
        factors: { length: 30, keywords: 40, patterns: 40, context: 0, language: 30 },
        recommendation: 'hybrid',
        confidence: 0.8,
      };
      
      expect(QueryComplexityAnalyzer.optimizeQuery('', complexity)).toBe('');
      expect(QueryComplexityAnalyzer.optimizeQuery('  ', complexity)).toBe('');
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle very long queries', () => {
      const longQuery = '서버 '.repeat(100) + '분석';
      const result = QueryComplexityAnalyzer.analyze(longQuery);
      
      expect(result.factors.length).toBe(90);
      expect(result.score).toBeDefined();
    });

    it('should handle queries with only special characters', () => {
      const result = QueryComplexityAnalyzer.analyze('!@#$%^&*()');
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.factors.language).toBeGreaterThan(30);
    });

    it('should handle queries with multiple languages', () => {
      const result = QueryComplexityAnalyzer.analyze(
        'Why serverの 성능が lowですか?'  // Chinese replaced with English
      );
      
      expect(result.factors.language).toBeGreaterThan(50);
    });

    it('should handle queries with code snippets', () => {
      const result = QueryComplexityAnalyzer.analyze(
        'const server = new Server(); server.start(); 이 코드의 문제점은?'
      );
      
      expect(result.factors.language).toBeGreaterThan(50);
      expect(result.score).toBeGreaterThan(25);
    });

    it('should handle recommendation edge cases', () => {
      // Very low patterns and context should recommend local
      const result1 = QueryComplexityAnalyzer.analyze('서버 목록');
      expect(result1.recommendation).toBe('local');
      
      // Score exactly at 70 should recommend google-ai
      const complexQuery = '왜 ' + '분석 '.repeat(20) + '예측 추천';
      const result2 = QueryComplexityAnalyzer.analyze(complexQuery);
      if (result2.score >= 70) {
        expect(result2.recommendation).toBe('google-ai');
      }
    });

    it('should calculate factors correctly for all components', () => {
      const result = QueryComplexityAnalyzer.analyze(
        '왜 서버의 CPU와 memory 사용률이 높아졌는지 분석하고 해결책을 제안해주세요?',
        {
          previousQueries: ['서버 상태', 'CPU 확인'],
          hasServerData: true,
        }
      );
      
      expect(result.factors).toHaveProperty('length');
      expect(result.factors).toHaveProperty('keywords');
      expect(result.factors).toHaveProperty('patterns');
      expect(result.factors).toHaveProperty('context');
      expect(result.factors).toHaveProperty('language');
      
      // All factors should be numbers between 0 and 100
      Object.values(result.factors).forEach(factor => {
        expect(typeof factor).toBe('number');
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThanOrEqual(100);
      });
    });
  });
});