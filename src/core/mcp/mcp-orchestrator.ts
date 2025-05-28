/**
 * 🧠 MCP (Model Context Protocol) 오케스트레이터
 * 
 * 컨텍스트 인식 기반 통합 AI 엔진의 핵심 컴포넌트
 * - 다중 도구 체인 관리
 * - 컨텍스트 기반 의사결정
 * - Python/JavaScript 하이브리드 처리
 * - 메모리 최적화 통합
 */

import { ContextManager } from '../context/context-manager';
import { PythonMLBridge } from '../../services/python-bridge/ml-bridge';
import { memoryManager } from '../../utils/MemoryManager';

// 🔧 MCP 도구 인터페이스
export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any, context: Context) => Promise<MCPToolResult>;
}

// 📊 MCP 요청/응답 인터페이스
export interface MCPRequest {
  query: string;
  parameters: Record<string, any>;
  context: {
    session_id?: string;
    user_preferences?: Record<string, any>;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface MCPResponse {
  result: any;
  tools_used: string[];
  context_id: string;
  processing_time: number;
  confidence: number;
  performance: {
    memoryUsage: any;
    optimizationApplied: boolean;
  };
}

export interface MCPToolResult {
  success: boolean;
  data: any;
  confidence: number;
  processing_time: number;
  next_recommended_tools?: string[];
}

// 🧠 컨텍스트 인터페이스
export interface Context {
  system: {
    current_metrics: any;
    historical_trends: any;
    known_issues: any[];
  };
  patterns: {
    daily_patterns: any[];
    weekly_patterns: any[];
    anomaly_patterns: any[];
  };
  session: {
    query_history: any[];
    analysis_results: any[];
    user_preferences: any;
  };
  domain: {
    thresholds: Record<string, number>;
    rules: any[];
    correlations: any[];
  };
}

/**
 * 🎯 MCP 오케스트레이터 메인 클래스
 */
export class MCPOrchestrator {
  private tools: Map<string, MCPTool> = new Map();
  private context: ContextManager;
  private pythonBridge: PythonMLBridge;
  private processingStartTime: number = 0;
  
  // 🧠 메모리 관리 통합
  private memoryMetrics = {
    requestCount: 0,
    peakMemoryUsage: 0,
    memoryCleanupCount: 0,
    lastCleanupTime: 0
  };

  constructor() {
    this.context = new ContextManager();
    this.pythonBridge = new PythonMLBridge(
      process.env.RENDER_API_URL || 'https://openmanager-vibe-v5.onrender.com'
    );
    this.registerTools();
    this.setupMemoryMonitoring();
  }

  /**
   * 🧠 메모리 모니터링 설정
   */
  private setupMemoryMonitoring(): void {
    // 메모리 경고 시 자동 정리
    memoryManager.monitor.onWarning((metrics) => {
      console.log('⚠️ MCP 오케스트레이터: 메모리 경고 감지, 자동 정리 시작');
      this.performMemoryOptimization();
    });

    // 메모리 위험 시 응급 처리
    memoryManager.monitor.onCritical((metrics) => {
      console.log('🚨 MCP 오케스트레이터: 메모리 위험, 응급 최적화 실행');
      this.performEmergencyOptimization();
    });
  }

  /**
   * 🔧 MCP 도구 등록
   */
  private registerTools(): void {
    // 1. 통계 분석 도구
    this.tools.set('statistical_analysis', {
      name: 'statistical_analysis',
      description: '시계열 데이터 통계 분석',
      parameters: {
        data: 'array',
        method: 'string',
        window: 'number'
      },
      execute: async (params, context) => {
        return await this.executeStatisticalAnalysis(params, context);
      }
    });

    // 2. 이상 탐지 도구
    this.tools.set('anomaly_detection', {
      name: 'anomaly_detection',
      description: '다중 알고리즘 이상 탐지',
      parameters: {
        metrics: 'object',
        sensitivity: 'number',
        algorithms: 'array'
      },
      execute: async (params, context) => {
        return await this.executeAnomalyDetection(params, context);
      }
    });

    // 3. 예측 분석 도구
    this.tools.set('time_series_forecast', {
      name: 'time_series_forecast',
      description: '시계열 예측 분석',
      parameters: {
        historical_data: 'array',
        forecast_periods: 'number',
        model_type: 'string'
      },
      execute: async (params, context) => {
        return await this.executeTimeSeriesForecast(params, context);
      }
    });

    // 4. 패턴 인식 도구
    this.tools.set('pattern_recognition', {
      name: 'pattern_recognition',
      description: '반복 패턴 및 트렌드 인식',
      parameters: {
        data: 'array',
        pattern_types: 'array'
      },
      execute: async (params, context) => {
        return await this.executePatternRecognition(params, context);
      }
    });

    // 5. 근본원인 분석 도구
    this.tools.set('root_cause_analysis', {
      name: 'root_cause_analysis',
      description: '이슈의 근본 원인 분석',
      parameters: {
        anomalies: 'array',
        patterns: 'array',
        correlations: 'array'
      },
      execute: async (params, context) => {
        return await this.executeRootCauseAnalysis(params, context);
      }
    });

    // 6. 성능 최적화 제안 도구
    this.tools.set('optimization_advisor', {
      name: 'optimization_advisor',
      description: '성능 최적화 방안 제안',
      parameters: {
        current_state: 'object',
        target_metrics: 'object'
      },
      execute: async (params, context) => {
        return await this.executeOptimizationAdvice(params, context);
      }
    });
  }

  /**
   * 🎯 MCP 요청 처리 메인 메서드 (메모리 최적화)
   */
  async process(request: MCPRequest): Promise<MCPResponse> {
    this.processingStartTime = Date.now();
    
    // 📊 메모리 상태 체크 (처리 시작 전)
    const initialMemory = this.checkMemoryBeforeProcessing();
    
    try {
      console.log(`🧠 MCP 요청 처리 시작: ${request.query}`);
      this.memoryMetrics.requestCount++;

      // 1. 컨텍스트 업데이트 (메모리 효율적)
      await this.context.update(request.context);

      // 2. 쿼리 분석 및 도구 선택
      const selectedTools = await this.selectTools(request.query, request.parameters);

      // 3. 메모리 상태 확인 (도구 실행 전)
      if (this.shouldOptimizeBeforeExecution()) {
        await this.performMemoryOptimization();
      }

      // 4. 도구 체인 실행 (메모리 효율적)
      const results = await this.executeToolChainOptimized(selectedTools, request.parameters);

      // 5. 결과 통합 및 분석 (메모리 풀 사용)
      const mergedResult = await this.mergeToolResultsOptimized(results);

      // 6. 컨텍스트 저장
      await this.context.save(mergedResult);

      // 📊 메모리 상태 체크 (처리 완료 후)
      const finalMemory = this.checkMemoryAfterProcessing(initialMemory);

      const processingTime = Date.now() - this.processingStartTime;

      return {
        result: mergedResult,
        tools_used: selectedTools.map(t => t.name),
        context_id: await this.context.getId(),
        processing_time: processingTime,
        confidence: mergedResult.confidence || 0.8,
        // 메모리 성능 지표 추가
        performance: {
          memoryUsage: finalMemory,
          optimizationApplied: finalMemory.optimizationApplied || false
        }
      };

    } catch (error: any) {
      console.error('❌ MCP 처리 오류:', error);
      
      // 오류 시에도 메모리 정리
      this.performMemoryOptimization();
      
      throw error;
    }
  }

  /**
   * 📊 처리 전 메모리 상태 확인
   */
  private checkMemoryBeforeProcessing(): any {
    const usage = process.memoryUsage();
    const currentHeap = usage.heapUsed;
    
    // 피크 메모리 업데이트
    if (currentHeap > this.memoryMetrics.peakMemoryUsage) {
      this.memoryMetrics.peakMemoryUsage = currentHeap;
    }

    return {
      heapUsed: Math.round(currentHeap / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      timestamp: Date.now()
    };
  }

  /**
   * 📊 처리 후 메모리 상태 확인
   */
  private checkMemoryAfterProcessing(initialMemory: any): any {
    const usage = process.memoryUsage();
    const finalHeap = Math.round(usage.heapUsed / 1024 / 1024);
    const memoryDelta = finalHeap - initialMemory.heapUsed;

    return {
      initial: initialMemory,
      final: {
        heapUsed: finalHeap,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024)
      },
      delta: memoryDelta,
      optimizationApplied: this.memoryMetrics.lastCleanupTime > initialMemory.timestamp
    };
  }

  /**
   * 🎯 실행 전 메모리 최적화 필요성 판단
   */
  private shouldOptimizeBeforeExecution(): boolean {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const timeSinceLastCleanup = Date.now() - this.memoryMetrics.lastCleanupTime;
    
    // 메모리 사용량이 200MB 이상이고, 마지막 정리 후 5분 이상 경과
    return heapUsedMB > 200 && timeSinceLastCleanup > 300000;
  }

  /**
   * 🧹 메모리 최적화 실행
   */
  private async performMemoryOptimization(): Promise<void> {
    console.log('🧹 MCP 메모리 최적화 시작...');
    
    const beforeMemory = process.memoryUsage();
    
    // 1. 컨텍스트 매니저 정리
    this.context.cleanup();
    
    // 2. 객체 풀 정리
    memoryManager.cleanup();
    
    // 3. Python 브릿지 캐시 정리
    this.pythonBridge.clearCache();
    
    // 4. 가비지 컬렉션 (가능한 경우)
    if (global.gc) {
      global.gc();
    }
    
    // 정리 후 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterMemory = process.memoryUsage();
    const freedMB = Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024);
    
    this.memoryMetrics.memoryCleanupCount++;
    this.memoryMetrics.lastCleanupTime = Date.now();
    
    console.log(`✅ MCP 메모리 정리 완료: ${freedMB}MB 해제`);
  }

  /**
   * 🚨 응급 메모리 최적화
   */
  private async performEmergencyOptimization(): Promise<void> {
    console.log('🚨 MCP 응급 메모리 최적화 시작...');
    
    // 모든 가능한 정리 작업 수행
    await this.performMemoryOptimization();
    
    // 추가 응급 처리
    memoryManager.emergencyCleanup();
    
    console.log('✅ MCP 응급 최적화 완료');
  }

  /**
   * ⚡ 메모리 효율적 도구 체인 실행
   */
  private async executeToolChainOptimized(tools: MCPTool[], parameters: any): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];
    const currentContext = this.context.getCurrent();

