/**
 * Python Analysis Engine Types
 * 
 * 🐍 Python ↔ TypeScript 통신을 위한 완전한 타입 정의
 * - 모든 분석 결과에 대한 타입 안전성 보장
 * - 기존 MCP 패턴과 호환되는 응답 구조
 */

// ===== 기본 타입 정의 =====

export interface PythonEngineConfig {
  pythonPath: string;
  scriptsPath: string;
  maxProcesses: number;
  processTimeout: number;
  maxMemoryMB: number;
  enableCaching: boolean;
  cacheSize: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface PythonProcessInfo {
  pid: number;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  startTime: number;
  lastUsed: number;
  memoryUsage: number;
  taskCount: number;
}

export interface PythonEngineStatus {
  isInitialized: boolean;
  processPool: PythonProcessInfo[];
  activeProcesses: number;
  totalTasks: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastError?: string;
}

// ===== 분석 요청/응답 타입 =====

export interface AnalysisRequest<T = any> {
  method: 'forecast' | 'anomaly' | 'classification' | 'clustering' | 'correlation';
  data: T;
  params?: Record<string, any>;
  cacheKey?: string;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface AnalysisResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  metadata: {
    executionTime: number;
    memoryUsed: number;
    cacheHit: boolean;
    processId: number;
    modelVersion: string;
    timestamp: string;
  };
}

// ===== 시계열 예측 타입 =====

export interface ForecastRequest {
  timestamps: string[];
  values: number[];
  horizon?: number;
  model?: 'arima' | 'prophet' | 'linear';
  seasonality?: boolean;
  confidence_level?: number;
}

export interface ForecastResponse {
  forecast: number[];
  confidence_lower: number[];
  confidence_upper: number[];
  model_params: {
    model_type: string;
    parameters: Record<string, any>;
    fit_metrics: {
      aic?: number;
      bic?: number;
      mse?: number;
      mae?: number;
    };
  };
  trend_analysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    seasonality_detected: boolean;
  };
}

// ===== 이상 탐지 타입 =====

export interface AnomalyRequest {
  features: number[][];
  contamination?: number;
  algorithm?: 'isolation_forest' | 'autoencoder' | 'lof' | 'knn';
  feature_names?: string[];
}

export interface AnomalyResponse {
  anomaly_scores: number[];
  is_anomaly: boolean[];
  threshold: number;
  contamination_rate: number;
  algorithm_used: string;
  n_outliers: number;
  statistics: {
    total_samples: number;
    anomaly_count: number;
    anomaly_percentage: number;
    score_statistics: {
      mean: number;
      std: number;
      min: number;
      max: number;
      median: number;
    };
    feature_analysis?: {
      feature_index: number;
      normal_mean: number;
      anomaly_mean: number;
      difference_ratio: number;
    }[];
  };
}

// ===== 분류 타입 =====

export interface ClassificationRequest {
  features: number[][];
  labels?: number[];
  test_features?: number[][];
  model?: 'random_forest' | 'gradient_boost' | 'svm';
  feature_names?: string[];
  class_names?: string[];
}

export interface ClassificationResponse {
  predictions: number[];
  probabilities: number[][];
  accuracy: number;
  feature_importance?: number[];
  confusion_matrix?: number[][];
  cross_validation_scores: number[];
  model_type: string;
  n_classes: number;
  class_distribution: Record<string, number>;
  performance_metrics: {
    accuracy: number;
    model_performance: {
      cross_validation_mean: number;
      cross_validation_std: number;
      is_overfitting: boolean;
    };
    class_balance?: {
      imbalance_ratio: number;
      is_balanced: boolean;
      dominant_class: string;
      minority_class: string;
    };
  };
}

// ===== 클러스터링 타입 =====

export interface ClusteringRequest {
  features: number[][];
  n_clusters?: number;
  algorithm?: 'kmeans' | 'dbscan' | 'hierarchical';
  feature_names?: string[];
}

export interface ClusteringResponse {
  cluster_labels: number[];
  cluster_centers?: number[][];
  inertia?: number;
  silhouette_score: number;
  calinski_harabasz_score: number;
  davies_bouldin_score: number;
  n_clusters_found: number;
  algorithm_used: string;
  cluster_sizes: Record<string, number>;
  cluster_analysis: {
    cluster_statistics: {
      cluster_id: number;
      size: number;
      percentage: number;
      centroid: number[];
      std_dev: number[];
      feature_ranges: {
        min: number[];
        max: number[];
      };
    }[];
    feature_importance: number[];
    cluster_separation: {
      min_distance: number;
      max_distance: number;
      avg_distance: number;
    };
  };
  optimal_clusters_info?: {
    optimal_k: number;
    method: string;
    inertias?: number[];
    silhouette_scores?: number[];
    k_range?: number[];
  };
}

