/**
 * 🔮 통합 예측 시스템 타입 정의
 *
 * Phase 4: 기존 예측 관련 시스템들의 통합 타입
 * - PredictiveAnalysisEngine
 * - AutoIncidentReportSystem
 * - AnomalyDetectionService
 * - LightweightMLEngine
 */

// 기존 타입들 재사용
export interface MetricDataPoint {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  errorRate: number;
  responseTime: number;
}

export interface ServerMetrics {
  serverId: string;
  timestamp: Date;
  cpu: { usage: number; temperature: number };
  memory: { usage: number; available: number };
  disk: { usage: number; io: number };
  network: { in: number; out: number };
}

export interface PredictionResult {
  serverId: string;
  failureProbability: number;
  predictedTime: Date;
  confidence: number;
  triggerMetrics: string[];
  preventiveActions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  analysisType: 'trend' | 'anomaly' | 'pattern' | 'hybrid';
}

export interface Incident {
  id: string;
  serverId: string;
  type: string;
  severity: 'warning' | 'critical';
  affectedServer: string;
  detectedAt: Date;
  predictedTime?: number;
}

export interface IncidentReport {
  id: string;
  incident: Incident;
  analysis: string;
  solutions: string[];
  prediction: PredictionResult;
  generatedAt: Date;
}

// 새로운 통합 타입들
export interface IntegratedAnalysisResult {
  serverId: string;
  mlPrediction: PredictionResult;
  ruleBasedAnalysis: RuleBasedAnalysisResult;
  anomalyDetection: AnomalyDetectionResult;
  combinedConfidence: number;
  recommendedActions: string[];
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
  analysisTimestamp: Date;
  processingTime: number;
}

export interface RuleBasedAnalysisResult {
  triggeredRules: string[];
  confidence: number;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  anomalyScore: number;
  isAnomalous: boolean;
  detectionMethod: 'statistical' | 'ml' | 'pattern';
}

export interface Anomaly {
  timestamp: Date;
  metric: string;
  value: number;
  severity: 'warning' | 'critical';
  description: string;
  source: 'metrics' | 'logs';
}

export interface PredictiveIncidentReport {
  id: string;
  serverId: string;
  prediction: PredictionResult;
  preemptiveIncident?: Incident;
  preventiveReport: IncidentReport;
  timeline: TimelineEvent[];
  riskAssessment: RiskAssessment;
  generatedAt: Date;
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  source: 'prediction' | 'detection' | 'analysis';
}

export interface RiskAssessment {
  overallRisk: number; // 0-100
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  timeToAction: number; // minutes
}

export interface RiskFactor {
  factor: string;
  weight: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number; // 0-1
}

export interface ModelOptimizationResult {
  previousAccuracy: number;
  newAccuracy: number;
  improvementPercentage: number;
  optimizedWeights: ModelWeights;
  validationResults: ValidationResult[];
  optimizationMethod: 'gradient_descent' | 'genetic_algorithm' | 'bayesian';
}

export interface ModelWeights {
  trendAnalysis: number;
  anomalyDetection: number;
  patternMatching: number;
  ruleBasedEngine: number;
  mlPrediction: number;
}

export interface ValidationResult {
  testCase: string;
  predicted: number;
  actual: number;
  accuracy: number;
  timestamp: Date;
}

export interface SystemHealthReport {
  overallHealth: number; // 0-100
  predictiveAccuracy: number;
  systemLoad: number;
  activeMonitoringServers: number;
  criticalPredictions: number;
  recommendations: string[];
  componentsHealth: ComponentHealth[];
  lastUpdateTime: Date;
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  health: number; // 0-100
  lastCheck: Date;
  issues?: string[];
}

// 설정 관련 타입
export interface IntegratedPredictionConfig {
  predictionHorizon: number; // minutes
  anomalyThreshold: number;
  minDataPoints: number;
  modelWeights: ModelWeights;
  enableRealTimeLearning: boolean;
  enablePreemptiveReporting: boolean;
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  green: number; // 0-25
  yellow: number; // 25-50
  orange: number; // 50-75
  red: number; // 75-100
}

// 메인 인터페이스
export interface IIntegratedPredictionSystem {
  // 기존 PredictiveAnalysisEngine 기능
  addDataPoint(
    serverId: string,
    dataPoint: MetricDataPoint
  ): Promise<PredictionResult | null>;
  predictFailure(serverId: string): Promise<PredictionResult | null>;
  calculateAccuracy(
    serverId?: string
  ): Promise<{ overall: number; byServer: { [key: string]: number } }>;

  // 기존 AutoIncidentReportSystem 기능
  detectIncident(metrics: ServerMetrics): Promise<Incident | null>;
  generateReport(incident: Incident): Promise<IncidentReport>;
  predictFailureTime(
    historicalData: ServerMetrics[]
  ): Promise<PredictionResult>;

  // 기존 AnomalyDetectionService 기능
  detectAnomalies(metrics: ServerMetrics[], logs?: any[]): Promise<Anomaly[]>;

  // 새로운 통합 기능
  performIntegratedAnalysis(
    serverId: string
  ): Promise<IntegratedAnalysisResult>;
  generatePredictiveReport(serverId: string): Promise<PredictiveIncidentReport>;
  optimizeModelWeights(): Promise<ModelOptimizationResult>;
  getSystemHealth(): Promise<SystemHealthReport>;

  // 설정 관리
  updateConfig(config: Partial<IntegratedPredictionConfig>): void;
  getConfig(): IntegratedPredictionConfig;

  // 데이터 관리
  getHistoricalData(serverId: string, hours?: number): MetricDataPoint[];
  clearHistoricalData(serverId?: string): void;

  // 모니터링
  getActiveServers(): string[];
  getSystemMetrics(): SystemMetrics;
}

export interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  processedDataPoints: number;
  predictionCount: number;
  averageResponseTime: number;
  errorRate: number;
}

// 이벤트 타입
export interface PredictionEvent {
  type:
    | 'prediction_generated'
    | 'incident_detected'
    | 'anomaly_found'
    | 'system_health_changed';
  serverId: string;
  timestamp: Date;
  data: any;
  severity: 'info' | 'warning' | 'critical';
}

// 콜백 타입
export type PredictionEventCallback = (event: PredictionEvent) => void;

// 유틸리티 타입
export type PredictionSystemStatus =
  | 'initializing'
  | 'running'
  | 'paused'
  | 'error'
  | 'maintenance';

export interface PredictionSystemInfo {
  version: string;
  status: PredictionSystemStatus;
  uptime: number;
  totalPredictions: number;
  accuracy: number;
  lastOptimization: Date;
}
