/**
 * 🤖 AI 엔진 타입 정의
 * 
 * Single Responsibility: 모든 AI 관련 인터페이스와 타입을 통합 관리
 */

export interface AIQueryRequest {
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

export interface AIQueryResponse {
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

export interface SystemMetrics {
  servers: Record<string, Record<string, number[]>>;
  global_stats: any;
  alerts: any[];
  timestamp: string;
}

export interface NLPAnalysisResult {
  intent: string;
  confidence: number;
  entities: any[];
  keywords: string[];
  language: string;
  sentiment: string;
  query_type: string;
}

export interface ProcessingContext {
  nlpResult: NLPAnalysisResult;
  request: AIQueryRequest;
  response: AIQueryResponse;
}

export type RenderStatus = 'active' | 'sleeping' | 'error';

export type AIIntent = 
  | 'troubleshooting'
  | 'emergency' 
  | 'prediction'
  | 'analysis'
  | 'monitoring'
  | 'reporting'
  | 'performance'
  | 'general';

export interface AIEngineConfiguration {
  renderPingInterval: number;
  maxCacheSize: number;
  defaultConfidenceThreshold: number;
  supportedLanguages: string[];
}

export interface IntentHandler {
  handle(context: ProcessingContext): Promise<void>;
}

export interface ResponseGeneratorConfig {
  defaultLanguage: string;
  includeDebugInfo: boolean;
  maxResponseLength: number;
}

export interface MetricsCollectionOptions {
  serverIds?: string[];
  includeGlobalStats?: boolean;
  includeAlerts?: boolean;
}