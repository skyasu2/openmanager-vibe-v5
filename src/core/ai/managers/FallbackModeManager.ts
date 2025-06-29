/**
 * 🔄 폴백 모드 매니저 v3.1 (MCP 컨텍스트 도우미 적용)
 *
 * ✅ Supabase RAG + MCP 컨텍스트 조합
 * ✅ 3단계 폴백: RAG+MCP → Google AI → 기본 응답
 * ✅ 성능 최적화
 */

import {
  SupabaseRAGEngine,
  getSupabaseRAGEngine,
} from '@/lib/ml/supabase-rag-engine';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
// 서버 사이드에서만 MCP 클라이언트 사용
let RealMCPClient: any = null;
if (typeof window === 'undefined') {
  try {
    RealMCPClient = require('@/services/mcp/real-mcp-client').RealMCPClient;
  } catch (error) {
    console.warn('⚠️ MCP 클라이언트 로드 실패 (서버 사이드 전용):', error);
  }
}

type FallbackMode = 'primary' | 'secondary' | 'emergency' | 'offline';

interface FallbackConfig {
  timeoutMs: number;
  retryAttempts: number;
  enableLogging: boolean;
  fallbackChain: string[];
}

interface FallbackResult {
  success: boolean;
  mode: FallbackMode;
  engine: string;
  response: string;
  confidence: number;
  fallbacksUsed: string[];
  totalTime: number;
  mcpContextUsed: boolean; // 🎯 변경: MCP 컨텍스트 사용 여부
  error?: string;
}

/**
 * 🎯 다중 엔진 폴백 시스템 (MCP 컨텍스트 도우미 포함)
 */
export class FallbackModeManager {
  private static instance: FallbackModeManager | null = null;

  private supabaseRAG: SupabaseRAGEngine;
  private googleAI: GoogleAIService;
  private mcpClient: any; // 🎯 컨텍스트 수집 전용

  private config: FallbackConfig = {
    timeoutMs: 30000,
    retryAttempts: 3,
    enableLogging: true,
    fallbackChain: ['rag-with-mcp-context', 'google-ai', 'emergency'],
  };

  private constructor() {
    this.supabaseRAG = getSupabaseRAGEngine();
    this.googleAI = GoogleAIService.getInstance();
    this.mcpClient = RealMCPClient ? RealMCPClient.getInstance() : null; // 🎯 컨텍스트 수집 전용
  }

  public static getInstance(): FallbackModeManager {
    if (!FallbackModeManager.instance) {
      FallbackModeManager.instance = new FallbackModeManager();
    }
    return FallbackModeManager.instance;
  }

  /**
   * 🔄 폴백 체인 실행 (MCP 컨텍스트 도우미 포함)
   */
  public async executeWithFallback(
    query: string,
    category?: string,
    context?: any
  ): Promise<FallbackResult> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    let mcpContextUsed = false;

    // 0단계: MCP 컨텍스트 수집 (백그라운드)
    let mcpContext: any = null;
    try {
      console.log('🔍 백그라운드: MCP 컨텍스트 수집');
      mcpContext = await this.collectMCPContext(query, context);
      if (mcpContext) {
        mcpContextUsed = true;
        console.log('✅ MCP 컨텍스트 수집 성공');
      }
    } catch (error) {
      console.warn('⚠️ MCP 컨텍스트 수집 실패 (계속 진행):', error);
    }

    // 1단계: Supabase RAG + MCP 컨텍스트 조합 (Primary)
    try {
      console.log('🥇 1단계: Supabase RAG + MCP 컨텍스트 조합');
      const result = await this.tryRAGWithMCPContext(
        query,
        mcpContext,
        category
      );

      if (result.success) {
        return {
          success: result.success,
          mode: 'primary',
          engine: result.engine || 'rag-with-mcp-context',
          response: result.response || '',
          confidence: result.confidence || 0.8,
          fallbacksUsed,
          totalTime: Date.now() - startTime,
          mcpContextUsed,
        };
      }

      fallbacksUsed.push('rag-with-mcp-context-failed');
    } catch (error) {
      console.warn('⚠️ RAG + MCP 컨텍스트 실패:', error);
      fallbacksUsed.push('rag-with-mcp-context-error');
    }

    // 2단계: Google AI 폴백 (Secondary)
    try {
      console.log('🥈 2단계: Google AI 폴백');
      const result = await this.tryGoogleAI(query, mcpContext);

      if (result.success) {
        return {
          success: result.success,
          mode: 'secondary',
          engine: result.engine || 'google-ai-with-mcp-context',
          response: result.response || '',
          confidence: result.confidence || 0.7,
          fallbacksUsed,
          totalTime: Date.now() - startTime,
          mcpContextUsed,
        };
      }

      fallbacksUsed.push('google-ai-failed');
    } catch (error) {
      console.warn('⚠️ Google AI 폴백 실패:', error);
      fallbacksUsed.push('google-ai-error');
    }

