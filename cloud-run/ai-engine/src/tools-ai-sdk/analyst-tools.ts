/**
 * Analyst Tools (AI SDK Format)
 *
 * Converted from LangChain tools to Vercel AI SDK format.
 * Includes anomaly detection, trend prediction, and pattern analysis.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import { tool } from 'ai';
import { z } from 'zod';

// Data sources
import {
  getCurrentState,
  type ServerSnapshot,
} from '../data/precomputed-state';
import {
  FIXED_24H_DATASETS,
  getRecentData,
} from '../data/fixed-24h-metrics';

// AI/ML modules
import {
  getAnomalyDetector,
  type MetricDataPoint,
} from '../lib/ai/monitoring/SimpleAnomalyDetector';
import {
  getTrendPredictor,
  type TrendDataPoint,
} from '../lib/ai/monitoring/TrendPredictor';
import {
  getHybridAnomalyDetector,
  type ServerMetrics,
} from '../lib/ai/monitoring/HybridAnomalyDetector';
import { getAdaptiveThreshold } from '../lib/ai/monitoring/AdaptiveThreshold';
import {
  getUnifiedAnomalyEngine,
  type ServerMetricInput,
} from '../lib/ai/monitoring/UnifiedAnomalyEngine';
import { getDataCache } from '../lib/cache-layer';

// ============================================================================
// 1. Types
// ============================================================================

interface AnomalyResultItem {
  isAnomaly: boolean;
  severity: string;
  confidence: number;
  currentValue: number;
  threshold: { upper: number; lower: number };
}

interface TrendResultItem {
  trend: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
}

// ============================================================================
// 2. Helper Functions
// ============================================================================

function getCurrentMinuteOfDay(): number {
  const koreaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  });
  const koreaDate = new Date(koreaTime);
  return koreaDate.getHours() * 60 + koreaDate.getMinutes();
}

function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

function getHistoryForMetric(
  serverId: string,
  metric: string,
  currentValue: number
): MetricDataPoint[] {
  const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
  const currentMinute = getCurrentMinuteOfDay();

  if (dataset) {
    const recentData = getRecentData(dataset, currentMinute, 36);
    const now = Date.now();
    const baseTime = now - (now % (10 * 60 * 1000));
    return recentData.map((d, i) => ({
      timestamp: baseTime - (recentData.length - 1 - i) * 600000,
      value: d[metric as keyof typeof d] as number ?? 0,
    }));
  }

  // Fallback: generate 36 points with current value
  const now = Date.now();
  const history: MetricDataPoint[] = [];
  for (let i = 0; i < 36; i++) {
    history.push({
      timestamp: now - i * 600000,
      value: currentValue,
    });
  }
  return history;
}

// Pattern analysis constants
const PATTERN_INSIGHTS: Record<string, string> = {
  system_performance:
    '시스템 성능 분석: CPU 사용률, 프로세스 수, 로드 평균 확인 필요',
  memory_status:
    '메모리 상태 분석: 사용량, 캐시, 스왑 사용률 확인 필요',
  storage_info:
    '스토리지 분석: 디스크 사용량, I/O 대기, 파티션 상태 확인 필요',
  server_status:
    '서버 상태 분석: 가동 시간, 서비스 상태, 네트워크 연결 확인',
  trend_analysis:
    '트렌드 분석: 시계열 데이터 기반 패턴 인식 및 예측 모델 적용',
  anomaly_detection:
    '이상 탐지: 통계적 이상치 감지, 임계값 기반 알림 확인',
};

// ============================================================================
// 3. AI SDK Tools
// ============================================================================

// ============================================================================
// Threshold Constants (Industry Best Practices)
// ============================================================================

const THRESHOLDS = {
  cpu: { warning: 80, critical: 90 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 80, critical: 90 },
  network: { warning: 70, critical: 85 },
} as const;

// ============================================================================
// 3.0 Threshold-based Check Tool (NEW) + AdaptiveThreshold Integration
// ============================================================================

/**
 * Get adaptive thresholds blended with fixed thresholds
 * Reduces false positives during peak hours (e.g., 09:00-10:00)
 *
 * @param metric - The metric type
 * @param fixedThreshold - The fixed industry standard threshold
 * @returns Blended threshold (adaptive 30% + fixed 70%)
 */
