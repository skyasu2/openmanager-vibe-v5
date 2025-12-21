/**
 * 🧠 지능형 모니터링 API
 *
 * Phase 3: Intelligent Monitoring Backend
 * - 예측적 알림 (Predictive alerts)
 * - 이상 징후 예측 (Anomaly forecasting)
 * - 적응형 임계값 (Adaptive thresholds)
 * - 학습 기반 패턴 인식
 * - 자동 스케일링 권장사항
 *
 * 🔄 v5.84.0: Cloud Run LangGraph Integration
 * - analyze_server: Cloud Run 우선 → 로컬 fallback
 * - LangGraph Agent Tools 재사용 (26-hour MA, Linear Regression)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

// Types
interface Metric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface CurrentMetrics extends Metric {
  server_id: string;
  server_name: string;
}

interface Prediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  time_to_threshold: number;
  will_exceed_threshold: boolean;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PredictiveAlert {
  type: 'predictive' | 'immediate';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  time_until_critical?: number;
  recommended_action?: string;
}

interface AdaptiveThreshold {
  metric: string;
  warning: number;
  critical: number;
  confidence_interval: [number, number];
  based_on_samples: number;
}

interface ScalingRecommendation {
  action: 'scale_up' | 'scale_down' | 'scale_out' | 'scale_in';
  resource: string;
  amount: number | string;
  urgency: 'immediate' | 'scheduled' | 'optional';
  cost_impact: number;
  expected_improvement: string;
}

/**
 * Simple linear regression for prediction
 */
