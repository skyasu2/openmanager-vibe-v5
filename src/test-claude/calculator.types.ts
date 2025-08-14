// 📌 Step 1: 타입 먼저 정의 (CLAUDE.md 규칙)
export interface Calculator {
  add: (a: number, b: number) => number;
  subtract: (a: number, b: number) => number;
  multiply: (a: number, b: number) => number;
  divide: (a: number, b: number) => number | never;
}

export interface CalculatorResult {
  value: number;
  operation: OperationType;
  timestamp: Date;
}

export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalculatorHistory {
  results: CalculatorResult[];
  addResult: (result: CalculatorResult) => void;
  clearHistory: () => void;
  getLastResult: () => CalculatorResult | undefined;
}