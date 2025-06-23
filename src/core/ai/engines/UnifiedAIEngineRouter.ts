/**
 * 🎯 통합 AI 엔진 라우터 v3.0
 *
 * 새로운 아키텍처:
 * - Supabase RAG: 메인 엔진 (50-80%)
 * - Google AI: 모드별 가중치 (2-80%)
 * - MCP: 표준 MCP 서버 역할 (AI 기능 제거)
 * - 하위 AI 도구들: 모든 모드에서 편리하게 사용
 *
 * 3가지 운영 모드:
 * - AUTO: Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)
 * - LOCAL: Supabase RAG (80%) → MCP+하위AI (20%) → Google AI 제외
 * - GOOGLE_ONLY: Google AI (80%) → Supabase RAG (15%) → 하위AI (5%)
 */

import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { TransformersEngine } from '@/services/ai/transformers-engine';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';

export type AIMode = 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';

export interface AIRequest {
  query: string;
  mode?: AIMode;
  category?: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIResponse {
  success: boolean;
  response: string;
  confidence: number;
  mode: AIMode;
  enginePath: string[];
  processingTime: number;
  fallbacksUsed: number;
  metadata: {
    mainEngine: string;
    supportEngines: string[];
    ragUsed: boolean;
    googleAIUsed: boolean;
    mcpUsed: boolean;
    subEnginesUsed: string[];
  };
  error?: string;
}

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter | null = null;

  // 메인 엔진들
  private supabaseRAG = getSupabaseRAGEngine();
  private googleAI: GoogleAIService;
  private mcpClient: RealMCPClient;

  // 하위 AI 도구들 (모든 모드에서 사용 가능)
  private koreanEngine: KoreanAIEngine;
  private transformersEngine: TransformersEngine;
  private openSourceEngines: OpenSourceEngines;
  private customEngines: CustomEngines;

  // 상태 관리
  private initialized = false;
  private currentMode: AIMode = 'AUTO';
  private stats = {
    totalQueries: 0,
    modeUsage: { AUTO: 0, LOCAL: 0, GOOGLE_ONLY: 0 },
    engineUsage: {
      supabaseRAG: 0,
      googleAI: 0,
      mcp: 0,
      korean: 0,
      transformers: 0,
      openSource: 0,
      custom: 0,
    },
    averageResponseTime: 0,
    fallbackRate: 0,
  };

  private constructor() {
    this.googleAI = new GoogleAIService();
    this.mcpClient = new RealMCPClient();
    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();
    this.openSourceEngines = new OpenSourceEngines();
    this.customEngines = new CustomEngines(this.openSourceEngines);

    console.log('🎯 통합 AI 엔진 라우터 생성 (새로운 아키텍처)');
  }

  public static getInstance(): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter();
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🚀 라우터 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 통합 AI 엔진 라우터 초기화 시작...');
    const startTime = Date.now();

