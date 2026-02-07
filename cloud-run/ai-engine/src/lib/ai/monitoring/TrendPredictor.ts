/**
 * 📈 Trend Predictor
 *
 * @description
 * Simple linear regression-based trend prediction for server metrics.
 * Predicts future values and classifies trends as increasing/decreasing/stable.
 *
 * @algorithm
 * 1. Calculate slope using least squares linear regression
 * 2. Calculate R² (coefficient of determination) for confidence
 * 3. Predict future values using y = mx + b
 * 4. Classify trend based on slope magnitude
 *
 * @features
 * - Client-side calculation (no API calls)
 * - 1-hour prediction using recent 12 data points (5-minute intervals)
 * - R² confidence score
 * - Stable/Increasing/Decreasing classification
 *
 * @version 1.0.0
 * @date 2025-11-21
 */

export interface TrendDataPoint {
  timestamp: number;
  value: number;
}

export interface TrendPredictionConfig {
  /**
   * Number of recent data points to use for regression.
   * Default: 12 (1 hour at 5-minute intervals)
   */
  regressionWindow: number;

  /**
   * Slope threshold for classifying as "increasing" or "decreasing".
   * Default: 0.1 (10% change per hour)
   */
  slopeThreshold: number;

  /**
   * Minimum R² value for reliable prediction.
   * Default: 0.7 (70% of variance explained)
   */
  minR2: number;
}

export interface TrendPrediction {
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: number;
  confidence: number;
  details: {
    currentValue: number;
    slope: number;
    intercept: number;
    r2: number;
    predictedChange: number; // Absolute change from current value
    predictedChangePercent: number; // Percentage change
  };
  timestamp: number;
}

/**
 * 🆕 임계값 도달 예측 결과 (Prometheus predict_linear 스타일)
 */
export interface ThresholdBreachPrediction {
  /** Warning 임계값 도달 여부 */
  willBreachWarning: boolean;
  /** Warning 도달까지 남은 시간 (ms), null = 도달 안함 */
  timeToWarning: number | null;
  /** Critical 임계값 도달 여부 */
  willBreachCritical: boolean;
  /** Critical 도달까지 남은 시간 (ms), null = 도달 안함 */
  timeToCritical: number | null;
  /** 사람이 읽기 쉬운 요약 */
  humanReadable: string;
}

/**
 * 🆕 정상 복귀 예측 결과 (Datadog Recovery Forecast 스타일)
 */
export interface RecoveryPrediction {
  /** 정상 상태로 복귀할 것인지 */
  willRecover: boolean;
  /** 복귀까지 남은 시간 (ms), null = 복귀 안함 */
  timeToRecovery: number | null;
  /** 사람이 읽기 쉬운 요약 */
  humanReadable: string | null;
}

/**
 * 🆕 향상된 예측 결과 (상용 도구 수준)
 */
export interface EnhancedTrendPrediction extends TrendPrediction {
  /** 임계값 도달 예측 (Prometheus predict_linear 스타일) */
  thresholdBreach: ThresholdBreachPrediction;
  /** 정상 복귀 예측 (Datadog Recovery Forecast 스타일) */
  recovery: RecoveryPrediction;
  /** 현재 상태 */
  currentStatus: 'online' | 'warning' | 'critical';
}

/**
 * 메트릭별 임계값 정의
 */
export interface MetricThresholds {
  warning: number;
  critical: number;
  /** 정상 복귀 기준 (warning보다 약간 낮게 설정) */
  recovery: number;
}

/**
 * 🆕 기본 임계값 (Dashboard와 일치)
 */
const DEFAULT_THRESHOLDS: Record<string, MetricThresholds> = {
  cpu: { warning: 70, critical: 90, recovery: 65 },
  memory: { warning: 80, critical: 90, recovery: 75 },
  disk: { warning: 80, critical: 90, recovery: 75 },
  network: { warning: 70, critical: 90, recovery: 60 },
};

/**
 * 최대 예측 기간 (24시간)
 */
const MAX_PREDICTION_HORIZON = 24 * 60 * 60 * 1000;

