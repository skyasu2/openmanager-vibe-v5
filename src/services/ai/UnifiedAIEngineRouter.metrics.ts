/**
 * 📊 Unified AI Engine Router - Metrics & Monitoring System
 *
 * Comprehensive performance monitoring and analytics engine
 * - Real-time metrics collection and tracking
 * - Token usage monitoring and limits enforcement
 * - Engine performance analysis and optimization
 * - Security event tracking and analysis
 * - Response time analytics and reporting
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { RouterMetrics, RouterConfig } from './UnifiedAIEngineRouter.types';

export class UnifiedAIEngineRouterMetrics {
  private metrics: RouterMetrics;
  private config: RouterConfig;
  private metricsHistory: Array<{
    timestamp: number;
    snapshot: RouterMetrics;
  }> = [];
  private readonly MAX_HISTORY_SIZE = 100; // 최근 100개 스냅샷 유지

  constructor(config: RouterConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * 📊 메트릭 초기화
   */
  private initializeMetrics(): RouterMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      tokenUsage: {
        daily: 0,
        total: 0,
        byUser: new Map(),
      },
      engineUsage: {
        googleAI: 0,
        localRAG: 0,
        koreanNLP: 0,
        fallback: 0,
      },
      securityEvents: {
        promptsBlocked: 0,
        responsesFiltered: 0,
        threatsDetected: [],
      },
    };
  }

  /**
   * 📈 메트릭 업데이트
   *
   * 요청 완료 후 성능 메트릭 갱신
   */
  public updateMetrics(
    engine: string,
    startTime: number,
    success: boolean,
    additionalData?: {
      tokensUsed?: number;
      userId?: string;
      securityThreats?: string[];
      cacheHit?: boolean;
    }
  ): void {
    const responseTime = Date.now() - startTime;

    // 기본 카운터 증가
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // 평균 응답 시간 계산 (totalRequests가 0이면 첫 번째 요청)
    const totalRequests = this.metrics.totalRequests;
    if (totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (totalRequests - 1) +
          responseTime) /
        totalRequests;
    }

    // 엔진별 사용량 추적
    switch (engine) {
      case 'google-ai':
        this.metrics.engineUsage.googleAI++;
        break;
      case 'local-ai':
      case 'local-rag':
        this.metrics.engineUsage.localRAG++;
        break;
      case 'korean-nlp':
        this.metrics.engineUsage.koreanNLP++;
        break;
      default:
        this.metrics.engineUsage.fallback++;
        break;
    }

    // 추가 데이터 처리
    if (additionalData) {
      // 토큰 사용량 기록
      if (additionalData.tokensUsed && additionalData.userId) {
        this.recordTokenUsage(additionalData.userId, additionalData.tokensUsed);
      }

      // 보안 위협 기록
      if (
        additionalData.securityThreats &&
        additionalData.securityThreats.length > 0
      ) {
        this.metrics.securityEvents.threatsDetected.push(
          ...additionalData.securityThreats
        );
      }
    }

    // 메트릭 히스토리 저장 (5분마다 스냅샷)
    this.saveMetricsSnapshot();
  }

  /**
   * 💰 토큰 사용량 제한 검사
   *
   * 일일 전체 한도와 사용자별 한도를 확인
   */
  public checkTokenLimits(userId: string): {
    allowed: boolean;
    reason?: string;
    remainingDaily?: number;
    remainingUser?: number;
  } {
    // 일일 전체 한도 확인
    const dailyRemaining =
      this.config.dailyTokenLimit - this.metrics.tokenUsage.daily;
    if (dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        remainingDaily: 0,
      };
    }

    // 사용자별 한도 확인
    const userUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    const userRemaining = this.config.userTokenLimit - userUsage;
    if (userRemaining <= 0) {
      return {
        allowed: false,
        reason: 'user_limit_exceeded',
        remainingUser: 0,
        remainingDaily: dailyRemaining,
      };
    }

    return {
      allowed: true,
      remainingDaily: dailyRemaining,
      remainingUser: userRemaining,
    };
  }

  /**
   * 📊 토큰 사용량 기록
   *
   * 사용자별 및 전체 토큰 사용량 추적
   */
  public recordTokenUsage(userId: string, tokens: number): void {
    this.metrics.tokenUsage.daily += tokens;
    this.metrics.tokenUsage.total += tokens;

    const currentUserUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    this.metrics.tokenUsage.byUser.set(userId, currentUserUsage + tokens);

    console.log(`📊 토큰 사용량 기록: 사용자 ${userId}, ${tokens} 토큰`);
  }

  /**
   * 🚨 보안 이벤트 기록
   *
   * 보안 위협 및 차단 이벤트 추적
   */
  public recordSecurityEvent(
    type: 'prompt_blocked' | 'response_filtered' | 'threat_detected',
    details?: {
      threats?: string[];
      riskLevel?: string;
      userId?: string;
    }
  ): void {
    switch (type) {
      case 'prompt_blocked':
        this.metrics.securityEvents.promptsBlocked++;
        break;
      case 'response_filtered':
        this.metrics.securityEvents.responsesFiltered++;
        break;
      case 'threat_detected':
        if (details?.threats) {
          this.metrics.securityEvents.threatsDetected.push(...details.threats);
        }
        break;
    }

    console.log(`🚨 보안 이벤트 기록: ${type}`, details);
  }

  /**
   * 📊 현재 메트릭 조회
   *
   * 현재 수집된 모든 메트릭 반환 (불변 객체)
   */
  public getMetrics(): RouterMetrics {
    return {
      ...this.metrics,
      tokenUsage: {
        ...this.metrics.tokenUsage,
        byUser: new Map(this.metrics.tokenUsage.byUser), // Map 복사
      },
      securityEvents: {
        ...this.metrics.securityEvents,
        threatsDetected: [...this.metrics.securityEvents.threatsDetected], // 배열 복사
      },
    };
  }

  /**
   * 📈 성능 분석 리포트
   *
   * 상세한 성능 분석 및 인사이트 제공
   */
  public getPerformanceReport(): {
    summary: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      tokenEfficiency: number;
    };
    engines: {
      engine: string;
      usage: number;
      percentage: number;
      performance: 'excellent' | 'good' | 'fair' | 'poor';
    }[];
    security: {
      threatLevel: 'low' | 'medium' | 'high';
      blockedRequests: number;
      filteredResponses: number;
      commonThreats: { threat: string; count: number }[];
    };
    recommendations: string[];
  } {
    const totalRequests = Math.max(1, this.metrics.totalRequests);
    const successRate = (this.metrics.successfulRequests / totalRequests) * 100;
    const tokenEfficiency =
      totalRequests > 0 ? this.metrics.tokenUsage.total / totalRequests : 0;

    // 엔진 성능 분석
    const engines = [
      {
        engine: 'Google AI',
        usage: this.metrics.engineUsage.googleAI,
        percentage: (this.metrics.engineUsage.googleAI / totalRequests) * 100,
        performance: this.getEnginePerformance('googleAI'),
      },
      {
        engine: 'Local RAG',
        usage: this.metrics.engineUsage.localRAG,
        percentage: (this.metrics.engineUsage.localRAG / totalRequests) * 100,
        performance: this.getEnginePerformance('localRAG'),
      },
      {
        engine: 'Korean NLP',
        usage: this.metrics.engineUsage.koreanNLP,
        percentage: (this.metrics.engineUsage.koreanNLP / totalRequests) * 100,
        performance: this.getEnginePerformance('koreanNLP'),
      },
      {
        engine: 'Fallback',
        usage: this.metrics.engineUsage.fallback,
        percentage: (this.metrics.engineUsage.fallback / totalRequests) * 100,
        performance: this.getEnginePerformance('fallback'),
      },
    ];

    // 보안 위협 분석
    const threatCounts: { [key: string]: number } = {};
    for (const threat of this.metrics.securityEvents.threatsDetected) {
      threatCounts[threat] = (threatCounts[threat] || 0) + 1;
    }

    const commonThreats = Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const threatLevel = this.calculateThreatLevel();
    const recommendations = this.generateRecommendations();

    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: Math.round(this.metrics.averageResponseTime),
        tokenEfficiency: Math.round(tokenEfficiency),
      },
      engines,
      security: {
        threatLevel,
        blockedRequests: this.metrics.securityEvents.promptsBlocked,
        filteredResponses: this.metrics.securityEvents.responsesFiltered,
        commonThreats,
      },
      recommendations,
    };
  }

  /**
   * 👥 사용자별 사용 통계
   *
   * 사용자별 토큰 사용량 및 활동 분석
   */
  public getUserStats(): {
    totalUsers: number;
    activeUsers: number;
    topUsers: Array<{ userId: string; tokens: number; percentage: number }>;
    averageTokensPerUser: number;
  } {
    const totalUsers = this.metrics.tokenUsage.byUser.size;
    const totalTokens = Math.max(1, this.metrics.tokenUsage.total);

    // 사용자별 토큰 사용량 정렬
    const userEntries = Array.from(this.metrics.tokenUsage.byUser.entries())
      .map(([userId, tokens]) => ({
        userId,
        tokens,
        percentage: (tokens / totalTokens) * 100,
      }))
      .sort((a, b) => b.tokens - a.tokens);

    const activeUsers = userEntries.filter((user) => user.tokens > 0).length;
    const topUsers = userEntries.slice(0, 10); // 상위 10명
    const averageTokensPerUser = totalUsers > 0 ? totalTokens / totalUsers : 0;

    return {
      totalUsers,
      activeUsers,
      topUsers,
      averageTokensPerUser: Math.round(averageTokensPerUser),
    };
  }

  /**
   * 📊 메트릭 히스토리 조회
   *
   * 시간대별 메트릭 변화 추이 분석
   */
  public getMetricsHistory(
    timeframe: 'last_hour' | 'last_day' | 'last_week' = 'last_hour'
  ): Array<{
    timestamp: number;
    requests: number;
    successRate: number;
    responseTime: number;
    tokensUsed: number;
  }> {
    const now = Date.now();
    let cutoffTime: number;

    switch (timeframe) {
      case 'last_hour':
        cutoffTime = now - 60 * 60 * 1000; // 1시간 전
        break;
      case 'last_day':
        cutoffTime = now - 24 * 60 * 60 * 1000; // 24시간 전
        break;
      case 'last_week':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000; // 7일 전
        break;
    }

    return this.metricsHistory
      .filter((entry) => entry.timestamp >= cutoffTime)
      .map((entry) => ({
        timestamp: entry.timestamp,
        requests: entry.snapshot.totalRequests,
        successRate:
          entry.snapshot.totalRequests > 0
            ? (entry.snapshot.successfulRequests /
                entry.snapshot.totalRequests) *
              100
            : 0,
        responseTime: entry.snapshot.averageResponseTime,
        tokensUsed: entry.snapshot.tokenUsage.daily,
      }));
  }

  /**
   * 🧹 일일 메트릭 초기화
   *
   * 새로운 날의 메트릭 추적 시작
   */
  public resetDailyLimits(): void {
    this.metrics.tokenUsage.daily = 0;
    this.metrics.tokenUsage.byUser.clear();
    console.log('🔄 일일 토큰 사용량 리셋');
  }

  /**
   * 🗑️ 보안 이벤트 로그 정리
   *
   * 오래된 보안 이벤트 데이터 정리
   */
  public cleanupSecurityLogs(maxAge: number = 86400000): void {
    // 최근 1000개 위협만 유지 (타임스탬프 기반 정리는 향후 구현)
    const before = this.metrics.securityEvents.threatsDetected.length;
    this.metrics.securityEvents.threatsDetected =
      this.metrics.securityEvents.threatsDetected.slice(-1000);

    console.log(
      `🧹 보안 로그 정리: ${before} → ${this.metrics.securityEvents.threatsDetected.length}`
    );
  }

  /**
   * 🔄 설정 업데이트
   *
   * 라우터 설정 변경 시 메트릭 시스템 재구성
   */
  public updateConfig(newConfig: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 메트릭 시스템 설정 업데이트:', {
      dailyTokenLimit: this.config.dailyTokenLimit,
      userTokenLimit: this.config.userTokenLimit,
    });
  }

  /**
   * 🔥 전체 메트릭 리셋
   *
   * 테스트나 초기화 목적으로 모든 메트릭 초기화
   */
  public resetAllMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.metricsHistory = [];
    console.log('🔥 전체 메트릭 리셋 완료');
  }

  /**
   * 📸 메트릭 스냅샷 저장
   *
   * 현재 메트릭 상태를 히스토리에 저장 (5분 간격)
   */
  private saveMetricsSnapshot(): void {
    const now = Date.now();
    const lastSnapshot = this.metricsHistory[this.metricsHistory.length - 1];

    // 5분마다 스냅샷 저장 (300000ms)
    if (!lastSnapshot || now - lastSnapshot.timestamp >= 300000) {
      this.metricsHistory.push({
        timestamp: now,
        snapshot: { ...this.getMetrics() },
      });

      // 히스토리 크기 제한
      if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
        this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE);
      }
    }
  }

  /**
   * ⚡ 엔진 성능 평가
   */
  private getEnginePerformance(
    engine: string
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    // 간단한 성능 평가 로직 (향후 더 정교한 분석 추가 가능)
    const usage =
      this.metrics.engineUsage[
        engine as keyof typeof this.metrics.engineUsage
      ] || 0;
    const totalRequests = Math.max(1, this.metrics.totalRequests);
    const usagePercentage = (usage / totalRequests) * 100;

    if (usagePercentage >= 50) return 'excellent';
    if (usagePercentage >= 25) return 'good';
    if (usagePercentage >= 10) return 'fair';
    return 'poor';
  }

  /**
   * 🚨 위험 수준 계산
   */
  private calculateThreatLevel(): 'low' | 'medium' | 'high' {
    const totalRequests = Math.max(1, this.metrics.totalRequests);
    const blockedPercentage =
      (this.metrics.securityEvents.promptsBlocked / totalRequests) * 100;
    const threatCount = this.metrics.securityEvents.threatsDetected.length;

    if (blockedPercentage >= 10 || threatCount >= 50) return 'high';
    if (blockedPercentage >= 5 || threatCount >= 20) return 'medium';
    return 'low';
  }

  /**
   * 💡 개선 권장사항 생성
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalRequests = Math.max(1, this.metrics.totalRequests);
    const successRate = (this.metrics.successfulRequests / totalRequests) * 100;

    // 성공률 기반 권장사항
    if (successRate < 90) {
      recommendations.push(
        '요청 성공률이 낮습니다. 엔진 안정성을 점검해보세요.'
      );
    }

    // 응답 시간 기반 권장사항
    if (this.metrics.averageResponseTime > 5000) {
      recommendations.push(
        '평균 응답 시간이 길어지고 있습니다. 캐시 설정을 최적화하세요.'
      );
    }

    // 토큰 사용량 기반 권장사항
    const tokenUsagePercentage =
      (this.metrics.tokenUsage.daily / this.config.dailyTokenLimit) * 100;
    if (tokenUsagePercentage > 80) {
      recommendations.push(
        '일일 토큰 사용량이 80%를 초과했습니다. 사용량을 모니터링하세요.'
      );
    }

    // 보안 기반 권장사항
    const blockedPercentage =
      (this.metrics.securityEvents.promptsBlocked / totalRequests) * 100;
    if (blockedPercentage > 5) {
      recommendations.push(
        '차단된 요청 비율이 높습니다. 보안 정책을 검토해보세요.'
      );
    }

    // 엔진 사용량 기반 권장사항
    const fallbackPercentage =
      (this.metrics.engineUsage.fallback / totalRequests) * 100;
    if (fallbackPercentage > 20) {
      recommendations.push(
        '폴백 엔진 사용률이 높습니다. 주 엔진 성능을 점검하세요.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('모든 메트릭이 정상 범위에 있습니다.');
    }

    return recommendations;
  }
}
