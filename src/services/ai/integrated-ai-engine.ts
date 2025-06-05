/**
 * 🤖 통합 AI 엔진 v3.0
 * 
 * ✅ 기본: MCP + TensorFlow.js + NLP 로컬 추론
 * ✅ LLM 없이도 동작하는 자연어 질의응답
 * ✅ 실시간 장애 예측
 * ✅ 자동 보고서 생성
 * ✅ Vercel Edge Runtime 최적화
 * ✅ 베타: 외부 LLM 연동으로 성능 향상 가능
 */

import { realMCPClient } from '../mcp/real-mcp-client';
import { tensorFlowAIEngine } from './tensorflow-engine';
import { nlpProcessor } from './nlp-processor';
import { autoReportGenerator } from './report-generator';

interface AIQueryRequest {
  query: string;
  context?: {
    session_id?: string;
    user_id?: string;
    server_ids?: string[];
    include_predictions?: boolean;
    include_charts?: boolean;
    language?: 'ko' | 'en';
  };
  options?: {
    max_response_time?: number;
    confidence_threshold?: number;
    enable_streaming?: boolean;
    include_debug?: boolean;
  };
}

interface AIQueryResponse {
  success: boolean;
  query_id: string;
  intent: string;
  confidence: number;
  answer: string;
  analysis_results: {
    nlp_analysis: any;
    ai_predictions?: any;
    anomaly_detection?: any;
    trend_forecasts?: any;
    active_alerts?: any[];
    session_context?: any;
  };
  recommendations: string[];
  generated_report?: string;
  mcp_results?: any;
  processing_stats: {
    total_time: number;
    components_used: string[];
    models_executed: string[];
    data_sources: string[];
  };
  metadata: {
    timestamp: string;
    language: string;
    session_id?: string;
    debug_info?: any;
  };
}

interface SystemMetrics {
  servers: Record<string, Record<string, number[]>>;
  global_stats: any;
  alerts: any[];
  timestamp: string;
}

export class IntegratedAIEngine {
  private initialized = false;
  private lastAnalysisCache: Map<string, any> = new Map();
  private activeSessions: Set<string> = new Set();

  constructor() {
    // 컴포넌트들은 이미 초기화됨
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🤖 통합 AI 엔진 v3.0 초기화 중...');
    
    try {
      // 모든 하위 컴포넌트 초기화
      await Promise.all([
        realMCPClient.initialize(),
        tensorFlowAIEngine.initialize(),
        nlpProcessor.initialize(),
        autoReportGenerator.initialize()
      ]);
      
      this.initialized = true;
      console.log('✅ 통합 AI 엔진 초기화 완료');
      console.log('🔧 활성화된 컴포넌트:');
      console.log('  - ✅ 실제 MCP 클라이언트');
      console.log('  - ✅ TensorFlow.js AI 엔진');
      console.log('  - ✅ NLP 프로세서');
      console.log('  - ✅ 자동 보고서 생성기');
      
    } catch (error: any) {
      console.error('❌ 통합 AI 엔진 초기화 실패:', error);
      this.initialized = true; // 폴백 모드로 계속 진행
    }
  }

  async processQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    await this.initialize();
    
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    const sessionId = request.context?.session_id || queryId;
    
    console.log(`🤖 AI 쿼리 처리 시작: ${queryId}`);
    console.log(`📝 질문: "${request.query}"`);
    
    this.activeSessions.add(sessionId);

    const response: AIQueryResponse = {
      success: false,
      query_id: queryId,
      intent: 'unknown',
      confidence: 0,
      answer: '',
      analysis_results: {
        nlp_analysis: null
      },
      recommendations: [],
      processing_stats: {
        total_time: 0,
        components_used: [],
        models_executed: [],
        data_sources: []
      },
      metadata: {
        timestamp: new Date().toISOString(),
        language: request.context?.language || 'ko',
        session_id: sessionId
      }
    };