export class TrendPredictor {
  private config: TrendPredictionConfig;
  private thresholds: Record<string, MetricThresholds>;

  constructor(
    config?: Partial<TrendPredictionConfig>,
    thresholds?: Record<string, MetricThresholds>
  ) {
    this.config = {
      regressionWindow: config?.regressionWindow ?? 12, // 1 hour
      slopeThreshold: config?.slopeThreshold ?? 0.1,
      minR2: config?.minR2 ?? 0.7,
    };
    this.thresholds = thresholds ?? DEFAULT_THRESHOLDS;
  }

  /**
   * Predict trend for a single metric.
   *
   * @param historicalData - Array of historical data points (sorted by timestamp, oldest first)
   * @param predictionHorizon - Time horizon in milliseconds (default: 1 hour)
   * @returns Trend prediction result
   */
  public predictTrend(
    historicalData: TrendDataPoint[],
    predictionHorizon: number = 3600000 // 1 hour in ms
  ): TrendPrediction {
    const timestamp = Date.now();

    // Validate input
    if (historicalData.length < 2) {
      return {
        trend: 'stable',
        prediction: historicalData[0]?.value || 0,
        confidence: 0,
        details: {
          currentValue: historicalData[0]?.value || 0,
          slope: 0,
          intercept: 0,
          r2: 0,
          predictedChange: 0,
          predictedChangePercent: 0,
        },
        timestamp,
      };
    }

    // Extract recent data for regression
    const recentData = historicalData.slice(-this.config.regressionWindow);
    const lastDataPoint = recentData[recentData.length - 1];
    if (!lastDataPoint) {
      return {
        trend: 'stable',
        prediction: 0,
        confidence: 0,
        details: {
          currentValue: 0,
          slope: 0,
          intercept: 0,
          r2: 0,
          predictedChange: 0,
          predictedChangePercent: 0,
        },
        timestamp,
      };
    }
    const currentValue = lastDataPoint.value;

    // Perform linear regression
    const { slope, intercept, r2 } = this.linearRegression(recentData);

    // Predict future value
    const futureTimestamp = timestamp + predictionHorizon;
    const firstDataPoint = recentData[0];
    if (!firstDataPoint) {
      return {
        trend: 'stable',
        prediction: currentValue,
        confidence: 0,
        details: {
          currentValue,
          slope: 0,
          intercept: 0,
          r2: 0,
          predictedChange: 0,
          predictedChangePercent: 0,
        },
        timestamp,
      };
    }
    const prediction = this.predictValue(
      futureTimestamp,
      firstDataPoint.timestamp,
      slope,
      intercept
    );

    // Calculate predicted change
    const predictedChange = prediction - currentValue;
    const predictedChangePercent =
      currentValue !== 0 ? (predictedChange / currentValue) * 100 : 0;

    // Classify trend
    // Convert slope from per-second to per-hour (3600 seconds) and normalize by current value
    // threshold 0.1 means 10% change per hour
    const normalizedSlope = (slope * 3600) / (currentValue || 1);
    const trend = this.classifyTrend(normalizedSlope);

    // Calculate confidence
    const confidence = this.calculateConfidence(r2, recentData.length);

    return {
      trend,
      prediction,
      confidence,
      details: {
        currentValue,
        slope,
        intercept,
        r2,
        predictedChange,
        predictedChangePercent,
      },
      timestamp,
    };
  }

  /**
   * Batch predict trends for multiple metrics.
   *
   * @param metricsData - Map of metric name to historical data points
   * @param predictionHorizon - Time horizon in milliseconds (default: 1 hour)
   * @returns Map of metric name to trend prediction
   */
  public predictTrends(
    metricsData: Record<string, TrendDataPoint[]>,
    predictionHorizon?: number
  ): Record<string, TrendPrediction> {
    const results: Record<string, TrendPrediction> = {};

    for (const [metricName, data] of Object.entries(metricsData)) {
      results[metricName] = this.predictTrend(data, predictionHorizon);
    }

    return results;
  }

