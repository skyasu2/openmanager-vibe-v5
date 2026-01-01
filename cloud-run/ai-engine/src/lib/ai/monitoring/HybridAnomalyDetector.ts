/**
 * 🔀 Hybrid Anomaly Detector (Ensemble)
 *
 * @description
 * Combines multiple anomaly detection approaches for higher accuracy:
 * 1. Statistical (SimpleAnomalyDetector): Moving average + 2σ
 * 2. Machine Learning (IsolationForestDetector): Multivariate isolation
 *
 * Voting strategy:
 * - Both agree: High confidence result
 * - One detects: Weighted decision based on severity
 * - Neither detects: Normal (high confidence)
 *
 * @benefits
 * - Higher accuracy through ensemble
 * - Fallback safety (if one fails, other works)
 * - Complementary detection (linear + non-linear patterns)
 *
 * @version 1.0.0
 * @date 2026-01-01
 */

import {
  SimpleAnomalyDetector,
  getAnomalyDetector,
  type MetricDataPoint,
  type AnomalyDetectionResult,
} from './SimpleAnomalyDetector';
import {
  IsolationForestDetector,
  getIsolationForestDetector,
  type MultiMetricDataPoint,
  type IsolationForestResult,
} from './IsolationForestDetector';

// ============================================================================
// Types
// ============================================================================

export interface HybridDetectorConfig {
  /**
   * Weight for statistical detector (0-1). Default: 0.4
   */
  statisticalWeight: number;

  /**
   * Weight for Isolation Forest detector (0-1). Default: 0.6
   */
  isolationForestWeight: number;

  /**
   * Voting threshold (0-1). If combined score > threshold, anomaly. Default: 0.5
   */
  votingThreshold: number;

  /**
   * Whether to require both detectors to agree. Default: false
   */
  requireConsensus: boolean;

  /**
   * Auto-train Isolation Forest with incoming data. Default: true
   */
  autoTrainIF: boolean;
}

export interface HybridAnomalyResult {
  /** Final anomaly decision */
  isAnomaly: boolean;

  /** Combined severity */
  severity: 'low' | 'medium' | 'high';

  /** Combined confidence score */
  confidence: number;

  /** Individual detector results */
  detectorResults: {
    statistical: AnomalyDetectionResult | null;
    isolationForest: IsolationForestResult | null;
  };

  /** Voting details */
  voting: {
    statisticalVote: boolean;
    isolationForestVote: boolean;
    combinedScore: number;
    consensus: boolean;
  };

  /** Dominant metric causing anomaly */
  dominantMetric: string | null;

  timestamp: number;
}

export interface ServerMetrics {
  serverId: string;
  serverName: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: number;
}

// ============================================================================
// Implementation
// ============================================================================

export class HybridAnomalyDetector {
  private statisticalDetector: SimpleAnomalyDetector;
  private isolationForestDetector: IsolationForestDetector;
  private config: HybridDetectorConfig;
  private historicalData: Map<string, MultiMetricDataPoint[]> = new Map();

  constructor(config?: Partial<HybridDetectorConfig>) {
    this.config = {
      statisticalWeight: config?.statisticalWeight ?? 0.4,
      isolationForestWeight: config?.isolationForestWeight ?? 0.6,
      votingThreshold: config?.votingThreshold ?? 0.5,
      requireConsensus: config?.requireConsensus ?? false,
      autoTrainIF: config?.autoTrainIF ?? true,
    };

    // Ensure weights sum to 1
    const totalWeight = this.config.statisticalWeight + this.config.isolationForestWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      const normalizer = 1.0 / totalWeight;
      this.config.statisticalWeight *= normalizer;
      this.config.isolationForestWeight *= normalizer;
    }

    this.statisticalDetector = getAnomalyDetector();
    this.isolationForestDetector = getIsolationForestDetector();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Initialize Isolation Forest with historical data.
   *
   * @param historicalData - Historical multivariate data points
   */
  public initialize(historicalData: MultiMetricDataPoint[]): boolean {
    return this.isolationForestDetector.fit(historicalData);
  }

