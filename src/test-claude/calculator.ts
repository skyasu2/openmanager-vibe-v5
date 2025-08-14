// 🟢 GREEN: 테스트를 통과시키는 최소 구현
import type { Calculator, CalculatorHistory, CalculatorResult, OperationType } from './calculator.types';

class CalculatorHistoryImpl implements CalculatorHistory {
  results: CalculatorResult[] = [];

  addResult(result: CalculatorResult): void {
    this.results.push(result);
  }

  clearHistory(): void {
    this.results = [];
  }

  getLastResult(): CalculatorResult | undefined {
    return this.results[this.results.length - 1];
  }
}

export class BasicCalculator implements Calculator {
  private history: CalculatorHistory;

  constructor() {
    this.history = new CalculatorHistoryImpl();
  }

  add(a: number, b: number): number {
    const value = a + b;
    this.history.addResult({
      value,
      operation: 'add',
      timestamp: new Date()
    });
    return value;
  }

  subtract(a: number, b: number): number {
    const value = a - b;
    this.history.addResult({
      value,
      operation: 'subtract',
      timestamp: new Date()
    });
    return value;
  }

  multiply(a: number, b: number): number {
    const value = a * b;
    this.history.addResult({
      value,
      operation: 'multiply',
      timestamp: new Date()
    });
    return value;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const value = a / b;
    this.history.addResult({
      value,
      operation: 'divide',
      timestamp: new Date()
    });
    return value;
  }

  getHistory(): CalculatorHistory {
    return this.history;
  }
}