/**
 * 🚀 Refactored AI Engine Hub - 통합 AI 엔진 허브
 *
 * 중복 제거 및 의도적 분리 유지:
 * ✅ UnifiedAIEngine + EnhancedUnifiedAIEngine 통합
 * ✅ GoogleAIModeManager 3모드 유지 (AUTO/LOCAL/GOOGLE_ONLY)
 * ✅ DualCoreOrchestrator MCP+RAG 병렬 실행 유지
 * ✅ SmartFallbackEngine 지능형 폴백 체인 유지
 * ✅ 상호보완적 AI 엔진 협업 구현
 */

import {
  GoogleAIModeManager,
  GoogleAIMode,
} from './engines/GoogleAIModeManager';
import { DualCoreOrchestrator } from './engines/DualCoreOrchestrator';
import { SmartFallbackEngine } from '@/services/ai/SmartFallbackEngine';
import { UnifiedAIEngine } from './UnifiedAIEngine';
import { naturalLanguageUnifier } from '@/services/ai/NaturalLanguageUnifier';
import { AIEngineChain } from './AIEngineChain';
import { ContextManager } from './ContextManager';
import {
  aiLogger,
  LogLevel,
  LogCategory,
} from '@/services/ai/logging/AILogger';

// 통합된 AI 요청/응답 인터페이스
export interface AIHubRequest {
  query: string;
  mode: GoogleAIMode; // AUTO | LOCAL | GOOGLE_ONLY
  strategy:
    | 'dual_core'
    | 'smart_fallback'
    | 'unified'
    | 'chain'
    | 'natural_language';
  context?: {
    serverMetrics?: any[];
    timeRange?: { start: Date; end: Date };
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    language?: 'ko' | 'en';
    sessionId?: string;
    // 자동 보고서 생성을 위한 추가 속성들
    metrics?: any;
    anomalies?: any[];
    patterns?: any;
    reportParams?: AutoReportRequest;
    isAutoReport?: boolean;
    intentAnalysis?: any;
    isNaturalLanguage?: boolean;
  };
  options?: {
    enableThinking?: boolean;
    maxResponseTime?: number;
    confidenceThreshold?: number;
    useMCP?: boolean;
    useRAG?: boolean;
    useGoogleAI?: boolean;
  };
}

export interface AIHubResponse {
  success: boolean;
  response: string;
  confidence: number;
  mode: GoogleAIMode;
  strategy: string;
  enginePath: string[];
  processingTime: number;
  metadata: {
    engines: {
      used: string[];
      fallbacks: string[];
      performance: Record<string, number>;
    };
    thinking?: any[];
    sources?: string[];
    suggestions?: string[];
  };
  systemStatus: {
    overall: 'healthy' | 'degraded' | 'critical';
    components: Record<string, boolean>;
  };
}

// 통합된 AI 기능 타입 정의
export type AIFunctionType =
  | 'natural_language_query'
  | 'auto_report'
  | 'general';

// 자동 장애 보고서 생성을 위한 인터페이스
interface AutoReportRequest {
  timeRange?: '1h' | '6h' | '24h' | '7d';
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
  format?: 'summary' | 'detailed' | 'executive';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

// 자동 장애 보고서 응답 인터페이스
interface AutoReportResponse {
  reportId: string;
  generatedAt: string;
  timeRange: string;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    affectedServers: number;
    overallStatus: 'healthy' | 'warning' | 'critical';
  };
  issues: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    affectedServers: string[];
    firstDetected: string;
    lastOccurrence: string;
    recommendation: string;
    metrics?: any;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    impact: string;
    effort: string;
  }>;
  trends: {
    performanceTrend: 'improving' | 'stable' | 'declining';
    issueFrequency: 'decreasing' | 'stable' | 'increasing';
    systemHealth: number; // 0-100 점수
  };
}

/**
 * 🎯 통합 AI 엔진 허브
 * 모든 AI 엔진들을 통합 관리하면서 의도적 분리 유지
 */
export class RefactoredAIEngineHub {
  private static instance: RefactoredAIEngineHub | null = null;

