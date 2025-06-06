/**
 * MCP 서버 헬스체커
 *
 * ✅ MCP 서버 상태를 주기적으로 확인
 * ✅ 실패 횟수 기반 헬스 상태 판단
 */

export interface HealthStatus {
  healthy: boolean;
  consecutiveFailures: number;
  lastSuccessTime: Date;
  timeSinceLastSuccess: number;
}

export class MCPHealthChecker {
  private failureCount = 0;
  private lastSuccessTime = Date.now();
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 3;
  private readonly FAILURE_WINDOW = 60_000; // 1분

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch('/api/mcp/health', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        this.recordSuccess();
        return true;
      }

      this.recordFailure();
      return false;
    } catch {
      this.recordFailure();
      return false;
    }
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
  }

  recordFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    console.warn(
      `⚠️ MCP 건강성 체크 실패 (연속 ${this.consecutiveFailures}회)`
    );
  }

  isHealthy(): boolean {
    const now = Date.now();
    const timeSinceLastSuccess = now - this.lastSuccessTime;
    return (
      this.consecutiveFailures < this.MAX_FAILURES &&
      timeSinceLastSuccess < this.FAILURE_WINDOW
    );
  }

  getHealthStatus(): HealthStatus {
    return {
      healthy: this.isHealthy(),
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: new Date(this.lastSuccessTime),
      timeSinceLastSuccess: Date.now() - this.lastSuccessTime,
    };
  }
}
