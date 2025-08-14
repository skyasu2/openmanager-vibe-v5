// 🔴 RED: 실패하는 테스트 먼저 작성 (CLAUDE.md TDD 규칙)
// @tdd-red @created-date: 2025-01-14
import { describe, it, expect, beforeEach } from 'vitest';
import { BasicCalculator } from './calculator';
import type { Calculator, CalculatorHistory, CalculatorResult } from './calculator.types';

describe('Calculator - TDD 테스트', () => {
  let calculator: Calculator;
  let history: CalculatorHistory;

  beforeEach(() => {
    calculator = new BasicCalculator();
    history = calculator.getHistory();
  });

  // @tdd-red
  it('should add two numbers correctly', () => {
    const result = calculator.add(10, 5);
    expect(result).toBe(15);
  });

  // @tdd-red
  it('should handle division by zero', () => {
    expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
  });

  // @tdd-red
  it('should maintain calculation history', () => {
    calculator.add(5, 3);
    calculator.multiply(4, 2);
    
    const lastResult = history.getLastResult();
    expect(lastResult?.value).toBe(8);
    expect(lastResult?.operation).toBe('multiply');
  });

  // @tdd-red
  it('should clear history', () => {
    calculator.add(1, 1);
    calculator.add(2, 2);
    history.clearHistory();
    
    expect(history.getLastResult()).toBeUndefined();
    expect(history.results).toHaveLength(0);
  });
});