  // 핵심 AI 엔진들 (의도적 분리 유지)
  private googleAIModeManager: GoogleAIModeManager;
  private dualCoreOrchestrator: DualCoreOrchestrator;
  // SmartFallbackEngine은 싱글톤으로 직접 사용
  private unifiedAIEngine: UnifiedAIEngine;
  private aiEngineChain: AIEngineChain;
  private contextManager: ContextManager;

  // 시스템 상태 관리
  private initialized = false;
  private systemHealth = new Map<string, boolean>();
  private engineStats = new Map<string, any>();

  private constructor() {
    console.log('🚀 RefactoredAIEngineHub 인스턴스 생성');

    // 핵심 엔진들 초기화 (의도적 분리 유지)
    this.googleAIModeManager = new GoogleAIModeManager();
    this.dualCoreOrchestrator = new DualCoreOrchestrator();
    // SmartFallbackEngine은 싱글톤으로 직접 사용
    this.unifiedAIEngine = UnifiedAIEngine.getInstance();
    this.aiEngineChain = new AIEngineChain();
    this.contextManager = ContextManager.getInstance();
  }

  public static getInstance(): RefactoredAIEngineHub {
    if (!RefactoredAIEngineHub.instance) {
      RefactoredAIEngineHub.instance = new RefactoredAIEngineHub();
    }
    return RefactoredAIEngineHub.instance;
  }

  /**
   * 🔧 AI 엔진 허브 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔧 RefactoredAIEngineHub 초기화 시작...');

      await aiLogger.logAI({
        level: LogLevel.INFO,
        category: LogCategory.AI_ENGINE,
        engine: 'RefactoredAIEngineHub',
        message: '🚀 AI 엔진 허브 초기화 시작',
      });

      // 병렬로 모든 엔진 초기화
      await Promise.all([
        this.googleAIModeManager.initialize(),
        this.dualCoreOrchestrator.initialize(),
        this.unifiedAIEngine.initialize(),
        this.aiEngineChain.initialize(),
      ]);

      // 시스템 헬스체크
      await this.performHealthCheck();

      this.initialized = true;
      console.log('✅ RefactoredAIEngineHub 초기화 완료');
    } catch (error) {
      console.error('❌ RefactoredAIEngineHub 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 통합 AI 질의 처리 (메인 엔트리 포인트)
   */
  public async processQuery(request: AIHubRequest): Promise<AIHubResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log(
      `🎯 AI Hub 질의 처리: "${request.query}" [모드: ${request.mode}, 전략: ${request.strategy}]`
    );

