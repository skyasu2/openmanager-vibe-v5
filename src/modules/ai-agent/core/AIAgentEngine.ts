/**
 * OpenManager AI Agent Engine
 * 
 * 🧠 NPU 기반 경량 AI 추론 엔진
 * - LLM 비용 없는 실시간 AI 추론
 * - MCP(Model Context Protocol) 기반 의도 분류
 * - 도메인 특화 서버 모니터링 AI
 * - 확장 가능한 플러그인 아키텍처
 */

import { MCPProcessor } from '../../mcp';
import { IntentClassifier } from '../processors/IntentClassifier';
import { ResponseGenerator } from '../processors/ResponseGenerator';
import { ContextManager } from '../processors/ContextManager';
import { ActionExecutor } from '../processors/ActionExecutor';
import { ModeManager, createDefaultModeConfig, AIAgentMode } from './ModeManager';
import { ThinkingProcessor } from './ThinkingProcessor';
import { AdminLogger } from './AdminLogger';

export interface AIAgentConfig {
  enableMCP: boolean;
  enableNPU: boolean;
  maxContextLength: number;
  responseTimeout: number;
  debugMode: boolean;
  mode: AIAgentMode;
  enableThinking: boolean;
  enableAdminLogging: boolean;
}

export interface AIAgentResponse {
  success: boolean;
  response: string;
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
  };
  error?: string;
}

export interface AIAgentRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  serverData?: any;
  metadata?: Record<string, any>;
}

export class AIAgentEngine {
  private static instance: AIAgentEngine;
  private config: AIAgentConfig;
  private mcpProcessor: MCPProcessor;
  private intentClassifier: IntentClassifier;
  private responseGenerator: ResponseGenerator;
  private contextManager: ContextManager;
  private actionExecutor: ActionExecutor;
  private modeManager: ModeManager;
  private thinkingProcessor: ThinkingProcessor;
  private adminLogger: AdminLogger;
  private isInitialized: boolean = false;

  private constructor(config: AIAgentConfig) {
    this.config = config;
    this.mcpProcessor = MCPProcessor.getInstance();
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    this.contextManager = new ContextManager();
    this.actionExecutor = new ActionExecutor();
    this.modeManager = new ModeManager(createDefaultModeConfig());
    this.thinkingProcessor = new ThinkingProcessor();
    this.adminLogger = new AdminLogger();
  }

  /**
   * 싱글톤 인스턴스 생성/반환
   */
  static getInstance(config?: AIAgentConfig): AIAgentEngine {
    if (!AIAgentEngine.instance) {
      const defaultConfig: AIAgentConfig = {
        enableMCP: true,
        enableNPU: true,
        maxContextLength: 4096,
        responseTimeout: 5000,
        debugMode: process.env.NODE_ENV === 'development',
        mode: 'basic',
        enableThinking: true,
        enableAdminLogging: true
      };
      AIAgentEngine.instance = new AIAgentEngine(config || defaultConfig);
    }
    return AIAgentEngine.instance;
  }

  /**
   * AI 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 OpenManager AI Agent Engine 초기화 중...');
      
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

      this.isInitialized = true;
      console.log('🎉 AI Agent Engine 초기화 완료!');

    } catch (error) {
      console.error('❌ AI Agent Engine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 메인 AI 질의 처리 메서드
   */
  async processQuery(request: AIAgentRequest): Promise<AIAgentResponse> {
    const startTime = Date.now();
    const sessionId = request.sessionId || this.generateSessionId();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 1. 컨텍스트 로드 및 업데이트
      const context = await this.contextManager.loadContext(sessionId, request.context);
      
      // 2. 의도 분류 (NPU 시뮬레이션)
      const intent = await this.intentClassifier.classify(request.query, context);
      
      // 3. MCP 프로세서를 통한 추가 분석
      let mcpResponse;
      if (this.config.enableMCP) {
        mcpResponse = await this.mcpProcessor.processQuery(request.query, request.serverData);
      }

      // 4. 응답 생성
      const response = await this.responseGenerator.generate({
        query: request.query,
        intent,
        context,
        serverData: request.serverData,
        mcpResponse
      });

      // 5. 액션 추출 및 실행 준비
      const actions = await this.actionExecutor.extractActions(intent, response);

      // 6. 컨텍스트 업데이트
      await this.contextManager.updateContext(sessionId, {
        lastQuery: request.query,
        lastIntent: intent.name,
        lastResponse: response.text
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: response.text,
        intent: {
          name: intent.name,
          confidence: intent.confidence,
          entities: intent.entities
        },
        actions,
        context: context,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          engineVersion: '1.0.0',
          sessionId
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ AI Agent 질의 처리 실패:', error);
      
      return {
        success: false,
        response: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
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
          engineVersion: '1.0.0',
          sessionId
        },
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 빠른 상태 확인
   */
  async getQuickStatus(): Promise<AIAgentResponse> {
    return this.processQuery({
      query: '전체 시스템 상태를 간단히 알려주세요'
    });
  }

  /**
   * 성능 분석
   */
  async analyzePerformance(serverId?: string): Promise<AIAgentResponse> {
    const query = serverId 
      ? `${serverId} 서버의 성능을 분석해주세요`
      : '전체 시스템 성능을 분석해주세요';
      
    return this.processQuery({ query, serverData: { serverId } });
  }

  /**
   * 로그 분석
   */
  async analyzeLogs(serverId?: string): Promise<AIAgentResponse> {
    const query = serverId
      ? `${serverId} 서버의 로그를 분석해주세요`
      : '전체 시스템 로그를 분석해주세요';
      
    return this.processQuery({ query, serverData: { serverId } });
  }

  /**
   * 엔진 상태 확인
   */
  getEngineStatus() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 엔진 종료
   */
  async shutdown(): Promise<void> {
    console.log('🔄 AI Agent Engine 종료 중...');
    
    await this.contextManager.cleanup?.();
    await this.actionExecutor.cleanup?.();
    
    this.isInitialized = false;
    console.log('✅ AI Agent Engine 종료 완료');
  }
}

// 기본 인스턴스 export
export const aiAgentEngine = AIAgentEngine.getInstance(); 