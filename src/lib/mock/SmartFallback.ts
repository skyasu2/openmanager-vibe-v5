/**
 * 🔄 스마트 폴백 시스템
 * 
 * 실제 서비스 실패 시 자동으로 Mock으로 전환
 * Claude Code 개발 중단을 방지
 */

import { shouldUseMock, getMockMode } from './index';

export interface FallbackOptions {
  serviceName: string;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoFallback?: boolean;
  onFallback?: (error: Error) => void;
}

export class SmartFallback {
  private static fallbackHistory = new Map<string, number>();
  private static lastFallbackTime = new Map<string, number>();

  /**
   * 스마트 실행 - 실패 시 자동 Mock 전환
   */
  static async execute<T>(
    realFn: () => Promise<T>,
    mockFn: () => Promise<T>,
    options: FallbackOptions
  ): Promise<T> {
    const {
      serviceName,
      maxRetries = 2,
      retryDelay = 1000,
      enableAutoFallback = true,
      onFallback,
    } = options;

    // Mock 모드가 강제인 경우 바로 Mock 사용
    if (getMockMode() === 'force' || shouldUseMock(serviceName)) {
      console.log(`🎭 ${serviceName}: Mock 모드 활성화`);
      return mockFn();
    }

    // 최근 폴백 이력 확인 (5분 이내 3번 이상 실패 시 바로 Mock)
    const recentFallbacks = this.getRecentFallbackCount(serviceName);
    if (recentFallbacks >= 3) {
      console.log(`⚡ ${serviceName}: 잦은 실패로 Mock 자동 사용 (${recentFallbacks}회)`);
      return mockFn();
    }

    // 실제 서비스 시도
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await realFn();
        // 성공 시 폴백 이력 초기화
        this.clearFallbackHistory(serviceName);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ ${serviceName} 시도 ${attempt}/${maxRetries} 실패:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // 모든 시도 실패 - Mock으로 폴백
    if (enableAutoFallback && mockFn) {
      console.log(`🔄 ${serviceName}: Mock으로 자동 전환`);
      this.recordFallback(serviceName);
      
      if (onFallback) {
        onFallback(lastError!);
      }
      
      try {
        return await mockFn();
      } catch (mockError) {
        console.error(`❌ ${serviceName}: Mock도 실패`, mockError);
        throw lastError;
      }
    }

    throw lastError;
  }

  /**
   * 조건부 실행 - 컨텍스트에 따라 Mock/Real 선택
   */
  static async executeConditional<T>(
    condition: () => boolean,
    realFn: () => Promise<T>,
    mockFn: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    if (condition() || shouldUseMock(serviceName)) {
      console.log(`🎯 ${serviceName}: 조건에 따라 Mock 사용`);
      return mockFn();
    }
    
    return this.execute(realFn, mockFn, {
      serviceName,
      enableAutoFallback: true,
    });
  }

  /**
   * 최근 폴백 횟수 조회
   */
  private static getRecentFallbackCount(serviceName: string): number {
    const history = this.fallbackHistory.get(serviceName) || 0;
    const lastTime = this.lastFallbackTime.get(serviceName) || 0;
    const now = Date.now();
    
    // 5분이 지났으면 카운트 리셋
    if (now - lastTime > 5 * 60 * 1000) {
      this.fallbackHistory.set(serviceName, 0);
      return 0;
    }
    
    return history;
  }

  /**
   * 폴백 기록
   */
  private static recordFallback(serviceName: string): void {
    const current = this.fallbackHistory.get(serviceName) || 0;
    this.fallbackHistory.set(serviceName, current + 1);
    this.lastFallbackTime.set(serviceName, Date.now());
  }

  /**
   * 폴백 이력 초기화
   */
  private static clearFallbackHistory(serviceName: string): void {
    this.fallbackHistory.delete(serviceName);
    this.lastFallbackTime.delete(serviceName);
  }

  /**
   * 폴백 통계 조회
   */
  static getFallbackStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [service, count] of this.fallbackHistory.entries()) {
      const lastTime = this.lastFallbackTime.get(service);
      stats[service] = {
        fallbackCount: count,
        lastFallback: lastTime ? new Date(lastTime).toISOString() : null,
      };
    }
    
    return stats;
  }
}

/**
 * 간편 헬퍼 함수
 */
export async function withFallback<T>(
  serviceName: string,
  realFn: () => Promise<T>,
  mockFn: () => Promise<T>
): Promise<T> {
  return SmartFallback.execute(realFn, mockFn, {
    serviceName,
    enableAutoFallback: true,
  });
}