  /**
   * Detect anomaly using hybrid ensemble approach.
   *
   * @param metrics - Current server metrics
   * @param metricHistory - Historical data for statistical detector (per metric)
   */
  public detect(
    metrics: ServerMetrics,
    metricHistory: Record<string, MetricDataPoint[]>
  ): HybridAnomalyResult {
    const timestamp = Date.now();

    // 1. Run Statistical Detector (per-metric)
    const statisticalResults = this.runStatisticalDetection(metrics, metricHistory);

    // 2. Run Isolation Forest Detector (multivariate)
    const ifResult = this.runIsolationForestDetection(metrics);

    // 3. Auto-train IF with new data
    if (this.config.autoTrainIF) {
      this.updateHistory(metrics);
    }

    // 4. Combine results using voting
    return this.combineResults(statisticalResults, ifResult, timestamp);
  }

  /**
   * Batch detect for multiple servers.
   */
  public detectBatch(
    serversMetrics: ServerMetrics[],
    metricHistories: Map<string, Record<string, MetricDataPoint[]>>
  ): Map<string, HybridAnomalyResult> {
    const results = new Map<string, HybridAnomalyResult>();

    for (const metrics of serversMetrics) {
      const history = metricHistories.get(metrics.serverId) || {};
      results.set(metrics.serverId, this.detect(metrics, history));
    }

    return results;
  }