    // 도구별 메모리 풀에서 결과 객체 획득
    for (const tool of tools) {
      try {
        console.log(`🔧 MCP 도구 실행: ${tool.name}`);
        
        // 메모리 풀에서 결과 객체 획득
        const resultObj = memoryManager.analysisResultPool.acquire();
        
        const startTime = Date.now();
        const result = await tool.execute(parameters, currentContext);
        const executionTime = Date.now() - startTime;

        // 결과 객체 설정
        Object.assign(resultObj, {
          success: result.success,
          data: result.data,
          confidence: result.confidence,
          processingTime: executionTime,
          toolName: tool.name
        });

        results.push(resultObj);

        console.log(`✅ ${tool.name} 완료 (${executionTime}ms)`);

        // 중간 메모리 체크
        if (results.length % 3 === 0) { // 3개 도구마다 체크
          const usage = process.memoryUsage();
          if (usage.heapUsed > 300 * 1024 * 1024) { // 300MB 초과 시
            console.log('🧹 중간 메모리 정리 실행...');
            await this.performMemoryOptimization();
          }
        }

      } catch (error: any) {
        console.error(`❌ ${tool.name} 실행 오류:`, error);
        
        // 오류 시에도 메모리 풀 객체 사용
        const errorObj = memoryManager.analysisResultPool.acquire();
        Object.assign(errorObj, {
          success: false,
          data: null,
          confidence: 0,
          processingTime: 0,
          error: error.message,
          toolName: tool.name
        });
        
        results.push(errorObj);
      }
    }

