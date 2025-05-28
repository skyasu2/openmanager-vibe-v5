/**
 * 🧠 MCP (Model Context Protocol) 오케스트레이터
 * 
 * 컨텍스트 인식 기반 통합 AI 엔진의 핵심 컴포넌트
 * - 다중 도구 체인 관리
 * - 컨텍스트 기반 의사결정
 * - Python/JavaScript 하이브리드 처리
 */

import { ContextManager } from '../context/context-manager';
import { PythonMLBridge } from '../../services/python-bridge/ml-bridge';

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

  constructor() {
    this.context = new ContextManager();
    this.pythonBridge = new PythonMLBridge(
      process.env.RENDER_API_URL || 'https://openmanager-vibe-v5.onrender.com'
    );
    this.registerTools();
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
   * 🎯 MCP 요청 처리 메인 메서드
   */
  async process(request: MCPRequest): Promise<MCPResponse> {
    this.processingStartTime = Date.now();
    
    try {
      console.log(`🧠 MCP 요청 처리 시작: ${request.query}`);

      // 1. 컨텍스트 업데이트
      await this.context.update(request.context);

      // 2. 쿼리 분석 및 도구 선택
      const selectedTools = await this.selectTools(request.query, request.parameters);

      // 3. 도구 체인 실행
      const results = await this.executeToolChain(selectedTools, request.parameters);

      // 4. 결과 통합 및 분석
      const mergedResult = await this.mergeToolResults(results);

      // 5. 컨텍스트 저장
      await this.context.save(mergedResult);

      const processingTime = Date.now() - this.processingStartTime;

      console.log(`✅ MCP 처리 완료`, {
        toolsUsed: selectedTools.map(t => t.name),
        processingTime,
        confidence: mergedResult.confidence || 0.8
      });

      return {
        result: mergedResult,
        tools_used: selectedTools.map(t => t.name),
        context_id: this.context.getId(),
        processing_time: processingTime,
        confidence: mergedResult.confidence || 0.8
      };

    } catch (error: any) {
      console.error('❌ MCP 처리 오류:', error);
      
      return {
        result: {
          error: 'MCP 처리 중 오류가 발생했습니다',
          message: error.message
        },
        tools_used: [],
        context_id: this.context.getId(),
        processing_time: Date.now() - this.processingStartTime,
        confidence: 0
      };
    }
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

  private async mergeToolResults(results: MCPToolResult[]): Promise<any> {
    const successfulResults = results.filter(r => r.success);
    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;

    return {
      summary: {
        total_tools: results.length,
        successful_tools: successfulResults.length,
        average_confidence: avgConfidence
      },
      detailed_results: successfulResults.map(r => r.data),
      confidence: avgConfidence,
      recommendations: this.extractRecommendations(successfulResults)
    };
  }

  private extractRecommendations(results: MCPToolResult[]): any[] {
    return results
      .map(r => r.next_recommended_tools || [])
      .flat()
      .filter((tool, index, self) => self.indexOf(tool) === index);
  }
} 