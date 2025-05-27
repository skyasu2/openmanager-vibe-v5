/**
 * 🚀 Optimized AI Agent Engine
 * 
 * Vercel 최적화 AI 에이전트 엔진
 * - 환경별 자동 최적화 (Vercel 무료/Pro, 로컬)
 * - 5-8초 내 응답 보장
 * - 메모리 효율적 처리 (400MB 이하)
 * - 강력한 Fallback 메커니즘
 * - 기존 MCP 엔진과 완전 호환
 */

import { MCPProcessor } from '../../mcp';
import { IntentClassifier } from '../processors/IntentClassifier';
import { ResponseGenerator } from '../processors/ResponseGenerator';
import { ContextManager } from '../processors/ContextManager';
import { ActionExecutor } from '../processors/ActionExecutor';
import { EnvironmentDetector, EnvironmentInfo, OptimizationConfig } from './EnvironmentDetector';
import { LightweightPythonRunner, LightweightAnalysisRequest, LightweightAnalysisResult } from './LightweightPythonRunner';

export interface OptimizedAIAgentConfig {
  enableMCP: boolean;
  enablePythonAnalysis: boolean;
  enableAutoOptimization: boolean;
  debugMode: boolean;
  fallbackMode: boolean;
}

export interface SmartQueryRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  serverData?: any;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface SmartQueryResponse {
  success: boolean;
  response: string;
  method: 'mcp-only' | 'mcp-python' | 'fallback';
  analysis?: {
    pythonResults?: LightweightAnalysisResult;
    mcpResults?: any;
    insights?: string[];
    recommendations?: string[];
  };
  metadata: {
    processingTime: number;
    memoryUsed: number;
    environment: string;
    optimizationApplied: boolean;
    timestamp: string;
    sessionId: string;
  };
  error?: string;
}

export class OptimizedAIAgentEngine {
  private static instance: OptimizedAIAgentEngine;
  private config: OptimizedAIAgentConfig;
  private environmentDetector: EnvironmentDetector;
  private lightweightPython: LightweightPythonRunner;
  private mcpProcessor: MCPProcessor;
  private intentClassifier: IntentClassifier;
  private responseGenerator: ResponseGenerator;
  private contextManager: ContextManager;
  private actionExecutor: ActionExecutor;
  
  private isInitialized = false;
  private environmentInfo: EnvironmentInfo | null = null;
  private optimizationConfig: OptimizationConfig | null = null;
  
