/**
 * 🤖 통합 AI 엔진 v4.0 - 리팩토링된 버전
 *
 * Design Patterns Applied:
 * - Single Responsibility Principle: 각 모듈은 단일 책임을 가짐
 * - Dependency Injection: 의존성을 주입받아 테스트 용이성 향상
 * - Strategy Pattern: 의도별 처리 전략을 교체 가능하게 구현
 * - Factory Pattern: 핸들러와 응답 생성기를 팩토리로 관리
 * - Template Method Pattern: 쿼리 처리의 공통 플로우 정의
 */

import { realMCPClient } from '../../mcp/real-mcp-client';
import { tensorFlowAIEngine } from '../tensorflow-engine';
import { 
  AIQueryRequest, 
  AIQueryResponse, 
  RenderStatus, 
  AIEngineConfiguration,
  NLPAnalysisResult 
} from './ai-types/AITypes';
import { NLPProcessor } from './nlp/NLPProcessor';
import { IntentHandlerFactory } from './intent-handlers/IntentHandlers';
import { ResponseGenerator } from './response/ResponseGenerator';
import { MetricsCollector } from './metrics/MetricsCollector';

export class IntegratedAIEngineRefactored {
  private initialized = false;
  private lastAnalysisCache: Map<string, any> = new Map();
  private activeSessions: Set<string> = new Set();
  private renderPingInterval?: NodeJS.Timeout;
  private renderStatus: RenderStatus = 'active';
  
  // 의존성 주입된 컴포넌트들
  private nlpProcessor: NLPProcessor;
  private responseGenerator: ResponseGenerator;
  private metricsCollector: MetricsCollector;
  private config: AIEngineConfiguration;

  constructor(config: Partial<AIEngineConfiguration> = {}) {
    // 기본 설정과 사용자 설정 병합
    this.config = {
      renderPingInterval: 5 * 60 * 1000, // 5분
      maxCacheSize: 100,
      defaultConfidenceThreshold: 0.7,
      supportedLanguages: ['ko', 'en'],
      ...config
    };

    // 의존성 초기화
    this.nlpProcessor = new NLPProcessor();
    this.responseGenerator = new ResponseGenerator({
      defaultLanguage: 'ko',
      includeDebugInfo: false,
      maxResponseLength: 2000
    });
    this.metricsCollector = new MetricsCollector();

    this.startRenderManagement();
  }

  /**
   * 🔄 Render 자동 관리 시작 (선택적)
   */
  private startRenderManagement(): void {
    const renderUrl = process.env.FASTAPI_URL;
    if (!renderUrl?.includes('onrender.com')) {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development' && renderUrl) {
        console.log('ℹ️ Render URL이 아님 - Render 자동 관리 비활성화');
      }
      return;
    }

    console.log('🔄 Render 자동 관리 시작...');

    this.renderPingInterval = setInterval(
      async () => {
        try {
          const response = await fetch(renderUrl + '/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          this.renderStatus = response.ok ? 'active' : 'sleeping';
          console.log(response.ok ? '✅ Render 서비스 정상' : '⚠️ Render 서비스 응답 없음');
        } catch (error) {
          this.renderStatus = 'error';
          console.log('❌ Render ping 실패:', error instanceof Error ? error.message : '알 수 없는 오류');
        }
      },
      this.config.renderPingInterval
    );

    process.on('beforeExit', () => {
      if (this.renderPingInterval) {
        clearInterval(this.renderPingInterval);
        console.log('🔄 Render 자동 관리 중지');
      }
    });
  }

  /**
   * 🏥 Render 상태 확인
   */
  getRenderStatus(): RenderStatus {
    return this.renderStatus;
  }

  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🤖 통합 AI 엔진 v4.0 초기화 중...');

