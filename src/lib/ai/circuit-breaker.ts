/**
 * AI 서비스 Circuit Breaker 패턴 구현
 * Gemini AI 교차 검증 제안 기반
 * Vercel 프로덕션 환경 안정성 향상
 */

export class AIServiceCircuitBreaker {
  private failures = 0;
  private readonly threshold: number;
  private lastFailTime = 0;
  private readonly resetTimeout: number;
  private readonly serviceName: string;

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
   * Circuit Breaker를 통해 함수 실행
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      const remainingTime = Math.ceil((this.resetTimeout - (Date.now() - this.lastFailTime)) / 1000);
      throw new Error(
        `${this.serviceName} 서비스가 일시적으로 중단되었습니다. ${remainingTime}초 후 다시 시도해주세요.`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      // 원본 에러에 Circuit Breaker 정보 추가
      const errorMessage = error instanceof Error ? error.message : String(error);
      const enhancedError = new Error(
        `${this.serviceName} 실행 실패 (${this.failures}/${this.threshold} 실패): ${errorMessage}`
      );
      
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      
      throw enhancedError;
    }
  }

  /**
   * Circuit Breaker 상태 확인
   */
  private isOpen(): boolean {
    const isFailureThresholdExceeded = this.failures >= this.threshold;
    const isWithinResetTimeout = Date.now() - this.lastFailTime < this.resetTimeout;
    
    // 리셋 타임아웃이 지났으면 반개방 상태로 전환
    if (isFailureThresholdExceeded && !isWithinResetTimeout) {
      this.failures = this.threshold - 1; // 반개방 상태
    }
    
    return isFailureThresholdExceeded && isWithinResetTimeout;
  }

  /**
   * 성공 시 처리
   */
  private onSuccess(): void {
    this.failures = 0;
    this.lastFailTime = 0;
  }

  /**
   * 실패 시 처리
   */
  private onFailure(): void {
    this.failures += 1;
    this.lastFailTime = Date.now();
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
    const isHalfOpen = this.failures >= this.threshold - 1 && this.failures < this.threshold;
    
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
      result.resetTimeRemaining = Math.max(0, this.resetTimeout - (now - this.lastFailTime));
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
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new AIServiceCircuitBreaker(serviceName));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * 모든 Circuit Breaker 상태 반환
   */
  getAllStatus() {
    const status: Record<string, ReturnType<AIServiceCircuitBreaker['getStatus']>> = {};
    
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