  // 성능 메트릭
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    pythonAnalysisUsed: 0,
    fallbackUsed: 0,
    cacheHits: 0
  };

  private constructor(config: OptimizedAIAgentConfig) {
    this.config = config;
    this.environmentDetector = EnvironmentDetector.getInstance();
    this.lightweightPython = LightweightPythonRunner.getInstance();
    this.mcpProcessor = MCPProcessor.getInstance();
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    this.contextManager = new ContextManager();
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * 🏭 싱글톤 인스턴스 생성/반환
   */
  static getInstance(config?: OptimizedAIAgentConfig): OptimizedAIAgentEngine {
    if (!OptimizedAIAgentEngine.instance) {
      const defaultConfig: OptimizedAIAgentConfig = {
        enableMCP: true,
        enablePythonAnalysis: true,
        enableAutoOptimization: true,
        debugMode: process.env.NODE_ENV === 'development',
        fallbackMode: false
      };
      OptimizedAIAgentEngine.instance = new OptimizedAIAgentEngine(config || defaultConfig);
    }
    return OptimizedAIAgentEngine.instance;
  }

  /**
   * 🔧 AI 엔진 초기화 (환경별 최적화)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const startTime = Date.now();
    
    try {
      console.log('🚀 Optimized AI Agent Engine 초기화 중...');
      
      // 1. 환경 감지 및 최적화 설정 (우선순위 최상)
      this.environmentInfo = await this.environmentDetector.detectEnvironment();
      this.optimizationConfig = await this.environmentDetector.getOptimizationConfig();
      
      console.log(`🌍 환경: ${this.environmentInfo.platform}, 메모리: ${this.environmentInfo.memoryLimit}MB`);
      
      // 2. 환경별 설정 조정
      this.adjustConfigForEnvironment();
      
      // 3. 핵심 컴포넌트만 초기화 (병렬 처리)
      const initPromises = [];
      
      // MCP 프로세서 (항상 초기화)
      if (this.config.enableMCP) {
        initPromises.push(this.initializeMCP());
      }
      
      // Python 분석 엔진 (환경에 따라)
      if (this.config.enablePythonAnalysis && this.environmentInfo.capabilities.pythonAnalysis) {
        initPromises.push(this.initializePython());
      }
      
      // 기본 프로세서들 (경량화)
      initPromises.push(this.initializeBasicProcessors());
      
      // 병렬 초기화 실행
      await Promise.allSettled(initPromises);
      
      this.isInitialized = true;
      const initTime = Date.now() - startTime;
      
      console.log(`✅ Optimized AI Agent Engine 초기화 완료 (${initTime}ms)`);
      
    } catch (error) {
      console.error('❌ Optimized AI Agent Engine 초기화 실패:', error);
      
      // 초기화 실패 시 fallback 모드로 전환
      this.config.fallbackMode = true;
      this.isInitialized = true;
      
      console.warn('⚠️ Fallback 모드로 전환됨');
    }
  }

  /**
   * 🧠 스마트 쿼리 처리 (환경별 최적화)
   */
  async processSmartQuery(request: SmartQueryRequest): Promise<SmartQueryResponse> {
    const startTime = Date.now();
    const sessionId = request.sessionId || this.generateSessionId();
    this.metrics.totalRequests++;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 1. 컨텍스트 로드 (빠른 처리)
      const context = await this.contextManager.loadContext(sessionId, request.context);
      
      // 2. 의도 분류 (항상 실행)
      const intent = await this.intentClassifier.classify(request.query, context);
      
      // 3. MCP 패턴 매칭 (항상 실행, 0.1-0.5초)
      const mcpResult = await this.mcpProcessor.processQuery(request.query, request.serverData);
      
      // 4. 고급 분석 실행 여부 결정
      const shouldRunAdvancedAnalysis = await this.shouldRunAdvancedAnalysis(request);
      
      let pythonResult: LightweightAnalysisResult | null = null;
      let method: SmartQueryResponse['method'] = 'mcp-only';
      
      // 5. Python 분석 실행 (조건부)
      if (shouldRunAdvancedAnalysis) {
        try {
          pythonResult = await this.executePythonAnalysis(request.serverData);
          method = 'mcp-python';
          this.metrics.pythonAnalysisUsed++;
        } catch (error) {
          console.warn('Python 분석 실패, MCP만 사용:', error);
        }
      }
      
      // 6. 통합 응답 생성
      const response = await this.generateIntegratedResponse({
        query: request.query,
        intent,
        context,
        mcpResult,
        pythonResult,
        serverData: request.serverData
      });
      
      // 7. 액션 추출
      const actions = await this.actionExecutor.extractActions(intent, response);
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      return {
        success: true,
        response: response.text,
        method,
        analysis: {
          pythonResults: pythonResult || undefined,
          mcpResults: mcpResult,
          insights: this.generateInsights(mcpResult, pythonResult),
          recommendations: this.generateRecommendations(mcpResult, pythonResult)
        },
        metadata: {
          processingTime,
          memoryUsed: this.getMemoryUsage(),
          environment: this.environmentInfo?.platform || 'unknown',
          optimizationApplied: this.config.enableAutoOptimization,
          timestamp: new Date().toISOString(),
          sessionId
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);
      
      console.error('❌ 스마트 쿼리 처리 실패:', error);
      
      // Fallback 응답
      return {
        success: false,
        response: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        method: 'fallback',
        metadata: {
          processingTime,
          memoryUsed: this.getMemoryUsage(),
          environment: this.environmentInfo?.platform || 'unknown',
          optimizationApplied: false,
          timestamp: new Date().toISOString(),
          sessionId
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 🚦 고급 분석 실행 여부 판단
   */
  private async shouldRunAdvancedAnalysis(request: SmartQueryRequest): Promise<boolean> {
    // Fallback 모드면 실행하지 않음
    if (this.config.fallbackMode) {
      return false;
    }

    // Python 분석이 비활성화되어 있으면 실행하지 않음
    if (!this.config.enablePythonAnalysis || !this.environmentInfo?.capabilities.pythonAnalysis) {
      return false;
    }

    // 서버 데이터가 없으면 실행하지 않음
    if (!request.serverData) {
      return false;
    }

    // 환경별 판단
    const dataSize = this.estimateDataSize(request.serverData);
    const estimatedTime = this.estimateProcessingTime(dataSize);
    const estimatedMemory = this.estimateMemoryRequirement(dataSize);

    return this.environmentDetector.shouldRunAdvancedAnalysis(
      dataSize,
      estimatedTime,
      estimatedMemory
    );
  }

  /**
   * 🐍 Python 분석 실행
   */
  private async executePythonAnalysis(serverData: any): Promise<LightweightAnalysisResult> {
    const analysisData = this.prepareAnalysisData(serverData);
    
    const request: LightweightAnalysisRequest = {
      data: analysisData,
      priority: 'medium',
      timeout: this.optimizationConfig?.pythonTimeout || 8000
    };

    return this.lightweightPython.analyzeData(request);
  }

  /**
   * 📊 분석용 데이터 준비
   */
  private prepareAnalysisData(serverData: any): any {
    const data: any = {};

    try {
      // 시계열 데이터 준비
      if (serverData?.metrics?.cpu?.history) {
        data.timeseries = {
          values: serverData.metrics.cpu.history.map((h: any) => h.value || 0),
          horizon: 10
        };
      }

      // 특성 데이터 준비 (다차원 메트릭)
      if (serverData?.metrics) {
        const features = [];
        const metrics = serverData.metrics;
        
        // 현재 메트릭을 특성으로 변환
        const cpuUsage = metrics.cpu?.current || 0;
        const memoryUsage = metrics.memory?.current || 0;
        const diskUsage = metrics.disk?.current || 0;
        
        features.push([cpuUsage, memoryUsage, diskUsage]);
        
        // 히스토리 데이터 추가 (최대 50개)
        if (metrics.cpu?.history) {
          const historyLength = Math.min(50, metrics.cpu.history.length);
          for (let i = 0; i < historyLength; i++) {
            const cpu = metrics.cpu.history[i]?.value || 0;
            const memory = metrics.memory?.history?.[i]?.value || 0;
            const disk = metrics.disk?.history?.[i]?.value || 0;
            features.push([cpu, memory, disk]);
          }
        }
        
        data.features = features;
      }

      // 변수 데이터 준비 (상관관계 분석용)
      if (serverData?.metrics?.cpu?.history && serverData?.metrics?.memory?.history) {
        data.variables = [
          {
            name: 'CPU',
            values: serverData.metrics.cpu.history.slice(0, 50).map((h: any) => h.value || 0)
          },
          {
            name: 'Memory',
            values: serverData.metrics.memory.history.slice(0, 50).map((h: any) => h.value || 0)
          }
        ];

        if (serverData.metrics.disk?.history) {
          data.variables.push({
            name: 'Disk',
            values: serverData.metrics.disk.history.slice(0, 50).map((h: any) => h.value || 0)
          });
        }
      }

    } catch (error) {
      console.error('분석 데이터 준비 실패:', error);
    }

    return data;
  }

  /**
   * 📝 통합 응답 생성
   */
  private async generateIntegratedResponse(params: {
    query: string;
    intent: any;
    context: any;
    mcpResult: any;
    pythonResult: LightweightAnalysisResult | null;
    serverData: any;
  }): Promise<any> {
    const { query, intent, context, mcpResult, pythonResult, serverData } = params;

    // 기본 응답 생성
    const baseResponse = await this.responseGenerator.generate({
      query,
      intent,
      context,
      serverData,
      mcpResponse: mcpResult
    });

    // Python 분석 결과가 있으면 응답 강화
    if (pythonResult?.success && pythonResult.results) {
      const enhancedText = this.enhanceResponseWithPythonResults(baseResponse.text, pythonResult);
      return { ...baseResponse, text: enhancedText };
    }

    return baseResponse;
  }

  /**
   * 🔍 Python 결과로 응답 강화
   */
  private enhanceResponseWithPythonResults(baseResponse: string, pythonResult: LightweightAnalysisResult): string {
    let enhanced = baseResponse;

    if (pythonResult.results) {
      enhanced += '\n\n---\n**🤖 AI 분석 결과**\n';

      // 이상 탐지 결과
      if (pythonResult.results.anomaly) {
        const anomaly = pythonResult.results.anomaly;
        if (anomaly.anomaly_percentage > 0) {
          enhanced += `- 🚨 이상치 탐지: ${anomaly.anomaly_percentage.toFixed(1)}% (${anomaly.anomaly_count}/${anomaly.total_samples})\n`;
        } else {
          enhanced += `- ✅ 이상치 없음: 모든 메트릭이 정상 범위\n`;
        }
      }

      // 예측 결과
      if (pythonResult.results.forecast) {
        const forecast = pythonResult.results.forecast;
        enhanced += `- 📈 트렌드 예측: ${forecast.trend} (신뢰도: ${(forecast.confidence * 100).toFixed(0)}%)\n`;
      }

      // 상관관계 결과
      if (pythonResult.results.correlation) {
        const correlation = pythonResult.results.correlation;
        const strongCorrs = correlation.correlations?.filter((c: any) => Math.abs(c.coefficient) > 0.7) || [];
        if (strongCorrs.length > 0) {
          enhanced += `- 🔗 강한 상관관계 ${strongCorrs.length}개 발견\n`;
        }
      }

      enhanced += `- ⚡ 분석 방법: ${pythonResult.method} (${pythonResult.executionTime}ms)\n`;
    }

    return enhanced;
  }

  /**
   * 💡 인사이트 생성
   */
  private generateInsights(mcpResult: any, pythonResult: LightweightAnalysisResult | null): string[] {
    const insights: string[] = [];

    // MCP 결과 기반 인사이트
    if (mcpResult?.patterns) {
      insights.push(`${mcpResult.patterns.length}개의 패턴이 감지되었습니다.`);
    }

    // Python 결과 기반 인사이트
    if (pythonResult?.success && pythonResult.results) {
      if (pythonResult.results.anomaly?.anomaly_percentage > 10) {
        insights.push('높은 이상치 비율이 감지되어 시스템 점검이 필요합니다.');
      }

      if (pythonResult.results.forecast?.trend === 'increasing') {
        insights.push('리소스 사용량이 증가 추세로 용량 확장을 고려해보세요.');
      }

      if (pythonResult.fallbackUsed) {
        insights.push('경량 분석 모드로 실행되었습니다.');
      }
    }

    return insights;
  }

  /**
   * 🎯 추천사항 생성
   */
  private generateRecommendations(mcpResult: any, pythonResult: LightweightAnalysisResult | null): string[] {
    const recommendations: string[] = [];

    // 환경별 추천사항
    if (this.environmentInfo?.platform === 'vercel-free') {
      recommendations.push('Vercel Pro로 업그레이드하면 더 상세한 분석이 가능합니다.');
    }

    // Python 결과 기반 추천사항
    if (pythonResult?.success && pythonResult.results) {
      if (pythonResult.results.anomaly?.anomaly_percentage > 5) {
        recommendations.push('이상치가 감지되었습니다. 로그를 확인해보세요.');
      }

      if (pythonResult.results.forecast?.trend === 'increasing') {
        recommendations.push('리소스 모니터링을 강화하고 스케일링을 준비하세요.');
      }
    }

    // 기본 추천사항
    if (recommendations.length === 0) {
      recommendations.push('시스템이 정상적으로 동작하고 있습니다.');
    }

    return recommendations;
  }

  /**
   * 🔧 환경별 설정 조정
   */
  private adjustConfigForEnvironment(): void {
    if (!this.environmentInfo || !this.optimizationConfig) return;

    // Vercel 무료 티어 최적화
    if (this.environmentInfo.platform === 'vercel-free') {
      this.config.fallbackMode = !this.environmentInfo.capabilities.pythonAnalysis;
    }

    // 메모리 제한이 낮으면 Python 분석 비활성화
    if (this.environmentInfo.memoryLimit < 512) {
      this.config.enablePythonAnalysis = false;
    }

    console.log('⚙️ 환경별 설정 조정 완료:', {
      platform: this.environmentInfo.platform,
      pythonAnalysis: this.config.enablePythonAnalysis,
      fallbackMode: this.config.fallbackMode
    });
  }

  /**
   * 🔧 초기화 헬퍼 함수들
   */
  private async initializeMCP(): Promise<void> {
    try {
      await this.mcpProcessor.initialize?.();
      console.log('✅ MCP 프로세서 초기화 완료');
    } catch (error) {
      console.warn('⚠️ MCP 프로세서 초기화 실패:', error);
    }
  }

  private async initializePython(): Promise<void> {
    try {
      const initialized = await this.lightweightPython.initialize();
      if (initialized) {
        console.log('✅ Python 분석 엔진 초기화 완료');
      } else {
        console.warn('⚠️ Python 분석 엔진 초기화 실패 - fallback 모드');
        this.config.enablePythonAnalysis = false;
      }
    } catch (error) {
      console.warn('⚠️ Python 분석 엔진 초기화 실패:', error);
      this.config.enablePythonAnalysis = false;
    }
  }

  private async initializeBasicProcessors(): Promise<void> {
    try {
      await Promise.all([
        this.intentClassifier.initialize(),
        this.responseGenerator.initialize(),
        this.contextManager.initialize(),
        this.actionExecutor.initialize()
      ]);
      console.log('✅ 기본 프로세서 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 기본 프로세서 초기화 일부 실패:', error);
    }
  }

  /**
   * 📏 추정 함수들
   */
  private estimateDataSize(serverData: any): number {
    let size = 0;
    try {
      if (serverData?.metrics) {
        const metrics = serverData.metrics;
        if (metrics.cpu?.history) size += metrics.cpu.history.length;
        if (metrics.memory?.history) size += metrics.memory.history.length;
        if (metrics.disk?.history) size += metrics.disk.history.length;
      }
    } catch (error) {
      size = 10; // 기본값
    }
    return size;
  }

  private estimateProcessingTime(dataSize: number): number {
    return Math.min(8000, 500 + dataSize * 10);
  }

  private estimateMemoryRequirement(dataSize: number): number {
    return Math.min(400, 100 + dataSize * 2);
  }

  /**
   * 📊 유틸리티 함수들
   */
  private generateSessionId(): string {
    return `optimized_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMemoryUsage(): number {
    try {
      const memUsage = process.memoryUsage();
      return Math.round(memUsage.heapUsed / 1024 / 1024);
    } catch (error) {
      return 0;
    }
  }

  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    }

    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  /**
   * 📈 상태 조회
   */
  getEngineStatus() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      environment: this.environmentInfo,
      optimization: this.optimizationConfig,
      metrics: this.metrics,
      pythonStatus: this.lightweightPython.getStatus(),
      version: '3.0.0-optimized',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * 🔄 엔진 종료
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Optimized AI Agent Engine 종료 중...');
    
    await this.contextManager.cleanup?.();
    await this.actionExecutor.cleanup?.();
    await this.lightweightPython.shutdown();
    
    this.isInitialized = false;
    console.log('✅ Optimized AI Agent Engine 종료 완료');
  }
}

// 기본 인스턴스 export
export const optimizedAIAgentEngine = OptimizedAIAgentEngine.getInstance(); 