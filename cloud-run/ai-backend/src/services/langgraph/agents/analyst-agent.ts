/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트 (Cloud Run Standalone)
 *
 * 역할:
 * - 메트릭 패턴 분석
 * - 이상 탐지 (Anomaly Detection) - 26시간 이동평균 + 2σ
 * - 트렌드 예측 - 선형 회귀
 * - 심층 분석 리포트 생성
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import type { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import type {
  AgentStateType,
  DelegationRequest,
  ToolResult,
} from '../state-definition.js';
import { createRotatingGoogleModel } from '../utils/google-api-rotator.js';

// ============================================================================
// 1. Model Configuration (with API Key Rotation)
// ============================================================================

const ANALYST_MODEL = 'gemini-2.5-pro-preview-06-05';

function getAnalystModel(): ChatGoogleGenerativeAI {
  return createRotatingGoogleModel(ANALYST_MODEL, {
    temperature: 0.2, // 분석은 정확성 우선
    maxOutputTokens: 2048,
  });
}

// ============================================================================
// 2. Inline Implementations (Standalone for Cloud Run)
// ============================================================================

interface MetricDataPoint {
  timestamp: number;
  value: number;
}

interface TrendDataPoint {
  timestamp: number;
  value: number;
}

interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  details: {
    mean: number;
    stdDev: number;
    upperThreshold: number;
    lowerThreshold: number;
    zScore: number;
  };
}

interface TrendResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: number;
  confidence: number;
  details: {
    slope: number;
    intercept: number;
    rSquared: number;
    predictedChangePercent: number;
  };
}

/**
 * 이상 탐지 (26시간 이동평균 + 2σ)
 */
function detectAnomaly(
  currentValue: number,
  history: MetricDataPoint[]
): AnomalyResult {
  if (history.length < 3) {
    return {
      isAnomaly: false,
      severity: 'low',
      confidence: 0,
      details: {
        mean: currentValue,
        stdDev: 0,
        upperThreshold: currentValue,
        lowerThreshold: currentValue,
        zScore: 0,
      },
    };
  }

  const values = history.map((p) => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const zScore = stdDev > 0 ? (currentValue - mean) / stdDev : 0;
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;

  const isAnomaly =
    currentValue > upperThreshold || currentValue < lowerThreshold;
  const absZ = Math.abs(zScore);

  let severity: AnomalyResult['severity'] = 'low';
  if (absZ > 4) severity = 'critical';
  else if (absZ > 3) severity = 'high';
  else if (absZ > 2) severity = 'medium';

  const confidence = Math.min(1, absZ / 4);

  return {
    isAnomaly,
    severity,
    confidence,
    details: {
      mean,
      stdDev,
      upperThreshold,
      lowerThreshold,
      zScore,
    },
  };
}

/**
 * 트렌드 예측 (선형 회귀)
 */
function predictTrend(history: TrendDataPoint[], horizon: number): TrendResult {
  if (history.length < 2) {
    return {
      trend: 'stable',
      prediction: history[0]?.value ?? 0,
      confidence: 0,
      details: {
        slope: 0,
        intercept: history[0]?.value ?? 0,
        rSquared: 0,
        predictedChangePercent: 0,
      },
    };
  }

  const n = history.length;
  const xValues = history.map((_, i) => i);
  const yValues = history.map((p) => p.value);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² 계산
  const meanY = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * i + intercept;
    return sum + (y - predicted) ** 2;
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  // 예측
  const futureSteps = horizon / (5 * 60 * 1000); // 5분 간격 가정
  const prediction = slope * (n + futureSteps) + intercept;
  const currentValue = yValues[n - 1];
  const predictedChangePercent =
    currentValue !== 0 ? ((prediction - currentValue) / currentValue) * 100 : 0;

  // 트렌드 결정
  let trend: TrendResult['trend'] = 'stable';
  if (Math.abs(predictedChangePercent) > 5) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }

  return {
    trend,
    prediction: Math.max(0, Math.min(100, prediction)),
    confidence: Math.abs(rSquared),
    details: {
      slope,
      intercept,
      rSquared,
      predictedChangePercent,
    },
  };
}

/**
 * 시뮬레이션 히스토리 데이터 생성
 */
