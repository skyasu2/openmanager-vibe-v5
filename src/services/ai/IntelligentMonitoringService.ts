/**
 * 🧠 Intelligent Monitoring Service
 *
 * @description
 * Integrates anomaly detection and trend prediction for server monitoring.
 * Populates EnhancedServerMetrics with AI analysis and trend data.
 *
 * @features
 * - Real-time anomaly detection
 * - Trend prediction
 * - Aggregate anomaly scoring
 * - Server recommendations
 *
 * @version 1.0.0
 * @date 2025-11-21
 */

import {
  type AnomalyDetectionResult,
  getAnomalyDetector,
  type MetricDataPoint,
  type SimpleAnomalyDetector,
} from '@/lib/ai/monitoring/SimpleAnomalyDetector';

import {
  getTrendPredictor,
  type TrendPrediction,
  type TrendPredictor,
} from '@/lib/ai/monitoring/TrendPredictor';

import type { EnhancedServerMetrics, ServerMetrics } from '@/types/server';

/**
 * Helper function to extract numeric value from ServerMetrics union type
 */
function extractNumericValue(
  value:
    | number
    | { usage: number; [key: string]: unknown }
    | { in: number; out: number; [key: string]: unknown }
): number {
  if (typeof value === 'number') {
    return value;
  }
  // Handle network type with 'in' and 'out'
  if ('in' in value && 'out' in value) {
    const inValue = typeof value.in === 'number' ? value.in : 0;
    const outValue = typeof value.out === 'number' ? value.out : 0;
    return (inValue + outValue) / 2; // Average of in/out
  }
  // Handle other types with 'usage'
  if ('usage' in value && typeof value.usage === 'number') {
    return value.usage;
  }
  return 0;
}

/**
 * Historical data structure for a single metric
 */
export interface MetricHistory {
  cpu: MetricDataPoint[];
  memory: MetricDataPoint[];
  disk: MetricDataPoint[];
  network: MetricDataPoint[];
  [key: string]: MetricDataPoint[]; // Add index signature for compatibility
}

/**
 * Analysis result for all metrics
 */
export interface IntelligentAnalysisResult {
  anomalies: Record<string, AnomalyDetectionResult>;
  trends: Record<string, TrendPrediction>;
  aggregateAnomalyScore: number;
  recommendationsGenerated: string[];
  timestamp: number;
}

export class IntelligentMonitoringService {
  private anomalyDetector: SimpleAnomalyDetector;
  private trendPredictor: TrendPredictor;

  constructor() {
    this.anomalyDetector = getAnomalyDetector();
    this.trendPredictor = getTrendPredictor();
  }