    try {
      // 1단계: 자연어 처리
      console.log('📝 1단계: NLP 분석 중...');
      const nlpResult = await nlpProcessor.processFailurePredictionQuery(request.query);
      response.analysis_results.nlp_analysis = nlpResult;
      response.intent = nlpResult.intent;
      response.confidence = nlpResult.confidence;
      response.processing_stats.components_used.push('nlp_processor');

      console.log(`🎯 의도 분석 결과: ${nlpResult.intent} (신뢰도: ${(nlpResult.confidence * 100).toFixed(1)}%)`);

      // 2단계: 의도별 처리 분기
      await this.processIntentSpecificActions(nlpResult, request, response);

      // 3단계: 종합 답변 생성
      await this.generateComprehensiveAnswer(nlpResult, request, response);

      // 4단계: 권장사항 생성
      this.generateRecommendations(nlpResult, response);

      // 5단계: 보고서 생성 (요청된 경우)
      if (this.shouldGenerateReport(nlpResult, request)) {
        await this.generateReport(response, request);
      }

      response.success = true;
      response.processing_stats.total_time = Date.now() - startTime;
      
      console.log(`✅ AI 쿼리 처리 완료: ${response.processing_stats.total_time}ms`);
      console.log(`🎯 최종 응답: "${response.answer.substring(0, 100)}..."`);

    } catch (error: any) {
      console.error('❌ AI 쿼리 처리 실패:', error);
      response.success = false;
      response.answer = response.metadata.language === 'ko' ? 
        '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' :
        'Sorry, an error occurred during processing. Please try again.';
      response.processing_stats.total_time = Date.now() - startTime;
      
      if (request.options?.include_debug) {
        response.metadata.debug_info = {
          error: error.message,
          stack: error.stack
        };
      }
    } finally {
      this.activeSessions.delete(sessionId);
    }

