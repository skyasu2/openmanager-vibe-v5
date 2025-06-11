/**
 * OpenManager AI Agent Engine
 *
 * �� 지능형 경량 AI 추론 엔진
 * ⚡ 현재: LLM API 없는 완전 독립 실시간 AI 추론
 * - MCP(Model Context Protocol) 기반 의도 분류
 * - 도메인 특화 서버 모니터링 AI
 * 🚀 향후: 선택적 LLM API 연동으로 고급 추론 기능 확장 계획
 */

import { MCPProcessor } from '@/services/mcp';
import { IntentClassifier } from '../processors/IntentClassifier';
import { ResponseGenerator } from '../processors/ResponseGenerator';
import { ContextManager } from '../processors/ContextManager';
import { ActionExecutor } from '../processors/ActionExecutor';
import {
  ModeManager,
  createDefaultModeConfig,
  AIAgentMode,
} from './ModeManager';
import { ThinkingProcessor } from './ThinkingProcessor';
import { AdminLogger } from './AdminLogger';
import { thinkingLogger } from './ThinkingLogger';

export interface AIAgentConfig {
  enableMCP: boolean;
  enableInference: boolean;
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
    thinkingSessionId?: string;
    error?: string;
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
        enableInference: true,
        maxContextLength: 4096,
        responseTimeout: 5000,
        debugMode: process.env.NODE_ENV === 'development',
        mode: 'basic',
        enableThinking: true,
        enableAdminLogging: true,
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
    const thinkingSessionId = `thinking_${sessionId}`;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 🧠 사고 과정 로깅 시작
      thinkingLogger.startSession(thinkingSessionId, request.query);

      // 1. 컨텍스트 로드 및 업데이트
      thinkingLogger.startStep(
        thinkingSessionId,
        '컨텍스트 로드',
        'data_processing'
      );
      const context = (await this.contextManager.loadContext(sessionId)) || {
        conversationId: sessionId,
        userIntent: '',
        previousActions: [],
        currentState: request.context || {},
        metadata: {},
      };
      thinkingLogger.logStep(
        thinkingSessionId,
        `세션 컨텍스트 로드 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 세션 ID: ${sessionId}
📊 컨텍스트 키: ${Object.keys(context).length}개
💾 컨텍스트 크기: ${JSON.stringify(context).length} bytes
⏱️ 기존 세션: ${context.lastQuery ? '재개' : '새로운 세션'}
🔄 컨텍스트 상태: 정상`,
        'data_processing',
        {
          contextKeys: Object.keys(context).length,
          sessionType: context.lastQuery ? 'resumed' : 'new',
        }
      );

      // 2. 의도 분류 (AI 추론)
      thinkingLogger.startStep(
        thinkingSessionId,
        '의도 분류 (AI 추론)',
        'analysis'
      );
      const intent = await this.intentClassifier.classify(request.query);
      thinkingLogger.logStep(
        thinkingSessionId,
        `AI 의도 분류 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 분류된 의도: ${intent.name}
📊 신뢰도: ${(intent.confidence * 100).toFixed(1)}%
🏷️ 추출된 엔티티: ${Object.keys(intent.entities).length}개
📝 엔티티 상세: ${JSON.stringify(intent.entities, null, 2)}
🔍 분류 알고리즘: 자연어 처리 + 기계학습
✨ 분류 성공: ${intent.confidence > 0.7 ? '높은 신뢰도' : '추가 분석 필요'}`,
        'analysis',
        {
          intent: intent.name,
          confidence: intent.confidence,
          entityCount: Object.keys(intent.entities).length,
        }
      );

      // 3. MCP 프로세서를 통한 추가 분석
      let mcpResponse;
      if (this.config.enableMCP) {
        thinkingLogger.startStep(
          thinkingSessionId,
          'MCP 서버 분석',
          'data_processing'
        );
        mcpResponse = await this.mcpProcessor.processQuery(
          request.query,
          request.serverData
        );
        thinkingLogger.logStep(
          thinkingSessionId,
          `MCP 서버 분석 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ 서버 데이터: ${Array.isArray(request.serverData) ? request.serverData.length : 0}개 서버 분석
🔄 MCP 프로토콜: 활성화
📈 분석 결과: ${mcpResponse?.intent?.intent || '일반 분석'}
🎯 응답 액션: ${mcpResponse?.actions?.length || 0}개
⚡ 처리 상태: 성공
💡 권장사항: ${mcpResponse?.actions?.join(', ') || '없음'}`,
          'data_processing',
          {
            serverCount: Array.isArray(request.serverData)
              ? request.serverData.length
              : 0,
            mcpIntent: mcpResponse?.intent?.intent,
          }
        );
      }

