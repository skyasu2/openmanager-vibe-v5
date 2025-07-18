/**
 * IntelligentMonitoringService를 위한 타입 정의
 * any 타입 제거를 위한 구체적인 인터페이스
 */

import type { AnomalyAlert } from '../AnomalyDetection';
import type { PredictionResult } from '@/lib/ml/LightweightMLEngine';

// 이상 탐지 관련 타입
export type Anomaly = AnomalyAlert;

// 예측 관련 타입
export interface Prediction {
  id: string;
  type: 'performance' | 'failure' | 'resource' | 'anomaly';
  prediction: string;
  probability: number;
  failureProbability?: number;
  timeframe: {
    start: Date;
    end: Date;
  };
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedServices: string[];
  confidence: number;
  recommendations: string[];
}

// 성능 이슈 타입
export interface PerformanceIssue {
  id: string;
  serverId: string;
  metric: string;
  currentValue: number;
  threshold: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  duration: number;
  trend: 'improving' | 'stable' | 'worsening';
  suggestedActions: string[];
}

// 리소스 최적화 타입
export interface ResourceOptimization {
  id: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network';
  currentUsage: number;
  optimalUsage: number;
  potentialSavings: number;
  recommendation: string;
  priority: number;
  estimatedImpact: {
    performance: number;
    cost: number;
  };
  implementationSteps: string[];
}

// 이상 예측 타입
export interface AnomalyPrediction {
  id: string;
  metric: string;
  predictedAnomaly: {
    type: string;
    likelihood: number;
    expectedTime: Date;
  };
  currentPattern: number[];
  historicalPattern: number[];
  confidence: number;
  preventiveActions: string[];
}

// ML 최적화 결과 타입
export interface MLOptimizationResult {
  modelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  recommendations: ResourceOptimization[];
  learningInsights: {
    pattern: string;
    frequency: number;
    impact: string;
  }[];
  autoTuning: {
    parameter: string;
    oldValue: number;
    newValue: number;
    improvement: number;
  }[];
}

// 근본 원인 분석 타입
export interface RootCause {
  id: string;
  category:
    | 'system'
    | 'application'
    | 'network'
    | 'infrastructure'
    | 'external';
  description: string;
  probability: number;
  evidence: string[];
  recommendations: string[];
  aiEngine?: string;
  suggestedFixes?: string[];
  relatedIncidents?: string[];
}

// 지원 데이터 타입
export interface SupportingData {
  historicalData: {
    timestamp: Date;
    value: number;
    metric: string;
  }[];
  correlatedEvents: {
    timestamp: Date;
    event: string;
    correlation: number;
  }[];
  systemLogs: {
    timestamp: Date;
    level: string;
    message: string;
  }[];
  metadata: Record<string, unknown>;
  patterns?: AnomalyPatterns | Record<string, number>;
}

// 분석 상태 타입
export interface AnalysisState {
  analysisId: string;
  startTime: Date;
  currentStep: 'anomaly' | 'rootCause' | 'predictive' | 'mlOptimization';
  progress: number;
  errors: string[];
  warnings: string[];
}

// 이상 패턴 분석 결과 타입
export interface AnomalyPatterns {
  cpuSpikes: number;
  memoryLeaks: number;
  networkIssues: number;
  diskIssues: number;
  responseTimeIssues: number;
  timeDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
}

// 통합 권장사항 타입
export interface UnifiedRecommendation {
  id: string;
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: 'performance' | 'security' | 'cost' | 'reliability';
  estimatedImpact: {
    metric: string;
    improvement: number;
  };
  requiredResources: string[];
  dependencies: string[];
  risks: string[];
}