    return response;
  }

  private async processIntentSpecificActions(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    const intent = nlpResult.intent;
    
    switch (intent) {
      case 'troubleshooting':
      case 'emergency':
        await this.handleTroubleshootingIntent(nlpResult, request, response);
        break;
        
      case 'prediction':
        await this.handlePredictionIntent(nlpResult, request, response);
        break;
        
      case 'analysis':
        await this.handleAnalysisIntent(nlpResult, request, response);
        break;
        
      case 'monitoring':
        await this.handleMonitoringIntent(nlpResult, request, response);
        break;
        
      case 'reporting':
        await this.handleReportingIntent(nlpResult, request, response);
        break;
        
      case 'performance':
        await this.handlePerformanceIntent(nlpResult, request, response);
        break;
        
      default:
        await this.handleGeneralIntent(nlpResult, request, response);
    }
  }

  private async handleTroubleshootingIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    // 시스템 메트릭 수집
    const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
    
    // MCP를 통한 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(request.query);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs');

    // AI 장애 분석 실행
    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      // 🔧 타입 에러 수정: 중첩 구조를 플랫 구조로 변환
      const flattenedMetrics: Record<string, number[]> = {};
      
      for (const [serverId, serverMetrics] of Object.entries(systemMetrics.servers)) {
        for (const [metricName, values] of Object.entries(serverMetrics)) {
          const key = `${serverId}_${metricName}`;
          flattenedMetrics[key] = values;
        }
      }
      
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    response.processing_stats.components_used.push('mcp-client', 'tensorflow-engine');
  }

  private async handlePredictionIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    // 시스템 메트릭 수집
    const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
    
    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      // 🔧 타입 에러 수정: 중첩 구조를 플랫 구조로 변환
      const flattenedMetrics: Record<string, number[]> = {};
      
      for (const [serverId, serverMetrics] of Object.entries(systemMetrics.servers)) {
        for (const [metricName, values] of Object.entries(serverMetrics)) {
          const key = `${serverId}_${metricName}`;
          flattenedMetrics[key] = values;
        }
      }
      
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.trend_forecasts = aiAnalysis.trend_predictions;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
      
      // 예측 신뢰도가 높은 결과에 대한 알림
      for (const [metric, prediction] of Object.entries(aiAnalysis.failure_predictions)) {
        if (prediction.confidence > 0.8 && prediction.prediction[0] > 0.6) {
          systemMetrics.alerts.push({
            type: 'prediction',
            severity: 'high',
            metric: metric,
            message: `높은 확률의 장애 예측: ${(prediction.prediction[0] * 100).toFixed(1)}%`,
            confidence: prediction.confidence
          });
        }
      }
    }

    response.analysis_results.active_alerts = systemMetrics.alerts;
    response.processing_stats.components_used.push('tensorflow-engine', 'prediction-model');
  }

  private async handleAnalysisIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
    
    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      // 🔧 타입 에러 수정: 중첩 구조를 플랫 구조로 변환
      const flattenedMetrics: Record<string, number[]> = {};
      
      for (const [serverId, serverMetrics] of Object.entries(systemMetrics.servers)) {
        for (const [metricName, values] of Object.entries(serverMetrics)) {
          const key = `${serverId}_${metricName}`;
          flattenedMetrics[key] = values;
        }
      }
      
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    // MCP를 통한 추가 컨텍스트 수집
    if (request.context?.session_id) {
      const sessionContext = await realMCPClient.retrieveContext(request.context.session_id);
      response.analysis_results.session_context = sessionContext;
    }

    response.processing_stats.components_used.push('tensorflow-engine', 'mcp-client');
  }

  private async handleMonitoringIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    console.log('📊 모니터링 모드 실행');
    
    try {
      const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
      response.processing_stats.data_sources.push('system_metrics', 'real_time_monitoring');

      // 실시간 상태 분석
      if (systemMetrics.alerts && systemMetrics.alerts.length > 0) {
        response.analysis_results.active_alerts = systemMetrics.alerts;
      }

    } catch (error: any) {
      console.error('모니터링 처리 실패:', error);
    }
  }

  private async handleReportingIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    console.log('📄 보고서 생성 모드 실행');
    
    try {
      // 보고서용 데이터 수집
      const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
      
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: response.metadata.language === 'ko' ? 
          '시스템 상태 보고서입니다.' : 
          'System status report.',
        failure_analysis: response.analysis_results.anomaly_detection || {},
        prediction_results: response.analysis_results.ai_predictions || {},
        ai_insights: ['AI 기반 분석 결과를 포함합니다.'],
        recommendations: [],
        metrics_data: systemMetrics.servers || {},
        charts: [],
        system_status: { overall: 'healthy' },
        time_range: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          duration: '24h'
        }
      };

      const reportConfig = {
        format: 'markdown' as const,
        include_charts: true,
        include_raw_data: false,
        template: 'technical' as const,
        language: response.metadata.language as 'ko' | 'en'
      };

      const generatedReport = await autoReportGenerator.generateFailureReport(reportData, reportConfig);
      response.generated_report = generatedReport;
      response.processing_stats.components_used.push('report_generator');

    } catch (error: any) {
      console.error('보고서 생성 처리 실패:', error);
    }
  }

  private async handlePerformanceIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
    
    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      // 🔧 타입 에러 수정: 중첩 구조를 플랫 구조로 변환
      const flattenedMetrics: Record<string, number[]> = {};
      
      for (const [serverId, serverMetrics] of Object.entries(systemMetrics.servers)) {
        for (const [metricName, values] of Object.entries(serverMetrics)) {
          const key = `${serverId}_${metricName}`;
          flattenedMetrics[key] = values;
        }
      }
      
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    response.processing_stats.components_used.push('tensorflow-engine');
  }

  private async handleGeneralIntent(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    console.log('🤖 일반 질의 모드 실행');
    
    try {
      // MCP로 관련 문서 검색
      const searchResults = await realMCPClient.searchDocuments(request.query);
      response.mcp_results = searchResults;
      response.processing_stats.components_used.push('mcp_client');

    } catch (error: any) {
      console.error('일반 질의 처리 실패:', error);
    }
  }

  private async generateComprehensiveAnswer(
    nlpResult: any, 
    request: AIQueryRequest, 
    response: AIQueryResponse
  ): Promise<void> {
    const lang = response.metadata.language;
    let answer = '';

    // 의도별 기본 답변 생성
    switch (nlpResult.intent) {
      case 'troubleshooting':
      case 'emergency':
        answer = this.generateTroubleshootingAnswer(response, lang);
        break;
      case 'prediction':
        answer = this.generatePredictionAnswer(response, lang);
        break;
      case 'analysis':
        answer = this.generateAnalysisAnswer(response, lang);
        break;
      case 'monitoring':
        answer = this.generateMonitoringAnswer(response, lang);
        break;
      case 'reporting':
        answer = this.generateReportingAnswer(response, lang);
        break;
      case 'performance':
        answer = this.generatePerformanceAnswer(response, lang);
        break;
      default:
        answer = this.generateGeneralAnswer(response, lang);
    }

    response.answer = answer;
  }

  private generateTroubleshootingAnswer(response: AIQueryResponse, lang: string): string {
    const anomalies = response.analysis_results.anomaly_detection;
    const predictions = response.analysis_results.ai_predictions;
    
    let answer = lang === 'ko' ? '🚨 시스템 장애 분석 결과:\n\n' : '🚨 System Troubleshooting Analysis:\n\n';

    if (anomalies && Object.keys(anomalies).length > 0) {
      answer += lang === 'ko' ? '**이상 탐지 결과:**\n' : '**Anomaly Detection:**\n';
      Object.entries(anomalies).forEach(([metric, anomaly]: [string, any]) => {
        const status = anomaly.is_anomaly ? 
          (lang === 'ko' ? '이상 감지' : 'Anomaly Detected') :
          (lang === 'ko' ? '정상' : 'Normal');
        answer += `- ${metric}: ${status}\n`;
      });
      answer += '\n';
    }

    if (predictions && Object.keys(predictions).length > 0) {
      answer += lang === 'ko' ? '**장애 예측:**\n' : '**Failure Prediction:**\n';
      Object.entries(predictions).forEach(([metric, prediction]: [string, any]) => {
        const probability = (prediction.prediction[0] * 100).toFixed(1);
        answer += `- ${metric}: ${probability}%\n`;
      });
      answer += '\n';
    }

    if (!anomalies && !predictions) {
      answer += lang === 'ko' ? 
        '현재 분석할 수 있는 메트릭 데이터가 충분하지 않습니다.' :
        'Insufficient metric data available for analysis.';
    }

    return answer;
  }

  private generatePredictionAnswer(response: AIQueryResponse, lang: string): string {
    const forecasts = response.analysis_results.trend_forecasts;
    
    let answer = lang === 'ko' ? '🔮 시계열 예측 결과:\n\n' : '🔮 Time Series Forecast:\n\n';

    if (forecasts && Object.keys(forecasts).length > 0) {
      Object.entries(forecasts).forEach(([server, metrics]: [string, any]) => {
        answer += `**${server}:**\n`;
        Object.entries(metrics).forEach(([metric, values]: [string, any]) => {
          answer += `- ${metric}: [${Array.isArray(values) ? values.map(v => v.toFixed(2)).join(', ') : 'N/A'}]\n`;
        });
        answer += '\n';
      });
    } else {
      answer += lang === 'ko' ? 
        '예측할 수 있는 충분한 과거 데이터가 없습니다.' :
        'Insufficient historical data for prediction.';
    }

    return answer;
  }

  private generateAnalysisAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko' ? 
      '🔍 AI 기반 시스템 분석을 완료했습니다. 상세한 결과는 분석 데이터를 참조하세요.' :
      '🔍 AI-powered system analysis completed. Please refer to analysis data for detailed results.';
  }

  private generateMonitoringAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko' ? 
      '📊 실시간 모니터링 데이터를 분석했습니다.' :
      '📊 Real-time monitoring data analyzed.';
  }

  private generateReportingAnswer(response: AIQueryResponse, lang: string): string {
    if (response.generated_report) {
      return lang === 'ko' ? 
        '📄 자동 보고서를 생성했습니다. 아래에서 확인하세요.' :
        '📄 Automated report generated. Please see below.';
    }
    return lang === 'ko' ? 
      '📄 보고서 생성 준비 중입니다.' :
      '📄 Report generation in progress.';
  }

  private generatePerformanceAnswer(response: AIQueryResponse, lang: string): string {
    return lang === 'ko' ? 
      '⚡ 성능 분석을 완료했습니다. AI 모델을 통해 시스템 성능을 평가했습니다.' :
      '⚡ Performance analysis completed. System performance evaluated through AI models.';
  }

  private generateGeneralAnswer(response: AIQueryResponse, lang: string): string {
    if (response.mcp_results?.success && response.mcp_results.results.length > 0) {
      return lang === 'ko' ? 
        '📚 관련 문서를 찾았습니다. 추가 정보를 확인하세요.' :
        '📚 Relevant documentation found. Please check additional information.';
    }
    return lang === 'ko' ? 
      '🤖 질문을 이해했습니다. 더 구체적인 정보를 제공해 주시면 더 정확한 답변을 드릴 수 있습니다.' :
      '🤖 I understand your question. Please provide more specific information for a more accurate response.';
  }

  private generateRecommendations(nlpResult: any, response: AIQueryResponse): void {
    const lang = response.metadata.language;
    const intent = nlpResult.intent;
    
    const recommendations = [];

    switch (intent) {
      case 'troubleshooting':
      case 'emergency':
        if (lang === 'ko') {
          recommendations.push('즉시 시스템 로그를 확인하세요');
          recommendations.push('부하 분산 상태를 점검하세요');
          recommendations.push('백업 시스템 준비 상태를 확인하세요');
        } else {
          recommendations.push('Check system logs immediately');
          recommendations.push('Verify load balancing status');
          recommendations.push('Confirm backup system readiness');
        }
        break;
        
      case 'prediction':
        if (lang === 'ko') {
          recommendations.push('예측 결과를 바탕으로 사전 조치를 계획하세요');
          recommendations.push('리소스 확장 계획을 검토하세요');
        } else {
          recommendations.push('Plan preventive actions based on predictions');
          recommendations.push('Review resource scaling plans');
        }
        break;
        
      case 'performance':
        if (lang === 'ko') {
          recommendations.push('성능 병목 지점을 식별하여 최적화하세요');
          recommendations.push('메모리 사용량을 모니터링하세요');
        } else {
          recommendations.push('Identify and optimize performance bottlenecks');
          recommendations.push('Monitor memory usage closely');
        }
        break;
        
      default:
        if (lang === 'ko') {
          recommendations.push('정기적인 시스템 모니터링을 유지하세요');
          recommendations.push('백업 및 복구 계획을 점검하세요');
        } else {
          recommendations.push('Maintain regular system monitoring');
          recommendations.push('Review backup and recovery plans');
        }
    }

    response.recommendations = recommendations;
  }

  private shouldGenerateReport(nlpResult: any, request: AIQueryRequest): boolean {
    return nlpResult.intent === 'reporting' || 
           nlpResult.specialized_analysis?.urgency_level === 'critical' ||
           request.context?.include_charts === true;
  }

  private async generateReport(response: AIQueryResponse, request: AIQueryRequest): Promise<void> {
    try {
      if (!response.generated_report) {
        const reportData = {
          timestamp: response.metadata.timestamp,
          summary: response.answer,
          failure_analysis: response.analysis_results.anomaly_detection || {},
          prediction_results: response.analysis_results.ai_predictions || {},
          ai_insights: [response.answer],
          recommendations: response.recommendations,
          metrics_data: {},
          charts: [],
          system_status: { overall: 'analyzed' },
          time_range: {
            start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
            duration: '1h'
          }
        };

        const reportConfig = {
          format: 'markdown' as const,
          include_charts: request.context?.include_charts || false,
          include_raw_data: false,
          template: 'technical' as const,
          language: response.metadata.language as 'ko' | 'en'
        };

        response.generated_report = await autoReportGenerator.generateFailureReport(reportData, reportConfig);
        response.processing_stats.components_used.push('report_generator');
      }
    } catch (error: any) {
      console.error('보고서 생성 실패:', error);
    }
  }

  private async collectSystemMetrics(serverIds?: string[]): Promise<SystemMetrics> {
    // 실제 구현에서는 Prometheus나 메트릭 서비스에서 데이터를 가져옴
    // 현재는 데모용 데이터 반환
    return {
      servers: {
        'server-01': {
          cpu: [45, 52, 48, 67, 73, 69, 71, 65, 58, 61],
          memory: [78, 82, 79, 85, 88, 84, 87, 83, 80, 85],
          disk: [45, 46, 47, 48, 49, 50, 51, 48, 47, 49],
          network: [23, 28, 31, 35, 29, 26, 33, 37, 24, 30]
        },
        'server-02': {
          cpu: [32, 38, 41, 45, 42, 39, 44, 47, 43, 40],
          memory: [65, 68, 71, 74, 69, 72, 75, 70, 67, 73],
          disk: [55, 57, 59, 58, 60, 62, 61, 59, 58, 60],
          network: [18, 22, 25, 28, 24, 21, 26, 29, 23, 27]
        }
      },
      global_stats: {
        total_servers: 2,
        healthy_servers: 2,
        average_cpu: 55.5,
        average_memory: 76.5
      },
      alerts: [],
      timestamp: new Date().toISOString()
    };
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 스트리밍 응답 지원
  async *processQueryStream(request: AIQueryRequest): AsyncGenerator<Partial<AIQueryResponse>, void, unknown> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();

    yield {
      query_id: queryId,
      metadata: { 
        timestamp: new Date().toISOString(),
        language: request.context?.language || 'ko'
      }
    };

    try {
      // NLP 분석
      const nlpResult = await nlpProcessor.processQuery(request.query);
      yield {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        analysis_results: { nlp_analysis: nlpResult }
      };

      // 시스템 메트릭 수집
      const systemMetrics = await this.collectSystemMetrics(request.context?.server_ids);
      if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
        // 🔧 타입 에러 수정: 중첩 구조를 플랫 구조로 변환
        const flattenedMetrics: Record<string, number[]> = {};
        
        for (const [serverId, serverMetrics] of Object.entries(systemMetrics.servers)) {
          for (const [metricName, values] of Object.entries(serverMetrics)) {
            const key = `${serverId}_${metricName}`;
            flattenedMetrics[key] = values;
          }
        }
        
        const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
        yield {
          analysis_results: {
            nlp_analysis: nlpResult,
            ai_predictions: aiAnalysis.failure_predictions,
            anomaly_detection: aiAnalysis.anomaly_detections,
            trend_forecasts: aiAnalysis.trend_predictions
          }
        };
      }

      // 최종 응답
      yield {
        success: true,
        processing_stats: {
          total_time: Date.now() - startTime,
          components_used: ['nlp-processor', 'tensorflow-engine'],
          models_executed: ['neural-network', 'autoencoder'],
          data_sources: ['system-metrics']
        }
      };

    } catch (error: any) {
      yield {
        success: false,
        answer: `스트리밍 처리 중 오류가 발생했습니다: ${error.message}`,
        metadata: { 
          timestamp: new Date().toISOString(),
          language: request.context?.language || 'ko'
        }
      };
    }
  }

  async getEngineStatus(): Promise<any> {
    const componentStatuses = await Promise.all([
      realMCPClient.getConnectionInfo(),
      tensorFlowAIEngine.getModelInfo(),
      nlpProcessor.getProcessorInfo(),
      autoReportGenerator.getGeneratorInfo()
    ]);

    return {
      engine_version: '3.0.0',
      initialized: this.initialized,
      active_sessions: this.activeSessions.size,
      components: {
        mcp_client: componentStatuses[0],
        tensorflow_engine: componentStatuses[1],
        nlp_processor: componentStatuses[2],
        report_generator: componentStatuses[3]
      },
      capabilities: [
        '자연어 질의응답',
        '실시간 장애 예측',
        '이상 탐지',
        '시계열 예측',
        '자동 보고서 생성',
        'MCP 프로토콜 지원',
        '다국어 지원 (한국어/영어)',
        'Vercel Edge Runtime 호환'
      ],
      supported_intents: [
        'troubleshooting', 'prediction', 'analysis', 
        'monitoring', 'reporting', 'performance', 'emergency'
      ],
      last_cache_update: new Date().toISOString()
    };
  }

  dispose(): void {
    console.log('🗑️ 통합 AI 엔진 정리 중...');
    
    this.lastAnalysisCache.clear();
    this.activeSessions.clear();
    
    // TensorFlow.js 메모리 정리
    tensorFlowAIEngine.dispose();
    
    this.initialized = false;
    console.log('✅ 통합 AI 엔진 정리 완료');
  }
}

// 싱글톤 인스턴스
export const integratedAIEngine = new IntegratedAIEngine(); 