    return results;
  }

  /**
   * 🔗 메모리 효율적 결과 병합
   */
  private async mergeToolResultsOptimized(results: MCPToolResult[]): Promise<any> {
    console.log('🔗 도구 결과 병합 중...');
    
    // 메모리 풀에서 병합 결과 객체 획득
    const mergedResult = memoryManager.analysisResultPool.acquire();
    
    try {
      const successfulResults = results.filter(r => r.success);
      const totalProcessingTime = results.reduce((sum, r) => sum + r.processing_time, 0);
      const avgConfidence = successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length 
        : 0;

      // 병합된 데이터 구성
      const mergedData = {
        statistical: this.extractDataByType(successfulResults, 'statistical_analysis'),
        anomalies: this.extractDataByType(successfulResults, 'anomaly_detection'),
        forecasts: this.extractDataByType(successfulResults, 'time_series_forecast'),
        patterns: this.extractDataByType(successfulResults, 'pattern_recognition'),
        rootCauses: this.extractDataByType(successfulResults, 'root_cause_analysis'),
        optimizations: this.extractDataByType(successfulResults, 'optimization_advisor')
      };

      // 결과 객체 설정
      Object.assign(mergedResult, {
        success: true,
        data: mergedData,
        confidence: Math.round(avgConfidence * 100) / 100,
        processingTime: totalProcessingTime,
        toolsExecuted: results.length,
        successfulTools: successfulResults.length,
        summary: this.generateSummary(mergedData),
        recommendations: this.extractRecommendations(successfulResults)
      });

      // 사용한 결과 객체들을 풀에 반환
      results.forEach(result => {
        memoryManager.analysisResultPool.release(result);
      });

      return mergedResult;

    } catch (error: any) {
      console.error('❌ 결과 병합 오류:', error);
      
      // 오류 시 기본 결과 반환
      Object.assign(mergedResult, {
        success: false,
        data: null,
        confidence: 0,
        processingTime: 0,
        error: error.message
      });
      
      return mergedResult;
    }
  }

  /**
   * 📊 타입별 데이터 추출
   */
  private extractDataByType(results: MCPToolResult[], toolType: string): any {
    const typeResult = results.find(r => (r as any).toolName === toolType);
    return typeResult ? typeResult.data : null;
  }

  /**
   * 📋 요약 생성
   */
  private generateSummary(data: any): string {
    const summaryParts = [];
    
    if (data.statistical) summaryParts.push('통계 분석 완료');
    if (data.anomalies) summaryParts.push(`이상 ${data.anomalies.anomalies?.length || 0}개 탐지`);
    if (data.forecasts) summaryParts.push('예측 분석 완료');
    if (data.patterns) summaryParts.push('패턴 인식 완료');
    if (data.rootCauses) summaryParts.push('근본원인 분석 완료');
    if (data.optimizations) summaryParts.push('최적화 제안 완료');
    
    return summaryParts.join(', ') || '분석 완료';
  }

  /**
   * 📊 MCP 시스템 메트릭 조회
   */
  getSystemMetrics(): any {
    const memoryStatus = memoryManager.getStatus();
    const pythonMetrics = this.pythonBridge.getMetrics();

    return {
      mcp: {
        requestCount: this.memoryMetrics.requestCount,
        peakMemoryUsage: Math.round(this.memoryMetrics.peakMemoryUsage / 1024 / 1024),
        memoryCleanupCount: this.memoryMetrics.memoryCleanupCount,
        lastCleanupTime: this.memoryMetrics.lastCleanupTime
      },
      memory: memoryStatus,
      python: pythonMetrics,
      system: {
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      }
    };
  }

  /**
   * 🔍 도구 선택 알고리즘
   */
  private async selectTools(query: string, parameters: any): Promise<MCPTool[]> {
    const selectedTools: MCPTool[] = [];
    const queryLower = query.toLowerCase();

    // 쿼리 키워드 기반 도구 선택
    if (queryLower.includes('이상') || queryLower.includes('비정상') || queryLower.includes('anomaly')) {
      selectedTools.push(this.tools.get('anomaly_detection')!);
    }

    if (queryLower.includes('예측') || queryLower.includes('forecast') || queryLower.includes('미래')) {
      selectedTools.push(this.tools.get('time_series_forecast')!);
    }

    if (queryLower.includes('패턴') || queryLower.includes('pattern') || queryLower.includes('트렌드')) {
      selectedTools.push(this.tools.get('pattern_recognition')!);
    }

    if (queryLower.includes('원인') || queryLower.includes('why') || queryLower.includes('분석')) {
      selectedTools.push(this.tools.get('root_cause_analysis')!);
    }

    if (queryLower.includes('최적화') || queryLower.includes('개선') || queryLower.includes('optimization')) {
      selectedTools.push(this.tools.get('optimization_advisor')!);
    }

    // 기본 통계 분석은 항상 포함
    if (parameters.metrics && selectedTools.length === 0) {
      selectedTools.push(this.tools.get('statistical_analysis')!);
    }

    // 최소 하나의 도구는 선택
    if (selectedTools.length === 0) {
      selectedTools.push(this.tools.get('statistical_analysis')!);
    }

    return selectedTools;
  }

  /**
   * 🔗 도구 체인 실행
   */
  private async executeToolChain(tools: MCPTool[], parameters: any): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];
    const currentContext = this.context.getCurrent();

    // 병렬 실행 가능한 도구들
    const parallelTools = tools.filter(tool => 
      ['statistical_analysis', 'anomaly_detection', 'pattern_recognition'].includes(tool.name)
    );

    // 순차 실행해야 하는 도구들
    const sequentialTools = tools.filter(tool => 
      ['root_cause_analysis', 'optimization_advisor'].includes(tool.name)
    );

    // 1. 병렬 실행
    if (parallelTools.length > 0) {
      const parallelResults = await Promise.all(
        parallelTools.map(tool => tool.execute(parameters, currentContext))
      );
      results.push(...parallelResults);
    }

    // 2. 순차 실행 (이전 결과를 활용)
    for (const tool of sequentialTools) {
      const enrichedParams = {
        ...parameters,
        previous_results: results
      };
      const result = await tool.execute(enrichedParams, currentContext);
      results.push(result);
    }

    return results;
  }

  /**
   * 📊 통계 분석 실행
   */
  private async executeStatisticalAnalysis(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const data = params.data || params.metrics;
      if (!data) {
        return {
          success: false,
          data: { error: 'No data provided for analysis' },
          confidence: 0,
          processing_time: Date.now() - startTime
        };
      }

      // JavaScript 기반 기본 통계
      const stats = this.calculateBasicStatistics(data);
      
      // 추가 상세 분석이 필요한 경우 Python 호출
      let advancedStats = null;
      if (params.detailed || context.session.user_preferences?.detailed_analysis) {
        try {
          advancedStats = await this.pythonBridge.call('statistical_analysis', {
            data,
            methods: ['correlation', 'distribution', 'seasonality']
          });
        } catch (error) {
          console.warn('Python 통계 분석 실패, 로컬 결과 사용');
        }
      }

      return {
        success: true,
        data: {
          basic_stats: stats,
          advanced_stats: advancedStats,
          analysis_type: 'statistical_analysis'
        },
        confidence: 0.9,
        processing_time: Date.now() - startTime,
        next_recommended_tools: ['anomaly_detection', 'pattern_recognition']
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * 🚨 이상 탐지 실행
   */
  private async executeAnomalyDetection(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const metrics = params.metrics || params.data;
      const sensitivity = params.sensitivity || 0.1;

      // 컨텍스트 기반 파라미터 조정
      const enrichedParams = this.enrichWithContext(params, context);

      // JavaScript 기반 빠른 이상 탐지
      const quickResults = await this.localAnomalyDetection(enrichedParams);

      // 고급 분석이 필요한 경우 Python 호출
      let advancedResults = null;
      if (params.deep_analysis || quickResults.anomaly_count > 5) {
        try {
          advancedResults = await this.pythonBridge.call('advanced_anomaly_detection', {
            ...enrichedParams,
            algorithms: ['isolation_forest', 'one_class_svm', 'statistical']
          });
        } catch (error) {
          console.warn('Python 이상 탐지 실패, 로컬 결과 사용');
        }
      }

      return {
        success: true,
        data: {
          quick_detection: quickResults,
          advanced_detection: advancedResults,
          analysis_type: 'anomaly_detection'
        },
        confidence: quickResults.confidence || 0.8,
        processing_time: Date.now() - startTime,
        next_recommended_tools: ['root_cause_analysis']
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * 📈 시계열 예측 실행
   */
  private async executeTimeSeriesForecast(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const historicalData = params.historical_data || params.data;
      const forecastPeriods = params.forecast_periods || 24;
      const modelType = params.model_type || 'simple';

      // 컨텍스트에서 계절성 패턴 확인
      const seasonality = context.patterns.daily_patterns;

      if (modelType === 'advanced') {
        // Python SARIMA/Prophet 모델
        try {
          const pythonForecast = await this.pythonBridge.call('forecast', {
            data: historicalData,
            periods: forecastPeriods,
            seasonality,
            model: 'prophet'
          });

          return {
            success: true,
            data: {
              forecast: pythonForecast,
              model_type: 'advanced',
              analysis_type: 'time_series_forecast'
            },
            confidence: pythonForecast.confidence || 0.85,
            processing_time: Date.now() - startTime
          };
        } catch (error) {
          console.warn('Python 예측 실패, 로컬 예측 사용');
        }
      }

      // JavaScript 기반 간단 예측
      const localForecast = await this.localForecast(historicalData, forecastPeriods);

      return {
        success: true,
        data: {
          forecast: localForecast,
          model_type: 'simple',
          analysis_type: 'time_series_forecast'
        },
        confidence: 0.7,
        processing_time: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * 🔍 패턴 인식 실행
   */
  private async executePatternRecognition(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const data = params.data;
      const patternTypes = params.pattern_types || ['daily', 'weekly', 'anomaly'];

      const patterns = await this.detectPatterns(data, patternTypes, context);

      return {
        success: true,
        data: {
          patterns,
          analysis_type: 'pattern_recognition'
        },
        confidence: 0.8,
        processing_time: Date.now() - startTime,
        next_recommended_tools: ['optimization_advisor']
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * 🔎 근본원인 분석 실행
   */
  private async executeRootCauseAnalysis(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const previousResults = params.previous_results || [];
      const anomalies = params.anomalies || this.extractAnomaliesFromResults(previousResults);
      const patterns = params.patterns || this.extractPatternsFromResults(previousResults);

      // 상관관계 분석
      const correlations = await this.analyzeCorrelations(anomalies, patterns, context);

      // 근본 원인 추론
      const rootCauses = this.inferRootCauses(anomalies, patterns, correlations, context);

      return {
        success: true,
        data: {
          root_causes: rootCauses,
          correlations,
          analysis_type: 'root_cause_analysis'
        },
        confidence: 0.75,
        processing_time: Date.now() - startTime,
        next_recommended_tools: ['optimization_advisor']
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * 💡 최적화 제안 실행
   */
  private async executeOptimizationAdvice(params: any, context: Context): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      const currentState = params.current_state;
      const previousResults = params.previous_results || [];
      
      const recommendations = this.generateOptimizationRecommendations(
        currentState,
        previousResults,
        context
      );

      return {
        success: true,
        data: {
          recommendations,
          priority_actions: recommendations.slice(0, 3),
          analysis_type: 'optimization_advisor'
        },
        confidence: 0.8,
        processing_time: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message },
        confidence: 0,
        processing_time: Date.now() - startTime
      };
    }
  }

  // === 헬퍼 메서드들 ===

  private calculateBasicStatistics(data: any): any {
    // 기본 통계 계산 구현
    return {
      mean: 0,
      median: 0,
      std: 0,
      min: 0,
      max: 0
    };
  }

  private enrichWithContext(params: any, context: Context): any {
    return {
      ...params,
      business_hours: this.isBusinessHours(),
      historical_patterns: context.patterns,
      thresholds: context.domain.thresholds
    };
  }

  private isBusinessHours(): boolean {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 18;
  }

  private async localAnomalyDetection(params: any): Promise<any> {
    // 로컬 이상 탐지 구현
    return {
      anomalies: [],
      anomaly_count: 0,
      confidence: 0.7
    };
  }

  private async localForecast(data: any, periods: number): Promise<any> {
    // 로컬 예측 구현
    return {
      predictions: [],
      confidence_intervals: [],
      trend: 'stable'
    };
  }

  private async detectPatterns(data: any, types: string[], context: Context): Promise<any> {
    // 패턴 탐지 구현
    return {
      daily_patterns: [],
      weekly_patterns: [],
      seasonal_patterns: []
    };
  }

  private extractAnomaliesFromResults(results: MCPToolResult[]): any {
    return results
      .filter(r => r.data.analysis_type === 'anomaly_detection')
      .map(r => r.data.quick_detection?.anomalies || [])
      .flat();
  }

  private extractPatternsFromResults(results: MCPToolResult[]): any {
    return results
      .filter(r => r.data.analysis_type === 'pattern_recognition')
      .map(r => r.data.patterns || {})
      .reduce((acc, patterns) => ({ ...acc, ...patterns }), {});
  }

  private async analyzeCorrelations(anomalies: any, patterns: any, context: Context): Promise<any> {
    // 상관관계 분석 구현
    return {
      metric_correlations: [],
      temporal_correlations: [],
      causal_links: []
    };
  }

  private inferRootCauses(anomalies: any, patterns: any, correlations: any, context: Context): any {
    // 근본 원인 추론 구현
    return [
      {
        cause: 'High CPU Usage',
        confidence: 0.8,
        supporting_evidence: [],
        recommended_actions: []
      }
    ];
  }

  private generateOptimizationRecommendations(state: any, results: MCPToolResult[], context: Context): any {
    // 최적화 제안 생성 구현
    return [
      {
        type: 'performance',
        title: 'CPU 사용률 최적화',
        description: '현재 CPU 사용률이 높습니다',
        priority: 'high',
        actions: []
      }
    ];
  }

  private extractRecommendations(results: MCPToolResult[]): any[] {
    return results
      .map(r => r.next_recommended_tools || [])
      .flat()
      .filter((tool, index, self) => self.indexOf(tool) === index);
  }
} 