import { logger } from '../../lib/logger';
/**
 * Circuit Breaker Pattern
 *
 * LLM Provider 장애 시 빠른 실패 및 자동 복구
 *
 * States:
 * - CLOSED: 정상 동작 (요청 통과)
 * - OPEN: 장애 감지 (요청 즉시 실패)
 * - HALF_OPEN: 복구 테스트 (제한된 요청 허용)
 *
 * @version 1.0.0
 */

// ============================================================================
// 1. Types
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** 장애 판정 임계값 (기본: 5회 실패) */
  failureThreshold: number;
  /** 성공 판정 임계값 (HALF_OPEN에서 CLOSED로 전환, 기본: 2회) */
  successThreshold: number;
  /** OPEN 상태 유지 시간 (ms, 기본: 30초) */
  openDuration: number;
  /** 타임아웃 (ms, 기본: 10초) */
  timeout: number;
  /** Provider 이름 (로깅용) */
  name: string;
}

export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalCalls: number;
  totalFailures: number;
}

// ============================================================================
// 2. Circuit Breaker Implementation
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private openedAt?: Date;
  private totalCalls = 0;
  private totalFailures = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      openDuration: 30000, // 30초
      // 타임아웃 체인: Tavily(10s) → Reporter(25s) → Orchestrator(50s) → CB(55s) → Vercel(60s)
      timeout: 55000, // 55초 (Orchestrator 50s + 5s 마진, Vercel 60초 제한 내)
      ...config,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    this.checkStateTransition();

    // Reject immediately if circuit is OPEN
    if (this.state === 'OPEN') {
      const waitTime = this.getWaitTime();
      throw new CircuitOpenError(
        `Circuit breaker ${this.config.name} is OPEN. Retry in ${waitTime}ms`,
        waitTime
      );
    }

    this.totalCalls++;

    try {
      // Execute with timeout
      const result = await this.withTimeout(fn());
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(): boolean {
    this.checkStateTransition();
    return this.state !== 'OPEN';
  }

  /**
   * Get current circuit state and stats
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.openedAt = undefined;
    console.log(`🔄 [CircuitBreaker:${this.config.name}] Manually reset to CLOSED`);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private onSuccess(): void {
    this.lastSuccess = new Date();

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.failures = 0;
        this.successes = 0;
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  private onFailure(error: unknown): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailure = new Date();

    logger.warn(
      `⚠️ [CircuitBreaker:${this.config.name}] Failure ${this.failures}/${this.config.failureThreshold}:`,
      error instanceof Error ? error.message : String(error)
    );

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN transitions back to OPEN
      this.transitionTo('OPEN');
      this.successes = 0;
    } else if (this.state === 'CLOSED') {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  private checkStateTransition(): void {
    if (this.state === 'OPEN' && this.openedAt) {
      const elapsed = Date.now() - this.openedAt.getTime();
      if (elapsed >= this.config.openDuration) {
        this.transitionTo('HALF_OPEN');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === 'OPEN') {
      this.openedAt = new Date();
    }

    console.log(
      `🔌 [CircuitBreaker:${this.config.name}] ${oldState} → ${newState}`
    );
  }

  private getWaitTime(): number {
    if (!this.openedAt) return 0;
    const elapsed = Date.now() - this.openedAt.getTime();
    return Math.max(0, this.config.openDuration - elapsed);
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

// ============================================================================
// 3. Custom Errors
// ============================================================================

export class CircuitOpenError extends Error {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'CircuitOpenError';
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// 4. Provider Circuit Breakers (Singleton Registry)
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a provider
 */
export function getCircuitBreaker(
  provider: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(provider)) {
    circuitBreakers.set(
      provider,
      new CircuitBreaker({
        name: provider,
        ...config,
      })
    );
  }
  return circuitBreakers.get(provider)!;
}

/**
 * Get all circuit breaker stats
 */
export function getAllCircuitStats(): Record<string, CircuitStats> {
  const stats: Record<string, CircuitStats> = {};
  circuitBreakers.forEach((breaker, name) => {
    stats[name] = breaker.getStats();
  });
  return stats;
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((breaker) => breaker.reset());
}

// ============================================================================
// 5. Decorator Pattern (for easy integration)
// ============================================================================

/**
 * Wrap a function with circuit breaker protection
 */
export function withCircuitBreaker<T extends unknown[], R>(
  provider: string,
  fn: (...args: T) => Promise<R>,
  config?: Partial<CircuitBreakerConfig>
): (...args: T) => Promise<R> {
  const breaker = getCircuitBreaker(provider, config);

  return async (...args: T): Promise<R> => {
    return breaker.execute(() => fn(...args));
  };
}