// ===== 상관관계 분석 타입 =====

export interface CorrelationRequest {
  variables: {
    name: string;
    values: number[];
  }[];
  method?: 'pearson' | 'spearman' | 'kendall';
}

export interface CorrelationResponse {
  correlations: {
    var1: string;
    var2: string;
    coefficient: number;
    p_value: number;
    significance: 'very_high' | 'high' | 'medium' | 'low' | 'none';
    interpretation: {
      direction: 'positive' | 'negative' | 'none';
      strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak' | 'negligible';
      description: string;
    };
    method: string;
  }[];
  correlation_matrix: number[][];
  method_used: string;
  n_variables: number;
  total_comparisons: number;
  pattern_analysis: {
    summary_statistics: {
      mean_correlation: number;
      std_correlation: number;
      max_correlation: number;
      min_correlation: number;
      median_correlation: number;
    };
    significance_distribution: Record<string, number>;
    strength_distribution: Record<string, number>;
    strongest_correlation: {
      variables: string;
      coefficient: number;
      significance: string;
      interpretation: string;
    };
    significant_ratio: number;
  };
}

// ===== 통합 분석 결과 타입 =====

export interface PythonAnalysisResult {
  forecast?: ForecastResponse;
  anomaly?: AnomalyResponse;
  classification?: ClassificationResponse;
  clustering?: ClusteringResponse;
  correlation?: CorrelationResponse;
  summary: {
    total_execution_time: number;
    successful_analyses: string[];
    failed_analyses: string[];
    confidence_score: number;
    recommendations: string[];
  };
}

// ===== MCP 통합 타입 =====

export interface MCPIntegratedResponse {
  mcp_patterns: any[];
  python_analysis: PythonAnalysisResult;
  integrated_insights: {
    pattern_correlation: number;
    analysis_confidence: number;
    combined_recommendations: string[];
    priority_issues: {
      issue: string;
      source: 'mcp' | 'python' | 'both';
      severity: 'low' | 'medium' | 'high' | 'critical';
      confidence: number;
    }[];
  };
  fallback_used: boolean;
  processing_metadata: {
    mcp_time: number;
    python_time: number;
    integration_time: number;
    total_time: number;
  };
}

// ===== 에러 타입 =====

export interface PythonEngineError extends Error {
  code: 'TIMEOUT' | 'PROCESS_ERROR' | 'VALIDATION_ERROR' | 'DEPENDENCY_ERROR' | 'MEMORY_ERROR';
  processId?: number;
  pythonError?: string;
  stackTrace?: string;
}

// ===== 캐시 타입 =====

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: number;
  newestEntry: number;
}

// ===== 성능 모니터링 타입 =====

export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errorRate: {
    total: number;
    byType: Record<string, number>;
    percentage: number;
  };
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    processCount: number;
  };
}

// ===== 설정 검증 타입 =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ===== 유틸리티 타입 =====

export type AnalysisMethod = 'forecast' | 'anomaly' | 'classification' | 'clustering' | 'correlation';

export type ProcessStatus = 'idle' | 'busy' | 'error' | 'terminated';

export type Priority = 'low' | 'normal' | 'high';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ===== 타입 가드 함수들 =====

export function isForecastResponse(response: any): response is ForecastResponse {
  return response && 
         Array.isArray(response.forecast) && 
         Array.isArray(response.confidence_lower) && 
         Array.isArray(response.confidence_upper);
}

export function isAnomalyResponse(response: any): response is AnomalyResponse {
  return response && 
         Array.isArray(response.anomaly_scores) && 
         Array.isArray(response.is_anomaly) && 
         typeof response.threshold === 'number';
}

export function isClassificationResponse(response: any): response is ClassificationResponse {
  return response && 
         Array.isArray(response.predictions) && 
         Array.isArray(response.probabilities) && 
         typeof response.accuracy === 'number';
}

export function isClusteringResponse(response: any): response is ClusteringResponse {
  return response && 
         Array.isArray(response.cluster_labels) && 
         typeof response.silhouette_score === 'number';
}

export function isCorrelationResponse(response: any): response is CorrelationResponse {
  return response && 
         Array.isArray(response.correlations) && 
         Array.isArray(response.correlation_matrix);
}

export function isPythonEngineError(error: any): error is PythonEngineError {
  return error instanceof Error && 
         'code' in error && 
         ['TIMEOUT', 'PROCESS_ERROR', 'VALIDATION_ERROR', 'DEPENDENCY_ERROR', 'MEMORY_ERROR'].includes(error.code as string);
} 