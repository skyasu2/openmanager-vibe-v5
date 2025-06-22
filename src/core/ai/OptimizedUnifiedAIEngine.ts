/**
 * 최적화된 통합 AI 엔진 v2.1
 *
 * 이전 11개 엔진에서 5개 핵심 엔진으로 확장:
 * - SupabaseRAGEngine (60%) - 모든 환경 통일
 * - CustomEngines (20%) - MCP Query + Hybrid Analysis
 * - Render MCP Client (15%) - 공식 서버 활용
 * - OpenSourceEngines (3%) - 하위 AI 엔진들
 * - Google AI (2%) - 베타 기능
 */

import { GoogleAIEngine } from './engines/GoogleAIEngine';
import { MCPClientEngine } from './engines/MCPClientEngine';
import { SupabaseRAGMainEngine } from './engines/SupabaseRAGMainEngine';
// CustomEngines 통합 추가
import { CustomEngines } from '../../services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '../../services/ai/engines/OpenSourceEngines';

export interface OptimizedAIRequest {
  query: string;
  mode?: 'AUTO' | 'GOOGLE_AI' | 'INTERNAL' | 'CUSTOM_ONLY';
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

  // 엔진 가중치 (총 100%)
  private readonly ENGINE_WEIGHTS = {
    'supabase-rag': 60,
    'custom-engines': 20,
    'mcp-client': 15,
    opensource: 3,
    'google-ai': 2,
  };

  private constructor() {
    console.log('🚀 OptimizedUnifiedAIEngine v2.1 초기화 시작');
  }

