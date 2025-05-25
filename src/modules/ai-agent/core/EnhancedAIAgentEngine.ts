/**
 * Enhanced AI Agent Engine
 * 
 * 🧠 스마트 모드 감지 기능이 통합된 AI 에이전트 엔진
 * - 질문 유형 자동 분석 및 모드 선택
 * - Basic/Advanced 모드 자동 전환
 * - 장애 보고서 자동 생성
 * - 모드별 처리 시간 제한
 */

import { MCPProcessor } from '../../mcp';
import { IntentClassifier } from '../processors/IntentClassifier';
import { ResponseGenerator } from '../processors/ResponseGenerator';
import { ContextManager } from '../processors/ContextManager';
import { ActionExecutor } from '../processors/ActionExecutor';
import { EnhancedModeManager } from './EnhancedModeManager';
import { ModePrompts } from '../prompts/ModePrompts';
import { AIAgentMode, QueryAnalysis } from './SmartModeDetector';
import { ThinkingProcessor } from './ThinkingProcessor';
import { AdminLogger } from './AdminLogger';

export interface EnhancedAIAgentConfig {
  enableMCP: boolean;
  enableNPU: boolean;
  enableAutoMode: boolean;
  enableThinking: boolean;
  enableAdminLogging: boolean;
  debugMode: boolean;
}

export interface EnhancedAIAgentRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  serverData?: any;
  metadata?: Record<string, any>;
  forceMode?: AIAgentMode; // 강제 모드 지정
}

export interface EnhancedAIAgentResponse {
  success: boolean;
  response: string;
  mode: AIAgentMode;
  analysis: QueryAnalysis;
  intent: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  actions: string[];
  context: Record<string, any>;
  metadata: {
    processingTime: number;
    timestamp: string;
    engineVersion: string;
    sessionId: string;
    modeConfig: any;
  };
  error?: string;
  thinkingSessionId?: string;
}

export class EnhancedAIAgentEngine {
  private static instance: EnhancedAIAgentEngine;
  private config: EnhancedAIAgentConfig;
  private modeManager: EnhancedModeManager;
  private mcpProcessor: MCPProcessor;
  private intentClassifier: IntentClassifier;
  private responseGenerator: ResponseGenerator;
  private contextManager: ContextManager;
  private actionExecutor: ActionExecutor;
  private thinkingProcessor: ThinkingProcessor;
  private adminLogger: AdminLogger;
  private isInitialized: boolean = false;

  private constructor(config: EnhancedAIAgentConfig) {
    this.config = config;
    this.modeManager = new EnhancedModeManager();
    this.mcpProcessor = MCPProcessor.getInstance();
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    this.contextManager = new ContextManager();
    this.actionExecutor = new ActionExecutor();
    this.thinkingProcessor = new ThinkingProcessor();
    this.adminLogger = new AdminLogger();
  }

  /**
   * 싱글톤 인스턴스 생성/반환
   */
  static getInstance(config?: EnhancedAIAgentConfig): EnhancedAIAgentEngine {
    if (!EnhancedAIAgentEngine.instance) {
      const defaultConfig: EnhancedAIAgentConfig = {
        enableMCP: true,
        enableNPU: true,
        enableAutoMode: true,
        enableThinking: true,
        enableAdminLogging: true,
        debugMode: process.env.NODE_ENV === 'development'
      };
      EnhancedAIAgentEngine.instance = new EnhancedAIAgentEngine(config || defaultConfig);
    }
    return EnhancedAIAgentEngine.instance;
  }

