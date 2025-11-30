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