  /**
   * Analyze server metrics and return enhanced metrics with AI analysis.
   *
   * @param currentMetrics - Current server metrics
   * @param historicalData - Historical metric data
   * @returns Enhanced server metrics with AI analysis and trends
   */
  public analyzeServerMetrics(
    currentMetrics: ServerMetrics,
    historicalData: MetricHistory,
    logs: Array<{
      id: string;
      timestamp: string;
      level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
      message: string;
    }> = []
  ): EnhancedServerMetrics {
    // Extract current metric values (normalize union types to numbers)
    const currentValues = {
      cpu: extractNumericValue(currentMetrics.cpu),
      memory: extractNumericValue(currentMetrics.memory),
      disk: extractNumericValue(currentMetrics.disk),
      network:
        currentMetrics.network !== undefined
          ? extractNumericValue(currentMetrics.network)
          : 0,
    };

    // Run anomaly detection
    const anomalyResults = this.anomalyDetector.detectAnomalies(
      currentValues,
      historicalData
    );

    // Run trend prediction
    const trendResults = this.trendPredictor.predictTrends(historicalData);

    // Calculate aggregate anomaly score
    const aggregateAnomalyScore =
      this.anomalyDetector.calculateAggregateScore(anomalyResults);

    // Correlate logs with anomalies
    const correlatedLogs = this.correlateLogsWithAnomalies(
      anomalyResults,
      logs
    );

    // Generate recommendations (now including log insights)
    const recommendations = this.generateRecommendations(
      anomalyResults,
      trendResults,
      currentMetrics,
      correlatedLogs
    );

    // Identify predicted issues
    const predictedIssues = this.identifyPredictedIssues(
      anomalyResults,
      trendResults
    );

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(
      anomalyResults,
      trendResults
    );

    // Build enhanced metrics
    const enhancedMetrics = {
      ...currentMetrics,
      // Ensure required fields are present
      id:
        'id' in currentMetrics && typeof currentMetrics.id === 'string'
          ? currentMetrics.id
          : 'unknown',
      hostname:
        'hostname' in currentMetrics &&
        typeof currentMetrics.hostname === 'string'
          ? currentMetrics.hostname
          : 'unknown',
      aiAnalysis: {
        anomalyScore: aggregateAnomalyScore,
        predictedIssues,
        recommendations,
        confidence,
        correlatedLogs,
        rootCauseAnalysis:
          correlatedLogs.length > 0
            ? correlatedLogs.map((log) => `Possible root cause: ${log.message}`)
            : undefined,
      },
      trends: {
        cpu: trendResults.cpu?.trend || 'stable',
        memory: trendResults.memory?.trend || 'stable',
        disk: trendResults.disk?.trend || 'stable',
        network: trendResults.network?.trend || 'stable',
      },
    } as EnhancedServerMetrics;

    return enhancedMetrics;
  }

  /**
   * Get detailed analysis result (for debugging or detailed view).
   *
   * @param currentMetrics - Current server metrics
   * @param historicalData - Historical metric data
   * @returns Detailed analysis result
   */
  public getDetailedAnalysis(
    currentMetrics: ServerMetrics,
    historicalData: MetricHistory
  ): IntelligentAnalysisResult {
    const currentValues = {
      cpu: extractNumericValue(currentMetrics.cpu),
      memory: extractNumericValue(currentMetrics.memory),
      disk: extractNumericValue(currentMetrics.disk),
      network:
        currentMetrics.network !== undefined
          ? extractNumericValue(currentMetrics.network)
          : 0,
    };

    const anomalies = this.anomalyDetector.detectAnomalies(
      currentValues,
      historicalData
    );

    const trends = this.trendPredictor.predictTrends(historicalData);

    const aggregateAnomalyScore =
      this.anomalyDetector.calculateAggregateScore(anomalies);

    const recommendationsGenerated = this.generateRecommendations(
      anomalies,
      trends,
      currentMetrics
    );

    return {
      anomalies,
      trends,
      aggregateAnomalyScore,
      recommendationsGenerated,
      timestamp: Date.now(),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Correlate anomalies with system logs to find potential root causes.
   */
  private correlateLogsWithAnomalies(
    anomalies: Record<string, AnomalyDetectionResult>,
    logs: Array<{
      id: string;
      timestamp: string;
      level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
      message: string;
    }>
  ): Array<{
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
  }> {
    // Define time window for correlation (e.g., +/- 5 minutes around now)
    // Since we are analyzing current metrics, we look at recent logs
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes

    // Filter logs that are errors or warnings within the time window
    const recentErrorLogs = logs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      const isRecent = logTime >= now - windowMs && logTime <= now + windowMs;
      const isError = log.level === 'ERROR' || log.level === 'WARN';
      return isRecent && isError;
    });

    return recentErrorLogs.slice(0, 3); // Return top 3 correlated logs
  }

