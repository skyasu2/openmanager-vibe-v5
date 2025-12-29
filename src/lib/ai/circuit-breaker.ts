/**
 * AI 서비스 Circuit Breaker 패턴 구현
 * Gemini AI 교차 검증 제안 기반
 * Vercel 프로덕션 환경 안정성 향상
 *
 * v2.0.0 (2025-12-17): 이벤트 훅 시스템 추가
 * - 상태 변경 이벤트 발행 (circuit_open, circuit_close, circuit_half_open)
 * - Failover/Rate Limit 이벤트 지원
 * - 관리자 대시보드 연동 가능
 */

// ============================================================================
// Circuit Breaker 이벤트 시스템
// ============================================================================

export type CircuitBreakerEventType =
  | 'circuit_open'
  | 'circuit_close'
  | 'circuit_half_open'
  | 'failover'
  | 'rate_limit'
  | 'failure'
  | 'success';

export interface CircuitBreakerEvent {
  type: CircuitBreakerEventType;
  service: string;
  timestamp: number;
  details: {
    previousState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    newState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures?: number;
    threshold?: number;
    resetTimeMs?: number;
    error?: string;
    failoverFrom?: string;
    failoverTo?: string;
  };
}

type CircuitBreakerEventListener = (event: CircuitBreakerEvent) => void;

/**
 * 전역 Circuit Breaker 이벤트 이미터
 * 싱글톤 패턴으로 모든 Circuit Breaker 인스턴스의 이벤트를 중앙 관리
 */
class CircuitBreakerEventEmitter {
  private listeners: CircuitBreakerEventListener[] = [];
  private eventHistory: CircuitBreakerEvent[] = [];
  private readonly maxHistorySize = 100;

