/**
 * MCP 모니터 타입 정의
 */

export type MCPServerName =
  | 'filesystem'
  | 'memory'
  | 'github'
  | 'supabase'
  | 'tavily-mcp'
  | 'sequential-thinking'
  | 'playwright'
  | 'time'
  | 'context7'
  | 'serena';

export interface MCPServerConfig {
  name: MCPServerName;
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
  errorCount: number;
  lastError?: string;
}

export interface MCPHealthStatus {
  server: MCPServerName;
  healthy: boolean;
  responseTime: number;
  timestamp: number;
  error?: string;
}

export interface MCPMetrics {
  server: MCPServerName;
  requestCount: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  timestamp: number;
}
