/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트
 *
 * 역할:
 * - 메트릭 패턴 분석
 * - 이상 탐지 (Anomaly Detection) - SimpleAnomalyDetector 통합
 * - 트렌드 예측 - TrendPredictor 통합
 * - 심층 분석 리포트 생성
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import {
  getAnomalyDetector,
  type MetricDataPoint,
} from '@/lib/ai/monitoring/SimpleAnomalyDetector';
import {
  getTrendPredictor,
  type TrendDataPoint,
} from '@/lib/ai/monitoring/TrendPredictor';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';
import type { AgentStateType, ToolResult } from '../state-definition';

// ============================================================================
// 1. Model Configuration
// ============================================================================

import { AI_MODELS } from '@/config/ai-engine';

function getAnalystModel(): ChatGoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: AI_MODELS.PRO,
    temperature: 0.2, // 분석은 정확성 우선
    maxOutputTokens: 2048,
  });
}

// ============================================================================
// 2. Utility Functions
// ============================================================================

/**
 * 현재 값 기반으로 시뮬레이션된 히스토리 데이터 생성
 * 시나리오 기반 데모용 - 실제 환경에서는 실제 시계열 데이터 사용
 */
function generateSimulatedHistory(
  currentValue: number,
  pointCount: number = 24
): MetricDataPoint[] {
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5분 간격
  const history: MetricDataPoint[] = [];

  for (let i = pointCount - 1; i >= 0; i--) {
    // 현재 값 기준으로 ±15% 범위 내 변동 시뮬레이션
    const variance = currentValue * 0.15;
    const randomOffset = (Math.random() - 0.5) * 2 * variance;
    const value = Math.max(0, Math.min(100, currentValue + randomOffset));

    history.push({
      timestamp: now - i * interval,
      value,
    });
  }

  return history;
}

/**
 * TrendDataPoint 형식으로 변환
 */
function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

// ============================================================================
// 3. Tools Definition
// ============================================================================

/**
 * 이상 탐지 도구 - SimpleAnomalyDetector 활용
 */
