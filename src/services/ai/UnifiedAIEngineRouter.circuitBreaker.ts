/**
 * 🔌 Unified AI Engine Router - Circuit Breaker System
 *
 * Advanced circuit breaker pattern implementation for AI engine reliability
 * - Failure tracking and threshold management
 * - Three-state circuit breaker (closed, open, half-open)
 * - Automatic recovery with configurable timeouts
 * - Engine-specific failure isolation
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
  CircuitBreakerState,
  CircuitBreakers,
} from './UnifiedAIEngineRouter.types';

export class UnifiedAIEngineRouterCircuitBreaker {
  private circuitBreakers: CircuitBreakers;
  private readonly DEFAULT_THRESHOLD = 5; // 5회 연속 실패 시 차단
  private readonly DEFAULT_TIMEOUT = 60000; // 1분 타임아웃

  constructor() {
    this.circuitBreakers = new Map();
  }

  /**
   * 🔌 Circuit Breaker 상태 확인
   *
   * 엔진이 사용 가능한 상태인지 확인
   */
  public isCircuitOpen(engine: string): boolean {
    const breaker = this.circuitBreakers.get(engine);
    if (!breaker) return false;

    // Circuit이 열린 상태일 때
    if (breaker.state === 'open') {
      // 타임아웃이 지났으면 half-open으로 전환
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'half-open';
        console.log(`🔌 Circuit breaker ${engine} transitioned to half-open`);
        return false; // half-open은 요청을 시도해볼 수 있음
      }
      return true; // 아직 타임아웃 전이므로 열린 상태
    }

    // half-open 상태는 요청을 시도할 수 있음
    if (breaker.state === 'half-open') {
      return false;
    }

    // closed 상태는 정상
    return false;
  }

  /**
   * ❌ 실패 기록 및 Circuit Breaker 상태 업데이트
   */
  public recordFailure(engine: string): void {
    let breaker = this.circuitBreakers.get(engine);

    // 기존 Circuit Breaker가 없으면 새로 생성
    if (!breaker) {
      breaker = this.createNewCircuitBreaker();
      this.circuitBreakers.set(engine, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // 임계값 도달 시 Circuit 열기
    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'open';
      console.warn(
        `🔌 Circuit breaker opened for engine: ${engine} (${breaker.failures} failures)`
      );
    }
  }

  /**
   * ✅ 성공 기록 및 Circuit Breaker 상태 복구
   */
  public recordSuccess(engine: string): void {
    const breaker = this.circuitBreakers.get(engine);
    if (!breaker) return;

    // half-open 상태에서 성공하면 완전히 복구
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
      console.log(`🔌 Circuit breaker ${engine} restored to closed state`);
    }

    // 성공 시 실패 카운터 감소 (완전 리셋은 아님)
    if (breaker.failures > 0) {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  /**
   * 🔄 폴백 엔진 선택
   *
   * 실패한 엔진을 제외하고 다음 사용 가능한 엔진 반환
   */
  public getFallbackEngine(
    failedEngine: string,
    fallbackChain: string[]
  ): string | null {
    // 실패한 엔진의 다음 엔진 찾기
    const fallbackIndex = fallbackChain.indexOf(failedEngine);

    if (fallbackIndex >= 0 && fallbackIndex < fallbackChain.length - 1) {
      const nextEngine = fallbackChain[fallbackIndex + 1];
      // 다음 엔진도 Circuit이 열려있지 않은지 확인
      if (!this.isCircuitOpen(nextEngine)) {
        return nextEngine;
      }
    }

    // 실패한 엔진이 fallbackChain에 없거나 다음 엔진도 차단된 경우
    // 사용 가능한 엔진을 순차적으로 찾기
    for (const engine of fallbackChain) {
      if (engine !== failedEngine && !this.isCircuitOpen(engine)) {
        return engine;
      }
    }

    return null; // 모든 엔진이 차단된 상태
  }

  /**
   * 🔌 모든 Circuit Breaker 상태 리셋
   */
  public resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('🔌 모든 Circuit Breaker 상태 리셋 완료');
  }

  /**
   * 🔌 특정 엔진의 Circuit Breaker 리셋
   */
  public resetCircuitBreaker(engine: string): void {
    const breaker = this.circuitBreakers.get(engine);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failures = 0;
      breaker.lastFailure = 0;
      console.log(`🔌 Circuit breaker ${engine} 리셋 완료`);
    }
  }

  /**
   * 📊 Circuit Breaker 통계 조회
   */
  public getCircuitBreakerStats(): {
    totalBreakers: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    enginesWithFailures: Array<{
      engine: string;
      failures: number;
      state: string;
      lastFailure: Date | null;
    }>;
  } {
    let openCount = 0;
    let halfOpenCount = 0;
    let closedCount = 0;
    const enginesWithFailures: Array<{
      engine: string;
      failures: number;
      state: string;
      lastFailure: Date | null;
    }> = [];

    for (const [engine, breaker] of this.circuitBreakers.entries()) {
      switch (breaker.state) {
        case 'open':
          openCount++;
          break;
        case 'half-open':
          halfOpenCount++;
          break;
        case 'closed':
          closedCount++;
          break;
      }

      if (breaker.failures > 0) {
        enginesWithFailures.push({
          engine,
          failures: breaker.failures,
          state: breaker.state,
          lastFailure:
            breaker.lastFailure > 0 ? new Date(breaker.lastFailure) : null,
        });
      }
    }

    return {
      totalBreakers: this.circuitBreakers.size,
      openCircuits: openCount,
      halfOpenCircuits: halfOpenCount,
      closedCircuits: closedCount,
      enginesWithFailures,
    };
  }

  /**
   * 🕒 만료된 Circuit Breaker 자동 복구
   *
   * 정기적으로 호출하여 타임아웃된 Circuit Breaker를 half-open으로 전환
   */
  public processTimeouts(): number {
    let processedCount = 0;
    const now = Date.now();

    for (const [engine, breaker] of this.circuitBreakers.entries()) {
      if (
        breaker.state === 'open' &&
        now - breaker.lastFailure > breaker.timeout
      ) {
        breaker.state = 'half-open';
        console.log(`🔌 Circuit breaker ${engine} auto-recovered to half-open`);
        processedCount++;
      }
    }

    return processedCount;
  }

  /**
   * 🎯 Circuit Breaker 설정 업데이트
   */
  public updateCircuitBreakerConfig(
    engine: string,
    config: {
      threshold?: number;
      timeout?: number;
    }
  ): void {
    let breaker = this.circuitBreakers.get(engine);

    if (!breaker) {
      breaker = this.createNewCircuitBreaker();
      this.circuitBreakers.set(engine, breaker);
    }

    if (config.threshold !== undefined) {
      breaker.threshold = Math.max(1, config.threshold);
    }

    if (config.timeout !== undefined) {
      breaker.timeout = Math.max(1000, config.timeout); // 최소 1초
    }

    console.log(`🔌 Circuit breaker ${engine} 설정 업데이트:`, {
      threshold: breaker.threshold,
      timeout: breaker.timeout,
    });
  }

  /**
   * 🛡️ Circuit Breaker 건강도 체크
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    openPercentage: number;
    failedEngines: string[];
    recommendations: string[];
  } {
    const stats = this.getCircuitBreakerStats();
    const totalEngines = Math.max(1, stats.totalBreakers);
    const openPercentage = (stats.openCircuits / totalEngines) * 100;

    let status: 'healthy' | 'degraded' | 'critical';
    const recommendations: string[] = [];
    const failedEngines = stats.enginesWithFailures
      .filter((e) => e.state === 'open')
      .map((e) => e.engine);

    if (openPercentage === 0) {
      status = 'healthy';
    } else if (openPercentage < 50) {
      status = 'degraded';
      recommendations.push('일부 AI 엔진에서 장애가 감지되었습니다.');
      recommendations.push('폴백 엔진으로 서비스 계속 제공 중입니다.');
    } else {
      status = 'critical';
      recommendations.push('대부분의 AI 엔진이 차단 상태입니다.');
      recommendations.push('시스템 전체 점검이 필요합니다.');
      recommendations.push('즉시 관리자에게 문의하세요.');
    }

    return {
      status,
      openPercentage,
      failedEngines,
      recommendations,
    };
  }

  /**
   * 🔧 새로운 Circuit Breaker 생성
   */
  private createNewCircuitBreaker(): CircuitBreakerState {
    return {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
      threshold: this.DEFAULT_THRESHOLD,
      timeout: this.DEFAULT_TIMEOUT,
    };
  }

  /**
   * 🎯 Circuit Breaker Map 직접 접근 (테스트용)
   */
  public getCircuitBreakers(): CircuitBreakers {
    return this.circuitBreakers;
  }
}
