/**
 * 최적화된 통합 AI 엔진 v2.2 - 단순화 버전
 *
 * 안정성을 위해 3개 핵심 엔진으로 단순화:
 * - SupabaseRAGEngine (80%) - 메인 RAG 엔진 (유일한 RAG)
 * - Render MCP Client (18%) - 공식 MCP 서버 활용
 * - Google AI (2%) - 베타 기능 (질문 기능만)
 *
 * 제거된 엔진: CustomEngines, OpenSourceEngines (안정성 문제)
 */

import { GoogleAIEngine } from './engines/GoogleAIEngine';
import { MCPClientEngine } from './engines/MCPClientEngine';
import { SupabaseRAGMainEngine } from './engines/SupabaseRAGMainEngine';

export interface OptimizedAIRequest {
  query: string;
  mode?: 'AUTO' | 'GOOGLE_AI' | 'INTERNAL';
  category?: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizedAIResponse {
  success: boolean;
  response?: string;
  data?: any;
  engine: string;
  processingTime: number;
  confidence: number;
  fallbackUsed?: boolean;
  error?: string;
  metadata?: {
    mode: string;
    engineWeights: Record<string, number>;
    totalEngines: number;
    activeEngines: string[];
  };
}

export class OptimizedUnifiedAIEngine {
  private static instance: OptimizedUnifiedAIEngine;
  private engines: Map<string, any> = new Map();
  private initialized = false;
  private stats = {
    totalQueries: 0,
    successfulQueries: 0,
    fallbackUsed: 0,
    averageResponseTime: 0,
    engineUsage: {} as Record<string, number>,
  };

  // 엔진 가중치 (총 100%) - 3개 엔진으로 단순화
  private readonly ENGINE_WEIGHTS = {
    'supabase-rag': 80, // 메인 RAG 엔진 (유일한 RAG)
    'mcp-client': 18, // MCP 서버
    'google-ai': 2, // Google AI (질문만)
  };

  private constructor() {
    console.log('🚀 OptimizedUnifiedAIEngine v2.2 초기화 시작');
  }

  public static getInstance(): OptimizedUnifiedAIEngine {
    if (!OptimizedUnifiedAIEngine.instance) {
      OptimizedUnifiedAIEngine.instance = new OptimizedUnifiedAIEngine();
    }
    return OptimizedUnifiedAIEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔧 3개 핵심 엔진 초기화 시작...');

    try {
      // 1. SupabaseRAG 엔진 (80% 가중치) - 유일한 RAG 엔진
      console.log('📊 SupabaseRAG 엔진 초기화 (80% 가중치) - 메인 RAG');
      const supabaseEngine = new SupabaseRAGMainEngine();
      await supabaseEngine.initialize();
      this.engines.set('supabase-rag', supabaseEngine);

      // 2. MCP Client 엔진 (18% 가중치)
      console.log('🔗 MCP Client 엔진 초기화 (18% 가중치)');
      const mcpEngine = new MCPClientEngine();
      await mcpEngine.initialize();
      this.engines.set('mcp-client', mcpEngine);

      // 3. Google AI 엔진 (2% 가중치) - 질문 기능만
      console.log('🤖 Google AI 엔진 초기화 (2% 가중치) - 질문 기능만');
      const googleEngine = new GoogleAIEngine();
      await googleEngine.initialize();
      this.engines.set('google-ai', googleEngine);

      this.initialized = true;
      console.log('✅ OptimizedUnifiedAIEngine v2.2 초기화 완료');
      console.log(
        `📈 총 3개 엔진 활성화: ${Array.from(this.engines.keys()).join(', ')}`
      );
    } catch (error) {
      console.error('❌ OptimizedUnifiedAIEngine 초기화 실패:', error);
      throw error;
    }
  }

  public async processQuery(
    request: OptimizedAIRequest
  ): Promise<OptimizedAIResponse> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    if (!this.initialized) {
      await this.initialize();
    }

    const { query, mode = 'AUTO', category, priority = 'medium' } = request;