  /**
   * AI 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Enhanced AI Agent Engine 초기화 중...');
      
      // 모드 매니저 자동 모드 설정
      this.modeManager.setAutoMode(this.config.enableAutoMode);

      // MCP 프로세서 초기화
      if (this.config.enableMCP) {
        await this.mcpProcessor.initialize?.();
        console.log('✅ MCP 프로세서 초기화 완료');
      }

      // 의도 분류기 초기화
      await this.intentClassifier.initialize();
      console.log('✅ 의도 분류기 초기화 완료');

      // 응답 생성기 초기화
      await this.responseGenerator.initialize();
      console.log('✅ 응답 생성기 초기화 완료');

      // 컨텍스트 매니저 초기화
      await this.contextManager.initialize();
      console.log('✅ 컨텍스트 매니저 초기화 완료');

      // 액션 실행기 초기화
      await this.actionExecutor.initialize();
      console.log('✅ 액션 실행기 초기화 완료');

      // 사고 과정 프로세서 초기화
      if (this.config.enableThinking) {
        await this.thinkingProcessor.initialize();
        console.log('✅ 사고 과정 프로세서 초기화 완료');
      }

      this.isInitialized = true;
      console.log('🎉 Enhanced AI Agent Engine 초기화 완료!');

    } catch (error) {
      console.error('❌ Enhanced AI Agent Engine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 스마트 쿼리 처리 - 자동 모드 선택
   */
  async processSmartQuery(request: EnhancedAIAgentRequest): Promise<EnhancedAIAgentResponse> {
    const startTime = Date.now();
    const sessionId = request.sessionId || this.generateSessionId();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 1. 쿼리 분석 및 자동 모드 선택 (강제 모드가 지정되지 않은 경우)
      let analysis: QueryAnalysis;
      if (request.forceMode) {
        this.modeManager.setMode(request.forceMode);
        analysis = {
          detectedMode: request.forceMode,
          confidence: 100,
          triggers: ['manual'],
          reasoning: `수동으로 ${request.forceMode} 모드 설정`
        };
      } else {
        analysis = this.modeManager.analyzeAndSetMode(request.query);
      }

      const modeConfig = this.modeManager.getModeConfig();
      
      console.log(`🤖 Processing query with auto-selected mode:`, {
        mode: analysis.detectedMode,
        confidence: analysis.confidence,
        maxTime: modeConfig.maxProcessingTime
      });

      // 2. 사고 과정 시작 (Advanced 모드에서만)
      let thinkingSessionId: string | undefined;
      if (this.config.enableThinking && analysis.detectedMode === 'advanced') {
        thinkingSessionId = this.thinkingProcessor.startThinking(
          sessionId, 
          request.query, 
          analysis.detectedMode
        );
      }

      // 3. 특별 케이스: 자동 장애 보고서
      if (this.isIncidentReportRequest(request.query)) {
        return this.processIncidentReport(request, analysis, sessionId, startTime, thinkingSessionId);
      }

      // 4. 모드별 처리 (시간 제한 적용)
      const result = analysis.detectedMode === 'basic' 
        ? await this.processBasicQuery(request, analysis, sessionId, modeConfig.maxProcessingTime)
        : await this.processAdvancedQuery(request, analysis, sessionId, modeConfig.maxProcessingTime);

      // 5. 사고 과정 완료
      if (thinkingSessionId) {
        this.thinkingProcessor.completeThinking(thinkingSessionId, result);
      }

      const processingTime = Date.now() - startTime;

      // 6. 관리자 로깅
      if (this.config.enableAdminLogging) {
        this.adminLogger.logInteraction({
          sessionId,
          query: request.query,
          mode: analysis.detectedMode,
          success: result.success,
          responseTime: processingTime,
          intent: result.intent
        });
      }

      return {
        ...result,
        mode: analysis.detectedMode,
        analysis,
        metadata: {
          ...result.metadata,
          processingTime,
          modeConfig
        },
        thinkingSessionId
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ Enhanced AI Agent 질의 처리 실패:', error);
      
      // 에러 로깅
      if (this.config.enableAdminLogging) {
        this.adminLogger.logError({
          sessionId,
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
          query: request.query
        });
      }
      
      return {
        success: false,
        response: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
        mode: 'basic',
        analysis: {
          detectedMode: 'basic',
          confidence: 0,
          triggers: [],
          reasoning: '오류 발생'
        },
        intent: {
          name: 'error',
          confidence: 0,
          entities: {}
        },
        actions: [],
        context: {},
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          engineVersion: '2.0.0',
          sessionId,
          modeConfig: {}
        },
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Basic 모드 처리
   */
  private async processBasicQuery(
    request: EnhancedAIAgentRequest, 
    analysis: QueryAnalysis, 
    sessionId: string,
    maxTime: number
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis'>> {
    // 시간 제한 적용
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Basic mode timeout')), maxTime)
    );
    
    return Promise.race([
      this.generateBasicResponse(request, analysis, sessionId),
      timeout
    ]);
  }

  /**
   * Advanced 모드 처리
   */
  private async processAdvancedQuery(
    request: EnhancedAIAgentRequest, 
    analysis: QueryAnalysis, 
    sessionId: string,
    maxTime: number
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis' | 'metadata'>> {
    // 시간 제한 적용
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Advanced mode timeout')), maxTime)
    );
    
    return Promise.race([
      this.generateAdvancedResponse(request, analysis, sessionId),
      timeout
    ]);
  }

  /**
   * Basic 응답 생성
   */
  private async generateBasicResponse(
    request: EnhancedAIAgentRequest, 
    analysis: QueryAnalysis, 
    sessionId: string
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis' | 'metadata'>> {
    // 1. 컨텍스트 로드
    const context = await this.contextManager.loadContext(sessionId, request.context);
    
    // 2. 의도 분류
    const intent = await this.intentClassifier.classify(request.query, context);
    
    // 3. Basic 모드 프롬프트 생성
    const prompt = ModePrompts.getBasicPrompt(request.query, context);
    
    // 4. 응답 생성 (간결한 형태)
    const response = await this.responseGenerator.generate({
      query: request.query,
      intent,
      context,
      serverData: request.serverData,
      mcpResponse: null
    });

    // 5. 액션 추출
    const actions = await this.actionExecutor.extractActions(intent, response);

    return {
      success: true,
      response: this.truncateResponse(response.text, 300), // Basic 모드는 300자 제한
      intent: {
        name: intent.name,
        confidence: intent.confidence,
        entities: intent.entities
      },
      actions,
      context,
      metadata: {
        processingTime: 0,
        timestamp: new Date().toISOString(),
        engineVersion: '2.0.0',
        sessionId,
        modeConfig: {}
      }
    };
  }

