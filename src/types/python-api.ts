// 🐍 Python 엔진 구조화된 API 타입 정의
// Jules 분석 기반 단순화된 스키마

export type AnalysisType = 
  | 'capacity_planning'
  | 'server_performance_prediction'
  | 'complex_forecasting';

export interface MetricData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
  response_time?: number | null;
  active_connections?: number | null;
}

export interface AnalysisRequest {
  // 핵심 정보
  analysis_type: AnalysisType;
  metrics: MetricData[];
  
  // 분석 매개변수
  prediction_hours?: number; // 기본값: 24
  sensitivity?: number; // 기본값: 0.8
  features?: string[]; // 기본값: ['cpu', 'memory', 'disk']
  
  // 메타데이터
  server_id?: string | null;
  urgency?: 'critical' | 'high' | 'medium' | 'low'; // 기본값: 'medium'
  confidence_threshold?: number; // 기본값: 0.7
}

export interface PredictionResult {
  current: number;
  predicted: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface AnomalyData {
  timestamp: string;
  score: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  feature: string;
  value: number;
  description: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis_type: string;
  confidence: number;
  
  // 결과 데이터
  predictions?: Record<string, PredictionResult> | null;
  anomalies?: AnomalyData[] | null;
  recommendations: string[];
  
  // 메타데이터
  processing_time: number;
  engine_version: string; // 예: "python-simplified-v1"
  warning?: string | null;
}

// 편의 타입들
export interface CapacityPlanningRequest extends AnalysisRequest {
  analysis_type: 'capacity_planning';
}

export interface PerformancePredictionRequest extends AnalysisRequest {
  analysis_type: 'server_performance_prediction';
}

export interface ComplexForecastingRequest extends AnalysisRequest {
  analysis_type: 'complex_forecasting';
}

// 응답 타입 가드
export function isSuccessfulResponse(response: AnalysisResponse): response is AnalysisResponse & { success: true } {
  return response.success === true;
}

export function hasPredictions(response: AnalysisResponse): response is AnalysisResponse & { predictions: Record<string, PredictionResult> } {
  return response.predictions !== null && response.predictions !== undefined;
}

export function hasAnomalies(response: AnalysisResponse): response is AnalysisResponse & { anomalies: AnomalyData[] } {
  return response.anomalies !== null && response.anomalies !== undefined && response.anomalies.length > 0;
}

// 요청 생성 헬퍼
export function createCapacityPlanningRequest(
  metrics: MetricData[],
  options?: Partial<Omit<CapacityPlanningRequest, 'analysis_type' | 'metrics'>>
): CapacityPlanningRequest {
  return {
    analysis_type: 'capacity_planning',
    metrics,
    prediction_hours: 24,
    sensitivity: 0.8,
    features: ['cpu', 'memory', 'disk'],
    urgency: 'medium',
    confidence_threshold: 0.7,
    ...options
  };
}

export function createPerformancePredictionRequest(
  metrics: MetricData[],
  options?: Partial<Omit<PerformancePredictionRequest, 'analysis_type' | 'metrics'>>
): PerformancePredictionRequest {
  return {
    analysis_type: 'server_performance_prediction',
    metrics,
    prediction_hours: 24,
    sensitivity: 0.8,
    features: ['cpu', 'memory', 'disk', 'network_in', 'network_out'],
    urgency: 'medium',
    confidence_threshold: 0.7,
    ...options
  };
}

// 메트릭 데이터 정규화 헬퍼
export function normalizeMetricData(rawMetric: any): MetricData {
  return {
    timestamp: rawMetric.timestamp || new Date().toISOString(),
    cpu: parseFloat(rawMetric.cpu) || 0,
    memory: parseFloat(rawMetric.memory) || 0,
    disk: parseFloat(rawMetric.disk) || 0,
    network_in: parseFloat(rawMetric.networkIn || rawMetric.network_in) || 0,
    network_out: parseFloat(rawMetric.networkOut || rawMetric.network_out) || 0,
    response_time: rawMetric.responseTime || rawMetric.response_time || null,
    active_connections: rawMetric.activeConnections || rawMetric.active_connections || null
  };
} 