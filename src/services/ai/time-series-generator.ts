/**
 * Time Series Generator Service
 *
 * raw-metrics route에서 추출된 시계열 데이터 생성, 예측, 이상 탐지 로직
 */

// ============================================================================
// Types
// ============================================================================

export interface MetricHistoryPoint {
  timestamp: string;
  value: number;
}

export interface PredictionPoint {
  timestamp: string;
  predicted: number;
  upper: number;
  lower: number;
}

export interface AnomalyResult {
  startTime: string;
  endTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  description: string;
}

export interface TimeSeriesResponse {
  serverId: string;
  serverName: string;
  metric: string;
  history: MetricHistoryPoint[];
  prediction?: PredictionPoint[];
  anomalies?: AnomalyResult[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RANGE_CONFIG = { points: 72, intervalMs: 300000 }; // 6h default

const RANGE_CONFIGS: Record<string, { points: number; intervalMs: number }> = {
  '1h': { points: 60, intervalMs: 60000 },
  '6h': { points: 72, intervalMs: 300000 },
  '24h': { points: 96, intervalMs: 900000 },
  '7d': { points: 168, intervalMs: 3600000 },
};

const DEFAULT_FORECAST_POINTS = 12;
const CONFIDENCE_Z = 1.96; // 95% confidence interval
const DEFAULT_ANOMALY_THRESHOLD_Z = 2.5;

// ============================================================================
// Time Series Generation
// ============================================================================

/**
 * 시계열 히스토리 데이터 생성
 */
export function generateMetricHistory(
  baseValue: number,
  metric: string,
  range: string
): MetricHistoryPoint[] {
  const now = new Date();
  const points: MetricHistoryPoint[] = [];

  const rangeConfig = RANGE_CONFIGS[range] ?? DEFAULT_RANGE_CONFIG;
  const numPoints = rangeConfig.points;
  const intervalMs = rangeConfig.intervalMs;

  for (let i = numPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);

    const hourOfDay = timestamp.getHours();
    const dayPattern = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 10;
    const noise = (Math.random() - 0.5) * 8;
    const trend = ((numPoints - i) / numPoints) * 5;

    let value = baseValue + dayPattern + noise + trend;

    if (metric === 'cpu') {
      if (Math.random() < 0.05) value += Math.random() * 20;
    } else if (metric === 'memory') {
      value = baseValue + noise * 0.5 + trend;
    } else if (metric === 'disk') {
      value = baseValue + ((numPoints - i) / numPoints) * 3 + noise * 0.3;
    }

    value = Math.max(0, Math.min(100, value));

    points.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 10) / 10,
    });
  }

  return points;
}

// ============================================================================
// Prediction (Linear Regression + Confidence Interval)
// ============================================================================

/**
 * 예측 데이터 생성 (선형 회귀 + 신뢰구간)
 */
export function generatePrediction(
  history: MetricHistoryPoint[],
  forecastPoints: number = DEFAULT_FORECAST_POINTS
): PredictionPoint[] {
  if (history.length < 10) return [];

  const recentData = history.slice(-20);
  const n = recentData.length;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recentData[i]?.value ?? 0;
    sumXY += i * (recentData[i]?.value ?? 0);
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  let sumSquaredErrors = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    const actual = recentData[i]?.value ?? 0;
    sumSquaredErrors += (actual - predicted) ** 2;
  }
  const stdError = Math.sqrt(sumSquaredErrors / (n - 2));

  const lastTimestamp = new Date(
    history[history.length - 1]?.timestamp ?? new Date()
  );
  const intervalMs =
    history.length > 1
      ? new Date(history[1]?.timestamp ?? new Date()).getTime() -
        new Date(history[0]?.timestamp ?? new Date()).getTime()
      : 300000;

  const predictions: PredictionPoint[] = [];
  for (let i = 1; i <= forecastPoints; i++) {
    const x = n + i - 1;
    const predicted = slope * x + intercept;
    const margin =
      stdError *
      CONFIDENCE_Z *
      Math.sqrt(1 + 1 / n + (x - sumX / n) ** 2 / (sumX2 - (sumX * sumX) / n));

    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    predictions.push({
      timestamp: new Date(
        lastTimestamp.getTime() + i * intervalMs
      ).toISOString(),
      predicted: Math.round(clamp(predicted) * 10) / 10,
      upper: Math.round(clamp(predicted + margin) * 10) / 10,
      lower: Math.round(clamp(predicted - margin) * 10) / 10,
    });
  }

  return predictions;
}

// ============================================================================
// Anomaly Detection (Z-Score)
// ============================================================================

function getSeverityFromZ(
  zScore: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (zScore >= 4) return 'critical';
  if (zScore >= 3.5) return 'high';
  if (zScore >= 3) return 'medium';
  return 'low';
}

/**
 * 이상 탐지 (Z-Score 기반)
 */
export function detectAnomalies(
  history: MetricHistoryPoint[],
  metric: string,
  thresholdZ: number = DEFAULT_ANOMALY_THRESHOLD_Z
): AnomalyResult[] {
  if (history.length < 10) return [];

  const values = history.map((h) => h.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );

  if (stdDev === 0) return [];

  const anomalies: AnomalyResult[] = [];
  let anomalyStart: string | null = null;
  let maxZ = 0;

  for (let i = 0; i < history.length; i++) {
    const point = history[i];
    if (!point) continue;

    const zScore = Math.abs((point.value - mean) / stdDev);

    if (zScore > thresholdZ) {
      if (!anomalyStart) {
        anomalyStart = point.timestamp;
        maxZ = zScore;
      } else {
        maxZ = Math.max(maxZ, zScore);
      }
    } else if (anomalyStart) {
      const prevPoint = history[i - 1];
      if (prevPoint) {
        anomalies.push({
          startTime: anomalyStart,
          endTime: prevPoint.timestamp,
          severity: getSeverityFromZ(maxZ),
          metric,
          description: `${metric.toUpperCase()} 이상 감지: Z-Score ${maxZ.toFixed(2)}`,
        });
      }
      anomalyStart = null;
      maxZ = 0;
    }
  }

  if (anomalyStart && history.length > 0) {
    const lastPoint = history[history.length - 1];
    if (lastPoint) {
      anomalies.push({
        startTime: anomalyStart,
        endTime: lastPoint.timestamp,
        severity: getSeverityFromZ(maxZ),
        metric,
        description: `${metric.toUpperCase()} 이상 감지: Z-Score ${maxZ.toFixed(2)}`,
      });
    }
  }

  return anomalies;
}