    try {
      // 1단계: 메인 엔진들 병렬 초기화
      const mainEnginePromises = [
        this.supabaseRAG.initialize(),
        this.initializeGoogleAI(),
        this.initializeMCP(),
      ];

      await Promise.allSettled(mainEnginePromises);

      // 2단계: 하위 AI 도구들 병렬 초기화
      const subEnginePromises = [
        this.koreanEngine.initialize(),
        this.transformersEngine.initialize(),
        // OpenSourceEngines와 CustomEngines는 생성자에서 자동 초기화됨
      ];

      await Promise.allSettled(subEnginePromises);

      this.initialized = true;
      console.log(
        `✅ 통합 AI 엔진 라우터 초기화 완료 (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      console.error('❌ 통합 AI 엔진 라우터 초기화 실패:', error);
      // 초기화 실패해도 기본 기능은 동작하도록
      this.initialized = true;
    }
  }

  /**
   * 🎯 통합 AI 쿼리 처리
   */
  public async processQuery(request: AIRequest): Promise<AIResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const mode = request.mode || this.currentMode;

    this.stats.totalQueries++;
    this.stats.modeUsage[mode]++;

    console.log(`🎯 AI 쿼리 처리 시작 (모드: ${mode}): "${request.query}"`);

    try {
      let response: AIResponse;

      switch (mode) {
        case 'AUTO':
          response = await this.processAutoMode(request, startTime);
          break;
        case 'LOCAL':
          response = await this.processLocalMode(request, startTime);
          break;
        case 'GOOGLE_ONLY':
          response = await this.processGoogleOnlyMode(request, startTime);
          break;
        default:
          throw new Error(`지원하지 않는 모드: ${mode}`);
      }

      this.updateStats(response);
      return response;
    } catch (error) {
      console.error(`❌ ${mode} 모드 처리 실패:`, error);
      return this.createEmergencyFallback(request, mode, startTime);
    }
  }

  /**
   * 🔄 AUTO 모드: Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)
   */
  private async processAutoMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    console.log('🔄 AUTO 모드: 다층 폴백 처리');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: Supabase RAG 우선 (50% 가중치)
    try {
      console.log('🥇 1단계: Supabase RAG 시도');
      const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
        maxResults: 5,
        threshold: 0.6,
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag');
        this.stats.engineUsage.supabaseRAG++;

        // 하위 AI 도구로 응답 향상
        const enhancedResponse = await this.enhanceWithSubEngines(
          ragResult.results[0].content,
          request.query,
          supportEngines
        );

        return {
          success: true,
          response: enhancedResponse,
          confidence: 0.85,
          mode: 'AUTO',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'supabase-rag',
            supportEngines,
            ragUsed: true,
            googleAIUsed: false,
            mcpUsed: false,
            subEnginesUsed: supportEngines,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 실패:', error);
      fallbacksUsed++;
    }

    // 2단계: MCP + 하위 AI 조합 (30% 가중치)
    try {
      console.log('🥈 2단계: MCP + 하위 AI 조합 시도');
      const mcpResponse = await this.processMCPWithSubEngines(
        request,
        supportEngines
      );

      if (mcpResponse.success) {
        enginePath.push('mcp-sub-engines');
        return {
          ...mcpResponse,
          mode: 'AUTO',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...mcpResponse.metadata,
            mainEngine: 'mcp-hybrid',
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ MCP + 하위 AI 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI 도구들만 (18% 가중치)
    try {
      console.log('🥉 3단계: 하위 AI 도구들 시도');
      const subEngineResponse = await this.processWithSubEnginesOnly(
        request,
        supportEngines
      );

      if (subEngineResponse.success) {
        enginePath.push('sub-engines-only');
        return {
          ...subEngineResponse,
          mode: 'AUTO',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...subEngineResponse.metadata,
            mainEngine: 'sub-engines',
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ 하위 AI 도구들 실패:', error);
      fallbacksUsed++;
    }

    // 4단계: Google AI 최종 폴백 (2% 가중치)
    try {
      console.log('🔄 4단계: Google AI 최종 폴백');
      const googleResponse = await this.googleAI.generateResponse(
        request.query
      );

      if (googleResponse.success) {
        enginePath.push('google-ai-fallback');
        this.stats.engineUsage.googleAI++;

        return {
          success: true,
          response: googleResponse.content || '응답을 생성했습니다.',
          confidence: googleResponse.confidence || 0.7,
          mode: 'AUTO',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'google-ai',
            supportEngines: [],
            ragUsed: false,
            googleAIUsed: true,
            mcpUsed: false,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Google AI 최종 폴백 실패:', error);
      fallbacksUsed++;
    }

    throw new Error('AUTO 모드 모든 폴백 실패');
  }

  /**
   * 🏠 LOCAL 모드: Supabase RAG (80%) → MCP+하위AI (20%) → Google AI 제외
   */
  private async processLocalMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    console.log('🏠 LOCAL 모드: Google AI 제외 처리');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: Supabase RAG 우선 (80% 가중치)
    try {
      console.log('🥇 1단계: Supabase RAG 시도 (LOCAL 모드)');
      const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
        maxResults: 8,
        threshold: 0.5, // LOCAL 모드에서는 더 관대한 임계값
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag-local');
        this.stats.engineUsage.supabaseRAG++;

        const enhancedResponse = await this.enhanceWithSubEngines(
          ragResult.results[0].content,
          request.query,
          supportEngines
        );

        return {
          success: true,
          response: enhancedResponse,
          confidence: 0.9,
          mode: 'LOCAL',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'supabase-rag',
            supportEngines,
            ragUsed: true,
            googleAIUsed: false,
            mcpUsed: false,
            subEnginesUsed: supportEngines,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 실패 (LOCAL):', error);
      fallbacksUsed++;
    }

    // 2단계: MCP + 하위 AI 조합 (20% 가중치)
    try {
      console.log('🥈 2단계: MCP + 하위 AI 조합 시도 (LOCAL 모드)');
      const mcpResponse = await this.processMCPWithSubEngines(
        request,
        supportEngines
      );

      if (mcpResponse.success) {
        enginePath.push('mcp-sub-engines-local');
        return {
          ...mcpResponse,
          mode: 'LOCAL',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...mcpResponse.metadata,
            mainEngine: 'mcp-hybrid',
            googleAIUsed: false,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ MCP + 하위 AI 실패 (LOCAL):', error);
      fallbacksUsed++;
    }

    throw new Error('LOCAL 모드 모든 폴백 실패 (Google AI 제외됨)');
  }

  /**
   * 🤖 GOOGLE_ONLY 모드: Google AI (80%) → Supabase RAG (15%) → 하위AI (5%)
   */
  private async processGoogleOnlyMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    console.log('🤖 GOOGLE_ONLY 모드: Google AI 우선 처리');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: Google AI 우선 (80% 가중치)
    try {
      console.log('🥇 1단계: Google AI 시도 (GOOGLE_ONLY 모드)');
      const googleResponse = await this.googleAI.generateResponse(
        request.query
      );

      if (googleResponse.success && googleResponse.confidence >= 0.6) {
        enginePath.push('google-ai-primary');
        this.stats.engineUsage.googleAI++;

        return {
          success: true,
          response: googleResponse.content || '응답을 생성했습니다.',
          confidence: googleResponse.confidence || 0.85,
          mode: 'GOOGLE_ONLY',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'google-ai',
            supportEngines: [],
            ragUsed: false,
            googleAIUsed: true,
            mcpUsed: false,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Google AI 실패 (GOOGLE_ONLY):', error);
      fallbacksUsed++;
    }

    // 2단계: Supabase RAG 폴백 (15% 가중치)
    try {
      console.log('🥈 2단계: Supabase RAG 폴백 (GOOGLE_ONLY 모드)');
      const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
        maxResults: 3,
        threshold: 0.7,
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag-fallback');
        this.stats.engineUsage.supabaseRAG++;

        return {
          success: true,
          response: ragResult.results[0].content,
          confidence: 0.75,
          mode: 'GOOGLE_ONLY',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'supabase-rag',
            supportEngines: [],
            ragUsed: true,
            googleAIUsed: false,
            mcpUsed: false,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 폴백 실패 (GOOGLE_ONLY):', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI 도구들 최종 폴백 (5% 가중치)
    try {
      console.log('🥉 3단계: 하위 AI 도구들 최종 폴백 (GOOGLE_ONLY 모드)');
      const subEngineResponse = await this.processWithSubEnginesOnly(
        request,
        supportEngines
      );

      if (subEngineResponse.success) {
        enginePath.push('sub-engines-final-fallback');
        return {
          ...subEngineResponse,
          mode: 'GOOGLE_ONLY',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...subEngineResponse.metadata,
            mainEngine: 'sub-engines',
            googleAIUsed: false,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ 하위 AI 도구들 최종 폴백 실패 (GOOGLE_ONLY):', error);
      fallbacksUsed++;
    }

    throw new Error('GOOGLE_ONLY 모드 모든 폴백 실패');
  }

  /**
   * 🔧 MCP + 하위 AI 엔진 조합 처리
   */
  private async processMCPWithSubEngines(
    request: AIRequest,
    supportEngines: string[]
  ): Promise<AIResponse> {
    // MCP는 이제 표준 MCP 서버 역할만 수행 (AI 기능 제거)
    const mcpResult = await this.mcpClient.performComplexQuery(
      request.query,
      request.context
    );

    if (mcpResult && mcpResult.response) {
      this.stats.engineUsage.mcp++;

      // 하위 AI 도구들로 MCP 결과 향상
      const enhancedResponse = await this.enhanceWithSubEngines(
        mcpResult.response,
        request.query,
        supportEngines
      );

      return {
        success: true,
        response: enhancedResponse,
        confidence: 0.8,
        mode: 'AUTO', // 호출한 모드에서 덮어씀
        enginePath: ['mcp-sub-engines'],
        processingTime: 0, // 호출한 곳에서 계산
        fallbacksUsed: 0,
        metadata: {
          mainEngine: 'mcp-hybrid',
          supportEngines,
          ragUsed: false,
          googleAIUsed: false,
          mcpUsed: true,
          subEnginesUsed: supportEngines,
        },
      };
    }

    throw new Error('MCP + 하위 AI 조합 실패');
  }

  /**
   * 🛠️ 하위 AI 도구들만으로 처리
   */
  private async processWithSubEnginesOnly(
    request: AIRequest,
    supportEngines: string[]
  ): Promise<AIResponse> {
    const responses: string[] = [];

    // 한국어 AI 엔진
    try {
      if (this.isKoreanQuery(request.query)) {
        const koreanResult = await this.koreanEngine.processQuery(
          request.query
        );
        if (koreanResult && koreanResult.success) {
          responses.push(koreanResult.response);
          supportEngines.push('korean');
          this.stats.engineUsage.korean++;
        }
      }
    } catch (error) {
      console.warn('⚠️ Korean AI 엔진 실패:', error);
    }

    // Transformers.js 엔진
    try {
      const transformerResult = await this.transformersEngine.classifyText(
        request.query
      );
      if (transformerResult && transformerResult.confidence > 0.5) {
        responses.push(
          `분류 결과: ${transformerResult.label} (신뢰도: ${transformerResult.confidence})`
        );
        supportEngines.push('transformers');
        this.stats.engineUsage.transformers++;
      }
    } catch (error) {
      console.warn('⚠️ Transformers 엔진 실패:', error);
    }

    // 오픈소스 엔진들
    try {
      const openSourceResult = await this.openSourceEngines.advancedNLP(
        request.query
      );
      if (openSourceResult && openSourceResult.summary) {
        responses.push(openSourceResult.summary);
        supportEngines.push('opensources');
        this.stats.engineUsage.openSource++;
      }
    } catch (error) {
      console.warn('⚠️ 오픈소스 엔진들 실패:', error);
    }

    // 커스텀 엔진들
    try {
      const customResult = await this.customEngines.mcpQuery(request.query);
      if (customResult && customResult.answer) {
        responses.push(customResult.answer);
        supportEngines.push('custom');
        this.stats.engineUsage.custom++;
      }
    } catch (error) {
      console.warn('⚠️ 커스텀 엔진들 실패:', error);
    }

    if (responses.length > 0) {
      const combinedResponse = this.combineResponses(responses);

      return {
        success: true,
        response: combinedResponse,
        confidence: 0.7,
        mode: 'AUTO', // 호출한 모드에서 덮어씀
        enginePath: ['sub-engines-only'],
        processingTime: 0, // 호출한 곳에서 계산
        fallbacksUsed: 0,
        metadata: {
          mainEngine: 'sub-engines',
          supportEngines,
          ragUsed: false,
          googleAIUsed: false,
          mcpUsed: false,
          subEnginesUsed: supportEngines,
        },
      };
    }

    throw new Error('하위 AI 도구들 모두 실패');
  }

  /**
   * ✨ 하위 AI 도구들로 응답 향상
   */
  private async enhanceWithSubEngines(
    baseResponse: string,
    originalQuery: string,
    supportEngines: string[]
  ): Promise<string> {
    let enhancedResponse = baseResponse;

    // 한국어 처리 향상
    if (this.isKoreanQuery(originalQuery)) {
      try {
        const koreanResult =
          await this.koreanEngine.processQuery(originalQuery);
        if (
          koreanResult &&
          koreanResult.success &&
          koreanResult.additionalInfo
        ) {
          enhancedResponse += `\n\n💡 추가 제안: ${koreanResult.additionalInfo.tips.join(', ')}`;
          supportEngines.push('korean');
        }
      } catch (error) {
        console.warn('⚠️ 한국어 향상 실패:', error);
      }
    }

    // Transformers.js로 감정/의도 분석 추가
    try {
      const classificationResult =
        await this.transformersEngine.classifyText(originalQuery);
      if (classificationResult && classificationResult.score > 0.7) {
        enhancedResponse += `\n\n🎯 의도 분석: ${classificationResult.label} (${(classificationResult.score * 100).toFixed(1)}%)`;
        supportEngines.push('transformers');
      }
    } catch (error) {
      console.warn('⚠️ 감정 분석 향상 실패:', error);
    }

    return enhancedResponse;
  }

  /**
   * 🔧 유틸리티 메서드들
   */
  private async initializeGoogleAI(): Promise<void> {
    try {
      await this.googleAI.initialize();
      console.log('✅ Google AI 초기화 완료');
    } catch (error) {
      console.warn('⚠️ Google AI 초기화 실패:', error);
    }
  }

  private async initializeMCP(): Promise<void> {
    try {
      await this.mcpClient.initialize();
      console.log('✅ MCP 클라이언트 초기화 완료 (표준 MCP 서버 역할)');
    } catch (error) {
      console.warn('⚠️ MCP 클라이언트 초기화 실패:', error);
    }
  }

  private isKoreanQuery(query: string): boolean {
    return /[가-힣]/.test(query);
  }

  private combineResponses(responses: string[]): string {
    return responses.join('\n\n🔹 ');
  }

  private createEmergencyFallback(
    request: AIRequest,
    mode: AIMode,
    startTime: number
  ): AIResponse {
    return {
      success: false,
      response: `죄송합니다. ${mode} 모드에서 "${request.query}"에 대한 응답을 생성할 수 없습니다. 다른 모드를 시도해보세요.`,
      confidence: 0.1,
      mode,
      enginePath: ['emergency-fallback'],
      processingTime: Date.now() - startTime,
      fallbacksUsed: 999,
      metadata: {
        mainEngine: 'emergency',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpUsed: false,
        subEnginesUsed: [],
      },
      error: `${mode} 모드 모든 엔진 실패`,
    };
  }

  private updateStats(response: AIResponse): void {
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime + response.processingTime) / 2;
    if (response.fallbacksUsed > 0) {
      this.stats.fallbackRate =
        (this.stats.fallbackRate + 1) / this.stats.totalQueries;
    }
  }

  /**
   * 🎛️ 모드 설정 및 상태 조회
   */
  public setMode(mode: AIMode): void {
    const oldMode = this.currentMode;
    this.currentMode = mode;
    console.log(`🔧 AI 모드 변경: ${oldMode} → ${mode}`);
  }

  public getCurrentMode(): AIMode {
    return this.currentMode;
  }

  public getStats() {
    return { ...this.stats };
  }

  public getEngineStatus() {
    return {
      initialized: this.initialized,
      currentMode: this.currentMode,
      engines: {
        supabaseRAG: { ready: true, role: 'main' },
        googleAI: { ready: true, role: 'mode-dependent' },
        mcp: { ready: true, role: 'standard-server' },
        korean: { ready: true, role: 'sub-engine' },
        transformers: { ready: true, role: 'sub-engine' },
        openSource: { ready: true, role: 'sub-engine' },
        custom: { ready: true, role: 'sub-engine' },
      },
      stats: this.stats,
    };
  }
}

export const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
