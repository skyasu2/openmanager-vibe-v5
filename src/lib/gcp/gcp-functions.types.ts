/**
 * GCP Functions 타입 정의
 */

// 기본 Result 타입 (discriminated union)
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: number; details?: string };

// GCP Functions 요청/응답 타입들
export interface KoreanNLPRequest {
  query: string;
  context?: unknown;
}

export interface KoreanNLPEntity {
  type: string;
  value: string;
  confidence: number;
  normalized: string;
}

export interface KoreanNLPSemanticAnalysis {
  main_topic: string;
  sub_topics: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  technical_complexity: number;
}

export interface KoreanNLPServerContext {
  target_servers: string[];
  metrics: string[];
  time_range?: Record<string, string>;
  comparison_type?: string;
}

export interface KoreanNLPResponseGuidance {
  response_type: string;
  detail_level: string;
  visualization_suggestions: string[];
  follow_up_questions: string[];
}

export interface KoreanNLPQualityMetrics {
  confidence: number;
  processing_time: number;
  analysis_depth: number;
  context_relevance: number;
}

export interface KoreanNLPResponse {
  intent: string;
  entities: KoreanNLPEntity[];
  semantic_analysis: KoreanNLPSemanticAnalysis;
  server_context: KoreanNLPServerContext;
  response_guidance: KoreanNLPResponseGuidance;
  quality_metrics: KoreanNLPQualityMetrics;
}

export interface MLAnalyticsRequest {
  metrics: unknown[];
  context?: {
    analysis_type?: string;
    [key: string]: unknown;
  };
}

export interface MLAnalyticsResponse {
  analysis_type: string;
  metrics_count: number;
  summary: {
    cpu_average: number;
    memory_average: number;
    trend: string;
    health_score: number;
  };
  anomalies: Array<{
    type: string;
    severity: string;
    value: number;
    threshold: number;
  }>;
  prediction: {
    next_hour_cpu: number;
    next_hour_memory: number;
    confidence: number;
  };
  processed_at: string;
  processing_time_ms: number;
  region: string;
  country: string;
}

export interface UnifiedAIProcessingResult {
  processor: string;
  success: boolean;
  data?: Record<string, unknown> | null;
  error?: string | null;
  processing_time: number;
}

export interface UnifiedAIAggregatedData {
  confidence_score?: number;
  main_insights?: string[];
  entities?: Record<string, unknown[]>;
  metrics?: Record<string, number>;
  patterns?: Array<Record<string, unknown>>;
  anomalies?: Array<Record<string, unknown>>;
}

export interface UnifiedAIResponse {
  results: UnifiedAIProcessingResult[];
  aggregated_data: UnifiedAIAggregatedData;
  recommendations: string[];
  cache_hit: boolean;
}

export interface UnifiedAIRequest {
  query: string;
  context?: Record<string, unknown>;
  processors?: string[];
  options?: Record<string, unknown>;
}

// 클라이언트 설정 타입
export interface GCPFunctionsClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  apiVersion?: string;
  clientId?: string;
}

// 에러 타입들
export enum GCPFunctionErrorCode {
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GCPFunctionError extends Error {
  code: GCPFunctionErrorCode;
  status?: number;
  details?: string;
  functionName?: string;
}

// Rate limiting 타입
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitState {
  requests: number[];
  lastReset: number;
}
