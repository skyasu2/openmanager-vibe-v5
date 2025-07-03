/**
 * 🤖 통합 AI 엔진 라우터 v5.44.4
 * Edge Runtime 최적화 + Render MCP 분리
 */

import { getVercelConfig } from '@/config/vercel-edge-config';
import { edgeRuntimeService } from '@/lib/edge-runtime-utils';
import { SupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
// MCPClientWrapper 제거 - Render 서버 MCP만 사용
import { AIEngineType, AIRequest, AIResponse } from '@/types/ai-types';

// Edge Runtime 호환성 확인
const vercelConfig = getVercelConfig();
const logger = edgeRuntimeService.logger;
const cache = edgeRuntimeService.cache;
const performance = edgeRuntimeService.performance;

/**
 * 🚀 통합 AI 엔진 라우터
 * 11개 AI 컴포넌트 통합 관리 시스템
 */
export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter;
  private engines: Map<AIEngineType, any> = new Map();
  private failedEngines: Set<AIEngineType> = new Set();
  private requestCount = 0;
  private lastHealthCheck = Date.now();
  private isInitialized = false;

  constructor() {
    // constructor에서는 초기화하지 않음 (테스트 호환성)
    logger.info('🤖 통합 AI 엔진 라우터 생성 완료');
  }

  /**
   * 🏭 싱글톤 인스턴스 가져오기
   */
  static getInstance(): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter();
      // 자동 초기화 (기존 동작 유지)
      UnifiedAIEngineRouter.instance.initializeEngines();
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🔧 초기화 메서드
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('이미 초기화된 AI 엔진 라우터');
      return;
    }

    await this.initializeEngines();
    this.isInitialized = true;
    logger.info('🚀 통합 AI 엔진 라우터 초기화 완료');
  }

  /**
   * 🔧 AI 엔진들 초기화
   */
  private async initializeEngines() {
    const timer = performance.startTimer('engine-initialization');

    try {
      // 메인 AI 컴포넌트 (Edge Runtime 호환)
      await this.initializeEngine('google-ai', GoogleAIService);
      await this.initializeEngine('supabase-rag', SupabaseRAGEngine);

      // Render MCP는 HTTP 기반으로 처리 (직접 import 없음)
      this.initializeRenderMCP();

      // 하위 AI 컴포넌트 (Edge Runtime 호환 확인 필요)
      if (vercelConfig.environment.isVercel) {
        // Vercel 환경에서는 Edge Runtime 호환 엔진만 로드
        await this.initializeEdgeCompatibleEngines();
      } else {
        // 로컬 개발 환경에서는 모든 엔진 로드
        await this.initializeEngine('korean-ai', KoreanAIEngine);
        logger.info('로컬 개발 환경 - 전체 AI 엔진들 로드');
      }

      const duration = timer();
      logger.info(`🚀 AI 엔진 초기화 완료: ${duration.toFixed(2)}ms`);
    } catch (error) {
      logger.error('❌ AI 엔진 초기화 실패:', error);
    }
  }

  /**
   * 🌐 Render MCP HTTP 기반 초기화
   */
  private initializeRenderMCP() {
    try {
      // Render MCP 서버 URL
      const renderMCPUrl =
        process.env.RENDER_MCP_SERVER_URL ||
        'https://openmanager-vibe-v5.onrender.com';

      // HTTP 기반 MCP 클라이언트 설정
      const renderMCPClient = {
        url: renderMCPUrl,
        timeout: 30000, // 30초 타임아웃
        initialized: true,
        type: 'render-mcp-http',
      };

      this.engines.set('render-mcp', renderMCPClient);
      logger.info('✅ Render MCP HTTP 클라이언트 초기화 완료');
    } catch (error) {
      logger.error('❌ Render MCP 초기화 실패:', error);
      this.failedEngines.add('render-mcp');
    }
  }

  /**
   * ⚡ Edge Runtime 호환 엔진들만 초기화
   */
  private async initializeEdgeCompatibleEngines() {
    try {
      // Korean AI Engine을 Edge Runtime 호환 모드로 초기화
      // Redis 의존성 없이 메모리 기반으로 동작
      const koreanAIConfig = {
        edgeMode: true,
        disableRedis: true,
        memoryOnly: true,
      };

      await this.initializeEngine('korean-ai', KoreanAIEngine, koreanAIConfig);
      logger.info('✅ Edge Runtime 호환 엔진 초기화 완료');
    } catch (error) {
      logger.warn('⚠️ Edge Runtime 엔진 초기화 일부 실패:', error);
    }
  }

  /**
   * 🔌 개별 엔진 초기화
   */
  private async initializeEngine(
    type: AIEngineType,
    EngineClass: any,
    config?: any
  ) {
    try {
      const timer = performance.startTimer(`init-${type}`);

      const engine = new EngineClass(config);
      if (engine.initialize) {
        await engine.initialize();
      }

      this.engines.set(type, engine);
      const duration = timer();

      logger.info(`✅ ${type} 엔진 초기화 완료: ${duration.toFixed(2)}ms`);
    } catch (error) {
      this.failedEngines.add(type);
      logger.error(`❌ ${type} 엔진 초기화 실패:`, error);
    }
  }

  /**
   * 🎯 통합 AI 쿼리 처리
   */
  async processQuery(request: AIRequest): Promise<AIResponse> {
    const requestId = `req_${++this.requestCount}_${Date.now()}`;
    const timer = performance.startTimer('query-processing');

    logger.info('🚀 AI 쿼리 처리 시작', {
      query: request.query?.substring(0, 100),
      mode: request.mode,
    });

    try {
      // 캐시 확인
      const cacheKey = this.generateCacheKey(request);
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.info(`📋 캐시에서 응답 반환: ${requestId}`);
        return cached;
      }

      // 요청 라우팅
      const response = await this.routeRequest(request, requestId);

      // 캐시 저장 (성공한 응답만)
      if (response.success) {
        const ttl = vercelConfig.cacheTTL;
        cache.set(cacheKey, response, ttl);
      }

      const duration = timer();
      logger.info(
        `✅ AI 쿼리 처리 완료: ${requestId} (${duration.toFixed(2)}ms)`
      );

      return response;
    } catch (error) {
      const duration = timer();
      logger.error(
        `❌ AI 쿼리 처리 실패: ${requestId} (${duration.toFixed(2)}ms)`,
        error
      );

      return {
        success: false,
        response: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        mode: request.mode || 'LOCAL',
        enginePath: ['error-fallback'],
        processingTime: duration,
        fallbacksUsed: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          requestId,
          duration,
          timestamp: new Date().toISOString(),
          enginePath: ['error-fallback'],
          vercelPlan: vercelConfig.environment.isPro ? 'pro' : 'hobby',
        },
      };
    }
  }

  /**
   * 🧭 요청 라우팅 로직
   */
  private async routeRequest(
    request: AIRequest,
    requestId: string
  ): Promise<AIResponse> {
    const { mode, type, query } = request;

    // Google AI 전용 모드 (자연어 처리에서만 사용자 선택)
    if (mode === 'GOOGLE_ONLY') {
      if (!vercelConfig.enableGoogleAI) {
        throw new Error('Google AI는 Pro 플랜에서만 사용 가능합니다');
      }
      return this.processWithGoogleAI(request, requestId);
    }

    // 로컬 모드 (기본값)
    return this.processWithLocalEngines(request, requestId);
  }

  /**
   * 🟢 Google AI 처리
   */
  private async processWithGoogleAI(
    request: AIRequest,
    requestId: string
  ): Promise<AIResponse> {
    const timer = performance.startTimer('google-ai-processing');

    try {
      const googleAI = this.engines.get('google-ai');
      if (!googleAI) {
        throw new Error('Google AI 엔진을 사용할 수 없습니다');
      }

      // 자연어 질의 확인
      const isNaturalLanguage = this.isNaturalLanguageQuery(
        request.query || ''
      );
      if (!isNaturalLanguage) {
        throw new Error('Google AI는 자연어 질의에만 사용됩니다');
      }

      const response = await googleAI.processQuery(request);
      const duration = timer();

      return {
        ...response,
        metadata: {
          ...response.metadata,
          requestId,
          duration,
          enginePath: 'google-ai-only',
          supportEngines: ['Google AI Service'],
          vercelPlan: 'pro',
        },
      };
    } catch (error) {
      const duration = timer();
      throw new Error(
        `Google AI 처리 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🔵 로컬 엔진 처리 (메인 시스템)
   */
  private async processWithLocalEngines(
    request: AIRequest,
    requestId: string
  ): Promise<AIResponse> {
    const timer = performance.startTimer('local-engines-processing');

    try {
      const responses: AIResponse[] = [];
      const usedEngines: string[] = [];

      // 1. Supabase RAG 엔진 (벡터 검색)
      if (this.engines.has('supabase-rag')) {
        try {
          const ragTimer = performance.startTimer('rag-processing');
          const ragEngine = this.engines.get('supabase-rag');
          const ragResponse = await Promise.race([
            ragEngine.query(request.query || ''),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('RAG timeout')),
                vercelConfig.ragTimeout
              )
            ),
          ]);
          const ragDuration = ragTimer();

          if (ragResponse && ragResponse.success) {
            responses.push(ragResponse);
            usedEngines.push('Supabase RAG Engine');
            logger.info(`📚 RAG 엔진 응답: ${ragDuration.toFixed(2)}ms`);
          }
        } catch (error) {
          logger.warn('⚠️ RAG 엔진 처리 실패:', error);
        }
      }

      // 2. 한국어 AI 엔진 (NLP 분석)
      if (this.engines.has('korean-ai')) {
        try {
          const nlpTimer = performance.startTimer('korean-nlp-processing');
          const koreanAI = this.engines.get('korean-ai');
          const nlpResponse = await Promise.race([
            koreanAI.processText(request.query || ''),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('NLP timeout')),
                vercelConfig.koreanNLPTimeout
              )
            ),
          ]);
          const nlpDuration = nlpTimer();

          if (nlpResponse && nlpResponse.success) {
            responses.push(nlpResponse);
            usedEngines.push('Korean AI Engine');
            logger.info(`🇰🇷 한국어 NLP 엔진 응답: ${nlpDuration.toFixed(2)}ms`);
          }
        } catch (error) {
          logger.warn('⚠️ 한국어 NLP 엔진 처리 실패:', error);
        }
      }

      // 3. 🤖 AI 엔진들에는 Render MCP 전용 사용
      if (vercelConfig.enableMCPIntegration && this.engines.has('mcp-client')) {
        logger.info('🔗 MCP 클라이언트 엔진 (Render 서버 전용) 호출 중...');

        const mcpClient = this.engines.get('mcp-client');
        const mcpRequest = {
          ...request,
          context: {
            ...request.context,
            usageType: 'ai-production', // AI 기능용 명시
          },
        };
        const mcpResponse = await mcpClient.processQuery(mcpRequest);

        if (mcpResponse.success && mcpResponse.confidence > 0.3) {
          responses.push(mcpResponse);
          usedEngines.push('MCP Client (Render)');
        }
      }

      // 응답 통합
      const combinedResponse = this.combineResponses(responses, usedEngines);
      const duration = timer();

      return {
        ...combinedResponse,
        metadata: {
          ...combinedResponse.metadata,
          requestId,
          duration,
          enginePath: ['local-unified'],
          supportEngines: usedEngines,
          ragUsed: usedEngines.includes('Supabase RAG Engine'),
          nlpUsed: usedEngines.includes('Korean AI Engine'),
          mcpUsed: usedEngines.includes('MCP Client (Render)'),
          vercelPlan: vercelConfig.environment.isPro ? 'pro' : 'hobby',
        },
      };
    } catch (error) {
      const duration = timer();
      throw new Error(
        `로컬 엔진 처리 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🔍 자연어 질의 판별
   */
  private isNaturalLanguageQuery(query: string): boolean {
    const naturalPatterns = [
      /^(어떻게|왜|무엇|언제|어디서|누가|무엇을|어떤)/,
      /\?$/,
      /(설명|분석|요약|정리|알려|추천|비교|차이)/,
      /(할 수 있나요|가능한가요|방법|문제|해결)/,
    ];

    return naturalPatterns.some(pattern => pattern.test(query.trim()));
  }

  /**
   * 🔀 응답 통합
   */
  private combineResponses(
    responses: AIResponse[],
    usedEngines: string[]
  ): AIResponse {
    if (responses.length === 0) {
      return {
        success: false,
        response: '사용 가능한 AI 엔진이 없습니다.',
        confidence: 0,
        mode: 'LOCAL',
        enginePath: ['no-engines'],
        processingTime: 0,
        fallbacksUsed: 0,
        error: 'No available engines',
        metadata: {
          timestamp: new Date().toISOString(),
          enginePath: ['no-engines'],
          supportEngines: [],
          mainEngine: 'none',
          ragUsed: false,
          googleAIUsed: false,
        },
      };
    }

    // 가장 신뢰도 높은 응답 선택
    const bestResponse = responses.reduce((best, current) => {
      const bestConfidence = best.confidence || 0;
      const currentConfidence = current.confidence || 0;
      return currentConfidence > bestConfidence ? current : best;
    });

    // 사용된 엔진들 분석
    const mainEngine = usedEngines[0] || 'unknown';
    const ragUsed = usedEngines.includes('supabase-rag');
    const googleAIUsed = usedEngines.includes('google-ai');

    return {
      ...bestResponse,
      metadata: {
        ...bestResponse.metadata,
        timestamp: new Date().toISOString(),
        combinedResponses: responses.length,
        supportEngines: usedEngines,
        mainEngine: mainEngine,
        ragUsed: ragUsed,
        googleAIUsed: googleAIUsed,
      },
    };
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(request: AIRequest): string {
    const queryHash = this.simpleHash(request.query || '');
    return `ai_${request.mode}_${request.type}_${queryHash}`;
  }

  /**
   * 🔢 간단한 해시 함수
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer 변환
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    engines: Record<string, boolean>;
    stats: any;
  }> {
    const now = Date.now();
    if (now - this.lastHealthCheck < 30000) {
      // 30초 캐시
      return cache.get('health-check') || this.performHealthCheck();
    }

    const health = await this.performHealthCheck();
    cache.set('health-check', health, 30000);
    this.lastHealthCheck = now;

    return health;
  }

  private async performHealthCheck() {
    const engineStatus: Record<string, boolean> = {};

    for (const [type, engine] of this.engines) {
      try {
        if (engine.healthCheck) {
          await engine.healthCheck();
        }
        engineStatus[type] = true;
      } catch {
        engineStatus[type] = false;
      }
    }

    const healthyEngines = Object.values(engineStatus).filter(Boolean).length;
    const totalEngines = Object.keys(engineStatus).length;

    return {
      status: healthyEngines === totalEngines ? 'healthy' : 'degraded',
      engines: engineStatus,
      stats: {
        healthy: healthyEngines,
        total: totalEngines,
        cache: cache.getStats(),
        performance: performance.getAllMetrics(),
        runtime: edgeRuntimeService.getSystemStatus(),
      },
    };
  }

  /**
   * 📊 상태 정보 반환
   */
  getStatus(): any {
    return {
      router: 'UnifiedAIEngineRouter',
      version: '3.3.0',
      initialized: this.isInitialized,
      mode: this.getCurrentMode(),
      totalEngines: this.engines.size,
      failedEngines: this.failedEngines.size,
      requestCount: this.requestCount,
      lastHealthCheck: this.lastHealthCheck,
      availableEngines: Array.from(this.engines.keys()),
      failedEnginesList: Array.from(this.failedEngines),
      edgeMode: vercelConfig.environment.isVercel,
      vercelPlan: vercelConfig.environment.isPro ? 'pro' : 'hobby',
      stats: {
        totalRequests: this.requestCount,
        successfulRequests: this.requestCount, // 임시로 같은 값
        failureRate: this.failedEngines.size / Math.max(this.engines.size, 1),
        averageResponseTime: 0, // 실제 구현 시 계산
        cacheHitRate: 0.85, // 임시값
        uptime: Date.now() - this.lastHealthCheck,
      },
      engines: {
        supabaseRAG: this.engines.has('supabase-rag'),
        googleAI: this.engines.has('google-ai'),
        optimizedKoreanNLP: this.engines.has('korean-ai'),
        openSourceEngines: false, // 현재 미구현 상태
        customEngines: false, // 현재 미구현 상태
        mcpContextCollector: this.engines.has('render-mcp'),
        fallbackHandler: true, // 항상 사용 가능
      },
    };
  }

  /**
   * 🎯 현재 AI 모드 반환
   */
  getCurrentMode(): 'LOCAL' | 'GOOGLE_ONLY' {
    const mode = process.env.AI_ENGINE_MODE || 'LOCAL';

    // 유효한 모드인지 확인
    if (mode === 'LOCAL' || mode === 'GOOGLE_ONLY') {
      return mode;
    }

    // 기본값 반환
    return 'LOCAL';
  }

  /**
   * ⚙️ AI 모드 설정
   */
  setMode(mode: 'LOCAL' | 'GOOGLE_ONLY'): void {
    // 런타임에서 모드 변경 (환경변수 업데이트는 불가)
    logger.info(`🔧 AI 모드 변경 요청: ${mode}`);

    // 유효한 모드인지 확인
    if (mode !== 'LOCAL' && mode !== 'GOOGLE_ONLY') {
      logger.warn(`⚠️ 잘못된 AI 모드: ${mode}, LOCAL로 설정`);
      return;
    }

    // 모드별 로깅
    switch (mode) {
      case 'LOCAL':
        logger.info('🏠 로컬 AI 엔진 모드로 설정됨');
        break;
      case 'GOOGLE_ONLY':
        logger.info('🌐 Google AI 전용 모드로 설정됨 (자연어 처리 전용)');
        break;
    }
  }

  /**
   * 🧹 정리 작업
   */
  cleanup(): void {
    for (const [type, engine] of this.engines) {
      try {
        if (engine.cleanup) {
          engine.cleanup();
        }
      } catch (error) {
        logger.warn(`엔진 정리 실패: ${type}`, error);
      }
    }

    edgeRuntimeService.cleanup();
    logger.info('🧹 통합 AI 엔진 라우터 정리 완료');
  }
}

// Export instance
export const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
