/**
 * 🚫 DEPRECATED: TensorFlow.js AI 엔진 - 완전 비활성화
 *
 * ⚠️ 이 파일은 v5.43.0에서 완전히 제거되었습니다.
 * 경량 ML 엔진 (lightweight-ml-engine.ts)을 사용하세요.
 *
 * 빌드 호환성을 위해 더미 export만 제공합니다.
 */

// 더미 인터페이스들
export interface PredictionResult {
  prediction: number[];
  confidence: number;
  model_info: string;
  processing_time: number;
  data_source: 'deprecated' | 'fallback';
  sample_size: number;
}

export interface AnomalyResult {
  is_anomaly: boolean;
  anomaly_score: number;
  threshold: number;
  model_info: string;
}

export interface ClusterResult {
  cluster_labels: number[];
  centroids: number[][];
  inertia: number;
  model_info: string;
}

export interface AIAnalysisResult {
  failure_predictions: Record<string, PredictionResult>;
  anomaly_detections: Record<string, AnomalyResult>;
  trend_predictions: Record<string, number[]>;
  clustering_analysis?: ClusterResult;
  ai_insights: string[];
  processing_stats: {
    total_time: number;
    models_used: string[];
    metrics_analyzed: number;
  };
}

/**
 * 🚫 DEPRECATED: TensorFlow AI 엔진 클래스
 *
 * 이 클래스는 더 이상 사용되지 않습니다.
 * 모든 메서드는 에러를 발생시킵니다.
 */
export class TensorFlowAIEngine {
  private static readonly DEPRECATED_MESSAGE =
    '❌ TensorFlow 엔진은 v5.43.0에서 제거되었습니다. lightweight-ml-engine을 사용하세요.';

  constructor() {
    console.warn(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async initialize(): Promise<void> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async predictFailure(metrics: number[]): Promise<PredictionResult> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async detectAnomalies(timeSeries: number[]): Promise<AnomalyResult> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async predictTimeSeries(
    historicalData: number[],
    steps: number = 5
  ): Promise<number[]> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async clusterAnalysis(data: number[][]): Promise<ClusterResult> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async analyzeMetricsWithAI(
    metrics: Record<string, number[]>
  ): Promise<AIAnalysisResult> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async getModelInfo(): Promise<any> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  dispose(): void {
    // 더미 메서드
  }

  async getRealServerMetrics(
    serverId?: string,
    hours: number = 24
  ): Promise<any[]> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }

  async predictFailureFromRealData(
    serverId?: string
  ): Promise<PredictionResult> {
    throw new Error(TensorFlowAIEngine.DEPRECATED_MESSAGE);
  }
}

// 기본 export
export default TensorFlowAIEngine;