    try {
      await Promise.all([
        realMCPClient.initialize(),
        tensorFlowAIEngine.initialize(),
      ]);

      this.initialized = true;
      console.log('✅ 통합 AI 엔진 초기화 완료');
      console.log('🔧 활성화된 컴포넌트:');
      console.log('  - ✅ NLP 프로세서');
      console.log('  - ✅ 의도별 핸들러');
      console.log('  - ✅ 응답 생성기');
      console.log('  - ✅ 메트릭 수집기');
      console.log('  - ✅ MCP 클라이언트');
      console.log('  - ✅ TensorFlow 엔진');
    } catch (error: any) {
      console.error('❌ 통합 AI 엔진 초기화 실패:', error);
      this.initialized = true; // 폴백 모드로 계속 진행
    }
  }

  /**
   * 🧠 메인 쿼리 처리 메서드 (Template Method Pattern)
   */
  async processQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    await this.initialize();

    const startTime = Date.now();
    const queryId = this.generateQueryId();
    const sessionId = request.context?.session_id || queryId;

    console.log(`🤖 AI 쿼리 처리 시작: ${queryId}`);
    console.log(`📝 질문: "${request.query}"`);

    this.activeSessions.add(sessionId);

    // 응답 객체 초기화
    const response = this.initializeResponse(queryId, sessionId, request);

    try {
      // 1단계: 자연어 처리
      const nlpResult = await this.processNaturalLanguage(request, response);

      // 2단계: 의도별 처리
      await this.processIntentSpecificLogic(nlpResult, request, response);

      // 3단계: 종합 응답 생성
      await this.generateFinalResponse(nlpResult, request, response);

      // 4단계: 권장사항 생성
      this.generateRecommendations(nlpResult, response);

      // 5단계: 보고서 생성 (필요한 경우)
      await this.generateReportIfNeeded(nlpResult, request, response);

      this.markSuccessfulCompletion(response, startTime);

    } catch (error: any) {
      this.handleProcessingError(error, request, response, startTime);
    } finally {
      this.activeSessions.delete(sessionId);
    }

    return response;
  }

  /**
   * 1단계: 자연어 처리
   */
  private async processNaturalLanguage(
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<NLPAnalysisResult> {
    console.log('📝 1단계: NLP 분석 중...');
    
    const nlpResult = await this.nlpProcessor.processNLP(request.query);
    response.analysis_results.nlp_analysis = nlpResult;
    response.intent = nlpResult.intent;
    response.confidence = nlpResult.confidence;
    response.processing_stats.components_used.push('nlp_processor');

    console.log(`🎯 의도 분석 결과: ${nlpResult.intent} (신뢰도: ${(nlpResult.confidence * 100).toFixed(1)}%)`);
    
    return nlpResult;
  }

  /**
   * 2단계: 의도별 처리
   */
  private async processIntentSpecificLogic(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest,
    response: AIQueryResponse
  ): Promise<void> {
    console.log('🎯 2단계: 의도별 처리 중...');
    
    const handler = IntentHandlerFactory.getHandler(nlpResult.intent);
    await handler.handle({ nlpResult, request, response });
  }

  /**
   * 3단계: 종합 응답 생성
   */
  private async generateFinalResponse(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest,
    response: AIQueryResponse
  ): Promise<void> {
    console.log('💬 3단계: 응답 생성 중...');
    
    await this.responseGenerator.generateComprehensiveAnswer(nlpResult, request, response);
  }

  /**
   * 4단계: 권장사항 생성
   */
  private generateRecommendations(
    nlpResult: NLPAnalysisResult,
    response: AIQueryResponse
  ): void {
    console.log('💡 4단계: 권장사항 생성 중...');
    
    this.responseGenerator.generateRecommendations(nlpResult, response);
  }

  /**
   * 5단계: 보고서 생성
   */
  private async generateReportIfNeeded(
    nlpResult: NLPAnalysisResult,
    request: AIQueryRequest,
    response: AIQueryResponse
  ): Promise<void> {
    if (this.responseGenerator.shouldGenerateReport(nlpResult, request)) {
      console.log('📄 5단계: 보고서 생성 중...');
      await this.responseGenerator.generateReport(response, request);
    }
  }

  /**
   * 응답 객체 초기화
   */
  private initializeResponse(
    queryId: string, 
    sessionId: string, 
    request: AIQueryRequest
  ): AIQueryResponse {
    return {
      success: false,
      query_id: queryId,
      intent: 'unknown',
      confidence: 0,
      answer: '',
      analysis_results: {
        nlp_analysis: null,
      },
      recommendations: [],
      processing_stats: {
        total_time: 0,
        components_used: [],
        models_executed: [],
        data_sources: [],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        language: request.context?.language || 'ko',
        session_id: sessionId,
      },
    };
  }

  /**
   * 성공 완료 처리
   */
  private markSuccessfulCompletion(response: AIQueryResponse, startTime: number): void {
    response.success = true;
    response.processing_stats.total_time = Date.now() - startTime;

    console.log(`✅ AI 쿼리 처리 완료: ${response.processing_stats.total_time}ms`);
    console.log(`🎯 최종 응답: "${response.answer.substring(0, 100)}..."`);
  }

  /**
   * 오류 처리
   */
  private handleProcessingError(
    error: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse, 
    startTime: number
  ): void {
    console.error('❌ AI 쿼리 처리 실패:', error);
    
    response.success = false;
    response.answer = response.metadata.language === 'ko'
      ? '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
      : 'Sorry, an error occurred during processing. Please try again.';
    response.processing_stats.total_time = Date.now() - startTime;

    if (request.options?.include_debug) {
      response.metadata.debug_info = {
        error: error.message,
        stack: error.stack,
      };
    }
  }

  /**
   * 쿼리 ID 생성
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 🌊 스트리밍 쿼리 처리
   */
  async *processQueryStream(
    request: AIQueryRequest
  ): AsyncGenerator<Partial<AIQueryResponse>, void, unknown> {
    const queryId = this.generateQueryId();
    const sessionId = request.context?.session_id || queryId;

    // 초기 응답
    yield {
      query_id: queryId,
      metadata: {
        timestamp: new Date().toISOString(),
        language: request.context?.language || 'ko',
        session_id: sessionId,
      },
    };

    try {
      // NLP 분석 결과 스트리밍
      const nlpResult = await this.nlpProcessor.processNLP(request.query);
      yield {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        analysis_results: { nlp_analysis: nlpResult },
      };

      // 최종 처리 결과
      const fullResponse = await this.processQuery(request);
      yield fullResponse;

    } catch (error: any) {
      yield {
        success: false,
        answer: request.context?.language === 'ko' 
          ? '스트리밍 처리 중 오류가 발생했습니다.'
          : 'Error occurred during streaming processing.',
      };
    }
  }

  /**
   * 엔진 상태 확인
   */
  async getEngineStatus(): Promise<any> {
    return {
      initialized: this.initialized,
      active_sessions: this.activeSessions.size,
      render_status: this.renderStatus,
      cache_size: this.lastAnalysisCache.size,
      supported_languages: this.config.supportedLanguages,
      components: {
        nlp_processor: true,
        intent_handlers: true,
        response_generator: true,
        metrics_collector: true,
        mcp_client: await realMCPClient.getStatus?.() || 'unknown',
        tensorflow_engine: await tensorFlowAIEngine.getStatus?.() || 'unknown',
      },
      config: this.config,
      metrics_cache_stats: this.metricsCollector.getCacheStats(),
    };
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.renderPingInterval) {
      clearInterval(this.renderPingInterval);
    }
    this.activeSessions.clear();
    this.lastAnalysisCache.clear();
    this.metricsCollector.clearCache();
    
    console.log('🔄 통합 AI 엔진 리소스 정리 완료');
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const integratedAIEngine = new IntegratedAIEngineRefactored(); 