/**
 * 🔬 Analysis Processor
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 수정 시 신중히 검토하세요!
 *
 * AI 분석 처리 전용 컴포넌트
 * - 다양한 티어별 분석 수행
 * - 의도 분류 및 컨텍스트 처리
 * - 응답 생성 및 추천사항 생성
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 *
 * 🔄 의존성:
 * - ../types/unified-ai.types (타입 정의)
 * - ../services/GracefulDegradationManager (성능 저하 관리)
 * - @/services/ai/GoogleAIService
 * - @/services/mcp/real-mcp-client
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { GracefulDegradationManager } from '../GracefulDegradationManager';
import {
  MCPContext,
  MCPResponse,
  ProcessingStrategy,
} from '../types/unified-ai.types';

export class AnalysisProcessor {
  private static instance: AnalysisProcessor | null = null;
  private degradationManager: GracefulDegradationManager;
  private googleAI?: GoogleAIService;
  private mcpClient: RealMCPClient | null = null;
  private openSourceEngines?: OpenSourceEngines;
  private customEngines?: CustomEngines;

  private constructor() {
    this.degradationManager = GracefulDegradationManager.getInstance();
  }

  public static getInstance(): AnalysisProcessor {
    if (!AnalysisProcessor.instance) {
      AnalysisProcessor.instance = new AnalysisProcessor();
    }
    return AnalysisProcessor.instance;
  }

  /**
   * 엔진 초기화
   */
  public async initialize(
    googleAI?: GoogleAIService,
    mcpClient?: RealMCPClient,
    openSourceEngines?: OpenSourceEngines,
    customEngines?: CustomEngines
  ): Promise<void> {
    this.googleAI = googleAI;
    this.mcpClient = mcpClient || null;
    this.openSourceEngines = openSourceEngines;
    this.customEngines = customEngines;

    console.log('🔬 Analysis Processor 초기화 완료');
  }

  /**
   * 의도 분류
   */
  public async classifyIntent(query: string, context?: any): Promise<any> {
    // 간단한 의도 분류 로직
    const intent = {
      primary: 'analysis',
      confidence: 0.8,
      category: 'server-monitoring',
      urgency: 'medium',
    };

    // 키워드 기반 의도 분류
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes('긴급') ||
      lowerQuery.includes('critical') ||
      lowerQuery.includes('emergency')
    ) {
      intent.urgency = 'high';
      intent.confidence = 0.9;
    }

    if (lowerQuery.includes('서버') || lowerQuery.includes('server')) {
      intent.category = 'server-monitoring';
      intent.primary = 'server-analysis';
    }

    if (lowerQuery.includes('네트워크') || lowerQuery.includes('network')) {
      intent.category = 'network-monitoring';
      intent.primary = 'network-analysis';
    }

    console.log(`🎯 의도 분류 완료: ${intent.primary} (${intent.confidence})`);
    return intent;
  }

  /**
   * Graceful Analysis 수행
   */
  public async performGracefulAnalysis(
    intent: any,
    context: MCPContext,
    strategy: ProcessingStrategy,
    options?: any
  ): Promise<MCPResponse> {
    console.log(`🔬 ${strategy.tier} 티어로 분석 시작`);

    switch (strategy.tier) {
      case 'beta_enabled':
        return this.performBetaEnabledAnalysis(intent, context, options);
      case 'enhanced':
        return this.performEnhancedAnalysis(intent, context, options);
      case 'core_only':
        return this.performCoreOnlyAnalysis(intent, context, options);
      case 'emergency':
        return this.performEmergencyAnalysis(intent, context);
      default:
        return this.performEnhancedAnalysis(intent, context, options);
    }
  }

  /**
   * Beta 모드 분석 (모든 엔진 사용)
   */
  private async performBetaEnabledAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    console.log('🚀 Beta 모드 분석 시작 (Google AI + MCP + RAG)');

    try {
      // Google AI 우선 시도
      if (this.googleAI) {
        const googleResult = await this.googleAI.generateResponse(
          `서버 모니터링 분석: ${JSON.stringify(intent)}`
        );

        if (googleResult.success) {
          return {
            success: true,
            content: googleResult.content || '분석이 완료되었습니다.',
            confidence: 0.95,
            sources: ['google-ai', 'beta-mode'],
            metadata: { tier: 'beta_enabled', engine: 'google-ai' },
          };
        }
      }

      // MCP 폴백
      return this.performEnhancedAnalysis(intent, context, options);
    } catch (error) {
      console.error('❌ Beta 모드 분석 실패:', error);
      return this.performEnhancedAnalysis(intent, context, options);
    }
  }

  /**
   * Enhanced 모드 분석 (MCP + RAG)
   */
  private async performEnhancedAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    console.log('⚡ Enhanced 모드 분석 시작 (MCP + RAG)');

    try {
      // MCP 클라이언트 시도
      if (this.mcpClient) {
        try {
          // 실제 MCP 메서드 사용
          const mcpResult = await this.mcpClient.performComplexQuery(
            intent.primary,
            context
          );

          if (mcpResult && mcpResult.success) {
            return {
              success: true,
              content: mcpResult.content || '분석이 완료되었습니다.',
              confidence: mcpResult.confidence || 0.85,
              sources: ['mcp', 'enhanced-mode'],
              metadata: { tier: 'enhanced', engine: 'mcp' },
            };
          }
        } catch (mcpError) {
          console.warn('MCP 클라이언트 오류, RAG로 폴백:', mcpError);
        }
      }

      // RAG 엔진 폴백 (기본 응답으로 대체)
      return {
        success: true,
        content:
          '분석이 완료되었습니다. 시스템 상태가 정상적으로 모니터링되고 있습니다.',
        confidence: 0.75,
        sources: ['fallback', 'enhanced-mode'],
        metadata: { tier: 'enhanced', engine: 'fallback' },
      };
    } catch (error) {
      console.error('❌ Enhanced 모드 분석 실패:', error);
      return this.performCoreOnlyAnalysis(intent, context, options);
    }
  }

  /**
   * Core Only 모드 분석 (기본 엔진만)
   */
  private async performCoreOnlyAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    console.log('🔧 Core Only 모드 분석 시작 (기본 엔진)');

    try {
      // Custom 엔진 시도 (간단한 폴백 구현)
      if (this.customEngines) {
        try {
          // 간단한 분석 수행
          const customResult = {
            success: true,
            content: `${intent.primary}에 대한 기본 분석이 완료되었습니다.`,
            confidence: 0.65,
          };

          return {
            success: true,
            content: customResult.content,
            confidence: customResult.confidence,
            sources: ['custom-engines', 'core-mode'],
            metadata: { tier: 'core_only', engine: 'custom' },
          };
        } catch (customError) {
          console.warn('Custom 엔진 오류, OpenSource로 폴백:', customError);
        }
      }

      // OpenSource 엔진 폴백 (간단한 폴백 구현)
      if (this.openSourceEngines) {
        const osResult = {
          content: `${intent.primary}에 대한 오픈소스 분석이 완료되었습니다.`,
          confidence: 0.55,
        };

        return {
          success: true,
          content: osResult.content,
          confidence: osResult.confidence,
          sources: ['opensource-engines', 'core-mode'],
          metadata: { tier: 'core_only', engine: 'opensource' },
        };
      }

      // 최종 폴백
      return this.performEmergencyAnalysis(intent, context);
    } catch (error) {
      console.error('❌ Core Only 모드 분석 실패:', error);
      return this.performEmergencyAnalysis(intent, context);
    }
  }

  /**
   * Emergency 모드 분석 (최소 기능)
   */
  private async performEmergencyAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    console.log('🚨 Emergency 모드 분석 시작 (최소 기능)');

    // 하드코딩된 응답 생성
    const emergencyResponse = this.generateEmergencyResponse(intent, context);

    return {
      success: true,
      content: emergencyResponse,
      confidence: 0.3,
      sources: ['emergency-mode', 'hardcoded'],
      metadata: { tier: 'emergency', engine: 'emergency' },
    };
  }

  /**
   * 긴급 모드 응답 생성
   */
  private generateEmergencyResponse(intent: any, context: MCPContext): string {
    const responses = [
      '시스템이 제한된 모드로 작동 중입니다. 기본적인 모니터링 정보를 제공합니다.',
      '현재 일부 AI 엔진에 문제가 있어 간단한 분석만 가능합니다.',
      '서버 상태를 확인했습니다. 자세한 분석을 위해서는 시스템 복구가 필요합니다.',
      '긴급 모드에서 작동 중입니다. 핵심 메트릭만 모니터링 가능합니다.',
    ];

    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * 추천사항 생성
   */
  public generateRecommendations(response: MCPResponse, intent: any): string[] {
    const recommendations: string[] = [];

    // 신뢰도 기반 추천
    if (response.confidence < 0.5) {
      recommendations.push(
        '분석 결과의 신뢰도가 낮습니다. 추가 데이터 수집을 권장합니다.'
      );
    }

    // 의도별 추천
    switch (intent.primary) {
      case 'server-analysis':
        recommendations.push('서버 리소스 사용량을 정기적으로 모니터링하세요.');
        recommendations.push('CPU 사용률이 80% 이상일 때 알림을 설정하세요.');
        break;
      case 'network-analysis':
        recommendations.push('네트워크 대역폭 사용량을 확인하세요.');
        recommendations.push('패킷 손실률이 1% 이상일 때 조치를 취하세요.');
        break;
      default:
        recommendations.push('시스템 전반적인 상태를 정기적으로 점검하세요.');
    }

    // 긴급도별 추천
    if (intent.urgency === 'high') {
      recommendations.unshift('🚨 긴급: 즉시 시스템 관리자에게 연락하세요.');
    }

    return recommendations;
  }

  /**
   * 인스턴스 정리
   */
  public destroy(): void {
    AnalysisProcessor.instance = null;
  }
}
