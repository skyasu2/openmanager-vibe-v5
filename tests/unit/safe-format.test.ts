import { describe, expect, it } from 'vitest';
import {
  extractDaysFromUptime,
  isValidString,
  safeArrayAccess,
  safeFormatUptime,
  safeIncludes,
  safeJsonParse,
  safeNumber,
  safePercentage,
  safePropertyAccess,
} from '../../src/utils/safeFormat';

describe('safeFormat', () => {
  describe('safeFormatUptime', () => {
    it('should format uptime correctly', () => {
      expect(safeFormatUptime(86400)).toBe('1일 0시간'); // 1 day
      expect(safeFormatUptime(3600)).toBe('1시간 0분'); // 1 hour
      expect(safeFormatUptime(60)).toBe('1분'); // 1 minute
      expect(safeFormatUptime(0)).toBe('0일');
    });

    it('should handle string uptimes', () => {
      expect(safeFormatUptime('2h 30m')).toBe('2h 30m');
      expect(safeFormatUptime('  valid uptime  ')).toBe('valid uptime');
      expect(safeFormatUptime('')).toBe('N/A');
    });

    it('should handle invalid values', () => {
      expect(safeFormatUptime(null)).toBe('N/A');
      expect(safeFormatUptime(undefined)).toBe('N/A');
      expect(safeFormatUptime(-100)).toBe('0일');
    });
  });

  describe('extractDaysFromUptime', () => {
    it('should extract days from uptime strings', () => {
      expect(extractDaysFromUptime('5 days')).toBe(5);
      expect(extractDaysFromUptime('3일')).toBe(3);
      expect(extractDaysFromUptime('10 days ago')).toBe(10);
    });

    it('should extract days from numeric values', () => {
      expect(extractDaysFromUptime(86400)).toBe(1); // 1 day in seconds
      expect(extractDaysFromUptime(172800)).toBe(2); // 2 days in seconds
    });

    it('should handle invalid values', () => {
      expect(extractDaysFromUptime(null)).toBe(0);
      expect(extractDaysFromUptime(undefined)).toBe(0);
      expect(extractDaysFromUptime('invalid')).toBe(0);
    });
  });

  describe('isValidString', () => {
    it('should validate strings correctly', () => {
      expect(isValidString('hello')).toBe(true);
      expect(isValidString('  valid  ')).toBe(true);
      expect(isValidString('')).toBe(false);
      expect(isValidString('   ')).toBe(false);
      expect(isValidString(null)).toBe(false);
      expect(isValidString(undefined)).toBe(false);
      expect(isValidString(123)).toBe(false);
    });
  });

  describe('safeIncludes', () => {
    it('should safely check includes', () => {
      expect(safeIncludes('hello world', 'world')).toBe(true);
      expect(safeIncludes('hello world', 'xyz')).toBe(false);
      expect(safeIncludes(null, 'test')).toBe(false);
      expect(safeIncludes(undefined, 'test')).toBe(false);
      expect(safeIncludes(123, 'test')).toBe(false);
    });
  });

  describe('safeArrayAccess', () => {
    it('should safely access array elements', () => {
      const arr = ['a', 'b', 'c'];
      expect(safeArrayAccess(arr, 0, 'default')).toBe('a');
      expect(safeArrayAccess(arr, 1, 'default')).toBe('b');
      expect(safeArrayAccess(arr, 5, 'default')).toBe('default');
      expect(safeArrayAccess(arr, -1, 'default')).toBe('default');
    });

    it('should handle invalid arrays', () => {
      expect(safeArrayAccess(null, 0, 'default')).toBe('default');
      expect(safeArrayAccess(undefined, 0, 'default')).toBe('default');
      expect(safeArrayAccess('not array', 0, 'default')).toBe('default');
    });
  });

  describe('safePropertyAccess', () => {
    it('should safely access object properties', () => {
      const obj = {
        user: {
          name: 'John',
          profile: {
            age: 30,
          },
        },
      };

      expect(safePropertyAccess(obj, 'user.name', 'default')).toBe('John');
      expect(safePropertyAccess(obj, 'user.profile.age', 0)).toBe(30);
      expect(safePropertyAccess(obj, 'user.nonexistent', 'default')).toBe(
        'default'
      );
      expect(safePropertyAccess(obj, 'nonexistent.property', 'default')).toBe(
        'default'
      );
    });

    it('should handle invalid objects', () => {
      expect(safePropertyAccess(null, 'property', 'default')).toBe('default');
      expect(safePropertyAccess(undefined, 'property', 'default')).toBe(
        'default'
      );
      expect(safePropertyAccess('not object', 'property', 'default')).toBe(
        'default'
      );
    });
  });

  describe('safeJsonParse', () => {
    it('should safely parse JSON', () => {
      expect(safeJsonParse('{"name": "John"}', {})).toEqual({ name: 'John' });
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    });

    it('should handle invalid JSON', () => {
      expect(safeJsonParse('invalid json', 'fallback')).toBe('fallback');
      expect(safeJsonParse(null, 'fallback')).toBe('fallback');
      expect(safeJsonParse(undefined, 'fallback')).toBe('fallback');
    });
  });

  describe('safeNumber', () => {
    it('should safely convert numbers', () => {
      expect(safeNumber(123)).toBe(123);
      expect(safeNumber(123.45)).toBe(123.45);
      expect(safeNumber('123')).toBe(123);
      expect(safeNumber('123.45')).toBe(123.45);
    });

    it('should handle invalid values with fallback', () => {
      expect(safeNumber(NaN, 100)).toBe(100);
      expect(safeNumber('invalid', 50)).toBe(50);
      expect(safeNumber(null, 25)).toBe(25);
      expect(safeNumber(undefined, 10)).toBe(10);
    });

    it('should use default fallback', () => {
      expect(safeNumber('invalid')).toBe(0);
      expect(safeNumber(null)).toBe(0);
    });
  });

  describe('safePercentage', () => {
    it('should format percentages safely', () => {
      expect(safePercentage(75)).toBe('75%');
      expect(safePercentage(0.5, true)).toBe('50%');
      expect(safePercentage(125)).toBe('125%');
    });

    it('should handle invalid values', () => {
      expect(safePercentage(null)).toBe('0%');
      expect(safePercentage(undefined)).toBe('0%');
      expect(safePercentage('invalid')).toBe('0%');
    });
  });
});
