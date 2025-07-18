/**
 * Enhanced Data Analyzer 타입 정의
 * any 타입 제거를 위한 명확한 타입 정의
 */

import type { ServerInstance, ServerCluster, ApplicationMetrics } from '@/types/data-generator';

// GCPRealDataService 대체 인터페이스
export interface DataGeneratorService {
  getRealServerMetrics: () => Promise<{
    data: ServerMetricsResponse[];
  }>;
}

export interface ServerMetricsResponse {
  id: string;
  name: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
  response_time: number;
  uptime: number;
  [key: string]: unknown;
}

// 분석 데이터 타입
export interface ServerAnalysisData {
  serverId: string;
  performanceScore: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface ClusterAnalysisData {
  clusterId: string;
  serverCount: number;
  healthScore: number;
  loadBalance: {
    isBalanced: boolean;
    variance: number;
    hotspots: string[];
  };
  redundancy: {
    level: number;
    failoverReady: boolean;
  };
}

export interface ApplicationAnalysisData {
  applicationName: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  dependencies: string[];
  bottlenecks: string[];
}

// 성능 분석 결과 타입
export interface PerformanceAnalysis {
  score: number;
  trend: 'improving' | 'stable' | 'degrading';
  bottlenecks: string[];
}

// 신뢰성 분석 결과 타입
export interface ReliabilityAnalysis {
  score: number;
  uptime: number;
  incidents: number;
  mttr: number; // Mean Time To Recovery
}

// 효율성 분석 결과 타입
export interface EfficiencyAnalysis {
  score: number;
  resourceUtilization: number;
  costOptimization: number;
}

// 상관관계 타입
export interface Correlation {
  factor1: string;
  factor2: string;
  strength: number;
  description: string;
}

// 분석 인사이트 타입
export interface AnalysisInsight {
  title: string;
  content: string;
  level: 'critical' | 'warning' | 'info';
  recommendations?: string[];
}

// 자연어 쿼리 응답 데이터 타입
export interface QueryResponseData {
  servers?: ServerInstance[];
  metrics?: {
    [key: string]: number | string;
  };
  analysis?: {
    summary: string;
    details: Record<string, unknown>;
  };
  trends?: {
    period: string;
    data: Array<{
      timestamp: string;
      value: number;
    }>;
  };
}