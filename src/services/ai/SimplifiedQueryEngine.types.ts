/**
 * 🎯 SimplifiedQueryEngine Type Definitions
 * 
 * Shared types and interfaces for the SimplifiedQueryEngine system
 */

import type { ComplexityScore } from './query-complexity-analyzer';
import type { Entity, IntentResult } from '@/modules/ai-agent/processors/IntentClassifier';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  RAGSearchResult,
  AIMetadata,
  ServerArray,
} from '@/types/ai-service-types';

export interface QueryRequest {
  query: string;
  mode?: 'local' | 'google-ai' | 'local-ai'; // 'auto' 제거, 'local-ai' 추가
  context?: AIQueryContext;
  
  // 모드별 기능 제어 옵션 (UnifiedAIEngineRouter에서 설정)
  enableGoogleAI?: boolean;        // Google AI API 활성화/비활성화
  enableAIAssistantMCP?: boolean;  // 로컬 MCP를 통한 컨텍스트 로딩 활성화/비활성화
  enableKoreanNLP?: boolean;       // 한국어 NLP 활성화/비활성화
  enableVMBackend?: boolean;       // VM AI 백엔드 활성화/비활성화 (MCP와 무관)
  
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
      requestType?: 'command_inquiry' | 'command_usage' | 'command_request' | 'general';
    };
  };
}

export interface QueryResponse {
  success: boolean;
  response: string;
  engine: 'local-rag' | 'local-ai' | 'google-ai' | 'fallback';
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
  requestType?: 'command_inquiry' | 'command_usage' | 'command_request' | 'general';
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

// GCP VM MCP 결과 타입 정의 - any 타입 제거
export interface GCPVMMCPResult {
  success: boolean;
  data?: {
    response: string;
    confidence?: number;
    metadata?: Record<string, string | number | boolean>;
  };
  error?: string;
}

// Thinking step type definition
export interface ThinkingStep {
  step: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  duration?: number;
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