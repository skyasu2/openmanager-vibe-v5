/**
 * 📝 Response Generator
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 수정 시 신중히 검토하세요!
 *
 * AI 응답 생성 전용 컴포넌트
 * - 통합 응답 포맷 생성
 * - 캐시된 응답 처리
 * - 에러 응답 생성
 * - 사고과정 로그 통합
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 *
 * 🔄 의존성:
 * - ../types/unified-ai.types (타입 정의)
 * - ../../../types/ai-thinking (사고과정 타입)
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import {
  UnifiedAnalysisRequest,
  UnifiedAnalysisResponse,
  MCPResponse,
  ComponentHealthCheck,
  ProcessingStrategy,
} from '../types/unified-ai.types';
import { AIThinkingStep } from '../../../types/ai-thinking';

export class ResponseGenerator {
  private static instance: ResponseGenerator | null = null;

  private constructor() {}

  public static getInstance(): ResponseGenerator {
    if (!ResponseGenerator.instance) {
      ResponseGenerator.instance = new ResponseGenerator();
    }
    return ResponseGenerator.instance;
  }

  /**
   * 성공 응답 생성
   */
  public createSuccessResponse(
    request: UnifiedAnalysisRequest,
    intent: any,
    analysisResult: MCPResponse,
    recommendations: string[],
    systemHealth: ComponentHealthCheck,
    strategy: ProcessingStrategy,
    thinkingSteps: AIThinkingStep[],
    processingTime: number,
    sessionId: string,
    fallbacksUsed: number = 0
  ): UnifiedAnalysisResponse {
    return {
      success: true,
      query: request.query,
      intent: {
        primary: intent.primary,
        confidence: intent.confidence,
        category: intent.category,
        urgency: intent.urgency || 'medium',
      },
      analysis: {
        summary: analysisResult.content,
        details: analysisResult.sources || [],
        confidence: analysisResult.confidence,
        processingTime,
      },
      recommendations,
      engines: {
        used: [strategy.tier],
        results: [analysisResult],
        fallbacks: fallbacksUsed,
      },
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        version: '5.0.0-enhanced',
        contextsUsed: request.context?.serverMetrics?.length || 0,
      },
      systemStatus: {
        tier: strategy.tier as any,
        availableComponents: systemHealth.availableComponents,
        degradationLevel: this.calculateDegradationLevel(
          systemHealth.availableComponents
        ),
        recommendation: this.getSystemRecommendation(strategy.tier),
      },
      // MasterAIEngine 통합 응답
      thinking_process: thinkingSteps,
      reasoning_steps: this.generateReasoningSteps('unified', request.query),
      performance: {
        memoryUsage: { heapUsed: 0, heapTotal: 0 }, // 실제 구현 시 PerformanceMonitor 사용
        cacheHit: false,
        memoryDelta: 0,
      },
      cache_hit: false,
      fallback_used: strategy.tier !== 'beta_enabled',
      engine_used: 'unified',
      response_time: processingTime,
    };
  }

  /**
   * 캐시된 응답 생성
   */
  public createCachedResponse(
    request: UnifiedAnalysisRequest,
    cached: any,
    processingTime: number,
    thinkingSteps: AIThinkingStep[]
  ): UnifiedAnalysisResponse {
    return {
      success: true,
      query: request.query,
      intent: cached.intent || {
        primary: 'cached',
        confidence: 1.0,
        category: 'cached',
        urgency: 'medium',
      },
      analysis: {
        summary: cached.analysis?.summary || '캐시된 결과입니다.',
        details: cached.analysis?.details || [],
        confidence: cached.analysis?.confidence || 0.9,
        processingTime,
      },
      recommendations: cached.recommendations || [],
      engines: {
        used: ['cache'],
        results: [cached],
        fallbacks: 0,
      },
      metadata: {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        version: '5.0.0-enhanced',
        contextsUsed: 0,
      },
      systemStatus: cached.systemStatus,
      thinking_process: thinkingSteps,
      reasoning_steps: ['캐시에서 결과를 가져왔습니다.'],
      performance: {
        memoryUsage: { heapUsed: 0, heapTotal: 0 },
        cacheHit: true,
        memoryDelta: 0,
      },
      cache_hit: true,
      fallback_used: false,
      engine_used: 'cache',
      response_time: processingTime,
    };
  }

  /**
   * 에러 응답 생성
   */
  public createErrorResponse(
    query: string,
    error: any,
    processingTime: number,
    thinkingSteps: AIThinkingStep[] = []
  ): UnifiedAnalysisResponse {
    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    return {
      success: false,
      query,
      intent: {
        primary: 'error',
        confidence: 0,
        category: 'error',
        urgency: 'high',
      },
      analysis: {
        summary: `처리 중 오류가 발생했습니다: ${errorMessage}`,
        details: [errorMessage],
        confidence: 0,
        processingTime,
      },
      recommendations: [
        '시스템 관리자에게 문의하세요.',
        '잠시 후 다시 시도해보세요.',
        '쿼리를 단순화해서 다시 시도해보세요.',
      ],
      engines: {
        used: ['error-handler'],
        results: [],
        fallbacks: 0,
      },
      metadata: {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        version: '5.0.0-enhanced',
        contextsUsed: 0,
      },
      systemStatus: {
        tier: 'emergency',
        availableComponents: [],
        degradationLevel: 'critical',
        recommendation: '시스템에 문제가 있습니다. 관리자에게 문의하세요.',
      },
      thinking_process: thinkingSteps,
      reasoning_steps: [
        '요청 처리를 시작했습니다.',
        `오류가 발생했습니다: ${errorMessage}`,
        '에러 응답을 생성합니다.',
      ],
      performance: {
        memoryUsage: { heapUsed: 0, heapTotal: 0 },
        cacheHit: false,
        memoryDelta: 0,
      },
      cache_hit: false,
      fallback_used: true,
      engine_used: 'error-handler',
      response_time: processingTime,
    };
  }

  /**
   * 사고과정 스텝 생성
   */
  public createThinkingStep(
    type:
      | 'analyzing'
      | 'processing'
      | 'reasoning'
      | 'generating'
      | 'completed'
      | 'error',
    title: string,
    description: string
  ): AIThinkingStep {
    return {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      duration: 0, // 실제 구현 시 계산
      progress: type === 'completed' ? 100 : type === 'error' ? 0 : 50, // 0-100
      metadata: {
        engine: 'unified',
        version: '5.0.0',
      },
    };
  }

  /**
   * 추론 단계 생성
   */
  private generateReasoningSteps(engine: string, query: string): string[] {
    return [
      `${engine} 엔진으로 "${query}" 분석 시작`,
      '컨텍스트 및 메타데이터 수집',
      '의도 분석 및 분류 수행',
      '적절한 처리 전략 결정',
      '분석 결과 생성 및 검증',
      '추천사항 및 최종 응답 구성',
    ];
  }

  /**
   * 성능 저하 수준 계산
   */
  private calculateDegradationLevel(
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
  private getSystemRecommendation(tier: string): string {
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
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 인스턴스 정리
   */
  public destroy(): void {
    ResponseGenerator.instance = null;
  }
}
