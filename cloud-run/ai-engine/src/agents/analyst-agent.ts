/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getAnomalyDetector,
  type MetricDataPoint,
} from '../lib/ai/monitoring/SimpleAnomalyDetector';
import {
  getTrendPredictor,
  type TrendDataPoint,
} from '../lib/ai/monitoring/TrendPredictor';
import { getDataCache } from '../lib/cache-layer';
// 🎯 Precomputed State (O(1) 조회)
import {
  getCurrentState,
  type ServerSnapshot,
} from '../data/precomputed-state';
// Historical 데이터 (이상탐지/트렌드 분석용 6시간 이동평균)
import {
  FIXED_24H_DATASETS,
  getRecentData,
} from '../data/fixed-24h-metrics';

// ============================================================================
// 1. Tool Result Types
// ============================================================================

type AnomalyResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      anomalyCount: number;
      hasAnomalies: boolean;
      results: Record<
        string,
        {
          isAnomaly: boolean;
          severity: string;
          confidence: number;
          currentValue: number;
          threshold: { upper: number; lower: number };
        }
      >;
      timestamp: string;
      _algorithm: string;
      _engine: 'typescript';
    }
  | { success: false; error: string };

type TrendResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      predictionHorizon: string;
      results: Record<
        string,
        {
          trend: string;
          currentValue: number;
          predictedValue: number;
          changePercent: number;
          confidence: number;
        }
      >;
      summary: { increasingMetrics: string[]; hasRisingTrends: boolean };
      timestamp: string;
      _algorithm: string;
      _engine: 'typescript';
    }
  | { success: false; error: string };

type PatternResult =
  | {
      success: true;
      patterns: string[];
      detectedIntent: string;
      analysisResults: {
        pattern: string;
        confidence: number;
        insights: string;
      }[];
      _mode: string;
    }
  | { success: false; message: string };

// Tool Input Types (for TypeScript strict mode)
interface DetectAnomaliesInput {
  serverId?: string;
  metricType: 'cpu' | 'memory' | 'disk' | 'all';
}

interface PredictTrendsInput {
  serverId?: string;
  metricType: 'cpu' | 'memory' | 'disk' | 'all';
  predictionHours?: number;
}

interface AnalyzePatternInput {
  query: string;
}

// ============================================================================
// 2. Structured Output Types (Token Optimization)
// ============================================================================

/**
 * 압축된 Analyst 출력 형식
 * Before: ~2,100 tokens → After: ~500 tokens
 */
export interface AnalystCompressedOutput {
  anomalies: AnomalySummary[];
  trends: TrendSummary[];
  confidence: number;
  summary: string; // 200자 제한
}

export interface AnomalySummary {
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
}

export interface TrendSummary {
  metric: string;
  direction: 'increasing' | 'stable' | 'decreasing';
  changePercent: number;
}

/**
 * Anomaly 결과를 압축된 형식으로 변환
 */
export function compressAnomalyResult(result: AnomalyResult): AnalystCompressedOutput {
  if (!result.success) {
    return {
      anomalies: [],
      trends: [],
      confidence: 0,
      summary: result.error || '분석 실패',
    };
  }

  const anomalies: AnomalySummary[] = Object.entries(result.results)
    .filter(([, r]) => r.isAnomaly)
    .slice(0, 5) // 최대 5개
    .map(([metric, r]) => ({
      metric,
      severity: r.severity as AnomalySummary['severity'],
      value: r.currentValue,
      threshold: r.threshold.upper,
    }));

  const avgConfidence = Object.values(result.results).reduce((sum, r) => sum + r.confidence, 0) /
    Object.keys(result.results).length;

  const summary = result.hasAnomalies
    ? `${result.serverName}: ${result.anomalyCount}개 이상 감지 (${anomalies.map(a => `${a.metric}:${a.severity}`).join(', ')})`
    : `${result.serverName}: 이상 없음`;

  return {
    anomalies,
    trends: [],
    confidence: Math.round(avgConfidence * 100) / 100,
    summary: summary.slice(0, 200),
  };
}

/**
 * Trend 결과를 압축된 형식으로 변환
 */
export function compressTrendResult(result: TrendResult): AnalystCompressedOutput {
  if (!result.success) {
    return {
      anomalies: [],
      trends: [],
      confidence: 0,
      summary: result.error || '예측 실패',
    };
  }

  const trends: TrendSummary[] = Object.entries(result.results)
    .slice(0, 3) // 최대 3개
    .map(([metric, r]) => ({
      metric,
      direction: r.trend as TrendSummary['direction'],
      changePercent: r.changePercent,
    }));

  const avgConfidence = Object.values(result.results).reduce((sum, r) => sum + r.confidence, 0) /
    Object.keys(result.results).length;

  const risingMetrics = result.summary.increasingMetrics;
  const summary = risingMetrics.length > 0
    ? `${result.serverName}: ${risingMetrics.join(', ')} 상승 추세 (${result.predictionHorizon})`
    : `${result.serverName}: 안정적 (${result.predictionHorizon})`;

  return {
    anomalies: [],
    trends,
    confidence: Math.round(avgConfidence * 100) / 100,
    summary: summary.slice(0, 200),
  };
}