  // ============================================================================
  // 🆕 Enhanced Prediction Methods (상용 도구 수준)
  // ============================================================================

  /**
   * 🆕 향상된 예측: 임계값 도달 시간 + 정상 복귀 시간 포함
   *
   * @description
   * Prometheus predict_linear() + Datadog Recovery Forecast 스타일 구현.
   * 현재 상태가 정상이면 → 언제 Warning/Critical이 될지 예측
   * 현재 상태가 Warning/Critical이면 → 언제 정상으로 돌아올지 예측
   *
   * @param historicalData - 과거 데이터 포인트 배열
   * @param metricName - 메트릭 이름 (cpu, memory, disk, network)
   * @returns 향상된 예측 결과
   */
  public predictEnhanced(
    historicalData: TrendDataPoint[],
    metricName: string = 'cpu'
  ): EnhancedTrendPrediction {
    // 1. 기본 예측 실행
    const basePrediction = this.predictTrend(historicalData);
    const currentValue = basePrediction.details.currentValue;
    const slope = basePrediction.details.slope;

    // 1.5. 백분율 메트릭(cpu/memory/disk/network)은 0-100 범위로 클램핑
    const percentMetrics = new Set(['cpu', 'memory', 'disk', 'network']);
    if (percentMetrics.has(metricName)) {
      const clamped = Math.max(0, Math.min(100, basePrediction.prediction));
      if (clamped !== basePrediction.prediction) {
        basePrediction.prediction = clamped;
        basePrediction.details.predictedChange = clamped - currentValue;
        basePrediction.details.predictedChangePercent =
          currentValue !== 0
            ? ((clamped - currentValue) / currentValue) * 100
            : 0;
      }
    }

    // 2. 임계값 가져오기
    const thresholds = this.thresholds[metricName] || DEFAULT_THRESHOLDS.cpu;

    // 3. 현재 상태 판단
    const currentStatus = this.determineStatus(currentValue, thresholds);

    // 4. 임계값 도달 예측 (Prometheus predict_linear 스타일)
    const thresholdBreach = this.predictThresholdBreach(
      currentValue,
      slope,
      thresholds,
      currentStatus
    );

    // 5. 정상 복귀 예측 (Datadog Recovery Forecast 스타일)
    const recovery = this.predictRecovery(
      currentValue,
      slope,
      thresholds,
      currentStatus
    );

    return {
      ...basePrediction,
      thresholdBreach,
      recovery,
      currentStatus,
    };
  }

  /**
   * 🆕 배치 향상된 예측
   */
  public predictEnhancedBatch(
    metricsData: Record<string, TrendDataPoint[]>
  ): Record<string, EnhancedTrendPrediction> {
    const results: Record<string, EnhancedTrendPrediction> = {};

    for (const [metricName, data] of Object.entries(metricsData)) {
      results[metricName] = this.predictEnhanced(data, metricName);
    }

    return results;
  }

  // ============================================================================
  // Private Methods - Enhanced Prediction
  // ============================================================================

  /**
   * 현재 상태 판단
   */
  private determineStatus(
    value: number,
    thresholds: MetricThresholds
  ): 'online' | 'warning' | 'critical' {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'online';
  }