  /**
   * Advanced 응답 생성
   */
  private async generateAdvancedResponse(
    request: EnhancedAIAgentRequest, 
    analysis: QueryAnalysis, 
    sessionId: string
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis' | 'metadata'>> {
    // 1. 컨텍스트 로드
    const context = await this.contextManager.loadContext(sessionId, request.context);
    
    // 2. 의도 분류
    const intent = await this.intentClassifier.classify(request.query, context);
    
    // 3. MCP 프로세서를 통한 고급 분석
    let mcpResponse;
    if (this.config.enableMCP) {
      mcpResponse = await this.mcpProcessor.processQuery(request.query, request.serverData);
    }

    // 4. Advanced 모드 프롬프트 생성
    const prompt = ModePrompts.getAdvancedPrompt(request.query, context, analysis);
    
    // 5. 고급 응답 생성 (상세한 형태)
    const response = await this.responseGenerator.generate({
      query: request.query,
      intent,
      context,
      serverData: request.serverData,
      mcpResponse
    });

    // 6. 액션 추출
    const actions = await this.actionExecutor.extractActions(intent, response);

    return {
      success: true,
      response: this.enhanceAdvancedResponse(response.text, analysis), // Advanced 모드 응답 강화
      intent: {
        name: intent.name,
        confidence: intent.confidence,
        entities: intent.entities
      },
      actions,
      context,
      metadata: {
        processingTime: 0,
        timestamp: new Date().toISOString(),
        engineVersion: '2.0.0',
        sessionId,
        modeConfig: {}
      }
    };
  }

  /**
   * 장애 보고서 처리
   */
  private async processIncidentReport(
    request: EnhancedAIAgentRequest,
    analysis: QueryAnalysis,
    sessionId: string,
    startTime: number,
    thinkingSessionId?: string
  ): Promise<EnhancedAIAgentResponse> {
    const context = await this.contextManager.loadContext(sessionId, request.context);
    const incidentPrompt = ModePrompts.getIncidentReportPrompt(context);
    
    // 장애 보고서는 항상 Advanced 모드로 처리
    const result = await this.generateAdvancedResponse(request, analysis, sessionId);
    
    return {
      ...result,
      mode: 'advanced',
      analysis: {
        ...analysis,
        detectedMode: 'advanced',
        reasoning: '장애 보고서 자동 생성 - Advanced 모드 강제 적용'
      },
      response: `🚨 **자동 장애 보고서**\n\n${result.response}`,
      metadata: {
        ...result.metadata,
        processingTime: Date.now() - startTime
      },
      thinkingSessionId
    };
  }

  /**
   * 장애 보고서 요청 감지
   */
  private isIncidentReportRequest(query: string): boolean {
    const incidentKeywords = [
      '장애 보고서', '인시던트 리포트', 'incident report',
      '종합 보고서', '자동 보고서', '장애 분석'
    ];
    
    return incidentKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 응답 길이 제한
   */
  private truncateResponse(response: string, maxLength: number): string {
    if (response.length <= maxLength) return response;
    return response.substring(0, maxLength - 3) + '...';
  }

  /**
   * Advanced 응답 강화
   */
  private enhanceAdvancedResponse(response: string, analysis: QueryAnalysis): string {
    let enhanced = response;
    
    // 분석 정보 추가
    enhanced += `\n\n---\n**🧠 AI 분석 정보**\n`;
    enhanced += `- 감지된 모드: ${analysis.detectedMode}\n`;
    enhanced += `- 신뢰도: ${analysis.confidence}%\n`;
    enhanced += `- 분석 근거: ${analysis.reasoning}\n`;
    
    if (analysis.triggers.length > 0) {
      enhanced += `- 트리거: ${analysis.triggers.join(', ')}\n`;
    }
    
    return enhanced;
  }

  /**
   * 모드 관리자 조회
   */
  getModeManager(): EnhancedModeManager {
    return this.modeManager;
  }

  /**
   * 엔진 상태 확인
   */
  getEngineStatus() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      currentMode: this.modeManager.getCurrentMode(),
      autoModeEnabled: this.modeManager.isAutoModeEnabled(),
      modeStats: this.modeManager.getModeStats(),
      version: '2.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `enhanced_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 엔진 종료
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Enhanced AI Agent Engine 종료 중...');
    
    await this.contextManager.cleanup?.();
    await this.actionExecutor.cleanup?.();
    await this.thinkingProcessor.cleanup?.();
    this.modeManager.cleanup();
    
    this.isInitialized = false;
    console.log('✅ Enhanced AI Agent Engine 종료 완료');
  }
}

// 기본 인스턴스 export
export const enhancedAIAgentEngine = EnhancedAIAgentEngine.getInstance(); 