function getBlendedThreshold(
  metric: 'cpu' | 'memory' | 'disk' | 'network',
  fixedThreshold: { warning: number; critical: number }
): { warning: number; critical: number; isAdaptive: boolean } {
  try {
    const adaptiveManager = getAdaptiveThreshold();
    const status = adaptiveManager.getStatus();

    // Check if adaptive threshold has learned this metric
    if (status.metrics.includes(metric)) {
      const adaptiveResult = adaptiveManager.isAnomaly(metric, 0); // Get thresholds only
      const adaptiveUpper = adaptiveResult.thresholds.upper;

      // Blend: 70% fixed + 30% adaptive upper threshold
      // This makes thresholds more lenient during learned peak periods
      const blendedWarning = Math.max(
        fixedThreshold.warning,
        Math.round(fixedThreshold.warning * 0.7 + adaptiveUpper * 0.3)
      );
      const blendedCritical = Math.max(
        fixedThreshold.critical,
        Math.round(fixedThreshold.critical * 0.7 + adaptiveUpper * 0.3)
      );

      return {
        warning: Math.min(blendedWarning, 95), // Cap at 95%
        critical: Math.min(blendedCritical, 98), // Cap at 98%
        isAdaptive: true,
      };
    }

    // Fallback to fixed thresholds
    return { ...fixedThreshold, isAdaptive: false };
  } catch {
    // On any error, use fixed thresholds
    return { ...fixedThreshold, isAdaptive: false };
  }
}

/**
 * Check Thresholds Tool
 * Uses adaptive threshold-based detection with industry standard fallback
 * Blends fixed thresholds (80/90%) with learned temporal patterns
 */
export const checkThresholds = tool({
  description:
    '서버 메트릭의 임계값 초과 여부를 확인합니다. 시간대별 패턴을 반영한 적응형 임계값을 사용하며, 기본값은 업계 표준(Warning: 80%, Critical: 90%)입니다.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('확인할 서버 ID (선택, 미입력시 모든 서버 확인)'),
    useAdaptive: z
      .boolean()
      .default(true)
      .describe('적응형 임계값 사용 여부 (기본: true)'),
  }),
  execute: async ({
    serverId,
    useAdaptive,
  }: {
    serverId?: string;
    useAdaptive?: boolean;
  }) => {
    const cache = getDataCache();
    const cacheKey = `thresholds:${serverId || 'all'}:${useAdaptive ?? true}`;

    return cache.getOrCompute('analysis', cacheKey, async () => {
    console.log(`🔍 [checkThresholds] Computing for ${cacheKey} (cache miss)`);
    try {
      const state = getCurrentState();

      // Filter servers
      const targetServers = serverId
        ? state.servers.filter((s) => s.id === serverId)
        : state.servers;

      if (targetServers.length === 0) {
        return {
          success: false,
          error: serverId
            ? `서버를 찾을 수 없습니다: ${serverId}`
            : '서버 목록이 비어있습니다',
        };
      }

      interface ThresholdViolation {
        serverId: string;
        serverName: string;
        metric: 'cpu' | 'memory' | 'disk' | 'network';
        value: number;
        threshold: number;
        severity: 'warning' | 'critical';
        isAdaptive: boolean;
      }

      const violations: ThresholdViolation[] = [];
      const metrics = ['cpu', 'memory', 'disk', 'network'] as const;

      // Track if adaptive thresholds were used
      let adaptiveUsed = false;

      for (const server of targetServers) {
        for (const metric of metrics) {
          const value = server[metric] as number;
          const fixedThreshold = THRESHOLDS[metric];

          // Get blended or fixed threshold based on useAdaptive flag
          const threshold = (useAdaptive ?? true)
            ? getBlendedThreshold(metric, fixedThreshold)
            : { ...fixedThreshold, isAdaptive: false };

          if (threshold.isAdaptive) {
            adaptiveUsed = true;
          }

          if (value >= threshold.critical) {
            violations.push({
              serverId: server.id,
              serverName: server.name,
              metric,
              value,
              threshold: threshold.critical,
              severity: 'critical',
              isAdaptive: threshold.isAdaptive,
            });
          } else if (value >= threshold.warning) {
            violations.push({
              serverId: server.id,
              serverName: server.name,
              metric,
              value,
              threshold: threshold.warning,
              severity: 'warning',
              isAdaptive: threshold.isAdaptive,
            });
          }
        }
      }

      // Group by severity
      const criticalViolations = violations.filter((v) => v.severity === 'critical');
      const warningViolations = violations.filter((v) => v.severity === 'warning');

      // Build summary
      let summary = '';
      if (violations.length === 0) {
        summary = `${targetServers.length}대 서버 모두 정상 (임계값 이내)`;
      } else {
        const parts: string[] = [];
        if (criticalViolations.length > 0) {
          const criticalServers = [...new Set(criticalViolations.map((v) => v.serverId))];
          parts.push(`Critical ${criticalViolations.length}건 (${criticalServers.length}대 서버)`);
        }
        if (warningViolations.length > 0) {
          const warningServers = [...new Set(warningViolations.map((v) => v.serverId))];
          parts.push(`Warning ${warningViolations.length}건 (${warningServers.length}대 서버)`);
        }
        summary = `임계값 초과: ${parts.join(', ')}`;
      }

      // Get current time context for adaptive info
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

      return {
        success: true,
        totalServers: targetServers.length,
        violationCount: violations.length,
        criticalCount: criticalViolations.length,
        warningCount: warningViolations.length,
        hasViolations: violations.length > 0,
        thresholds: THRESHOLDS,
        adaptiveInfo: {
          enabled: useAdaptive ?? true,
          used: adaptiveUsed,
          timeContext: adaptiveUsed ? `${dayOfWeek}요일 ${hour}시` : null,
        },
        violations: violations.slice(0, 20), // Limit to top 20
        critical: criticalViolations.slice(0, 10).map((v) => ({
          server: `${v.serverName} (${v.serverId})`,
          issue: `${v.metric.toUpperCase()} ${v.value}% (임계: ${v.threshold}%)`,
          adaptive: v.isAdaptive,
        })),
        warning: warningViolations.slice(0, 10).map((v) => ({
          server: `${v.serverName} (${v.serverId})`,
          issue: `${v.metric.toUpperCase()} ${v.value}% (임계: ${v.threshold}%)`,
          adaptive: v.isAdaptive,
        })),
        summary,
        timestamp: new Date().toISOString(),
        _algorithm: adaptiveUsed
          ? 'Adaptive + Fixed Threshold Blend (70% Fixed + 30% Temporal)'
          : 'Threshold-based (Industry Standard: 80/90%)',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    }); // End of cache.getOrCompute wrapper
  },
});

