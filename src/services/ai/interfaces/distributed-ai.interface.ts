/**
 * 🏗️ 분산 AI 시스템 공통 인터페이스
 * 
 * 하이브리드 아키텍처를 위한 표준 인터페이스 정의
 * - 물리적 분산, 논리적 통합
 * - Edge 최적화 지원
 * - 분산 트랜잭션 패턴
 */

import type { AIMetadata } from '@/types/ai-service-types';

// ============ 공통 타입 정의 ============

/**
 * AI 서비스 타입
 */
export type AIServiceType = 
  | 'supabase-rag'    // Supabase PostgreSQL + pgvector
  | 'gcp-korean-nlp'  // GCP Functions Korean NLP
  | 'gcp-ml-analytics' // GCP Functions ML Analytics
  | 'redis-cache'     // Upstash Redis Cache
  | 'edge-router';    // Vercel Edge Router

/**
 * 처리 상태
 */
export type ProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timeout';

/**
 * 생각중 단계 정보
 */
export interface ThinkingStep {
  id: string;
  step: string;
  description?: string;
  status: ProcessingStatus;
  timestamp: number;
  duration?: number;
  service?: AIServiceType;
}

/**
 * 분산 서비스 요청 기본 인터페이스
 */
export interface DistributedRequest {
  id: string;
  query: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  metadata?: AIMetadata;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * 분산 서비스 응답 기본 인터페이스
 */
export interface DistributedResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: DistributedError;
  metadata: ResponseMetadata;
  thinkingSteps?: ThinkingStep[];
}

/**
 * 응답 메타데이터
 */
export interface ResponseMetadata {
  service: AIServiceType;
  processingTime: number;
  tokensUsed?: number;
  cacheHit?: boolean;
  fallbackUsed?: boolean;
  timestamp: string;
}

/**
 * 분산 시스템 에러
 */
export interface DistributedError {
  code: string;
  message: string;
  service: AIServiceType;
  details?: unknown;
  recoverable: boolean;
  retryAfter?: number;
}

// ============ 서비스별 인터페이스 ============

/**
 * Supabase RAG 인터페이스
 */
export interface SupabaseRAGRequest extends DistributedRequest {
  maxResults?: number;
  threshold?: number;
  includeContext?: boolean;
}

export interface SupabaseRAGResponse {
  results: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata?: AIMetadata;
  }>;
  context?: string;
  totalResults: number;
}

/**
 * GCP Functions 인터페이스
 */
export interface GCPFunctionRequest extends DistributedRequest {
  functionType: 'korean-nlp' | 'ml-analytics' | 'unified-processor';
  parameters?: Record<string, unknown>;
}

export interface GCPFunctionResponse {
  result: unknown;
  confidence?: number;
  processingSteps?: string[];
}

/**
 * Redis 캐시 인터페이스
 */
export interface RedisCacheRequest {
  operation: 'get' | 'set' | 'xadd' | 'xread';
  key: string;
  value?: unknown;
  ttl?: number;
  stream?: {
    id?: string;
    fields?: Record<string, string>;
  };
}

export interface RedisCacheResponse {
  success: boolean;
  data?: unknown;
  ttl?: number;
}

// ============ Edge 라우터 인터페이스 ============

/**
 * Edge 라우터 설정
 */
export interface EdgeRouterConfig {
  // 병렬 처리 설정
  enableParallel: boolean;
  maxConcurrency: number;
  
  // 타임아웃 설정
  globalTimeout: number;
  serviceTimeouts: Partial<Record<AIServiceType, number>>;
  
  // Circuit Breaker
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };
  
  // 캐싱 전략
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

/**
 * Edge 라우터 요청
 */
export interface EdgeRouterRequest extends DistributedRequest {
  services: AIServiceType[];
  parallel?: boolean;
  fallbackChain?: AIServiceType[];
}

/**
 * Edge 라우터 응답
 */
export interface EdgeRouterResponse {
  results: Map<AIServiceType, DistributedResponse>;
  aggregatedData?: unknown;
  routingPath: AIServiceType[];
  totalProcessingTime: number;
}

// ============ 분산 트랜잭션 ============

/**
 * Saga 패턴 트랜잭션
 */
export interface SagaTransaction {
  id: string;
  steps: SagaStep[];
  status: 'pending' | 'executing' | 'completed' | 'compensating' | 'failed';
  startTime: number;
  endTime?: number;
}

export interface SagaStep {
  service: AIServiceType;
  action: string;
  status: ProcessingStatus;
  compensationAction?: string;
  result?: unknown;
  error?: DistributedError;
}

// ============ 서비스 헬스 체크 ============

export interface ServiceHealth {
  service: AIServiceType;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  successRate: number;
  lastCheck: string;
  details?: {
    memoryUsage?: number;
    activeConnections?: number;
    queueSize?: number;
  };
}

// ============ 타입 가드 ============

export function isDistributedError(error: unknown): error is DistributedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'service' in error &&
    'recoverable' in error
  );
}

export function isSupabaseRAGResponse(
  response: unknown
): response is DistributedResponse<SupabaseRAGResponse> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'metadata' in response &&
    (response as DistributedResponse).metadata.service === 'supabase-rag'
  );
}

export function isGCPFunctionResponse(
  response: unknown
): response is DistributedResponse<GCPFunctionResponse> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'metadata' in response &&
    ((response as DistributedResponse).metadata.service === 'gcp-korean-nlp' ||
     (response as DistributedResponse).metadata.service === 'gcp-ml-analytics')
  );
}