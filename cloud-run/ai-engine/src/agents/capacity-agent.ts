/**
 * Capacity Agent
 * 용량 계획 및 리소스 예측 전문 에이전트
 *
 * @description
 * - 리소스 소진 시점 예측
 * - 스케일링 권장사항 생성
 * - 성장 트렌드 분석
 * - 베이스라인 비교
 *
 * @version 1.0.0
 * @date 2025-12-27
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
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
// Historical 데이터 (용량 예측용)
import {
  FIXED_24H_DATASETS,
  getRecentData,
} from '../data/fixed-24h-metrics';

// ============================================================================
// 1. Tool Result Types
// ============================================================================

export interface ExhaustionPrediction {
  metric: string;
  currentValue: number;
  growthRate: number; // %/hour
  daysUntilThreshold: number | null; // null = stable or decreasing
  predictedDate: string | null;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

type ExhaustionResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      predictions: ExhaustionPrediction[];
      urgentMetrics: string[];
      summary: string;
      timestamp: string;
    }
  | { success: false; error: string };

export interface ScalingRecommendation {
  type: 'scale_up' | 'scale_out' | 'optimize' | 'none';
  resource: string;
  currentSpec: string;
  recommendedSpec: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: string;
}

type ScalingResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      recommendations: ScalingRecommendation[];
      summary: string;
      timestamp: string;
    }
  | { success: false; error: string };

export interface GrowthTrend {
  metric: string;
  dailyGrowthRate: number;
  weeklyGrowthRate: number;
  isAbnormal: boolean;
  pattern: 'linear' | 'exponential' | 'seasonal' | 'stable';
}

type GrowthResult =
  | {
      success: true;
      serverId: string;
      serverName: string;
      trends: GrowthTrend[];
      alerts: string[];
      summary: string;
      timestamp: string;
    }
  | { success: false; error: string };

export interface BaselineComparison {
  serverId: string;
  serverType: string;
  metric: string;
  current: number;
  baseline: number;
  deviation: number; // %
  status: 'normal' | 'elevated' | 'high' | 'critical';
}

type BaselineResult =
  | {
      success: true;
      comparisons: BaselineComparison[];
      overutilized: string[];
      underutilized: string[];
      summary: string;
      timestamp: string;
    }
  | { success: false; error: string };

// Tool Input Types
interface PredictExhaustionInput {
  serverId?: string;
  metric: 'cpu' | 'memory' | 'disk' | 'all';
  threshold?: number;
}

interface ScalingInput {
  serverId: string;
  targetHeadroom?: number;
}

interface GrowthTrendInput {
  serverId?: string;
  metric: 'cpu' | 'memory' | 'disk' | 'all';
  periodDays?: number;
}

interface CompareBaselineInput {
  serverId?: string;
}

// ============================================================================
// 2. Structured Output Types (Token Optimization)
// ============================================================================

/**
 * 압축된 Capacity 출력 형식
 * Token 최적화를 위한 요약 구조
 */
export interface CapacityCompressedOutput {
  urgentMetrics: string[];
  predictions: Array<{
    metric: string;
    daysUntil: number | null;
    trend: string;
  }>;
  recommendations: Array<{
    type: string;
    resource: string;
    priority: string;
  }>;
  summary: string; // 200자 제한
}

/**
 * ExhaustionResult를 압축된 형식으로 변환
 */
export function compressExhaustionResult(result: ExhaustionResult): CapacityCompressedOutput {
  if (!result.success) {
    return {
      urgentMetrics: [],
      predictions: [],
      recommendations: [],
      summary: result.error || '예측 실패',
    };
  }

  return {
    urgentMetrics: result.urgentMetrics,
    predictions: result.predictions.slice(0, 3).map((p) => ({
      metric: p.metric,
      daysUntil: p.daysUntilThreshold,
      trend: p.trend,
    })),
    recommendations: [],
    summary: result.summary.slice(0, 200),
  };
}

// ============================================================================
// 3. Utility Functions
// ============================================================================