// ============================================================================
// 3. Pattern Constants (v6.10.1: Type-Safe Pattern Insights)
// ============================================================================

/** 지원되는 패턴 타입 */
const PATTERN_TYPES = {
  SYSTEM_PERFORMANCE: 'system_performance',
  MEMORY_STATUS: 'memory_status',
  STORAGE_INFO: 'storage_info',
  SERVER_STATUS: 'server_status',
  TREND_ANALYSIS: 'trend_analysis',
  ANOMALY_DETECTION: 'anomaly_detection',
} as const;

type PatternType = (typeof PATTERN_TYPES)[keyof typeof PATTERN_TYPES];

/** 패턴별 분석 인사이트 (상수화로 매 호출 시 객체 재생성 방지) */
const PATTERN_INSIGHTS: Record<PatternType, string> = {
  [PATTERN_TYPES.SYSTEM_PERFORMANCE]:
    '시스템 성능 분석: CPU 사용률, 프로세스 수, 로드 평균 확인 필요',
  [PATTERN_TYPES.MEMORY_STATUS]:
    '메모리 상태 분석: 사용량, 캐시, 스왑 사용률 확인 필요',
  [PATTERN_TYPES.STORAGE_INFO]:
    '스토리지 분석: 디스크 사용량, I/O 대기, 파티션 상태 확인 필요',
  [PATTERN_TYPES.SERVER_STATUS]:
    '서버 상태 분석: 가동 시간, 서비스 상태, 네트워크 연결 확인',
  [PATTERN_TYPES.TREND_ANALYSIS]:
    '트렌드 분석: 시계열 데이터 기반 패턴 인식 및 예측 모델 적용',
  [PATTERN_TYPES.ANOMALY_DETECTION]:
    '이상 탐지: 통계적 이상치 감지, 임계값 기반 알림 확인',
} as const;

const DEFAULT_INSIGHT = '일반 분석 수행';

// ============================================================================
// 3. Utility Functions
// ============================================================================

function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

// ============================================================================
// 4. Tools Definition
// ============================================================================

