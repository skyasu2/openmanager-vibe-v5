/**
 * Monitoring Module Exports
 *
 * Provides anomaly detection and trend prediction capabilities:
 * - SimpleAnomalyDetector: Statistical approach (moving average + 2σ)
 * - IsolationForestDetector: ML approach (multivariate isolation)
 * - HybridAnomalyDetector: Ensemble of both for higher accuracy
 * - TrendPredictor: Linear regression based forecasting
 *
 * @version 1.0.0
 * @date 2026-01-01
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

// Trend Prediction
export {
  TrendPredictor,
  getTrendPredictor,
  type TrendDataPoint,
  type TrendPredictionConfig,
  type TrendPrediction,
} from './TrendPredictor.js';
