import { describe, it, expect } from 'vitest';
import { validateQuery } from '../src/utils/validation.js';

describe('validateQuery', () => {
  it('should accept valid queries', () => {
    expect(() => validateQuery('Valid query')).not.toThrow();
    expect(() => validateQuery('Query with numbers 123')).not.toThrow();
    expect(() => validateQuery('한글 쿼리도 가능')).not.toThrow();
  });

  it('should reject empty queries', () => {
    expect(() => validateQuery('')).toThrow('Query cannot be empty');
    expect(() => validateQuery('   ')).toThrow('Query cannot be empty');
  });

  it('should reject queries that are too long', () => {
    const longQuery = 'a'.repeat(2501);
    expect(() => validateQuery(longQuery)).toThrow(/Query too long/);
  });

  it('should reject queries with dangerous characters', () => {
    // $ (variable substitution), control characters still blocked
    expect(() => validateQuery('test$variable')).toThrow('Query contains dangerous characters');
    expect(() => validateQuery('test;command')).toThrow('Query contains dangerous characters');
    expect(() => validateQuery('test&command')).toThrow('Query contains dangerous characters');
    expect(() => validateQuery('test|command')).toThrow('Query contains dangerous characters');
    expect(() => validateQuery('test\x00null')).toThrow('Query contains dangerous characters');
  });

  it('should accept queries with safe special characters', () => {
    expect(() => validateQuery('test-query')).not.toThrow();
    expect(() => validateQuery('test_query')).not.toThrow();
    expect(() => validateQuery('test.query')).not.toThrow();
    expect(() => validateQuery('test@query')).not.toThrow();
    expect(() => validateQuery('test#query')).not.toThrow();
    expect(() => validateQuery('test?query')).not.toThrow();
    expect(() => validateQuery('test!query')).not.toThrow();
    // Backticks are now allowed for code blocks (execFile prevents shell injection)
    expect(() => validateQuery('test`command`')).not.toThrow();
    expect(() => validateQuery('explain `const x = 42`')).not.toThrow();
  });
});
