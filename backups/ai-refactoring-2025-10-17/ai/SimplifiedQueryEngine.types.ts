/**
 * 🎯 SimplifiedQueryEngine Type Definitions
 *
 * Shared types and interfaces for the SimplifiedQueryEngine system
 */

import type { ComplexityScore } from './query-complexity-analyzer';
import type {
  Entity,
  IntentResult,
} from '../../modules/ai-agent/processors/IntentClassifier';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  RAGSearchResult,
  AIMetadata,
  ServerArray,
} from '../../types/ai-service-types';
import type { AIMode } from '../../types/ai-types';
import type { EnhancedServerMetrics } from '@/types/server';

export interface QueryRequest {
  query: string;
  mode?: AIMode | 'local' | 'local-ai'; // AIMode와 하위 호환성을 위한 추가 값들
  context?: AIQueryContext;

  // 모드별 기능 제어 옵션
  enableGoogleAI?: boolean; // Google AI API 활성화/비활성화
  enableAIAssistantMCP?: boolean; // 로컬 MCP를 통한 컨텍스트 로딩 활성화/비활성화
  enableKoreanNLP?: boolean; // 한국어 NLP 활성화/비활성화
  enableVMBackend?: boolean; // VM AI 백엔드 활성화/비활성화 (MCP와 무관)

  options?: AIQueryOptions & {
    includeThinking?: boolean;
    includeMCPContext?: boolean;
    category?: string;
    cached?: boolean;
    timeoutMs?: number; // 타임아웃 설정
    commandContext?: {
      isCommandRequest?: boolean;
      categories?: string[];
      specificCommands?: string[];
      requestType?:
        | 'command_inquiry'
        | 'command_usage'
        | 'command_request'
        | 'general';
    };
  };
}

export interface QueryResponse {
  success: boolean;
  response: string;
  engine: 
    | 'local-rag' 
    | 'local-ai' 
    | 'google-ai' 
    | 'fallback'
    | 'pattern-matched'
    | 'streaming-initial'
    | 'streaming-fallback'
    | 'ultra-performance'
    | 'ultra-fallback'
    | 'pattern-based'
    | 'keyword-based'
    | 'basic-keyword'
    | 'quick-${string}'
    | 'error-fallback'
    | 'preloaded';
  confidence: number;
  thinkingSteps: Array<{
    step: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    duration?: number;
  }>;
  metadata?: AIMetadata & {
    complexity?: ComplexityScore;
    cacheHit?: boolean;
  };
  error?: string;
  processingTime: number;
}

// NLP 분석 결과 타입 정의 - any 타입 제거
export interface NLPAnalysis {
  intent: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  topics?: string[];
  summary?: string;
  metadata?: Record<string, string | number | boolean>;
}

// NLP 결과 타입 정의 - any 타입 제거
export interface NLPResult {
  success: boolean;
  intent?: string;
  entities?: Entity[];
  confidence?: number;
  analysis?: NLPAnalysis;
}

// 명령어 컨텍스트 타입 정의 - any 타입 제거
export interface CommandContext {
  isCommandRequest?: boolean;
  categories?: string[];
  specificCommands?: string[];
  requestType?:
    | 'command_inquiry'
    | 'command_usage'
    | 'command_request'
    | 'general';
  metadata?: Record<string, string | number | boolean>;
}

// Mock 컨텍스트 타입 정의 - any 타입 제거
export interface MockContext {
  currentTime?: string;
  serverCount?: number;
  servers?: Array<{
    id: string;
    name: string;
    status: string;
    cpu: number;
    memory: number;
  }>;
  metrics?: {
    serverCount: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
  };
  metadata?: Record<string, string | number | boolean>;
}


/**
 * 📊 서버 상태 분석 결과 (UnifiedMetricsService)
 */
export interface ServerStatusAnalysis {
  summary: string;
  criticalServers: EnhancedServerMetrics[];
  warningServers: EnhancedServerMetrics[];
  healthyServers: EnhancedServerMetrics[];
  timeContext: string;
}



// GCP VM MCP 타입 제거됨 - Cloud Functions 전용으로 단순화

// Thinking step type definition - ai-sidebar-types.ts와 완전 호환
export interface ThinkingStep {
  id?: string;
  step: string;
  title?: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  duration?: number;
  content?: string;
  // AI 사고 과정의 모든 type 값들을 지원하도록 확장
  type?: 
    | 'analysis' | 'data_processing' | 'pattern_matching' | 'reasoning' | 'response_generation'
    | 'analyzing' | 'processing' | 'generating' | 'completed' | 'error';
  progress?: number;
  confidence?: number;
  subSteps?: string[];
  metadata?: Record<string, unknown>;
}

// Cache entry type definition
export interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  hits: number;
}

// Health check result type
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    rag: boolean;
    contextLoader: boolean;
    mockContextLoader: boolean;
    intentClassifier: boolean;
  };
  responseTime: number;
  cacheSize: number;
}

// ===== Router Configuration =====

export interface RouterConfig {
  // 보안 설정
  enableSecurity: boolean;
  strictSecurityMode: boolean;

  // 토큰 사용량 제한
  dailyTokenLimit: number;
  userTokenLimit: number;

  // 엔진 선택 설정 (모드 분리)
  preferredEngine: 'local-ai' | 'google-ai';

  // 캐시 설정
  enableCache: boolean;
  cacheTTL: number;

  // 성능 설정
  timeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;

  // 한국어 NLP 설정
  enableKoreanNLP: boolean;

  // 로그 레벨
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

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