  /**
   * 이벤트 리스너 등록
   */
  subscribe(listener: CircuitBreakerEventListener): () => void {
    this.listeners.push(listener);
    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 이벤트 발행
   */
  emit(event: CircuitBreakerEvent): void {
    // 히스토리에 저장
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 모든 리스너에게 전달
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[CircuitBreaker] Event listener error:', error);
      }
    }

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[CircuitBreaker] ${event.type} - ${event.service}:`,
        event.details
      );
    }
  }

  /**
   * 이벤트 히스토리 조회
   */
  getHistory(options?: {
    service?: string;
    type?: CircuitBreakerEventType;
    limit?: number;
  }): CircuitBreakerEvent[] {
    let filtered = [...this.eventHistory];

    if (options?.service) {
      filtered = filtered.filter((e) => e.service === options.service);
    }
    if (options?.type) {
      filtered = filtered.filter((e) => e.type === options.type);
    }
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * 최근 이벤트 조회
   */
  getRecentEvents(count = 10): CircuitBreakerEvent[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// 싱글톤 이벤트 이미터
export const circuitBreakerEvents = new CircuitBreakerEventEmitter();

// ============================================================================
// Circuit Breaker 구현
// ============================================================================

export class AIServiceCircuitBreaker {
  private failures = 0;
  private readonly threshold: number;
  private lastFailTime = 0;
  private readonly resetTimeout: number;
  private readonly serviceName: string;
  private currentState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    serviceName: string,
    threshold = 3,
    resetTimeoutMs = 60000 // 1분
  ) {
    this.serviceName = serviceName;
    this.threshold = threshold;
    this.resetTimeout = resetTimeoutMs;
  }

  /**
   * 상태 전이 및 이벤트 발행
   */
  private transitionTo(newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    if (this.currentState === newState) return;

    const previousState = this.currentState;
    this.currentState = newState;

    // 상태별 이벤트 타입 매핑
    const eventTypeMap = {
      CLOSED: 'circuit_close',
      OPEN: 'circuit_open',
      HALF_OPEN: 'circuit_half_open',
    } as const;

    circuitBreakerEvents.emit({
      type: eventTypeMap[newState],
      service: this.serviceName,
      timestamp: Date.now(),
      details: {
        previousState,
        newState,
        failures: this.failures,
        threshold: this.threshold,
        resetTimeMs: this.resetTimeout,
      },
    });
  }

  /**
   * Circuit Breaker를 통해 함수 실행
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      const remainingTime = Math.ceil(
        (this.resetTimeout - (Date.now() - this.lastFailTime)) / 1000
      );
      throw new Error(
        `${this.serviceName} 서비스가 일시적으로 중단되었습니다. ${remainingTime}초 후 다시 시도해주세요.`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      this.onFailure(errorInstance);

      // 원본 에러에 Circuit Breaker 정보 추가
      const enhancedError = new Error(
        `${this.serviceName} 실행 실패 (${this.failures}/${this.threshold} 실패): ${errorInstance.message}`
      );
      enhancedError.stack = errorInstance.stack;

      throw enhancedError;
    }
  }

  /**
   * Circuit Breaker 상태 확인
   */
  private isOpen(): boolean {
    const isFailureThresholdExceeded = this.failures >= this.threshold;
    const isWithinResetTimeout =
      Date.now() - this.lastFailTime < this.resetTimeout;

    // 리셋 타임아웃이 지났으면 반개방 상태로 전환
    if (isFailureThresholdExceeded && !isWithinResetTimeout) {
      this.failures = this.threshold - 1; // 반개방 상태
      this.transitionTo('HALF_OPEN');
    }

    return isFailureThresholdExceeded && isWithinResetTimeout;
  }

  /**
   * 성공 시 처리
   */
  private onSuccess(): void {
    const wasOpen = this.currentState === 'HALF_OPEN';
    this.failures = 0;
    this.lastFailTime = 0;

    // 반개방 상태에서 성공 시 닫힘으로 전이
    if (wasOpen) {
      this.transitionTo('CLOSED');
    }

    // 성공 이벤트 발행
    circuitBreakerEvents.emit({
      type: 'success',
      service: this.serviceName,
      timestamp: Date.now(),
      details: {
        newState: 'CLOSED',
        failures: 0,
      },
    });
  }

  /**
   * 실패 시 처리
   */
  private onFailure(error?: Error): void {
    this.failures += 1;
    this.lastFailTime = Date.now();

    // 실패 이벤트 발행
    circuitBreakerEvents.emit({
      type: 'failure',
      service: this.serviceName,
      timestamp: Date.now(),
      details: {
        failures: this.failures,
        threshold: this.threshold,
        error: error?.message,
      },
    });

    // 임계값 초과 시 열림 상태로 전이
    if (this.failures >= this.threshold) {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Circuit Breaker 상태 반환
   */
  getStatus(): {
    serviceName: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    threshold: number;
    lastFailTime: number;
    resetTimeRemaining?: number;
  } {
    const now = Date.now();
    const isOpen = this.isOpen();
    const isHalfOpen =
      this.failures >= this.threshold - 1 && this.failures < this.threshold;

    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    if (isOpen) {
      state = 'OPEN';
    } else if (isHalfOpen) {
      state = 'HALF_OPEN';
    } else {
      state = 'CLOSED';
    }

    const result: ReturnType<typeof this.getStatus> = {
      serviceName: this.serviceName,
      state,
      failures: this.failures,
      threshold: this.threshold,
      lastFailTime: this.lastFailTime,
    };

    if (isOpen && this.lastFailTime > 0) {
      result.resetTimeRemaining = Math.max(
        0,
        this.resetTimeout - (now - this.lastFailTime)
      );
    }

    return result;
  }

  /**
   * Circuit Breaker 수동 리셋
   */
  reset(): void {
    this.failures = 0;
    this.lastFailTime = 0;
  }
}

/**
 * AI 서비스별 Circuit Breaker 인스턴스 관리
 */
class AICircuitBreakerManager {
  private breakers = new Map<string, AIServiceCircuitBreaker>();

  /**
   * 서비스별 Circuit Breaker 가져오기 (없으면 생성)
   */
  getBreaker(serviceName: string): AIServiceCircuitBreaker {
    let breaker = this.breakers.get(serviceName);
    if (!breaker) {
      breaker = new AIServiceCircuitBreaker(serviceName);
      this.breakers.set(serviceName, breaker);
    }
    return breaker;
  }

  /**
   * 모든 Circuit Breaker 상태 반환
   */
  getAllStatus() {
    const status: Record<
      string,
      ReturnType<AIServiceCircuitBreaker['getStatus']>
    > = {};

    for (const [serviceName, breaker] of this.breakers.entries()) {
      status[serviceName] = breaker.getStatus();
    }

    return status;
  }

  /**
   * 특정 서비스 Circuit Breaker 리셋
   */
  resetBreaker(serviceName: string): boolean {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  /**
   * 모든 Circuit Breaker 리셋
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// 싱글톤 인스턴스
export const aiCircuitBreaker = new AICircuitBreakerManager();

/**
 * AI 서비스 실행을 위한 편의 함수
 */
export async function executeWithCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>
): Promise<T> {
  const breaker = aiCircuitBreaker.getBreaker(serviceName);
  return breaker.execute(fn);
}

/**
 * 실행 결과 타입 (Primary 또는 Fallback 구분)
 */
export interface ExecutionResult<T> {
  data: T;
  source: 'primary' | 'fallback';
  /** 폴백 사용 시 원본 에러 */
  originalError?: Error;
}

/**
 * Circuit Breaker와 Fallback을 함께 사용하는 실행 함수
 *
 * @description
 * 1. Circuit Breaker가 OPEN이면 즉시 폴백 실행
 * 2. Primary 함수 실행 시도
 * 3. 실패 시 폴백 함수 실행
 *
 * @param serviceName - 서비스 이름 (Circuit Breaker 키)
 * @param primaryFn - 주 실행 함수 (Cloud Run 호출 등)
 * @param fallbackFn - 폴백 함수 (로컬 응답 생성 등)
 * @returns 실행 결과 (데이터 + 소스 정보)
 *
 * @example
 * const result = await executeWithCircuitBreakerAndFallback(
 *   'ai-supervisor',
 *   async () => await callCloudRun(payload),
 *   () => createFallbackResponse('supervisor')
 * );
 *
 * if (result.source === 'fallback') {
 *   // 폴백 응답 처리
 * }
 */
export async function executeWithCircuitBreakerAndFallback<T>(
  serviceName: string,
  primaryFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<ExecutionResult<T>> {
  const breaker = aiCircuitBreaker.getBreaker(serviceName);
  const status = breaker.getStatus();

  // Circuit Breaker가 열려있으면 즉시 폴백 사용
  if (status.state === 'OPEN') {
    console.log(
      `[CircuitBreaker] ${serviceName}: OPEN 상태, 폴백 사용 (${status.resetTimeRemaining}ms 후 리셋)`
    );

    circuitBreakerEvents.emit({
      type: 'failover',
      service: serviceName,
      timestamp: Date.now(),
      details: {
        failoverFrom: 'primary',
        failoverTo: 'fallback',
        error: 'Circuit breaker is OPEN',
      },
    });

    const fallbackData = await fallbackFn();
    return {
      data: fallbackData,
      source: 'fallback',
    };
  }

  // Primary 함수 실행 시도
  try {
    const result = await breaker.execute(primaryFn);
    return {
      data: result,
      source: 'primary',
    };
  } catch (error) {
    const errorInstance =
      error instanceof Error ? error : new Error(String(error));

    console.error(
      `[CircuitBreaker] ${serviceName}: Primary 실패, 폴백 사용 - ${errorInstance.message}`
    );

    // 폴백으로 전환 이벤트 발행
    circuitBreakerEvents.emit({
      type: 'failover',
      service: serviceName,
      timestamp: Date.now(),
      details: {
        failoverFrom: 'primary',
        failoverTo: 'fallback',
        error: errorInstance.message,
      },
    });

    // 폴백 실행
    const fallbackData = await fallbackFn();
    return {
      data: fallbackData,
      source: 'fallback',
      originalError: errorInstance,
    };
  }
}

// ============================================================================
// Failover & Rate Limit 이벤트 유틸리티
// ============================================================================

/**
 * Key Failover 이벤트 발행
 * API 키 전환 시 호출
 */
export function emitKeyFailoverEvent(
  service: string,
  fromKey: string,
  toKey: string,
  reason?: string
): void {
  circuitBreakerEvents.emit({
    type: 'failover',
    service,
    timestamp: Date.now(),
    details: {
      failoverFrom: `key:${fromKey}`,
      failoverTo: `key:${toKey}`,
      error: reason,
    },
  });
}

/**
 * Model Failover 이벤트 발행
 * AI 모델 전환 시 호출
 */
export function emitModelFailoverEvent(
  service: string,
  fromModel: string,
  toModel: string,
  reason?: string
): void {
  circuitBreakerEvents.emit({
    type: 'failover',
    service,
    timestamp: Date.now(),
    details: {
      failoverFrom: `model:${fromModel}`,
      failoverTo: `model:${toModel}`,
      error: reason,
    },
  });
}

/**
 * Rate Limit 이벤트 발행
 * API 호출 제한 발생 시 호출
 */
export function emitRateLimitEvent(
  service: string,
  retryAfterMs?: number
): void {
  circuitBreakerEvents.emit({
    type: 'rate_limit',
    service,
    timestamp: Date.now(),
    details: {
      resetTimeMs: retryAfterMs,
      error: `Rate limit exceeded${retryAfterMs ? `, retry after ${retryAfterMs}ms` : ''}`,
    },
  });
}

/**
 * AI 상태 요약 조회 (대시보드용)
 */
export function getAIStatusSummary(): {
  circuitBreakers: Record<
    string,
    ReturnType<AIServiceCircuitBreaker['getStatus']>
  >;
  recentEvents: CircuitBreakerEvent[];
  stats: {
    totalBreakers: number;
    openBreakers: number;
    totalFailures: number;
    recentFailovers: number;
    recentRateLimits: number;
  };
} {
  const circuitBreakers = aiCircuitBreaker.getAllStatus();
  const recentEvents = circuitBreakerEvents.getRecentEvents(20);

  // 통계 계산
  const breakerValues = Object.values(circuitBreakers);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  return {
    circuitBreakers,
    recentEvents,
    stats: {
      totalBreakers: breakerValues.length,
      openBreakers: breakerValues.filter((b) => b.state === 'OPEN').length,
      totalFailures: breakerValues.reduce((sum, b) => sum + b.failures, 0),
      recentFailovers: recentEvents.filter(
        (e) => e.type === 'failover' && e.timestamp > oneHourAgo
      ).length,
      recentRateLimits: recentEvents.filter(
        (e) => e.type === 'rate_limit' && e.timestamp > oneHourAgo
      ).length,
    },
  };
}