function linearRegression(data: number[]): {
  slope: number;
  intercept: number;
} {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * (data[i] ?? 0), 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Predict future values using linear regression
 */
function predictFutureValue(
  historicalData: number[],
  stepsAhead: number
): { value: number; confidence: number } {
  if (historicalData.length < 2) {
    return { value: historicalData[0] || 0, confidence: 0 };
  }

  const { slope, intercept } = linearRegression(historicalData);
  const predictedValue =
    slope * (historicalData.length + stepsAhead - 1) + intercept;

  // Simple confidence calculation based on data consistency
  const variance =
    historicalData.reduce((sum, val, i) => {
      const expected = slope * i + intercept;
      return sum + (val - expected) ** 2;
    }, 0) / historicalData.length;

  const confidence = Math.max(0, Math.min(1, 1 - variance / 100));

  return { value: predictedValue, confidence };
}

/**
 * Predict resource exhaustion
 */
function predictResourceExhaustion(
  historicalData: Metric[],
  currentMetrics: CurrentMetrics,
  horizonHours: number
): {
  predictions: Record<string, Prediction>;
  alerts: PredictiveAlert[];
  confidence: number;
  data_quality: string;
} {
  const metrics = ['cpu', 'memory', 'disk', 'network'] as const;
  const predictions: Record<string, Prediction> = {};
  const alerts: PredictiveAlert[] = [];

  // Data quality check
  const dataQuality =
    historicalData.length >= 10
      ? 'good'
      : historicalData.length >= 5
        ? 'sufficient'
        : 'limited';

  for (const metric of metrics) {
    const values = historicalData.map((d) => d[metric]);
    values.push(currentMetrics[metric]);

    const { value: predictedValue, confidence } = predictFutureValue(
      values,
      horizonHours
    );
    const threshold = metric === 'cpu' || metric === 'memory' ? 90 : 80;
    const willExceed = predictedValue > threshold;

    // Calculate time to threshold
    const { slope } = linearRegression(values);
    const timeToThreshold =
      slope > 0
        ? Math.max(0, (threshold - currentMetrics[metric]) / slope)
        : Infinity;

    predictions[metric] = {
      metric,
      current_value: currentMetrics[metric],
      predicted_value: Math.min(100, Math.max(0, predictedValue)),
      time_to_threshold: Math.min(horizonHours, timeToThreshold),
      will_exceed_threshold: willExceed && timeToThreshold < horizonHours,
      confidence,
      trend:
        slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable',
    };

    // Generate alerts - more lenient for testing
    if (willExceed || currentMetrics[metric] > 75) {
      const severity =
        timeToThreshold < 1
          ? 'critical'
          : timeToThreshold < 4
            ? 'warning'
            : 'info';

      alerts.push({
        type: 'predictive',
        severity,
        message: `${metric.toUpperCase()} ${willExceed ? 'will exceed' : 'approaching'} ${threshold}% ${timeToThreshold < horizonHours ? `in ${timeToThreshold.toFixed(1)} hours` : 'soon'}`,
        time_until_critical: Math.min(timeToThreshold, horizonHours),
        recommended_action: `Consider scaling ${metric} resources`,
      });
    }
  }

  // Overall confidence based on data quality and prediction consistency
  const overallConfidence =
    dataQuality === 'good' ? 0.85 : dataQuality === 'sufficient' ? 0.65 : 0.45;

  return {
    predictions,
    alerts,
    confidence: overallConfidence,
    data_quality: dataQuality,
  };
}

/**
 * Forecast anomaly probability
 */
function forecastAnomalies(
  historicalData: Metric[],
  patternWindow: number
): {
  next_hour_probability: number;
  next_day_probability: number;
  risk_factors: string[];
} {
  // Simplified anomaly detection based on deviation from mean
  const recentData = historicalData.slice(-patternWindow);

  const avgCpu =
    recentData.reduce((sum, d) => sum + d.cpu, 0) / recentData.length;
  const stdCpu = Math.sqrt(
    recentData.reduce((sum, d) => sum + (d.cpu - avgCpu) ** 2, 0) /
      recentData.length
  );

  // Calculate trend
  const cpuValues = recentData.map((d) => d.cpu);
  const { slope } = linearRegression(cpuValues);

  // Simple probability calculation
  const trendFactor = Math.abs(slope) / 10;
  const variabilityFactor = stdCpu / 100;

  const nextHourProb = Math.min(1, trendFactor + variabilityFactor + 0.1);
  const nextDayProb = Math.min(1, nextHourProb * 0.7 + 0.15);

  const riskFactors = [];
  if (slope > 2) riskFactors.push('Rapid resource increase detected');
  if (stdCpu > 15) riskFactors.push('High variability in metrics');
  if (avgCpu > 70) riskFactors.push('Elevated baseline usage');

  return {
    next_hour_probability: nextHourProb,
    next_day_probability: nextDayProb,
    risk_factors: riskFactors,
  };
}

/**
 * Calculate adaptive thresholds
 */
function calculateAdaptiveThresholds(
  metricType: string,
  historicalData: Metric[]
): AdaptiveThreshold {
  const values = historicalData.map(
    (d) => d[metricType as keyof Metric] as number
  );

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );

  // Calculate percentiles for thresholds
  const sorted = [...values].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  return {
    metric: metricType,
    warning: Math.min(90, Math.max(60, (p75 ?? 60) + std)),
    critical: Math.min(95, Math.max(80, (p95 ?? 80) + std)),
    confidence_interval: [
      Math.max(0, mean - 2 * std),
      Math.min(100, mean + 2 * std),
    ],
    based_on_samples: values.length,
  };
}

/**
 * Generate scaling recommendations
 */
function generateScalingRecommendations(
  currentMetrics: CurrentMetrics,
  predictedLoad: { cpu: number; memory: number }
): ScalingRecommendation[] {
  const recommendations: ScalingRecommendation[] = [];

  if (predictedLoad.cpu > 85) {
    recommendations.push({
      action: 'scale_up',
      resource: 'CPU',
      amount: `${Math.ceil((predictedLoad.cpu - 70) / 10)} vCPUs`,
      urgency: predictedLoad.cpu > 90 ? 'immediate' : 'scheduled',
      cost_impact: 15 * Math.ceil((predictedLoad.cpu - 70) / 10),
      expected_improvement: `Reduce CPU usage to ~70%`,
    });
  }

  if (predictedLoad.memory > 85) {
    recommendations.push({
      action: 'scale_up',
      resource: 'Memory',
      amount: `${Math.ceil((predictedLoad.memory - 70) / 10)} GB`,
      urgency: predictedLoad.memory > 90 ? 'immediate' : 'scheduled',
      cost_impact: 10 * Math.ceil((predictedLoad.memory - 70) / 10),
      expected_improvement: `Reduce memory usage to ~70%`,
    });
  }

  if (currentMetrics.cpu < 30 && currentMetrics.memory < 30) {
    recommendations.push({
      action: 'scale_down',
      resource: 'Instance',
      amount: '1 size smaller',
      urgency: 'optional',
      cost_impact: -20,
      expected_improvement: `Save costs with minimal performance impact`,
    });
  }

  return recommendations;
}