    try {
      console.log(`🔍 쿼리 처리 시작: "${query}" (모드: ${mode})`);

      let response: OptimizedAIResponse;

      switch (mode) {
        case 'GOOGLE_AI':
          response = await this.processWithGoogleAI(request);
          break;
        case 'INTERNAL':
          response = await this.processWithInternalEngines(request);
          break;
        case 'AUTO':
        default:
          response = await this.processWithAutoMode(request);
          break;
      }

      const processingTime = Date.now() - startTime;
      this.updateStats(response.engine, processingTime, true);

      return {
        ...response,
        processingTime,
        metadata: {
          mode,
          engineWeights: this.ENGINE_WEIGHTS,
          totalEngines: this.engines.size,
          activeEngines: Array.from(this.engines.keys()),
        },
      };
    } catch (error) {
      console.error('❌ 쿼리 처리 실패:', error);
      const processingTime = Date.now() - startTime;
      this.updateStats('error', processingTime, false);

      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        engine: 'error',
        processingTime,
        confidence: 0,
      };
    }
  }

  private async processWithAutoMode(
    request: OptimizedAIRequest
  ): Promise<OptimizedAIResponse> {
    // 3개 엔진 우선순위 (가중치 기반)
    const engines = [
      {
        name: 'supabase-rag',
        weight: 80,
        engine: this.engines.get('supabase-rag'),
      },
      {
        name: 'mcp-client',
        weight: 18,
        engine: this.engines.get('mcp-client'),
      },
      {
        name: 'google-ai',
        weight: 2,
        engine: this.engines.get('google-ai'),
      },
    ];

    let lastError: Error | null = null;

    // 각 엔진을 가중치 순으로 시도
    for (const { name, engine } of engines) {
      if (!engine) {
        console.log(`⚠️ ${name} 엔진이 초기화되지 않음, 건너뜀`);
        continue;
      }

      try {
        console.log(
          `🔄 ${name} 엔진 시도 중... (가중치: ${engines.find(e => e.name === name)?.weight}%)`
        );

        const result = await engine.processQuery(request);

        if (result && result.success) {
          console.log(
            `✅ ${name} 엔진 성공 (신뢰도: ${result.confidence || 'N/A'})`
          );
          return {
            ...result,
            engine: name,
            fallbackUsed: name !== 'supabase-rag',
          };
        } else {
          console.log(
            `⚠️ ${name} 엔진 응답 실패: ${result?.error || '알 수 없는 오류'}`
          );
          lastError = new Error(
            `${name} 엔진 응답 실패: ${result?.error || '알 수 없는 오류'}`
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '알 수 없는 오류';
        console.log(`⚠️ ${name} 엔진 실패: ${errorMsg}, 다음 엔진으로 폴백...`);
        lastError = error instanceof Error ? error : new Error(errorMsg);
        continue;
      }
    }

    // 모든 엔진 실패시 최종 폴백
    console.error('❌ 모든 엔진 실패, 기본 응답 반환');
    return {
      success: true,
      response: `질의 "${request.query}"에 대한 기본 응답입니다. 현재 일부 서비스가 일시적으로 사용할 수 없습니다.`,
      data: { fallback: true, query: request.query },
      engine: 'fallback',
      confidence: 0.3,
      fallbackUsed: true,
      processingTime: 0,
      error: lastError?.message,
    };
  }

  private async processWithGoogleAI(
    request: OptimizedAIRequest
  ): Promise<OptimizedAIResponse> {
    const engine = this.engines.get('google-ai');
    if (!engine) {
      console.error('❌ Google AI 엔진을 사용할 수 없습니다');
      return {
        success: false,
        error: 'Google AI 엔진을 사용할 수 없습니다',
        engine: 'google-ai',
        confidence: 0,
        processingTime: 0,
      };
    }

    try {
      console.log('🔄 GOOGLE_AI 모드: Google AI 엔진 시도 중...');
      const result = await engine.processQuery(request);

      if (result && result.success) {
        console.log('✅ GOOGLE_AI 모드: Google AI 엔진 성공');
        return {
          ...result,
          engine: 'google-ai',
        };
      } else {
        console.log(
          `⚠️ GOOGLE_AI 모드: Google AI 엔진 응답 실패: ${result?.error || '알 수 없는 오류'}`
        );
        return {
          success: false,
          error: result?.error || 'Google AI 엔진 응답 실패',
          engine: 'google-ai',
          confidence: 0,
          processingTime: 0,
        };
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`❌ GOOGLE_AI 모드: Google AI 엔진 실패: ${errorMsg}`);

      return {
        success: false,
        error: `Google AI 엔진 실패: ${errorMsg}`,
        engine: 'google-ai',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  private async processWithInternalEngines(
    request: OptimizedAIRequest
  ): Promise<OptimizedAIResponse> {
    // Google AI 제외한 내부 엔진들만 사용 (SupabaseRAG + MCP)
    const internalEngines = [
      { name: 'supabase-rag', engine: this.engines.get('supabase-rag') },
      { name: 'mcp-client', engine: this.engines.get('mcp-client') },
    ];

    let lastError: Error | null = null;

    for (const { name, engine } of internalEngines) {
      if (!engine) {
        console.log(`⚠️ INTERNAL 모드: ${name} 엔진이 초기화되지 않음, 건너뜀`);
        continue;
      }

      try {
        console.log(`🔄 INTERNAL 모드: ${name} 엔진 시도 중...`);
        const result = await engine.processQuery(request);

        if (result && result.success) {
          console.log(`✅ INTERNAL 모드: ${name} 엔진 성공`);
          return {
            ...result,
            engine: name,
            fallbackUsed: name !== 'supabase-rag',
          };
        } else {
          console.log(
            `⚠️ INTERNAL 모드: ${name} 엔진 응답 실패: ${result?.error || '알 수 없는 오류'}`
          );
          lastError = new Error(
            `${name} 엔진 응답 실패: ${result?.error || '알 수 없는 오류'}`
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '알 수 없는 오류';
        console.log(
          `⚠️ INTERNAL 모드: ${name} 엔진 실패: ${errorMsg}, 다음 엔진으로 폴백...`
        );
        lastError = error instanceof Error ? error : new Error(errorMsg);
        continue;
      }
    }

    // 내부 엔진들 모두 실패시 폴백
    console.error('❌ INTERNAL 모드: 모든 내부 엔진 실패, 기본 응답 반환');
    return {
      success: true,
      response: `INTERNAL 모드에서 "${request.query}"에 대한 기본 응답입니다. 내부 엔진들이 일시적으로 사용할 수 없습니다.`,
      data: { fallback: true, query: request.query, mode: 'INTERNAL' },
      engine: 'internal-fallback',
      confidence: 0.3,
      fallbackUsed: true,
      processingTime: 0,
      error: lastError?.message,
    };
  }

  private updateStats(
    engine: string,
    processingTime: number,
    success: boolean
  ): void {
    if (success) {
      this.stats.successfulQueries++;
    }

    // 평균 응답 시간 업데이트
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalQueries - 1) +
        processingTime) /
      this.stats.totalQueries;

    // 엔진별 사용량 통계
    if (!this.stats.engineUsage[engine]) {
      this.stats.engineUsage[engine] = 0;
    }
    this.stats.engineUsage[engine]++;

    if (engine.includes('fallback')) {
      this.stats.fallbackUsed++;
    }
  }

  public getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalQueries > 0
          ? this.stats.successfulQueries / this.stats.totalQueries
          : 0,
      fallbackRate:
        this.stats.totalQueries > 0
          ? this.stats.fallbackUsed / this.stats.totalQueries
          : 0,
    };
  }

  public getHealthStatus() {
    const engineStatus = Array.from(this.engines.entries()).map(
      ([name, engine]) => ({
        name,
        status: engine ? 'healthy' : 'unavailable',
        initialized: !!engine,
      })
    );

    return {
      overall: this.initialized ? 'healthy' : 'initializing',
      engines: engineStatus,
      stats: this.getStats(),
      weights: this.ENGINE_WEIGHTS,
    };
  }
}

// Singleton 인스턴스 export
export const optimizedUnifiedAIEngine = OptimizedUnifiedAIEngine.getInstance();