/** 서버 타입별 베이스라인 값 */
const SERVER_TYPE_BASELINES: Record<string, { cpu: number; memory: number; disk: number }> = {
  web: { cpu: 35, memory: 45, disk: 40 },
  database: { cpu: 40, memory: 65, disk: 55 },
  application: { cpu: 45, memory: 55, disk: 35 },
  cache: { cpu: 25, memory: 75, disk: 20 },
  storage: { cpu: 15, memory: 30, disk: 70 },
  loadbalancer: { cpu: 20, memory: 35, disk: 25 },
};

/** 서버 타입별 스펙 권장 값 */
const SERVER_SPEC_RECOMMENDATIONS: Record<string, { cpu: number[]; memory: number[]; disk: number[] }> = {
  web: { cpu: [2, 4, 8, 16], memory: [4, 8, 16, 32], disk: [50, 100, 200, 500] },
  database: { cpu: [4, 8, 16, 32], memory: [16, 32, 64, 128], disk: [200, 500, 1000, 2000] },
  application: { cpu: [2, 4, 8, 16], memory: [8, 16, 32, 64], disk: [100, 200, 500, 1000] },
  cache: { cpu: [2, 4, 8], memory: [16, 32, 64, 128], disk: [50, 100, 200] },
  storage: { cpu: [2, 4, 8], memory: [8, 16, 32], disk: [500, 1000, 2000, 5000] },
  loadbalancer: { cpu: [2, 4, 8], memory: [4, 8, 16], disk: [50, 100, 200] },
};

function toTrendDataPoints(
  metricPoints: Array<{ timestamp: number; [key: string]: number }>
): (metricName: string) => TrendDataPoint[] {
  return (metricName: string) =>
    metricPoints.map((p) => ({
      timestamp: p.timestamp,
      value: p[metricName] || 0,
    }));
}

/** Server type interface for getServerType function */
interface ServerTypeInfo {
  id: string;
  name: string;
  type?: string;
}

function getServerType(server: ServerTypeInfo): string {
  const typeMap: Record<string, string> = {
    'WEB': 'web',
    'DB': 'database',
    'API': 'application',
    'CACHE': 'cache',
    'STORAGE': 'storage',
    'LB': 'loadbalancer',
  };

  for (const [prefix, type] of Object.entries(typeMap)) {
    if (server.id.toUpperCase().startsWith(prefix) || server.name.toUpperCase().includes(prefix)) {
      return type;
    }
  }
  return server.type || 'application';
}

function calculateDaysUntilThreshold(
  currentValue: number,
  growthRatePerHour: number,
  threshold: number
): number | null {
  if (growthRatePerHour <= 0) return null; // 안정적이거나 감소 추세
  if (currentValue >= threshold) return 0; // 이미 초과

  const hoursUntil = (threshold - currentValue) / growthRatePerHour;
  return Math.round(hoursUntil / 24 * 10) / 10; // 일 단위, 소수점 1자리
}

function determinePriority(
  currentValue: number,
  daysUntilThreshold: number | null
): 'low' | 'medium' | 'high' | 'critical' {
  if (currentValue >= 90 || (daysUntilThreshold !== null && daysUntilThreshold <= 1)) {
    return 'critical';
  }
  if (currentValue >= 80 || (daysUntilThreshold !== null && daysUntilThreshold <= 3)) {
    return 'high';
  }
  if (currentValue >= 70 || (daysUntilThreshold !== null && daysUntilThreshold <= 7)) {
    return 'medium';
  }
  return 'low';
}

function getNextSpec(current: number, options: number[]): number {
  for (const spec of options) {
    if (spec > current) return spec;
  }
  return options[options.length - 1] ?? current * 2;
}

// ============================================================================
// 4. Tools Definition
// ============================================================================

