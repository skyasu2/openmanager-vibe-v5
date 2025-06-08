/**
 * 🎯 의도별 처리 핸들러
 * 
 * Strategy Pattern: 각 의도별로 전략을 분리하여 관리
 * Single Responsibility: 각 핸들러는 하나의 의도만 처리
 */

import { 
  ProcessingContext, 
  IntentHandler, 
  SystemMetrics,
  AIQueryRequest,
  AIQueryResponse 
} from '../ai-types/AITypes';
import { realMCPClient } from '../../../mcp/real-mcp-client';
import { tensorFlowAIEngine } from '../../tensorflow-engine';
import { MetricsCollector } from '../metrics/MetricsCollector';

export class TroubleshootingHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    // 시스템 메트릭 수집
    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids
    });

    // MCP를 통한 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(request.query);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs');

    // AI 장애 분석 실행
    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    response.processing_stats.components_used.push('mcp-client', 'tensorflow-engine');
  }

  private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
    const flattenedMetrics: Record<string, number[]> = {};
    
    for (const [serverId, serverMetrics] of Object.entries(servers)) {
      for (const [metricName, values] of Object.entries(serverMetrics)) {
        const key = `${serverId}_${metricName}`;
        flattenedMetrics[key] = values;
      }
    }
    
    return flattenedMetrics;
  }
}

export class PredictionHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids
    });

    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      
      response.analysis_results.ai_predictions = aiAnalysis.failure_predictions;
      response.analysis_results.trend_forecasts = aiAnalysis.trend_analysis;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    // MCP를 통한 예측 관련 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(`prediction ${request.query}`);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs');
    response.processing_stats.components_used.push('tensorflow-engine', 'mcp-client');
  }

  private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
    const flattenedMetrics: Record<string, number[]> = {};
    
    for (const [serverId, serverMetrics] of Object.entries(servers)) {
      for (const [metricName, values] of Object.entries(serverMetrics)) {
        const key = `${serverId}_${metricName}`;
        flattenedMetrics[key] = values;
      }
    }
    
    return flattenedMetrics;
  }
}

export class AnalysisHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids
    });

    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      
      response.analysis_results.ai_predictions = aiAnalysis.trend_analysis;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    // MCP를 통한 분석 관련 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(`analysis ${request.query}`);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs');
    response.processing_stats.components_used.push('tensorflow-engine', 'mcp-client');
  }

  private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
    const flattenedMetrics: Record<string, number[]> = {};
    
    for (const [serverId, serverMetrics] of Object.entries(servers)) {
      for (const [metricName, values] of Object.entries(serverMetrics)) {
        const key = `${serverId}_${metricName}`;
        flattenedMetrics[key] = values;
      }
    }
    
    return flattenedMetrics;
  }
}

export class MonitoringHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids,
      includeGlobalStats: true,
      includeAlerts: true
    });

    response.analysis_results.active_alerts = systemMetrics.alerts;
    
    // MCP를 통한 모니터링 관련 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(`monitoring ${request.query}`);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs', 'system-metrics');
    response.processing_stats.components_used.push('mcp-client', 'metrics-collector');
  }
}

export class ReportingHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids,
      includeGlobalStats: true,
      includeAlerts: true
    });

    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      
      response.analysis_results.ai_predictions = aiAnalysis.trend_analysis;
      response.analysis_results.anomaly_detection = aiAnalysis.anomaly_detections;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    response.analysis_results.active_alerts = systemMetrics.alerts;

    // MCP를 통한 보고서 관련 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(`report ${request.query}`);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs', 'system-metrics');
    response.processing_stats.components_used.push('tensorflow-engine', 'mcp-client', 'metrics-collector');
  }

  private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
    const flattenedMetrics: Record<string, number[]> = {};
    
    for (const [serverId, serverMetrics] of Object.entries(servers)) {
      for (const [metricName, values] of Object.entries(serverMetrics)) {
        const key = `${serverId}_${metricName}`;
        flattenedMetrics[key] = values;
      }
    }
    
    return flattenedMetrics;
  }
}

export class PerformanceHandler implements IntentHandler {
  private metricsCollector = new MetricsCollector();

  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    const systemMetrics = await this.metricsCollector.collectSystemMetrics({
      serverIds: request.context?.server_ids
    });

    if (systemMetrics.servers && Object.keys(systemMetrics.servers).length > 0) {
      const flattenedMetrics = this.flattenMetrics(systemMetrics.servers);
      const aiAnalysis = await tensorFlowAIEngine.analyzeMetricsWithAI(flattenedMetrics);
      
      response.analysis_results.ai_predictions = aiAnalysis.performance_insights;
      response.analysis_results.trend_forecasts = aiAnalysis.trend_analysis;
      response.processing_stats.models_executed.push(...aiAnalysis.processing_stats.models_used);
    }

    // MCP를 통한 성능 관련 문서 검색
    const mcpResults = await realMCPClient.searchDocuments(`performance ${request.query}`);
    response.mcp_results = mcpResults;
    response.processing_stats.data_sources.push('mcp-docs');
    response.processing_stats.components_used.push('tensorflow-engine', 'mcp-client');
  }

  private flattenMetrics(servers: Record<string, Record<string, number[]>>): Record<string, number[]> {
    const flattenedMetrics: Record<string, number[]> = {};
    
    for (const [serverId, serverMetrics] of Object.entries(servers)) {
      for (const [metricName, values] of Object.entries(serverMetrics)) {
        const key = `${serverId}_${metricName}`;
        flattenedMetrics[key] = values;
      }
    }
    
    return flattenedMetrics;
  }
}

export class GeneralHandler implements IntentHandler {
  async handle(context: ProcessingContext): Promise<void> {
    const { nlpResult, request, response } = context;

    // 키워드 기반 문서 검색
    const keywords = nlpResult.keywords || [request.query];
    const searchDocs = await this.searchDocumentsByKeywords(keywords);
    
    if (searchDocs.length > 0) {
      response.mcp_results = searchDocs;
      response.processing_stats.data_sources.push('mcp-docs');
    }

    // MCP를 통한 일반 검색
    const mcpResults = await realMCPClient.searchDocuments(request.query);
    response.mcp_results = { ...response.mcp_results, ...mcpResults };
    response.processing_stats.components_used.push('mcp-client');
  }

  private async searchDocumentsByKeywords(keywords: string[]): Promise<any[]> {
    try {
      const results = [];
      for (const keyword of keywords.slice(0, 3)) {
        const docs = await realMCPClient.searchDocuments(keyword);
        if (docs && Array.isArray(docs)) {
          results.push(...docs);
        }
      }
      return results.slice(0, 10);
    } catch (error) {
      console.warn('⚠️ 키워드 기반 문서 검색 실패:', error);
      return [];
    }
  }
}

// 핸들러 팩토리
export class IntentHandlerFactory {
  private static handlers = new Map<string, IntentHandler>([
    ['troubleshooting', new TroubleshootingHandler()],
    ['emergency', new TroubleshootingHandler()], // 긴급상황도 문제해결로 처리
    ['prediction', new PredictionHandler()],
    ['analysis', new AnalysisHandler()],
    ['monitoring', new MonitoringHandler()],
    ['reporting', new ReportingHandler()],
    ['performance', new PerformanceHandler()],
    ['general', new GeneralHandler()]
  ]);

  static getHandler(intent: string): IntentHandler {
    return this.handlers.get(intent) || this.handlers.get('general')!;
  }
} 