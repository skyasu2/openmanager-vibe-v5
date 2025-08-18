/**
 * 🛡️ Unified AI Engine Router - Security System
 *
 * Comprehensive security layer for AI query processing
 * - Prompt sanitization and threat detection
 * - Response filtering and risk assessment
 * - Security event tracking and logging
 * - Token limit enforcement
 * - Rate limiting and abuse prevention
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { QueryRequest } from './SimplifiedQueryEngine';
import {
  PromptSanitizer,
  sanitizePrompt,
  type SanitizationResult,
} from './security/PromptSanitizer';
import {
  AIResponseFilter,
  filterAIResponse,
} from './security/AIResponseFilter';
import {
  RouterMetrics,
  RouteResult,
  SecurityContext,
  RouterConfig,
} from './UnifiedAIEngineRouter.types';

export class UnifiedAIEngineRouterSecurity {
  private promptSanitizer!: PromptSanitizer;
  private responseFilter!: AIResponseFilter;
  private securityConfig: SecurityContext;

  constructor(config: RouterConfig) {
    this.securityConfig = {
      enableSecurity: config.enableSecurity,
      strictMode: config.strictSecurityMode,
      enableKoreanProtection: config.enableKoreanNLP,
    };

    this.initializeSecurityComponents();
  }

  /**
   * 🔐 보안 컴포넌트 초기화
   */
  private initializeSecurityComponents(): void {
    try {
      // Prompt 보안 필터 초기화
      this.promptSanitizer = PromptSanitizer.getInstance({
        enableStrictMode: this.securityConfig.strictMode,
        enableKoreanProtection: this.securityConfig.enableKoreanProtection,
      });

      // Response 보안 필터 초기화
      this.responseFilter = AIResponseFilter.getInstance({
        enableStrictFiltering: this.securityConfig.strictMode,
      });

      console.log('🛡️ 보안 시스템 초기화 완료');
    } catch (error) {
      console.error('❌ 보안 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🛡️ 요청 보안 검사 적용
   */
  public async applySecurity(
    request: QueryRequest,
    metrics: RouterMetrics
  ): Promise<SanitizationResult> {
    if (!this.securityConfig.enableSecurity) {
      return {
        sanitized: request.query,
        originalLength: request.query.length,
        sanitizedLength: request.query.length,
        riskLevel: 'low',
        threatsDetected: [],
        blocked: false,
      };
    }

    const sanitizationResult = sanitizePrompt(request.query);

    // 보안 이벤트 기록
    if (sanitizationResult.threatsDetected.length > 0) {
      metrics.securityEvents.threatsDetected.push(
        ...sanitizationResult.threatsDetected
      );

      if (
        sanitizationResult.riskLevel === 'critical' ||
        sanitizationResult.blocked
      ) {
        metrics.securityEvents.promptsBlocked++;
      }

      console.warn('🚨 보안 위협 감지:', {
        threats: sanitizationResult.threatsDetected,
        riskLevel: sanitizationResult.riskLevel,
        originalQuery: request.query.substring(0, 100) + '...',
      });
    }

    return sanitizationResult;
  }

  /**
   * 🔍 응답 보안 필터링
   */
  public async filterResponse(
    response: string,
    metrics: RouterMetrics
  ): Promise<{
    filtered: string;
    riskLevel: 'safe' | 'warning' | 'blocked';
    requiresRegeneration: boolean;
    threatsDetected: string[];
  }> {
    if (!this.securityConfig.enableSecurity) {
      return {
        filtered: response,
        riskLevel: 'safe',
        requiresRegeneration: false,
        threatsDetected: [],
      };
    }

    const filterResult = filterAIResponse(response);

    // 보안 이벤트 기록
    if (
      filterResult.requiresRegeneration ||
      filterResult.riskLevel === 'blocked'
    ) {
      metrics.securityEvents.responsesFiltered++;

      console.warn('🚨 응답 필터링 적용:', {
        riskLevel: filterResult.riskLevel,
        requiresRegeneration: filterResult.requiresRegeneration,
        responseLength: response.length,
      });
    }

    // Map issuesDetected to threatsDetected for compatibility
    return {
      filtered: filterResult.filtered,
      riskLevel: filterResult.riskLevel,
      requiresRegeneration: filterResult.requiresRegeneration,
      threatsDetected: filterResult.issuesDetected,
    };
  }

  /**
   * 💰 토큰 사용량 제한 검사
   */
  public checkTokenLimits(
    userId: string,
    metrics: RouterMetrics,
    config: RouterConfig
  ): {
    allowed: boolean;
    reason?: string;
    remainingDaily?: number;
    remainingUser?: number;
  } {
    // 일일 전체 한도 확인
    const dailyRemaining = config.dailyTokenLimit - metrics.tokenUsage.daily;
    if (dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        remainingDaily: 0,
      };
    }

    // 사용자별 한도 확인
    const userUsage = metrics.tokenUsage.byUser.get(userId) || 0;
    const userRemaining = config.userTokenLimit - userUsage;
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
   */
  public recordTokenUsage(
    userId: string,
    tokens: number,
    metrics: RouterMetrics
  ): void {
    metrics.tokenUsage.daily += tokens;
    metrics.tokenUsage.total += tokens;

    const currentUserUsage = metrics.tokenUsage.byUser.get(userId) || 0;
    metrics.tokenUsage.byUser.set(userId, currentUserUsage + tokens);

    console.log(`📊 토큰 사용량 기록: 사용자 ${userId}, ${tokens} 토큰`);
  }

  /**
   * 🚫 보안 차단 응답 생성
   */
  public createSecurityBlockedResponse(
    securityResult: SanitizationResult,
    processingPath: string[]
  ): RouteResult {
    return {
      success: false,
      response: this.getSecurityBlockedMessage(securityResult),
      engine: 'fallback' as const,
      confidence: 0,
      thinkingSteps: [
        {
          step: '보안 검사',
          description: `위험 요소 탐지: ${securityResult.threatsDetected.join(', ')}`,
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: true,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * 🚫 토큰 제한 응답 생성
   */
  public createTokenLimitResponse(
    reason: string,
    processingPath: string[]
  ): RouteResult {
    const message = this.getTokenLimitMessage(reason);

    return {
      success: false,
      response: message,
      engine: 'fallback' as const,
      confidence: 0,
      thinkingSteps: [
        {
          step: '사용량 확인',
          description: this.getTokenLimitDescription(reason),
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * 📈 보안 통계 조회
   */
  public getSecurityStats(metrics: RouterMetrics): {
    totalThreats: number;
    promptsBlocked: number;
    responsesFiltered: number;
    threatTypes: { [key: string]: number };
    blockRate: number;
    filterRate: number;
  } {
    const totalRequests = Math.max(1, metrics.totalRequests);
    const threatTypes: { [key: string]: number } = {};

    // 위협 유형별 카운트
    for (const threat of metrics.securityEvents.threatsDetected) {
      threatTypes[threat] = (threatTypes[threat] || 0) + 1;
    }

    return {
      totalThreats: metrics.securityEvents.threatsDetected.length,
      promptsBlocked: metrics.securityEvents.promptsBlocked,
      responsesFiltered: metrics.securityEvents.responsesFiltered,
      threatTypes,
      blockRate: (metrics.securityEvents.promptsBlocked / totalRequests) * 100,
      filterRate:
        (metrics.securityEvents.responsesFiltered / totalRequests) * 100,
    };
  }

  /**
   * 🔄 보안 설정 업데이트
   */
  public updateSecurityConfig(newConfig: Partial<SecurityContext>): void {
    this.securityConfig = { ...this.securityConfig, ...newConfig };

    // 컴포넌트 재초기화 (필요한 경우)
    if (
      newConfig.strictMode !== undefined ||
      newConfig.enableKoreanProtection !== undefined
    ) {
      this.initializeSecurityComponents();
    }

    console.log('🛡️ 보안 설정 업데이트:', this.securityConfig);
  }

  /**
   * 🧹 보안 이벤트 로그 정리
   */
  public cleanupSecurityLogs(
    metrics: RouterMetrics,
    maxAge: number = 86400000
  ): void {
    const cutoffTime = Date.now() - maxAge; // 기본 24시간

    // 오래된 위협 로그 제거 (실제 구현 시에는 타임스탬프 포함 필요)
    const before = metrics.securityEvents.threatsDetected.length;
    metrics.securityEvents.threatsDetected =
      metrics.securityEvents.threatsDetected.slice(-1000); // 최근 1000개만 유지

    console.log(
      `🧹 보안 로그 정리: ${before} → ${metrics.securityEvents.threatsDetected.length}`
    );
  }

  /**
   * 🔒 보안 차단 메시지 생성
   */
  private getSecurityBlockedMessage(
    securityResult: SanitizationResult
  ): string {
    if (this.securityConfig.strictMode) {
      return '보안 정책에 의해 처리할 수 없는 요청입니다. 다른 방식으로 질문해 주세요.';
    } else {
      return '안전한 요청으로 수정하여 다시 시도해 주세요.';
    }
  }

  /**
   * 💰 토큰 제한 메시지 생성
   */
  private getTokenLimitMessage(reason: string): string {
    switch (reason) {
      case 'daily_limit_exceeded':
        return '일일 사용 한도를 초과했습니다. 내일 다시 시도해 주세요.';
      case 'user_limit_exceeded':
        return '개인 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
      default:
        return '사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  /**
   * 💰 토큰 제한 설명 생성
   */
  private getTokenLimitDescription(reason: string): string {
    switch (reason) {
      case 'daily_limit_exceeded':
        return '일일 전체 토큰 사용량 한도 초과';
      case 'user_limit_exceeded':
        return '사용자별 토큰 사용량 한도 초과';
      default:
        return '토큰 사용량 한도 초과';
    }
  }
}
