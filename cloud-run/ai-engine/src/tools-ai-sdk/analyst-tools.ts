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

/**
 * Detect Anomalies Tool
 * Uses 6-hour moving average + 2σ threshold
 */
export const detectAnomalies = tool({
  description:
    '서버 메트릭의 이상치를 탐지합니다. 6시간 이동평균과 2σ 임계값을 사용합니다.',
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

          const results: Record<string, AnomalyResultItem> = {};
          const detector = getAnomalyDetector();

          for (const metric of targetMetrics) {
            const currentValue = server[metric as keyof typeof server] as number;
            const history = getHistoryForMetric(server.id, metric, currentValue);

            const detection = detector.detectAnomaly(currentValue, history);

            results[metric] = {
              isAnomaly: detection.isAnomaly,
              severity: detection.severity,
              confidence: Math.round(detection.confidence * 100) / 100,
              currentValue,
              threshold: {
                upper: Math.round(detection.details.upperThreshold * 100) / 100,
                lower: Math.round(detection.details.lowerThreshold * 100) / 100,
              },
            };
          }

          const anomalyCount = Object.values(results).filter(
            (r) => r.isAnomaly
          ).length;

          return {
            success: true,
            serverId: server.id,
            serverName: server.name,
            anomalyCount,
            hasAnomalies: anomalyCount > 0,
            results,
            summary: anomalyCount > 0
              ? `${server.name}: ${anomalyCount}개 메트릭에서 이상 감지`
              : `${server.name}: 정상 (이상 없음)`,
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
 * Predict Trends Tool
 * Uses linear regression for 1-hour prediction
 */
export const predictTrends = tool({
  description:
    '서버 메트릭의 트렌드를 예측합니다. 선형 회귀 기반 1시간 예측을 수행합니다.',
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
          const horizon = hours * 3600 * 1000;

          const results: Record<string, TrendResultItem> = {};
          const predictor = getTrendPredictor();

          for (const metric of targetMetrics) {
            const currentValue = server[metric as keyof typeof server] as number;
            const history = getHistoryForMetric(server.id, metric, currentValue);
            const trendHistory = toTrendDataPoints(history);

            const prediction = predictor.predictTrend(trendHistory, horizon);

            results[metric] = {
              trend: prediction.trend,
              currentValue,
              predictedValue: Math.round(prediction.prediction * 100) / 100,
              changePercent:
                Math.round(prediction.details.predictedChangePercent * 100) / 100,
              confidence: Math.round(prediction.confidence * 100) / 100,
            };
          }

          const increasingMetrics = Object.entries(results)
            .filter(([, r]) => r.trend === 'increasing')
            .map(([m]) => m);

          return {
            success: true,
            serverId: server.id,
            serverName: server.name,
            predictionHorizon: `${hours}시간`,
            results,
            summary: {
              increasingMetrics,
              hasRisingTrends: increasingMetrics.length > 0,
            },
            message: increasingMetrics.length > 0
              ? `${server.name}: ${increasingMetrics.join(', ')} 상승 추세`
              : `${server.name}: 안정적 추세`,
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
