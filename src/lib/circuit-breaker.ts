/**
 * 🔄 Circuit Breaker Pattern Implementation
 *
 * GCP VM 통신 실패 시 자동 차단 및 복구를 위한 Circuit Breaker 패턴
 *
 * AI 교차 검증 기반:
 * - Codex: Circuit Breaker 패턴, 지수 백오프, 자동 복구
 * - Gemini: 3단계 폴백, 실패율 기반 차단
 * - Qwen: 적응형 타임아웃, 성능 최적화
 *
 * 상태:
 * - CLOSED: 정상 동작, 모든 요청 허용
 * - OPEN: 차단 상태, 모든 요청 거부 (폴백 실행)
 * - HALF_OPEN: 테스트 상태, 제한된 요청만 허용
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // 실패 임계값 (기본: 5회)
  recoveryTimeout: number; // 복구 대기 시간 (기본: 30초)
  requestTimeout: number; // 요청 타임아웃 (기본: 5초)
  halfOpenMaxCalls: number; // HALF_OPEN 시 최대 테스트 요청 수
  successThreshold: number; // HALF_OPEN → CLOSED 전환을 위한 성공 임계값
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  rejectedCount: number;
  lastFailureTime: number | null;
  nextRetryTime: number | null;
  averageResponseTime: number;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  fallback?: boolean;
  responseTime?: number;
  circuitState: CircuitBreakerState;
}

/**
 * Circuit Breaker 클래스
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private rejectedCount = 0;
  private lastFailureTime: number | null = null;
  private nextRetryTime: number | null = null;
  private halfOpenCallCount = 0;
  private responseTimes: number[] = [];

  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 3, // 🔄 개발 환경 고려: 3회 실패 후 차단
      recoveryTimeout: 2 * 60 * 1000, // 🔄 개발 환경 고려: 2분 후 복구 시도
      requestTimeout: 8 * 1000, // 🔄 개발 환경 고려: 8초 타임아웃 (Cloud Run 응답 고려)
      halfOpenMaxCalls: 2, // 🔄 개발 환경 고려: 2개 테스트 요청
      successThreshold: 1, // 🔄 1회 성공으로 복구 (유지)
      ...config,
    };
  }

  /**
   * 요청 실행 (Circuit Breaker 보호)
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    this.totalRequests++;
    const startTime = Date.now();

    // OPEN 상태: 모든 요청 차단
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < (this.nextRetryTime || 0)) {
        this.rejectedCount++;

        if (fallback) {
          try {
            const fallbackData = await fallback();
            return {
              success: true,
              data: fallbackData,
              fallback: true,
              circuitState: this.state,
            };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError as Error,
              fallback: true,
              circuitState: this.state,
            };
          }
        }

        return {
          success: false,
          error: new Error('Circuit breaker is OPEN'),
          circuitState: this.state,
        };
      } else {
        // 복구 시간 도달 → HALF_OPEN으로 전환
        this.state = CircuitBreakerState.HALF_OPEN;
        this.halfOpenCallCount = 0;
        console.log('🔄 Circuit Breaker: OPEN → HALF_OPEN 전환');
      }
    }

    // HALF_OPEN 상태: 제한된 테스트 요청만 허용
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.rejectedCount++;

        if (fallback) {
          try {
            const fallbackData = await fallback();
            return {
              success: true,
              data: fallbackData,
              fallback: true,
              circuitState: this.state,
            };
          } catch (fallbackError) {
            return {
              success: false,
              error: fallbackError as Error,
              fallback: true,
              circuitState: this.state,
            };
          }
        }

        return {
          success: false,
          error: new Error('Circuit breaker HALF_OPEN limit reached'),
          circuitState: this.state,
        };
      }
      this.halfOpenCallCount++;
    }

    // 요청 실행 (타임아웃 적용)
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Request timeout')),
          this.config.requestTimeout
        );
      });

      const data = await Promise.race([operation(), timeoutPromise]);
      const responseTime = Date.now() - startTime;

      // 성공 처리
      this.onSuccess(responseTime);

      return {
        success: true,
        data,
        responseTime,
        circuitState: this.state,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 실패 처리
      this.onFailure();

      // 폴백 실행
      if (fallback) {
        try {
          const fallbackData = await fallback();
          return {
            success: true,
            data: fallbackData,
            error: error as Error,
            fallback: true,
            responseTime,
            circuitState: this.state,
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: fallbackError as Error,
            fallback: true,
            responseTime,
            circuitState: this.state,
          };
        }
      }

      return {
        success: false,
        error: error as Error,
        responseTime,
        circuitState: this.state,
      };
    }
  }

  /**
   * 성공 처리
   */
  private onSuccess(responseTime: number): void {
    this.successCount++;
    this.failureCount = 0; // 연속 실패 카운트 리셋
    this.responseTimes.push(responseTime);

    // 응답 시간 배열 크기 제한 (최근 100개만 유지)
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // HALF_OPEN → CLOSED 전환 조건 확인
      const consecutiveSuccesses = this.halfOpenCallCount;
      if (consecutiveSuccesses >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.halfOpenCallCount = 0;
        console.log('✅ Circuit Breaker: HALF_OPEN → CLOSED 전환 (복구 완료)');
      }
    }
  }

  /**
   * 실패 처리
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // HALF_OPEN에서 실패 시 즉시 OPEN으로 전환
      this.state = CircuitBreakerState.OPEN;
      this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
      console.log('❌ Circuit Breaker: HALF_OPEN → OPEN 전환 (테스트 실패)');
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // CLOSED에서 실패 임계값 확인
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
        console.log(
          `🚨 Circuit Breaker: CLOSED → OPEN 전환 (${this.failureCount}회 연속 실패)`
        );
      }
    }
  }

  /**
   * 적응형 타임아웃 계산 (Qwen 제안)
   */
  getAdaptiveTimeout(): number {
    if (this.responseTimes.length === 0) {
      return this.config.requestTimeout;
    }

    const avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // 평균 응답 시간의 3배, 최소 2초, 최대 10초
    const adaptiveTimeout = Math.min(
      Math.max(avgResponseTime * 3, 2000),
      10000
    );

    return adaptiveTimeout;
  }

  /**
   * Circuit Breaker 통계 정보
   */
  getStats(): CircuitBreakerStats {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;

    return {
      state: this.state,
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      rejectedCount: this.rejectedCount,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.nextRetryTime,
      averageResponseTime: Math.round(avgResponseTime),
    };
  }

  /**
   * Circuit Breaker 강제 리셋
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.rejectedCount = 0;
    this.lastFailureTime = null;
    this.nextRetryTime = null;
    this.halfOpenCallCount = 0;
    this.responseTimes = [];

    console.log('🔄 Circuit Breaker 리셋됨');
  }

  /**
   * Circuit Breaker 상태 확인
   */
  isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }
}