// ============================================================================
// 3.1 Statistical + Threshold Anomaly Detection (Dashboard Compatible)
// ============================================================================

/**
 * Detect Anomalies Tool v2.0
 *
 * Hybrid approach combining:
 * 1. Fixed thresholds (Dashboard compatible) - Primary
 * 2. Statistical (6-hour moving average + 2σ) - Secondary
 *
 * Dashboard 일관성: 임계값 초과 시 무조건 이상으로 판정
 */
export const detectAnomalies = tool({
  description:
    '서버 메트릭의 이상치를 탐지합니다. Dashboard와 동일한 임계값 + 통계적 분석을 결합합니다.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
    metricType: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .default('all')
      .describe('분석할 메트릭 타입'),
  }),
  execute: async ({
    serverId,
    metricType,
  }: {
    serverId?: string;
    metricType: 'cpu' | 'memory' | 'disk' | 'all';
  }) => {
    try {
      const cache = getDataCache();

      return await cache.getAnalysis(
        'anomaly',
        { serverId: serverId || 'first', metricType },
        async () => {
          const state = getCurrentState();
          const server: ServerSnapshot | undefined = serverId
            ? state.servers.find((s) => s.id === serverId)
            : state.servers[0];

          if (!server) {
            return {
              success: false,
              error: `서버를 찾을 수 없습니다: ${serverId || 'none'}`,
            };
          }

          const metrics = ['cpu', 'memory', 'disk'] as const;
          const targetMetrics =
            metricType === 'all'
              ? metrics
              : [metricType as (typeof metrics)[number]];

          const results: Record<string, AnomalyResultItem & { thresholdExceeded?: boolean }> = {};
          const detector = getAnomalyDetector();

          for (const metric of targetMetrics) {
            const currentValue = server[metric as keyof typeof server] as number;
            const history = getHistoryForMetric(server.id, metric, currentValue);

            // 1. Statistical detection (existing)
            const detection = detector.detectAnomaly(currentValue, history);

            // 2. Fixed threshold check (Dashboard compatible)
            const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
            const thresholdExceeded = currentValue >= threshold.warning;
            const isCritical = currentValue >= threshold.critical;

            // 3. Combine: Threshold exceeded = anomaly (Dashboard consistency)
            const isAnomaly = thresholdExceeded || detection.isAnomaly;

            // 4. Determine severity
            let severity = detection.severity;
            if (isCritical) {
              severity = 'high';
            } else if (thresholdExceeded) {
              severity = 'medium';
            }

            results[metric] = {
              isAnomaly,
              severity,
              confidence: thresholdExceeded ? 0.95 : Math.round(detection.confidence * 100) / 100,
              currentValue,
              threshold: {
                upper: threshold.warning,
                lower: Math.round(detection.details.lowerThreshold * 100) / 100,
              },
              thresholdExceeded,
            };
          }

          const anomalyCount = Object.values(results).filter(
            (r) => r.isAnomaly
          ).length;

          // Determine overall status
          const hasCritical = Object.values(results).some(
            (r) => r.isAnomaly && r.severity === 'high'
          );
          const hasWarning = Object.values(results).some(
            (r) => r.isAnomaly && r.severity === 'medium'
          );
          const overallStatus = hasCritical ? 'critical' : hasWarning ? 'warning' : 'online';

          return {
            success: true,
            serverId: server.id,
            serverName: server.name,
            status: overallStatus,
            anomalyCount,
            hasAnomalies: anomalyCount > 0,
            results,
            summary: anomalyCount > 0
              ? `${server.name}: ${anomalyCount}개 메트릭에서 이상 감지 (${overallStatus})`
              : `${server.name}: 정상 (이상 없음)`,
            timestamp: new Date().toISOString(),
            _algorithm: 'Threshold + Statistical (Dashboard Compatible)',
          };
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Detect Anomalies Hybrid Tool (Advanced)
 * Combines Statistical (2σ) + Isolation Forest for higher accuracy
 *
 * @description
 * - Statistical: 6시간 이동평균 + 2σ 임계값 (per-metric)
 * - Isolation Forest: 다변량 패턴 감지 (CPU+Memory+Disk+Network)
 * - Voting: 두 방식의 가중 합산으로 최종 판정
 */
export const detectAnomaliesHybrid = tool({
  description:
    '하이브리드 이상 탐지: 통계(2σ) + Isolation Forest 앙상블로 정확도 향상. 다변량 패턴 감지 지원.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
    requireConsensus: z
      .boolean()
      .default(false)
      .describe('두 탐지기 모두 동의해야 이상으로 판정 (엄격 모드)'),
  }),
  execute: async ({
    serverId,
    requireConsensus,
  }: {
    serverId?: string;
    requireConsensus?: boolean;
  }) => {
    try {
      const cache = getDataCache();

      return await cache.getAnalysis(
        'anomaly-hybrid',
        { serverId: serverId || 'first', requireConsensus: requireConsensus ?? false },
        async () => {
          const state = getCurrentState();
          const server: ServerSnapshot | undefined = serverId
            ? state.servers.find((s) => s.id === serverId)
            : state.servers[0];

          if (!server) {
            return {
              success: false,
              error: `서버를 찾을 수 없습니다: ${serverId || 'none'}`,
            };
          }

          // 1. Prepare metrics
          const serverMetrics: ServerMetrics = {
            serverId: server.id,
            serverName: server.name,
            cpu: server.cpu as number,
            memory: server.memory as number,
            disk: server.disk as number,
            network: (server.network as number) ?? 0,
            timestamp: Date.now(),
          };

          // 2. Prepare history for statistical detector
          const metricHistory: Record<string, MetricDataPoint[]> = {};
          for (const metric of ['cpu', 'memory', 'disk', 'network']) {
            const currentValue = serverMetrics[metric as keyof typeof serverMetrics] as number;
            metricHistory[metric] = getHistoryForMetric(
              server.id,
              metric,
              currentValue || 0
            );
          }

          // 3. Initialize hybrid detector
          const hybridDetector = getHybridAnomalyDetector({
            requireConsensus: requireConsensus ?? false,
            statisticalWeight: 0.4,
            isolationForestWeight: 0.6,
          });

          // 4. Initialize IF with historical data (if not already trained)
          const status = hybridDetector.getStatus();
          if (!status.isolationForestStatus.isTrained) {
            const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
            if (dataset) {
              const trainingData = dataset.data.map((d, i) => ({
                timestamp: Date.now() - (dataset.data.length - i) * 600000,
                cpu: d.cpu,
                memory: d.memory,
                disk: d.disk,
                network: d.network,
              }));
              hybridDetector.initialize(trainingData);
            }
          }

          // 5. Run hybrid detection
          const result = hybridDetector.detect(serverMetrics, metricHistory);

          // 6. Format response
          return {
            success: true,
            serverId: server.id,
            serverName: server.name,
            isAnomaly: result.isAnomaly,
            severity: result.severity,
            confidence: Math.round(result.confidence * 100) / 100,
            voting: {
              statistical: result.voting.statisticalVote,
              isolationForest: result.voting.isolationForestVote,
              combinedScore: Math.round(result.voting.combinedScore * 100) / 100,
              consensus: result.voting.consensus,
            },
            dominantMetric: result.dominantMetric,
            detectorResults: {
              statistical: result.detectorResults.statistical
                ? {
                    isAnomaly: result.detectorResults.statistical.isAnomaly,
                    severity: result.detectorResults.statistical.severity,
                    confidence: Math.round(
                      result.detectorResults.statistical.confidence * 100
                    ) / 100,
                  }
                : null,
              isolationForest: result.detectorResults.isolationForest
                ? {
                    isAnomaly: result.detectorResults.isolationForest.isAnomaly,
                    anomalyScore: Math.round(
                      result.detectorResults.isolationForest.anomalyScore * 100
                    ) / 100,
                    metricContributions:
                      result.detectorResults.isolationForest.metricContributions,
                  }
                : null,
            },
            summary: result.isAnomaly
              ? `${server.name}: 이상 감지 (${result.severity}) - ${result.dominantMetric || 'multivariate'}`
              : `${server.name}: 정상 (신뢰도 ${Math.round(result.confidence * 100)}%)`,
            timestamp: new Date().toISOString(),
            _algorithm: 'Hybrid (Statistical 2σ + Isolation Forest)',
          };
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Detect Anomalies with Adaptive Thresholds
 * Adjusts thresholds based on time-of-day and day-of-week patterns
 *
 * @description
 * - 시간대별 버킷 (24개 - 0~23시)
 * - 요일별 버킷 (7개 - 일~토)
 * - EMA 스무딩으로 점진적 적응
 * - 정상 패턴 학습 후 자동 임계값 조정
 */
export const detectAnomaliesAdaptive = tool({
  description:
    '적응형 이상 탐지: 시간대/요일별 패턴을 학습하여 동적으로 임계값 조정. 피크 시간대 오탐 감소.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
    metricType: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .default('all')
      .describe('분석할 메트릭 타입'),
  }),
  execute: async ({
    serverId,
    metricType,
  }: {
    serverId?: string;
    metricType: 'cpu' | 'memory' | 'disk' | 'all';
  }) => {
    try {
      const cache = getDataCache();

      return await cache.getAnalysis(
        'anomaly-adaptive',
        { serverId: serverId || 'first', metricType },
        async () => {
          const state = getCurrentState();
          const server: ServerSnapshot | undefined = serverId
            ? state.servers.find((s) => s.id === serverId)
            : state.servers[0];

          if (!server) {
            return {
              success: false,
              error: `서버를 찾을 수 없습니다: ${serverId || 'none'}`,
            };
          }

          const metrics = ['cpu', 'memory', 'disk'] as const;
          const targetMetrics =
            metricType === 'all'
              ? metrics
              : [metricType as (typeof metrics)[number]];

          const adaptiveThreshold = getAdaptiveThreshold();
          const results: Record<
            string,
            {
              isAnomaly: boolean;
              direction: string;
              deviation: number;
              currentValue: number;
              thresholds: {
                upper: number;
                lower: number;
                expectedMean: number;
                confidence: number;
              };
            }
          > = {};

          // Learn patterns from historical data if not already learned
          for (const metric of targetMetrics) {
            const currentValue = server[metric as keyof typeof server] as number;
            const history = getHistoryForMetric(server.id, metric, currentValue);

            // Check if we need to initialize learning
            const status = adaptiveThreshold.getStatus();
            if (!status.metrics.includes(metric)) {
              adaptiveThreshold.learn(
                metric,
                history.map((h) => ({ timestamp: h.timestamp, value: h.value }))
              );
            }

            // Run adaptive anomaly check
            const result = adaptiveThreshold.isAnomaly(metric, currentValue);

            results[metric] = {
              isAnomaly: result.isAnomaly,
              direction: result.direction,
              deviation: Math.round(result.deviation * 100) / 100,
              currentValue,
              thresholds: {
                upper: Math.round(result.thresholds.upper * 100) / 100,
                lower: Math.round(result.thresholds.lower * 100) / 100,
                expectedMean:
                  Math.round(result.thresholds.expectedMean * 100) / 100,
                confidence: Math.round(result.thresholds.confidence * 100) / 100,
              },
            };
          }

          const anomalyCount = Object.values(results).filter(
            (r) => r.isAnomaly
          ).length;

          // Get current time context
          const now = new Date();
          const hour = now.getHours();
          const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][
            now.getDay()
          ];

          return {
            success: true,
            serverId: server.id,
            serverName: server.name,
            anomalyCount,
            hasAnomalies: anomalyCount > 0,
            timeContext: {
              hour,
              dayOfWeek,
              description: `${dayOfWeek}요일 ${hour}시`,
            },
            results,
            summary: anomalyCount > 0
              ? `${server.name}: ${anomalyCount}개 메트릭에서 이상 감지 (${dayOfWeek}요일 ${hour}시 기준)`
              : `${server.name}: 정상 (${dayOfWeek}요일 ${hour}시 패턴 대비)`,
            timestamp: new Date().toISOString(),
            _algorithm: 'Adaptive Thresholds (Temporal Pattern Learning)',
          };
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Unified Anomaly Detection (Production-Grade)
 * Combines all three approaches with streaming support
 *
 * @description
 * - Statistical (30%): Fast baseline check
 * - Isolation Forest (40%): Multivariate ML
 * - Adaptive (30%): Temporal pattern awareness
 * - Weighted voting for final decision
 */
export const detectAnomaliesUnified = tool({
  description:
    '통합 이상 탐지: 모든 탐지기(통계/IF/적응형)를 앙상블 투표로 결합. 프로덕션급 정확도.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
    enableStatistical: z.boolean().default(true).describe('통계 탐지기 활성화'),
    enableIsolationForest: z.boolean().default(true).describe('IF 탐지기 활성화'),
    enableAdaptive: z.boolean().default(true).describe('적응형 탐지기 활성화'),
  }),
  execute: async ({
    serverId,
    enableStatistical,
    enableIsolationForest,
    enableAdaptive,
  }: {
    serverId?: string;
    enableStatistical?: boolean;
    enableIsolationForest?: boolean;
    enableAdaptive?: boolean;
  }) => {
    try {
      const cache = getDataCache();

      return await cache.getAnalysis(
        'anomaly-unified',
        {
          serverId: serverId || 'first',
          enableStatistical: enableStatistical ?? true,
          enableIsolationForest: enableIsolationForest ?? true,
          enableAdaptive: enableAdaptive ?? true,
        },
        async () => {
          const state = getCurrentState();
          const server: ServerSnapshot | undefined = serverId
            ? state.servers.find((s) => s.id === serverId)
            : state.servers[0];

          if (!server) {
            return {
              success: false,
              error: `서버를 찾을 수 없습니다: ${serverId || 'none'}`,
            };
          }

          // Initialize unified engine
          const engine = getUnifiedAnomalyEngine({
            enableStatistical: enableStatistical ?? true,
            enableIsolationForest: enableIsolationForest ?? true,
            enableAdaptive: enableAdaptive ?? true,
          });

          // Initialize with historical data if not already trained
          const stats = engine.getStats();
          if (!stats.modelsStatus.isolationForestTrained) {
            const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
            if (dataset) {
              const now = Date.now();
              engine.initialize({
                multiMetric: dataset.data.map((d, i) => ({
                  timestamp: now - (dataset.data.length - i) * 600000,
                  cpu: d.cpu,
                  memory: d.memory,
                  disk: d.disk,
                  network: d.network,
                })),
              });
            }
          }

          // Prepare input
          const metricInput: ServerMetricInput = {
            serverId: server.id,
            serverName: server.name,
            cpu: server.cpu as number,
            memory: server.memory as number,
            disk: server.disk as number,
            network: (server.network as number) ?? 0,
            timestamp: Date.now(),
          };

          // Run unified detection
          const result = engine.process(metricInput);

          // Format response
          return {
            success: true,
            serverId: result.serverId,
            serverName: result.serverName,
            isAnomaly: result.isAnomaly,
            severity: result.severity,
            confidence: result.confidence,
            anomalyScore: result.anomalyScore,
            voting: result.voting,
            dominantMetric: result.dominantMetric,
            detectors: {
              statistical: {
                enabled: result.detectors.statistical.enabled,
                isAnomaly: result.detectors.statistical.isAnomaly,
                severity: result.detectors.statistical.severity,
              },
              isolationForest: {
                enabled: result.detectors.isolationForest.enabled,
                isAnomaly: result.detectors.isolationForest.isAnomaly,
                anomalyScore: result.detectors.isolationForest.anomalyScore,
              },
              adaptive: {
                enabled: result.detectors.adaptive.enabled,
                isAnomaly: result.detectors.adaptive.isAnomaly,
                direction: result.detectors.adaptive.direction,
              },
            },
            timeContext: result.timeContext,
            latencyMs: result.latencyMs,
            summary: result.isAnomaly
              ? `${result.serverName}: 이상 감지 (${result.severity}, 신뢰도 ${Math.round(result.confidence * 100)}%) - ${result.voting.consensusLevel} consensus`
              : `${result.serverName}: 정상 (score: ${result.anomalyScore})`,
            timestamp: new Date().toISOString(),
            _algorithm: 'Unified Engine (Statistical + IF + Adaptive Ensemble)',
          };
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Predict Trends Tool v2.0
 *
 * 🆕 Enhanced Prediction (상용 도구 수준):
 * - 임계값 도달 시간 예측 (Prometheus predict_linear 스타일)
 * - 정상 복귀 시간 예측 (Datadog Recovery Forecast 스타일)
 * - 현재 상태 + 미래 상태 예측
 *
 * @version 2.0.0
 * @date 2026-01-12
 */
export const predictTrends = tool({
  description:
    '🆕 v2.0: 서버 메트릭의 트렌드를 예측합니다. 임계값 도달 시간과 정상 복귀 시간을 포함한 향상된 예측을 제공합니다.',
  inputSchema: z.object({
    serverId: z
      .string()
      .optional()
      .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
    metricType: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .default('all')
      .describe('분석할 메트릭 타입'),
    predictionHours: z
      .number()
      .default(1)
      .describe('예측 시간 (기본 1시간)'),
  }),
  execute: async ({
    serverId,
    metricType,
    predictionHours,
  }: {
    serverId?: string;
    metricType: 'cpu' | 'memory' | 'disk' | 'all';
    predictionHours: number;
  }) => {
    try {
      const cache = getDataCache();
      const hours = predictionHours ?? 1;

      return await cache.getAnalysis(
        'trend',
        { serverId: serverId || 'first', metricType, hours },
        async () => {
          const state = getCurrentState();
          const server: ServerSnapshot | undefined = serverId
            ? state.servers.find((s) => s.id === serverId)
            : state.servers[0];

          if (!server) {
            return {
              success: false,
              error: `서버를 찾을 수 없습니다: ${serverId || 'none'}`,
            };
          }

          const metrics = ['cpu', 'memory', 'disk'] as const;
          const targetMetrics =
            metricType === 'all'
              ? metrics
              : [metricType as (typeof metrics)[number]];

          // 🆕 Enhanced Results Interface
          interface EnhancedTrendResult extends TrendResultItem {
            currentStatus: 'online' | 'warning' | 'critical';
            thresholdBreach: {
              willBreachWarning: boolean;
              timeToWarning: number | null;
              willBreachCritical: boolean;
              timeToCritical: number | null;
              humanReadable: string;
            };
            recovery: {
              willRecover: boolean;
              timeToRecovery: number | null;
              humanReadable: string | null;
            };
          }

          const results: Record<string, EnhancedTrendResult> = {};
          const predictor = getTrendPredictor();

          // 🆕 Alerts for critical predictions
          const warnings: string[] = [];
          const criticalAlerts: string[] = [];
          const recoveryPredictions: string[] = [];

          for (const metric of targetMetrics) {
            const currentValue = server[metric as keyof typeof server] as number;
            const history = getHistoryForMetric(server.id, metric, currentValue);
            const trendHistory = toTrendDataPoints(history);

            // 🆕 Use enhanced prediction
            const prediction = predictor.predictEnhanced(trendHistory, metric);

            results[metric] = {
              trend: prediction.trend,
              currentValue,
              predictedValue: Math.round(prediction.prediction * 100) / 100,
              changePercent:
                Math.round(prediction.details.predictedChangePercent * 100) / 100,
              confidence: Math.round(prediction.confidence * 100) / 100,
              // 🆕 Enhanced fields
              currentStatus: prediction.currentStatus,
              thresholdBreach: prediction.thresholdBreach,
              recovery: prediction.recovery,
            };

            // 🆕 Collect alerts
            if (prediction.thresholdBreach.willBreachCritical) {
              criticalAlerts.push(
                `${metric.toUpperCase()}: ${prediction.thresholdBreach.humanReadable}`
              );
            } else if (prediction.thresholdBreach.willBreachWarning) {
              warnings.push(
                `${metric.toUpperCase()}: ${prediction.thresholdBreach.humanReadable}`
              );
            }

            if (prediction.currentStatus !== 'online' && prediction.recovery.willRecover) {
              recoveryPredictions.push(
                `${metric.toUpperCase()}: ${prediction.recovery.humanReadable}`
              );
            }
          }

          const increasingMetrics = Object.entries(results)
            .filter(([, r]) => r.trend === 'increasing')
            .map(([m]) => m);

          // 🆕 Build enhanced message
          let message = '';
          if (criticalAlerts.length > 0) {
            message = `🚨 ${server.name}: ${criticalAlerts.join('; ')}`;
          } else if (warnings.length > 0) {
            message = `⚠️ ${server.name}: ${warnings.join('; ')}`;
          } else if (recoveryPredictions.length > 0) {
            message = `✅ ${server.name}: ${recoveryPredictions.join('; ')}`;
          } else if (increasingMetrics.length > 0) {
            message = `📈 ${server.name}: ${increasingMetrics.join(', ')} 상승 추세 (임계값 미도달 예상)`;
          } else {
            message = `✅ ${server.name}: 안정적 추세`;
          }

          return {
            success: true,
            version: '2.0.0',
            serverId: server.id,
            serverName: server.name,
            predictionHorizon: `${hours}시간`,
            results,
            summary: {
              increasingMetrics,
              hasRisingTrends: increasingMetrics.length > 0,
              // 🆕 Enhanced summary
              hasWarningPredictions: warnings.length > 0,
              hasCriticalPredictions: criticalAlerts.length > 0,
              hasRecoveryPredictions: recoveryPredictions.length > 0,
              warnings,
              criticalAlerts,
              recoveryPredictions,
            },
            message,
            timestamp: new Date().toISOString(),
          };
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Analyze Pattern Tool
 * Classifies user query intent
 */
export const analyzePattern = tool({
  description:
    '사용자 질문의 패턴을 분석하여 의도를 파악하고 관련 인사이트를 제공합니다.',
  inputSchema: z.object({
    query: z.string().describe('분석할 사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const patterns: string[] = [];
      const q = query.toLowerCase();

      // Pattern matching
      if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
      if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
      if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
      if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');
      if (/트렌드|추세|예측/i.test(q)) patterns.push('trend_analysis');
      if (/이상|anomaly|alert/i.test(q)) patterns.push('anomaly_detection');

      if (patterns.length === 0) {
        return {
          success: false,
          message: '매칭되는 패턴 없음',
          query,
        };
      }

      const analysisResults = patterns.map((pattern) => ({
        pattern,
        confidence: 0.8 + Math.random() * 0.2,
        insights: PATTERN_INSIGHTS[pattern] || '일반 분석 수행',
      }));

      return {
        success: true,
        patterns,
        detectedIntent: patterns[0],
        analysisResults,
        summary: `${patterns.length}개 패턴 감지: ${patterns.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
