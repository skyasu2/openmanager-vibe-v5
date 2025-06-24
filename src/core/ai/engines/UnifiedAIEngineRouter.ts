/**
 * 🤖 OpenManager Vibe v5 - 통합 AI 엔진 라우터 v3.1
 *
 * 새로운 아키텍처 (MCP 역할 재정의):
 * - Supabase RAG: 메인 엔진 (70-90%)
 * - Google AI: 모드별 가중치 (5-30%)
 * - MCP: 컨텍스트 분석 도우미 (RAG 보조)
 * - 하위 AI 도구들: 응답 강화용
 *
 * 3가지 운영 모드:
 * - AUTO: Supabase RAG + MCP 컨텍스트 (80%) → Google AI (15%) → 하위AI (5%)
 * - LOCAL: Supabase RAG + MCP 컨텍스트 (90%) → 하위AI (10%) → Google AI 제외
 * - GOOGLE_ONLY: Google AI (70%) → Supabase RAG + MCP 컨텍스트 (25%) → 하위AI (5%)
 */

import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { TransformersEngine } from '@/services/ai/transformers-engine';
import { utf8Logger } from '@/utils/utf8-logger';
// 서버 사이드에서만 MCP 클라이언트 사용
let RealMCPClient: any = null;
if (typeof window === 'undefined') {
  try {
    RealMCPClient = require('@/services/mcp/real-mcp-client').RealMCPClient;
  } catch (error) {
    console.warn('⚠️ MCP 클라이언트 로드 실패 (서버 사이드 전용):', error);
  }
}

// 🚀 새로 추가: 삭제된/미사용 기능들 통합 (임시 비활성화)
// import { IntelligentMonitoringService } from '@/services/ai/IntelligentMonitoringService';
import { SolutionDatabase } from '@/core/ai/databases/SolutionDatabase';
import { IncidentDetectionEngine } from '@/core/ai/engines/IncidentDetectionEngine';
import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';

// 🎯 AI 모드 타입 정의 및 export
export type AIMode = 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';

