/**
 * 🚀 통합 AI 엔진 라우터 v3.3 (2모드 전용 - LOCAL/GOOGLE_ONLY)
 *
 * 핵심 모드:
 * - LOCAL: RAG + NLP + MCP + 하위 AI 엔진 (완전한 로컬 처리)
 * - GOOGLE_ONLY: Google AI + 로컬모드(필요한 부분만)
 *
 * 제거된 기능:
 * - AUTO 모드 완전 삭제
 * - 모드 간 자동 전환 로직 제거
 * - 복잡한 가중치 시스템 단순화
 */

import { MCPContextCollector } from '@/core/ai/context/MCPContextCollector';
import { AIFallbackHandler } from '@/core/ai/handlers/AIFallbackHandler';
import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { enhancedKoreanNLPEngine } from '@/services/ai/engines/EnhancedKoreanNLPEngine';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { OptimizedKoreanNLPEngine } from '@/services/ai/engines/OptimizedKoreanNLPEngine';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { TransformersEngine } from '@/services/ai/transformers-engine';
import { AIRequest, AIResponse } from '@/types/ai-types';
import KoreanTimeUtil from '@/utils/koreanTime';

// 베르셀 환경 최적화 설정
const VERCEL_OPTIMIZATION = {
  isVercel: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
  maxProcessingTime: 25000, // 25초
  koreanNLPTimeout: 8000, // 한국어 NLP 전용 타임아웃
  ragTimeout: 10000, // RAG 전용 타임아웃
  mcpTimeout: 7000, // MCP 전용 타임아웃
  googleAITimeout: 15000, // Google AI 전용 타임아웃
};

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter | null = null;

  // 레거시 엔진들
  private supabaseRAG = getSupabaseRAGEngine();
  private googleAI: GoogleAIService;
  private mcpClient: any;
  private mcpContextCollector: MCPContextCollector;
  private fallbackHandler: AIFallbackHandler;
  private autoIncidentReport: any = null;

  // 하위 엔진들
  private koreanEngine: KoreanAIEngine;
  private transformersEngine: TransformersEngine;
  private openSourceEngines: OpenSourceEngines;
  private customEngines: CustomEngines;

  // 🇰🇷 고품질 한국어 NLP 엔진
  private enhancedKoreanNLP = enhancedKoreanNLPEngine;
  private optimizedKoreanNLP = new OptimizedKoreanNLPEngine();

  // 상태 관리 (2모드만)
  private initialized = false;
  private currentMode: 'LOCAL' | 'GOOGLE_ONLY' = 'LOCAL';
  private lastRequestContext: any = null;
  private stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    modeUsage: Record<'LOCAL' | 'GOOGLE_ONLY', number>;
    engineUsage: Record<string, number>;
    lastUpdated: string;
  } = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    modeUsage: { LOCAL: 0, GOOGLE_ONLY: 0 },
    engineUsage: {},
    lastUpdated: new Date().toISOString(),
  };

  private constructor() {
    // 기본 엔진들 초기화 (싱글톤 패턴 사용)
    this.googleAI = GoogleAIService.getInstance();
    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();
    this.openSourceEngines = new OpenSourceEngines();
    this.customEngines = new CustomEngines(this.openSourceEngines);
    this.fallbackHandler = AIFallbackHandler.getInstance();
    this.mcpContextCollector = new MCPContextCollector();

    console.log('✅ UnifiedAIEngineRouter v3.3 (2모드 전용) 초기화 완료');
  }

  static getInstance(): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter();
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🚀 메인 쿼리 처리 메서드 (2모드만 지원)
   */
  async processQuery(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // 베르셀 환경 타임아웃 체크
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (
        VERCEL_OPTIMIZATION.isVercel &&
        elapsed > VERCEL_OPTIMIZATION.maxProcessingTime
      ) {
        throw new Error(
          `베르셀 환경 타임아웃 (${elapsed}ms > ${VERCEL_OPTIMIZATION.maxProcessingTime}ms)`
        );
      }
      return elapsed;
    };

    try {
      // 모드 정규화 (2모드만)
      const normalizedMode = this.normalizeMode(request.mode);
      this.currentMode = normalizedMode;
      this.stats.modeUsage[normalizedMode]++;

      console.log(
        `🎯 UnifiedAIEngineRouter v3.3: ${normalizedMode} 모드로 처리`
      );

      let result: AIResponse;

      // 2모드 처리
      switch (normalizedMode) {
        case 'LOCAL':
          result = await this.processLocalMode(
            request,
            startTime,
            checkTimeout
          );
          break;
        case 'GOOGLE_ONLY':
          result = await this.processGoogleOnlyMode(
            request,
            startTime,
            checkTimeout
          );
          break;
        default:
          throw new Error(
            `지원하지 않는 모드: ${normalizedMode}. 사용 가능한 모드: LOCAL, GOOGLE_ONLY`
          );
      }

      // 통계 업데이트
      this.updateSuccessStats(Date.now() - startTime);

      return result;
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 오류:', error);
      this.updateFailureStats();

      return this.formatErrorResponse(
        error,
        startTime,
        this.normalizeMode(request.mode)
      );
    }
  }

  /**
   * 🏠 LOCAL 모드 처리: 한국어 NLP (우선) → Supabase RAG (80%) → MCP+하위AI (20%)
   */
  private async processLocalMode(
    request: AIRequest,
    startTime: number,
    checkTimeout: () => number
  ): Promise<AIResponse> {
    console.log(
      '🏠 LOCAL 모드: 고품질 한국어 NLP 우선 + Supabase RAG + 로컬 AI'
    );
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 🇰🇷 0단계: 한국어 쿼리 감지 및 고품질 NLP 처리
    const isKoreanQuery = /[가-힣]/.test(request.query);
    let koreanAnalysis: any = null;

    if (isKoreanQuery) {
      try {
        console.log('🇰🇷 LOCAL 0단계: 고품질 한국어 NLP 분석');
        const nlpStartTime = Date.now();

        // 한국어 NLP 전용 타임아웃 체크
        const checkKoreanTimeout = () => {
          const elapsed = Date.now() - nlpStartTime;
          if (elapsed > VERCEL_OPTIMIZATION.koreanNLPTimeout) {
            throw new Error(
              `한국어 NLP 타임아웃 (${elapsed}ms > ${VERCEL_OPTIMIZATION.koreanNLPTimeout}ms)`
            );
          }
          return elapsed;
        };

        await this.optimizedKoreanNLP.initialize();
        const optimizedResult = await this.optimizedKoreanNLP.processQuery(
          request.query
        );

        // OptimizedKoreanNLPEngine 결과를 기존 koreanAnalysis 형식으로 변환
        koreanAnalysis = {
          qualityMetrics: {
            processingTime: optimizedResult.totalTime,
            confidence: optimizedResult.confidence,
            contextRelevance: optimizedResult.confidence * 0.9, // 추정값
            analysisDepth: optimizedResult.steps / 5, // 5단계 기준
          },
          semanticAnalysis: {
            mainTopic: '서버 모니터링', // 기본값
            subTopics: ['성능 분석'],
            urgencyLevel: optimizedResult.confidence > 0.8 ? 'medium' : 'low',
            technicalComplexity: optimizedResult.confidence,
          },
          entities: [],
          responseGuidance: {
            suggestedTone: 'professional',
            keyPoints: [optimizedResult.response.substring(0, 100)],
            recommendedActions: ['모니터링 지속'],
          },
        };

        checkKoreanTimeout();

        enginePath.push('optimized-korean-nlp');
        supportEngines.push('korean-nlp-engine');
        this.stats.engineUsage.optimizedKoreanNLP =
          (this.stats.engineUsage.optimizedKoreanNLP || 0) + 1;

        console.log(
          `✅ 한국어 NLP 분석 완료 (${koreanAnalysis.qualityMetrics.processingTime}ms, 신뢰도: ${koreanAnalysis.qualityMetrics.confidence})`
        );

        // 고품질 분석이 충분한 경우 바로 응답 생성
        if (
          koreanAnalysis.qualityMetrics.confidence > 0.8 &&
          koreanAnalysis.qualityMetrics.contextRelevance > 0.7
        ) {
          const enhancedResponse = this.generateEnhancedKoreanResponse(
            koreanAnalysis,
            request
          );

          return this.formatSuccessResponse(
            enhancedResponse,
            enginePath,
            supportEngines,
            startTime,
            {
              koreanAnalysis,
              qualityMetrics: koreanAnalysis.qualityMetrics,
              responseGuidance: koreanAnalysis.responseGuidance,
              confidence: koreanAnalysis.qualityMetrics.confidence,
              mode: 'LOCAL',
              primaryEngine: 'optimized-korean-nlp',
              fallbacksUsed: 0,
            }
          );
        }
      } catch (error) {
        console.warn('⚠️ 한국어 NLP 분석 실패, RAG로 폴백:', error);
        fallbacksUsed++;
      }
    }

    // 1단계: Supabase RAG 처리 (한국어 분석 결과 활용)
    try {
      console.log('🥇 LOCAL 1단계: Supabase RAG (80%)');
      checkTimeout();

      if (
        this.supabaseRAG &&
        typeof this.supabaseRAG.searchSimilar === 'function'
      ) {
        // 한국어 분석 결과를 RAG 검색에 활용
        const searchQuery = koreanAnalysis
          ? this.enhanceQueryWithKoreanAnalysis(request.query, koreanAnalysis)
          : request.query;

        const ragStartTime = Date.now();
        const ragResult = await this.supabaseRAG.searchSimilar(searchQuery, {
          maxResults: 3,
          threshold: 0.7,
          category: request.category,
          enableMCP: true,
        });

        // RAG 타임아웃 체크
        if (Date.now() - ragStartTime > VERCEL_OPTIMIZATION.ragTimeout) {
          throw new Error(
            `RAG 타임아웃 (${Date.now() - ragStartTime}ms > ${VERCEL_OPTIMIZATION.ragTimeout}ms)`
          );
        }

        if (ragResult && ragResult.success && ragResult.results?.length > 0) {
          enginePath.push('supabase-rag-enhanced');
          supportEngines.push('rag-engine');
          this.stats.engineUsage.supabaseRAG =
            (this.stats.engineUsage.supabaseRAG || 0) + 1;

          const ragResponse = this.formatEnhancedRAGResults(
            ragResult,
            request.query,
            koreanAnalysis
          );

          return this.formatSuccessResponse(
            ragResponse,
            enginePath,
            supportEngines,
            startTime,
            {
              koreanAnalysis,
              ragResults: ragResult.results?.length || 0,
              confidence: koreanAnalysis?.qualityMetrics?.confidence || 0.7,
              mode: 'LOCAL',
              primaryEngine: 'supabase-rag',
              fallbacksUsed,
            }
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 실패, MCP로 폴백:', error);
      fallbacksUsed++;
    }

    // 2단계: MCP + 하위 AI 엔진들 (20% 가중치)
    try {
      console.log('🥈 LOCAL 2단계: MCP + 하위 AI (20%)');
      checkTimeout();

      const subEngineResult = await this.processLocalModeSubEngines(request);

      if (subEngineResult.success) {
        enginePath.push('mcp-sub-engines');
        supportEngines.push(
          ...(subEngineResult.metadata?.supportEngines || [])
        );

        // 한국어 분석 결과로 응답 향상
        const enhancedResponse = koreanAnalysis
          ? this.enhanceResponseWithKoreanAnalysis(
              subEngineResult.response,
              koreanAnalysis
            )
          : subEngineResult.response;

        return this.formatSuccessResponse(
          enhancedResponse,
          enginePath,
          supportEngines,
          startTime,
          {
            koreanAnalysis,
            confidence:
              koreanAnalysis?.qualityMetrics?.confidence ||
              subEngineResult.confidence,
            mode: 'LOCAL',
            primaryEngine: 'mcp-sub-engines',
            fallbacksUsed,
          }
        );
      }
    } catch (error) {
      console.warn('⚠️ MCP + 하위 AI 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: 폴백 응답 (한국어 분석 기반)
    console.log('🔄 LOCAL 폴백: 한국어 분석 기반 응답 생성');

    if (koreanAnalysis) {
      const fallbackResponse = this.generateKoreanAnalysisBasedFallback(
        koreanAnalysis,
        request
      );

      return this.formatFallbackResponse(
        'LOCAL',
        enginePath,
        supportEngines,
        startTime,
        fallbacksUsed,
        {
          koreanAnalysis,
          fallbackType: 'korean-analysis-based',
          confidence: koreanAnalysis.qualityMetrics.confidence * 0.8, // 폴백이므로 신뢰도 감소
        }
      );
    }

    // 최종 폴백
    return this.formatFallbackResponse(
      'LOCAL',
      enginePath,
      supportEngines,
      startTime,
      fallbacksUsed
    );
  }

  /**
   * 🌍 GOOGLE_AI 모드 처리: Google AI (40%) → Supabase RAG (40%) → 로컬AI (20%)
   */
  private async processGoogleOnlyMode(
    request: AIRequest,
    startTime: number,
    checkTimeout: () => number
  ): Promise<AIResponse> {
    console.log('🌍 GOOGLE_AI 모드: 전용 폴백 시스템');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // GOOGLE_AI 모드 전용 MCP 컨텍스트
    let mcpContext: any = null;
    try {
      console.log('🌍 GOOGLE_AI 모드: MCP 컨텍스트 수집');
      mcpContext = await this.collectMCPContext(request.query, request.context);
      if (mcpContext) {
        supportEngines.push('mcp-context-google');
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 모드 MCP 컨텍스트 실패:', error);
    }

    // 1단계: Google AI 우선 처리 (40% 가중치)
    try {
      console.log('🥇 GOOGLE_AI 1단계: Google AI (40%)');
      const enhancedQuery = mcpContext
        ? `${request.query}\n\n[Google AI 컨텍스트: ${mcpContext.summary || ''}]`
        : request.query;

      if (
        this.googleAI &&
        typeof this.googleAI.generateContent === 'function'
      ) {
        const googleResult = await this.googleAI.generateContent(
          enhancedQuery,
          {
            timeout: 5000,
            isNaturalLanguage: true,
          }
        );

        if (googleResult.success) {
          enginePath.push('google-ai-primary');
          this.stats.engineUsage.googleAI =
            (this.stats.engineUsage.googleAI || 0) + 1;

          let enhancedResponse = googleResult.content;
          if (mcpContext?.additionalInfo) {
            enhancedResponse += `\n\n🌍 Google AI 컨텍스트: ${mcpContext.additionalInfo}`;
          }

          return this.formatSuccessResponse(
            enhancedResponse,
            enginePath,
            supportEngines,
            startTime
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 1단계 실패:', error);
      fallbacksUsed++;
    }

    // 2단계: Supabase RAG 폴백 (40% 가중치)
    try {
      console.log('🥈 GOOGLE_AI 2단계: Supabase RAG (40%)');
      checkTimeout();

      if (
        this.supabaseRAG &&
        typeof this.supabaseRAG.searchSimilar === 'function'
      ) {
        const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
          maxResults: 3,
          threshold: 0.6,
          category: request.category,
          enableMCP: true,
        });

        if (ragResult && ragResult.success && ragResult.results?.length > 0) {
          enginePath.push('supabase-rag-google-fallback');
          supportEngines.push('rag-engine-google');
          this.stats.engineUsage.supabaseRAG =
            (this.stats.engineUsage.supabaseRAG || 0) + 1;

          const ragResponse = this.formatRAGResults(ragResult, request.query);
          if (ragResponse) {
            return this.formatSuccessResponse(
              ragResponse,
              enginePath,
              supportEngines,
              startTime
            );
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 2단계 Supabase RAG 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI 처리 (20% 가중치)
    try {
      console.log('🥉 GOOGLE_AI 3단계: 하위 AI (20%)');
      checkTimeout();

      const subEngineResult =
        await this.processGoogleOnlyModeSubEngines(request);
      if (subEngineResult.success) {
        return subEngineResult;
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 3단계 실패:', error);
      fallbacksUsed++;
    }

    // 최종 폴백
    return this.formatFallbackResponse(
      'GOOGLE_ONLY',
      enginePath,
      supportEngines,
      startTime,
      fallbacksUsed
    );
  }

  // ===========================================
  // 🔧 유틸리티 메서드들 (통합된 버전)
  // ===========================================

  /**
   * 🔍 MCP 컨텍스트 수집
   */
  private async collectMCPContext(query: string, context?: any): Promise<any> {
    return await this.mcpContextCollector.collectContextWithRetry(
      query,
      context,
      {
        timeout: 5000,
        retryAttempts: 1,
        enableLogging: true,
      }
    );
  }

  /**
   * 🎯 실제 서버 데이터 기반 스마트 응답 생성
   */
  private async generateDataBasedResponse(
    query: string,
    checkTimeout: () => number
  ): Promise<string | null> {
    try {
      checkTimeout();

      // 한국어 AI 엔진으로 실제 분석 수행
      if (this.koreanEngine) {
        try {
          const koreanResult = await this.koreanEngine.processQuery(query);

          if (koreanResult && koreanResult.success && koreanResult.response) {
            checkTimeout();
            return `${koreanResult.response}\n\n⚡ 처리 시간: ${checkTimeout()}ms (베르셀 환경 최적화)`;
          }
        } catch (error) {
          console.log('⚠️ 한국어 AI 엔진 데이터 기반 응답 실패:', error);
        }
      }

      // 실제 시스템 메트릭 기반 응답 생성
      const keywords = [
        '서버',
        '상태',
        '모니터링',
        '성능',
        '분석',
        'CPU',
        '메모리',
        '디스크',
        '네트워크',
      ];
      const hasSystemKeyword = keywords.some(keyword =>
        query.includes(keyword)
      );

      if (hasSystemKeyword) {
        checkTimeout();

        const systemMetrics = {
          timestamp: KoreanTimeUtil.now(),
          uptime: Math.floor(process.uptime()),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        };

        let response = `"${query}"에 대한 실시간 분석 결과입니다.\n\n`;

        if (query.includes('메모리')) {
          const memoryUsed = Math.round(
            systemMetrics.memory.heapUsed / 1024 / 1024
          );
          const memoryTotal = Math.round(
            systemMetrics.memory.heapTotal / 1024 / 1024
          );
          response += `💾 **메모리 상태**\n- 사용량: ${memoryUsed}MB / ${memoryTotal}MB\n- 사용률: ${Math.round((memoryUsed / memoryTotal) * 100)}%\n\n`;
        }

        if (query.includes('시간') || query.includes('가동')) {
          response += `⏱️ **시스템 가동시간**: ${systemMetrics.uptime}초 (${Math.floor(systemMetrics.uptime / 60)}분)\n\n`;
        }

        response += `🔍 **분석 완료 시간**: ${systemMetrics.timestamp}\n`;
        response += `⚡ **응답 시간**: ${checkTimeout()}ms`;

        return response;
      }

      return null;
    } catch (error) {
      console.log('⚠️ 데이터 기반 응답 생성 실패:', error);
      return null;
    }
  }

  /**
   * 🧠 RAG 검색 결과를 자연어 응답으로 변환
   */
  private formatRAGResults(ragResult: any, originalQuery: string): string {
    try {
      if (!ragResult.results || ragResult.results.length === 0) {
        return '';
      }

      const topResult = ragResult.results[0];
      const content = topResult.content || '';
      const metadata = topResult.metadata || {};

      let response = `"${originalQuery}"에 대한 분석 결과입니다.\n\n`;

      if (metadata.category) {
        response += `📋 **카테고리**: ${metadata.category}\n`;
      }

      if (content.length > 0) {
        const summary = content.substring(0, 200);
        response += `📄 **관련 정보**: ${summary}${content.length > 200 ? '...' : ''}\n`;
      }

      if (metadata.commands && metadata.commands.length > 0) {
        response += `⚡ **관련 명령어**: ${metadata.commands.slice(0, 2).join(', ')}\n`;
      }

      if (topResult.similarity) {
        response += `🎯 **정확도**: ${Math.round(topResult.similarity * 100)}%\n`;
      }

      response += `\n처리 시간: ${ragResult.processingTime}ms`;

      return response;
    } catch (error) {
      console.log('⚠️ RAG 결과 포맷팅 실패:', error);
      return '';
    }
  }

  /**
   * LOCAL 모드 전용 하위 엔진 처리
   */
  private async processLocalModeSubEngines(
    request: AIRequest
  ): Promise<AIResponse> {
    try {
      const koreanResult = await this.koreanEngine.processQuery(request.query, {
        category: request.category,
        maxTokens: 800,
      });

      if (koreanResult && koreanResult.success) {
        return {
          success: true,
          response: koreanResult.response,
          confidence: 0.75,
          mode: 'LOCAL',
          enginePath: ['LOCAL', 'korean-ai'],
          processingTime: koreanResult.processingTime || 0,
          fallbacksUsed: 0,
          metadata: {
            mainEngine: 'korean-ai',
            supportEngines: ['local-sub-engines'],
            ragUsed: false,
            googleAIUsed: false,
            mcpContextUsed: false,
            subEnginesUsed: ['korean-ai'],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ LOCAL 모드 하위 엔진 실패:', error);
    }

    return {
      success: false,
      response: '로컬 AI 엔진 처리 실패',
      confidence: 0,
      mode: 'LOCAL',
      enginePath: ['LOCAL', 'failed'],
      processingTime: 0,
      fallbacksUsed: 1,
      metadata: {
        mainEngine: 'none',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
      },
    };
  }

  /**
   * GOOGLE_AI 모드 전용 하위 엔진 처리
   */
  private async processGoogleOnlyModeSubEngines(
    request: AIRequest
  ): Promise<AIResponse> {
    try {
      const koreanResult = await this.koreanEngine.processQuery(request.query, {
        category: request.category,
        maxTokens: 600,
      });

      if (koreanResult && koreanResult.success) {
        try {
          const googleEnhanced = await this.googleAI.generateContent(
            `서버 관리 전문가로서 다음 정보를 향상시켜주세요: ${koreanResult.response}`,
            { isNaturalLanguage: true }
          );

          const finalResponse =
            googleEnhanced && googleEnhanced.success
              ? googleEnhanced.content
              : koreanResult.response;

          return {
            success: true,
            response: finalResponse,
            confidence: 0.8,
            mode: 'GOOGLE_ONLY',
            enginePath: ['GOOGLE_ONLY', 'korean-ai-google-enhanced'],
            processingTime: (koreanResult.processingTime || 0) + 200,
            fallbacksUsed: 0,
            metadata: {
              mainEngine: 'korean-ai-google-enhanced',
              supportEngines: ['google-ai-sub-engines'],
              ragUsed: false,
              googleAIUsed: true,
              mcpContextUsed: false,
              subEnginesUsed: ['korean-ai', 'google-ai-enhancer'],
            },
          };
        } catch (error) {
          console.warn('⚠️ Google AI 향상 실패, 한국어 결과 사용:', error);
          return {
            success: true,
            response: koreanResult.response,
            confidence: 0.7,
            mode: 'GOOGLE_ONLY',
            enginePath: ['GOOGLE_ONLY', 'korean-ai-fallback'],
            processingTime: koreanResult.processingTime || 0,
            fallbacksUsed: 1,
            metadata: {
              mainEngine: 'korean-ai',
              supportEngines: ['google-ai-sub-engines-fallback'],
              ragUsed: false,
              googleAIUsed: false,
              mcpContextUsed: false,
              subEnginesUsed: ['korean-ai'],
            },
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 모드 하위 엔진 실패:', error);
    }

    return {
      success: false,
      response: 'Google AI 모드 하위 엔진 처리 실패',
      confidence: 0,
      mode: 'GOOGLE_ONLY',
      enginePath: ['GOOGLE_ONLY', 'failed'],
      processingTime: 0,
      fallbacksUsed: 1,
      metadata: {
        mainEngine: 'none',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
      },
    };
  }

  // ===========================================
  // 📝 응답 포맷팅 메서드들
  // ===========================================

  /**
   * 🎯 성공 응답 포맷팅
   */
  private formatSuccessResponse(
    response: string,
    enginePath: string[],
    supportEngines: string[],
    startTime: number,
    metadata?: any
  ): AIResponse {
    return {
      success: true,
      response,
      confidence: metadata?.confidence || 0.8,
      mode: this.currentMode,
      enginePath,
      processingTime: Date.now() - startTime,
      fallbacksUsed: metadata?.fallbacksUsed || 0,
      metadata: {
        timestamp: new Date().toISOString(),
        mainEngine: metadata?.primaryEngine || enginePath[0] || 'unknown',
        ragUsed:
          enginePath.some(path => path.includes('rag')) ||
          supportEngines.some(engine => engine.includes('rag')),
        googleAIUsed:
          enginePath.some(path => path.includes('google')) ||
          supportEngines.some(engine => engine.includes('google')),
        subEnginesUsed: supportEngines,
        cacheUsed: false,
        ...metadata,
      },
    };
  }

  /**
   * ❌ 오류 응답 포맷팅
   */
  private formatErrorResponse(
    error: any,
    startTime: number,
    mode: 'LOCAL' | 'GOOGLE_ONLY'
  ): AIResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${mode} 모드 오류:`, errorMessage);

    return {
      success: false,
      response: `${mode} 모드 처리 중 오류가 발생했습니다: ${errorMessage}`,
      confidence: 0,
      mode: mode as any,
      enginePath: [mode as string, 'error'],
      processingTime: Date.now() - startTime,
      fallbacksUsed: 0,
      metadata: {
        mainEngine: 'error',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
        error: errorMessage,
      },
    };
  }

  /**
   * 🛡️ 폴백 응답 생성
   */
  private formatFallbackResponse(
    mode: 'LOCAL' | 'GOOGLE_ONLY',
    enginePath: string[],
    supportEngines: string[],
    startTime: number,
    fallbacksUsed: number,
    metadata?: any
  ): AIResponse {
    const fallbackMessages: Record<string, string> = {
      LOCAL:
        '로컬 AI 엔진들이 일시적으로 사용할 수 없습니다. 기본 응답을 제공합니다.',
      GOOGLE_ONLY:
        'Google AI가 일시적으로 사용할 수 없습니다. 로컬 엔진으로 처리합니다.',
    };

    const fallbackMessage =
      fallbackMessages[mode as string] ||
      '요청을 처리할 수 없습니다. 나중에 다시 시도해주세요.';

    return {
      success: true,
      response: fallbackMessage,
      confidence: 0.3,
      mode: mode as any,
      enginePath: [...enginePath, 'fallback'],
      processingTime: Date.now() - startTime,
      fallbacksUsed: fallbacksUsed + 1,
      metadata: {
        mainEngine: 'fallback',
        supportEngines,
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
        isFallback: true,
        ...metadata,
      },
    };
  }

  // ===========================================
  // 🔧 기타 유틸리티 메서드들
  // ===========================================

  /**
   * 모드 정규화 (2모드만 지원)
   */
  private normalizeMode(mode?: string): 'LOCAL' | 'GOOGLE_ONLY' {
    if (!mode) return 'LOCAL';

    // AUTO 모드가 들어오면 LOCAL로 변환
    if (mode === 'AUTO') return 'LOCAL';
    // GOOGLE_AI 모드가 들어오면 GOOGLE_ONLY로 변환
    if (mode === 'GOOGLE_AI') return 'GOOGLE_ONLY';

    const validModes: ('LOCAL' | 'GOOGLE_ONLY')[] = ['LOCAL', 'GOOGLE_ONLY'];
    return validModes.includes(mode as any)
      ? (mode as 'LOCAL' | 'GOOGLE_ONLY')
      : 'LOCAL';
  }

  /**
   * 성공 통계 업데이트
   */
  private updateSuccessStats(processingTime: number): void {
    this.stats.successfulRequests++;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) +
        processingTime) /
      this.stats.successfulRequests;
    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * 실패 통계 업데이트
   */
  private updateFailureStats(): void {
    this.stats.failedRequests++;
    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * 🔧 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 UnifiedAIEngineRouter v3.3 초기화 시작...');

      // 한국어 NLP 엔진 초기화
      await this.optimizedKoreanNLP.initialize();

      // Google AI 서비스 초기화
      await this.googleAI.initialize();

      // MCP 컨텍스트 수집기는 initialize 메서드가 없으므로 스킵
      console.log('ℹ️ MCP 컨텍스트 수집기는 별도 초기화 불필요');

      this.initialized = true;
      console.log('✅ UnifiedAIEngineRouter v3.3 초기화 완료');
    } catch (error) {
      console.warn('⚠️ UnifiedAIEngineRouter 초기화 중 일부 실패:', error);
      this.initialized = true; // 부분 실패라도 동작하도록
    }
  }

  /**
   * 📊 상태 조회
   */
  getStatus(): any {
    return {
      router: 'UnifiedAIEngineRouter',
      version: '3.3.0',
      mode: this.currentMode,
      initialized: this.initialized,
      availableModes: ['LOCAL', 'GOOGLE_ONLY'],
      stats: this.stats,
      engines: {
        supabaseRAG: !!this.supabaseRAG,
        googleAI: !!this.googleAI,
        optimizedKoreanNLP: !!this.optimizedKoreanNLP,
        openSourceEngines: !!this.openSourceEngines,
        customEngines: !!this.customEngines,
        mcpContextCollector: !!this.mcpContextCollector,
      },
    };
  }

  /**
   * 🇰🇷 한국어 분석 기반 향상된 응답 생성
   */
  private generateEnhancedKoreanResponse(
    koreanAnalysis: any,
    request: AIRequest
  ): string {
    const {
      semanticAnalysis,
      serverContext,
      responseGuidance,
      qualityMetrics,
    } = koreanAnalysis;

    let response = `# ${semanticAnalysis.mainTopic} 분석 결과\n\n`;

    // 긴급도에 따른 응답 스타일
    if (semanticAnalysis.urgencyLevel === 'critical') {
      response += '🚨 **긴급 상황 감지됨**\n\n';
    } else if (semanticAnalysis.urgencyLevel === 'high') {
      response += '⚠️ **주의 필요**\n\n';
    }

    // 서버 컨텍스트 정보
    if (serverContext.targetServers.length > 0) {
      response += `**대상 서버**: ${serverContext.targetServers.join(', ')}\n`;
    }

    if (serverContext.metrics.length > 0) {
      response += `**관련 메트릭**: ${serverContext.metrics.join(', ')}\n`;
    }

    // 하위 주제들
    if (semanticAnalysis.subTopics.length > 0) {
      response += `\n**세부 분석 영역**:\n`;
      semanticAnalysis.subTopics.forEach((topic: string) => {
        response += `- ${topic}\n`;
      });
    }

    // 시각화 제안
    if (responseGuidance.visualizationSuggestions.length > 0) {
      response += `\n**시각화 제안**:\n`;
      responseGuidance.visualizationSuggestions.forEach(
        (suggestion: string) => {
          response += `- ${suggestion}\n`;
        }
      );
    }

    // 후속 질문
    if (responseGuidance.followUpQuestions.length > 0) {
      response += `\n**추가 질문**:\n`;
      responseGuidance.followUpQuestions.forEach((question: string) => {
        response += `- ${question}\n`;
      });
    }

    response += `\n---\n*분석 신뢰도: ${Math.round(qualityMetrics.confidence * 100)}% | 처리 시간: ${qualityMetrics.processingTime}ms*`;

    return response;
  }

  /**
   * 🔍 한국어 분석 결과로 검색 쿼리 향상
   */
  private enhanceQueryWithKoreanAnalysis(
    originalQuery: string,
    koreanAnalysis: any
  ): string {
    const { entities, serverContext } = koreanAnalysis;

    let enhancedQuery = originalQuery;

    // 서버 엔티티 추가
    const serverEntities = entities.filter((e: any) => e.type === 'server');
    if (serverEntities.length > 0) {
      enhancedQuery += ` ${serverEntities.map((e: any) => e.value).join(' ')}`;
    }

    // 메트릭 엔티티 추가
    const metricEntities = entities.filter((e: any) => e.type === 'metric');
    if (metricEntities.length > 0) {
      enhancedQuery += ` ${metricEntities.map((e: any) => e.value).join(' ')}`;
    }

    // 컨텍스트 메트릭 추가
    if (serverContext.metrics.length > 0) {
      enhancedQuery += ` ${serverContext.metrics.join(' ')}`;
    }

    return enhancedQuery.trim();
  }

  /**
   * 📊 향상된 RAG 결과 포맷팅 (한국어 분석 통합)
   */
  private formatEnhancedRAGResults(
    ragResult: any,
    originalQuery: string,
    koreanAnalysis?: any
  ): string {
    let response = this.formatRAGResults(ragResult, originalQuery);

    if (koreanAnalysis) {
      const { semanticAnalysis, responseGuidance } = koreanAnalysis;

      // 한국어 분석 컨텍스트 추가
      response += `\n\n## 🇰🇷 한국어 분석 인사이트\n`;
      response += `**주제**: ${semanticAnalysis.mainTopic}\n`;
      response += `**긴급도**: ${semanticAnalysis.urgencyLevel}\n`;

      if (responseGuidance.visualizationSuggestions.length > 0) {
        response += `**시각화 권장**: ${responseGuidance.visualizationSuggestions.join(', ')}\n`;
      }
    }

    return response;
  }

  /**
   * 🔧 한국어 분석으로 응답 향상
   */
  private enhanceResponseWithKoreanAnalysis(
    originalResponse: string,
    koreanAnalysis: any
  ): string {
    const { semanticAnalysis, responseGuidance, qualityMetrics } =
      koreanAnalysis;

    let enhancedResponse = originalResponse;

    // 긴급도 표시 추가
    if (semanticAnalysis.urgencyLevel === 'critical') {
      enhancedResponse = `🚨 **긴급**: ${enhancedResponse}`;
    } else if (semanticAnalysis.urgencyLevel === 'high') {
      enhancedResponse = `⚠️ **주의**: ${enhancedResponse}`;
    }

    // 컨텍스트 정보 추가
    if (responseGuidance.followUpQuestions.length > 0) {
      enhancedResponse += `\n\n**추가 확인 사항**:\n`;
      responseGuidance.followUpQuestions.forEach((question: string) => {
        enhancedResponse += `- ${question}\n`;
      });
    }

    enhancedResponse += `\n\n*한국어 분석 신뢰도: ${Math.round(qualityMetrics.confidence * 100)}%*`;

    return enhancedResponse;
  }

  /**
   * 🔄 한국어 분석 기반 폴백 응답 생성
   */
  private generateKoreanAnalysisBasedFallback(
    koreanAnalysis: any,
    request: AIRequest
  ): string {
    const { intent, semanticAnalysis, serverContext, responseGuidance } =
      koreanAnalysis;

    let response = `요청하신 "${request.query}"에 대한 분석 결과입니다.\n\n`;

    // 의도 기반 응답
    switch (intent) {
      case 'inquiry':
        response += '📋 **조회 요청 분석**:\n';
        break;
      case 'analysis':
        response += '🔍 **분석 요청 분석**:\n';
        break;
      case 'optimization':
        response += '⚡ **최적화 요청 분석**:\n';
        break;
      case 'troubleshooting':
        response += '🔧 **문제 해결 요청 분석**:\n';
        break;
      default:
        response += '💭 **일반 요청 분석**:\n';
    }

    // 주제 및 컨텍스트
    response += `- 주제: ${semanticAnalysis.mainTopic}\n`;
    if (serverContext.targetServers.length > 0) {
      response += `- 대상 서버: ${serverContext.targetServers.join(', ')}\n`;
    }
    if (serverContext.metrics.length > 0) {
      response += `- 관련 메트릭: ${serverContext.metrics.join(', ')}\n`;
    }

    // 권장 사항
    response += `\n**권장 사항**:\n`;
    if (responseGuidance.followUpQuestions.length > 0) {
      responseGuidance.followUpQuestions.forEach((question: string) => {
        response += `- ${question}\n`;
      });
    } else {
      response +=
        '- 더 구체적인 정보를 제공해 주시면 정확한 분석이 가능합니다.\n';
    }

    response += `\n*분석 엔진이 일시적으로 사용할 수 없어 기본 분석 결과를 제공합니다.*`;

    return response;
  }

  /**
   * 🔄 모드 변경 (2모드만)
   */
  setMode(mode: 'LOCAL' | 'GOOGLE_ONLY'): void {
    this.currentMode = mode;
    console.log(`🔄 AI 모드 변경됨: ${mode}`);
  }

  getCurrentMode(): 'LOCAL' | 'GOOGLE_ONLY' {
    return this.currentMode;
  }

  /**
   * 📈 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      modeUsage: { LOCAL: 0, GOOGLE_ONLY: 0 },
      engineUsage: {},
      lastUpdated: new Date().toISOString(),
    };
    console.log('📈 통계가 리셋되었습니다');
  }
}

// Export singleton instance for convenient access
export const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
