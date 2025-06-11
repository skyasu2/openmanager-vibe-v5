/**
 * 🧠 통합 AI 시스템 관리자
 *
 * ✅ MCP 오케스트레이터 + FastAPI 클라이언트 통합
 * ✅ Keep-Alive 시스템 자동 관리
 * ✅ 3단계 컨텍스트 시스템 조율
 * ✅ 한국어 NLP 최적화
 */

import {
  MCPOrchestrator,
  MCPQuery,
  MCPResponse,
} from '../mcp/mcp-orchestrator';
// FastAPI 스텁 제거됨 - 로컬 인터페이스 사용
interface AIQuery {
  text: string;
}
interface AIResponse {
  answer: string;
}
class FastAPIClient {
  async connect() { console.log('FastAPI 제거됨'); }
  async disconnect() { }
  isConnected() { return false; }
  async query(query: AIQuery): Promise<AIResponse> {
    return { answer: 'FastAPI 제거됨' };
  }
  async analyzeText() {
    return {
      response: 'FastAPI 제거됨',
      confidence: 0,
      analysis: { sentiment: {}, intent: {}, entities: {}, keywords: [] }
    };
  }
  getConnectionStatus() { return { status: 'disabled' }; }
}

import { KeepAliveSystem } from '../../services/ai/keep-alive-system';
import { BasicContextManager } from '../../context/basic-context-manager';
import { AdvancedContextManager } from '../../context/advanced-context-manager';
import { CustomContextManager } from '../../context/custom-context-manager';

export interface UnifiedAIConfig {
  enableFastAPI: boolean;
  enableMCP: boolean;
  enableKeepAlive: boolean;
  hybridMode: boolean; // FastAPI + MCP 하이브리드 사용
  fallbackToMCP: boolean; // FastAPI 실패 시 MCP로 폴백
  maxResponseTime: number;
  cacheEnabled: boolean;
}

export interface UnifiedQuery {
  id: string;
  text: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  options?: {
    preferFastAPI?: boolean;
    includeAnalysis?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface UnifiedResponse {
  id: string;
  queryId: string;
  answer: string;
  confidence: number;
  sources: Array<{
    type: 'fastapi' | 'mcp' | 'context';
    content: any;
    confidence: number;
  }>;
  analysis?: {
    sentiment: any;
    intent: any;
    entities: any;
    keywords: string[];
  };
  recommendations: string[];
  actions: any[];
  metadata: {
    processingTime: number;
    engine: 'fastapi' | 'mcp' | 'hybrid';
    fromCache: boolean;
    contextUsed: {
      basic: boolean;
      advanced: boolean;
      custom: boolean;
    };
  };
  timestamp: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    fastapi: { status: string; latency: number };
    mcp: { status: string; initialized: boolean };
    keepAlive: { status: string; uptime: number };
    contexts: {
      basic: { status: string; lastUpdate: number };
      advanced: { status: string; documentsCount: number };
      custom: { status: string; rulesCount: number };
    };
  };
  stats: {
    totalQueries: number;
    avgResponseTime: number;
    successRate: number;
    cacheHitRate: number;
  };
}

export class UnifiedAISystem {
  private config: UnifiedAIConfig;
  private mcpOrchestrator: MCPOrchestrator;
  private fastApiClient: FastAPIClient;
  private keepAliveSystem: KeepAliveSystem;
  private basicContext: BasicContextManager;
  private advancedContext: AdvancedContextManager;
  private customContext: CustomContextManager;

  private isInitialized = false;
  private queryCount = 0;
  private responseTimes: number[] = [];
  private successCount = 0;
  private cacheHits = 0;

  constructor(config: Partial<UnifiedAIConfig> = {}) {
    this.config = {
      enableFastAPI: true,
      enableMCP: true,
      enableKeepAlive: true,
      hybridMode: true,
      fallbackToMCP: true,
      maxResponseTime: 30000, // 30초
      cacheEnabled: true,
      ...config,
    };

    this.mcpOrchestrator = new MCPOrchestrator();
    this.fastApiClient = new FastAPIClient();
    this.keepAliveSystem = new KeepAliveSystem();
    this.basicContext = new BasicContextManager();
    this.advancedContext = new AdvancedContextManager();
    this.customContext = CustomContextManager.getInstance();
  }