  /**
   * 🆕 임계값 도달 시간 예측 (Prometheus predict_linear 스타일)
   *
   * @formula
   * time_to_threshold = (threshold - currentValue) / slope
   * (slope > 0 이고 currentValue < threshold 일 때만 유효)
   */
  private predictThresholdBreach(
    currentValue: number,
    slope: number,
    thresholds: MetricThresholds,
    currentStatus: 'online' | 'warning' | 'critical'
  ): ThresholdBreachPrediction {
    // 이미 Critical 상태면 더 이상 도달 예측 불필요
    if (currentStatus === 'critical') {
      return {
        willBreachWarning: true,
        timeToWarning: 0,
        willBreachCritical: true,
        timeToCritical: 0,
        humanReadable: '현재 심각(Critical) 상태입니다.',
      };
    }

    // slope <= 0 이면 증가하지 않음 → 도달 안함
    if (slope <= 0) {
      return {
        willBreachWarning: currentStatus === 'warning',
        timeToWarning: currentStatus === 'warning' ? 0 : null,
        willBreachCritical: false,
        timeToCritical: null,
        humanReadable:
          currentStatus === 'warning'
            ? '현재 경고(Warning) 상태이며, 악화 추세 없음'
            : '정상 상태 유지 예상',
      };
    }

    // Warning 도달 시간 계산
    let timeToWarning: number | null = null;
    let willBreachWarning = currentStatus === 'warning';

    if (currentStatus === 'online' && currentValue < thresholds.warning) {
      // time = (threshold - current) / slope (slope는 per-second)
      const timeSeconds = (thresholds.warning - currentValue) / slope;
      const timeMs = timeSeconds * 1000;

      if (timeMs > 0 && timeMs <= MAX_PREDICTION_HORIZON) {
        timeToWarning = timeMs;
        willBreachWarning = true;
      }
    }

    // Critical 도달 시간 계산
    let timeToCritical: number | null = null;
    let willBreachCritical = false;

    if (currentValue < thresholds.critical) {
      const timeSeconds = (thresholds.critical - currentValue) / slope;
      const timeMs = timeSeconds * 1000;

      if (timeMs > 0 && timeMs <= MAX_PREDICTION_HORIZON) {
        timeToCritical = timeMs;
        willBreachCritical = true;
      }
    }

    // Human-readable 메시지 생성
    const humanReadable = this.formatBreachMessage(
      willBreachWarning,
      timeToWarning,
      willBreachCritical,
      timeToCritical,
      currentStatus
    );

    return {
      willBreachWarning,
      timeToWarning,
      willBreachCritical,
      timeToCritical,
      humanReadable,
    };
  }

  /**
   * 🆕 정상 복귀 시간 예측 (Datadog Recovery Forecast 스타일)
   *
   * @description
   * Warning/Critical 상태에서 정상으로 돌아오는 시간 예측
   * slope < 0 (감소 추세)일 때만 복귀 가능
   */
  private predictRecovery(
    currentValue: number,
    slope: number,
    thresholds: MetricThresholds,
    currentStatus: 'online' | 'warning' | 'critical'
  ): RecoveryPrediction {
    // 이미 정상이면 복귀 예측 불필요
    if (currentStatus === 'online') {
      return {
        willRecover: true,
        timeToRecovery: 0,
        humanReadable: null,
      };
    }

    // slope >= 0 이면 감소하지 않음 → 복귀 안함
    if (slope >= 0) {
      return {
        willRecover: false,
        timeToRecovery: null,
        humanReadable:
          currentStatus === 'critical'
            ? '⚠️ 심각 상태이며, 자연 복구 예상 불가'
            : '⚠️ 경고 상태이며, 자연 복구 예상 불가',
      };
    }

    // 복귀 시간 계산 (recovery 임계값까지)
    // slope가 음수이므로, time = (recovery - current) / slope
    const timeSeconds = (thresholds.recovery - currentValue) / slope;
    const timeMs = timeSeconds * 1000;

    if (timeMs > 0 && timeMs <= MAX_PREDICTION_HORIZON) {
      return {
        willRecover: true,
        timeToRecovery: timeMs,
        humanReadable: `✅ ${this.formatDuration(timeMs)} 후 정상 복귀 예상`,
      };
    }

    return {
      willRecover: false,
      timeToRecovery: null,
      humanReadable: '복구 시간 예측 불가 (24시간 이상 소요 예상)',
    };
  }

  /**
   * 임계값 도달 메시지 포맷
   */
  private formatBreachMessage(
    willBreachWarning: boolean,
    timeToWarning: number | null,
    willBreachCritical: boolean,
    timeToCritical: number | null,
    currentStatus: 'online' | 'warning' | 'critical'
  ): string {
    if (currentStatus === 'warning') {
      if (willBreachCritical && timeToCritical !== null) {
        return `⚠️ 현재 경고 상태 → ${this.formatDuration(timeToCritical)} 후 심각 상태 예상`;
      }
      return '⚠️ 현재 경고 상태 (심각 상태로의 전환 예상 없음)';
    }

    if (willBreachCritical && timeToCritical !== null) {
      return `🚨 ${this.formatDuration(timeToCritical)} 후 심각(Critical) 상태 예상`;
    }

    if (willBreachWarning && timeToWarning !== null) {
      return `⚠️ ${this.formatDuration(timeToWarning)} 후 경고(Warning) 상태 예상`;
    }

    return '✅ 24시간 내 임계값 도달 예상 없음';
  }

