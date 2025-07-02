/**
 * 🚀 통합 AI 엔진 라우터 v3.1 (재통합 버전)
 * 
 * 과도한 분리 문제 해결:
 * - 4개 컴포넌트를 다시 통합하여 응집성 향상
 * - 코드 중복 제거 및 성능 최적화
 * - 유지보수성 개선
 * 
 * 핵심 기능:
 * - 3가지 AI 모드 (AUTO/LOCAL/GOOGLE_ONLY) 동적 라우팅
 * - Supabase RAG 엔진 메인 처리 (50-80% 가중치)
 * - Google AI 모드별 가중치 조정 (2-80%)
 * - MCP 표준 서버와의 안전한 연동
 * - 하위 AI 도구들 편리한 접근
 * - 다층 폴백 시스템으로 안정성 극대화
 */

import { MCPContextCollector } from '@/core/ai/context/MCPContextCollector';
import { AIFallbackHandler } from '@/core/ai/handlers/AIFallbackHandler';
import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { TransformersEngine } from '@/services/ai/transformers-engine';
import { AIMode, AIRequest, AIResponse } from '@/types/ai-types';
import KoreanTimeUtil from '@/utils/koreanTime';

// 베르셀 환경 최적화 설정
const VERCEL_OPTIMIZATION = {
  isVercel: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
  maxProcessingTime: 8000, // 8초 제한
  enableFastMode: true,
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

  // 상태 관리
  private initialized = false;
  private currentMode: AIMode = 'LOCAL';
  private lastRequestContext: any = null;
  private stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    modeUsage: Record<AIMode, number>;
    engineUsage: Record<string, number>;
    lastUpdated: string;
  } = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      modeUsage: { LOCAL: 0, GOOGLE_AI: 0, AUTO: 0, GOOGLE_ONLY: 0 },
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

    console.log('✅ UnifiedAIEngineRouter v3.1 재통합 완료');
  }

  static getInstance(): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter();
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🚀 메인 쿼리 처리 메서드
   */
  async processQuery(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.modeUsage[request.mode || 'LOCAL']++;

    // 베르셀 환경 타임아웃 체크
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (VERCEL_OPTIMIZATION.isVercel && elapsed > VERCEL_OPTIMIZATION.maxProcessingTime) {
        throw new Error(`베르셀 환경 타임아웃 (${elapsed}ms > ${VERCEL_OPTIMIZATION.maxProcessingTime}ms)`);
      }
      return elapsed;
    };

    try {
      // 모드 정규화
      const normalizedMode = this.normalizeMode(request.mode);
      this.currentMode = normalizedMode;

      console.log(`🎯 UnifiedAIEngineRouter: ${normalizedMode} 모드로 처리`);

      let result: AIResponse;

      // 모드별 처리
      switch (normalizedMode) {
        case 'LOCAL':
          result = await this.processLocalMode(request, startTime, checkTimeout);
          break;
        case 'GOOGLE_AI':
          result = await this.processGoogleOnlyMode(request, startTime, checkTimeout);
          break;
        case 'AUTO':
          result = await this.processAutoMode(request, startTime, checkTimeout);
          break;
        default:
          throw new Error(`지원하지 않는 모드: ${normalizedMode}`);
      }

      // 통계 업데이트
      this.updateSuccessStats(Date.now() - startTime);

      return result;

    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 오류:', error);
      this.updateFailureStats();

      return this.formatErrorResponse(error, startTime, request.mode || 'LOCAL');
    }
  }

  /**
   * 🏠 LOCAL 모드 처리: Supabase RAG (80%) → MCP+하위AI (20%)
   */
  private async processLocalMode(
    request: AIRequest,
    startTime: number,
    checkTimeout: () => number
  ): Promise<AIResponse> {
    console.log('🏠 LOCAL 모드: Supabase RAG 우선 + 로컬 AI');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: Supabase RAG 우선 처리 (80% 가중치)
    try {
      console.log('🥇 LOCAL 1단계: Supabase RAG (80%)');
      checkTimeout();

      if (this.supabaseRAG && typeof this.supabaseRAG.searchSimilar === 'function') {
        const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
          maxResults: 3,
          threshold: 0.7,
          category: request.category,
          enableMCP: true,
        });

        if (ragResult && ragResult.success && ragResult.results?.length > 0) {
          enginePath.push('supabase-rag-primary');
          supportEngines.push('rag-engine');
          this.stats.engineUsage.supabaseRAG = (this.stats.engineUsage.supabaseRAG || 0) + 1;

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
      console.warn('⚠️ LOCAL 1단계 Supabase RAG 실패:', error);
      fallbacksUsed++;
    }

    // 2단계: MCP + 하위 AI 처리 (20% 가중치)
    try {
      console.log('🥈 LOCAL 2단계: MCP + 하위 AI (20%)');
      checkTimeout();

      // MCP 컨텍스트 수집
      let mcpContext: any = null;
      try {
        mcpContext = await this.collectMCPContext(request.query, request.context);
        if (mcpContext) {
          supportEngines.push('mcp-context');
        }
      } catch (error) {
        console.warn('⚠️ LOCAL MCP 컨텍스트 실패:', error);
      }

      // 데이터 기반 스마트 응답 시도
      const dataResponse = await this.generateDataBasedResponse(request.query, checkTimeout);
      if (dataResponse) {
        enginePath.push('local-data-smart');
        supportEngines.push('korean-ai', 'system-metrics');

        return this.formatSuccessResponse(
          dataResponse,
          enginePath,
          supportEngines,
          startTime
        );
      }

      // 하위 엔진 처리
      const subEngineResult = await this.processLocalModeSubEngines(request);
      if (subEngineResult.success) {
        return subEngineResult;
      }

    } catch (error) {
      console.warn('⚠️ LOCAL 2단계 실패:', error);
      fallbacksUsed++;
    }

    // 최종 폴백
    return this.formatFallbackResponse('LOCAL', enginePath, supportEngines, startTime, fallbacksUsed);
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

      if (this.googleAI && typeof this.googleAI.generateContent === 'function') {
        const googleResult = await this.googleAI.generateContent(enhancedQuery, {
          timeout: 5000,
          isNaturalLanguage: true,
        });

        if (googleResult.success) {
          enginePath.push('google-ai-primary');
          this.stats.engineUsage.googleAI = (this.stats.engineUsage.googleAI || 0) + 1;

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

      if (this.supabaseRAG && typeof this.supabaseRAG.searchSimilar === 'function') {
        const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
          maxResults: 3,
          threshold: 0.6,
          category: request.category,
          enableMCP: true,
        });

        if (ragResult && ragResult.success && ragResult.results?.length > 0) {
          enginePath.push('supabase-rag-google-fallback');
          supportEngines.push('rag-engine-google');
          this.stats.engineUsage.supabaseRAG = (this.stats.engineUsage.supabaseRAG || 0) + 1;

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

      const subEngineResult = await this.processGoogleOnlyModeSubEngines(request);
      if (subEngineResult.success) {
        return subEngineResult;
      }
    } catch (error) {
      console.warn('⚠️ GOOGLE_AI 3단계 실패:', error);
      fallbacksUsed++;
    }

    // 최종 폴백
    return this.formatFallbackResponse('GOOGLE_AI', enginePath, supportEngines, startTime, fallbacksUsed);
  }

  /**
   * 🔄 AUTO 모드 처리: Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)
   */
  private async processAutoMode(
    request: AIRequest,
    startTime: number,
    checkTimeout: () => number
  ): Promise<AIResponse> {
    console.log('🔄 AUTO 모드: 다층 폴백 시스템');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: Supabase RAG 우선 (50% 가중치)
    try {
      console.log('🥇 AUTO 1단계: Supabase RAG (50%)');
      checkTimeout();

      if (this.supabaseRAG && typeof this.supabaseRAG.searchSimilar === 'function') {
        const ragResult = await this.supabaseRAG.searchSimilar(request.query, {
          maxResults: 4,
          threshold: 0.65,
          category: request.category,
          enableMCP: true,
        });

        if (ragResult && ragResult.success && ragResult.results?.length > 0) {
          enginePath.push('supabase-rag-auto');
          supportEngines.push('rag-engine-auto');
          this.stats.engineUsage.supabaseRAG = (this.stats.engineUsage.supabaseRAG || 0) + 1;

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
      console.warn('⚠️ AUTO 1단계 Supabase RAG 실패:', error);
      fallbacksUsed++;
    }

    // 2단계: MCP + 하위 AI (30% 가중치)
    try {
      console.log('🥈 AUTO 2단계: MCP + 하위 AI (30%)');
      checkTimeout();

      // MCP 컨텍스트 수집
      let mcpContext: any = null;
      try {
        mcpContext = await this.collectMCPContext(request.query, request.context);
        if (mcpContext) {
          supportEngines.push('mcp-context-auto');
        }
      } catch (error) {
        console.warn('⚠️ AUTO MCP 컨텍스트 실패:', error);
      }

      // 데이터 기반 응답
      const dataResponse = await this.generateDataBasedResponse(request.query, checkTimeout);
      if (dataResponse) {
        enginePath.push('auto-data-smart');
        supportEngines.push('korean-ai-auto', 'system-metrics-auto');

        return this.formatSuccessResponse(
          dataResponse,
          enginePath,
          supportEngines,
          startTime
        );
      }
    } catch (error) {
      console.warn('⚠️ AUTO 2단계 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI만 (18% 가중치)
    try {
      console.log('🥉 AUTO 3단계: 하위 AI만 (18%)');
      checkTimeout();

      const subEngineResult = await this.processLocalModeSubEngines(request);
      if (subEngineResult.success) {
        return subEngineResult;
      }
    } catch (error) {
      console.warn('⚠️ AUTO 3단계 실패:', error);
      fallbacksUsed++;
    }

    // 4단계: Google AI 최종 폴백 (2% 가중치)
    try {
      console.log('🚨 AUTO 4단계: Google AI 최종 폴백 (2%)');
      checkTimeout();

      const googleResult = await this.googleAI.generateContent(request.query, {
        timeout: 8000,
        isNaturalLanguage: true,
      });

      if (googleResult.success) {
        enginePath.push('google-ai-auto-fallback');
        supportEngines.push('google-ai-final');
        this.stats.engineUsage.googleAI = (this.stats.engineUsage.googleAI || 0) + 1;

        return this.formatSuccessResponse(
          googleResult.content,
          enginePath,
          supportEngines,
          startTime
        );
      }
    } catch (error) {
      console.warn('⚠️ AUTO 4단계 Google AI 최종 폴백 실패:', error);
      fallbacksUsed++;
    }

    // 최종 폴백
    return this.formatFallbackResponse('AUTO', enginePath, supportEngines, startTime, fallbacksUsed);
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
        '서버', '상태', '모니터링', '성능', '분석',
        'CPU', '메모리', '디스크', '네트워크',
      ];
      const hasSystemKeyword = keywords.some(keyword => query.includes(keyword));

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
          const memoryUsed = Math.round(systemMetrics.memory.heapUsed / 1024 / 1024);
          const memoryTotal = Math.round(systemMetrics.memory.heapTotal / 1024 / 1024);
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
  private async processLocalModeSubEngines(request: AIRequest): Promise<AIResponse> {
    try {
      const koreanResult = await this.koreanEngine.processQuery(request.query, {
        category: request.category,
        maxTokens: 800,
      });

      if (koreanResult.success) {
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
  private async processGoogleOnlyModeSubEngines(request: AIRequest): Promise<AIResponse> {
    try {
      const koreanResult = await this.koreanEngine.processQuery(request.query, {
        category: request.category,
        maxTokens: 600,
      });

      if (koreanResult.success) {
        try {
          const googleEnhanced = await this.googleAI.generateContent(
            `서버 관리 전문가로서 다음 정보를 향상시켜주세요: ${koreanResult.response}`,
            { isNaturalLanguage: true }
          );

          const finalResponse = googleEnhanced.success
            ? googleEnhanced.content
            : koreanResult.response;

          return {
            success: true,
            response: finalResponse,
            confidence: 0.8,
            mode: 'GOOGLE_AI',
            enginePath: ['GOOGLE_AI', 'korean-ai-google-enhanced'],
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
            mode: 'GOOGLE_AI',
            enginePath: ['GOOGLE_AI', 'korean-ai-fallback'],
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
      mode: 'GOOGLE_AI',
      enginePath: ['GOOGLE_AI', 'failed'],
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
    startTime: number
  ): AIResponse {
    return {
      success: true,
      response,
      confidence: 0.8,
      mode: this.currentMode,
      enginePath,
      processingTime: Date.now() - startTime,
      fallbacksUsed: 0,
      metadata: {
        mainEngine: enginePath[0] || 'unknown',
        supportEngines,
        ragUsed: enginePath.includes('supabase-rag') || enginePath.some(p => p.includes('rag')),
        googleAIUsed: enginePath.includes('google-ai') || enginePath.some(p => p.includes('google')),
        mcpContextUsed: supportEngines.some(s => s.includes('mcp-context')),
        subEnginesUsed: supportEngines,
        cacheUsed: false,
      },
    };
  }

  /**
   * ❌ 오류 응답 포맷팅
   */
  private formatErrorResponse(error: any, startTime: number, mode: AIMode): AIResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      response: `${mode} 모드 처리 중 오류가 발생했습니다: ${errorMessage}`,
      confidence: 0,
      mode,
      enginePath: [mode, 'error'],
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
   * 🔄 폴백 응답 생성
   */
  private formatFallbackResponse(
    mode: AIMode,
    enginePath: string[],
    supportEngines: string[],
    startTime: number,
    fallbacksUsed: number
  ): AIResponse {
    const fallbackMessages = {
      LOCAL: '로컬 AI 엔진들이 현재 사용할 수 없습니다. 시스템 관리자에게 문의하세요.',
      GOOGLE_AI: 'Google AI 서비스가 현재 사용할 수 없습니다. 나중에 다시 시도해주세요.',
      AUTO: '모든 AI 엔진이 현재 사용할 수 없습니다. 시스템 점검 중일 수 있습니다.',
      GOOGLE_ONLY: 'Google AI 전용 모드가 현재 사용할 수 없습니다.',
    };

    return {
      success: false,
      response: fallbackMessages[mode] || '알 수 없는 오류가 발생했습니다.',
      confidence: 0,
      mode,
      enginePath: [...enginePath, 'fallback'],
      processingTime: Date.now() - startTime,
      fallbacksUsed,
      metadata: {
        mainEngine: 'fallback',
        supportEngines,
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
        allEnginesFailed: true,
      },
    };
  }

  // ===========================================
  // 🔧 기타 유틸리티 메서드들
  // ===========================================

  /**
   * 모드 정규화
   */
  private normalizeMode(mode?: AIMode): AIMode {
    if (!mode) return 'LOCAL';

    const validModes: AIMode[] = ['LOCAL', 'GOOGLE_AI', 'AUTO', 'GOOGLE_ONLY'];
    return validModes.includes(mode) ? mode : 'LOCAL';
  }

  /**
   * 성공 통계 업데이트
   */
  private updateSuccessStats(processingTime: number): void {
    this.stats.successfulRequests++;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + processingTime) /
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
      console.log('🚀 UnifiedAIEngineRouter 초기화 시작...');

      // AutoIncidentReportSystem 지연 로딩
      try {
        const { AutoIncidentReportSystem } = await import('@/core/ai/systems/AutoIncidentReportSystem');
        this.autoIncidentReport = AutoIncidentReportSystem;
        console.log('✅ AutoIncidentReportSystem 연결됨');
      } catch (error) {
        console.warn('⚠️ AutoIncidentReportSystem 로딩 실패:', error);
      }

      this.initialized = true;
      console.log('✅ UnifiedAIEngineRouter 초기화 완료');
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 상태 조회
   */
  getStatus(): any {
    return {
      router: 'UnifiedAIEngineRouter',
      version: '3.1.0',
      mode: this.currentMode,
      initialized: this.initialized,
      stats: this.stats,
      engines: {
        supabaseRAG: !!this.supabaseRAG,
        googleAI: !!this.googleAI,
        koreanEngine: !!this.koreanEngine,
        transformersEngine: !!this.transformersEngine,
        openSourceEngines: !!this.openSourceEngines,
        customEngines: !!this.customEngines,
        mcpContextCollector: !!this.mcpContextCollector,
        fallbackHandler: !!this.fallbackHandler,
      },
      lastRequestContext: this.lastRequestContext,
    };
  }

  /**
   * 🔄 모드 변경
   */
  setMode(mode: AIMode): void {
    const normalizedMode = this.normalizeMode(mode);
    this.currentMode = normalizedMode;
    console.log(`🔄 AI 모드 변경됨: ${normalizedMode}`);
  }

  getCurrentMode(): AIMode {
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
      modeUsage: { LOCAL: 0, GOOGLE_AI: 0, AUTO: 0, GOOGLE_ONLY: 0 },
      engineUsage: {},
      lastUpdated: new Date().toISOString(),
    };
    console.log('📈 통계가 리셋되었습니다');
  }
}

// Export singleton instance for convenient access
export const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
