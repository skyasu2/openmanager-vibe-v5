/**
 * AI Metrics Collector
 *
 * AI 서비스의 성능 및 사용량 메트릭 수집
 * - 요청/응답 통계
 * - 엔진별 사용량 추적
 * - 성능 지표 계산
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import type { QueryResponse } from '../SimplifiedQueryEngine';

export interface EngineMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  lastUsed: number;
}

export interface RouterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  engineUsage: Map<string, EngineMetrics>;
  securityEvents: {
    promptsBlocked: number;
    responsesFiltered: number;
    threatsDetected: string[];
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  tokenUsage: {
    daily: number;
    total: number;
    byUser: Map<string, number>;
  };
}

export class AIMetricsCollector {
  private metrics: RouterMetrics;
  private sessionStartTime: number;

  constructor() {
    this.sessionStartTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      engineUsage: new Map(),
      securityEvents: {
        promptsBlocked: 0,
        responsesFiltered: 0,
        threatsDetected: [],
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      tokenUsage: {
        daily: 0,
        total: 0,
        byUser: new Map(),
      },
    };
  }

  /**
   * 요청 시작 기록
   */
  recordRequestStart(): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.totalRequests++;
    return requestId;
  }

  /**
   * 성공적인 응답 기록
   */
  recordSuccess(
    engine: string,
    response: QueryResponse,
    processingTime: number,
    cached: boolean = false
  ): void {
    this.metrics.successfulRequests++;
    this.updateEngineMetrics(engine, true, processingTime);
    this.updateAverageResponseTime(processingTime);

    // 캐시 통계 업데이트
    if (cached) {
      this.metrics.cacheStats.hits++;
    } else {
      this.metrics.cacheStats.misses++;
    }
    this.updateCacheHitRate();
  }

  /**
   * 실패 기록
   */
  recordFailure(engine: string, processingTime: number): void {
    this.metrics.failedRequests++;
    this.updateEngineMetrics(engine, false, processingTime);
    this.updateAverageResponseTime(processingTime);
  }

  /**
   * 보안 이벤트 기록
   */
  recordSecurityEvent(
    type: 'prompt_blocked' | 'response_filtered',
    threat?: string
  ): void {
    if (type === 'prompt_blocked') {
      this.metrics.securityEvents.promptsBlocked++;
    } else if (type === 'response_filtered') {
      this.metrics.securityEvents.responsesFiltered++;
    }

    if (threat) {
      this.metrics.securityEvents.threatsDetected.push(threat);

      // 최대 100개까지만 보관
      if (this.metrics.securityEvents.threatsDetected.length > 100) {
        this.metrics.securityEvents.threatsDetected.shift();
      }
    }
  }

  /**
   * 토큰 사용량 기록
   */
  recordTokenUsage(userId: string, tokens: number): void {
    this.metrics.tokenUsage.daily += tokens;
    this.metrics.tokenUsage.total += tokens;

    const currentUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    this.metrics.tokenUsage.byUser.set(userId, currentUsage + tokens);
  }

  /**
   * 캐시 히트 기록
   */
  recordCacheHit(): void {
    this.metrics.cacheStats.hits++;
    this.updateCacheHitRate();
  }

  /**
   * 캐시 미스 기록
   */
  recordCacheMiss(): void {
    this.metrics.cacheStats.misses++;
    this.updateCacheHitRate();
  }

  /**
   * 전체 메트릭 조회
   */
  getMetrics(): RouterMetrics {
    return {
      ...this.metrics,
      engineUsage: new Map(this.metrics.engineUsage),
      securityEvents: { ...this.metrics.securityEvents },
      cacheStats: { ...this.metrics.cacheStats },
      tokenUsage: {
        ...this.metrics.tokenUsage,
        byUser: new Map(this.metrics.tokenUsage.byUser),
      },
    };
  }

  /**
   * 성능 요약 조회
   */
  getPerformanceSummary() {
    const totalRequests = this.metrics.totalRequests;
    const successRate =
      totalRequests > 0 ? this.metrics.successfulRequests / totalRequests : 0;
    const uptime = Date.now() - this.sessionStartTime;

    return {
      totalRequests,
      successRate,
      averageResponseTime: this.metrics.averageResponseTime,
      requestsPerHour: uptime > 0 ? totalRequests / (uptime / 3600000) : 0,
      uptime,
      cacheHitRate: this.metrics.cacheStats.hitRate,
    };
  }

  /**
   * 엔진별 통계 조회
   */
  getEngineStats(): Map<string, EngineMetrics> {
    return new Map(this.metrics.engineUsage);
  }

  /**
   * 보안 통계 조회
   */
  getSecurityStats() {
    return { ...this.metrics.securityEvents };
  }

  /**
   * 일일 통계 리셋
   */
  resetDaily(): void {
    this.metrics.tokenUsage.daily = 0;
    this.metrics.tokenUsage.byUser.clear();
    console.log('📊 일일 메트릭 리셋 완료');
  }

  /**
   * 전체 통계 리셋
   */
  resetAll(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      engineUsage: new Map(),
      securityEvents: {
        promptsBlocked: 0,
        responsesFiltered: 0,
        threatsDetected: [],
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      tokenUsage: {
        daily: 0,
        total: 0,
        byUser: new Map(),
      },
    };
    this.sessionStartTime = Date.now();
    console.log('📊 전체 메트릭 리셋 완료');
  }

  // === Private Methods ===

  private updateEngineMetrics(
    engine: string,
    success: boolean,
    processingTime: number
  ): void {
    let engineMetrics = this.metrics.engineUsage.get(engine);

    if (!engineMetrics) {
      engineMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        lastUsed: 0,
      };
      this.metrics.engineUsage.set(engine, engineMetrics);
    }

    engineMetrics.totalRequests++;
    engineMetrics.totalResponseTime += processingTime;
    engineMetrics.lastUsed = Date.now();

    if (success) {
      engineMetrics.successfulRequests++;
    } else {
      engineMetrics.failedRequests++;
    }

    // 평균 응답시간 업데이트
    engineMetrics.averageResponseTime =
      engineMetrics.totalResponseTime / engineMetrics.totalRequests;
  }

  private updateAverageResponseTime(processingTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    const currentTotal = this.metrics.averageResponseTime * (totalRequests - 1);
    this.metrics.averageResponseTime =
      (currentTotal + processingTime) / totalRequests;
  }

  private updateCacheHitRate(): void {
    const total = this.metrics.cacheStats.hits + this.metrics.cacheStats.misses;
    this.metrics.cacheStats.hitRate =
      total > 0 ? this.metrics.cacheStats.hits / total : 0;
  }
}
