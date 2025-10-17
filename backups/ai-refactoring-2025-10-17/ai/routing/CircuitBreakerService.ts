/**
 * Circuit Breaker Service
 *
 * AI 엔진의 장애 대응을 위한 Circuit Breaker 패턴 구현
 * - 연속 실패 시 자동 차단
 * - 시간 경과 후 자동 복구 시도
 * - 엔진별 독립적 관리
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryResponse } from '../SimplifiedQueryEngine';

export interface CircuitBreakerConfig {
  enableCircuitBreaker: boolean;
  maxRetries: number;
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  halfOpenTimeout: number; // milliseconds
}

export enum CircuitState {
  CLOSED = 'CLOSED', // 정상 작동
  OPEN = 'OPEN', // 차단됨
  HALF_OPEN = 'HALF_OPEN', // 복구 시도 중
}

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  successCount: number;
  lastStateChange: number;
}

export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker>;

  constructor(private config: CircuitBreakerConfig) {
    this.breakers = new Map();
  }

  /**
   * 엔진의 회로 상태 확인
   */
  isOpen(engine: string): boolean {
    if (!this.config.enableCircuitBreaker) {
      return false;
    }

    const breaker = this.getOrCreateBreaker(engine);
    this.updateBreakerState(engine, breaker);

    return breaker.state === CircuitState.OPEN;
  }

  /**
   * 실패 기록
   */
  recordFailure(engine: string): void {
    if (!this.config.enableCircuitBreaker) {
      return;
    }

    const breaker = this.getOrCreateBreaker(engine);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    // 임계값 초과 시 회로 열기
    if (
      breaker.failures >= this.config.failureThreshold &&
      breaker.state === CircuitState.CLOSED
    ) {
      this.openCircuit(engine, breaker);
    }
  }

  /**
   * 성공 기록
   */
  recordSuccess(engine: string): void {
    if (!this.config.enableCircuitBreaker) {
      return;
    }

    const breaker = this.getOrCreateBreaker(engine);

    if (breaker.state === CircuitState.HALF_OPEN) {
      breaker.successCount++;

      // Half-open 상태에서 성공하면 회로 닫기
      if (breaker.successCount >= 2) {
        this.closeCircuit(engine, breaker);
      }
    } else if (breaker.state === CircuitState.CLOSED) {
      // 정상 상태에서 성공하면 실패 카운트 리셋
      breaker.failures = 0;
    }
  }

  /**
   * 회로 차단 응답 생성
   */
  createCircuitOpenResponse(engine: string): QueryResponse {
    const breaker = this.breakers.get(engine);
    const timeToReset = breaker
      ? Math.ceil(
          (this.config.resetTimeout - (Date.now() - breaker.lastStateChange)) /
            1000
        )
      : Math.ceil(this.config.resetTimeout / 1000);

    return {
      success: false,
      response: `🔌 ${engine} 엔진이 일시적으로 사용할 수 없습니다.\n\n약 ${timeToReset}초 후에 다시 시도됩니다.`,
      engine: 'local-rag' as const,
      confidence: 1,
      thinkingSteps: [
        {
          step: 'Circuit Breaker 확인',
          description: `${engine} 엔진 회로 차단됨 (연속 실패: ${breaker?.failures || 0}회)`,
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        circuitOpen: true,
        engine,
        timeToReset,
      },
      processingTime: 0,
    };
  }

  /**
   * 특정 엔진의 상태 조회
   */
  getState(engine: string): CircuitState {
    const breaker = this.breakers.get(engine);
    if (!breaker) {
      return CircuitState.CLOSED;
    }

    this.updateBreakerState(engine, breaker);
    return breaker.state;
  }

  /**
   * 모든 회로 상태 조회
   */
  getAllStates(): Map<string, CircuitState> {
    const states = new Map<string, CircuitState>();

    for (const [engine, breaker] of this.breakers) {
      this.updateBreakerState(engine, breaker);
      states.set(engine, breaker.state);
    }

    return states;
  }

  /**
   * 모든 회로 리셋
   */
  resetAll(): void {
    this.breakers.clear();
    console.log('🔌 모든 Circuit Breaker 리셋 완료');
  }

  /**
   * 특정 엔진 회로 리셋
   */
  reset(engine: string): void {
    this.breakers.delete(engine);
    console.log(`🔌 ${engine} Circuit Breaker 리셋 완료`);
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // === Private Methods ===

  private getOrCreateBreaker(engine: string): CircuitBreaker {
    let breaker = this.breakers.get(engine);

    if (!breaker) {
      breaker = {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        successCount: 0,
        lastStateChange: Date.now(),
      };
      this.breakers.set(engine, breaker);
    }

    return breaker;
  }

  private updateBreakerState(engine: string, breaker: CircuitBreaker): void {
    const now = Date.now();

    switch (breaker.state) {
      case CircuitState.OPEN:
        // 리셋 타임아웃 후 Half-open으로 전환
        if (now - breaker.lastStateChange >= this.config.resetTimeout) {
          breaker.state = CircuitState.HALF_OPEN;
          breaker.lastStateChange = now;
          breaker.successCount = 0;
          console.log(`🔌 ${engine} Circuit Breaker: OPEN → HALF_OPEN`);
        }
        break;

      case CircuitState.HALF_OPEN:
        // Half-open 타임아웃 후 다시 Open으로
        if (now - breaker.lastStateChange >= this.config.halfOpenTimeout) {
          this.openCircuit(engine, breaker);
        }
        break;
    }
  }

  private openCircuit(engine: string, breaker: CircuitBreaker): void {
    breaker.state = CircuitState.OPEN;
    breaker.lastStateChange = Date.now();
    console.warn(
      `🔌 ${engine} Circuit Breaker OPEN - 실패: ${breaker.failures}회`
    );
  }

  private closeCircuit(engine: string, breaker: CircuitBreaker): void {
    breaker.state = CircuitState.CLOSED;
    breaker.failures = 0;
    breaker.successCount = 0;
    breaker.lastStateChange = Date.now();
    console.log(`🔌 ${engine} Circuit Breaker CLOSED - 정상 복구`);
  }
}
