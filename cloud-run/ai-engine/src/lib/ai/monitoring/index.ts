/**
 * Monitoring Module Exports
 *
 * Provides anomaly detection and trend prediction capabilities:
 * - SimpleAnomalyDetector: Statistical approach (moving average + 2σ)
 * - IsolationForestDetector: ML approach (multivariate isolation)
 * - HybridAnomalyDetector: Ensemble of both for higher accuracy
 * - TrendPredictor: Linear regression based forecasting
 *   - 🆕 v2.0: Threshold breach prediction (Prometheus predict_linear style)
 *   - 🆕 v2.0: Recovery time prediction (Datadog style)
 *
 * @version 2.0.0
 * @date 2026-01-12
 */

// Anomaly Detection
export {
  SimpleAnomalyDetector,
  getAnomalyDetector,
  type MetricDataPoint,
  type AnomalyDetectionConfig,
  type AnomalyDetectionResult,
} from './SimpleAnomalyDetector.js';

export {
  IsolationForestDetector,
  getIsolationForestDetector,
  resetIsolationForestDetector,
  type MultiMetricDataPoint,
  type IsolationForestConfig,
  type IsolationForestResult,
} from './IsolationForestDetector.js';

export {
  HybridAnomalyDetector,
  getHybridAnomalyDetector,
  resetHybridAnomalyDetector,
  type HybridDetectorConfig,
  type HybridAnomalyResult,
  type ServerMetrics,
} from './HybridAnomalyDetector.js';

// Trend Prediction (v2.0 - Enhanced with threshold breach & recovery predictions)
export {
  TrendPredictor,
  getTrendPredictor,
  type TrendDataPoint,
  type TrendPredictionConfig,
  type TrendPrediction,
  // 🆕 v2.0 Enhanced Types
  type EnhancedTrendPrediction,
  type ThresholdBreachPrediction,
  type RecoveryPrediction,
  type MetricThresholds,
} from './TrendPredictor.js';

// Adaptive Thresholds
export {
  AdaptiveThreshold,
  getAdaptiveThreshold,
  resetAdaptiveThreshold,
  type AdaptiveThresholdConfig,
  type AdaptiveThresholds,
  type TemporalBucket,
  type MetricHistoryPoint,
} from './AdaptiveThreshold.js';

// Unified Anomaly Engine (Production)
export {
  UnifiedAnomalyEngine,
  getUnifiedAnomalyEngine,
  resetUnifiedAnomalyEngine,
  type UnifiedEngineConfig,
  type ServerMetricInput,
  type UnifiedDetectionResult,
  type StreamingStats,
} from './UnifiedAnomalyEngine.js';