export const predictResourceExhaustionTool = tool(
  async ({ serverId, metric, threshold }: PredictExhaustionInput) => {
    const cache = getDataCache();
    const targetThreshold = threshold ?? 90;

    return cache.getAnalysis(
      'capacity-exhaustion',
      { serverId: serverId || 'first', metric, threshold: targetThreshold },
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
          metric === 'all' ? metrics : [metric as (typeof metrics)[number]];

        // 🎯 FIXED_24H_DATASETS에서 6시간 히스토리 조회
        const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
        const currentMinute = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          .split(',')[1]?.trim().split(':').reduce((acc, t, i) => acc + (i === 0 ? parseInt(t) * 60 : parseInt(t)), 0) || 0;

        const predictor = getTrendPredictor();
        const predictions: ExhaustionPrediction[] = [];
        const urgentMetrics: string[] = [];

        for (const metricName of targetMetrics) {
          const currentValue = server[metricName as keyof typeof server] as number;

          // 히스토리 데이터 변환 (36 points = 6시간)
          let history: TrendDataPoint[] = [];
          if (dataset) {
            const recentData = getRecentData(dataset, currentMinute, 36);
            const now = Date.now();
            const baseTime = now - now % (10 * 60 * 1000); // 10분 단위 기준
            history = recentData.map((d, i) => ({
              timestamp: baseTime - (recentData.length - 1 - i) * 600000,
              value: d[metricName] || currentValue,
            }));
          }

          // Fallback
          if (history.length < 5) {
            const now = Date.now();
            for (let i = 0; i < 36; i++) {
              history.push({
                timestamp: now - i * 600000,
                value: currentValue + (Math.random() - 0.5) * 5,
              });
            }
            history.sort((a, b) => a.timestamp - b.timestamp);
          }

          // 트렌드 예측 (1시간)
          const trendResult = predictor.predictTrend(history, 3600000);
          const growthRatePerHour = trendResult.details.predictedChangePercent;
          const daysUntilThreshold = calculateDaysUntilThreshold(
            currentValue,
            growthRatePerHour,
            targetThreshold
          );

          const prediction: ExhaustionPrediction = {
            metric: metricName,
            currentValue,
            growthRate: Math.round(growthRatePerHour * 100) / 100,
            daysUntilThreshold,
            predictedDate:
              daysUntilThreshold !== null
                ? new Date(Date.now() + daysUntilThreshold * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : null,
            confidence: Math.round(trendResult.confidence * 100) / 100,
            trend: trendResult.trend,
          };

          predictions.push(prediction);

          // 긴급 메트릭 판별
          if (
            daysUntilThreshold !== null &&
            daysUntilThreshold <= 7 &&
            trendResult.trend === 'increasing'
          ) {
            urgentMetrics.push(metricName);
          }
        }

        // 요약 생성
        const summaryParts: string[] = [];
        for (const p of predictions) {
          if (p.daysUntilThreshold !== null && p.trend === 'increasing') {
            summaryParts.push(`${p.metric}: ${p.daysUntilThreshold}일 후 ${targetThreshold}% 도달`);
          } else {
            summaryParts.push(`${p.metric}: 안정 (${p.currentValue.toFixed(1)}%)`);
          }
        }

        return {
          success: true as const,
          serverId: server.id,
          serverName: server.name,
          predictions,
          urgentMetrics,
          summary: summaryParts.join(', '),
          timestamp: new Date().toISOString(),
          _dataSource: 'precomputed-state',
        };
      }
    );
  },
  {
    name: 'predictResourceExhaustion',
    description:
      '서버 리소스의 소진 시점을 예측합니다. 현재 증가 추세를 기반으로 임계값 도달 예정일을 계산합니다.',
    schema: z.object({
      serverId: z
        .string()
        .optional()
        .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .default('all')
        .describe('예측할 메트릭 타입'),
      threshold: z
        .number()
        .optional()
        .default(90)
        .describe('임계값 (기본 90%)'),
    }),
  }
);

