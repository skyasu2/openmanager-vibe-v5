/**
 * 🔧 MCP (Model Context Protocol) Types
 *
 * MCP 관련 모든 타입 정의를 통합 관리
 * - 중복 제거를 위한 통합 타입 정의
 * - 확장 가능한 인터페이스 구조
 */

// 🔄 중복 제거: MCPServerConfig 통합 정의
export interface MCPServerConfig {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// MCP 요청/응답 타입들
export interface MCPRequest {
  method: string;
  params?: MCPRequestParams;
  id?: string | number;
}

export interface MCPRequestParams {
  toolName?: string;
  arguments?: Record<string, unknown>;
  query?: string;
  paths?: string[];
  sessionId?: string;
  [key: string]: unknown;
}

export interface MCPResponse {
  success: boolean;
  result?: MCPResult;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: string | number;

  // 🔧 호환성을 위한 추가 속성들
  confidence?: number;
  response?: string;
  data?: Record<string, unknown>;
  summary?: string;
  enginesUsed?: string[];
  recommendations?: string[];
  metadata?: MCPMetadata;
}

export interface MCPResult {
  content?: string;
  tools?: MCPTool[];
  resources?: MCPResource[];
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MCPMetadata {
  sessionId?: string;
  timestamp?: string;
  processingTime?: number;
  engineUsed?: string;
  [key: string]: unknown;
}

// MCP 서버 상태 타입
export type MCPServerStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'initializing';

export interface MCPServerInfo {
  name: string;
  status: MCPServerStatus;
  config: MCPServerConfig;
  lastConnected?: Date;
  errorMessage?: string;
}

// MCP Tool 관련 타입들
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  [key: string]: unknown;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  [key: string]: unknown;
}

// MCP Transport 관련 타입들
export interface MCPTransport {
  type: 'stdio' | 'websocket' | 'http';
  config?: Record<string, unknown>;
}

// MCP Client 인터페이스
export interface MCPClient {
  connect(transport?: MCPTransport): Promise<void>;
  request(request: MCPRequest): Promise<MCPResponse>;
  disconnect(): Promise<void>;
  close?: () => Promise<void>; // 호환성을 위해 추가
  isConnected(): boolean;
  process?: NodeJS.Process;
}

// MCP 쿼리 관련 타입들
export interface MCPQuery {
  query: string;
  context?: MCPQueryContext;
  sessionId?: string;
}

export interface MCPQueryContext {
  servers?: Array<{ id: string; name: string; status: string }>;
  userPreferences?: Record<string, unknown>;
  systemInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MCPQueryResponse {
  success: boolean;
  content: string;
  confidence: number;
  sources: string[];
  metadata?: MCPMetadata;
  error?: string;
}

// MCP 처리 단계 관련 타입들
export interface ProcessingStep {
  id: string;
  type: 'analyze' | 'process' | 'synthesize' | 'validate';
  description: string;
  status:
    | 'pending'
    | 'in-progress'
    | 'completed'
    | 'failed'
    | 'running'
    | 'error';
  startTime?: Date | number; // 호환성을 위해 number도 허용
  endTime?: Date | number;
  result?: unknown;
}

export interface ThinkingStep {
  id: string;
  action: string;
  status:
    | 'pending'
    | 'in-progress'
    | 'completed'
    | 'failed'
    | 'thinking'
    | 'processing'
    | 'error';
  description?: string;
  startTime?: Date;
  endTime?: Date;
  result?: unknown;
}

// MCP 컨텍스트 저장 관련 타입들
export interface MCPContextData {
  sessionId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: MCPMetadata;
}

// MCP 도구 실행 관련 타입들
export interface MCPToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// MCP 검색 결과 타입
export interface MCPSearchResult {
  query: string;
  results: Array<{
    path: string;
    content: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  totalCount: number;
  // 호환성을 위한 추가 필드
  success?: boolean;
  error?: string;
  source?: string;
  tools_used?: string[];
  responseTime?: number;
  serverUsed?: string;
}

// MCP 연결 정보 타입
export interface MCPConnectionInfo {
  connected: boolean;
  servers: Array<{
    name: string;
    status: MCPServerStatus;
    lastConnected?: Date;
  }>;
  stats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime?: number;
  };
  transport?: MCPTransport;
}

// MCP 질의 의도 분석 타입
export interface MCPQueryIntent {
  intent: string;
  handler: string;
  confidence: number;
  keywords: string[];
}

// MCP 모니터링 데이터 타입
export interface MCPMonitoringData {
  servers: Array<{
    id: string;
    name: string;
    status: string;
    health?:
      | number
      | {
          score: number;
          trend?: number[];
          status?: string;
          issues?: string[];
          lastChecked?: string;
        };
    metrics?: Record<string, number>;
    cpu?: number;
    memory?: number;
    disk?: number;
  }>;
  metrics: Record<string, unknown>;
  timestamp: Date;
  context?: Record<string, unknown>;
  // 추가 필드들
  clusters?: Array<unknown>;
  applications?: Array<unknown>;
  summary?: {
    performance?: {
      avgCpu?: number;
      avgMemory?: number;
    };
    [key: string]: unknown;
  };
}

// MCP 패턴 분석 결과
export interface MCPPatternAnalysis {
  trends?: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
  }>;
  anomalies?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  predictions?: Array<{
    metric: string;
    forecast: number;
    confidence: number;
  }>;
  // 추가 필드들
  pattern?: string;
  severity?: string;
  confidence?: number;
  issues?: string[];
  recommendations?: string[];
  summary?: string;
}

// MCP 컨텍스트 패턴 타입
export interface MCPContextPattern {
  intent: string;
  pattern: RegExp | string;
  handler?: string;
  priority?: number;
  examples?: string[];
  responses?: string[];
  [key: string]: unknown;
}

// MCP 컨텍스트 패턴 컬렉션
export interface MCPContextPatterns {
  intents?: MCPContextPattern[];
  responses?: Record<string, string | string[]>;
  templates?: Record<string, string>;
  rules?: Array<{
    condition: string;
    action: string;
    priority?: number;
  }>;
  [key: string]: unknown;
}
