/**
 * 🤖 AI 서비스 상세 타입 정의 (Redis-Free)
 *
 * AI 서비스에서 사용되는 구체적인 타입들을 정의
 * any 타입 제거를 위한 강타입 시스템
 * Redis 의존성 완전 제거
 */

import type { Server } from './server';
import type { MCPServerInfo } from './mcp';

// ============================================================================
// 📋 컨텍스트 관련 타입
// ============================================================================

/**
 * AI 쿼리 컨텍스트
 */
export interface AIQueryContext {
  /** 사용자 정보 */
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  /** 세션 정보 */
  session?: {
    id: string;
    startTime: Date;
    queryCount: number;
  };
  /** 서버 관련 컨텍스트 */
  servers?: Server[];
  /** 이전 대화 기록 */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  /** 이전 쿼리 목록 (복잡도 분석용) */
  previousQueries?: string[];
  /** 추가 메타데이터 */
  metadata?: AIMetadata;
}

/**
 * MCP 컨텍스트
 */
export interface MCPContext {
  /** 관련 파일 정보 */
  files: Array<{
    path: string;
    content: string;
    language?: string;
    size?: number;
  }>;
  /** 프로젝트 정보 */
  project?: {
    name: string;
    type: string;
    framework?: string;
    dependencies?: Record<string, string>;
  };
  /** MCP 서버 정보 */
  servers?: MCPServerInfo[];
  /** 추가 컨텍스트 데이터 */
  additionalContext?: Record<string, unknown>;
}

// ============================================================================
// 📊 RAG (Retrieval-Augmented Generation) 관련 타입
// ============================================================================

/**
 * RAG 검색 결과
 */
export interface RAGSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: AIMetadata;
  source?: string;
  timestamp?: Date;
}

/**
 * RAG 쿼리 결과
 */
export interface RAGQueryResult {
  results: RAGSearchResult[];
  totalCount: number;
  searchTime: number;
  query: string;
  embeddings?: number[];
}

// ============================================================================
// 🎯 AI 응답 관련 타입
// ============================================================================

/**
 * AI 쿼리 옵션
 */
export interface AIQueryOptions {
  /** 온도 (창의성 수준) */
  temperature?: number;
  /** 최대 토큰 수 */
  maxTokens?: number;
  /** 응답 포맷 */
  format?: 'text' | 'json' | 'markdown';
  /** 스트리밍 여부 */
  stream?: boolean;
  /** 사용할 모델 */
  model?: string;
  /** 응답 깊이 */
  depth?: 'mini' | 'standard' | 'deep' | 'comprehensive';
  /** MCP 컨텍스트 포함 여부 */
  includeMCPContext?: boolean;
  /** 카테고리 필터 */
  category?: string;
  /** 캐시 사용 여부 */
  cached?: boolean;
}

/**
 * AI 메타데이터
 */
export interface AIMetadata {
  /** 타임스탬프 */
  timestamp?: string | Date;
  /** 소스 정보 */
  source?: string;
  /** 버전 정보 */
  version?: string;
  /** 태그 */
  tags?: string[];
  /** 중요도 */
  importance?: number;
  /** 카테고리 */
  category?: string;
  /** 추가 속성 (최소화) */
  [key: string]: string | number | boolean | Date | string[] | Record<string, any> | undefined;
}

// ============================================================================
// 💾 메모리 기반 캐시 관련 타입 (Redis 대체)
// ============================================================================

/**
 * 메모리 캐시 인터페이스
 */
export interface MemoryCacheInterface {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  keys(): string[];
  size(): number;
}

/**
 * 캐시 엔트리 타입
 */
export interface CacheEntry<T = unknown> {
  value: T;
  expires: number;
  created: number;
}

/**
 * 캐시 설정 타입
 */
export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

// ============================================================================
// 📈 성능 메트릭 타입
// ============================================================================

/**
 * AI 엔진 성능 메트릭
 */
export interface AIEngineMetrics {
  /** 총 요청 수 */
  totalRequests: number;
  /** 성공률 (%) */
  successRate: number;
  /** 평균 응답 시간 (ms) */
  avgResponseTime: number;
  /** 마지막 사용 시간 */
  lastUsed?: string;
  /** 에러 횟수 */
  errorCount: number;
  /** 캐시 히트율 */
  cacheHitRate?: number;
}

/**
 * 메모리 사용량 메트릭
 */
export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  usagePercent: number;
}

// ============================================================================
// 🚀 서비스 응답 타입
// ============================================================================

/**
 * AI 서비스 표준 응답
 */