export const getScalingRecommendationTool = tool(
  async ({ serverId, targetHeadroom }: ScalingInput) => {
    const cache = getDataCache();
    const headroom = targetHeadroom ?? 30;

    return cache.getAnalysis(
      'capacity-scaling',
      { serverId, headroom },
      async () => {
        // 🎯 Precomputed State에서 현재 서버 상태 조회 (O(1))
        const state = getCurrentState();
        const server = state.servers.find((s) => s.id === serverId);

        if (!server) {
          return {
            success: false as const,
            error: '서버를 찾을 수 없습니다.',
          };
        }

        const serverType = getServerType(server);
        // 🎯 서버 타입별 기본 스펙 사용 (ServerSnapshot에는 specs 없음)
        const specs = {
          cpu_cores: serverType === 'database' ? 8 : 4,
          memory_gb: serverType === 'database' ? 32 : 16,
          disk_gb: serverType === 'storage' ? 500 : 100,
        };
        const specOptions = SERVER_SPEC_RECOMMENDATIONS[serverType] || SERVER_SPEC_RECOMMENDATIONS.application;

        const recommendations: ScalingRecommendation[] = [];
        const targetUsage = 100 - headroom;

        // CPU 분석
        if (server.cpu > targetUsage) {
          const currentCores = specs.cpu_cores;
          const recommendedCores = getNextSpec(currentCores, specOptions.cpu);
          const priority = determinePriority(server.cpu, null);

          recommendations.push({
            type: 'scale_up',
            resource: 'cpu',
            currentSpec: `${currentCores} cores`,
            recommendedSpec: `${recommendedCores} cores`,
            reason: `CPU 사용률 ${server.cpu.toFixed(1)}%가 목표 ${targetUsage}%를 초과`,
            priority,
            estimatedCost: `+$${((recommendedCores - currentCores) * 20).toFixed(0)}/월`,
          });
        }

        // Memory 분석
        if (server.memory > targetUsage) {
          const currentMemory = specs.memory_gb;
          const recommendedMemory = getNextSpec(currentMemory, specOptions.memory);
          const priority = determinePriority(server.memory, null);

          recommendations.push({
            type: 'scale_up',
            resource: 'memory',
            currentSpec: `${currentMemory} GB`,
            recommendedSpec: `${recommendedMemory} GB`,
            reason: `메모리 사용률 ${server.memory.toFixed(1)}%가 목표 ${targetUsage}%를 초과`,
            priority,
            estimatedCost: `+$${((recommendedMemory - currentMemory) * 5).toFixed(0)}/월`,
          });
        }

        // Disk 분석
        if (server.disk > targetUsage) {
          const currentDisk = specs.disk_gb;
          const recommendedDisk = getNextSpec(currentDisk, specOptions.disk);
          const priority = determinePriority(server.disk, null);

          recommendations.push({
            type: 'scale_up',
            resource: 'disk',
            currentSpec: `${currentDisk} GB`,
            recommendedSpec: `${recommendedDisk} GB`,
            reason: `디스크 사용률 ${server.disk.toFixed(1)}%가 목표 ${targetUsage}%를 초과`,
            priority,
            estimatedCost: `+$${((recommendedDisk - currentDisk) * 0.1).toFixed(0)}/월`,
          });
        }

        // 스케일아웃 고려 (CPU + Memory 둘 다 높을 경우)
        if (server.cpu > 80 && server.memory > 80) {
          recommendations.push({
            type: 'scale_out',
            resource: 'instance',
            currentSpec: '1 instance',
            recommendedSpec: '2 instances',
            reason: 'CPU와 메모리 모두 80% 초과, 수평 확장 권장',
            priority: 'high',
            estimatedCost: '+현재 비용 x1 (인스턴스 추가)',
          });
        }

        // 최적화 권장 (리소스 과다 사용 시)
        if (recommendations.length === 0 && server.cpu < 20 && server.memory < 30) {
          recommendations.push({
            type: 'optimize',
            resource: 'instance',
            currentSpec: `${specs.cpu_cores} cores / ${specs.memory_gb} GB`,
            recommendedSpec: `${Math.max(2, specs.cpu_cores / 2)} cores / ${Math.max(4, specs.memory_gb / 2)} GB`,
            reason: '리소스 사용률이 낮아 다운사이징 고려 가능',
            priority: 'low',
            estimatedCost: '비용 절감 가능',
          });
        }

        // 권장사항 없음
        if (recommendations.length === 0) {
          recommendations.push({
            type: 'none',
            resource: 'all',
            currentSpec: 'current',
            recommendedSpec: 'current',
            reason: '현재 리소스 수준이 적정합니다',
            priority: 'low',
          });
        }

        const summary =
          recommendations[0]?.type === 'none'
            ? `${server.name}: 스케일링 불필요 (적정 사용률)`
            : `${server.name}: ${recommendations.filter((r) => r.type !== 'none').length}개 스케일링 권장`;

        return {
          success: true as const,
          serverId: server.id,
          serverName: server.name,
          recommendations,
          summary,
          timestamp: new Date().toISOString(),
        };
      }
    );
  },
  {
    name: 'getScalingRecommendation',
    description:
      '서버의 스케일링 권장사항을 생성합니다. 수직 확장(스케일업) 또는 수평 확장(스케일아웃)을 권장합니다.',
    schema: z.object({
      serverId: z.string().describe('분석할 서버 ID'),
      targetHeadroom: z
        .number()
        .optional()
        .default(30)
        .describe('목표 여유 공간 (기본 30%)'),
    }),
  }
);

