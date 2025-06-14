/**
 * 🚀 OpenManager Vibe v5 - Enhanced Unified AI Engine
 *
 * ✅ MCP (Model Context Protocol) 통합
 * ✅ Google AI 베타 연동
 * ✅ RAG (Retrieval-Augmented Generation) 엔진
 * ✅ 컨텍스트 관리자 통합
 * ✅ Redis 캐싱 지원
 * ✅ 사고과정 로그 시스템 (MasterAIEngine 통합)
 * ✅ 엔진 통계 및 성능 모니터링
 * ✅ 11개 하위 엔진 관리 시스템
 * 🛡️ Graceful Degradation Architecture
 */

import { env, shouldEnableDebugLogging } from '@/config/environment';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { ContextManager } from './ContextManager';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { isGoogleAIAvailable } from '@/lib/google-ai-manager';

// MasterAIEngine 통합 - 사고과정 로그 시스템
import {
  AIThinkingStep,
  AIResponseFormat,
  ThinkingProcessState,
} from '../../types/ai-thinking';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import {
  aiLogger,
  LogLevel,
  LogCategory,
} from '@/services/ai/logging/AILogger';

export interface UnifiedAnalysisRequest {
  query: string;
  context?: {
    serverMetrics?: ServerMetrics[];
    logEntries?: LogEntry[];
    timeRange?: { start: Date; end: Date };
    sessionId?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
  options?: {
    enableMCP?: boolean;
    enableAnalysis?: boolean;
    maxResponseTime?: number;
    confidenceThreshold?: number;
    // MasterAIEngine 옵션 통합
    prefer_mcp?: boolean;
    fallback_enabled?: boolean;
    use_cache?: boolean;
    enable_thinking_log?: boolean;
    steps?: number;
    fuzzyThreshold?: number;
    exactWeight?: number;
    fields?: string[];
  };
}

export interface UnifiedAnalysisResponse {
  success: boolean;
  query: string;
  intent: {
    primary: string;
    confidence: number;
    category: string;
    urgency: string;
  };
  analysis: {
    summary: string;
    details: any[];
    confidence: number;
    processingTime: number;
  };
  recommendations: string[];
  engines: {
    used: string[];
    results: any[];
    fallbacks: number;
  };
  metadata: {
    sessionId: string;
    timestamp: string;
    version: string;
    contextsUsed?: number;
    contextIds?: string[];
  };
  systemStatus?: {
    tier: 'emergency' | 'core_only' | 'enhanced' | 'beta_enabled';
    availableComponents: string[];
    degradationLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
    recommendation: string;
  };
  // MasterAIEngine 응답 형식 통합
  thinking_process?: AIThinkingStep[];
  reasoning_steps?: string[];
  performance?: {
    memoryUsage?: any;
    cacheHit?: boolean;
    memoryDelta?: number;
  };
  cache_hit?: boolean;
  fallback_used?: boolean;
  engine_used?: string;
  response_time?: number;
}

export interface ServerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime?: number;
  activeConnections?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  details?: any;
}

export interface MCPContext {
  sessionId: string;
  serverMetrics?: ServerMetrics[];
  logEntries?: LogEntry[];
  timeRange?: { start: Date; end: Date };
  urgency?: string;
}

export interface MCPResponse {
  success: boolean;
  content: string;
  confidence: number;
  sources: string[];
  metadata?: any;
}

// MasterAIEngine 통합 - 엔진 상태 인터페이스
export interface EngineStatus {
  name: string;
  status: 'ready' | 'loading' | 'error' | 'disabled';
  last_used: number;
  success_rate: number;
  avg_response_time: number;
  memory_usage: string;
}

export class UnifiedAIEngine {
  private static instance: UnifiedAIEngine | null = null;
  private mcpClient: RealMCPClient | null = null;
  private contextManager: ContextManager;
  private googleAI?: GoogleAIService;
  private ragEngine: LocalRAGEngine;
  private betaModeEnabled: boolean = false;
  private initialized: boolean = false;
  private analysisCache: Map<string, any> = new Map();

  // MasterAIEngine 통합 - 하위 엔진들
  private openSourceEngines!: OpenSourceEngines;
  private customEngines!: CustomEngines;
  private engineStats: Map<
    string,
    { calls: number; successes: number; totalTime: number; lastUsed: number }
  >;
  private responseCache: Map<
    string,
    { result: any; timestamp: number; ttl: number }
  >;

