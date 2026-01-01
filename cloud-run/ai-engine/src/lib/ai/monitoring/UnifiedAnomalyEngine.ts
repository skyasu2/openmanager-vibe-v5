/**
 * 🚀 Unified Anomaly Detection Engine
 *
 * @description
 * Production-grade anomaly detection combining all approaches:
 * 1. Statistical (SimpleAnomalyDetector): Fast, low-latency baseline
 * 2. Machine Learning (IsolationForestDetector): Multivariate patterns
 * 3. Adaptive Thresholds: Temporal pattern awareness
 *
 * @features
 * - Streaming mode: Process metrics in real-time
 * - Batch mode: Bulk historical analysis
 * - Auto-learning: Continuous model improvement
 * - Fallback chain: Graceful degradation
 * - Event emission: Integration with alerting systems
 *
 * @architecture
 * ```
 * Metrics Stream → [Statistical] → Quick Check
 *                → [IF Detector] → Multivariate Check
 *                → [Adaptive]    → Temporal Check
 *                       ↓
 *                  [Ensemble Voting]
 *                       ↓
 *                  [Event Emission]
 * ```
 *
 * @version 1.0.0
 * @date 2026-01-01
 */

import { EventEmitter } from 'events';
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
import {
  AdaptiveThreshold,
  getAdaptiveThreshold,
  type AdaptiveThresholds,
} from './AdaptiveThreshold';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedEngineConfig {
  /**
   * Enable statistical detector. Default: true
   */
  enableStatistical: boolean;

  /**
   * Enable Isolation Forest detector. Default: true
   */
  enableIsolationForest: boolean;

  /**
   * Enable adaptive thresholds. Default: true
   */
  enableAdaptive: boolean;

  /**
   * Voting weights (sum to 1)
   */
  weights: {
    statistical: number;
    isolationForest: number;
    adaptive: number;
  };

  /**
   * Anomaly threshold for voting (0-1). Default: 0.5
   */
  votingThreshold: number;

  /**
   * Emit events for anomalies. Default: true
   */
  emitEvents: boolean;

  /**
   * Auto-train models with streaming data. Default: true
   */
  autoTrain: boolean;

  /**
   * Buffer size for streaming mode. Default: 100
   */
  streamBufferSize: number;
}

export interface ServerMetricInput {
  serverId: string;
  serverName: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp?: number;
}

export interface UnifiedDetectionResult {
  /** Server identifier */
  serverId: string;
  serverName: string;

  /** Final anomaly decision */
  isAnomaly: boolean;

  /** Combined severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Combined confidence (0-1) */
  confidence: number;

  /** Anomaly score (0-1) */
  anomalyScore: number;

  /** Per-detector results */
  detectors: {
    statistical: {
      enabled: boolean;
      isAnomaly: boolean;
      severity: string;
      confidence: number;
      metrics: Record<string, { isAnomaly: boolean; value: number }>;
    };
    isolationForest: {
      enabled: boolean;
      isAnomaly: boolean;
      anomalyScore: number;
      metricContributions: Record<string, number>;
    };
    adaptive: {
      enabled: boolean;
      isAnomaly: boolean;
      direction: string;
      expectedMean: number;
      thresholdConfidence: number;
    };
  };

  /** Voting details */
  voting: {
    votes: { statistical: boolean; isolationForest: boolean; adaptive: boolean };
    weightedScore: number;
    consensusLevel: 'none' | 'partial' | 'full';
  };

  /** Primary metric causing anomaly */
  dominantMetric: string | null;

  /** Time context */
  timeContext: {
    timestamp: number;
    hour: number;
    dayOfWeek: string;
  };

  /** Processing latency (ms) */
  latencyMs: number;
}

export interface StreamingStats {
  totalProcessed: number;
  anomaliesDetected: number;
  averageLatencyMs: number;
  lastProcessedAt: number;
  bufferSize: number;
  modelsStatus: {
    statisticalReady: boolean;
    isolationForestTrained: boolean;
    adaptiveLearnedMetrics: string[];
  };
}

// ============================================================================
// Implementation
// ============================================================================

export class UnifiedAnomalyEngine extends EventEmitter {
  private config: UnifiedEngineConfig;
  private statisticalDetector: SimpleAnomalyDetector;
  private isolationForestDetector: IsolationForestDetector;
  private adaptiveThreshold: AdaptiveThreshold;

