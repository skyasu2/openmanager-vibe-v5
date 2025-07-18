/**
 * MCP LangGraph Agent 타입 정의
 * any 타입 제거를 위한 구체적인 타입 정의
 */

import type { ServerInstance } from '@/types/data-generator';

// 컨텍스트 데이터 타입
export interface ContextData {
  servers: ServerInstance[];
  metrics: MetricsSnapshot;
  predictions: PredictionData;
  incidents: IncidentData[];
  timestamp: string;
}

// 메트릭 스냅샷 타입
export interface MetricsSnapshot {
  system: {
    totalServers: number;
    activeServers: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  performance: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
}

// 예측 데이터 타입
export interface PredictionData {
  trends: {
    cpu: 'increasing' | 'stable' | 'decreasing';
    memory: 'increasing' | 'stable' | 'decreasing';
    traffic: 'increasing' | 'stable' | 'decreasing';
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    probability: number;
    timeframe: string;
  }>;
}

// 인시던트 데이터 타입
export interface IncidentData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  affectedServers: string[];
  startTime: string;
  endTime?: string;
}

// 서버 분석 요약 타입
export interface ServerAnalysisSummary {
  statusSummary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  performanceSummary: {
    avg_cpu: number;
    avg_memory: number;
    max_response_time: number;
    total_requests: number;
  };
  topIssues: string[];
  relevantServers: ServerInstance[];
}

// 분석 결과 타입
export interface AnalysisResult {
  summary: string;
  details: {
    findings: string[];
    metrics: Record<string, number>;
    recommendations: string[];
  };
  confidence: number;
  sources: string[];
}

// 추론 데이터 타입
export interface ReasoningData {
  steps: Array<{
    type: 'thought' | 'observation' | 'action' | 'reflection';
    content: string;
    confidence: number;
    timestamp: string;
  }>;
  finalConclusion: string;
  alternativeExplanations: string[];
}