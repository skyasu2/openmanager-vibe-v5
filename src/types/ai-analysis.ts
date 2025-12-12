// AI 분석 요청 타입
export interface AIAnalysisRequest {
  query?: string;
  metrics?: Array<{ [key: string]: unknown }>;
  data?: { [key: string]: unknown };
}

// AI 분석 응답 타입
export interface AIAnalysisResponse {
  summary: string;
  confidence: number;
  recommendations: string[];
  analysis_data?: {
    query?: string;
    metrics_count?: number;
    timestamp?: string;
    /**
     * 🧠 AI Analysis Types
     * // Verified: 2025-12-12
     */
    analysis_type?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metrics_analyzed?: {
      cpu?: number;
      memory?: number;
      disk?: number;
    };
  };
}

// Next.js API 응답 래퍼 타입
export interface AIAnalysisAPIResponse {
  success: boolean;
  data?: AIAnalysisResponse;
  error?: string;
  details?: string;
  processedAt?: string;
}

// AI 엔진 상태 체크 응답 타입
export interface AIEngineStatusResponse {
  status: 'ok' | 'error';
  message?: string;
  aiEngine?: {
    url: string;
    health: {
      status: string;
      message: string;
      predictor_status?: string;
      supported_analysis?: string[];
    };
    lastChecked: string;
  };
  error?: string;
}

// 메트릭 데이터 타입
export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk?: number;
  network?: number;
  timestamp?: string;
}

// 분석 요청 옵션
export interface AnalysisOptions {
  includeRecommendations?: boolean;
  confidenceThreshold?: number;
  analysisType?:
    | 'general'
    | 'cpu_performance'
    | 'memory_optimization'
    | 'disk_performance'
    | 'network_analysis';
}
