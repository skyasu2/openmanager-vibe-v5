// ML 라이브러리 타입 선언
declare module 'ml-regression' {
  export class SimpleLinearRegression {
    constructor(x: number[], y: number[]);
    slope: number;
    intercept: number;
    predict(x: number): number;
    coefficientOfDetermination(x: number[], y: number[]): number;
  }
}

declare module 'ml-matrix' {
  export class Matrix {
    constructor(data: number[][]);
    static from1DArray(rows: number, cols: number, data: number[]): Matrix;
    static from2DArray(data: number[][]): Matrix;
    static eye(rows: number, cols?: number): Matrix;
    static zeros(rows: number, cols: number): Matrix;
    static ones(rows: number, cols: number): Matrix;
    
    // 기본 행렬 연산
    mmul(other: Matrix): Matrix;
    transpose(): Matrix;
    inverse(): Matrix;
    det(): number;
    
    // 접근자
    get(row: number, col: number): number;
    set(row: number, col: number, value: number): Matrix;
    
    // 차원
    rows: number;
    columns: number;
    
    // 배열 변환
    to1DArray(): number[];
    to2DArray(): number[][];
  }
} 