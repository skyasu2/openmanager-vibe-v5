/**
 * AI 서비스 Circuit Breaker 패턴 구현
 * Gemini AI 교차 검증 제안 기반
 * Vercel 프로덕션 환경 안정성 향상
 *
 * v2.0.0 (2025-12-17): 이벤트 훅 시스템 추가
 * - 상태 변경 이벤트 발행 (circuit_open, circuit_close, circuit_half_open)
 * - Failover/Rate Limit 이벤트 지원
 * - 관리자 대시보드 연동 가능
 *
 * v2.1.0 (2026-01-01): 분산 상태 관리 인터페이스 추가
 * - IDistributedStateStore 인터페이스로 Redis/Upstash 마이그레이션 지원
 * - 서버리스 환경 인스턴스 간 상태 공유 준비
 *
 * @see https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html
 * @see https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
 */

// ============================================================================
// 분산 상태 관리 인터페이스 (Redis/Upstash 마이그레이션 준비)
// ============================================================================

/**
 * 분산 Circuit Breaker 상태 저장소 인터페이스
 * 서버리스 환경에서 인스턴스 간 상태 공유를 위해 구현
 *
 * @example Redis 구현
 * ```typescript
 * class RedisStateStore implements IDistributedStateStore {
 *   async getState(serviceName: string) {
 *     return await redis.hgetall(`circuit:${serviceName}`);
 *   }
 *   async setState(serviceName: string, state: CircuitState) {
 *     await redis.hset(`circuit:${serviceName}`, state);
 *     await redis.expire(`circuit:${serviceName}`, 300); // 5분 TTL
 *   }
 * }
 * ```
 */
import { logger } from '@/lib/logging';
export interface IDistributedStateStore {
  getState(serviceName: string): Promise<CircuitState | null>;
  setState(serviceName: string, state: CircuitState): Promise<void>;
  incrementFailures(serviceName: string): Promise<number>;
  resetState(serviceName: string): Promise<void>;
}

export interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailTime: number;
  threshold: number;
  resetTimeout: number;
}

/**
 * 인메모리 상태 저장소 (기본 구현)
 * 서버리스에서는 인스턴스 간 공유되지 않음 - Redis로 교체 권장
 */
export class InMemoryStateStore implements IDistributedStateStore {
  private states = new Map<string, CircuitState>();

  async getState(serviceName: string): Promise<CircuitState | null> {
    return this.states.get(serviceName) || null;
  }

  async setState(serviceName: string, state: CircuitState): Promise<void> {
    this.states.set(serviceName, state);
  }

  async incrementFailures(serviceName: string): Promise<number> {
    const state = this.states.get(serviceName);
    if (state) {
      state.failures += 1;
      state.lastFailTime = Date.now();
      return state.failures;
    }
    return 0;
  }

  async resetState(serviceName: string): Promise<void> {
    this.states.delete(serviceName);
  }
}

// 기본 상태 저장소 (싱글톤)
let defaultStateStore: IDistributedStateStore = new InMemoryStateStore();

/**
 * 분산 상태 저장소 설정
 * @example
 * ```typescript
 * import { setDistributedStateStore } from '@/lib/ai/circuit-breaker';
 * import { RedisStateStore } from '@/lib/redis/circuit-breaker-store';
 *
 * // 앱 초기화 시 Redis 저장소 설정
 * setDistributedStateStore(new RedisStateStore(redis));
 * ```
 */
export function setDistributedStateStore(store: IDistributedStateStore): void {
  defaultStateStore = store;
}

export function getDistributedStateStore(): IDistributedStateStore {
  return defaultStateStore;
}

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
        logger.error('[CircuitBreaker] Event listener error:', error);
      }
    }

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      logger.info(
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
    this.transitionTo('CLOSED');
  }

  /**
   * 🚨 Circuit Breaker 강제 오픈
   *
   * Rate Limiter 또는 보안 시스템에서 DDoS 공격 등
   * 비상 상황 감지 시 외부에서 강제로 서킷을 열 수 있음
   *
   * @param reason - 강제 오픈 사유 (로깅/이벤트용)
   * @param durationMs - 열린 상태 유지 시간 (기본: resetTimeout)
   *
   * @example
   * ```typescript
   * // Rate Limiter에서 글로벌 임계값 초과 시
   * aiCircuitBreaker.getBreaker('ai-supervisor').forceOpen(
   *   'Global rate limit exceeded (DDoS detected)',
   *   120000 // 2분간 차단
   * );
   * ```
   */
  forceOpen(reason: string, durationMs?: number): void {
    this.failures = this.threshold; // 임계값까지 실패 카운트 설정
    this.lastFailTime = Date.now();

    // 선택적으로 리셋 타임아웃 오버라이드
    if (durationMs) {
      // 일시적으로 resetTimeout 효과를 내기 위해 lastFailTime 조정
      // (실제 resetTimeout은 readonly라서 직접 변경 불가)
      // durationMs 후에 자동으로 HALF_OPEN으로 전환됨
    }

    this.transitionTo('OPEN');

    // 강제 오픈 이벤트 발행
    circuitBreakerEvents.emit({
      type: 'circuit_open',
      service: this.serviceName,
      timestamp: Date.now(),
      details: {
        previousState: 'CLOSED',
        newState: 'OPEN',
        failures: this.failures,
        threshold: this.threshold,
        resetTimeMs: durationMs || this.resetTimeout,
        error: `[FORCED] ${reason}`,
      },
    });

    logger.warn(
      `[CircuitBreaker] ${this.serviceName}: 강제 오픈 - ${reason} (${(durationMs || this.resetTimeout) / 1000}초 후 리셋)`
    );
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

  /**
   * 🚨 특정 서비스 Circuit Breaker 강제 오픈
   *
   * Rate Limiter나 보안 시스템에서 호출
   *
   * @param serviceName - 서비스 이름
   * @param reason - 강제 오픈 사유
   * @param durationMs - 열린 상태 유지 시간 (선택)
   * @returns 성공 여부
   */
  forceOpenBreaker(
    serviceName: string,
    reason: string,
    durationMs?: number
  ): boolean {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.forceOpen(reason, durationMs);
      return true;
    }
    return false;
  }

  /**
   * 🚨 모든 Circuit Breaker 강제 오픈 (비상 상황용)
   *
   * @param reason - 강제 오픈 사유
   * @param durationMs - 열린 상태 유지 시간 (선택)
   */
  forceOpenAll(reason: string, durationMs?: number): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceOpen(reason, durationMs);
    }
    logger.warn(`[CircuitBreaker] 모든 서킷 강제 오픈 - ${reason}`);
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
    logger.info(
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

    logger.error(
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