  public static getInstance(): OptimizedUnifiedAIEngine {
    if (!OptimizedUnifiedAIEngine.instance) {
      OptimizedUnifiedAIEngine.instance = new OptimizedUnifiedAIEngine();
    }
    return OptimizedUnifiedAIEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔧 5개 핵심 엔진 초기화 시작...');

    try {
      // 1. SupabaseRAG 엔진 (60% 가중치)
      console.log('📊 SupabaseRAG 엔진 초기화 (60% 가중치)');
      const supabaseEngine = new SupabaseRAGMainEngine();
      await supabaseEngine.initialize();
      this.engines.set('supabase-rag', supabaseEngine);

      // 2. OpenSource 엔진들 먼저 초기화 (3% 가중치)
      console.log('🌐 OpenSource 엔진들 초기화 (3% 가중치)');
      const openSourceEngines = new OpenSourceEngines();
      this.engines.set('opensource', openSourceEngines);

      // 3. Custom Engines 엔진 (20% 가중치) - OpenSource 의존성 주입
      console.log('🔧 Custom Engines 엔진 초기화 (20% 가중치)');
      const customEngines = new CustomEngines(openSourceEngines);
      this.engines.set('custom-engines', customEngines);

      // 4. MCP Client 엔진 (15% 가중치)
      console.log('🔗 MCP Client 엔진 초기화 (15% 가중치)');
      const mcpEngine = new MCPClientEngine();
      await mcpEngine.initialize();
      this.engines.set('mcp-client', mcpEngine);

      // 5. Google AI 엔진 (2% 가중치)
      console.log('🤖 Google AI 엔진 초기화 (2% 가중치)');
      const googleEngine = new GoogleAIEngine();
      await googleEngine.initialize();
      this.engines.set('google-ai', googleEngine);

      this.initialized = true;
      console.log('✅ OptimizedUnifiedAIEngine v2.1 초기화 완료');
      console.log(
        `📈 총 5개 엔진 활성화: ${Array.from(this.engines.keys()).join(', ')}`
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
        case 'CUSTOM_ONLY':
          response = await this.processWithCustomEngines(request);
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
    // 우선순위에 따른 엔진 선택 (가중치 기반)
    const engines = [
      {
        name: 'supabase-rag',
        weight: 60,
        engine: this.engines.get('supabase-rag'),
      },
      {
        name: 'custom-engines',
        weight: 20,
        engine: this.engines.get('custom-engines'),
      },
      {
        name: 'mcp-client',
        weight: 15,
        engine: this.engines.get('mcp-client'),
      },
      { name: 'opensource', weight: 3, engine: this.engines.get('opensource') },
      { name: 'google-ai', weight: 2, engine: this.engines.get('google-ai') },
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

        let result;
        if (name === 'custom-engines') {
          // CustomEngines는 특별한 처리 로직 사용
          result = await this.processWithCustomEngines(request);
        } else {
          // 다른 엔진들은 기본 processQuery 사용
          result = await engine.processQuery(request);
        }

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
    // Google AI 제외한 내부 엔진들만 사용
    const internalEngines = [
      { name: 'supabase-rag', engine: this.engines.get('supabase-rag') },
      { name: 'custom-engines', engine: this.engines.get('custom-engines') },
      { name: 'mcp-client', engine: this.engines.get('mcp-client') },
      { name: 'opensource', engine: this.engines.get('opensource') },
    ];

    let lastError: Error | null = null;

    for (const { name, engine } of internalEngines) {
      if (!engine) {
        console.log(`⚠️ ${name} 엔진이 초기화되지 않음, 건너뜀`);
        continue;
      }

      try {
        console.log(`🔄 INTERNAL 모드: ${name} 엔진 시도 중...`);

        let result;
        if (name === 'custom-engines') {
          // CustomEngines는 특별한 처리 로직 사용
          result = await this.processWithCustomEngines(request);
        } else {
          // 다른 엔진들은 기본 processQuery 사용
          result = await engine.processQuery(request);
        }

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
        console.log(`⚠️ INTERNAL 모드: ${name} 엔진 실패: ${errorMsg}`);
        lastError = error instanceof Error ? error : new Error(errorMsg);
        continue;
      }
    }

    // 모든 내부 엔진 실패시 최종 폴백
    console.error('❌ 모든 내부 엔진 실패, 기본 응답 반환');
    return {
      success: true,
      response: `INTERNAL 모드에서 질의 "${request.query}"에 대한 기본 응답입니다. 내부 서비스가 일시적으로 사용할 수 없습니다.`,
      data: { fallback: true, query: request.query, mode: 'INTERNAL' },
      engine: 'internal-fallback',
      confidence: 0.3,
      fallbackUsed: true,
      processingTime: 0,
      error: lastError?.message,
    };
  }

  private async processWithCustomEngines(
    request: OptimizedAIRequest
  ): Promise<OptimizedAIResponse> {
    const engine = this.engines.get('custom-engines');
    if (!engine) {
      throw new Error('Custom Engines를 사용할 수 없습니다');
    }

    try {
      // CustomEngines의 핵심 기능들 활용
      const { query, context } = request;

      // 안전한 컨텍스트 처리
      const safeContext = context || {
        servers: [],
        metrics: [],
        logs: [],
        alerts: [],
      };

      // 1. MCP Query (핵심 기능)
      const mcpResult = await engine.mcpQuery(query, safeContext);

      // 2. Custom NLP (OpenManager 특화) - 독립적으로 실행
      const nlpResult = await engine.customNLP(query);

      // 3. Hybrid Analysis (MCP + 오픈소스 조합) - 안전한 데이터로 실행
      let hybridResult;
      try {
        hybridResult = await engine.hybridAnalysis(query, {
          id: 'test-server',
          name: 'test',
        });
      } catch (error) {
        console.warn('Hybrid Analysis 실패, 기본값 사용:', error.message);
        hybridResult = {
          mcp_analysis: mcpResult,
          opensource_analysis: { result: 'basic analysis' },
          combined_confidence: 0.7,
          recommendation: 'MCP 분석 결과 기반 권장사항',
          fallback_used: true,
        };
      }

      // 결과 통합
      const combinedResponse = {
        mcp_analysis: mcpResult,
        hybrid_analysis: hybridResult,
        nlp_analysis: nlpResult,
        recommendation: hybridResult.recommendation,
        confidence:
          (mcpResult.confidence + hybridResult.combined_confidence + 0.8) / 3,
      };

      return {
        success: true,
        response: `CustomEngines 분석 완료: ${mcpResult.answer}`,
        data: combinedResponse,
        engine: 'custom-engines',
        confidence: combinedResponse.confidence,
        processingTime: 0, // 상위에서 계산됨
      };
    } catch (error) {
      console.error('CustomEngines 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CustomEngines 오류',
        engine: 'custom-engines',
        confidence: 0,
        processingTime: 0,
      };
    }
  }

  private updateStats(
    engine: string,
    processingTime: number,
    success: boolean
  ): void {
    if (success) {
      this.stats.successfulQueries++;
    }

    // 엔진 사용 통계 업데이트
    if (!this.stats.engineUsage[engine]) {
      this.stats.engineUsage[engine] = 0;
    }
    this.stats.engineUsage[engine]++;

    // 평균 응답 시간 업데이트
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalQueries - 1) +
        processingTime) /
      this.stats.totalQueries;
  }

  public getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalQueries > 0
          ? (this.stats.successfulQueries / this.stats.totalQueries) * 100
          : 0,
      engineWeights: this.ENGINE_WEIGHTS,
      activeEngines: Array.from(this.engines.keys()),
      totalEngines: this.engines.size,
    };
  }

  public getHealthStatus() {
    return {
      initialized: this.initialized,
      totalEngines: this.engines.size,
      expectedEngines: 4,
      engineStatus: Array.from(this.engines.entries()).map(
        ([name, engine]) => ({
          name,
          weight: this.ENGINE_WEIGHTS[name as keyof typeof this.ENGINE_WEIGHTS],
          healthy: engine && typeof engine.processQuery === 'function',
          usage: this.stats.engineUsage[name] || 0,
        })
      ),
      stats: this.getStats(),
    };
  }
}

// Singleton 인스턴스 export
export const optimizedUnifiedAIEngine = OptimizedUnifiedAIEngine.getInstance();