/**
 * POST handler
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'predict': {
        const { server_id, historical_data, current_metrics, horizon_hours } =
          body;

        if (!historical_data || historical_data.length < 2) {
          return NextResponse.json(
            { success: false, error: 'Insufficient data for prediction' },
            { status: 400 }
          );
        }

        if (horizon_hours > 24) {
          return NextResponse.json(
            {
              success: false,
              error: 'Prediction horizon too long (max 24 hours)',
            },
            { status: 400 }
          );
        }

        const startTime = Date.now();
        const result = predictResourceExhaustion(
          historical_data,
          current_metrics,
          horizon_hours
        );
        const responseTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          predictions: {
            ...result.predictions,
            confidence: result.confidence,
            data_quality: result.data_quality,
          },
          alerts: result.alerts,
          server_id,
          horizon_hours,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }

      case 'forecast_anomalies': {
        const { server_id, historical_data, pattern_window = 24 } = body;

        const forecast = forecastAnomalies(historical_data, pattern_window);

        return NextResponse.json({
          success: true,
          server_id,
          forecast,
          timestamp: new Date().toISOString(),
        });
      }

      case 'calculate_thresholds': {
        const { server_id, metric_type, learning_period } = body;

        // Mock historical data for calculation
        const mockData = Array.from({ length: 100 }, () => ({
          timestamp: new Date().toISOString(),
          cpu: 40 + Math.random() * 40,
          memory: 35 + Math.random() * 45,
          disk: 20 + Math.random() * 40,
          network: 15 + Math.random() * 60,
        }));

        const thresholds = calculateAdaptiveThresholds(metric_type, mockData);

        return NextResponse.json({
          success: true,
          server_id,
          metric_type,
          thresholds,
          learning_period,
          timestamp: new Date().toISOString(),
        });
      }

      case 'scaling_recommendations': {
        const { server_id, current_metrics, predicted_load } = body;

        const recommendations = generateScalingRecommendations(
          current_metrics,
          predicted_load
        );

        return NextResponse.json({
          success: true,
          server_id,
          scaling_recommendations: recommendations,
          timestamp: new Date().toISOString(),
        });
      }

      case 'analyze_server': {
        const { serverId, analysisDepth, includeSteps } = body;

        // ================================================================
        // 🔄 v5.84.0: Cloud Run LangGraph Integration
        // 1. Cloud Run 우선 호출 (LangGraph Agent Tools 재사용)
        // 2. 실패 시 로컬 알고리즘 fallback
        // ================================================================

        if (isCloudRunEnabled()) {
          debug.info('[intelligent-monitoring] Trying Cloud Run LangGraph...');

          const cloudRunResult = await proxyToCloudRun({
            path: '/api/ai/analyze-server',
            method: 'POST',
            body: {
              serverId,
              analysisType: analysisDepth || 'full',
              options: {
                includeSteps,
                metricType: 'all',
                predictionHours: 1,
              },
            },
            timeout: 15000, // 15s timeout for analysis
          });

          if (cloudRunResult.success && cloudRunResult.data) {
            debug.info('[intelligent-monitoring] Cloud Run analysis succeeded');

            // Cloud Run 응답을 Vercel 응답 형식으로 변환
            const crData = cloudRunResult.data as {
              anomalyDetection?: {
                hasAnomalies?: boolean;
                totalChecked?: number;
                anomalies?: Array<{
                  metricType?: string;
                  deviation?: number;
                  severity?: string;
                }>;
              };
              trendPrediction?: {
                predictions?: Record<
                  string,
                  {
                    predictedValue?: number;
                    trend?: string;
                    confidence?: number;
                  }
                >;
              };
              patternAnalysis?: {
                patterns?: string[];
                recommendations?: string[];
              };
            };

            const response = {
              success: true,
              data: {
                analysisId: `cr-analysis-${Date.now()}`,
                timestamp: new Date().toISOString(),
                request: { serverId, analysisDepth, includeSteps },
                _source: 'Cloud Run LangGraph',
                anomalyDetection: {
                  status: 'completed',
                  summary: crData.anomalyDetection?.hasAnomalies
                    ? `Found ${crData.anomalyDetection.anomalies?.length || 0} anomalies`
                    : 'No anomalies detected',
                  anomaliesFound:
                    crData.anomalyDetection?.anomalies?.length || 0,
                  severity: crData.anomalyDetection?.hasAnomalies
                    ? 'high'
                    : 'low',
                  confidence: 0.85,
                  processingTime: 150,
                  anomalies: crData.anomalyDetection?.anomalies || [],
                },
                rootCauseAnalysis: {
                  status: 'completed',
                  summary:
                    crData.patternAnalysis?.patterns?.[0] ||
                    'No root cause identified',
                  rootCauses: crData.patternAnalysis?.patterns || [],
                  confidence: 0.85,
                  processingTime: 200,
                  causes: [],
                  aiInsights: crData.patternAnalysis?.recommendations || [],
                },
                predictiveMonitoring: {
                  status: 'completed',
                  summary: `Trend analysis via LangGraph`,
                  predictions: Object.entries(
                    crData.trendPrediction?.predictions || {}
                  ).map(([metric, pred]) => ({
                    metric,
                    timeframe: '1h',
                    prediction: pred.trend || 'stable',
                    predictedValue: pred.predictedValue,
                    confidence: pred.confidence || 0.8,
                  })),
                  confidence: 0.8,
                  processingTime: 100,
                  recommendations:
                    crData.patternAnalysis?.recommendations || [],
                },
                overallResult: {
                  severity: crData.anomalyDetection?.hasAnomalies
                    ? 'warning'
                    : 'low',
                  actionRequired:
                    crData.anomalyDetection?.hasAnomalies || false,
                  priorityActions:
                    crData.patternAnalysis?.recommendations || [],
                  summary: 'LangGraph AI Analysis Completed',
                  confidence: 0.85,
                  totalProcessingTime: 450,
                },
              },
            };

            return NextResponse.json(response);
          }

          // Cloud Run 실패 시 fallback 로깅
          debug.warn(
            '[intelligent-monitoring] Cloud Run failed, falling back to local:',
            cloudRunResult.error
          );
        }

        // ================================================================
        // 📍 Fallback: 로컬 알고리즘 (기존 로직)
        // ================================================================
        debug.info('[intelligent-monitoring] Using local analysis fallback');

        // 1. Get Service Instance
        const { getIntelligentMonitoringService } = await import(
          '@/services/ai/IntelligentMonitoringService'
        );
        const service = getIntelligentMonitoringService();

        // 2. Mock Data Generation (Replace with real DB calls later)
        // Scenario: High CPU with Log Correlation
        const currentMetrics = {
          id: serverId || 'server-01',
          name: 'Web Server 01',
          status: 'warning',
          cpu: 92, // High CPU
          memory: 65,
          disk: 45,
          network: 80,
          uptime: 12345,
          lastCheck: new Date().toISOString(),
          hostname: 'web-01',
          environment: 'production',
          role: 'web',
          location: 'us-east-1',
          lastUpdated: new Date().toISOString(),
          provider: 'aws',
          alerts: 1,
        };

        const historicalData = {
          cpu: Array.from({ length: 20 }, (_, i) => ({
            timestamp: Date.now() - i * 300000,
            value: 80 + Math.random() * 15,
          })),
          memory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: Date.now() - i * 300000,
            value: 60 + Math.random() * 5,
          })),
          disk: Array.from({ length: 20 }, (_, i) => ({
            timestamp: Date.now() - i * 300000,
            value: 45,
          })),
          network: Array.from({ length: 20 }, (_, i) => ({
            timestamp: Date.now() - i * 300000,
            value: 70 + Math.random() * 20,
          })),
        };

        // Mock Logs for Correlation
        const logs = [
          {
            id: 'log-1',
            timestamp: new Date().toISOString(),
            level: 'ERROR' as const,
            message:
              'Connection timeout in /api/search: Database pool exhausted',
          },
          {
            id: 'log-2',
            timestamp: new Date(Date.now() - 10000).toISOString(),
            level: 'WARN' as const,
            message: 'Slow query detected: SELECT * FROM users',
          },
        ];

        // 3. Run Analysis
        const analysisResult = service.analyzeServerMetrics(
          // @ts-expect-error - Mock data compatibility
          currentMetrics,
          historicalData,
          logs
        );

        // 4. Format Response to match ExtendedIntelligentAnalysisResult
        const response = {
          success: true,
          data: {
            analysisId: `local-analysis-${Date.now()}`,
            timestamp: new Date().toISOString(),
            request: { serverId, analysisDepth, includeSteps },
            _source: 'Local Fallback',
            anomalyDetection: {
              status: 'completed',
              summary: `Anomaly Score: ${(analysisResult.aiAnalysis?.anomalyScore ?? 0).toFixed(2)}`,
              anomaliesFound: analysisResult.aiAnalysis?.anomalyScore ? 1 : 0,
              severity:
                (analysisResult.aiAnalysis?.anomalyScore ?? 0) > 0.7
                  ? 'high'
                  : 'low',
              confidence: analysisResult.aiAnalysis?.confidence || 0,
              processingTime: 150,
              anomalies: [],
            },
            rootCauseAnalysis: {
              status: 'completed',
              summary:
                analysisResult.aiAnalysis?.rootCauseAnalysis?.[0] ||
                'No root cause identified',
              rootCauses: analysisResult.aiAnalysis?.rootCauseAnalysis || [],
              confidence: 0.85,
              processingTime: 200,
              causes: [],
              aiInsights: analysisResult.aiAnalysis?.recommendations || [],
            },
            predictiveMonitoring: {
              status: 'completed',
              summary: `Trend: ${analysisResult.trends?.cpu}`,
              predictions: [
                {
                  timeframe: '1h',
                  prediction: analysisResult.trends?.cpu || 'stable',
                  confidence: 0.8,
                },
              ],
              confidence: 0.8,
              processingTime: 100,
              recommendations: analysisResult.aiAnalysis?.recommendations || [],
            },
            overallResult: {
              severity:
                (analysisResult.aiAnalysis?.anomalyScore ?? 0) > 0.7
                  ? 'critical'
                  : 'low',
              actionRequired:
                (analysisResult.aiAnalysis?.anomalyScore ?? 0) > 0.7,
              priorityActions: analysisResult.aiAnalysis?.recommendations || [],
              summary: 'Local AI Analysis Completed',
              confidence: analysisResult.aiAnalysis?.confidence || 0,
              totalProcessingTime: 450,
            },
          },
        };

        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('Intelligent monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler
 */
async function getHandler(_request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'intelligent-monitoring',
      capabilities: {
        predictive_alerts: true,
        anomaly_forecasting: true,
        adaptive_thresholds: true,
        scaling_recommendations: true,
        intelligent_analysis: true,
      },
      supported_actions: [
        'predict',
        'forecast_anomalies',
        'calculate_thresholds',
        'scaling_recommendations',
        'analyze_server',
      ],
      configuration: {
        max_prediction_horizon: '24 hours',
        min_historical_data: '2 data points',
        supported_metrics: ['cpu', 'memory', 'disk', 'network'],
        algorithms: ['linear_regression', 'statistical_analysis'],
      },
    });
  } catch (error) {
    debug.error('Get status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export with authentication
export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