export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    processingTime: number;
    engineUsed: string;
    confidence?: number;
    sources?: string[];
    cached?: boolean;
    memoryUsage?: MemoryMetrics;
  };
}

/**
 * 스트리밍 응답 청크
 */
export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: {
    tokenCount?: number;
    chunkIndex: number;
  };
}

// ============================================================================
// 🛠️ 유틸리티 타입
// ============================================================================

/**
 * 서버 응답 배열 타입
 */
export type ServerArray = Server[];

/**
 * 메타데이터 레코드 타입 (any 대체)
 */
export type MetadataRecord = Record<
  string,
  string | number | boolean | Date | string[]
>;

/**
 * 쿼리 파라미터 타입
 */
export interface QueryParams {
  query: string;
  mode?: 'local' | 'google-ai';
  context?: AIQueryContext;
  options?: AIQueryOptions;
  mcpContext?: MCPContext;
}

/**
 * 메모리 기반 세션 관리 타입
 */
export interface MemorySession {
  id: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  queryCount: number;
  data: Record<string, unknown>;
  expires: number;
}

// ============================================================================
// 🔧 타입 가드 함수
// ============================================================================

export function isRAGSearchResult(obj: unknown): obj is RAGSearchResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'similarity' in obj &&
    typeof (obj as RAGSearchResult).similarity === 'number'
  );
}

export function isAIQueryContext(obj: unknown): obj is AIQueryContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (!('user' in obj) || typeof (obj as AIQueryContext).user === 'object')
  );
}

export function isMCPContext(obj: unknown): obj is MCPContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'files' in obj &&
    Array.isArray((obj as MCPContext).files)
  );
}

export function isMemoryCacheInterface(obj: unknown): obj is MemoryCacheInterface {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'get' in obj &&
    'set' in obj &&
    'delete' in obj &&
    'clear' in obj &&
    typeof (obj as MemoryCacheInterface).get === 'function' &&
    typeof (obj as MemoryCacheInterface).set === 'function'
  );
}

export function isMemorySession(obj: unknown): obj is MemorySession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'startTime' in obj &&
    'lastActivity' in obj &&
    typeof (obj as MemorySession).id === 'string' &&
    typeof (obj as MemorySession).startTime === 'number'
  );
}

// ============================================================================
// 🔨 에러 처리 관련 타입
// ============================================================================

/**
 * 에러 컨텍스트 타입
 */
export interface ErrorContext {
  /** 에러가 발생한 함수/메서드 이름 */
  method?: string;
  /** 에러가 발생한 파일 경로 */
  file?: string;
  /** 에러가 발생한 줄 번호 */
  line?: number;
  /** 사용자 ID */
  userId?: string;
  /** 요청 ID */
  requestId?: string;
  /** API 엔드포인트 */
  endpoint?: string;
  /** HTTP 메서드 */
  httpMethod?: string;
  /** 에러 발생 시간 */
  timestamp?: string | Date;
  /** 환경 (development, production 등) */
  environment?: string;
  /** 메모리 사용량 (에러 시점) */
  memoryUsage?: MemoryMetrics;
  /** 추가 속성 (최소화) */
  [key: string]: string | number | boolean | Date | MemoryMetrics | undefined;
}

/**
 * 모니터링 이벤트 데이터 타입
 */
export interface MonitoringEventData {
  /** 이벤트 이름 */
  eventName: string;
  /** 이벤트 심각도 */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** 영향받은 서비스 */
  service?: string;
  /** 에러 코드 */
  errorCode?: string;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 복구 시도 횟수 */
  recoveryAttempts?: number;
  /** 폴백 사용 여부 */
  fallbackUsed?: boolean;
  /** 메모리 기반 캐시 사용 여부 */
  memoryCacheUsed?: boolean;
  /** 추가 속성 (최소화) */
  [key: string]: string | number | boolean | Date | undefined;
}

// ============================================================================
// 🔄 상태 관리 관련 타입
// ============================================================================

/**
 * 메모리 기반 상태 저장소 인터페이스
 */
export interface MemoryStateStore {
  getState<T>(key: string): T | null;
  setState<T>(key: string, value: T): void;
  removeState(key: string): boolean;
  clearAll(): void;
  getAllKeys(): string[];
  hasState(key: string): boolean;
}

/**
 * AI 서비스 상태 타입
 */
export interface AIServiceState {
  isInitialized: boolean;
  engineStatus: Record<string, 'active' | 'inactive' | 'error'>;
  lastHealthCheck: number;
  memoryUsage: MemoryMetrics;
  activeQueries: number;
  totalQueries: number;
  errorCount: number;
}