  /**
   * 시간을 사람이 읽기 쉬운 형식으로 변환
   */
  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}일 ${remainingHours}시간` : `${days}일`;
    }

    if (hours > 0) {
      return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
    }

    if (minutes > 0) {
      return `${minutes}분`;
    }

    return '1분 미만';
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Calculate linear regression coefficients using least squares method.
   *
   * Formula:
   * - slope (m) = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)
   * - intercept (b) = (∑y - m∑x) / n
   *
   * @param data - Array of data points
   * @returns Slope, intercept, and R² values
   */
  private linearRegression(data: TrendDataPoint[]): {
    slope: number;
    intercept: number;
    r2: number;
  } {
    const n = data.length;

    // Normalize timestamps to start from 0 for numerical stability
    const firstPoint = data[0];
    if (!firstPoint) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    const baseTime = firstPoint.timestamp;
    const x = data.map((d) => (d.timestamp - baseTime) / 1000); // Convert to seconds
    const y = data.map((d) => d.value);

    // Calculate sums
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * (y[i] ?? 0), 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination)
    const yMean = sumY / n;
    const ssTotal = sumY2 - n * yMean * yMean;
    const ssResidual = y.reduce((sum, yi, i) => {
      const xi = x[i] ?? 0;
      const predicted = slope * xi + intercept;
      return sum + (yi - predicted) ** 2;
    }, 0);
    const r2 = ssTotal !== 0 ? 1 - ssResidual / ssTotal : 0;

    return { slope, intercept, r2 };
  }

  /**
   * Predict value at a future timestamp.
   *
   * @param futureTimestamp - Future timestamp in milliseconds
   * @param baseTimestamp - Base timestamp used in regression
   * @param slope - Regression slope (per second)
   * @param intercept - Regression intercept
   * @returns Predicted value
   */
  private predictValue(
    futureTimestamp: number,
    baseTimestamp: number,
    slope: number,
    intercept: number
  ): number {
    const x = (futureTimestamp - baseTimestamp) / 1000; // Convert to seconds
    return slope * x + intercept;
  }

  /**
   * Classify trend based on normalized slope.
   *
   * @param normalizedSlope - Slope normalized by current value
   * @returns Trend classification
   */
  private classifyTrend(
    normalizedSlope: number
  ): 'increasing' | 'decreasing' | 'stable' {
    if (normalizedSlope > this.config.slopeThreshold) {
      return 'increasing';
    } else if (normalizedSlope < -this.config.slopeThreshold) {
      return 'decreasing';
    }
    return 'stable';
  }

  /**
   * Calculate confidence based on R² and data availability.
   *
   * @param r2 - R² value from regression
   * @param dataPoints - Number of data points used
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(r2: number, dataPoints: number): number {
    // R² component: How well the linear model fits the data
    const r2Component = Math.max(0, r2);

    // Data availability component: More data = higher confidence
    const minPoints = 2;
    const maxPoints = this.config.regressionWindow;
    const dataComponent =
      dataPoints < minPoints
        ? 0
        : dataPoints >= maxPoints
          ? 1
          : (dataPoints - minPoints) / (maxPoints - minPoints);

    // Combined confidence (weighted average)
    return r2Component * 0.7 + dataComponent * 0.3;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a singleton instance of TrendPredictor.
 */
let instance: TrendPredictor | null = null;

export function getTrendPredictor(
  config?: Partial<TrendPredictionConfig>
): TrendPredictor {
  if (!instance) {
    instance = new TrendPredictor(config);
  }
  return instance;
}
