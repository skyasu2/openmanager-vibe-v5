/**
 * CustomEngines.ts를 위한 구체적인 타입 정의
 * any 타입 제거를 위한 상세 인터페이스
 */

import type { ServerInstance } from '@/types/data-generator';

// MCP 분석 결과 타입
export interface MCPAnalysisData {
  query: string;
  answer: string;
  confidence: number;
  reasoning_steps: string[];
  processing_time: number;
  engine_version: string;
}

// 오픈소스 분석 결과 타입
export interface OpenSourceAnalysisData {
  intent: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  language: string;
  processed_at: string;
}

// 서버 분석 데이터
export interface ServerAnalysisData {
  server_count: number;
  health_summary: {
    healthy: number;
    warning: number;
    critical: number;
  };
  performance_metrics: {
    avg_cpu: number;
    avg_memory: number;
    avg_response_time: number;
  };
  top_issues: Array<{
    server_id: string;
    issue_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

// 로그 분석 데이터
export interface LogAnalysisData {
  total_logs: number;
  error_count: number;
  warning_count: number;
  patterns_detected: Array<{
    pattern: string;
    frequency: number;
    severity: string;
  }>;
  time_range: {
    start: string;
    end: string;
  };
}

// 메트릭 분석 데이터
export interface MetricAnalysisData {
  metrics_processed: number;
  anomalies_detected: Array<{
    metric_name: string;
    value: number;
    threshold: number;
    timestamp: string;
  }>;
  trends: {
    cpu: 'increasing' | 'stable' | 'decreasing';
    memory: 'increasing' | 'stable' | 'decreasing';
    traffic: 'increasing' | 'stable' | 'decreasing';
  };
  forecast: {
    next_hour: Record<string, number>;
    next_day: Record<string, number>;
  };
}

// 알림 분석 데이터
export interface AlertAnalysisData {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  alert_distribution: Record<string, number>;
  priority_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  affected_services: string[];
}

// 서버 컨텍스트 타입
export interface ServerContext {
  id: string;
  name: string;
  hostname?: string;
  status: 'running' | 'warning' | 'error' | 'stopped';
  cpu_usage?: number;
  memory_usage?: number;
  response_time?: number;
}

// 로그 엔트리 타입
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

// 메트릭 엔트리 타입
export interface MetricEntry {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  labels?: Record<string, string>;
}

// 알림 엔트리 타입
export interface AlertEntry {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  updated_at: string;
  affected_resources: string[];
}

// 통합 분석 컨텍스트
export interface UnifiedAnalysisContext {
  servers: ServerContext[];
  logs: LogEntry[];
  metrics: MetricEntry[];
  alerts: AlertEntry[];
}

// Hybrid 분석 결과 개선
export interface ImprovedHybridAnalysisResult {
  mcp_analysis: MCPAnalysisData;
  opensource_analysis: OpenSourceAnalysisData;
  combined_confidence: number;
  recommendation: string;
  fallback_used: boolean;
}

// Unified 분석 결과 개선
export interface ImprovedUnifiedAnalysisResult {
  server_analysis: ServerAnalysisData;
  log_analysis: LogAnalysisData;
  metric_analysis: MetricAnalysisData;
  alert_analysis: AlertAnalysisData;
  unified_score: number;
  priority_actions: string[];
}