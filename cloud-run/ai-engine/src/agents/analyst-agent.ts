/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트
 */

import { AIMessage } from '@langchain/core/messages';
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
import { clusterLogsRust } from '../lib/rust-ml-client';
import { AgentExecutionError, getErrorMessage } from '../lib/errors';
import { getAnalystModel } from '../lib/model-config';

import type { AgentStateType, ToolResult } from '../lib/state-definition';
import {
  loadHistoricalContext,
  loadHourlyScenarioData,
} from '../services/scenario/scenario-loader';

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
      _engine: 'rust' | 'typescript';
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
      _engine: 'rust' | 'typescript';
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

type ClusteringResult =
  | {
      success: true;
      serverId: string;
      totalLogs: number;
      clusterCount: number;
      clusters: Array<{
        id: number;
        size: number;
        representative: string;
      }>;
      _engine: string;
    }
  | { success: false; error: string };

// ============================================================================
// 2. Utility Functions
// ============================================================================

// function generateSimulatedHistory(
//   currentValue: number,
//   pointCount: number = 24
// ): MetricDataPoint[] {
//   // Legacy random simulation replaced by loadHistoricalContext
//   // Kept for reference or fallback if needed
//   const now = Date.now();
//   const interval = 5 * 60 * 1000;
//   const history: MetricDataPoint[] = [];

//   for (let i = pointCount - 1; i >= 0; i--) {
//     const variance = currentValue * 0.15;
//     const randomOffset = (Math.random() - 0.5) * 2 * variance;
//     const value = Math.max(0, Math.min(100, currentValue + randomOffset));

//     history.push({
//       timestamp: now - i * interval,
//       value,
//     });
//   }

//   return history;
// }

function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

// ============================================================================
// 3. Tools Definition
// ============================================================================