  /**
   * 🚀 통합 AI 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [UnifiedAI] 이미 초기화됨');
      return;
    }

    console.log('🚀 [UnifiedAI] 통합 AI 시스템 초기화 시작...');

    try {
      // 병렬로 모든 컴포넌트 초기화
      const initPromises: Promise<any>[] = [];

      // MCP 오케스트레이터 초기화
      if (this.config.enableMCP) {
        initPromises.push(
          this.mcpOrchestrator.initialize().catch(error => {
            console.error('❌ [UnifiedAI] MCP 초기화 실패:', error);
            this.config.enableMCP = false;
          })
        );
      }

      // FastAPI 클라이언트 연결
      if (this.config.enableFastAPI) {
        initPromises.push(
          this.fastApiClient.connect().catch(error => {
            console.error('❌ [UnifiedAI] FastAPI 연결 실패:', error);
            this.config.enableFastAPI = false;
          })
        );
      }

      // Keep-Alive 시스템 시작
      if (this.config.enableKeepAlive) {
        this.keepAliveSystem.start();
      }

      await Promise.allSettled(initPromises);

      // 최소 하나의 AI 엔진이 활성화되어야 함
      if (!this.config.enableFastAPI && !this.config.enableMCP) {
        throw new Error('FastAPI와 MCP 모두 사용할 수 없습니다');
      }

      this.isInitialized = true;
      console.log('✅ [UnifiedAI] 통합 AI 시스템 초기화 완료');

      // 초기화 후 상태 로깅
      const health = await this.getSystemHealth();
      console.log('📊 [UnifiedAI] 시스템 상태:', health.overall);
    } catch (error) {
      console.error('❌ [UnifiedAI] 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🧠 통합 질의 처리
   */
  async processQuery(query: UnifiedQuery): Promise<UnifiedResponse> {
    if (!this.isInitialized) {
      throw new Error('UnifiedAI 시스템이 초기화되지 않았습니다');
    }

    const startTime = Date.now();
    this.queryCount++;

    console.log(`🧠 [UnifiedAI] 질의 처리 시작: "${query.text}"`);

    try {
      let response: UnifiedResponse;

      // 엔진 선택 로직
      const useEngine = this.selectEngine(query);
      console.log(`🎯 [UnifiedAI] 선택된 엔진: ${useEngine}`);

      switch (useEngine) {
        case 'fastapi':
          response = await this.processFastAPIQuery(query);
          break;
        case 'mcp':
          response = await this.processMCPQuery(query);
          break;
        case 'hybrid':
          response = await this.processHybridQuery(query);
          break;
        default:
          throw new Error(`알 수 없는 엔진: ${useEngine}`);
      }

      // 성공 통계 업데이트
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);

      response.metadata.processingTime = processingTime;

      console.log(`✅ [UnifiedAI] 질의 처리 완료 (${processingTime}ms)`);
      return response;
    } catch (error) {
      console.error('❌ [UnifiedAI] 질의 처리 실패:', error);

      // 실패 통계 업데이트
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, false);

