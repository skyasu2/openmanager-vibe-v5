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
  params?: any;
  id?: string | number;
}

export interface MCPResponse {
  success: boolean;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;

  // 🔧 MCPAIRouter 호환성을 위한 추가 속성들
  summary?: string;
  enginesUsed?: string[];
  recommendations?: string[];
  metadata?: {
    sessionId?: string;
    timestamp?: string;
    processingTime?: number;
    engineUsed?: string;
    [key: string]: any;
  };
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

// MCP 쿼리 관련 타입들
export interface MCPQuery {
  query: string;
  context?: Record<string, any>;
  sessionId?: string;
}

export interface MCPQueryResponse {
  success: boolean;
  content: string;
  confidence: number;
  sources: string[];
  metadata?: {
    sessionId?: string;
    timestamp?: string;
    processingTime?: number;
    engineUsed?: string;
  };
  error?: string;
}
