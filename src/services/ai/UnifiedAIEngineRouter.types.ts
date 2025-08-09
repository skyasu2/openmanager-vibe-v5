/**
 * 🏗️ Unified AI Engine Router - Type Definitions
 * 
 * Central type definitions for the AI routing system
 * - Router configuration and metrics
 * - Korean NLP and command recommendation types
 * - Response and routing information types
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';

// ===== Korean NLP Response Types =====

export interface KoreanNLPResponse {
  intent?: string;
  entities?: Array<{ value: string; type?: string }>;
  semantic_analysis?: {
    main_topic?: string;
    urgency_level?: string;
  };
  response_guidance?: {
    visualization_suggestions?: string[];
  };
}

// ===== Command Recommendation Types =====

export interface CommandRecommendation {
  command: string;
  description: string;
  category: string;
  confidence: number;
  usage_example: string;
  related_commands?: string[];
}

export interface CommandRequestContext {
  isCommandRequest: boolean;
  detectedCategories: string[];
  specificCommands: string[];
  confidence: number;
  requestType: 'command_inquiry' | 'command_usage' | 'command_request' | 'general';
}

export interface CommandAnalysisResult {
  recommendations: CommandRecommendation[];
  analysis: CommandRequestContext;
  formattedResponse: string;
}

export interface CommandDetectionResult {
  isCommand: boolean;
  confidence: number;
  categories: string[];
  type: CommandRequestContext['requestType'];
}

// ===== Router Configuration =====

export interface RouterConfig {
  // 보안 설정
  enableSecurity: boolean;
  strictSecurityMode: boolean;

  // 토큰 사용량 제한
  dailyTokenLimit: number;
  userTokenLimit: number;

  // 엔진 선택 설정 (모드 분리) - 필수 파라미터
  preferredEngine: 'local-ai' | 'google-ai'; // 더 이상 optional이 아님
  fallbackChain: string[];

  // 성능 설정
  enableCircuitBreaker: boolean;
  maxRetries: number;
  timeoutMs: number;

  // 한국어 처리
  enableKoreanNLP: boolean;
  koreanNLPThreshold: number;
}

// ===== Router Metrics =====

export interface RouterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokenUsage: {
    daily: number;
    total: number;
    byUser: Map<string, number>;
  };
  engineUsage: {
    googleAI: number;
    localRAG: number;
    koreanNLP: number;
    fallback: number;
  };
  securityEvents: {
    promptsBlocked: number;
    responsesFiltered: number;
    threatsDetected: string[];
  };
}

// ===== Circuit Breaker Types =====

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  threshold: number;
  timeout: number;
}

export type CircuitBreakers = Map<string, CircuitBreakerState>;

// ===== Cache Types =====

export interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  ttl: number;
}

export type ResponseCache = Map<string, CacheEntry>;

// ===== Routing Information =====

export interface RoutingInfo {
  selectedEngine: string;
  fallbackUsed: boolean;
  securityApplied: boolean;
  tokensCounted: boolean;
  processingPath: string[];
}

export interface RouteResult extends QueryResponse {
  routingInfo: RoutingInfo;
}

// ===== Extended Request Types =====

export interface ExtendedQueryRequest extends QueryRequest {
  userId?: string;
}

// ===== Engine Selection Types =====

export type AIEngineType = 'simplified' | 'performance-optimized' | 'supabase-rag' | 'korean-nlp';

export interface EngineSelectionContext {
  request: QueryRequest;
  config: RouterConfig;
  circuitBreakers: CircuitBreakers;
  metrics: RouterMetrics;
}

// ===== Security Types =====

export interface SecurityContext {
  enableSecurity: boolean;
  strictMode: boolean;
  enableKoreanProtection: boolean;
}

// ===== Error Types =====

export interface RouterError extends Error {
  engineType?: string;
  retryable?: boolean;
  securityRelated?: boolean;
}

// ===== Utility Types =====

export type ProcessingPathStep = 
  | 'request_received'
  | 'cache_hit'
  | 'cache_miss'
  | 'security_applied'
  | 'engine_selected'
  | 'circuit_breaker_checked'
  | 'engine_executed'
  | 'fallback_triggered'
  | 'response_filtered'
  | 'response_needs_filtering'
  | 'retry_successful'
  | 'tokens_recorded'
  | 'response_cached'
  | 'metrics_updated'
  | 'final_error';

// ===== Default Configuration =====

export const DEFAULT_ROUTER_CONFIG: Omit<RouterConfig, 'preferredEngine'> = {
  enableSecurity: true,
  strictSecurityMode: false, // 포트폴리오 수준 보안으로 완화
  dailyTokenLimit: 10000, // 무료 티어 고려
  userTokenLimit: 1000, // 사용자당 일일 제한
  fallbackChain: ['performance-optimized', 'simplified'], // 모드별 내부 엔진 순서
  enableCircuitBreaker: true,
  maxRetries: 2,
  timeoutMs: 30000, // 30초
  enableKoreanNLP: true,
  koreanNLPThreshold: 0.7,
};

// ===== Type Guards =====

export function isCommandRecommendation(obj: unknown): obj is CommandRecommendation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as CommandRecommendation).command === 'string' &&
    typeof (obj as CommandRecommendation).description === 'string' &&
    typeof (obj as CommandRecommendation).category === 'string' &&
    typeof (obj as CommandRecommendation).confidence === 'number'
  );
}

export function isRouterConfig(obj: unknown): obj is RouterConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as RouterConfig).preferredEngine === 'string' &&
    ['local-ai', 'google-ai'].includes((obj as RouterConfig).preferredEngine)
  );
}

export function isRouteResult(obj: unknown): obj is RouteResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as RouteResult).routingInfo === 'object' &&
    typeof (obj as RouteResult).response === 'string'
  );
}