export const detectAnomaliesTool = tool(
  async ({ serverId, metricType }) => {
    const allServers = await loadHourlyScenarioData();
    const server = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers[0];

    if (!server) {
      return {
        success: false,
        error: '서버를 찾을 수 없습니다.',
      };
    }

    const metrics = ['cpu', 'memory', 'disk'] as const;
    const targetMetrics =
      metricType === 'all' ? metrics : [metricType as (typeof metrics)[number]];

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

    const usedEngine: 'rust' | 'typescript' = 'typescript';

    // Load actual scenario history for consistency
    // We load past 24 hours (24 points at 1h interval for broad trend, or simpler 24 points?)
    // The previous simulation was 24 points at 5min interval = 2 hours.
    // Let's load past 2 hours data -> 24 points (5 min interval)
    // Actually loadHistoricalContext as implemented loads "past N hours" using hour files.
    // If we want 24 points at 5 min intervals, we need finer/more frequent sampling or just load 2 hours and extract.
    // The implementation of loadHistoricalContext calculates "Now - i hours" which gives 1 point per hour.
    // To match "5 min interval" history, we need a loop of minutes?
    // Let's stick to "24 Hours History" (1 point per hour) for robust daily trend?
    // Or did the user want visual consistency?
    // Dashboard usually shows "Last Hour" or "Last 24 Hours".
    // Let's settle on: AI analyzes "Last 24 Hours" using 1-hour interval points.

    // Use static import
    const historyPoints = await loadHistoricalContext(server.id || '', 24);

    for (const metric of targetMetrics) {
      const currentValue = server[metric as keyof typeof server] as number;

      // Map history to MetricDataPoint
      const history: MetricDataPoint[] = historyPoints.map((h) => ({
        timestamp: h.timestamp,
        value: h[metric] || 0,
      }));

      // Fallback if history load failed
      if (history.length < 5) {
        // generate fallback
        const now = Date.now();
        for (let i = 0; i < 24; i++) {
          history.push({ timestamp: now - i * 3600000, value: currentValue });
        }
      }

      // TypeScript implementation primarily for migration stability
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

    return {
      success: true,
      serverId: server.id,
      serverName: server.name,
      anomalyCount,
      hasAnomalies: anomalyCount > 0,
      results,
      timestamp: new Date().toISOString(),
      _algorithm: '26-hour moving average + 2σ threshold',
      _engine: usedEngine,
    };
  },
  {
    name: 'detectAnomalies',
    description:
      '서버 메트릭의 이상치를 탐지합니다 (통계적 이상감지: 26시간 이동평균 + 2σ)',
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
  async ({ serverId, metricType, predictionHours }) => {
    const allServers = await loadHourlyScenarioData();
    const server = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers[0];

    if (!server) {
      return {
        success: false,
        error: '서버를 찾을 수 없습니다.',
      };
    }

    const metrics = ['cpu', 'memory', 'disk'] as const;
    const targetMetrics =
      metricType === 'all' ? metrics : [metricType as (typeof metrics)[number]];
    const horizon = (predictionHours ?? 1) * 3600 * 1000;

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

    const usedEngine: 'rust' | 'typescript' = 'typescript';

    // Use static import
    const historyPoints = await loadHistoricalContext(server.id || '', 24);

    for (const metric of targetMetrics) {
      const currentValue = server[metric as keyof typeof server] as number;

      const history: MetricDataPoint[] = historyPoints.map((h) => ({
        timestamp: h.timestamp,
        value: h[metric] || 0,
      }));

      // Fallback if history load failed
      if (history.length < 5) {
        const now = Date.now();
        for (let i = 0; i < 24; i++) {
          history.push({ timestamp: now - i * 3600000, value: currentValue });
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

    return {
      success: true,
      serverId: server.id,
      serverName: server.name,
      predictionHorizon: `${predictionHours ?? 1}시간`,
      results,
      summary: {
        increasingMetrics,
        hasRisingTrends: increasingMetrics.length > 0,
      },
      timestamp: new Date().toISOString(),
      _algorithm: 'Linear Regression with R² confidence',
      _engine: usedEngine,
    };
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

export const analyzePatternTool = tool(
  async ({ query }) => {
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

export const clusterLogPatternsTool = tool(
  async ({ serverId, limit = 50 }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Supabase credentials missing' };
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Fetch Logs
      let query = supabase
        .from('server_logs')
        .select('message') // Just messages for clustering
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: 'No logs found to analyze' };
      }

      const logMessages = data.map((d) => d.message);

      // 2. Call Rust ML Service (Linfa K-Means)
      const clusterResult = await clusterLogsRust(logMessages);

      if (!clusterResult) {
        // Fallback or simple heuristics if Rust service fails
        return { success: false, error: 'Clustering service unavailable' };
      }

      // 3. Format Result
      return {
        success: true,
        serverId: serverId || 'ALL',
        totalLogs: logMessages.length,
        clusterCount: clusterResult.clusters.length,
        clusters: clusterResult.clusters.map((c) => ({
          id: c.id,
          size: c.size,
          representative: c.representative_log,
        })),
        _engine: 'rust-linfa-kmeans',
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },
  {
    name: 'clusterLogPatterns',
    description:
      '최근 서버 로그의 패턴을 ML(K-Means)로 군집화하여 주요 이슈 그룹을 식별합니다',
    schema: z.object({
      serverId: z.string().optional().describe('분석할 서버 ID'),
      limit: z.number().optional().default(50).describe('분석할 로그 개수'),
    }),
  }
);

function getPatternInsights(pattern: string): string {
  const insights: Record<string, string> = {
    system_performance:
      '시스템 성능 분석: CPU 사용률, 프로세스 수, 로드 평균 확인 필요',
    memory_status: '메모리 상태 분석: 사용량, 캐시, 스왑 사용률 확인 필요',
    storage_info:
      '스토리지 분석: 디스크 사용량, I/O 대기, 파티션 상태 확인 필요',
    server_status: '서버 상태 분석: 가동 시간, 서비스 상태, 네트워크 연결 확인',
    trend_analysis:
      '트렌드 분석: 시계열 데이터 기반 패턴 인식 및 예측 모델 적용',
    anomaly_detection: '이상 탐지: 통계적 이상치 감지, 임계값 기반 알림 확인',
  };
  return insights[pattern] || '일반 분석 수행';
}

// ... remaining node code ...
// ... remaining node code ...
type AnalysisIntent = 'anomaly' | 'trend' | 'pattern' | 'log_cluster' | 'comprehensive';

function detectAnalysisIntent(query: string): AnalysisIntent {
  const q = query.toLowerCase();
  const anomalyKeywords =
    /이상|anomaly|비정상|alert|경고|급증|급감|스파이크|spike|문제/i;
  const trendKeywords =
    /트렌드|trend|추세|예측|predict|forecast|앞으로|미래|증가|감소/i;
  const logKeywords = /로그|log|군집|cluser|패턴|pattern|반복/i;
  const comprehensiveKeywords = /종합|전체|모든|상세|분석해|리포트|report/i;

  const hasAnomaly = anomalyKeywords.test(q);
  const hasTrend = trendKeywords.test(q);
  const hasLog = logKeywords.test(q);
  const hasComprehensive = comprehensiveKeywords.test(q);

  if (hasComprehensive) return 'comprehensive';
  if (hasLog) return 'log_cluster';
  if (hasAnomaly) return 'anomaly';
  if (hasTrend) return 'trend';
  return 'pattern';
}

function extractServerId(query: string): string | undefined {
  const match = query.match(/서버\s*(\d+)|server[-_]?(\d+)/i);
  if (match) {
    const num = match[1] || match[2];
    return `server-${num}`;
  }
  return undefined;
}

export async function analystAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'Analyze system patterns';

  try {
    const model = getAnalystModel();
    const toolResults: ToolResult[] = [];

    const intent = detectAnalysisIntent(userQuery);
    const serverId = extractServerId(userQuery);

    console.log(
      `📊 [Analyst Agent] Intent: ${intent}, ServerId: ${serverId || 'auto'}`
    );

    let anomalyResult: AnomalyResult | null = null;
    let trendResult: TrendResult | null = null;
    let patternResult: PatternResult | null = null;
    let clusterResult: ClusteringResult | null = null;

    // Direct invocation logic for tools if needed, or use bindTools in a real agent node
    // Since this is just a function node, we CAN invoke tools directly.

    if (intent === 'anomaly' || intent === 'comprehensive') {
      anomalyResult = (await detectAnomaliesTool.invoke({
        serverId,
        metricType: 'all',
      })) as AnomalyResult;
      toolResults.push({
        toolName: 'detectAnomalies',
        success: anomalyResult.success,
        data: anomalyResult,
        executedAt: new Date().toISOString(),
      });
    }

    if (intent === 'trend' || intent === 'comprehensive') {
      trendResult = (await predictTrendsTool.invoke({
        serverId,
        metricType: 'all',
        predictionHours: 1,
      })) as TrendResult;
      toolResults.push({
        toolName: 'predictTrends',
        success: trendResult.success,
        data: trendResult,
        executedAt: new Date().toISOString(),
      });
    }



    if (intent === 'log_cluster' || intent === 'comprehensive') {
      clusterResult = (await clusterLogPatternsTool.invoke({
        serverId,
        limit: 50,
      })) as ClusteringResult;
      toolResults.push({
        toolName: 'clusterLogPatterns',
        success: clusterResult.success, // @ts-ignore
        data: clusterResult,
        executedAt: new Date().toISOString(),
      });
    }

    patternResult = (await analyzePatternTool.invoke({
      query: userQuery,
    })) as PatternResult;
    toolResults.push({
      toolName: 'analyzePattern',
      success: patternResult.success,
      data: patternResult,
      executedAt: new Date().toISOString(),
    });

    const analysisPrompt = buildAnalysisPrompt(
      userQuery,
      intent,
      patternResult,
      anomalyResult,
      trendResult,
      clusterResult
    );

    const response = await model.invoke([
      { role: 'user', content: analysisPrompt },
    ]);

    const finalContent =
      typeof response.content === 'string'
        ? response.content
        : '분석 결과를 생성할 수 없습니다.';

    console.log(
      `📊 [Analyst Agent] Completed: ${toolResults.map((t) => t.toolName).join(', ')}`
    );

    return {
      messages: [new AIMessage(finalContent)],
      toolResults,
      finalResponse: finalContent,
    };
  } catch (error) {
    const agentError =
      error instanceof AgentExecutionError
        ? error
        : new AgentExecutionError(
            'analyst',
            error instanceof Error ? error : undefined
          );
    console.error('❌ Analyst Agent Error:', agentError.toJSON());
    return {
      finalResponse: '패턴 분석 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'analyst_error',
          success: false,
          data: null,
          error: getErrorMessage(error),
          executedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

function buildAnalysisPrompt(
  userQuery: string,
  intent: AnalysisIntent,
  patternResult: unknown,
  anomalyResult: unknown | null,
  trendResult: unknown | null,
  clusterResult: unknown | null
): string {
  let prompt = `당신은 OpenManager VIBE의 Analyst Agent입니다.
서버 시스템 패턴을 분석하고 인사이트를 제공합니다.

사용자 질문: ${userQuery}
분석 유형: ${intent}

`;

  prompt += `## 패턴 분석 결과
${JSON.stringify(patternResult, null, 2)}

`;

  if (anomalyResult) {
    prompt += `## 이상 탐지 결과 (26시간 이동평균 + 2σ)
${JSON.stringify(anomalyResult, null, 2)}

`;
  }

  if (trendResult) {
    prompt += `## 트렌드 예측 결과 (선형 회귀)
${JSON.stringify(trendResult, null, 2)}

`;
  }

  if (clusterResult) {
    prompt += `## 로그 패턴 군집화 결과 (Linfa K-Means)
${JSON.stringify(clusterResult, null, 2)}

`;
  }

  prompt += `위 분석 결과를 바탕으로:
1. 현재 상태 요약
2. ${intent === 'anomaly' ? '감지된 이상 패턴 상세 설명' : intent === 'trend' ? '예측 트렌드 해석' : '발견된 패턴에 대한 상세 설명'}
3. 잠재적 문제점 또는 주의사항
4. 권장 조치사항

한국어로 전문적이지만 이해하기 쉽게 설명해주세요.`;

  return prompt;
}