  /**
   * Get detector status.
   */
  public getStatus(): {
    config: HybridDetectorConfig;
    isolationForestStatus: ReturnType<IsolationForestDetector['getStatus']>;
    historicalDataSize: number;
  } {
    return {
      config: { ...this.config },
      isolationForestStatus: this.isolationForestDetector.getStatus(),
      historicalDataSize: Array.from(this.historicalData.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    };
  }

  /**
   * Reset all detectors.
   */
  public reset(): void {
    this.isolationForestDetector.reset();
    this.historicalData.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private runStatisticalDetection(
    metrics: ServerMetrics,
    metricHistory: Record<string, MetricDataPoint[]>
  ): Record<string, AnomalyDetectionResult> {
    const results: Record<string, AnomalyDetectionResult> = {};

    const metricNames = ['cpu', 'memory', 'disk', 'network'] as const;

    for (const metricName of metricNames) {
      const currentValue = metrics[metricName];
      const history = metricHistory[metricName] || [];

      results[metricName] = this.statisticalDetector.detectAnomaly(
        currentValue,
        history
      );
    }

    return results;
  }

  private runIsolationForestDetection(
    metrics: ServerMetrics
  ): IsolationForestResult {
    const multiMetric: MultiMetricDataPoint = {
      timestamp: metrics.timestamp || Date.now(),
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      network: metrics.network,
    };

    return this.isolationForestDetector.detect(multiMetric);
  }

  private combineResults(
    statisticalResults: Record<string, AnomalyDetectionResult>,
    ifResult: IsolationForestResult,
    timestamp: number
  ): HybridAnomalyResult {
    // Calculate statistical aggregate
    const statAnomalies = Object.values(statisticalResults).filter(
      (r) => r.isAnomaly
    );
    const hasStatAnomaly = statAnomalies.length > 0;
    const statMaxSeverity = this.getMaxSeverity(statAnomalies);
    const statConfidence =
      statAnomalies.length > 0
        ? statAnomalies.reduce((sum, r) => sum + r.confidence, 0) /
          statAnomalies.length
        : Object.values(statisticalResults).reduce(
            (sum, r) => sum + r.confidence,
            0
          ) / Object.values(statisticalResults).length;

    // IF result
    const hasIFAnomaly = ifResult.isAnomaly;
    const ifSeverity = ifResult.severity;
    const ifConfidence = ifResult.confidence;

    // Voting
    const statVoteScore = hasStatAnomaly
      ? this.severityToScore(statMaxSeverity) * statConfidence
      : 0;
    const ifVoteScore = hasIFAnomaly
      ? this.severityToScore(ifSeverity) * ifConfidence
      : 0;

    const combinedScore =
      statVoteScore * this.config.statisticalWeight +
      ifVoteScore * this.config.isolationForestWeight;

    // Decision logic
    let isAnomaly: boolean;
    if (this.config.requireConsensus) {
      // Both must agree
      isAnomaly = hasStatAnomaly && hasIFAnomaly;
    } else {
      // Weighted voting
      isAnomaly = combinedScore > this.config.votingThreshold;
    }

    // Combined severity
    const severity = this.combineSeverity(statMaxSeverity, ifSeverity, isAnomaly);

    // Combined confidence
    const confidence = isAnomaly
      ? (statConfidence * this.config.statisticalWeight +
          ifConfidence * this.config.isolationForestWeight)
      : Math.min(statConfidence, ifConfidence);

    // Find dominant metric
    const dominantMetric = this.findDominantMetric(
      statisticalResults,
      ifResult.metricContributions
    );

    return {
      isAnomaly,
      severity,
      confidence,
      detectorResults: {
        statistical: this.aggregateStatisticalResults(statisticalResults),
        isolationForest: ifResult,
      },
      voting: {
        statisticalVote: hasStatAnomaly,
        isolationForestVote: hasIFAnomaly,
        combinedScore,
        consensus: hasStatAnomaly === hasIFAnomaly,
      },
      dominantMetric,
      timestamp,
    };
  }

  private getMaxSeverity(
    results: AnomalyDetectionResult[]
  ): 'low' | 'medium' | 'high' {
    if (results.some((r) => r.severity === 'high')) return 'high';
    if (results.some((r) => r.severity === 'medium')) return 'medium';
    return 'low';
  }

  private severityToScore(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'high':
        return 1.0;
      case 'medium':
        return 0.7;
      case 'low':
        return 0.4;
    }
  }

  private combineSeverity(
    statSeverity: 'low' | 'medium' | 'high',
    ifSeverity: 'low' | 'medium' | 'high',
    isAnomaly: boolean
  ): 'low' | 'medium' | 'high' {
    if (!isAnomaly) return 'low';

    const severities = [statSeverity, ifSeverity];
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private findDominantMetric(
    statisticalResults: Record<string, AnomalyDetectionResult>,
    ifContributions?: { cpu: number; memory: number; disk: number; network: number }
  ): string | null {
    // Check statistical results first
    for (const [metric, result] of Object.entries(statisticalResults)) {
      if (result.isAnomaly && result.severity === 'high') {
        return metric;
      }
    }

    // Check IF contributions
    if (ifContributions) {
      const entries = Object.entries(ifContributions) as [string, number][];
      const [dominant] = entries.reduce((max, curr) =>
        curr[1] > max[1] ? curr : max
      );
      if (ifContributions[dominant as keyof typeof ifContributions] > 0.4) {
        return dominant;
      }
    }

    // Check medium severity
    for (const [metric, result] of Object.entries(statisticalResults)) {
      if (result.isAnomaly) {
        return metric;
      }
    }

    return null;
  }

  private aggregateStatisticalResults(
    results: Record<string, AnomalyDetectionResult>
  ): AnomalyDetectionResult {
    const anomalies = Object.values(results).filter((r) => r.isAnomaly);
    const allResults = Object.values(results);

    if (anomalies.length === 0) {
      return {
        isAnomaly: false,
        severity: 'low',
        confidence: allResults.reduce((s, r) => s + r.confidence, 0) / allResults.length,
        details: allResults[0]?.details || {
          currentValue: 0,
          mean: 0,
          stdDev: 0,
          upperThreshold: 0,
          lowerThreshold: 0,
          deviation: 0,
        },
        timestamp: Date.now(),
      };
    }

    const maxSeverityResult = anomalies.reduce((max, r) =>
      this.severityToScore(r.severity) > this.severityToScore(max.severity)
        ? r
        : max
    );

    return {
      isAnomaly: true,
      severity: this.getMaxSeverity(anomalies),
      confidence: anomalies.reduce((s, r) => s + r.confidence, 0) / anomalies.length,
      details: maxSeverityResult.details,
      timestamp: Date.now(),
    };
  }

  private updateHistory(metrics: ServerMetrics): void {
    const serverId = metrics.serverId || 'default';
    const history = this.historicalData.get(serverId) || [];

    history.push({
      timestamp: metrics.timestamp || Date.now(),
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      network: metrics.network,
    });

    // Keep last 500 points
    if (history.length > 500) {
      history.shift();
    }

    this.historicalData.set(serverId, history);

    // Retrain IF periodically (every 50 new points)
    if (history.length % 50 === 0 && history.length >= 50) {
      this.isolationForestDetector.fit(history);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let hybridInstance: HybridAnomalyDetector | null = null;

/**
 * Get singleton instance of HybridAnomalyDetector.
 */
export function getHybridAnomalyDetector(
  config?: Partial<HybridDetectorConfig>
): HybridAnomalyDetector {
  if (!hybridInstance) {
    hybridInstance = new HybridAnomalyDetector(config);
  }
  return hybridInstance;
}

/**
 * Reset the singleton instance.
 */
export function resetHybridAnomalyDetector(): void {
  hybridInstance = null;
}
