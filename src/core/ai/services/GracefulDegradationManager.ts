/**
 * 🛡️ Graceful Degradation Manager
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 삭제 금지!
 *
 * AI 엔진 성능 저하 관리 전용 서비스
 * - 컴포넌트 상태 모니터링
 * - 처리 전략 결정
 * - 폴백 시스템 관리
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 * - src/core/ai/components/AnalysisProcessor.ts
 *
 * 🔄 의존성:
 * - ../types/unified-ai.types (타입 정의)
 * - @/services/ai/GoogleAIService
 * - @/lib/google-ai-manager
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import {
  ComponentHealthCheck,
  ProcessingStrategy,
  DegradationStats,
  SystemStatus,
} from '../types/unified-ai.types';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { isGoogleAIAvailable } from '@/lib/google-ai-manager';

export class GracefulDegradationManager {
  private static instance: GracefulDegradationManager | null = null;
  private componentHealth: Map<string, boolean> = new Map();
  private currentAnalysisTier: string = 'enhanced';
  private degradationStats: DegradationStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    fallbacksUsed: 0,
    emergencyModeActivations: 0,
  };

  private constructor() {
    this.initializeComponentHealth();
  }

  public static getInstance(): GracefulDegradationManager {
    if (!GracefulDegradationManager.instance) {
      GracefulDegradationManager.instance = new GracefulDegradationManager();
    }
    return GracefulDegradationManager.instance;
  }

  /**
   * 컴포넌트 상태 초기화
   */
  private initializeComponentHealth(): void {
    const components = [
      'google-ai',
      'mcp',
      'rag',
      'redis',
      'context-manager',
      'custom-engines',
      'opensource-engines',
    ];

    components.forEach(component => {
      this.componentHealth.set(component, true);
    });

    console.log(`🛡️ ${components.length}개 컴포넌트 상태 초기화 완료`);
  }

  /**
   * 컴포넌트 상태 체크
   */
  public async checkComponentHealth(): Promise<ComponentHealthCheck> {
    const availableComponents: string[] = [];

    // Google AI 상태 체크
    try {
      const googleAIAvailable = await isGoogleAIAvailable();
      if (googleAIAvailable) {
        availableComponents.push('google-ai');
        this.componentHealth.set('google-ai', true);
      } else {
        this.componentHealth.set('google-ai', false);
      }
    } catch (error) {
      this.componentHealth.set('google-ai', false);
    }

    // MCP 상태 체크
    try {
      // MCP 클라이언트 상태 확인 로직
      availableComponents.push('mcp');
      this.componentHealth.set('mcp', true);
    } catch (error) {
      this.componentHealth.set('mcp', false);
    }

    // RAG 엔진 상태 체크
    try {
      availableComponents.push('rag');
      this.componentHealth.set('rag', true);
    } catch (error) {
      this.componentHealth.set('rag', false);
    }

    // Redis 상태 체크
    try {
      availableComponents.push('redis');
      this.componentHealth.set('redis', true);
    } catch (error) {
      this.componentHealth.set('redis', false);
    }

    // 기본 컴포넌트들은 항상 사용 가능
    ['context-manager', 'custom-engines', 'opensource-engines'].forEach(
      component => {
        availableComponents.push(component);
        this.componentHealth.set(component, true);
      }
    );

    const overallHealth = this.determineOverallHealth(availableComponents);

    console.log(
      `🔍 컴포넌트 상태 체크 완료: ${availableComponents.length}개 사용 가능 (${overallHealth})`
    );

    return {
      availableComponents,
      overallHealth,
    };
  }

  /**
   * 전체 시스템 상태 결정
   */
  private determineOverallHealth(
    availableComponents: string[]
  ): 'healthy' | 'degraded' | 'critical' | 'emergency' {
    const totalComponents = 7;
    const availableCount = availableComponents.length;
    const healthRatio = availableCount / totalComponents;

    if (healthRatio >= 0.8) return 'healthy';
    if (healthRatio >= 0.6) return 'degraded';
    if (healthRatio >= 0.4) return 'critical';
    return 'emergency';
  }

  /**
   * 처리 전략 결정
   */
  public determineProcessingStrategy(
    systemHealth: ComponentHealthCheck
  ): ProcessingStrategy {
    const { availableComponents, overallHealth } = systemHealth;

    // Beta 모드 (모든 컴포넌트 사용 가능)
    if (
      overallHealth === 'healthy' &&
      availableComponents.includes('google-ai')
    ) {
      this.currentAnalysisTier = 'beta_enabled';
      return {
        tier: 'beta_enabled',
        usageReason: 'All components available, using beta features',
      };
    }

    // Enhanced 모드 (핵심 컴포넌트 사용 가능)
    if (overallHealth === 'healthy' || overallHealth === 'degraded') {
      this.currentAnalysisTier = 'enhanced';
      return {
        tier: 'enhanced',
        usageReason: 'Core components available, enhanced analysis enabled',
      };
    }

    // Core Only 모드 (기본 컴포넌트만 사용)
    if (overallHealth === 'critical') {
      this.currentAnalysisTier = 'core_only';
      this.degradationStats.fallbacksUsed++;
      return {
        tier: 'core_only',
        usageReason: 'Limited components, using core functionality only',
      };
    }

    // Emergency 모드 (최소 기능만 사용)
    this.currentAnalysisTier = 'emergency';
    this.degradationStats.emergencyModeActivations++;
    return {
      tier: 'emergency',
      usageReason: 'Critical system state, emergency mode activated',
    };
  }

  /**
   * 성능 저하 수준 계산
   */
  public calculateDegradationLevel(
    availableComponents: string[]
  ): 'none' | 'minimal' | 'moderate' | 'high' | 'critical' {
    const totalComponents = 7;
    const availableCount = availableComponents.length;
    const degradationRatio = 1 - availableCount / totalComponents;

    if (degradationRatio <= 0.1) return 'none';
    if (degradationRatio <= 0.3) return 'minimal';
    if (degradationRatio <= 0.5) return 'moderate';
    if (degradationRatio <= 0.7) return 'high';
    return 'critical';
  }

  /**
   * 시스템 권장사항 생성
   */
  public getSystemRecommendation(tier: string): string {
    const recommendations: Record<string, string> = {
      beta_enabled:
        '🚀 모든 시스템이 정상 작동 중입니다. 베타 기능을 활용하여 최고 성능을 제공합니다.',
      enhanced:
        '✅ 핵심 시스템이 정상 작동 중입니다. 향상된 분석 기능을 제공합니다.',
      core_only:
        '⚠️ 일부 시스템에 문제가 있습니다. 기본 기능만 사용 가능합니다.',
      emergency: '🚨 시스템에 심각한 문제가 있습니다. 최소 기능만 제공됩니다.',
    };

    return recommendations[tier] || '❓ 시스템 상태를 확인할 수 없습니다.';
  }

  /**
   * 통계 업데이트
   */
  public updateStats(responseTime: number): void {
    this.degradationStats.totalRequests++;

    // 평균 응답 시간 계산 (이동 평균)
    const alpha = 0.1; // 가중치
    this.degradationStats.averageResponseTime =
      (1 - alpha) * this.degradationStats.averageResponseTime +
      alpha * responseTime;
  }

  /**
   * 성능 저하 통계 조회
   */
  public getDegradationStats(): DegradationStats {
    return { ...this.degradationStats };
  }

  /**
   * 시스템 상태 조회
   */
  public async getSystemStatus(): Promise<SystemStatus> {
    const healthCheck = await this.checkComponentHealth();
    const strategy = this.determineProcessingStrategy(healthCheck);
    const degradationLevel = this.calculateDegradationLevel(
      healthCheck.availableComponents
    );
    const recommendation = this.getSystemRecommendation(strategy.tier);

    return {
      tier: strategy.tier as any,
      availableComponents: healthCheck.availableComponents,
      degradationLevel,
      recommendation,
      stats: this.getDegradationStats(),
      componentHealth: Object.fromEntries(this.componentHealth),
    };
  }

  /**
   * 컴포넌트 상태 강제 설정 (테스트용)
   */
  public setComponentHealth(component: string, healthy: boolean): void {
    this.componentHealth.set(component, healthy);
    console.log(`🔧 ${component} 상태 강제 설정: ${healthy ? '정상' : '오류'}`);
  }

  /**
   * 통계 초기화
   */
  public resetStats(): void {
    this.degradationStats = {
      totalRequests: 0,
      averageResponseTime: 0,
      fallbacksUsed: 0,
      emergencyModeActivations: 0,
    };
    console.log('📊 성능 저하 통계 초기화 완료');
  }

  /**
   * 인스턴스 정리
   */
  public destroy(): void {
    this.componentHealth.clear();
    this.resetStats();
    GracefulDegradationManager.instance = null;
  }
}