export const analyzeGrowthTrendTool = tool(
  async ({ serverId, metric, periodDays }: GrowthTrendInput) => {
    const cache = getDataCache();
    const days = periodDays ?? 7;

    return cache.getAnalysis(
      'capacity-growth',
      { serverId: serverId || 'all', metric, days },
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
          metric === 'all' ? metrics : [metric as (typeof metrics)[number]];

        // 🎯 FIXED_24H_DATASETS에서 6시간 히스토리 조회
        const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === server.id);
        const currentMinute = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          .split(',')[1]?.trim().split(':').reduce((acc, t, i) => acc + (i === 0 ? parseInt(t) * 60 : parseInt(t)), 0) || 0;

        const predictor = getTrendPredictor();
        const trends: GrowthTrend[] = [];
        const alerts: string[] = [];

        for (const metricName of targetMetrics) {
          const currentValue = server[metricName as keyof typeof server] as number;

          // 히스토리 데이터 변환 (36 points = 6시간)
          let history: TrendDataPoint[] = [];
          if (dataset) {
            const recentData = getRecentData(dataset, currentMinute, 36);
            const now = Date.now();
            const baseTime = now - now % (10 * 60 * 1000); // 10분 단위 기준
            history = recentData.map((d, i) => ({
              timestamp: baseTime - (recentData.length - 1 - i) * 600000,
              value: d[metricName] || currentValue,
            }));
          }

          if (history.length < 5) {
            const now = Date.now();
            for (let i = 0; i < 36; i++) {
              history.push({
                timestamp: now - i * 600000,
                value: currentValue + (Math.random() - 0.5) * 5,
              });
            }
            history.sort((a, b) => a.timestamp - b.timestamp);
          }

          const trendResult = predictor.predictTrend(history, 3600000);
          const hourlyRate = trendResult.details.predictedChangePercent;
          const dailyRate = hourlyRate * 24;
          const weeklyRate = dailyRate * 7;

          // 패턴 분류
          let pattern: 'linear' | 'exponential' | 'seasonal' | 'stable' = 'stable';
          if (Math.abs(hourlyRate) < 0.5) {
            pattern = 'stable';
          } else if (trendResult.confidence > 0.8) {
            pattern = 'linear';
          } else if (trendResult.confidence > 0.5) {
            pattern = 'seasonal';
          } else {
            pattern = 'exponential'; // 불규칙한 급증
          }

          // 이상 성장 판별 (일일 10% 이상 증가)
          const isAbnormal = dailyRate > 10;

          trends.push({
            metric: metricName,
            dailyGrowthRate: Math.round(dailyRate * 100) / 100,
            weeklyGrowthRate: Math.round(weeklyRate * 100) / 100,
            isAbnormal,
            pattern,
          });

          if (isAbnormal) {
            alerts.push(`${metricName}: 비정상 증가율 (일 ${dailyRate.toFixed(1)}%)`);
          }
        }

        const summaryParts = trends.map(
          (t) => `${t.metric}: ${t.pattern} (일 ${t.dailyGrowthRate}%)`
        );

        return {
          success: true as const,
          serverId: server.id,
          serverName: server.name,
          trends,
          alerts,
          summary: summaryParts.join(', '),
          timestamp: new Date().toISOString(),
        };
      }
    );
  },
  {
    name: 'analyzeGrowthTrend',
    description:
      '서버 메트릭의 성장 트렌드를 분석합니다. 일간/주간 증가율과 패턴을 식별합니다.',
    schema: z.object({
      serverId: z
        .string()
        .optional()
        .describe('분석할 서버 ID (선택, 미입력시 첫 번째 서버)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .default('all')
        .describe('분석할 메트릭 타입'),
      periodDays: z
        .number()
        .optional()
        .default(7)
        .describe('분석 기간 (기본 7일)'),
    }),
  }
);

