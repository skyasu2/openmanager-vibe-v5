/**
 * Token Usage Manager
 * 
 * AI 서비스의 토큰 사용량 관리
 * - 일일/사용자별 토큰 제한
 * - 사용량 추적 및 모니터링
 * - 제한 초과 시 처리
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryResponse } from '../SimplifiedQueryEngine';

export interface TokenConfig {
  dailyTokenLimit: number;
  userTokenLimit: number;
}

export interface TokenUsage {
  daily: number;
  total: number;
  byUser: Map<string, number>;
}

export interface TokenCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: {
    daily: number;
    user: number;
  };
}

export class TokenUsageManager {
  private usage: TokenUsage;
  private lastResetDate: string;
  
  constructor(private config: TokenConfig) {
    this.usage = {
      daily: 0,
      total: 0,
      byUser: new Map<string, number>(),
    };
    this.lastResetDate = new Date().toISOString().split('T')[0] ?? new Date().toDateString();
  }

  /**
   * 토큰 사용 가능 여부 확인
   */
  checkLimits(userId: string): TokenCheckResult {
    this.checkDailyReset();
    
    const userUsage = this.usage.byUser.get(userId) || 0;
    
    // 일일 제한 확인
    if (this.usage.daily >= this.config.dailyTokenLimit) {
      return {
        allowed: false,
        reason: `일일 토큰 제한 초과 (${this.config.dailyTokenLimit} 토큰)`,
      };
    }
    
    // 사용자별 제한 확인
    if (userUsage >= this.config.userTokenLimit) {
      return {
        allowed: false,
        reason: `사용자 토큰 제한 초과 (${this.config.userTokenLimit} 토큰)`,
      };
    }
    
    return {
      allowed: true,
      remaining: {
        daily: this.config.dailyTokenLimit - this.usage.daily,
        user: this.config.userTokenLimit - userUsage,
      },
    };
  }

  /**
   * 토큰 사용량 기록
   */
  recordUsage(userId: string, tokens: number): void {
    this.checkDailyReset();
    
    // 전체 사용량 증가
    this.usage.daily += tokens;
    this.usage.total += tokens;
    
    // 사용자별 사용량 증가
    const currentUsage = this.usage.byUser.get(userId) || 0;
    this.usage.byUser.set(userId, currentUsage + tokens);
  }

  /**
   * 응답에서 토큰 수 추정
   */
  estimateTokens(response: QueryResponse): number {
    // 간단한 토큰 추정 (실제로는 더 정교한 방법 필요)
    const responseLength = response.response.length;
    const stepsLength = response.thinkingSteps?.reduce(
      (acc, step) => acc + (step.description?.length || 0),
      0
    ) || 0;
    
    // 대략 4자당 1토큰으로 추정 (영어 기준)
    // 한국어는 더 많은 토큰 사용
    return Math.ceil((responseLength + stepsLength) / 3);
  }

  /**
   * 토큰 제한 초과 응답 생성
   */
  createLimitExceededResponse(reason: string): QueryResponse {
    return {
      success: false,
      response: `⚠️ ${reason}\n\n잠시 후 다시 시도해주세요.`,
      engine: 'local-rag' as const,
      confidence: 1,
      thinkingSteps: [
        {
          step: '토큰 제한 확인',
          description: reason,
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        tokenLimitExceeded: true,
        reason,
      },
      processingTime: 0,
    };
  }

  /**
   * 일일 리셋 확인 및 수행
   */
  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0] ?? new Date().toDateString();
    
    if (today !== this.lastResetDate) {
      this.resetDailyLimits();
      this.lastResetDate = today;
    }
  }

  /**
   * 일일 사용량 리셋
   */
  resetDailyLimits(): void {
    this.usage.daily = 0;
    this.usage.byUser.clear();
    console.log('🔄 일일 토큰 사용량 리셋 완료');
  }

  /**
   * 사용량 통계 조회
   */
  getUsage(): TokenUsage {
    return {
      daily: this.usage.daily,
      total: this.usage.total,
      byUser: new Map(this.usage.byUser),
    };
  }

  /**
   * 특정 사용자의 사용량 조회
   */
  getUserUsage(userId: string): number {
    return this.usage.byUser.get(userId) || 0;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<TokenConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 전체 사용량 리셋 (테스트용)
   */
  resetAll(): void {
    this.usage = {
      daily: 0,
      total: 0,
      byUser: new Map<string, number>(),
    };
    this.lastResetDate = new Date().toISOString().split('T')[0] ?? new Date().toDateString();
  }
}