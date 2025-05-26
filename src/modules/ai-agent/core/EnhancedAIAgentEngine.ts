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
import { aiDatabase } from '../../../lib/database';

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
    let analysis: QueryAnalysis | undefined;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 1. 쿼리 분석 및 자동 모드 선택 (강제 모드가 지정되지 않은 경우)
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
          userId: request.userId,
          query: request.query,
          queryType: result.intent.name,
          mode: analysis.detectedMode,
          powerMode: 'active',
          response: result.response,
          responseTime: processingTime,
          success: result.success,
          intent: result.intent,
          thinkingSessionId,
          metadata: {
            serverData: request.serverData,
            contextLength: JSON.stringify(result.context).length,
            cacheHit: false,
            pluginsUsed: []
          }
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
          userId: request.userId,
          errorType: 'processing',
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
          errorStack: error instanceof Error ? error.stack : undefined,
          query: request.query,
          mode: analysis?.detectedMode || 'basic',
          systemInfo: {
            memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0,
            activeSessions: 1,
            powerMode: 'active'
          },
          recovered: false
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
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis'>> {
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
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis'>> {
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
  ): Promise<Omit<EnhancedAIAgentResponse, 'mode' | 'analysis'>> {
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
    
    // 1. 서버 데이터 심층 분석 (서버 데이터가 있는 경우)
    let serverAnalysis = "";
    let rootCauses = [];
    let recommendedActions = [];
    
    if (request.serverData) {
      try {
        // 1.1 시스템 지표 분석
        const systemMetrics = this.analyzeSystemMetrics(request.serverData);
        
        // 1.2 로그 패턴 분석
        const logPatterns = this.analyzeLogPatterns(request.serverData.logs || []);
        
        // 1.3 문제 패턴 매칭
        const knownIssues = await this.matchKnownIssuePatterns(systemMetrics, logPatterns);
        
        // 1.4 루트 원인 분석
        rootCauses = this.identifyRootCauses(knownIssues, systemMetrics, logPatterns);
        
        // 1.5 해결책 및 완화 조치 추천
        recommendedActions = await this.suggestRemediationActions(rootCauses, request.serverData);
        
        // 서버 분석 데이터 저장
        serverAnalysis = JSON.stringify({
          systemMetrics,
          logPatterns,
          knownIssues,
          rootCauses,
          recommendedActions
        });
        
        // 컨텍스트에 분석 결과 추가
        context.serverAnalysis = {
          systemMetrics,
          logPatterns,
          knownIssues,
          rootCauses,
          recommendedActions
        };
      } catch (error) {
        console.error('서버 데이터 분석 중 오류:', error);
        context.analysisError = error.message;
      }
    }
    
    // 2. 고급 인시던트 보고서 프롬프트 생성
    const incidentPrompt = ModePrompts.getIncidentReportPrompt(context);
    
    // 3. 장애 보고서는 항상 Advanced 모드로 처리
    const result = await this.generateAdvancedResponse(
      { ...request, context }, 
      analysis, 
      sessionId
    );
    
    // 4. 장애 분석 데이터를 데이터베이스에 저장 (나중에 참조 가능하도록)
    if (rootCauses.length > 0 || recommendedActions.length > 0) {
      try {
        await aiDatabase.storeIncidentReport({
          sessionId,
          timestamp: new Date().toISOString(),
          userId: request.userId,
          query: request.query,
          serverData: request.serverData ? JSON.stringify(request.serverData) : null,
          analysis: serverAnalysis,
          rootCauses,
          recommendedActions,
          reportId: `incident_${Date.now()}`
        });
      } catch (dbError) {
        console.error('인시던트 보고서 저장 중 오류:', dbError);
      }
    }
    
    // 5. 결과 구조화 및 응답 강화
    const enhancedResponse = this.formatIncidentReport(
      result.response, 
      rootCauses, 
      recommendedActions
    );
    
    return {
      ...result,
      mode: 'advanced',
      analysis: {
        ...analysis,
        detectedMode: 'advanced',
        reasoning: '장애 보고서 자동 생성 - Advanced 모드 강제 적용'
      },
      response: enhancedResponse,
      metadata: {
        ...result.metadata,
        processingTime: Date.now() - startTime,
        incidentDetails: {
          rootCausesCount: rootCauses.length,
          recommendationsCount: recommendedActions.length,
          severity: this.calculateIncidentSeverity(rootCauses, request.serverData),
          category: this.categorizeIncident(rootCauses)
        }
      },
      thinkingSessionId
    };
  }

  /**
   * 시스템 지표 분석
   */
  private analyzeSystemMetrics(serverData: any): any {
    const metrics: any = {
      cpu: { status: 'normal', value: 0, threshold: 80 },
      memory: { status: 'normal', value: 0, threshold: 85 },
      disk: { status: 'normal', value: 0, threshold: 90 },
      network: { status: 'normal', value: 0, threshold: 80 },
      connections: { status: 'normal', value: 0, threshold: 5000 }
    };
    
    // CPU 분석
    if (serverData.cpu !== undefined) {
      metrics.cpu.value = serverData.cpu;
      metrics.cpu.status = serverData.cpu > metrics.cpu.threshold ? 'critical' :
                           serverData.cpu > metrics.cpu.threshold * 0.8 ? 'warning' : 'normal';
    }
    
    // 메모리 분석
    if (serverData.memory !== undefined) {
      metrics.memory.value = serverData.memory;
      metrics.memory.status = serverData.memory > metrics.memory.threshold ? 'critical' :
                              serverData.memory > metrics.memory.threshold * 0.8 ? 'warning' : 'normal';
    }
    
    // 디스크 분석
    if (serverData.disk !== undefined) {
      metrics.disk.value = serverData.disk;
      metrics.disk.status = serverData.disk > metrics.disk.threshold ? 'critical' :
                            serverData.disk > metrics.disk.threshold * 0.8 ? 'warning' : 'normal';
    }
    
    // 네트워크 분석
    if (serverData.network !== undefined) {
      metrics.network.value = serverData.network;
      metrics.network.status = serverData.network > metrics.network.threshold ? 'critical' :
                               serverData.network > metrics.network.threshold * 0.8 ? 'warning' : 'normal';
    }
    
    // 연결 분석
    if (serverData.connections !== undefined) {
      metrics.connections.value = serverData.connections;
      metrics.connections.status = serverData.connections > metrics.connections.threshold ? 'critical' :
                                   serverData.connections > metrics.connections.threshold * 0.8 ? 'warning' : 'normal';
    }
    
    return metrics;
  }

  /**
   * 로그 패턴 분석
   */
  private analyzeLogPatterns(logs: string[]): any {
    const patterns = {
      errors: [] as string[],
      warnings: [] as string[],
      exceptions: [] as string[],
      frequentMessages: {} as Record<string, number>,
      timeoutPatterns: 0,
      connectionRefused: 0,
      permissionDenied: 0,
      criticalPatterns: 0
    };
    
    if (!logs || logs.length === 0) {
      return patterns;
    }
    
    // 간단한 로그 분석
    for (const log of logs) {
      // 에러 감지
      if (log.includes('ERROR') || log.includes('Error') || log.includes('error')) {
        patterns.errors.push(log);
      }
      
      // 경고 감지
      if (log.includes('WARN') || log.includes('Warning') || log.includes('warning')) {
        patterns.warnings.push(log);
      }
      
      // 예외 감지
      if (log.includes('Exception') || log.includes('exception')) {
        patterns.exceptions.push(log);
      }
      
      // 빈도 분석을 위한 메시지 정규화 (타임스탬프 등 제거)
      const normalizedMsg = this.normalizeLogMessage(log);
      patterns.frequentMessages[normalizedMsg] = (patterns.frequentMessages[normalizedMsg] || 0) + 1;
      
      // 특정 패턴 감지
      if (log.includes('timeout') || log.includes('Timeout')) {
        patterns.timeoutPatterns++;
      }
      
      if (log.includes('connection refused') || log.includes('Connection refused')) {
        patterns.connectionRefused++;
      }
      
      if (log.includes('permission denied') || log.includes('Permission denied')) {
        patterns.permissionDenied++;
      }
      
      if (log.includes('CRITICAL') || log.includes('FATAL') || log.includes('EMERGENCY')) {
        patterns.criticalPatterns++;
      }
    }
    
    return patterns;
  }

  /**
   * 로그 메시지 정규화
   */
  private normalizeLogMessage(message: string): string {
    // 타임스탬프 제거
    let normalized = message.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z?/g, '');
    normalized = normalized.replace(/\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s[+-]\d{4}\]/g, '');
    
    // IP 주소 제거
    normalized = normalized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP_ADDRESS');
    
    // UUID 제거
    normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, 'UUID');
    
    // 공백 제거 및 압축
    normalized = normalized.trim().replace(/\s+/g, ' ');
    
    return normalized;
  }

  /**
   * 알려진 문제 패턴 매칭
   */
  private async matchKnownIssuePatterns(systemMetrics: any, logPatterns: any): Promise<any[]> {
    // 알려진 문제 패턴 목록
    const knownPatterns = [
      {
        id: 'MEM_LEAK',
        name: '메모리 누수',
        description: '시간이 지남에 따라 메모리 사용량이 지속적으로 증가',
        conditions: [
          () => systemMetrics.memory.status === 'critical',
          () => logPatterns.errors.some(e => e.includes('OutOfMemory'))
        ]
      },
      {
        id: 'DISK_FULL',
        name: '디스크 공간 부족',
        description: '디스크 공간이 부족하여 쓰기 작업 실패',
        conditions: [
          () => systemMetrics.disk.status === 'critical',
          () => logPatterns.errors.some(e => e.includes('No space left on device'))
        ]
      },
      {
        id: 'DB_CONN',
        name: '데이터베이스 연결 문제',
        description: '데이터베이스 서버 연결 실패 또는 지연',
        conditions: [
          () => logPatterns.connectionRefused > 0,
          () => logPatterns.errors.some(e => e.includes('database') || e.includes('DB') || e.includes('SQL'))
        ]
      },
      {
        id: 'API_TIMEOUT',
        name: 'API 타임아웃',
        description: '외부 API 호출 시 응답 시간 초과',
        conditions: [
          () => logPatterns.timeoutPatterns > 0,
          () => logPatterns.errors.some(e => e.includes('API') || e.includes('request'))
        ]
      },
      {
        id: 'AUTH_FAIL',
        name: '인증 실패',
        description: '인증 서비스 장애 또는 권한 문제',
        conditions: [
          () => logPatterns.permissionDenied > 0,
          () => logPatterns.errors.some(e => e.includes('authentication') || e.includes('permission') || e.includes('unauthorized'))
        ]
      },
      {
        id: 'HIGH_CPU',
        name: 'CPU 과부하',
        description: 'CPU 사용률이 임계값을 초과',
        conditions: [
          () => systemMetrics.cpu.status === 'critical'
        ]
      }
    ];
    
    // 조건에 맞는 패턴 반환
    return knownPatterns.filter(pattern => {
      return pattern.conditions.every(condition => {
        try {
          return condition();
        } catch (error) {
          return false;
        }
      });
    });
  }

  /**
   * 루트 원인 식별
   */
  private identifyRootCauses(knownIssues: any[], systemMetrics: any, logPatterns: any): any[] {
    const rootCauses: any[] = [];
    
    // 알려진 이슈 기반 원인 추가
    for (const issue of knownIssues) {
      rootCauses.push({
        type: issue.id,
        name: issue.name,
        description: issue.description,
        confidence: 80,
        evidence: this.collectEvidence(issue, systemMetrics, logPatterns)
      });
    }
    
    // 시스템 지표 기반 추가 원인 분석
    if (systemMetrics.memory.status === 'critical' && !rootCauses.some(c => c.type === 'MEM_LEAK')) {
      rootCauses.push({
        type: 'HIGH_MEM',
        name: '높은 메모리 사용률',
        description: '메모리 사용률이 임계값 초과',
        confidence: 70,
        evidence: [`메모리 사용률: ${systemMetrics.memory.value}% (임계값: ${systemMetrics.memory.threshold}%)`]
      });
    }
    
    // 로그 패턴 기반 추가 원인 분석
    if (logPatterns.exceptions.length > 0 && !rootCauses.some(c => c.type.includes('EXCEPTION'))) {
      const exceptions = logPatterns.exceptions.slice(0, 3);
      rootCauses.push({
        type: 'EXCEPTION',
        name: '예외 발생',
        description: '애플리케이션에서 처리되지 않은 예외 발생',
        confidence: 75,
        evidence: exceptions
      });
    }
    
    return rootCauses;
  }

  /**
   * 증거 수집
   */
  private collectEvidence(issue: any, systemMetrics: any, logPatterns: any): string[] {
    const evidence: string[] = [];
    
    switch (issue.id) {
      case 'MEM_LEAK':
        evidence.push(`메모리 사용률: ${systemMetrics.memory.value}% (임계값: ${systemMetrics.memory.threshold}%)`);
        evidence.push(...logPatterns.errors.filter(e => e.includes('OutOfMemory') || e.includes('memory')).slice(0, 2));
        break;
        
      case 'DISK_FULL':
        evidence.push(`디스크 사용률: ${systemMetrics.disk.value}% (임계값: ${systemMetrics.disk.threshold}%)`);
        evidence.push(...logPatterns.errors.filter(e => e.includes('space') || e.includes('disk')).slice(0, 2));
        break;
        
      case 'DB_CONN':
        evidence.push(`데이터베이스 관련 오류: ${logPatterns.errors.filter(e => e.includes('database') || e.includes('DB')).length}건`);
        evidence.push(...logPatterns.errors.filter(e => e.includes('database') || e.includes('DB')).slice(0, 2));
        break;
        
      case 'API_TIMEOUT':
        evidence.push(`타임아웃 패턴 발생 횟수: ${logPatterns.timeoutPatterns}건`);
        evidence.push(...logPatterns.errors.filter(e => e.includes('timeout') || e.includes('Timeout')).slice(0, 2));
        break;
        
      case 'AUTH_FAIL':
        evidence.push(`권한 거부 발생 횟수: ${logPatterns.permissionDenied}건`);
        evidence.push(...logPatterns.errors.filter(e => e.includes('authentication') || e.includes('permission')).slice(0, 2));
        break;
        
      case 'HIGH_CPU':
        evidence.push(`CPU 사용률: ${systemMetrics.cpu.value}% (임계값: ${systemMetrics.cpu.threshold}%)`);
        break;
    }
    
    return evidence;
  }

  /**
   * 해결책 및 완화 조치 추천
   */
  private async suggestRemediationActions(rootCauses: any[], serverData: any): Promise<any[]> {
    const actions: any[] = [];
    
    for (const cause of rootCauses) {
      switch (cause.type) {
        case 'MEM_LEAK':
          actions.push({
            id: 'ACTION_RESTART',
            name: '서비스 재시작',
            description: '임시 조치로 서비스를 재시작하여 메모리 확보',
            urgency: 'high',
            complexity: 'low'
          });
          
          actions.push({
            id: 'ACTION_HEAP_DUMP',
            name: '힙 덤프 생성',
            description: '메모리 누수 원인 분석을 위해 힙 덤프 생성 및 분석',
            urgency: 'medium',
            complexity: 'medium'
          });
          break;
          
        case 'DISK_FULL':
          actions.push({
            id: 'ACTION_CLEANUP',
            name: '디스크 정리',
            description: '로그 파일 및 임시 파일 정리로 디스크 공간 확보',
            urgency: 'high',
            complexity: 'low'
          });
          
          actions.push({
            id: 'ACTION_ADD_STORAGE',
            name: '스토리지 확장',
            description: '디스크 공간 추가 할당 또는 확장',
            urgency: 'medium',
            complexity: 'medium'
          });
          break;
          
        case 'DB_CONN':
          actions.push({
            id: 'ACTION_DB_RESTART',
            name: 'DB 서비스 재시작',
            description: '데이터베이스 서비스 재시작',
            urgency: 'high',
            complexity: 'medium'
          });
          
          actions.push({
            id: 'ACTION_CONNECTION_POOL',
            name: '연결 풀 최적화',
            description: '데이터베이스 연결 풀 설정 검토 및 최적화',
            urgency: 'medium',
            complexity: 'medium'
          });
          break;
          
        case 'API_TIMEOUT':
          actions.push({
            id: 'ACTION_TIMEOUT_INCREASE',
            name: '타임아웃 설정 증가',
            description: '임시 조치로 API 호출 타임아웃 값 증가',
            urgency: 'medium',
            complexity: 'low'
          });
          
          actions.push({
            id: 'ACTION_CIRCUIT_BREAKER',
            name: '서킷 브레이커 적용',
            description: '장애 내성을 위한 서킷 브레이커 패턴 구현',
            urgency: 'medium',
            complexity: 'high'
          });
          break;
          
        case 'AUTH_FAIL':
          actions.push({
            id: 'ACTION_CHECK_CREDENTIALS',
            name: '자격 증명 확인',
            description: 'API 키, 토큰, 비밀번호 등의 자격 증명 확인',
            urgency: 'high',
            complexity: 'low'
          });
          break;
          
        case 'HIGH_CPU':
          actions.push({
            id: 'ACTION_SCALE_UP',
            name: '리소스 스케일 업',
            description: 'CPU 리소스 증설 또는 인스턴스 확장',
            urgency: 'medium',
            complexity: 'medium'
          });
          
          actions.push({
            id: 'ACTION_OPTIMIZE',
            name: '코드 최적화',
            description: 'CPU 사용량이 많은 코드 경로 식별 및 최적화',
            urgency: 'medium',
            complexity: 'high'
          });
          break;
          
        default:
          actions.push({
            id: 'ACTION_MONITOR',
            name: '모니터링 강화',
            description: '추가적인 로그 및 지표 수집으로 상세 원인 파악',
            urgency: 'medium',
            complexity: 'medium'
          });
      }
    }
    
    // 항상 제안하는 일반적인 조치
    if (actions.length === 0) {
      actions.push({
        id: 'ACTION_GENERAL_MONITORING',
        name: '모니터링 강화',
        description: '추가적인 로그 및 지표 수집으로 상세 원인 파악',
        urgency: 'medium',
        complexity: 'medium'
      });
    }
    
    return actions;
  }

  /**
   * 인시던트 심각도 계산
   */
  private calculateIncidentSeverity(rootCauses: any[], serverData: any): string {
    if (!rootCauses || rootCauses.length === 0) {
      return 'low';
    }
    
    // 심각도 점수 계산
    let score = 0;
    
    // 원인 유형별 가중치
    for (const cause of rootCauses) {
      switch (cause.type) {
        case 'MEM_LEAK':
        case 'DISK_FULL':
        case 'DB_CONN':
          score += 3;
          break;
          
        case 'API_TIMEOUT':
        case 'HIGH_CPU':
          score += 2;
          break;
          
        case 'AUTH_FAIL':
          score += 1;
          break;
          
        default:
          score += 1;
      }
    }
    
    // 시스템 지표 기반 추가 점수
    if (serverData) {
      if (serverData.cpu > 90) score += 2;
      if (serverData.memory > 90) score += 2;
      if (serverData.disk > 95) score += 2;
    }
    
    // 심각도 결정
    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * 인시던트 분류
   */
  private categorizeIncident(rootCauses: any[]): string {
    if (!rootCauses || rootCauses.length === 0) {
      return 'unknown';
    }
    
    // 가장 빈번한 원인 유형 확인
    const typeCount: Record<string, number> = {};
    for (const cause of rootCauses) {
      typeCount[cause.type.split('_')[0]] = (typeCount[cause.type.split('_')[0]] || 0) + 1;
    }
    
    // 가장 많은 유형 찾기
    let maxCount = 0;
    let category = 'unknown';
    
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) {
        maxCount = count;
        category = type;
      }
    }
    
    // 카테고리 매핑
    const categoryMap: Record<string, string> = {
      'MEM': 'memory',
      'DISK': 'storage',
      'DB': 'database',
      'API': 'network',
      'AUTH': 'security',
      'HIGH': 'resource',
      'EXCEPTION': 'application'
    };
    
    return categoryMap[category] || 'system';
  }

  /**
   * 인시던트 보고서 형식화
   */
  private formatIncidentReport(
    baseResponse: string, 
    rootCauses: any[], 
    recommendedActions: any[]
  ): string {
    // 기본 보고서 형식
    let report = `# 🚨 자동 장애 분석 보고서\n\n`;
    
    // 기존 응답 내용 추가
    report += `## 🔍 분석 요약\n\n${baseResponse}\n\n`;
    
    // 원인 분석 섹션 추가
    if (rootCauses.length > 0) {
      report += `## 🧐 발견된 루트 원인\n\n`;
      
      for (const cause of rootCauses) {
        report += `### ${cause.name}\n`;
        report += `- **설명:** ${cause.description}\n`;
        report += `- **신뢰도:** ${cause.confidence}%\n`;
        
        if (cause.evidence && cause.evidence.length > 0) {
          report += `- **증거:**\n`;
          for (const evidence of cause.evidence) {
            report += `  - ${evidence}\n`;
          }
        }
        report += `\n`;
      }
    }
    
    // 권장 조치 섹션 추가
    if (recommendedActions.length > 0) {
      report += `## 🛠️ 권장 조치\n\n`;
      
      for (const action of recommendedActions) {
        report += `### ${action.name}\n`;
        report += `- **설명:** ${action.description}\n`;
        report += `- **긴급도:** ${this.translateUrgency(action.urgency)}\n`;
        report += `- **복잡도:** ${this.translateComplexity(action.complexity)}\n\n`;
      }
    }
    
    // 재발 방지 섹션 추가
    report += `## 🔄 재발 방지 조치\n\n`;
    report += `1. **모니터링 강화:** 유사한 패턴을 조기에 감지할 수 있도록 알림 설정\n`;
    report += `2. **자동화된 복구:** 발견된 문제에 대한 자동 복구 절차 구현\n`;
    report += `3. **정기적인 점검:** 시스템 리소스 및 로그 정기 검토\n`;
    
    return report;
  }

  /**
   * 긴급도 번역
   */
  private translateUrgency(urgency: string): string {
    const map: Record<string, string> = {
      'high': '높음 🔴',
      'medium': '중간 🟠',
      'low': '낮음 🟢'
    };
    return map[urgency] || urgency;
  }

  /**
   * 복잡도 번역
   */
  private translateComplexity(complexity: string): string {
    const map: Record<string, string> = {
      'high': '높음 ⚠️',
      'medium': '중간 ⚙️',
      'low': '낮음 ✅'
    };
    return map[complexity] || complexity;
  }

  /**
   * 장애 보고서 요청 감지
   */
  private isIncidentReportRequest(query: string): boolean {
    const incidentKeywords = [
      '장애 보고서', '인시던트 리포트', 'incident report',
      '종합 보고서', '자동 보고서', '장애 분석', '장애 원인',
      '서버 문제', '시스템 장애', '에러 분석', '원인 분석',
      '이슈 분석', '서버 다운', '서비스 장애'
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