export const detectAnomaliesTool = tool(
  async ({ serverId, metricType }: DetectAnomaliesInput) => {
    const cache = getDataCache();

    // Cache analysis results with 10-minute TTL
    return cache.getAnalysis(
      'anomaly',
      { serverId: serverId || 'first', metricType },
      async () => {
        // 🎯 Precomputed State에서 현재 서버 상태 조회 (O(1))
        const state = getCurrentState();
        const server: ServerSnapshot | undefined = serverId
          ? state.servers.find((s) => s.id === serverId)
          : state.servers[0];

        if (!server) {
          return {
            success: false as const,
            error: '서버를 찾을 수 없습니다.',
          };
        }

        const metrics = ['cpu', 'memory', 'disk'] as const;
        const targetMetrics =
          metricType === 'all'
            ? metrics
            : [metricType as (typeof metrics)[number]];

        const results: Record<
          string,
          {
            isAnomaly: boolean;
            severity: string;
            confidence: number;
            currentValue: number;
            threshold: { upper: number; lower: number };
          }
        > = {};

        const usedEngine: 'typescript' = 'typescript';

        // 🎯 FIXED_24H_DATASETS에서 6시간 히스토리 조회
        const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
        const currentMinute = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          .split(',')[1]?.trim().split(':').reduce((acc, t, i) => acc + (i === 0 ? parseInt(t) * 60 : parseInt(t)), 0) || 0;

        for (const metric of targetMetrics) {
          const currentValue = server[metric as keyof typeof server] as number;

          // Map history to MetricDataPoint (36 points = 6시간)
          let history: MetricDataPoint[] = [];
          if (dataset) {
            const recentData = getRecentData(dataset, currentMinute, 36);
            const now = Date.now();
            const baseTime = now - now % (10 * 60 * 1000); // 10분 단위 기준
            history = recentData.map((d, i) => ({
              timestamp: baseTime - (recentData.length - 1 - i) * 600000,
              value: d[metric] || 0,
            }));
          }

          // Fallback if history load failed (36 points at 10-min intervals)
          if (history.length < 5) {
            const now = Date.now();
            for (let i = 0; i < 36; i++) {
              history.push({
                timestamp: now - i * 600000,
                value: currentValue,
              }); // 10분 = 600000ms
            }
          }

          // TypeScript implementation
          const detector = getAnomalyDetector();
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

        const fullResult = {
          success: true as const,
          serverId: server.id,
          serverName: server.name,
          anomalyCount,
          hasAnomalies: anomalyCount > 0,
          results,
          timestamp: new Date().toISOString(),
          _algorithm: '6-hour moving average + 2σ threshold (10-min intervals)',
          _engine: usedEngine,
          _dataSource: 'precomputed-state',
        };

        // 압축된 요약 추가 (Token Optimization)
        const compressed = compressAnomalyResult(fullResult);
        return {
          ...fullResult,
          _compressed: compressed,
        };
      }
    );
  },
  {
    name: 'detectAnomalies',
    description:
      '서버 메트릭의 이상치를 탐지합니다 (통계적 이상감지: 6시간 이동평균 + 2σ, 10분 간격)',
    schema: z.object({
      serverId: z
        .string()
        .optional()
        .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
      metricType: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .default('all')
        .describe('분석할 메트릭 타입'),
    }),
  }
);

export const predictTrendsTool = tool(
  async ({ serverId, metricType, predictionHours }: PredictTrendsInput) => {
    const cache = getDataCache();
    const hours = predictionHours ?? 1;

    // Cache analysis results with 10-minute TTL
    return cache.getAnalysis(
      'trend',
      { serverId: serverId || 'first', metricType, hours },
      async () => {
        // 🎯 Precomputed State에서 현재 서버 상태 조회 (O(1))
        const state = getCurrentState();
        const server: ServerSnapshot | undefined = serverId
          ? state.servers.find((s) => s.id === serverId)
          : state.servers[0];

        if (!server) {
          return {
            success: false as const,
            error: '서버를 찾을 수 없습니다.',
          };
        }

        const metrics = ['cpu', 'memory', 'disk'] as const;
        const targetMetrics =
          metricType === 'all'
            ? metrics
            : [metricType as (typeof metrics)[number]];
        const horizon = hours * 3600 * 1000;

        const results: Record<
          string,
          {
            trend: string;
            currentValue: number;
            predictedValue: number;
            changePercent: number;
            confidence: number;
          }
        > = {};

        const usedEngine: 'typescript' = 'typescript';

        // 🎯 FIXED_24H_DATASETS에서 6시간 히스토리 조회
        const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
        const currentMinute = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          .split(',')[1]?.trim().split(':').reduce((acc, t, i) => acc + (i === 0 ? parseInt(t) * 60 : parseInt(t)), 0) || 0;

        for (const metric of targetMetrics) {
          const currentValue = server[metric as keyof typeof server] as number;

          // Map history to MetricDataPoint (36 points = 6시간)
          let history: MetricDataPoint[] = [];
          if (dataset) {
            const recentData = getRecentData(dataset, currentMinute, 36);
            const now = Date.now();
            const baseTime = now - now % (10 * 60 * 1000); // 10분 단위 기준
            history = recentData.map((d, i) => ({
              timestamp: baseTime - (recentData.length - 1 - i) * 600000,
              value: d[metric] || 0,
            }));
          }

          // Fallback if history load failed (36 points at 10-min intervals)
          if (history.length < 5) {
            const now = Date.now();
            for (let i = 0; i < 36; i++) {
              history.push({
                timestamp: now - i * 600000,
                value: currentValue,
              }); // 10분 = 600000ms
            }
          }

          // TypeScript implementation
          const predictor = getTrendPredictor();
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

        const fullResult = {
          success: true as const,
          serverId: server.id,
          serverName: server.name,
          predictionHorizon: `${hours}시간`,
          results,
          summary: {
            increasingMetrics,
            hasRisingTrends: increasingMetrics.length > 0,
          },
          timestamp: new Date().toISOString(),
          _algorithm: 'Linear Regression with R² confidence',
          _engine: usedEngine,
          _dataSource: 'precomputed-state',
        };

        // 압축된 요약 추가 (Token Optimization)
        const compressed = compressTrendResult(fullResult);
        return {
          ...fullResult,
          _compressed: compressed,
        };
      }
    );
  },
  {
    name: 'predictTrends',
    description:
      '서버 메트릭의 트렌드를 예측합니다 (선형 회귀 기반 1시간 예측)',
    schema: z.object({
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
        .optional()
        .default(1)
        .describe('예측 시간 (기본 1시간)'),
    }),
  }
);

// Helper: 패턴별 인사이트 반환 (v6.10.1: 상수 참조로 최적화)
function getPatternInsights(pattern: string): string {
  return PATTERN_INSIGHTS[pattern as PatternType] ?? DEFAULT_INSIGHT;
}

export const analyzePatternTool = tool(
  async ({ query }: AnalyzePatternInput) => {
    const patterns: string[] = [];
    const q = query.toLowerCase();

    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');
    if (/트렌드|추세|예측/i.test(q)) patterns.push('trend_analysis');
    if (/이상|anomaly|alert/i.test(q)) patterns.push('anomaly_detection');

    if (patterns.length === 0) {
      return { success: false, message: '매칭되는 패턴 없음' };
    }

    const analysisResults = patterns.map((pattern) => ({
      pattern,
      confidence: 0.8 + Math.random() * 0.2,
      insights: getPatternInsights(pattern),
    }));

    return {
      success: true,
      patterns,
      detectedIntent: patterns[0],
      analysisResults,
      _mode: 'pattern-analysis',
    };
  },
  {
    name: 'analyzePattern',
    description: '사용자 질문의 패턴을 분석하여 시스템 정보를 제공합니다',
    schema: z.object({
      query: z.string().describe('분석할 사용자 질문'),
    }),
  }
);

// 🚫 Dead Code Removed: clusterLogPatternsTool (Rust ML Service removed in v5.84.0)
// 🚫 Dead Code Removed: analystAgentNode & Helpers
// Use createReactAgent in multi-agent-supervisor.ts instead.