export const compareBaselineTool = tool(
  async ({ serverId }: CompareBaselineInput) => {
    const cache = getDataCache();

    return cache.getAnalysis(
      'capacity-baseline',
      { serverId: serverId || 'all' },
      async () => {
        // 🎯 Precomputed State에서 현재 서버 상태 조회 (O(1))
        const state = getCurrentState();

        const targetServers = serverId
          ? state.servers.filter((s) => s.id === serverId)
          : state.servers;

        if (targetServers.length === 0) {
          return {
            success: false as const,
            error: '서버를 찾을 수 없습니다.',
          };
        }

        const comparisons: BaselineComparison[] = [];
        const overutilized: string[] = [];
        const underutilized: string[] = [];

        for (const server of targetServers) {
          const serverType = getServerType(server);
          const baseline = SERVER_TYPE_BASELINES[serverType] || SERVER_TYPE_BASELINES.application;

          const metrics = ['cpu', 'memory', 'disk'] as const;

          for (const metricName of metrics) {
            const current = server[metricName as keyof typeof server] as number;
            const baselineValue = baseline[metricName];
            const deviation = ((current - baselineValue) / baselineValue) * 100;

            let status: 'normal' | 'elevated' | 'high' | 'critical' = 'normal';
            if (deviation > 100) status = 'critical';
            else if (deviation > 50) status = 'high';
            else if (deviation > 25) status = 'elevated';

            comparisons.push({
              serverId: server.id,
              serverType,
              metric: metricName,
              current,
              baseline: baselineValue,
              deviation: Math.round(deviation * 10) / 10,
              status,
            });

            if (status === 'critical' || status === 'high') {
              if (!overutilized.includes(server.id)) {
                overutilized.push(server.id);
              }
            }
          }

          // 언더 유틸라이제이션 체크
          const avgUsage = (server.cpu + server.memory) / 2;
          if (avgUsage < 20) {
            if (!underutilized.includes(server.id)) {
              underutilized.push(server.id);
            }
          }
        }

        const summary = `총 ${targetServers.length}대 분석: 과다사용 ${overutilized.length}대, 저사용 ${underutilized.length}대`;

        return {
          success: true as const,
          comparisons,
          overutilized,
          underutilized,
          summary,
          timestamp: new Date().toISOString(),
        };
      }
    );
  },
  {
    name: 'compareBaseline',
    description:
      '서버의 현재 리소스 사용량을 서버 타입별 베이스라인과 비교합니다. 과다/저사용 서버를 식별합니다.',
    schema: z.object({
      serverId: z
        .string()
        .optional()
        .describe('분석할 서버 ID (선택, 미입력시 전체 서버)'),
    }),
  }
);

// ============================================================================
// 5. Export Tools Array
// ============================================================================

export const capacityTools = [
  predictResourceExhaustionTool,
  getScalingRecommendationTool,
  analyzeGrowthTrendTool,
  compareBaselineTool,
];
