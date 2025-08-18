/**
 * 🎭 Mock 시스템 기본 클래스
 *
 * 모든 Mock 서비스의 공통 기능을 제공
 * - 통계 수집
 * - 로깅
 * - 에러 시뮬레이션
 * - 지연 시간 시뮬레이션
 */

import { MockStats } from './MockStats';
import { MockLogger } from './MockLogger';

export interface MockOptions {
  enableLogging?: boolean;
  enableStats?: boolean;
  responseDelay?: number;
  errorRate?: number;
  enablePersistence?: boolean;
}

export abstract class MockBase<T = any> {
  protected options: MockOptions;
  protected stats: MockStats;
  protected logger: MockLogger;
  protected isEnabled: boolean = false;

  constructor(name: string, options: MockOptions = {}) {
    this.options = {
      enableLogging: process.env.NODE_ENV === 'development',
      enableStats: true,
      responseDelay: 0,
      errorRate: 0,
      enablePersistence: false,
      ...options,
    };

    this.stats = new MockStats(name);
    this.logger = new MockLogger(name, this.options.enableLogging);
    this.checkIfEnabled();
  }

  /**
   * Mock 활성화 여부 확인
   */
  private checkIfEnabled(): void {
    const mockMode = process.env.MOCK_MODE || 'dev';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';

    switch (mockMode) {
      case 'force':
        this.isEnabled = true;
        break;
      case 'test':
        this.isEnabled = isTest;
        break;
      case 'dev':
        this.isEnabled = isDevelopment || isTest;
        break;
      case 'off':
      default:
        this.isEnabled = false;
    }

    if (this.isEnabled) {
      this.logger.info('Mock 활성화됨');
    }
  }

  /**
   * 응답 지연 시뮬레이션
   */
  protected async simulateDelay(): Promise<void> {
    if (this.options.responseDelay && this.options.responseDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.responseDelay)
      );
    }
  }

  /**
   * 에러 시뮬레이션
   */
  protected async simulateError(operation: string): Promise<void> {
    if (this.options.errorRate && Math.random() < this.options.errorRate) {
      const error = new Error(`Mock 에러 발생: ${operation}`);
      this.stats.recordError(operation);
      throw error;
    }
  }

  /**
   * 작업 실행 및 통계 기록
   */
  protected async execute<R>(
    operation: string,
    fn: () => Promise<R> | R
  ): Promise<R> {
    const startTime = Date.now();

    try {
      this.stats.recordOperation(operation);
      await this.simulateDelay();
      await this.simulateError(operation);

      const result = await fn();

      const duration = Date.now() - startTime;
      this.stats.recordDuration(operation, duration);
      this.logger.debug(`${operation} 완료`, { duration });

      return result;
    } catch (error) {
      this.stats.recordError(operation);
      this.logger.error(`${operation} 실패`, error);
      throw error;
    }
  }

  /**
   * Mock 통계 조회
   */
  getStats(): Record<string, any> {
    return this.stats.getStats();
  }

  /**
   * Mock 활성화 여부
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Mock 리셋
   */
  abstract reset(): void;
}