    // 3단계: 긴급 응답 (Emergency)
    try {
      console.log('🚨 3단계: 긴급 응답');
      return {
        success: true,
        mode: 'emergency',
        engine: 'emergency-fallback',
        response: this.generateEmergencyResponse(query, mcpContext),
        confidence: 0.3,
        fallbacksUsed,
        totalTime: Date.now() - startTime,
        mcpContextUsed,
      };
    } catch (error) {
      console.error('❌ 긴급 응답 생성 실패:', error);
      fallbacksUsed.push('emergency-failed');
    }

    // 최종 실패
    return {
      success: false,
      mode: 'offline',
      engine: 'none',
      response:
        '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      confidence: 0,
      fallbacksUsed,
      totalTime: Date.now() - startTime,
      mcpContextUsed,
      error: '모든 폴백 실패',
    };
  }

  /**
   * 🔍 MCP 컨텍스트 수집 (RAG 도우미)
   */
  private async collectMCPContext(query: string, context?: any): Promise<any> {
    try {
      // 클라이언트 측에서는 MCP 비활성화
      if (!this.mcpClient || typeof window !== 'undefined') {
        console.log('⚠️ MCP 컨텍스트 수집: 클라이언트 측에서 비활성화');
        return null;
      }

      const mcpResult = await this.mcpClient.performComplexQuery(
        query,
        context
      );

      if (mcpResult && typeof mcpResult === 'object') {
        return {
          summary: mcpResult.response || mcpResult.summary,
          category: mcpResult.category,
          additionalInfo: mcpResult.additionalInfo || mcpResult.context,
          timestamp: new Date().toISOString(),
          source: 'mcp-context-helper',
        };
      }

      return null;
    } catch (error) {
      console.warn('MCP 컨텍스트 수집 실패:', error);
      return null;
    }
  }

  /**
   * 🥇 Supabase RAG + MCP 컨텍스트 조합 시도
   */
  private async tryRAGWithMCPContext(
    query: string,
    mcpContext: any,
    category?: string
  ): Promise<Partial<FallbackResult>> {
    await this.supabaseRAG.initialize();

    // MCP 컨텍스트를 활용한 향상된 RAG 검색
    const enhancedQuery = mcpContext
      ? `${query}\n\n[컨텍스트: ${mcpContext.summary || ''}]`
      : query;

    const result = await this.supabaseRAG.searchSimilar(enhancedQuery, {
      maxResults: 5,
      threshold: 0.5,
      category: category || mcpContext?.category,
    });

    if (result.success && result.results.length > 0) {
      let response = result.results[0].content;

      // MCP 컨텍스트를 응답에 통합
      if (mcpContext && mcpContext.additionalInfo) {
        response += `\n\n📋 추가 정보: ${mcpContext.additionalInfo}`;
      }

      return {
        success: true,
        engine: 'supabase-rag-with-mcp-context',
        response,
        confidence: Math.min(0.9, (result.results[0].similarity || 0.7) + 0.2), // MCP 컨텍스트 보너스
      };
    }

    throw new Error('RAG + MCP 컨텍스트 검색 실패');
  }

  /**
   * 🥈 Google AI 시도 (MCP 컨텍스트 활용)
   */
  private async tryGoogleAI(
    query: string,
    mcpContext: any
  ): Promise<Partial<FallbackResult>> {
    // MCP 컨텍스트가 있으면 Google AI 프롬프트에 포함
    let enhancedQuery = query;
    if (mcpContext && mcpContext.summary) {
      enhancedQuery = `${query}\n\n참고 컨텍스트: ${mcpContext.summary}`;
    }

    const result = await this.googleAI.generateResponse(enhancedQuery);

    if (result.success) {
      let response = result.content || '응답을 생성했습니다.';

      // MCP 컨텍스트 정보를 응답에 추가
      if (mcpContext && mcpContext.additionalInfo) {
        response += `\n\n🔍 시스템 정보: ${mcpContext.additionalInfo}`;
      }

      return {
        success: true,
        engine: 'google-ai-with-mcp-context',
        response,
        confidence: result.confidence || 0.7,
      };
    }

    throw new Error('Google AI 실패');
  }

  /**
   * 🚨 긴급 응답 생성 (MCP 컨텍스트 활용)
   */
  private generateEmergencyResponse(query: string, mcpContext: any): string {
    let response = `죄송합니다. 현재 일시적인 시스템 문제로 인해 정확한 답변을 드리기 어렵습니다.\n\n`;

    // MCP 컨텍스트가 있으면 활용
    if (mcpContext) {
      response += `수집된 기본 정보:\n${mcpContext.summary || '관련 정보를 수집했습니다.'}\n\n`;

      if (mcpContext.additionalInfo) {
        response += `추가 참고사항:\n${mcpContext.additionalInfo}\n\n`;
      }
    }

    response += `잠시 후 다시 시도해 주시거나, 더 구체적인 질문으로 다시 문의해 주세요.`;

    return response;
  }

  /**
   * 🛠️ 설정 관리
   */
  public updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): FallbackConfig {
    return { ...this.config };
  }
}