  /**
   * Generate actionable recommendations based on analysis results.
   */
  private generateRecommendations(
    anomalies: Record<string, AnomalyDetectionResult>,
    trends: Record<string, TrendPrediction>,
    currentMetrics: ServerMetrics,
    correlatedLogs: Array<{ message: string }> = []
  ): string[] {
    const recommendations: string[] = [];

    // Add log-based recommendations first (High Priority)
    const firstLog = correlatedLogs[0];
    if (correlatedLogs.length > 0 && firstLog) {
      recommendations.push(
        `🔍 Log Analysis: Detected ${correlatedLogs.length} recent error logs. Check: "${firstLog.message}"`
      );
    }

    // Check for high severity anomalies
    for (const [metric, result] of Object.entries(anomalies)) {
      if (result.isAnomaly && result.severity === 'high') {
        recommendations.push(
          `🚨 Critical: ${metric.toUpperCase()} shows high anomaly (${result.details.deviation.toFixed(1)}σ deviation). Immediate investigation required.`
        );
      } else if (result.isAnomaly && result.severity === 'medium') {
        recommendations.push(
          `⚠️ Warning: ${metric.toUpperCase()} anomaly detected (${result.details.deviation.toFixed(1)}σ). Monitor closely.`
        );
      }
    }

    // Check for increasing trends that may lead to capacity issues
    for (const [metric, prediction] of Object.entries(trends)) {
      if (prediction.trend === 'increasing' && prediction.confidence > 0.7) {
        const change = prediction.details.predictedChangePercent;
        if (change > 20) {
          recommendations.push(
            `📈 ${metric.toUpperCase()} increasing rapidly (+${change.toFixed(1)}% in 1 hour). Consider scaling or optimization.`
          );
        }
      }
    }

    // Check for critical thresholds
    const cpuValue = extractNumericValue(currentMetrics.cpu);
    const memoryValue = extractNumericValue(currentMetrics.memory);
    const diskValue = extractNumericValue(currentMetrics.disk);

    if (cpuValue > 80) {
      recommendations.push(
        '🔥 CPU usage above 80%. Consider load balancing or scaling.'
      );
    }

    if (memoryValue > 85) {
      recommendations.push(
        '🧠 Memory usage above 85%. Check for memory leaks or scale up.'
      );
    }

    if (diskValue > 90) {
      recommendations.push(
        '💾 Disk usage above 90%. Clean up space or expand storage.'
      );
    }

    // If no issues found
    if (recommendations.length === 0) {
      recommendations.push(
        '✅ All metrics within normal range. System healthy.'
      );
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Identify predicted issues based on trends and anomalies.
   */
  private identifyPredictedIssues(
    anomalies: Record<string, AnomalyDetectionResult>,
    trends: Record<string, TrendPrediction>
  ): string[] {
    const issues: string[] = [];

    // Check for anomalies that indicate current issues
    for (const [metric, result] of Object.entries(anomalies)) {
      if (result.isAnomaly && result.severity === 'high') {
        issues.push(`Current ${metric} anomaly (${result.severity})`);
      }
    }

    // Check for trends that predict future issues
    for (const [metric, prediction] of Object.entries(trends)) {
      if (prediction.trend === 'increasing' && prediction.confidence > 0.7) {
        const change = prediction.details.predictedChangePercent;
        if (change > 30) {
          issues.push(
            `${metric} capacity issues in 1 hour (+${change.toFixed(0)}%)`
          );
        }
      }
    }

    return issues;
  }

  /**
   * Calculate overall confidence score combining anomaly and trend confidence.
   */
  private calculateOverallConfidence(
    anomalies: Record<string, AnomalyDetectionResult>,
    trends: Record<string, TrendPrediction>
  ): number {
    const anomalyConfidences = Object.values(anomalies).map(
      (a) => a.confidence
    );
    const trendConfidences = Object.values(trends).map((t) => t.confidence);

    const allConfidences = [...anomalyConfidences, ...trendConfidences];

    if (allConfidences.length === 0) return 0;

    const avgConfidence =
      allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length;

    return Math.round(avgConfidence * 100) / 100; // Round to 2 decimal places
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a singleton instance of IntelligentMonitoringService.
 */
let instance: IntelligentMonitoringService | null = null;

export function getIntelligentMonitoringService(): IntelligentMonitoringService {
  if (!instance) {
    instance = new IntelligentMonitoringService();
  }
  return instance;
}