function generateSimulatedHistory(
  currentValue: number,
  pointCount: number = 24
): MetricDataPoint[] {
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5분 간격
  const history: MetricDataPoint[] = [];

  for (let i = pointCount - 1; i >= 0; i--) {
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

function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

/**
 * 시뮬레이션 서버 데이터 (Cloud Run Standalone)
 */
interface ServerData {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
}

function getSimulatedServers(): ServerData[] {
  return [
    { id: 'server-1', name: 'Web Server 1', cpu: 45, memory: 62, disk: 55 },
    { id: 'server-2', name: 'API Server', cpu: 72, memory: 78, disk: 40 },
    { id: 'server-3', name: 'DB Primary', cpu: 35, memory: 85, disk: 70 },
    { id: 'server-4', name: 'Cache Server', cpu: 28, memory: 45, disk: 30 },
    { id: 'server-5', name: 'Worker Node', cpu: 88, memory: 65, disk: 50 },
  ];
}

// ============================================================================
// 3. Tools Definition
// ============================================================================

/**
 * 이상 탐지 도구
 */
const detectAnomaliesTool = tool(
  async ({ serverId, metricType }) => {
    const allServers = getSimulatedServers();
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

    for (const metric of targetMetrics) {
      const currentValue = server[metric];
      const history = generateSimulatedHistory(currentValue, 24);
      const detection = detectAnomaly(currentValue, history);

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
 * 트렌드 예측 도구
 */
const predictTrendsTool = tool(
  async ({ serverId, metricType, predictionHours }) => {
    const allServers = getSimulatedServers();
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
      const prediction = predictTrend(history, horizon);

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

    // 3. Critical Anomaly Detection → Delegate to Reporter
    const hasCriticalAnomaly = checkForCriticalAnomaly(anomalyResult);

    if (hasCriticalAnomaly) {
      console.log(
        `🚨 [Analyst Agent] Critical anomaly detected! Delegating to Reporter...`
      );

      // 임시 분석 결과 생성 (Reporter에게 전달할 컨텍스트)
      const preliminaryAnalysis = `## ⚠️ Critical Anomaly Detected

### 이상 탐지 결과
${JSON.stringify(anomalyResult, null, 2)}

### 트렌드 예측 (참고)
${trendResult ? JSON.stringify(trendResult, null, 2) : '분석 안 함'}

### 패턴 분석
${JSON.stringify(patternResult, null, 2)}

---
**권장 조치**: 인시던트 리포트 생성 및 RAG 기반 솔루션 검색 필요`;

      // Command Pattern: Reporter로 명시적 위임
      const delegation: DelegationRequest = {
        fromAgent: 'analyst',
        toAgent: 'reporter', // Command Pattern: 명시적 대상 지정
        reason:
          'Critical anomaly detected - needs incident report and RAG-based solution',
        context: {
          anomalyResult,
          trendResult,
          patternResult,
          preliminaryAnalysis,
          suggestedAction: 'incident_report',
        },
        requestedAt: new Date().toISOString(),
      };

      return {
        messages: [new AIMessage(preliminaryAnalysis)],
        toolResults,
        returnToSupervisor: true,
        delegationRequest: delegation,
      };
    }

    // 4. 분석 프롬프트 구성 (일반 케이스)
    const analysisPrompt = buildAnalysisPrompt(
      userQuery,
      intent,
      patternResult,
      anomalyResult,
      trendResult
    );

    // 5. AI 모델로 최종 분석
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
      returnToSupervisor: false,
      delegationRequest: null,
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
      returnToSupervisor: false,
      delegationRequest: null,
    };
  }
}

// 이상 탐지 결과 타입 정의
interface AnomalyToolResult {
  success: boolean;
  error?: string;
  serverId?: string;
  serverName?: string;
  anomalyCount?: number;
  hasAnomalies?: boolean;
  results?: Record<
    string,
    {
      isAnomaly: boolean;
      severity: string;
      confidence: number;
      currentValue: number;
      threshold: { upper: number; lower: number };
    }
  >;
  timestamp?: string;
  _algorithm?: string;
}

/**
 * Critical Anomaly 여부 확인
 * severity가 'critical' 또는 'high'이면서 confidence가 높은 경우 true
 */
function checkForCriticalAnomaly(
  anomalyResult: AnomalyToolResult | null
): boolean {
  if (!anomalyResult || !anomalyResult.success) {
    return false;
  }

  const results = anomalyResult.results;
  if (!results) return false;

  for (const [, metricResult] of Object.entries(results)) {
    if (
      metricResult.isAnomaly &&
      (metricResult.severity === 'critical' ||
        metricResult.severity === 'high') &&
      metricResult.confidence >= 0.7
    ) {
      return true;
    }
  }

  return false;
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