      // 폴백 응답 생성
      return this.generateFallbackResponse(
        query,
        error as Error,
        processingTime
      );
    }
  }

  /**
   * 🎯 엔진 선택 로직
   */
  private selectEngine(query: UnifiedQuery): 'fastapi' | 'mcp' | 'hybrid' {
    // 사용자 선호도
    if (query.options?.preferFastAPI && this.config.enableFastAPI) {
      return 'fastapi';
    }

    // 하이브리드 모드 사용 조건
    if (
      this.config.hybridMode &&
      this.config.enableFastAPI &&
      this.config.enableMCP
    ) {
      // 복잡한 질의나 분석이 필요한 경우 하이브리드
      if (query.text.length > 100 || query.options?.includeAnalysis) {
        return 'hybrid';
      }
    }

    // 기본 선택: FastAPI 우선
    if (this.config.enableFastAPI) {
      return 'fastapi';
    } else if (this.config.enableMCP) {
      return 'mcp';
    }

    throw new Error('사용 가능한 AI 엔진이 없습니다');
  }

  /**
   * 🐍 FastAPI 질의 처리
   */
  private async processFastAPIQuery(
    query: UnifiedQuery
  ): Promise<UnifiedResponse> {
    try {
      const aiQuery: AIQuery = {
        id: `fastapi_${Date.now()}`,
        text: query.text,
        userId: query.userId,
        organizationId: query.organizationId,
        sessionId: query.sessionId,
        context: query.context,
        options: {
          includeEmbedding: true,
          includeEntities: true,
          includeSentiment: true,
          language: 'ko',
          context: query.context,
          userId: query.userId,
          sessionId: query.sessionId,
        },
      };

      const aiResponse = await this.fastApiClient.analyzeText(aiQuery);

      return {
        id: `unified_${Date.now()}`,
        queryId: query.id,
        answer: aiResponse.response,
        confidence: aiResponse.confidence,
        sources: [
          {
            type: 'fastapi',
            content: aiResponse.analysis,
            confidence: aiResponse.confidence,
          },
        ],
        analysis: {
          sentiment: aiResponse.analysis.sentiment,
          intent: aiResponse.analysis.intent,
          entities: aiResponse.analysis.entities,
          keywords: aiResponse.analysis.intent.keywords,
        },
        recommendations: this.generateRecommendations(aiResponse.analysis),
        actions: [],
        metadata: {
          processingTime: aiResponse.processingTime,
          engine: 'fastapi',
          fromCache: aiResponse.fromCache,
          contextUsed: { basic: false, advanced: false, custom: false },
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      // FastAPI 실패 시 MCP로 폴백
      if (this.config.fallbackToMCP && this.config.enableMCP) {
        console.log('🔄 [UnifiedAI] FastAPI 실패, MCP로 폴백');
        return this.processMCPQuery(query);
      }
      throw error;
    }
  }

  /**
   * 🎭 MCP 질의 처리
   */
  private async processMCPQuery(query: UnifiedQuery): Promise<UnifiedResponse> {
    const mcpQuery: MCPQuery = {
      id: `mcp_${Date.now()}`,
      question: query.text,
      userId: query.userId,
      organizationId: query.organizationId,
      context: {
        sessionId: query.sessionId,
        userPreferences: query.context,
      },
      timestamp: Date.now(),
    };

    const mcpResponse = await this.mcpOrchestrator.processQuery(mcpQuery);

    return {
      id: `unified_${Date.now()}`,
      queryId: query.id,
      answer: mcpResponse.answer,
      confidence: mcpResponse.confidence,
      sources: mcpResponse.sources.map(source => ({
        type: 'mcp' as const,
        content: source,
        confidence: source.confidence,
      })),
      analysis: undefined, // MCP는 기본적으로 자세한 분석 제공하지 않음
      recommendations: mcpResponse.recommendations,
      actions: mcpResponse.actions,
      metadata: {
        processingTime: mcpResponse.processingTime,
        engine: 'mcp',
        fromCache: false,
        contextUsed: mcpResponse.contextUsed,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 🔀 하이브리드 질의 처리
   */
  private async processHybridQuery(
    query: UnifiedQuery
  ): Promise<UnifiedResponse> {
    console.log('🔀 [UnifiedAI] 하이브리드 모드 처리');

    // FastAPI와 MCP를 병렬로 실행
    const [fastApiResult, mcpResult] = await Promise.allSettled([
      this.processFastAPIQuery({
        ...query,
        options: { ...query.options, preferFastAPI: true },
      }),
      this.processMCPQuery(query),
    ]);

    // 결과 통합
    let primaryResult: UnifiedResponse;
    let secondaryResult: UnifiedResponse | null = null;

    if (fastApiResult.status === 'fulfilled') {
      primaryResult = fastApiResult.value;
      if (mcpResult.status === 'fulfilled') {
        secondaryResult = mcpResult.value;
      }
    } else if (mcpResult.status === 'fulfilled') {
      primaryResult = mcpResult.value;
    } else {
      throw new Error('FastAPI와 MCP 모두 실패했습니다');
    }

    // 하이브리드 응답 생성
    const hybridResponse: UnifiedResponse = {
      ...primaryResult,
      id: `unified_hybrid_${Date.now()}`,
      sources: [...primaryResult.sources, ...(secondaryResult?.sources || [])],
      recommendations: [
        ...primaryResult.recommendations,
        ...(secondaryResult?.recommendations || []),
      ].slice(0, 5), // 최대 5개로 제한
      metadata: {
        ...primaryResult.metadata,
        engine: 'hybrid',
        processingTime: Math.max(
          primaryResult.metadata.processingTime,
          secondaryResult?.metadata.processingTime || 0
        ),
      },
    };

    // 신뢰도 조정 (하이브리드에서는 평균값 사용)
    if (secondaryResult) {
      hybridResponse.confidence =
        (primaryResult.confidence + secondaryResult.confidence) / 2;
    }

    return hybridResponse;
  }

  /**
   * 💡 추천사항 생성
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    // 감정 기반 추천
    if (analysis.sentiment.polarity === 'negative') {
      recommendations.push('문제 해결을 위한 추가 조치가 필요할 수 있습니다');
    }

    // 의도 기반 추천
    switch (analysis.intent.category) {
      case 'status':
        recommendations.push('정기적인 시스템 모니터링을 권장합니다');
        break;
      case 'troubleshooting':
        recommendations.push('로그 파일을 확인하여 근본 원인을 파악해보세요');
        break;
      case 'configuration':
        recommendations.push('설정 변경 전 백업을 권장합니다');
        break;
    }

    return recommendations.slice(0, 3); // 최대 3개
  }

  /**
   * 🆘 폴백 응답 생성
   */
  private generateFallbackResponse(
    query: UnifiedQuery,
    error: Error,
    processingTime: number
  ): UnifiedResponse {
    return {
      id: `unified_fallback_${Date.now()}`,
      queryId: query.id,
      answer:
        '죄송합니다. 현재 시스템에 일시적인 문제가 있어 정확한 답변을 드리기 어렵습니다. 잠시 후 다시 시도해 주세요.',
      confidence: 0.1,
      sources: [],
      recommendations: [
        '잠시 후 다시 시도해 주세요',
        '시스템 관리자에게 문의하세요',
        '간단한 질문으로 다시 요청해 보세요',
      ],
      actions: [],
      metadata: {
        processingTime,
        engine: 'fastapi',
        fromCache: false,
        contextUsed: { basic: false, advanced: false, custom: false },
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 📊 통계 업데이트
   */
  private updateStats(processingTime: number, success: boolean): void {
    this.responseTimes.push(processingTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift(); // 최근 100개만 유지
    }

    if (success) {
      this.successCount++;
    }
  }

  /**
   * 🏥 시스템 상태 조회
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [
      fastApiStatus,
      keepAliveStatus,
      basicContextStatus,
      advancedContextStats,
      customContextStats,
    ] = await Promise.allSettled([
      this.fastApiClient.getConnectionStatus(),
      this.keepAliveSystem.getStatus(),
      this.basicContext.getCurrentContext(),
      this.advancedContext.getStatistics(),
      this.customContext.getStatistics(),
    ]);

    // 전체 상태 판단
    let overall: SystemHealth['overall'] = 'healthy';

    if (!this.config.enableFastAPI && !this.config.enableMCP) {
      overall = 'unhealthy';
    } else if (this.getSuccessRate() < 0.8) {
      overall = 'degraded';
    }

    return {
      overall,
      components: {
        fastapi: {
          status:
            fastApiStatus.status === 'fulfilled' &&
              fastApiStatus.value.isConnected
              ? 'healthy'
              : 'unhealthy',
          latency:
            fastApiStatus.status === 'fulfilled' &&
              fastApiStatus.value.healthStatus
              ? 0
              : -1,
        },
        mcp: {
          status: this.config.enableMCP ? 'healthy' : 'disabled',
          initialized: this.isInitialized,
        },
        keepAlive: {
          status:
            keepAliveStatus.status === 'fulfilled' &&
              keepAliveStatus.value.isActive
              ? 'healthy'
              : 'inactive',
          uptime:
            keepAliveStatus.status === 'fulfilled'
              ? keepAliveStatus.value.uptimeHours
              : 0,
        },
        contexts: {
          basic: {
            status:
              basicContextStatus.status === 'fulfilled' ? 'healthy' : 'error',
            lastUpdate:
              basicContextStatus.status === 'fulfilled' &&
                basicContextStatus.value
                ? basicContextStatus.value.lastUpdate
                : 0,
          },
          advanced: {
            status:
              advancedContextStats.status === 'fulfilled' ? 'healthy' : 'error',
            documentsCount:
              advancedContextStats.status === 'fulfilled'
                ? advancedContextStats.value.totalDocuments
                : 0,
          },
          custom: {
            status:
              customContextStats.status === 'fulfilled' ? 'healthy' : 'error',
            rulesCount:
              customContextStats.status === 'fulfilled'
                ? customContextStats.value.totalRules
                : 0,
          },
        },
      },
      stats: {
        totalQueries: this.queryCount,
        avgResponseTime: this.getAverageResponseTime(),
        successRate: this.getSuccessRate(),
        cacheHitRate: this.getCacheHitRate(),
      },
    };
  }

  /**
   * 📊 성공률 계산
   */
  private getSuccessRate(): number {
    return this.queryCount > 0 ? this.successCount / this.queryCount : 0;
  }

  /**
   * ⚡ 평균 응답 시간 계산
   */
  private getAverageResponseTime(): number {
    return this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.responseTimes.length
      : 0;
  }

  /**
   * 📦 캐시 히트율 계산
   */
  private getCacheHitRate(): number {
    return this.queryCount > 0 ? this.cacheHits / this.queryCount : 0;
  }

  /**
   * 🔄 시스템 재시작
   */
  async restart(): Promise<void> {
    console.log('🔄 [UnifiedAI] 시스템 재시작 중...');

    await this.shutdown();
    await this.initialize();

    console.log('✅ [UnifiedAI] 시스템 재시작 완료');
  }

  /**
   * 🛑 시스템 종료
   */
  async shutdown(): Promise<void> {
    console.log('🛑 [UnifiedAI] 시스템 종료 중...');

    if (this.config.enableKeepAlive) {
      this.keepAliveSystem.stop();
    }

    if (this.config.enableMCP) {
      await this.mcpOrchestrator.cleanup();
    }

    this.basicContext.stopCollection();

    this.isInitialized = false;
    console.log('✅ [UnifiedAI] 시스템 종료 완료');
  }
}

// 전역 인스턴스
export const unifiedAISystem = new UnifiedAISystem();