/**
 * 전역 Circuit Breaker 인스턴스 (GCP VM용)
 */
export const gcpVmCircuitBreaker = new CircuitBreaker({
  failureThreshold: 2, // 🚨 무료티어 보호: 2회 연속 실패
  recoveryTimeout: 10 * 60 * 1000, // 🚨 무료티어 보호: 10분 복구 대기
  requestTimeout: 3 * 1000, // 🚨 무료티어 보호: 3초 타임아웃
  halfOpenMaxCalls: 1, // 🚨 무료티어 보호: 1개 테스트 요청
  successThreshold: 1, // 🚨 무료티어 보호: 1회 성공 시 복구
});

/**
 * Circuit Breaker 헬퍼 함수
 */
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<CircuitBreakerResult<T>> {
  return gcpVmCircuitBreaker.execute(operation, fallback);
}

/**
 * Circuit Breaker 상태 모니터링 유틸리티
 */
export function monitorCircuitBreaker() {
  const stats = gcpVmCircuitBreaker.getStats();

  console.log('📊 Circuit Breaker 상태:', {
    state: stats.state,
    successRate:
      stats.totalRequests > 0
        ? `${Math.round((stats.successCount / stats.totalRequests) * 100)}%`
        : 'N/A',
    totalRequests: stats.totalRequests,
    failures: stats.failureCount,
    rejected: stats.rejectedCount,
    avgResponseTime: `${stats.averageResponseTime}ms`,
    nextRetry: stats.nextRetryTime
      ? new Date(stats.nextRetryTime).toISOString()
      : null,
  });

  return stats;
}

export default CircuitBreaker;