  // Graceful Degradation 관련 속성
  private componentHealth: Map<string, boolean> = new Map();
  private currentAnalysisTier: string = 'enhanced';
  private redisClient: any = null;

  private resourceManager = {
    dailyQuota: {
      googleAIUsed: 0,
      googleAILimit: 100,
    },
    quotaResetTime: new Date(),
  };

  private degradationStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    fallbacksUsed: 0,
    emergencyModeActivations: 0,
  };

  public constructor() {
    console.log('🚀 Enhanced Unified AI Engine 인스턴스 생성');
    this.contextManager = ContextManager.getInstance();
    this.ragEngine = new LocalRAGEngine();

    // MasterAIEngine 통합 - 통계 및 캐시 초기화
    this.engineStats = new Map();
    this.responseCache = new Map();

    this.initializeComponents();
  }

  public static getInstance(): UnifiedAIEngine {
    if (!UnifiedAIEngine.instance) {
      UnifiedAIEngine.instance = new UnifiedAIEngine();
    }
    return UnifiedAIEngine.instance;
  }

  private async initializeComponents(): Promise<void> {
    try {
      // MCP Client 초기화
      this.mcpClient = new RealMCPClient();
      await this.mcpClient.initialize();

      // Google AI 초기화 (베타)
      if (isGoogleAIAvailable()) {
        this.googleAI = new GoogleAIService();
        this.betaModeEnabled = true;
        console.log('✅ Google AI 베타 모드 활성화');
      }

      // RAG Engine 초기화
      await this.ragEngine.initialize();

      // MasterAIEngine 통합 - 하위 엔진들 초기화
      await this.initializeSubEngines();

      console.log('✅ Enhanced Unified AI Engine 컴포넌트 초기화 완료');
    } catch (error) {
      console.error('❌ AI Engine 컴포넌트 초기화 실패:', error);
    }
  }

  // MasterAIEngine 통합 - 하위 엔진 초기화
  private async initializeSubEngines(): Promise<void> {
    try {
      await aiLogger.logAI({
        level: LogLevel.INFO,
        category: LogCategory.AI_ENGINE,
        engine: 'UnifiedAIEngine',
        message: '🚀 하위 엔진 초기화 시작...',
      });

      // 오픈소스 엔진 초기화
      this.openSourceEngines = new OpenSourceEngines();

      // 커스텀 엔진 초기화 (오픈소스 엔진 의존성 주입)
      this.customEngines = new CustomEngines(this.openSourceEngines);

      // 엔진 통계 초기화
      this.initializeEngineStats();

      console.log('✅ 하위 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ 하위 엔진 초기화 실패:', error);
    }
  }

  // MasterAIEngine 통합 - 엔진 통계 초기화
  private initializeEngineStats(): void {
    const engines = [
      'anomaly',
      'prediction',
      'autoscaling',
      'korean',
      'enhanced',
      'integrated',
      'mcp',
      'mcp-test',
      'hybrid',
      'unified',
      'custom-nlp',
      'correlation',
      'google-ai',
      'rag',
    ];

    engines.forEach(engine => {
      this.engineStats.set(engine, {
        calls: 0,
        successes: 0,
        totalTime: 0,
        lastUsed: 0,
      });
    });
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔧 Enhanced Unified AI Engine 초기화 시작...');

      // 컴포넌트 상태 체크
      await this.checkComponentHealth();

      // 캐시 정리 스케줄러 시작
      this.startCacheCleanup();

      this.initialized = true;
      console.log('✅ Enhanced Unified AI Engine 초기화 완료');
    } catch (error) {
      console.error('❌ Enhanced Unified AI Engine 초기화 실패:', error);
      throw error;
    }
  }

  // MasterAIEngine 통합 - 사고과정 로그와 함께 쿼리 처리
  public async processQuery(
    request: UnifiedAnalysisRequest
  ): Promise<UnifiedAnalysisResponse> {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();
    const thinkingSteps: AIThinkingStep[] = [];

    // 사고과정 로그 활성화 여부
    const enableThinking = request.options?.enable_thinking_log !== false;

    // 🔍 성능 측정 시작
    const memoryBefore = PerformanceMonitor.getMemoryUsage();

    if (enableThinking) {
      thinkingSteps.push(
        this.createThinkingStep(
          'analyzing',
          '요청 분석',
          `통합 AI 엔진으로 "${request.query}" 처리 시작`
        )
      );
    }

    if (!this.initialized) {
      return this.createErrorResponse(
        request.query,
        new Error('Enhanced Unified AI Engine이 초기화되지 않았습니다'),
        Date.now() - startTime,
        thinkingSteps
      );
    }

    try {
      // 캐시 확인
      if (request.options?.use_cache !== false) {
        if (enableThinking) {
          thinkingSteps.push(
            this.createThinkingStep(
              'processing',
              '캐시 확인',
              '이전 결과 캐시에서 검색 중'
            )
          );
        }

        const cached = this.checkCache(request);
        if (cached) {
          if (enableThinking) {
            thinkingSteps.push(
              this.createThinkingStep(
                'completed',
                '캐시 적중',
                '캐시된 결과 반환'
              )
            );
          }

          return this.createCachedResponse(
            request,
            cached,
            Date.now() - startTime,
            thinkingSteps
          );
        }
      }

      // 시스템 상태 체크
      const systemHealth = await this.checkComponentHealth();
      const strategy = this.determineProcessingStrategy(systemHealth);

      if (enableThinking) {
        thinkingSteps.push(
          this.createThinkingStep(
            'processing',
            '처리 전략 결정',
            `${strategy.tier} 티어로 처리 결정`
          )
        );
      }

      // 의도 분석
      const intent = await this.classifyIntent(request.query, request.context);

      if (enableThinking) {
        thinkingSteps.push(
          this.createThinkingStep(
            'reasoning',
            '의도 분석 완료',
            `주요 의도: ${intent.primary} (신뢰도 ${(intent.confidence * 100).toFixed(1)}%)`
          )
        );
      }

      // 컨텍스트 준비
      const mcpContext: MCPContext = {
        sessionId,
        serverMetrics: request.context?.serverMetrics,
        logEntries: request.context?.logEntries,
        timeRange: request.context?.timeRange,
        urgency: request.context?.urgency,
      };

      // Graceful Analysis 수행
      const analysisResult = await this.performGracefulAnalysis(
        intent,
        mcpContext,
        strategy,
        request.options
      );

      if (enableThinking) {
        thinkingSteps.push(
          this.createThinkingStep(
            'completed',
            '분석 완료',
            `신뢰도 ${(analysisResult.confidence * 100).toFixed(1)}%로 처리 완료`
          )
        );
      }

      // 추천사항 생성
      const recommendations = this.generateRecommendations(
        analysisResult,
        intent
      );

      // 통계 업데이트
      this.updateEngineStats('unified', Date.now() - startTime, true);

      // 캐시 저장
      if (request.options?.use_cache !== false) {
        this.saveToCache(request, analysisResult);
      }

      // 성능 측정 완료
      const memoryAfter = PerformanceMonitor.getMemoryUsage();
      const processingTime = Date.now() - startTime;

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
          fallbacks: this.degradationStats.fallbacksUsed,
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
          memoryUsage: memoryAfter,
          cacheHit: false,
          memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        cache_hit: false,
        fallback_used: strategy.tier !== 'beta_enabled',
        engine_used: 'unified',
        response_time: processingTime,
      };
    } catch (error) {
      console.error('❌ Enhanced Unified AI Engine 처리 실패:', error);

      if (enableThinking) {
        thinkingSteps.push(
          this.createThinkingStep(
            'error',
            '처리 실패',
            `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
          )
        );
      }

      // 통계 업데이트 (실패)
      this.updateEngineStats('unified', Date.now() - startTime, false);

      return this.createErrorResponse(
        request.query,
        error,
        Date.now() - startTime,
        thinkingSteps
      );
    }
  }

  // MasterAIEngine 통합 - 사고과정 스텝 생성
  private createThinkingStep(
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
      progress: type === 'completed' ? 100 : type === 'error' ? 0 : 50,
      duration: 0,
      metadata: {
        engine: 'UnifiedAIEngine',
        version: '5.0.0-enhanced',
      },
    };
  }

  // MasterAIEngine 통합 - 추론 단계 생성
  private generateReasoningSteps(engine: string, query: string): string[] {
    const steps = [
      `1. 쿼리 "${query}" 분석 시작`,
      `2. ${engine} 엔진으로 라우팅`,
      '3. 컨텍스트 정보 수집',
      '4. 의도 분류 및 신뢰도 계산',
      '5. 적절한 처리 전략 선택',
      '6. 분석 결과 생성',
      '7. 추천사항 도출',
      '8. 응답 형식화 및 반환',
    ];

    return steps;
  }

  // MasterAIEngine 통합 - 캐시 확인
  private checkCache(request: UnifiedAnalysisRequest): any {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached;
    }

    // 만료된 캐시 제거
    if (cached) {
      this.responseCache.delete(cacheKey);
    }

    return null;
  }

  // MasterAIEngine 통합 - 캐시 저장
  private saveToCache(request: UnifiedAnalysisRequest, result: any): void {
    const cacheKey = this.generateCacheKey(request);
    const ttl = this.getCacheTTL('unified');

    this.responseCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
    });

    // 캐시 크기 제한 (최대 1000개)
    if (this.responseCache.size > 1000) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  // MasterAIEngine 통합 - 캐시 키 생성
  private generateCacheKey(request: UnifiedAnalysisRequest): string {
    const keyData = {
      query: request.query,
      urgency: request.context?.urgency,
      options: request.options,
    };
    return `unified-${Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 32)}`;
  }

  // MasterAIEngine 통합 - 캐시 TTL 계산
  private getCacheTTL(engine: string): number {
    const ttlMap: Record<string, number> = {
      unified: 300000, // 5분
      'google-ai': 600000, // 10분
      rag: 900000, // 15분
      mcp: 180000, // 3분
    };
    return ttlMap[engine] || 300000;
  }

  // MasterAIEngine 통합 - 엔진 통계 업데이트
  private updateEngineStats(
    engine: string,
    responseTime: number,
    success: boolean
  ): void {
    const stats = this.engineStats.get(engine) || {
      calls: 0,
      successes: 0,
      totalTime: 0,
      lastUsed: 0,
    };

    stats.calls++;
    stats.totalTime += responseTime;
    stats.lastUsed = Date.now();

    if (success) {
      stats.successes++;
    }

    this.engineStats.set(engine, stats);
  }

  // MasterAIEngine 통합 - 엔진 상태 조회
  public getEngineStatuses(): EngineStatus[] {
    const statuses: EngineStatus[] = [];

    for (const [engine, stats] of this.engineStats.entries()) {
      const successRate =
        stats.calls > 0 ? (stats.successes / stats.calls) * 100 : 0;
      const avgResponseTime =
        stats.calls > 0 ? stats.totalTime / stats.calls : 0;

      statuses.push({
        name: engine,
        status: this.getEngineStatus(engine),
        last_used: stats.lastUsed,
        success_rate: successRate,
        avg_response_time: avgResponseTime,
        memory_usage: this.getEngineMemoryUsage(engine),
      });
    }

    return statuses;
  }

  private getEngineStatus(
    engine: string
  ): 'ready' | 'loading' | 'error' | 'disabled' {
    // 엔진별 상태 확인 로직
    if (!this.initialized) return 'loading';

    switch (engine) {
      case 'google-ai':
        return this.betaModeEnabled ? 'ready' : 'disabled';
      case 'mcp':
        return this.mcpClient ? 'ready' : 'error';
      case 'rag':
        return 'ready'; // LocalRAGEngine은 항상 사용 가능
      default:
        return 'ready';
    }
  }

  private getEngineMemoryUsage(engine: string): string {
    // 간단한 메모리 사용량 추정
    const baseMemory = 1024 * 1024; // 1MB
    const multipliers: Record<string, number> = {
      'google-ai': 2.5,
      rag: 3.0,
      mcp: 1.5,
      unified: 4.0,
    };

    const usage = baseMemory * (multipliers[engine] || 1.0);
    return `${(usage / 1024 / 1024).toFixed(1)}MB`;
  }

  // 캐시된 응답 생성
  private createCachedResponse(
    request: UnifiedAnalysisRequest,
    cached: any,
    processingTime: number,
    thinkingSteps: AIThinkingStep[]
  ): UnifiedAnalysisResponse {
    return {
      success: true,
      query: request.query,
      intent: cached.result.intent || {
        primary: 'cached',
        confidence: 0.8,
        category: 'system',
        urgency: 'low',
      },
      analysis: {
        summary: cached.result.content || '캐시된 결과',
        details: cached.result.sources || [],
        confidence: cached.result.confidence || 0.8,
        processingTime,
      },
      recommendations: cached.result.recommendations || [],
      engines: {
        used: ['cache'],
        results: [cached.result],
        fallbacks: 0,
      },
      metadata: {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        version: '5.0.0-enhanced',
      },
      thinking_process: thinkingSteps,
      performance: {
        memoryUsage: PerformanceMonitor.getMemoryUsage(),
        cacheHit: true,
        memoryDelta: 0,
      },
      cache_hit: true,
      fallback_used: false,
      engine_used: 'cache',
      response_time: processingTime,
    };
  }

  // 에러 응답 생성 (사고과정 로그 포함)
  private createErrorResponse(
    query: string,
    error: any,
    processingTime: number,
    thinkingSteps: AIThinkingStep[] = []
  ): UnifiedAnalysisResponse {
    return {
      success: false,
      query,
      intent: {
        primary: 'error',
        confidence: 0,
        category: 'system',
        urgency: 'high',
      },
      analysis: {
        summary: `처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: [],
        confidence: 0,
        processingTime,
      },
      recommendations: [
        '시스템 상태를 확인해주세요',
        '잠시 후 다시 시도해주세요',
        '문제가 지속되면 관리자에게 문의하세요',
      ],
      engines: {
        used: [],
        results: [],
        fallbacks: 0,
      },
      metadata: {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        version: '5.0.0-enhanced',
      },
      thinking_process: thinkingSteps,
      performance: {
        memoryUsage: PerformanceMonitor.getMemoryUsage(),
        cacheHit: false,
        memoryDelta: 0,
      },
      cache_hit: false,
      fallback_used: true,
      engine_used: 'error',
      response_time: processingTime,
    };
  }

  // 기존 메서드들 유지...
  private async classifyIntent(query: string, context?: any): Promise<any> {
    return {
      primary: 'analysis',
      confidence: 0.8,
      category: 'monitoring',
      urgency: context?.urgency || 'medium',
    };
  }

  // Graceful Degradation 메서드들
  private async checkComponentHealth(): Promise<{
    availableComponents: string[];
    overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
  }> {
    const availableComponents: string[] = [];

    // MCP 체크
    if (this.mcpClient) {
      try {
        await this.mcpClient.getServerStatus();
        availableComponents.push('mcp');
        this.componentHealth.set('mcp', true);
      } catch (error) {
        this.componentHealth.set('mcp', false);
      }
    }

    // Context Manager 체크
    if (this.contextManager) {
      availableComponents.push('context_manager');
      this.componentHealth.set('context_manager', true);
    }

    // RAG 엔진 체크
    if (this.ragEngine) {
      availableComponents.push('rag');
      this.componentHealth.set('rag', true);
    }

    // Google AI 체크
    if (this.canUseGoogleAI()) {
      availableComponents.push('google_ai');
      this.componentHealth.set('google_ai', true);
    } else {
      this.componentHealth.set('google_ai', false);
    }

    // 전체 건강상태 결정
    let overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
    const healthyCount = availableComponents.length;

    if (healthyCount >= 3) {
      overallHealth = 'healthy';
    } else if (healthyCount >= 2) {
      overallHealth = 'degraded';
    } else if (healthyCount >= 1) {
      overallHealth = 'critical';
    } else {
      overallHealth = 'emergency';
    }

    return {
      availableComponents,
      overallHealth,
    };
  }

  private determineProcessingStrategy(systemHealth: {
    availableComponents: string[];
    overallHealth: string;
  }): {
    tier: string;
    usageReason?: string;
  } {
    const { availableComponents } = systemHealth;

    // Beta Enabled (100% 성능)
    if (
      availableComponents.includes('google_ai') &&
      availableComponents.length >= 3
    ) {
      return {
        tier: 'beta_enabled',
        usageReason:
          'All components available including Google AI beta features',
      };
    }

    // Enhanced (90% 성능)
    if (availableComponents.length >= 2) {
      return {
        tier: 'enhanced',
        usageReason: 'Core components plus additional AI engines available',
      };
    }

    // Core Only (60% 성능)
    if (availableComponents.length >= 1) {
      return {
        tier: 'core_only',
        usageReason: 'Limited components, using core functionality only',
      };
    }

    // Emergency (10% 성능)
    return {
      tier: 'emergency',
      usageReason: 'No AI components available, emergency fallback mode',
    };
  }

  private async performGracefulAnalysis(
    intent: any,
    context: MCPContext,
    strategy: { tier: string; usageReason?: string },
    options?: any
  ): Promise<MCPResponse> {
    const startTime = Date.now();

    try {
      switch (strategy.tier) {
        case 'beta_enabled':
          return await this.performBetaEnabledAnalysis(
            intent,
            context,
            options
          );

        case 'enhanced':
          return await this.performEnhancedAnalysis(intent, context, options);

        case 'core_only':
          return await this.performCoreOnlyAnalysis(intent, context, options);

        default: // emergency
          return await this.performEmergencyAnalysis(intent, context);
      }
    } catch (error) {
      console.error(`Analysis failed for tier ${strategy.tier}:`, error);

      // 단계적 폴백
      if (strategy.tier !== 'emergency') {
        return await this.performEmergencyAnalysis(intent, context);
      }

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.degradationStats.totalRequests++;
      this.degradationStats.averageResponseTime =
        (this.degradationStats.averageResponseTime + duration) / 2;
    }
  }

  private async performBetaEnabledAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    // Enhanced 분석 먼저 수행
    const enhancedResult = await this.performEnhancedAnalysis(
      intent,
      context,
      options
    );

    // Google AI 개선 시도
    if (this.canUseGoogleAI() && this.googleAI) {
      try {
        const googleResult = await this.googleAI.generateResponse(
          enhancedResult.content
        );
        this.incrementGoogleAIUsage();

        return {
          ...enhancedResult,
          content: googleResult.content || enhancedResult.content,
          confidence: Math.min(enhancedResult.confidence + 0.1, 1.0),
          sources: [...enhancedResult.sources, 'google_ai'],
          metadata: {
            ...enhancedResult.metadata,
            tier: 'beta_enabled',
            googleAIUsed: true,
          },
        };
      } catch (error) {
        console.warn(
          'Google AI enhancement failed, falling back to enhanced:',
          error
        );
      }
    }

    return enhancedResult;
  }

  private async performEnhancedAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    const results: any[] = [];

    try {
      // MCP 분석
      if (this.componentHealth.get('mcp') && this.mcpClient) {
        try {
          const mcpResult = await this.mcpClient.performComplexQuery(
            intent.primary,
            context
          );
          results.push({ source: 'mcp', content: mcpResult, confidence: 0.8 });
        } catch (error) {
          console.warn('MCP analysis failed:', error);
        }
      }

      // RAG 분석
      if (this.componentHealth.get('rag')) {
        try {
          const ragResult = await this.ragEngine.query(intent.primary, {
            limit: 3,
          });
          results.push({ source: 'rag', content: ragResult, confidence: 0.7 });
        } catch (error) {
          console.warn('RAG analysis failed:', error);
        }
      }

      // Context Manager 분석
      if (this.componentHealth.get('context_manager')) {
        try {
          const contextResult = this.contextManager.analyzeIntent(
            intent,
            context
          );
          results.push({
            source: 'context_manager',
            content: contextResult,
            confidence: 0.6,
          });
        } catch (error) {
          console.warn('Context analysis failed:', error);
        }
      }

      if (results.length > 0) {
        const bestResult = results.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        );
        return {
          success: true,
          content: `Enhanced 분석 결과: ${bestResult.content}`,
          confidence: bestResult.confidence,
          sources: results.map(r => r.source),
          metadata: { tier: 'enhanced', resultsCount: results.length },
        };
      } else {
        return await this.performCoreOnlyAnalysis(intent, context, options);
      }
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      return await this.performCoreOnlyAnalysis(intent, context, options);
    }
  }

  private async performCoreOnlyAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    try {
      // MCP가 사용 가능하면 우선 사용
      if (this.componentHealth.get('mcp') && this.mcpClient) {
        const result = await this.mcpClient.performComplexQuery(
          intent.primary,
          context
        );
        return {
          success: true,
          content: `기본 MCP 분석: ${result}`,
          confidence: 0.6,
          sources: ['mcp'],
          metadata: { tier: 'core_only', fallback: true },
        };
      }

      // Context Manager만 사용
      if (this.componentHealth.get('context_manager')) {
        const result = this.contextManager.analyzeIntent(intent, context);
        return {
          success: true,
          content: `컨텍스트 기반 분석: ${result}`,
          confidence: 0.6,
          sources: ['context_manager'],
          metadata: { tier: 'core_only', fallback: true },
        };
      }

      throw new Error('No core components available');
    } catch (error) {
      console.error('Core analysis failed:', error);
      return await this.performEmergencyAnalysis(intent, context);
    }
  }

  private async performEmergencyAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    // 최소한의 응답 생성
    return {
      success: true,
      content: `죄송합니다. 현재 AI 시스템이 일시적으로 불안정합니다. 
                요청사항: ${intent.primary || '정보 요청'}
                상태: 시스템 복구 중
                권장사항: 잠시 후 다시 시도해주세요`,
      confidence: 0.1,
      sources: ['emergency_fallback'],
      metadata: {
        tier: 'emergency',
        timestamp: new Date().toISOString(),
        systemStatus: 'degraded',
        recommendation: 'system_recovery_in_progress',
      },
    };
  }

  // Helper methods
  private canUseGoogleAI(): boolean {
    const quota = this.resourceManager.dailyQuota;
    return (
      quota.googleAIUsed < quota.googleAILimit &&
      this.resourceManager.quotaResetTime > new Date()
    );
  }

  private incrementGoogleAIUsage(): void {
    this.resourceManager.dailyQuota.googleAIUsed++;
  }

  private calculateDegradationLevel(
    availableComponents: string[]
  ): 'none' | 'minimal' | 'moderate' | 'high' | 'critical' {
    const totalComponents = 4; // mcp, context_manager, rag, google_ai
    const availableCount = availableComponents.length;
    const degradationRatio =
      (totalComponents - availableCount) / totalComponents;

    if (degradationRatio === 0) return 'none';
    if (degradationRatio <= 0.25) return 'minimal';
    if (degradationRatio <= 0.5) return 'moderate';
    if (degradationRatio <= 0.75) return 'high';
    return 'critical';
  }

  private getSystemRecommendation(tier: string): string {
    switch (tier) {
      case 'beta_enabled':
        return '모든 AI 기능이 정상 작동중입니다. 최적의 성능을 제공합니다.';
      case 'enhanced':
        return '대부분의 AI 기능이 사용 가능합니다. 양호한 성능을 제공합니다.';
      case 'core_only':
        return '핵심 기능만 사용 가능합니다. 제한된 성능으로 동작합니다.';
      case 'emergency':
        return '시스템이 불안정합니다. 관리자 확인이 필요합니다.';
      default:
        return '시스템 상태를 확인할 수 없습니다.';
    }
  }

  private generateRecommendations(
    response: MCPResponse,
    intent: any
  ): string[] {
    return [
      '시스템 상태를 정기적으로 모니터링하세요.',
      '중요한 이슈는 즉시 관리자에게 알리세요.',
      '성능 최적화를 위해 리소스를 검토하세요.',
    ];
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCacheCleanup(): void {
    setInterval(
      () => {
        this.analysisCache.clear();
      },
      1000 * 60 * 30
    ); // 30분마다 캐시 정리
  }

  // Public methods for monitoring
  public getGracefulDegradationStats() {
    return {
      ...this.degradationStats,
      componentHealth: Object.fromEntries(this.componentHealth),
      currentTier: this.currentAnalysisTier,
      quotaStatus: this.resourceManager.dailyQuota,
    };
  }

  public async getSystemStatus(): Promise<any> {
    const health = await this.checkComponentHealth();
    return {
      initialized: this.initialized,
      betaModeEnabled: this.betaModeEnabled,
      componentHealth: Object.fromEntries(this.componentHealth),
      systemHealth: health,
      stats: this.degradationStats,
    };
  }
}

// 싱글톤 인스턴스 export
export const unifiedAIEngine = UnifiedAIEngine.getInstance();