  // Streaming state
  private metricBuffer: Map<string, MetricDataPoint[]> = new Map();
  private multiMetricBuffer: MultiMetricDataPoint[] = [];
  private stats: StreamingStats = {
    totalProcessed: 0,
    anomaliesDetected: 0,
    averageLatencyMs: 0,
    lastProcessedAt: 0,
    bufferSize: 0,
    modelsStatus: {
      statisticalReady: true,
      isolationForestTrained: false,
      adaptiveLearnedMetrics: [],
    },
  };

  constructor(config?: Partial<UnifiedEngineConfig>) {
    super();

    // Normalize weights
    const rawWeights = config?.weights ?? {
      statistical: 0.3,
      isolationForest: 0.4,
      adaptive: 0.3,
    };
    const totalWeight =
      rawWeights.statistical + rawWeights.isolationForest + rawWeights.adaptive;
    const normalizedWeights = {
      statistical: rawWeights.statistical / totalWeight,
      isolationForest: rawWeights.isolationForest / totalWeight,
      adaptive: rawWeights.adaptive / totalWeight,
    };

    this.config = {
      enableStatistical: config?.enableStatistical ?? true,
      enableIsolationForest: config?.enableIsolationForest ?? true,
      enableAdaptive: config?.enableAdaptive ?? true,
      weights: normalizedWeights,
      votingThreshold: config?.votingThreshold ?? 0.5,
      emitEvents: config?.emitEvents ?? true,
      autoTrain: config?.autoTrain ?? true,
      streamBufferSize: config?.streamBufferSize ?? 100,
    };

    // Initialize detectors
    this.statisticalDetector = getAnomalyDetector();
    this.isolationForestDetector = getIsolationForestDetector();
    this.adaptiveThreshold = getAdaptiveThreshold();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Process a single metric input (streaming mode).
   */
  public process(input: ServerMetricInput): UnifiedDetectionResult {
    const startTime = performance.now();
    const timestamp = input.timestamp ?? Date.now();
    const date = new Date(timestamp);

    // Update buffer
    this.updateBuffers(input, timestamp);

    // Run all enabled detectors
    const statResult = this.runStatistical(input);
    const ifResult = this.runIsolationForest(input, timestamp);
    const adaptiveResult = this.runAdaptive(input, timestamp);

    // Combine results
    const result = this.combineResults(
      input,
      statResult,
      ifResult,
      adaptiveResult,
      timestamp,
      date
    );

    // Calculate latency
    const latencyMs = performance.now() - startTime;
    result.latencyMs = Math.round(latencyMs * 100) / 100;

    // Update stats
    this.updateStats(result, latencyMs);

    // Emit events if configured
    if (this.config.emitEvents && result.isAnomaly) {
      this.emit('anomaly', result);
    }

    // Auto-train if configured
    if (this.config.autoTrain) {
      this.autoTrainModels();
    }

    return result;
  }

  /**
   * Process multiple metrics in batch.
   */
  public processBatch(inputs: ServerMetricInput[]): UnifiedDetectionResult[] {
    return inputs.map((input) => this.process(input));
  }

  /**
   * Initialize models with historical data.
   */
  public initialize(historicalData: {
    multiMetric?: MultiMetricDataPoint[];
    perMetric?: Record<string, MetricDataPoint[]>;
  }): void {
    // Train Isolation Forest
    if (historicalData.multiMetric && historicalData.multiMetric.length >= 50) {
      this.isolationForestDetector.fit(historicalData.multiMetric);
      this.stats.modelsStatus.isolationForestTrained = true;
      console.log(
        `[UnifiedEngine] IF trained with ${historicalData.multiMetric.length} samples`
      );
    }

    // Initialize adaptive thresholds
    if (historicalData.perMetric) {
      for (const [metric, data] of Object.entries(historicalData.perMetric)) {
        this.adaptiveThreshold.learn(
          metric,
          data.map((d) => ({ timestamp: d.timestamp, value: d.value }))
        );
        if (!this.stats.modelsStatus.adaptiveLearnedMetrics.includes(metric)) {
          this.stats.modelsStatus.adaptiveLearnedMetrics.push(metric);
        }
      }
      console.log(
        `[UnifiedEngine] Adaptive thresholds initialized for: ${Object.keys(historicalData.perMetric).join(', ')}`
      );
    }
  }

  /**
   * Get streaming statistics.
   */
  public getStats(): StreamingStats {
    return {
      ...this.stats,
      bufferSize: this.multiMetricBuffer.length,
      modelsStatus: {
        ...this.stats.modelsStatus,
        isolationForestTrained: this.isolationForestDetector.getStatus().isTrained,
        adaptiveLearnedMetrics: this.adaptiveThreshold.getStatus().metrics,
      },
    };
  }

  /**
   * Get configuration.
   */
  public getConfig(): UnifiedEngineConfig {
    return { ...this.config };
  }

  /**
   * Reset all state.
   */
  public reset(): void {
    this.metricBuffer.clear();
    this.multiMetricBuffer = [];
    this.isolationForestDetector.reset();
    this.adaptiveThreshold.reset();
    this.stats = {
      totalProcessed: 0,
      anomaliesDetected: 0,
      averageLatencyMs: 0,
      lastProcessedAt: 0,
      bufferSize: 0,
      modelsStatus: {
        statisticalReady: true,
        isolationForestTrained: false,
        adaptiveLearnedMetrics: [],
      },
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private updateBuffers(input: ServerMetricInput, timestamp: number): void {
    const metrics = ['cpu', 'memory', 'disk', 'network'] as const;

    // Per-metric buffer
    for (const metric of metrics) {
      const key = `${input.serverId}_${metric}`;
      if (!this.metricBuffer.has(key)) {
        this.metricBuffer.set(key, []);
      }
      const buffer = this.metricBuffer.get(key)!;
      buffer.push({
        timestamp,
        value: input[metric],
      });

      // Keep buffer size limited
      while (buffer.length > this.config.streamBufferSize) {
        buffer.shift();
      }
    }

    // Multi-metric buffer
    this.multiMetricBuffer.push({
      timestamp,
      cpu: input.cpu,
      memory: input.memory,
      disk: input.disk,
      network: input.network,
    });

    // Keep buffer size limited
    while (this.multiMetricBuffer.length > this.config.streamBufferSize) {
      this.multiMetricBuffer.shift();
    }
  }

  private runStatistical(
    input: ServerMetricInput
  ): Record<string, AnomalyDetectionResult> | null {
    if (!this.config.enableStatistical) return null;

    const results: Record<string, AnomalyDetectionResult> = {};
    const metrics = ['cpu', 'memory', 'disk', 'network'] as const;

    for (const metric of metrics) {
      const key = `${input.serverId}_${metric}`;
      const history = this.metricBuffer.get(key) || [];
      results[metric] = this.statisticalDetector.detectAnomaly(
        input[metric],
        history
      );
    }

    return results;
  }

  private runIsolationForest(
    input: ServerMetricInput,
    timestamp: number
  ): IsolationForestResult | null {
    if (!this.config.enableIsolationForest) return null;

    const multiMetric: MultiMetricDataPoint = {
      timestamp,
      cpu: input.cpu,
      memory: input.memory,
      disk: input.disk,
      network: input.network,
    };

    return this.isolationForestDetector.detect(multiMetric);
  }

  private runAdaptive(
    input: ServerMetricInput,
    timestamp: number
  ): Record<
    string,
    {
      isAnomaly: boolean;
      direction: string;
      deviation: number;
      thresholds: AdaptiveThresholds;
    }
  > | null {
    if (!this.config.enableAdaptive) return null;

    const results: Record<
      string,
      {
        isAnomaly: boolean;
        direction: string;
        deviation: number;
        thresholds: AdaptiveThresholds;
      }
    > = {};
    const metrics = ['cpu', 'memory', 'disk', 'network'] as const;

    for (const metric of metrics) {
      const result = this.adaptiveThreshold.isAnomaly(
        metric,
        input[metric],
        timestamp
      );
      results[metric] = result;
    }

    return results;
  }

  private combineResults(
    input: ServerMetricInput,
    statResult: Record<string, AnomalyDetectionResult> | null,
    ifResult: IsolationForestResult | null,
    adaptiveResult: Record<
      string,
      {
        isAnomaly: boolean;
        direction: string;
        deviation: number;
        thresholds: AdaptiveThresholds;
      }
    > | null,
    timestamp: number,
    date: Date
  ): UnifiedDetectionResult {
    // Calculate per-detector votes
    const statVote =
      statResult !== null &&
      Object.values(statResult).some((r) => r.isAnomaly);
    const ifVote = ifResult !== null && ifResult.isAnomaly;
    const adaptiveVote =
      adaptiveResult !== null &&
      Object.values(adaptiveResult).some((r) => r.isAnomaly);

    // Calculate weighted score
    let weightedScore = 0;
    let activeWeight = 0;

    if (this.config.enableStatistical) {
      const statScore = statVote ? this.getMaxSeverityScore(statResult!) : 0;
      weightedScore += statScore * this.config.weights.statistical;
      activeWeight += this.config.weights.statistical;
    }

    if (this.config.enableIsolationForest && ifResult) {
      const ifScore = ifResult.anomalyScore;
      weightedScore += ifScore * this.config.weights.isolationForest;
      activeWeight += this.config.weights.isolationForest;
    }

    if (this.config.enableAdaptive) {
      const adaptiveScore = adaptiveVote
        ? this.getMaxAdaptiveScore(adaptiveResult!)
        : 0;
      weightedScore += adaptiveScore * this.config.weights.adaptive;
      activeWeight += this.config.weights.adaptive;
    }

    // Normalize if not all detectors active
    if (activeWeight > 0 && activeWeight < 1) {
      weightedScore = weightedScore / activeWeight;
    }

    // Final decision
    const isAnomaly = weightedScore > this.config.votingThreshold;

    // Calculate severity
    const severity = this.calculateSeverity(weightedScore);

    // Calculate confidence
    const confidence = this.calculateConfidence(
      statResult,
      ifResult,
      adaptiveResult
    );

    // Find dominant metric
    const dominantMetric = this.findDominantMetric(
      statResult,
      ifResult?.metricContributions,
      adaptiveResult
    );

    // Consensus level
    const votes = [statVote, ifVote, adaptiveVote].filter(Boolean).length;
    const consensusLevel: 'none' | 'partial' | 'full' =
      votes === 0 ? 'none' : votes === 3 ? 'full' : 'partial';

    return {
      serverId: input.serverId,
      serverName: input.serverName,
      isAnomaly,
      severity,
      confidence,
      anomalyScore: Math.round(weightedScore * 100) / 100,
      detectors: {
        statistical: {
          enabled: this.config.enableStatistical,
          isAnomaly: statVote,
          severity: statResult
            ? this.getMaxSeverity(statResult)
            : 'low',
          confidence: statResult
            ? this.getAvgConfidence(statResult)
            : 0,
          metrics: statResult
            ? Object.fromEntries(
                Object.entries(statResult).map(([k, v]) => [
                  k,
                  { isAnomaly: v.isAnomaly, value: v.details.currentValue },
                ])
              )
            : {},
        },
        isolationForest: {
          enabled: this.config.enableIsolationForest,
          isAnomaly: ifVote,
          anomalyScore: ifResult?.anomalyScore ?? 0,
          metricContributions: ifResult?.metricContributions ?? {
            cpu: 0,
            memory: 0,
            disk: 0,
            network: 0,
          },
        },
        adaptive: {
          enabled: this.config.enableAdaptive,
          isAnomaly: adaptiveVote,
          direction: adaptiveResult
            ? this.getDominantDirection(adaptiveResult)
            : 'normal',
          expectedMean: adaptiveResult
            ? this.getAvgExpectedMean(adaptiveResult)
            : 0,
          thresholdConfidence: adaptiveResult
            ? this.getAvgThresholdConfidence(adaptiveResult)
            : 0,
        },
      },
      voting: {
        votes: { statistical: statVote, isolationForest: ifVote, adaptive: adaptiveVote },
        weightedScore: Math.round(weightedScore * 100) / 100,
        consensusLevel,
      },
      dominantMetric,
      timeContext: {
        timestamp,
        hour: date.getHours(),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      },
      latencyMs: 0, // Will be set after
    };
  }

  private getMaxSeverityScore(results: Record<string, AnomalyDetectionResult>): number {
    const anomalies = Object.values(results).filter((r) => r.isAnomaly);
    if (anomalies.length === 0) return 0;

    const severityScores = { low: 0.4, medium: 0.7, high: 1.0 };
    return Math.max(...anomalies.map((r) => severityScores[r.severity]));
  }

  private getMaxAdaptiveScore(
    results: Record<string, { isAnomaly: boolean; deviation: number }>
  ): number {
    const anomalies = Object.values(results).filter((r) => r.isAnomaly);
    if (anomalies.length === 0) return 0;

    // Normalize deviation to 0-1 (cap at 4σ)
    const maxDeviation = Math.max(...anomalies.map((r) => Math.min(r.deviation, 4)));
    return maxDeviation / 4;
  }

  private calculateSeverity(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.85) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private calculateConfidence(
    statResult: Record<string, AnomalyDetectionResult> | null,
    ifResult: IsolationForestResult | null,
    adaptiveResult: Record<string, { thresholds: AdaptiveThresholds }> | null
  ): number {
    const confidences: number[] = [];

    if (statResult) {
      confidences.push(this.getAvgConfidence(statResult));
    }
    if (ifResult) {
      confidences.push(ifResult.confidence);
    }
    if (adaptiveResult) {
      confidences.push(this.getAvgThresholdConfidence(adaptiveResult));
    }

    if (confidences.length === 0) return 0;
    return Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100;
  }

  private getMaxSeverity(results: Record<string, AnomalyDetectionResult>): string {
    const severities = Object.values(results).map((r) => r.severity);
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private getAvgConfidence(results: Record<string, AnomalyDetectionResult>): number {
    const values = Object.values(results);
    if (values.length === 0) return 0;
    return values.reduce((s, r) => s + r.confidence, 0) / values.length;
  }

  private getDominantDirection(
    results: Record<string, { direction: string }>
  ): string {
    const directions = Object.values(results).map((r) => r.direction);
    if (directions.includes('high')) return 'high';
    if (directions.includes('low')) return 'low';
    return 'normal';
  }

  private getAvgExpectedMean(
    results: Record<string, { thresholds: AdaptiveThresholds }>
  ): number {
    const values = Object.values(results);
    if (values.length === 0) return 0;
    return (
      values.reduce((s, r) => s + r.thresholds.expectedMean, 0) / values.length
    );
  }

  private getAvgThresholdConfidence(
    results: Record<string, { thresholds: AdaptiveThresholds }>
  ): number {
    const values = Object.values(results);
    if (values.length === 0) return 0;
    return (
      values.reduce((s, r) => s + r.thresholds.confidence, 0) / values.length
    );
  }

  private findDominantMetric(
    statResult: Record<string, AnomalyDetectionResult> | null,
    ifContributions?: { cpu: number; memory: number; disk: number; network: number },
    adaptiveResult?: Record<string, { isAnomaly: boolean; deviation: number }> | null
  ): string | null {
    // Priority: statistical high severity → IF highest contribution → adaptive highest deviation

    if (statResult) {
      for (const [metric, result] of Object.entries(statResult)) {
        if (result.isAnomaly && result.severity === 'high') {
          return metric;
        }
      }
    }

    if (ifContributions) {
      const entries = Object.entries(ifContributions) as [string, number][];
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      if (sorted[0][1] > 0.35) {
        return sorted[0][0];
      }
    }

    if (adaptiveResult) {
      const anomalies = Object.entries(adaptiveResult)
        .filter(([, v]) => v.isAnomaly)
        .sort((a, b) => b[1].deviation - a[1].deviation);
      if (anomalies.length > 0) {
        return anomalies[0][0];
      }
    }

    return null;
  }

  private updateStats(result: UnifiedDetectionResult, latencyMs: number): void {
    this.stats.totalProcessed++;
    if (result.isAnomaly) {
      this.stats.anomaliesDetected++;
    }
    this.stats.lastProcessedAt = Date.now();

    // Running average for latency
    const prevTotal =
      this.stats.averageLatencyMs * (this.stats.totalProcessed - 1);
    this.stats.averageLatencyMs =
      (prevTotal + latencyMs) / this.stats.totalProcessed;
  }

  private autoTrainModels(): void {
    // Retrain IF every 50 new samples
    if (
      this.multiMetricBuffer.length >= 50 &&
      this.multiMetricBuffer.length % 50 === 0
    ) {
      this.isolationForestDetector.fit(this.multiMetricBuffer);
      this.stats.modelsStatus.isolationForestTrained = true;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let engineInstance: UnifiedAnomalyEngine | null = null;

/**
 * Get singleton instance of UnifiedAnomalyEngine.
 */
export function getUnifiedAnomalyEngine(
  config?: Partial<UnifiedEngineConfig>
): UnifiedAnomalyEngine {
  if (!engineInstance) {
    engineInstance = new UnifiedAnomalyEngine(config);
  }
  return engineInstance;
}

/**
 * Reset the singleton instance.
 */
export function resetUnifiedAnomalyEngine(): void {
  if (engineInstance) {
    engineInstance.reset();
    engineInstance.removeAllListeners();
  }
  engineInstance = null;
}
