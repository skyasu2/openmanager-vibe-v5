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

  it('should only reject null bytes', () => {
    // Only null bytes are dangerous (classic injection technique)
    expect(() => validateQuery('test\x00null')).toThrow('Query contains dangerous characters');
  });

  it('should accept TypeScript code blocks with special characters', () => {
    // $ is allowed (used in template literals, jQuery, etc.)
    expect(() => validateQuery('const price = $100')).not.toThrow();
    expect(() => validateQuery('test$variable')).not.toThrow();
    
    // Semicolons are allowed (TypeScript syntax)
    expect(() => validateQuery('test;command')).not.toThrow();
    expect(() => validateQuery('const x = 1; const y = 2;')).not.toThrow();
    
    // & and | are allowed (bitwise operators, logical operators)
    expect(() => validateQuery('test&command')).not.toThrow();
    expect(() => validateQuery('test|command')).not.toThrow();
    expect(() => validateQuery('a && b || c')).not.toThrow();
    
    // Backticks are allowed (template literals)
    expect(() => validateQuery('test`command`')).not.toThrow();
    expect(() => validateQuery('explain `const x = 42`')).not.toThrow();
    expect(() => validateQuery('const str = `Hello ${name}`')).not.toThrow();
  });

  it('should accept multi-line code blocks', () => {
    const codeBlock = `다음 TypeScript 코드를 분석해주세요:

\`\`\`typescript
function calculateSum(a: number, b: number): number {
  return a + b;
}
\`\`\`

1. 코드 품질 점수
2. 개선 제안`;
    
    expect(() => validateQuery(codeBlock)).not.toThrow();
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
