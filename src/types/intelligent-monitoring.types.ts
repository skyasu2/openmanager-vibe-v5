/**
 * 🧠 Intelligent Monitoring 관련 타입 정의
 * IntelligentMonitoringPage에서 분리된 타입들
 */

export interface IntelligentAnalysisRequest {
  serverId?: string;
  analysisDepth: 'quick' | 'standard' | 'deep';
  includeSteps: {
    anomalyDetection: boolean;
    rootCauseAnalysis: boolean;
    predictiveMonitoring: boolean;
  };
}

export interface StepResult {
  status: 'completed' | 'failed' | 'skipped';
  summary: string;
  data?: unknown;
}

export interface AnomalyDetectionResult extends StepResult {
  anomaliesFound: number;
  severity: 'low' | 'medium' | 'high';
}

export interface RootCauseAnalysisResult extends StepResult {
  rootCauses: string[];
  confidence: number;
}

export interface PredictiveMonitoringResult extends StepResult {
  predictions: Array<{
    timeframe: string;
    prediction: string;
    confidence: number;
  }>;
}

export interface IntelligentAnalysisResult {
  id: string;
  timestamp: string;
  request: IntelligentAnalysisRequest;
  status: 'running' | 'completed' | 'failed';
  steps: {
    anomalyDetection?: AnomalyDetectionResult;
    rootCauseAnalysis?: RootCauseAnalysisResult;
    predictiveMonitoring?: PredictiveMonitoringResult;
  };
  aiInsights?: {
    summary: string;
    recommendations: string[];
    confidence: number;
  };
}

// 현재 구현에서 사용하는 확장된 결과 타입
export interface ExtendedIntelligentAnalysisResult {
  analysisId: string;
  timestamp: string;
  request: IntelligentAnalysisRequest;
  anomalyDetection: AnomalyDetectionResult & {
    confidence: number;
    processingTime: number;
    anomalies: unknown[];
  };
  rootCauseAnalysis: RootCauseAnalysisResult & {
    confidence: number;
    processingTime: number;
    causes: unknown[];
    aiInsights: unknown[];
  };
  predictiveMonitoring: PredictiveMonitoringResult & {
    confidence: number;
    processingTime: number;
    recommendations: string[];
  };
  overallResult: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    priorityActions: string[];
    summary: string;
    confidence: number;
    totalProcessingTime: number;
  };
}

export interface IntelligentMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId?: string;
}

// ============================================================================
// Cloud Run API Response Types (v5.84+)
// These types match the actual response from /api/ai/analyze-server
// ============================================================================

/** 메트릭별 이상 탐지 결과 */
export interface MetricAnomalyResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  currentValue: number;
  threshold: {
    upper: number;
    lower: number;
  };
}

/** 이상 탐지 API 응답 */
export interface CloudRunAnomalyDetection {
  success: boolean;
  serverId: string;
  serverName: string;
  anomalyCount: number;
  hasAnomalies: boolean;
  results: Record<string, MetricAnomalyResult>;
  timestamp: string;
  _algorithm: string;
  _engine: string;
  _cached: boolean;
}

/** 메트릭별 트렌드 예측 결과 */
export interface MetricTrendResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
}

/** 트렌드 예측 API 응답 */
export interface CloudRunTrendPrediction {
  success: boolean;
  serverId: string;
  serverName: string;
  predictionHorizon: string;
  results: Record<string, MetricTrendResult>;
  summary: {
    increasingMetrics: string[];
    hasRisingTrends: boolean;
  };
  timestamp: string;
  _algorithm: string;
  _engine: string;
  _cached: boolean;
}

/** 패턴 분석 결과 항목 */
export interface PatternAnalysisItem {
  pattern: string;
  confidence: number;
  insights: string;
}

/** 패턴 분석 API 응답 */
export interface CloudRunPatternAnalysis {
  success: boolean;
  patterns: string[];
  detectedIntent: string;
  analysisResults: PatternAnalysisItem[];
  _mode: string;
}

/** Cloud Run analyze-server 전체 응답 */
export interface CloudRunAnalysisResponse {
  success: boolean;
  serverId: string;
  analysisType: 'full' | 'anomaly' | 'trend' | 'pattern';
  timestamp: string;
  anomalyDetection?: CloudRunAnomalyDetection;
  trendPrediction?: CloudRunTrendPrediction;
  patternAnalysis?: CloudRunPatternAnalysis;
}

/** 간소화된 분석 요청 (UI용) */
export interface SimpleAnalysisRequest {
  serverId?: string;
  analysisType?: 'full' | 'anomaly' | 'trend' | 'pattern';
}
