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

export interface KoreanNLPResponse {
  query: string;
  analysis: {
    sentiment: string;
    keywords: string[];
    intent: string;
    confidence: number;
    language: string;
    processing_region: string;
    response_time_ms: number;
  };
  context?: unknown;
  processed_at: string;
  region: string;
  country: string;
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

export interface UnifiedAIRequest {
  query: string;
  ai_type?: 'nlp' | 'ml' | 'general';
  context?: unknown;
}

export interface UnifiedAIResponse {
  query: string;
  ai_type: string;
  result: {
    type: string;
    [key: string]: unknown;
  };
  context?: unknown;
  processed_at: string;
  processing_time_ms: number;
  region: string;
  country: string;
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