      // 4. 응답 생성
      thinkingLogger.startStep(
        thinkingSessionId,
        'AI 응답 생성',
        'response_generation'
      );
      const response = await this.responseGenerator.generate({
        query: request.query,
        intent,
        context,
        serverData: request.serverData,
        mcpResponse,
      });
      thinkingLogger.logStep(
        thinkingSessionId,
        `AI 응답 생성 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
📝 응답 텍스트: ${response.text.length}자
🎨 응답 형식: ${response.format || '텍스트'}
🌟 응답 품질: ${response.confidence ? (response.confidence * 100).toFixed(1) + '%' : '평가됨'}
🔧 사용된 템플릿: ${response.template || '동적 생성'}
💬 톤: ${response.tone || '전문적'}
🎯 타겟 사용자: ${response.audience || '일반 사용자'}`,
        'response_generation',
        {
          responseLength: response.text.length,
          confidence: response.confidence,
          format: response.format,
        }
      );

      // 5. 액션 추출 및 실행 준비
      thinkingLogger.startStep(
        thinkingSessionId,
        '액션 추출',
        'pattern_matching'
      );
      const actions = await this.actionExecutor.extractActions(
        intent,
        response
      );
      thinkingLogger.logStep(
        thinkingSessionId,
        `액션 추출 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 추출된 액션: ${actions.length}개
📋 액션 목록: ${actions.join(', ') || '없음'}
🔄 실행 가능 여부: ${actions.length > 0 ? '예' : '액션 없음'}
🎯 권장 우선순위: ${actions.length > 0 ? '높음' : '해당 없음'}
💼 액션 카테고리: 시스템 관리`,
        'pattern_matching',
        { actionCount: actions.length, hasActions: actions.length > 0 }
      );

      // 6. 컨텍스트 업데이트
      thinkingLogger.startStep(
        thinkingSessionId,
        '컨텍스트 업데이트',
        'data_processing'
      );
      await this.contextManager.updateContext(sessionId, {
        lastQuery: request.query,
        lastIntent: intent.name,
        lastResponse: response.text,
      });
      thinkingLogger.logStep(
        thinkingSessionId,
        `컨텍스트 업데이트 완료:
━━━━━━━━━━━━━━━━━━━━━━━━━
💾 세션 상태: 저장됨
🔄 마지막 질의: 업데이트됨
🎯 마지막 의도: ${intent.name}
📝 마지막 응답: 저장됨 (${response.text.length}자)
⏱️ 업데이트 시간: ${new Date().toLocaleTimeString('ko-KR')}`,
        'data_processing',
        { sessionId, lastIntent: intent.name }
      );

      // 🧠 사고 과정 완료
      thinkingLogger.completeSession(thinkingSessionId);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: response.text,
        intent: {
          name: intent.name,
          confidence: intent.confidence,
          entities: intent.entities,
        },
        actions,
        context: context,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          engineVersion: '1.0.0',
          sessionId,
          thinkingSessionId,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // 🧠 사고 과정 에러 로깅
      thinkingLogger.errorSession(
        thinkingSessionId,
        error instanceof Error ? error.message : '알 수 없는 오류'
      );

      console.error('❌ AI Agent 질의 처리 실패:', error);

      return {
        success: false,
        response: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
        intent: {
          name: 'error',
          confidence: 0,
          entities: {},
        },
        actions: [],
        context: {},
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          engineVersion: '1.0.0',
          sessionId,
          thinkingSessionId,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        },
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 빠른 상태 확인
   */
  async getQuickStatus(): Promise<AIAgentResponse> {
    return this.processQuery({
      query: '전체 시스템 상태를 간단히 알려주세요',
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
    const uptime =
      typeof process !== 'undefined' && typeof process.uptime === 'function'
        ? process.uptime()
        : 0;
    const memory =
      typeof process !== 'undefined' &&
      typeof process.memoryUsage === 'function'
        ? process.memoryUsage()
        : { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };

    return {
      isInitialized: this.isInitialized,
      config: this.config,
      version: '1.0.0',
      uptime,
      memory,
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