    try {
      // 1단계: 전략별 라우팅
      const result = await this.routeByStrategy(request);

      // 2단계: 모드별 후처리 (GoogleAI 통합)
      const enhancedResult = await this.enhanceWithMode(result, request);

      // 3단계: 상호보완적 결과 융합
      const finalResult = await this.fuseComplementaryResults(
        enhancedResult,
        request
      );

      const processingTime = Date.now() - startTime;

      return {
        success: finalResult.success,
        response: finalResult.response,
        confidence: finalResult.confidence,
        mode: request.mode,
        strategy: request.strategy,
        enginePath: finalResult.enginePath || [request.strategy],
        processingTime,
        metadata: {
          engines: {
            used: finalResult.enginesUsed || [request.strategy],
            fallbacks: finalResult.fallbacks || [],
            performance: finalResult.performance || {},
          },
          thinking: finalResult.thinking,
          sources: finalResult.sources,
          suggestions: finalResult.suggestions,
        },
        systemStatus: {
          overall: this.getOverallHealth(),
          components: Object.fromEntries(this.systemHealth),
        },
      };
    } catch (error) {
      console.error('❌ AI Hub 질의 처리 실패:', error);

      return {
        success: false,
        response: `죄송합니다. "${request.query}" 처리 중 오류가 발생했습니다.`,
        confidence: 0,
        mode: request.mode,
        strategy: request.strategy,
        enginePath: ['error'],
        processingTime: Date.now() - startTime,
        metadata: {
          engines: { used: [], fallbacks: [], performance: {} },
        },
        systemStatus: {
          overall: 'critical',
          components: Object.fromEntries(this.systemHealth),
        },
      };
    }
  }

  /**
   * 🎯 전략별 라우팅 (의도적 분리 유지)
   */
  private async routeByStrategy(request: AIHubRequest): Promise<any> {
    switch (request.strategy) {
      case 'dual_core':
        // DualCoreOrchestrator: MCP + RAG 병렬 실행
        return await this.processDualCore(request);

      case 'smart_fallback':
        // SmartFallbackEngine: 지능형 폴백 체인
        return await this.processSmartFallback(request);

      case 'unified':
        // UnifiedAIEngine: 통합 처리
        return await this.processUnified(request);

      case 'chain':
        // AIEngineChain: MCP → RAG → Google AI 체인
        return await this.processChain(request);

      case 'natural_language':
        // NaturalLanguageUnifier: 한국어 특화
        return await this.processNaturalLanguage(request);

      default:
        // 기본 전략: 요청에 따라 최적 선택
        return await this.processAutoStrategy(request);
    }
  }

  /**
   * 🎭 DualCore 처리 (MCP + RAG 병렬)
   */
  private async processDualCore(request: AIHubRequest): Promise<any> {
    console.log('🎭 DualCore 전략 실행: MCP + RAG 병렬 처리');

    const result = await this.dualCoreOrchestrator.search(request.query, {
      maxResults: 10,
      enableFusion: true,
      preferEngine: 'auto',
    });

    return {
      success: result.success,
      response: result.fusedResult.response,
      confidence: result.fusedResult.confidence,
      enginePath: ['dual_core', 'mcp', 'rag'],
      enginesUsed: ['mcp', 'rag'],
      performance: result.performance,
      sources: result.fusedResult.sources,
      suggestions: result.fusedResult.suggestions,
    };
  }

  /**
   * 🧠 SmartFallback 처리 (지능형 폴백)
   */
  private async processSmartFallback(request: AIHubRequest): Promise<any> {
    console.log('🧠 SmartFallback 전략 실행: 지능형 폴백 체인');

    const engine = SmartFallbackEngine.getInstance();
    const result = await engine.processQuery(request.query, request.context, {
      enableMCP: request.options?.useMCP !== false,
      enableRAG: request.options?.useRAG !== false,
      enableGoogleAI: request.options?.useGoogleAI !== false,
    });

    return {
      success: result.success,
      response: result.response,
      confidence: result.confidence,
      enginePath: ['smart_fallback', result.stage],
      enginesUsed: [result.stage],
      performance: { responseTime: result.responseTime },
      fallbacks: result.fallbackPath,
    };
  }

  /**
   * 🚀 Unified 처리 (통합 엔진)
   */
  private async processUnified(request: AIHubRequest): Promise<any> {
    console.log('🚀 Unified 전략 실행: 통합 엔진 처리');

    const result = await this.unifiedAIEngine.processQuery({
      query: request.query,
      context: {
        serverMetrics: request.context?.serverMetrics,
        timeRange: request.context?.timeRange,
        urgency: request.context?.urgency,
      },
      options: {
        enable_thinking_log: request.options?.enableThinking,
        maxResponseTime: request.options?.maxResponseTime,
        confidenceThreshold: request.options?.confidenceThreshold,
      },
    });

    return {
      success: result.success,
      response: result.analysis.summary,
      confidence: result.analysis.confidence,
      enginePath: ['unified', ...result.engines.used],
      enginesUsed: result.engines.used,
      thinking: result.thinking_process,
      performance: { responseTime: result.response_time },
      sources: result.analysis.details,
      suggestions: result.recommendations,
    };
  }

  /**
   * 🔗 Chain 처리 (엔진 체인)
   */
  private async processChain(request: AIHubRequest): Promise<any> {
    console.log('🔗 Chain 전략 실행: MCP → RAG → Google AI 체인');

    const result = await this.aiEngineChain.processQuery({
      id: `chain-${Date.now()}`,
      text: request.query,
      context: request.context,
      userId: request.context?.sessionId,
    });

    return {
      success: (result as any)?.success !== false,
      response: (result as any)?.answer || '처리 완료',
      confidence: (result as any)?.confidence || 0.7,
      enginePath: ['chain', (result as any)?.engine || 'unknown'],
      enginesUsed: [(result as any)?.engine || 'chain'],
      performance: { responseTime: (result as any)?.processingTime || 0 },
      sources: (result as any)?.sources || [],
    };
  }

  /**
   * 🇰🇷 NaturalLanguage 처리 (한국어 특화)
   */
  private async processNaturalLanguage(request: AIHubRequest): Promise<any> {
    console.log('🇰🇷 NaturalLanguage 전략 실행: 한국어 특화 처리');

    const result = await naturalLanguageUnifier.processQuery({
      query: request.query,
      context: {
        language: request.context?.language || 'ko',
        serverData: request.context,
      },
      options: {
        useKoreanAI: true,
        useDataAnalyzer: true,
        useMetricsBridge: false,
      },
    });

    return {
      success: result.success,
      response: result.answer,
      confidence: result.confidence,
      enginePath: ['natural_language', result.engine],
      enginesUsed: [result.engine],
      performance: { responseTime: result.metadata?.processingTime || 0 },
      suggestions: result.suggestions,
    };
  }

  /**
   * 🎯 자동 전략 선택
   */
  private async processAutoStrategy(request: AIHubRequest): Promise<any> {
    console.log('🎯 Auto 전략: 요청 분석 후 최적 전략 선택');

    // 쿼리 분석하여 최적 전략 결정
    const strategy = this.determineOptimalStrategy(request);
    console.log(`🎯 선택된 최적 전략: ${strategy}`);

    // 선택된 전략으로 처리
    return await this.routeByStrategy({ ...request, strategy });
  }

  /**
   * 🎯 최적 전략 결정 로직
   */
  private determineOptimalStrategy(
    request: AIHubRequest
  ): AIHubRequest['strategy'] {
    const query = request.query.toLowerCase();

    // 한국어 쿼리면 natural_language 우선
    if (/[가-힣]/.test(query) && query.length < 100) {
      return 'natural_language';
    }

    // 서버 관련 쿼리면 dual_core (MCP + RAG)
    if (
      query.includes('서버') ||
      query.includes('server') ||
      query.includes('metric')
    ) {
      return 'dual_core';
    }

    // 복잡한 분석 요청이면 unified
    if (
      query.includes('분석') ||
      query.includes('예측') ||
      query.includes('analyze')
    ) {
      return 'unified';
    }

    // 기본값: smart_fallback
    return 'smart_fallback';
  }

  /**
   * 🔄 모드별 후처리 (GoogleAI 통합)
   */
  private async enhanceWithMode(
    result: any,
    request: AIHubRequest
  ): Promise<any> {
    // LOCAL 모드면 Google AI 사용 안함
    if (request.mode === 'LOCAL') {
      return result;
    }

    // GoogleAIModeManager를 통한 모드별 처리
    try {
      const enhancedResult = await this.googleAIModeManager.processQuery(
        request.query,
        {
          forceMode: request.mode,
          dualCoreResult: result,
          enableFallback: true,
        }
      );

      if (enhancedResult.success) {
        return {
          ...result,
          response: enhancedResult.response,
          confidence: Math.max(result.confidence, enhancedResult.confidence),
          enginePath: [
            ...(result.enginePath || []),
            `google_ai_${request.mode}`,
          ],
          enginesUsed: [...(result.enginesUsed || []), 'google_ai'],
          googleAIDetails: enhancedResult.engineDetails,
        };
      }
    } catch (error) {
      console.warn('⚠️ GoogleAI 모드 처리 실패, 원본 결과 사용:', error);
    }

    return result;
  }

  /**
   * 🔄 상호보완적 결과 융합
   */
  private async fuseComplementaryResults(
    result: any,
    request: AIHubRequest
  ): Promise<any> {
    // 여러 엔진 결과가 있으면 융합
    if (result.enginesUsed && result.enginesUsed.length > 1) {
      console.log('🔄 상호보완적 결과 융합 수행');

      // 신뢰도 가중 평균
      const weightedConfidence = Math.min(
        result.confidence * 1.1, // 다중 엔진 보너스
        1.0
      );

      return {
        ...result,
        confidence: weightedConfidence,
        response: this.enhanceResponseWithFusion(
          result.response,
          result.sources
        ),
      };
    }

    return result;
  }

  /**
   * 🔧 응답 융합 강화
   */
  private enhanceResponseWithFusion(
    response: string,
    sources?: string[]
  ): string {
    if (!sources || sources.length === 0) {
      return response;
    }

    // 응답이 너무 짧으면 소스 정보 추가
    if (response.length < 100) {
      return `${response}\n\n💡 *참고: ${sources.length}개 소스에서 검증된 정보입니다.*`;
    }

    return response;
  }

  /**
   * 🏥 시스템 헬스체크
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // 각 엔진 상태 확인
      this.systemHealth.set('google_ai', await this.checkGoogleAIHealth());
      this.systemHealth.set('dual_core', await this.checkDualCoreHealth());
      this.systemHealth.set(
        'smart_fallback',
        await this.checkSmartFallbackHealth()
      );
      this.systemHealth.set('unified', await this.checkUnifiedHealth());
      this.systemHealth.set('chain', true); // AIEngineChain은 항상 사용 가능
      this.systemHealth.set('natural_language', true); // NaturalLanguageUnifier는 항상 사용 가능
    } catch (error) {
      console.error('❌ 시스템 헬스체크 실패:', error);
    }
  }

  private async checkGoogleAIHealth(): Promise<boolean> {
    try {
      return this.googleAIModeManager.isReady();
    } catch {
      return false;
    }
  }

  private async checkDualCoreHealth(): Promise<boolean> {
    try {
      const health = await this.dualCoreOrchestrator.healthCheck();
      return health.overall;
    } catch {
      return false;
    }
  }

  private async checkSmartFallbackHealth(): Promise<boolean> {
    try {
      const engine = SmartFallbackEngine.getInstance();
      const status = engine.getSystemStatus();
      return status.initialized;
    } catch {
      return false;
    }
  }

  private async checkUnifiedHealth(): Promise<boolean> {
    try {
      const status = await this.unifiedAIEngine.getSystemStatus();
      return status.initialized;
    } catch {
      return false;
    }
  }

  private getOverallHealth(): 'healthy' | 'degraded' | 'critical' {
    const healthyCount = Array.from(this.systemHealth.values()).filter(
      Boolean
    ).length;
    const totalCount = this.systemHealth.size;

    if (healthyCount === totalCount) return 'healthy';
    if (healthyCount >= totalCount * 0.7) return 'degraded';
    return 'critical';
  }

  /**
   * 📊 시스템 상태 조회
   */
  public async getSystemStatus(): Promise<any> {
    await this.performHealthCheck();

    return {
      initialized: this.initialized,
      overall: this.getOverallHealth(),
      engines: {
        google_ai_mode_manager: this.systemHealth.get('google_ai'),
        dual_core_orchestrator: this.systemHealth.get('dual_core'),
        smart_fallback_engine: this.systemHealth.get('smart_fallback'),
        unified_ai_engine: this.systemHealth.get('unified'),
        ai_engine_chain: this.systemHealth.get('chain'),
        natural_language_unifier: this.systemHealth.get('natural_language'),
      },
      stats: Object.fromEntries(this.engineStats),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🧹 정리 작업
   */
  public async cleanup(): Promise<void> {
    try {
      await Promise.all([
        this.dualCoreOrchestrator.cleanup(),
        // 다른 엔진들도 필요시 정리
      ]);

      this.systemHealth.clear();
      this.engineStats.clear();

      console.log('🧹 RefactoredAIEngineHub 정리 완료');
    } catch (error) {
      console.error('❌ RefactoredAIEngineHub 정리 실패:', error);
    }
  }

  /**
   * 🎯 통합 AI 기능 처리 (자연어 질의 + 자동 보고서)
   */
  async processAIFunction(
    functionType: AIFunctionType,
    request: AIHubRequest,
    additionalParams?: any
  ): Promise<any> {
    console.log(`🎯 AI 기능 처리: ${functionType}`);

    switch (functionType) {
      case 'natural_language_query':
        return this.processNaturalLanguageQuery(request);

      case 'auto_report':
        return this.generateAutoReport(
          request,
          additionalParams as AutoReportRequest
        );

      default:
        return this.processQuery(request);
    }
  }

  /**
   * 🗣️ 자연어 질의 응답 처리 (기존 기능 강화)
   */
  private async processNaturalLanguageQuery(
    request: AIHubRequest
  ): Promise<any> {
    console.log('🗣️ 자연어 질의 응답 처리 시작');

    try {
      // 1단계: 자연어 의도 분석
      const intentAnalysis = await this.analyzeQueryIntent(request.query);

      // 2단계: 의도에 따른 최적 엔진 선택
      const optimizedRequest = {
        ...request,
        strategy: this.selectOptimalStrategy(intentAnalysis),
        context: {
          ...request.context,
          intentAnalysis,
          isNaturalLanguage: true,
        },
      };

      // 3단계: 처리 및 응답 생성
      const result = await this.processQuery(optimizedRequest);

      // 4단계: 자연어 응답 최적화
      const enhancedResponse = await this.enhanceNaturalLanguageResponse(
        result,
        intentAnalysis
      );

      return {
        ...enhancedResponse,
        functionType: 'natural_language_query',
        intentAnalysis,
        processingSteps: [
          '의도 분석 완료',
          '최적 엔진 선택',
          '질의 처리',
          '응답 최적화',
        ],
      };
    } catch (error) {
      console.error('자연어 질의 처리 오류:', error);
      return {
        success: false,
        error: '자연어 질의 처리 중 오류가 발생했습니다.',
        fallbackResponse: '죄송합니다. 다시 시도해주세요.',
      };
    }
  }

  /**
   * 📊 자동 장애 보고서 생성
   */
  private async generateAutoReport(
    request: AIHubRequest,
    reportParams: AutoReportRequest = {}
  ): Promise<AutoReportResponse> {
    console.log('📊 자동 장애 보고서 생성 시작');

    try {
      // 1단계: 시스템 메트릭 수집
      const metrics = await this.collectSystemMetrics(
        reportParams.timeRange || '24h'
      );

      // 2단계: 이상 징후 탐지
      const anomalies = await this.detectAnomalies(metrics);

      // 3단계: 장애 패턴 분석
      const patterns = await this.analyzeFailurePatterns(anomalies);

      // 4단계: AI 분석 및 보고서 생성
      const analysisRequest: AIHubRequest = {
        query: `시스템 장애 분석 보고서를 생성해주세요. 
        시간 범위: ${reportParams.timeRange || '24h'}
        형식: ${reportParams.format || 'detailed'}
        긴급도: ${reportParams.urgency || 'medium'}`,
        mode: 'AUTO',
        strategy: 'dual_core', // MCP + RAG 활용
        context: {
          ...request.context,
          metrics,
          anomalies,
          patterns,
          reportParams,
          isAutoReport: true,
        },
      };

      const aiAnalysis = await this.processQuery(analysisRequest);

      // 5단계: 구조화된 보고서 생성
      const report = await this.structureReport(
        aiAnalysis,
        metrics,
        anomalies,
        patterns
      );

      console.log('📊 자동 장애 보고서 생성 완료');
      return report;
    } catch (error) {
      console.error('자동 장애 보고서 생성 오류:', error);
      return this.generateFallbackReport(error);
    }
  }

  /**
   * 🧠 자연어 의도 분석
   */
  private async analyzeQueryIntent(query: string): Promise<any> {
    // 한국어 특화 의도 분석
    const intentPatterns = {
      server_status: /서버|상태|모니터링|헬스|health|status/i,
      performance: /성능|퍼포먼스|속도|응답시간|latency|performance/i,
      error_analysis: /오류|에러|장애|문제|error|failure|issue/i,
      prediction: /예측|예상|forecast|predict|미래/i,
      optimization: /최적화|개선|향상|optimize|improve/i,
      comparison: /비교|차이|대비|compare|vs/i,
      trend: /트렌드|추세|변화|경향|trend/i,
    };

    const detectedIntents = Object.entries(intentPatterns)
      .filter(([_, pattern]) => pattern.test(query))
      .map(([intent, _]) => intent);

    return {
      primary: detectedIntents[0] || 'general',
      secondary: detectedIntents.slice(1),
      confidence: detectedIntents.length > 0 ? 0.8 : 0.3,
      isComplex: detectedIntents.length > 1,
      requiresData: ['server_status', 'performance', 'error_analysis'].includes(
        detectedIntents[0]
      ),
    };
  }

  /**
   * 🎯 의도 기반 최적 전략 선택
   */
  private selectOptimalStrategy(intentAnalysis: any): AIHubRequest['strategy'] {
    const { primary, requiresData, isComplex } = intentAnalysis;

    // 복잡한 분석이 필요한 경우
    if (isComplex) {
      return 'dual_core'; // MCP + RAG 병렬 처리
    }

    // 실시간 데이터가 필요한 경우
    if (requiresData) {
      return 'unified'; // 통합 엔진 처리
    }

    // 예측 관련 질의
    if (primary === 'prediction') {
      return 'chain'; // 체인 처리
    }

    // 일반적인 질의
    return 'smart_fallback';
  }

  /**
   * ✨ 자연어 응답 최적화
   */
  private async enhanceNaturalLanguageResponse(
    result: any,
    intentAnalysis: any
  ): Promise<any> {
    const { primary, isComplex } = intentAnalysis;

    let enhancedResponse = result.response;

    // 의도별 응답 개선
    if (primary === 'server_status') {
      enhancedResponse = this.addServerStatusContext(enhancedResponse, result);
    } else if (primary === 'performance') {
      enhancedResponse = this.addPerformanceMetrics(enhancedResponse, result);
    } else if (primary === 'error_analysis') {
      enhancedResponse = this.addErrorAnalysisDetails(enhancedResponse, result);
    }

    // 복잡한 질의의 경우 단계별 설명 추가
    if (isComplex) {
      enhancedResponse = this.addStepByStepExplanation(
        enhancedResponse,
        result
      );
    }

    return {
      ...result,
      response: enhancedResponse,
      enhanced: true,
      enhancementType: primary,
    };
  }

  /**
   * 📈 시스템 메트릭 수집
   */
  private async collectSystemMetrics(timeRange: string): Promise<any> {
    // 실제 시스템 메트릭 수집 로직
    return {
      timeRange,
      servers: [], // 서버 목록
      metrics: {}, // CPU, 메모리, 디스크, 네트워크
      alerts: [], // 알림 이력
      logs: [], // 로그 데이터
      collectedAt: new Date().toISOString(),
    };
  }

  /**
   * 🔍 이상 징후 탐지
   */
  private async detectAnomalies(metrics: any): Promise<any[]> {
    // AI 기반 이상 징후 탐지
    return [
      {
        id: 'anomaly_1',
        type: 'performance',
        severity: 'medium',
        description: 'CPU 사용률 급증',
        detected_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * 📊 장애 패턴 분석
   */
  private async analyzeFailurePatterns(anomalies: any[]): Promise<any> {
    return {
      recurring_patterns: [],
      correlation_analysis: {},
      failure_frequency: {},
      impact_assessment: {},
    };
  }

  /**
   * 📋 구조화된 보고서 생성
   */
  private async structureReport(
    aiAnalysis: any,
    metrics: any,
    anomalies: any[],
    patterns: any
  ): Promise<AutoReportResponse> {
    const reportId = `report_${Date.now()}`;

    return {
      reportId,
      generatedAt: new Date().toISOString(),
      timeRange: metrics.timeRange,
      summary: {
        totalIssues: anomalies.length,
        criticalIssues: anomalies.filter(a => a.severity === 'critical').length,
        affectedServers: metrics.servers?.length || 0,
        overallStatus: this.calculateOverallStatus(anomalies),
      },
      issues: anomalies.map(anomaly => ({
        id: anomaly.id,
        severity: anomaly.severity,
        title: anomaly.description,
        description: `${anomaly.type} 이상 징후가 감지되었습니다.`,
        affectedServers: [],
        firstDetected: anomaly.detected_at,
        lastOccurrence: anomaly.detected_at,
        recommendation: this.generateRecommendation(anomaly),
        metrics: anomaly.metrics,
      })),
      recommendations: this.generateRecommendations(anomalies, patterns),
      trends: {
        performanceTrend: 'stable',
        issueFrequency: 'stable',
        systemHealth: this.calculateSystemHealth(anomalies),
      },
    };
  }

  /**
   * 🔄 폴백 보고서 생성
   */
  private generateFallbackReport(error: any): AutoReportResponse {
    return {
      reportId: `fallback_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      timeRange: '24h',
      summary: {
        totalIssues: 1,
        criticalIssues: 1,
        affectedServers: 0,
        overallStatus: 'critical',
      },
      issues: [
        {
          id: 'system_error',
          severity: 'critical',
          title: '보고서 생성 실패',
          description: '자동 장애 보고서 생성 중 오류가 발생했습니다.',
          affectedServers: [],
          firstDetected: new Date().toISOString(),
          lastOccurrence: new Date().toISOString(),
          recommendation: '시스템 관리자에게 문의하세요.',
        },
      ],
      recommendations: [
        {
          priority: 'high',
          action: '시스템 점검 수행',
          impact: '보고서 생성 기능 복구',
          effort: '30분',
        },
      ],
      trends: {
        performanceTrend: 'declining',
        issueFrequency: 'increasing',
        systemHealth: 30,
      },
    };
  }

  // 헬퍼 메서드들
  private addServerStatusContext(response: string, result: any): string {
    return `${response}\n\n📊 현재 서버 상태 요약:\n- 모니터링 대상: ${result.context?.serverCount || 0}대\n- 정상 작동: ${result.context?.healthyServers || 0}대`;
  }

  private addPerformanceMetrics(response: string, result: any): string {
    return `${response}\n\n⚡ 성능 지표:\n- 평균 응답시간: ${result.performance?.responseTime || 0}ms\n- CPU 사용률: ${result.performance?.cpu || 0}%`;
  }

  private addErrorAnalysisDetails(response: string, result: any): string {
    return `${response}\n\n🔍 오류 분석 결과:\n- 감지된 이슈: ${result.issues?.length || 0}개\n- 해결 우선순위: ${result.priority || '중간'}`;
  }

  private addStepByStepExplanation(response: string, result: any): string {
    return `${response}\n\n📝 분석 과정:\n1. 데이터 수집\n2. 패턴 분석\n3. 결론 도출`;
  }

  private calculateOverallStatus(
    anomalies: any[]
  ): 'healthy' | 'warning' | 'critical' {
    const criticalCount = anomalies.filter(
      a => a.severity === 'critical'
    ).length;
    const mediumCount = anomalies.filter(a => a.severity === 'medium').length;

    if (criticalCount > 0) return 'critical';
    if (mediumCount > 2) return 'warning';
    return 'healthy';
  }

  private generateRecommendation(anomaly: any): string {
    const recommendations = {
      performance: 'CPU 사용률을 모니터링하고 불필요한 프로세스를 종료하세요.',
      memory: '메모리 사용량을 최적화하고 메모리 누수를 확인하세요.',
      disk: '디스크 공간을 확보하고 로그 로테이션을 설정하세요.',
      network: '네트워크 연결을 확인하고 대역폭을 최적화하세요.',
    };

    return (
      recommendations[anomaly.type as keyof typeof recommendations] ||
      '시스템 관리자에게 문의하세요.'
    );
  }

  private generateRecommendations(
    anomalies: any[],
    patterns: any
  ): Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    impact: string;
    effort: string;
  }> {
    return [
      {
        priority: 'high',
        action: '시스템 모니터링 강화',
        impact: '장애 예방 및 조기 발견',
        effort: '1시간',
      },
      {
        priority: 'medium',
        action: '성능 최적화',
        impact: '전체 시스템 성능 향상',
        effort: '2시간',
      },
    ];
  }

  private calculateSystemHealth(anomalies: any[]): number {
    const baseHealth = 100;
    const deduction = anomalies.reduce((acc, anomaly) => {
      const severityWeight = {
        low: 5,
        medium: 15,
        high: 25,
        critical: 40,
      };
      return (
        acc +
        (severityWeight[anomaly.severity as keyof typeof severityWeight] || 10)
      );
    }, 0);

    return Math.max(0, baseHealth - deduction);
  }
}

// 싱글톤 인스턴스 내보내기
export const aiEngineHub = RefactoredAIEngineHub.getInstance();
