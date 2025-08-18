// ♻️ REFACTOR: 코드 개선 (DRY 원칙 적용)
import type {
  Calculator,
  CalculatorHistory,
  CalculatorResult,
  OperationType,
} from './calculator.types';

class CalculatorHistoryImpl implements CalculatorHistory {
  results: CalculatorResult[] = [];

  addResult(result: CalculatorResult): void {
    this.results.push(result);
  }

  clearHistory(): void {
    this.results.length = 0; // 더 효율적
  }

  getLastResult(): CalculatorResult | undefined {
    return this.results.at(-1); // 더 간결한 표현
  }
}

export class ImprovedCalculator implements Calculator {
  private readonly history: CalculatorHistory;

  // 연산 로직을 매핑으로 분리 (DRY)
  private readonly operations: Record<
    OperationType,
    (a: number, b: number) => number
  > = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    },
  };

  constructor() {
    this.history = new CalculatorHistoryImpl();
  }

  // 중복 제거: 공통 연산 메서드
  private performOperation(
    operation: OperationType,
    a: number,
    b: number
  ): number {
    const value = this.operations[operation](a, b);

    this.history.addResult({
      value,
      operation,
      timestamp: new Date(),
    });

    return value;
  }

  add(a: number, b: number): number {
    return this.performOperation('add', a, b);
  }

  subtract(a: number, b: number): number {
    return this.performOperation('subtract', a, b);
  }

  multiply(a: number, b: number): number {
    return this.performOperation('multiply', a, b);
  }

  divide(a: number, b: number): number {
    return this.performOperation('divide', a, b);
  }

  getHistory(): CalculatorHistory {
    return this.history;
  }
}
