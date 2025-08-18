/**
 * 📊 Mock 통계 수집기
 *
 * Mock 서비스의 사용 통계를 수집하고 관리
 */

export class MockStats {
  private name: string;
  private stats = {
    totalOperations: 0,
    operationCounts: new Map<string, number>(),
    errorCounts: new Map<string, number>(),
    durations: new Map<string, number[]>(),
    startTime: Date.now(),
  };

  constructor(name: string) {
    this.name = name;
  }

  /**
   * 작업 기록
   */
  recordOperation(operation: string): void {
    this.stats.totalOperations++;
    const current = this.stats.operationCounts.get(operation) || 0;
    this.stats.operationCounts.set(operation, current + 1);
  }

  /**
   * 에러 기록
   */
  recordError(operation: string): void {
    const current = this.stats.errorCounts.get(operation) || 0;
    this.stats.errorCounts.set(operation, current + 1);
  }

  /**
   * 실행 시간 기록
   */
  recordDuration(operation: string, duration: number): void {
    const durations = this.stats.durations.get(operation) || [];
    durations.push(duration);
    this.stats.durations.set(operation, durations);
  }

  /**
   * 통계 조회
   */
  getStats(): Record<string, any> {
    const uptime = Date.now() - this.stats.startTime;
    const operations: Record<string, any> = {};

    // 작업별 통계 계산
    for (const [op, count] of this.stats.operationCounts.entries()) {
      const errors = this.stats.errorCounts.get(op) || 0;
      const durations = this.stats.durations.get(op) || [];
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

      operations[op] = {
        count,
        errors,
        errorRate: count > 0 ? (errors / count) * 100 : 0,
        avgDuration: Math.round(avgDuration),
      };
    }

    return {
      name: this.name,
      uptime,
      totalOperations: this.stats.totalOperations,
      operations,
      startTime: new Date(this.stats.startTime).toISOString(),
    };
  }

  /**
   * 통계 리셋
   */
  reset(): void {
    this.stats = {
      totalOperations: 0,
      operationCounts: new Map(),
      errorCounts: new Map(),
      durations: new Map(),
      startTime: Date.now(),
    };
  }
}