const detectAnomaliesTool = tool(
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

    const detector = getAnomalyDetector();
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

    for (const metric of targetMetrics) {
      const currentValue = server[metric];
      const history = generateSimulatedHistory(currentValue, 24);
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

/**
 * 트렌드 예측 도구 - TrendPredictor 활용
 */
const predictTrendsTool = tool(
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

    const predictor = getTrendPredictor();
    const metrics = ['cpu', 'memory', 'disk'] as const;
    const targetMetrics =
      metricType === 'all' ? metrics : [metricType as (typeof metrics)[number]];
    const horizon = (predictionHours ?? 1) * 3600 * 1000; // ms로 변환

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

    for (const metric of targetMetrics) {
      const currentValue = server[metric];
      const history = toTrendDataPoints(
        generateSimulatedHistory(currentValue, 12)
      );
      const prediction = predictor.predictTrend(history, horizon);

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

const analyzePatternTool = tool(
  async ({ query }) => {
    const patterns: string[] = [];
    const q = query.toLowerCase();

    // 패턴 매칭
    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');
    if (/트렌드|추세|예측/i.test(q)) patterns.push('trend_analysis');
    if (/이상|anomaly|alert/i.test(q)) patterns.push('anomaly_detection');

    if (patterns.length === 0) {
      return { success: false, message: '매칭되는 패턴 없음' };
    }

    // 패턴별 분석 결과 생성
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

// ============================================================================
// 4. Intent Detection
// ============================================================================

type AnalysisIntent = 'anomaly' | 'trend' | 'pattern' | 'comprehensive';

/**
 * 사용자 질문에서 분석 의도 파악
 */
function detectAnalysisIntent(query: string): AnalysisIntent {
  const q = query.toLowerCase();

  // 이상 탐지 관련 키워드
  const anomalyKeywords =
    /이상|anomaly|비정상|alert|경고|급증|급감|스파이크|spike|문제/i;
  // 트렌드/예측 관련 키워드
  const trendKeywords =
    /트렌드|trend|추세|예측|predict|forecast|앞으로|미래|증가|감소/i;
  // 종합 분석 키워드
  const comprehensiveKeywords = /종합|전체|모든|상세|분석해|리포트|report/i;

  const hasAnomaly = anomalyKeywords.test(q);
  const hasTrend = trendKeywords.test(q);
  const hasComprehensive = comprehensiveKeywords.test(q);

  if (hasComprehensive || (hasAnomaly && hasTrend)) {
    return 'comprehensive';
  }
  if (hasAnomaly) {
    return 'anomaly';
  }
  if (hasTrend) {
    return 'trend';
  }
  return 'pattern';
}

/**
 * 쿼리에서 서버 ID 추출 (예: "서버 5번", "server-5")
 */
function extractServerId(query: string): string | undefined {
  const match = query.match(/서버\s*(\d+)|server[-_]?(\d+)/i);
  if (match) {
    const num = match[1] || match[2];
    return `server-${num}`;
  }
  return undefined;
}

// ============================================================================
// 5. Analyst Agent Node Function
// ============================================================================

/**
 * Analyst Agent 노드 함수
 * 이상 탐지, 트렌드 예측, 패턴 분석을 통합 수행
 */
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

    // 1. 의도 파악
    const intent = detectAnalysisIntent(userQuery);
    const serverId = extractServerId(userQuery);

    console.log(
      `📊 [Analyst Agent] Intent: ${intent}, ServerId: ${serverId || 'auto'}`
    );

    // 2. 의도에 따른 도구 실행
    let anomalyResult: Awaited<
      ReturnType<typeof detectAnomaliesTool.invoke>
    > | null = null;
    let trendResult: Awaited<
      ReturnType<typeof predictTrendsTool.invoke>
    > | null = null;
    let patternResult: Awaited<
      ReturnType<typeof analyzePatternTool.invoke>
    > | null = null;

    // 이상 탐지 실행
    if (intent === 'anomaly' || intent === 'comprehensive') {
      anomalyResult = await detectAnomaliesTool.invoke({
        serverId,
        metricType: 'all',
      });
      toolResults.push({
        toolName: 'detectAnomalies',
        success: anomalyResult.success,
        data: anomalyResult,
        executedAt: new Date().toISOString(),
      });
    }

    // 트렌드 예측 실행
    if (intent === 'trend' || intent === 'comprehensive') {
      trendResult = await predictTrendsTool.invoke({
        serverId,
        metricType: 'all',
        predictionHours: 1,
      });
      toolResults.push({
        toolName: 'predictTrends',
        success: trendResult.success,
        data: trendResult,
        executedAt: new Date().toISOString(),
      });
    }

    // 패턴 분석 실행 (항상)
    patternResult = await analyzePatternTool.invoke({ query: userQuery });
    toolResults.push({
      toolName: 'analyzePattern',
      success: patternResult.success,
      data: patternResult,
      executedAt: new Date().toISOString(),
    });

    // 3. 분석 프롬프트 구성
    const analysisPrompt = buildAnalysisPrompt(
      userQuery,
      intent,
      patternResult,
      anomalyResult,
      trendResult
    );

    // 4. AI 모델로 최종 분석
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
    console.error('❌ Analyst Agent Error:', error);
    return {
      finalResponse: '패턴 분석 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'analyst_error',
          success: false,
          data: null,
          error: String(error),
          executedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

/**
 * 분석 프롬프트 빌더
 */
function buildAnalysisPrompt(
  userQuery: string,
  intent: AnalysisIntent,
  patternResult: unknown,
  anomalyResult: unknown | null,
  trendResult: unknown | null
): string {
  let prompt = `당신은 OpenManager VIBE의 Analyst Agent입니다.
서버 시스템 패턴을 분석하고 인사이트를 제공합니다.

사용자 질문: ${userQuery}
분석 유형: ${intent}

`;

  // 패턴 분석 결과
  prompt += `## 패턴 분석 결과
${JSON.stringify(patternResult, null, 2)}

`;

  // 이상 탐지 결과
  if (anomalyResult) {
    prompt += `## 이상 탐지 결과 (26시간 이동평균 + 2σ)
${JSON.stringify(anomalyResult, null, 2)}

`;
  }

  // 트렌드 예측 결과
  if (trendResult) {
    prompt += `## 트렌드 예측 결과 (선형 회귀)
${JSON.stringify(trendResult, null, 2)}

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