export type AIRequest = {
  query: string;
  mode?: AIMode;
  category?: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

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
    mcpContextUsed: boolean;
    subEnginesUsed: string[];
  };
  performance?: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    engineSuccessRates: Record<string, number>;
  };
  error?: string;
}

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter | null = null;

  // 메인 엔진들
  private supabaseRAG = getSupabaseRAGEngine();
  private googleAI: GoogleAIService;
  private mcpClient: any; // 🎯 역할 변경: AI 엔진 → 컨텍스트 수집기

  // 🚀 통합된 고급 엔진들 (임시 비활성화)

  private intelligentMonitoring: any; // IntelligentMonitoringService;
  private autoIncidentReport: AutoIncidentReportSystem | null = null;

  // 하위 AI 도구들 (모든 모드에서 사용 가능)
  private koreanEngine: KoreanAIEngine;
  private transformersEngine: TransformersEngine;
  private openSourceEngines: OpenSourceEngines;
  private customEngines: CustomEngines;

  // 상태 관리
  private initialized = false;
  private currentMode: AIMode = 'AUTO';
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
      modeUsage: {
        AUTO: 0,
        LOCAL: 0,
        GOOGLE_ONLY: 0,
      },
      engineUsage: {},
      lastUpdated: new Date().toISOString(),
    };

  private constructor() {
    this.googleAI = GoogleAIService.getInstance();
    this.mcpClient = RealMCPClient ? RealMCPClient.getInstance() : null; // 🎯 컨텍스트 수집 전용

    // 🚀 고급 엔진들 안전한 초기화 (초기화 과정에서 로드됨)
    this.intelligentMonitoring = null;
    this.autoIncidentReport = null;

    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();
    this.openSourceEngines = new OpenSourceEngines();
    this.customEngines = new CustomEngines(this.openSourceEngines);

    console.log('🎯 통합 AI 엔진 라우터 생성 (MCP 컨텍스트 도우미 아키텍처)');
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
        this.initializeMCPContextHelper(), // 🎯 변경: MCP 컨텍스트 도우미 초기화
      ];

      await Promise.allSettled(mainEnginePromises);

      // 2단계: 고급 엔진들 임시 비활성화 (안정성 우선)
      console.log('⚠️ 고급 엔진들 임시 비활성화 - 기본 기능으로 동작');

      // AutoIncidentReportSystem 초기화
      try {
        const detectionEngine = new IncidentDetectionEngine();
        const solutionDB = new SolutionDatabase();
        // MONITORING 모드는 AUTO로 매핑 (제거)
        const reportMode =
          this.currentMode === 'AUTO' ? 'AUTO' : this.currentMode;
        this.autoIncidentReport = new AutoIncidentReportSystem(
          detectionEngine,
          solutionDB,
          true,
          reportMode
        );
        console.log('✅ AutoIncidentReportSystem 초기화 완료');
      } catch (error) {
        console.warn('⚠️ AutoIncidentReportSystem 초기화 실패:', error);
        this.autoIncidentReport = null;
      }

      // 3단계: 하위 AI 도구들 병렬 초기화
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
   * 🎯 통합 AI 쿼리 처리 (UTF-8 인코딩 통일)
   */
  public async processQuery(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // UTF-8 인코딩 정규화
    const normalizedQuery = this.validateKoreanQueryContent(request.query);
    const normalizedRequest: AIRequest = {
      ...request,
      query: normalizedQuery
    };

    utf8Logger.korean('🎯', `POST 쿼리 (${normalizedRequest.mode || 'AUTO'} 모드): "${normalizedQuery}"`);

    if (!this.initialized) {
      await this.initialize();
    }

    // 요청 통계 업데이트
    this.stats.totalRequests++;
    this.stats.modeUsage[normalizedRequest.mode || 'AUTO']++;

    try {
      let result: AIResponse;

      // 모드별 처리 (MONITORING 모드 제거)
      switch (normalizedRequest.mode || 'AUTO') {
        case 'AUTO':
          result = await this.processAutoMode(normalizedRequest, startTime);
          break;
        case 'LOCAL':
          result = await this.processLocalMode(normalizedRequest, startTime);
          break;
        case 'GOOGLE_ONLY':
          result = await this.processGoogleOnlyMode(normalizedRequest, startTime);
          break;
        default:
          // 알 수 없는 모드는 AUTO로 처리
          result = await this.processAutoMode(normalizedRequest, startTime);
          break;
      }

      this.stats.successfulRequests++;
      this.updateStats(result);
      return result;
    } catch (error) {
      this.stats.failedRequests++;
      console.warn('쿼리 처리 실패, 간단한 폴백 사용:', error);

      // Simple fallback 처리
      return this.createEmergencyFallback(
        normalizedRequest,
        normalizedRequest.mode || 'AUTO',
        startTime
      );
    }
  }

  private async executeQuery(request: AIRequest): Promise<AIResponse> {
    // 기본 쿼리 실행 로직
    return {
      success: true,
      response: '쿼리가 처리되었습니다.',
      confidence: 0.8,
      mode: request.mode || 'AUTO',
      enginePath: ['통합 엔진'],
      processingTime: Date.now() - Date.now(),
      fallbacksUsed: 0,
      metadata: {
        mainEngine: 'unified',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
      },
    };
  }

  /**
   * 🔄 AUTO 모드: Supabase RAG + MCP 컨텍스트 도우미
   */
  private async processAutoMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    utf8Logger.korean('🔄', 'AUTO 모드: Supabase RAG + MCP 컨텍스트 도우미');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: MCP 컨텍스트 수집 (백그라운드)
    let mcpContext: any = null;
    try {
      utf8Logger.korean('🔍', '백그라운드: MCP 컨텍스트 수집');
      mcpContext = await this.collectMCPContext(request.query, request.context);
      if (mcpContext) {
        supportEngines.push('mcp-context');
        this.stats.engineUsage.mcpContexts++;
      }
    } catch (error) {
      console.warn('⚠️ MCP 컨텍스트 수집 실패 (계속 진행):', error);
    }

    // 2단계: Supabase RAG + MCP 컨텍스트 조합 (80% 가중치)
    try {
      utf8Logger.korean('🥇', '1단계: Supabase RAG + MCP 컨텍스트 조합');

      // MCP 컨텍스트를 활용한 향상된 RAG 검색
      const enhancedQuery = mcpContext
        ? `${request.query}\n\n[컨텍스트: ${mcpContext.summary || mcpContext.info || ''}]`
        : request.query;

      const ragResult = await this.supabaseRAG.searchSimilar(enhancedQuery, {
        maxResults: 5,
        threshold: 0.6,
        category: request.category || mcpContext?.category,
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag-with-mcp-context');
        this.stats.engineUsage.supabaseRAG++;

        // 하위 AI 도구로 응답 향상
        let enhancedResponse = ragResult.results[0].content;

        // MCP 컨텍스트를 응답에 통합
        if (mcpContext && mcpContext.additionalInfo) {
          enhancedResponse += `\n\n📋 시스템 컨텍스트: ${mcpContext.additionalInfo}`;
        }

        enhancedResponse = await this.enhanceWithSubEngines(
          enhancedResponse,
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
            mcpContextUsed: !!mcpContext,
            subEnginesUsed: supportEngines,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG + MCP 컨텍스트 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: Google AI 폴백 (15% 가중치)
    try {
      console.log('🥈 2단계: Google AI 폴백');
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
            mcpContextUsed: !!mcpContext,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Google AI 폴백 실패:', error);
      fallbacksUsed++;
    }

    // 4단계: 하위 AI 도구들 최종 폴백 (5% 가중치)
    try {
      console.log('🥉 3단계: 하위 AI 도구들 최종 폴백');
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
            mcpContextUsed: !!mcpContext,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ 하위 AI 도구들 실패:', error);
      fallbacksUsed++;
    }

    throw new Error('AUTO 모드 모든 폴백 실패');
  }

  /**
   * 🔍 MCP 컨텍스트 수집 (RAG 도우미 역할)
   */
  private async collectMCPContext(query: string, context?: any): Promise<any> {
    try {
      // 클라이언트 측에서는 MCP 비활성화
      if (!this.mcpClient || typeof window !== 'undefined') {
        console.log('⚠️ MCP 컨텍스트 수집: 클라이언트 측에서 비활성화');
        return null;
      }

      // MCP는 이제 AI 응답 생성이 아닌 컨텍스트 수집만 수행
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
   * 🏠 LOCAL 모드: Supabase RAG + MCP 컨텍스트 (90%) → 하위AI (10%) → Google AI 제외
   */
  private async processLocalMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    console.log('🏠 LOCAL 모드: Supabase RAG + MCP 컨텍스트 (Google AI 제외)');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 1단계: MCP 컨텍스트 수집 (백그라운드)
    let mcpContext: any = null;
    try {
      console.log('🔍 백그라운드: MCP 컨텍스트 수집 (LOCAL 모드)');
      mcpContext = await this.collectMCPContext(request.query, request.context);
      if (mcpContext) {
        supportEngines.push('mcp-context');
        this.stats.engineUsage.mcpContexts++;
      }
    } catch (error) {
      console.warn('⚠️ MCP 컨텍스트 수집 실패 (계속 진행):', error);
    }

    // 2단계: Supabase RAG + MCP 컨텍스트 조합 (90% 가중치)
    try {
      console.log('🥇 1단계: Supabase RAG + MCP 컨텍스트 조합 (LOCAL 모드)');

      // MCP 컨텍스트를 활용한 향상된 RAG 검색 (LOCAL 모드는 더 관대한 설정)
      const enhancedQuery = mcpContext
        ? `${request.query}\n\n[로컬 컨텍스트: ${mcpContext.summary || mcpContext.info || ''}]`
        : request.query;

      const ragResult = await this.supabaseRAG.searchSimilar(enhancedQuery, {
        maxResults: 8, // LOCAL 모드에서는 더 많은 결과
        threshold: 0.5, // LOCAL 모드에서는 더 관대한 임계값
        category: request.category || mcpContext?.category,
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag-with-mcp-context-local');
        this.stats.engineUsage.supabaseRAG++;

        // 하위 AI 도구로 응답 향상
        let enhancedResponse = ragResult.results[0].content;

        // MCP 컨텍스트를 응답에 통합 (LOCAL 모드 표시)
        if (mcpContext && mcpContext.additionalInfo) {
          enhancedResponse += `\n\n🏠 로컬 시스템 컨텍스트: ${mcpContext.additionalInfo}`;
        }

        enhancedResponse = await this.enhanceWithSubEngines(
          enhancedResponse,
          request.query,
          supportEngines
        );

        return {
          success: true,
          response: enhancedResponse,
          confidence: 0.9, // LOCAL 모드에서는 더 높은 신뢰도
          mode: 'LOCAL',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'supabase-rag',
            supportEngines,
            ragUsed: true,
            googleAIUsed: false,
            mcpContextUsed: !!mcpContext,
            subEnginesUsed: supportEngines,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG + MCP 컨텍스트 실패 (LOCAL):', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI 도구들 최종 폴백 (10% 가중치) - Google AI 제외
    try {
      console.log('🥈 2단계: 하위 AI 도구들 최종 폴백 (LOCAL 모드)');
      const subEngineResponse = await this.processWithSubEnginesOnly(
        request,
        supportEngines
      );

      if (subEngineResponse.success) {
        enginePath.push('sub-engines-only-local');
        return {
          ...subEngineResponse,
          mode: 'LOCAL',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...subEngineResponse.metadata,
            mainEngine: 'sub-engines',
            mcpContextUsed: !!mcpContext,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ 하위 AI 도구들 실패 (LOCAL):', error);
      fallbacksUsed++;
    }

    throw new Error('LOCAL 모드 모든 폴백 실패 (Google AI 제외됨)');
  }

  /**
   * 🌍 GOOGLE_ONLY 모드: Google AI (70%) → Supabase RAG + MCP 컨텍스트 (25%) → 하위AI (5%)
   */
  private async processGoogleOnlyMode(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    console.log('🌍 GOOGLE_ONLY 모드: Google AI 중심 + RAG 보조');
    const enginePath: string[] = [];
    const supportEngines: string[] = [];
    let fallbacksUsed = 0;

    // 0단계: MCP 컨텍스트 수집 (백그라운드)
    let mcpContext: any = null;
    try {
      console.log('🔍 백그라운드: MCP 컨텍스트 수집 (GOOGLE_ONLY 모드)');
      mcpContext = await this.collectMCPContext(request.query, request.context);
      if (mcpContext) {
        supportEngines.push('mcp-context');
        this.stats.engineUsage.mcpContexts++;
      }
    } catch (error) {
      console.warn('⚠️ MCP 컨텍스트 수집 실패 (계속 진행):', error);
    }

    // 1단계: Google AI 우선 (70% 가중치)
    try {
      console.log('🥇 1단계: Google AI 시도');

      // MCP 컨텍스트가 있으면 Google AI 프롬프트에 포함
      let enhancedQuery = request.query;
      if (mcpContext && mcpContext.summary) {
        enhancedQuery = `${request.query}\n\n참고 컨텍스트: ${mcpContext.summary}`;
      }

      const googleResponse =
        await this.googleAI.generateResponse(enhancedQuery);

      if (googleResponse.success) {
        enginePath.push('google-ai-primary');
        this.stats.engineUsage.googleAI++;

        let finalResponse = googleResponse.content || '응답을 생성했습니다.';

        // MCP 컨텍스트 정보를 응답에 추가
        if (mcpContext && mcpContext.additionalInfo) {
          finalResponse += `\n\n🔍 시스템 정보: ${mcpContext.additionalInfo}`;
        }

        return {
          success: true,
          response: finalResponse,
          confidence: googleResponse.confidence || 0.85,
          mode: 'GOOGLE_ONLY',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'google-ai',
            supportEngines,
            ragUsed: false,
            googleAIUsed: true,
            mcpContextUsed: !!mcpContext,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Google AI 실패:', error);
      fallbacksUsed++;
    }

    // 2단계: Supabase RAG + MCP 컨텍스트 폴백 (25% 가중치)
    try {
      console.log('🥈 2단계: Supabase RAG + MCP 컨텍스트 폴백');

      const enhancedQuery = mcpContext
        ? `${request.query}\n\n[폴백 컨텍스트: ${mcpContext.summary || mcpContext.info || ''}]`
        : request.query;

      const ragResult = await this.supabaseRAG.searchSimilar(enhancedQuery, {
        maxResults: 3,
        threshold: 0.7, // GOOGLE_ONLY에서는 높은 품질만
        category: request.category || mcpContext?.category,
      });

      if (ragResult.success && ragResult.results.length > 0) {
        enginePath.push('supabase-rag-fallback');
        this.stats.engineUsage.supabaseRAG++;

        let enhancedResponse = ragResult.results[0].content;

        // MCP 컨텍스트를 응답에 통합
        if (mcpContext && mcpContext.additionalInfo) {
          enhancedResponse += `\n\n📋 시스템 컨텍스트: ${mcpContext.additionalInfo}`;
        }

        return {
          success: true,
          response: enhancedResponse,
          confidence: 0.75,
          mode: 'GOOGLE_ONLY',
          enginePath,
          processingTime: Date.now() - startTime,
          fallbacksUsed,
          metadata: {
            mainEngine: 'supabase-rag',
            supportEngines,
            ragUsed: true,
            googleAIUsed: false,
            mcpContextUsed: !!mcpContext,
            subEnginesUsed: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Supabase RAG 폴백 실패:', error);
      fallbacksUsed++;
    }

    // 3단계: 하위 AI 도구들 최종 폴백 (5% 가중치)
    try {
      console.log('🥉 3단계: 하위 AI 도구들 최종 폴백');
      const subEngineResponse = await this.processWithSubEnginesOnly(
        request,
        supportEngines
      );

      if (subEngineResponse.success) {
        enginePath.push('sub-engines-fallback');
        return {
          ...subEngineResponse,
          mode: 'GOOGLE_ONLY',
          enginePath,
          fallbacksUsed,
          metadata: {
            ...subEngineResponse.metadata,
            mainEngine: 'sub-engines',
            mcpContextUsed: !!mcpContext,
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ 하위 AI 도구들 최종 폴백 실패:', error);
      fallbacksUsed++;
    }

    throw new Error('GOOGLE_ONLY 모드 모든 폴백 실패');
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
          mcpContextUsed: false,
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

  private async initializeMCPContextHelper(): Promise<void> {
    try {
      if (this.mcpClient && typeof window === 'undefined') {
        await this.mcpClient.initialize();
        console.log('✅ MCP 클라이언트 초기화 완료 (컨텍스트 분석 도우미)');
      } else {
        console.log('⚠️ MCP 컨텍스트 도우미: 클라이언트 측에서 비활성화');
      }
    } catch (error) {
      console.warn('⚠️ MCP 클라이언트 초기화 실패:', error);
    }
  }

  /**
   * 🔧 고급 엔진들 동적 로딩
   */
  private async loadAdvancedEngines(): Promise<void> {
    // IntelligentMonitoringService 로딩 (싱글톤)
    try {
      const { IntelligentMonitoringService } = await import(
        '@/services/ai/IntelligentMonitoringService'
      );
      this.intelligentMonitoring = IntelligentMonitoringService.getInstance();
      console.log('✅ IntelligentMonitoringService 로드 성공');
    } catch (error) {
      console.warn(
        '⚠️ IntelligentMonitoringService 로드 실패:',
        error?.message
      );
      this.intelligentMonitoring = null;
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
        mcpContextUsed: false,
        subEnginesUsed: [],
      },
      performance: {
        responseTime: Date.now() - startTime,
        throughput: 0,
        errorRate: 1.0,
        engineSuccessRates: {},
      },
      error: `${mode} 모드 모든 엔진 실패`,
    };
  }

  private updateStats(response: AIResponse): void {
    const currentAvg = this.stats.averageResponseTime;
    const totalRequests = this.stats.totalRequests;

    this.stats.averageResponseTime =
      (currentAvg * (totalRequests - 1) + response.processingTime) /
      totalRequests;

    // 엔진 사용률 업데이트
    if (response.metadata.mainEngine) {
      this.stats.engineUsage[response.metadata.mainEngine] =
        (this.stats.engineUsage[response.metadata.mainEngine] || 0) + 1;
    }

    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * 🎛️ 모드 설정 및 상태 조회
   */
  public setMode(mode: AIMode): void {
    const oldMode = this.currentMode;
    this.currentMode = mode;

    // 🎯 AutoIncidentReportSystem 모드 동기화
    if (this.autoIncidentReport) {
      const reportMode = mode === 'AUTO' ? 'AUTO' : mode;
      this.autoIncidentReport.setMode(reportMode);
      console.log(`🚨 AutoIncidentReportSystem 모드 동기화: ${reportMode}`);
    }

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

        intelligentMonitoring: {
          ready: !!this.intelligentMonitoring,
          role: 'monitoring-specialist',
        },
        korean: { ready: true, role: 'sub-engine' },
        transformers: { ready: true, role: 'sub-engine' },
        openSource: { ready: true, role: 'sub-engine' },
        custom: { ready: true, role: 'sub-engine' },
      },
      stats: this.stats,
      availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
    };
  }

  public getFallbackMetrics() {
    // This method is no longer applicable as UnifiedFallbackManager is removed
    return null;
  }

  /**
   * 🔄 메트릭 리셋
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      modeUsage: { AUTO: 0, LOCAL: 0, GOOGLE_ONLY: 0 },
      engineUsage: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 🔧 폴백 전략 업데이트
   */
  public updateFallbackStrategy(mode: AIMode, strategy: any): void {
    // This method is no longer applicable as UnifiedFallbackManager is removed
  }

  /**
 * 🔤 UTF-8 인코딩 통일 및 한국어 처리 개선
 */
  private normalizeTextContent(text: string): string {
    try {
      // UTF-8 인코딩 확인 및 정규화
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');

      const encoded = encoder.encode(text);
      const normalized = decoder.decode(encoded);

      return normalized;
    } catch (error) {
      console.warn('텍스트 정규화 실패, 원본 사용:', error);
      return text;
    }
  }

  /**
   * 한국어 쿼리 검증 및 정규화
   */
  private validateKoreanQueryContent(query: string): string {
    const normalized = this.normalizeTextContent(query);

    // 한국어 문자 범위 확인
    const koreanRegex = /[\u3131-\u3163\uac00-\ud7a3]/;
    const hasKorean = koreanRegex.test(normalized);

    if (hasKorean) {
      utf8Logger.korean('🇰🇷', '한국어 쿼리 감지 및 UTF-8 정규화 완료');
    }

    return normalized;
  }
}

export const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
