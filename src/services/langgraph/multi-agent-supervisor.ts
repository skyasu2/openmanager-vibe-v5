/**
 * Multi-Agent Supervisor using @langchain/langgraph-supervisor
 *
 * Features:
 * - createSupervisor: Automatic routing between worker agents
 * - createReactAgent: Tool-equipped worker agents
 * - A2A Communication: Automatic handoffs between agents
 * - HITL: Human-in-the-Loop for critical actions
 *
 * @see https://langchain-ai.github.io/langgraphjs/reference/functions/langgraph_supervisor.createSupervisor.html
 */

import { HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import { z } from 'zod';
import {
  getAnomalyDetector,
  type MetricDataPoint,
} from '@/lib/ai/monitoring/SimpleAnomalyDetector';
import {
  getTrendPredictor,
  type TrendDataPoint,
} from '@/lib/ai/monitoring/TrendPredictor';
import { createClient } from '@/lib/supabase/server';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';
import { createSessionConfig, getAutoCheckpointer } from './checkpointer';
import {
  getAnalystModel,
  getNLQModel,
  getReporterModel,
  getSupervisorModel,
} from './model-config';

// ============================================================================
// 1. Tool Definitions (Re-exported from agents for reuse)
// ============================================================================

// --- NLQ Agent Tools ---
const getServerMetricsTool = tool(
  async ({ serverId, metric: _metric }) => {
    const allServers = await loadHourlyScenarioData();
    const target = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers;

    const servers = Array.isArray(target)
      ? target
      : target
        ? [target]
        : allServers;

    return {
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
      })),
      summary: {
        total: servers.length,
        alertCount: servers.filter(
          (s) => s.status === 'warning' || s.status === 'critical'
        ).length,
      },
      timestamp: new Date().toISOString(),
      _dataSource: 'scenario-loader',
    };
  },
  {
    name: 'getServerMetrics',
    description:
      '서버 CPU/메모리/디스크 상태를 조회합니다 (시나리오 기반 시뮬레이션)',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .describe('조회할 메트릭 타입'),
    }),
  }
);

// --- Analyst Agent Tools ---
function generateSimulatedHistory(
  currentValue: number,
  pointCount: number = 24
): MetricDataPoint[] {
  const now = Date.now();
  const interval = 5 * 60 * 1000;
  const history: MetricDataPoint[] = [];

  for (let i = pointCount - 1; i >= 0; i--) {
    const variance = currentValue * 0.15;
    const randomOffset = (Math.random() - 0.5) * 2 * variance;
    const value = Math.max(0, Math.min(100, currentValue + randomOffset));
    history.push({ timestamp: now - i * interval, value });
  }

  return history;
}

function toTrendDataPoints(metricPoints: MetricDataPoint[]): TrendDataPoint[] {
  return metricPoints.map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

const detectAnomaliesTool = tool(
  async ({ serverId, metricType }) => {
    const allServers = await loadHourlyScenarioData();
    const server = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers[0];

    if (!server) {
      return { success: false, error: '서버를 찾을 수 없습니다.' };
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

const predictTrendsTool = tool(
  async ({ serverId, metricType, predictionHours }) => {
    const allServers = await loadHourlyScenarioData();
    const server = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers[0];

    if (!server) {
      return { success: false, error: '서버를 찾을 수 없습니다.' };
    }

    const predictor = getTrendPredictor();
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

    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');
    if (/트렌드|추세|예측/i.test(q)) patterns.push('trend_analysis');
    if (/이상|anomaly|alert/i.test(q)) patterns.push('anomaly_detection');

    if (patterns.length === 0) {
      return { success: false, message: '매칭되는 패턴 없음' };
    }

    const insights: Record<string, string> = {
      system_performance:
        '시스템 성능 분석: CPU 사용률, 프로세스 수, 로드 평균 확인 필요',
      memory_status: '메모리 상태 분석: 사용량, 캐시, 스왑 사용률 확인 필요',
      storage_info:
        '스토리지 분석: 디스크 사용량, I/O 대기, 파티션 상태 확인 필요',
      server_status:
        '서버 상태 분석: 가동 시간, 서비스 상태, 네트워크 연결 확인',
      trend_analysis:
        '트렌드 분석: 시계열 데이터 기반 패턴 인식 및 예측 모델 적용',
      anomaly_detection: '이상 탐지: 통계적 이상치 감지, 임계값 기반 알림 확인',
    };

    const analysisResults = patterns.map((pattern) => ({
      pattern,
      confidence: 0.8 + Math.random() * 0.2,
      insights: insights[pattern] || '일반 분석 수행',
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

// --- Reporter Agent Tools ---
const searchKnowledgeBaseTool = tool(
  async ({ query }) => {
    try {
      const supabase = await createClient();
      const ragEngine = new SupabaseRAGEngine(supabase);

      const searchResult = await ragEngine.searchHybrid(query, {
        maxResults: 5,
        enableKeywordFallback: true,
      });

      if (!searchResult.success || searchResult.results.length === 0) {
        return {
          success: false,
          message: '관련된 문서를 찾을 수 없습니다.',
          _source: 'Supabase pgvector',
        };
      }

      return {
        success: true,
        results: searchResult.results.map((r) => ({
          content: r.content,
          similarity: r.similarity,
        })),
        totalFound: searchResult.results.length,
        _source: 'Supabase pgvector',
      };
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return {
        success: false,
        error: '지식베이스 검색 오류',
        _source: 'Supabase pgvector',
      };
    }
  },
  {
    name: 'searchKnowledgeBase',
    description: '과거 장애 이력 및 해결 방법을 검색합니다 (RAG)',
    schema: z.object({
      query: z.string().describe('검색 쿼리'),
    }),
  }
);

const recommendCommandsTool = tool(
  async ({ keywords }) => {
    const recommendations = [
      {
        keywords: ['서버', '목록', '조회'],
        command: 'list servers',
        description: '서버 목록 조회',
      },
      {
        keywords: ['상태', '체크', '확인'],
        command: 'status check',
        description: '시스템 상태 점검',
      },
      {
        keywords: ['로그', '분석', '에러'],
        command: 'analyze logs',
        description: '로그 분석',
      },
      {
        keywords: ['재시작', 'restart', '복구'],
        command: 'service restart <service_name>',
        description: '서비스 재시작',
      },
      {
        keywords: ['메모리', '정리', 'cache'],
        command: 'clear cache',
        description: '캐시 정리',
      },
    ];

    const matched = recommendations.filter((rec) =>
      keywords.some((k) =>
        rec.keywords.some((rk) => rk.includes(k) || k.includes(rk))
      )
    );

    return {
      success: true,
      recommendations:
        matched.length > 0 ? matched : recommendations.slice(0, 3),
      _mode: 'command-recommendation',
    };
  },
  {
    name: 'recommendCommands',
    description: '사용자 질문에 적합한 CLI 명령어를 추천합니다',
    schema: z.object({
      keywords: z.array(z.string()).describe('질문에서 추출한 핵심 키워드'),
    }),
  }
);

// ============================================================================
// 2. Worker Agent Creation
// ============================================================================

/**
 * Create NLQ Agent - Server metrics queries
 */
function createNLQAgent() {
  return createReactAgent({
    llm: getNLQModel(),
    tools: [getServerMetricsTool],
    name: 'nlq_agent',
    prompt: `당신은 OpenManager VIBE의 NLQ Agent입니다.
사용자의 자연어 질문을 서버 메트릭 조회로 변환합니다.

가능한 작업:
- 서버 상태 조회 (CPU, Memory, Disk)
- 특정 서버 메트릭 조회
- 전체 서버 요약

도구를 사용해서 데이터를 조회한 후, 결과를 한국어로 친절하게 설명해주세요.`,
  });
}

/**
 * Create Analyst Agent - Pattern analysis & anomaly detection
 */
function createAnalystAgent() {
  return createReactAgent({
    llm: getAnalystModel(),
    tools: [detectAnomaliesTool, predictTrendsTool, analyzePatternTool],
    name: 'analyst_agent',
    prompt: `당신은 OpenManager VIBE의 Analyst Agent입니다.
서버 시스템 패턴을 분석하고 인사이트를 제공합니다.

가능한 작업:
- 이상 탐지 (detectAnomalies): 통계적 이상치 감지
- 트렌드 예측 (predictTrends): 선형 회귀 기반 예측
- 패턴 분석 (analyzePattern): 질문 의도 파악

분석 결과를 바탕으로:
1. 현재 상태 요약
2. 발견된 패턴/이상에 대한 상세 설명
3. 잠재적 문제점 또는 주의사항
4. 권장 조치사항

한국어로 전문적이지만 이해하기 쉽게 설명해주세요.`,
  });
}

/**
 * Create Reporter Agent - Incident reports & RAG
 */
function createReporterAgent() {
  return createReactAgent({
    llm: getReporterModel(),
    tools: [searchKnowledgeBaseTool, recommendCommandsTool],
    name: 'reporter_agent',
    prompt: `당신은 OpenManager VIBE의 Reporter Agent입니다.
장애 분석 및 인시던트 리포트를 생성합니다.

가능한 작업:
- 지식베이스 검색 (searchKnowledgeBase): RAG 기반 과거 장애 이력 검색
- 명령어 추천 (recommendCommands): CLI 명령어 추천

인시던트 리포트 형식:
### 📋 인시던트 요약
[문제 상황 요약]

### 🔍 원인 분석
[가능한 원인들]

### 💡 권장 조치
[단계별 해결 방안]

### ⌨️ 추천 명령어
[실행 가능한 명령어들]

한국어로 작성하고, 전문적이면서도 이해하기 쉽게 설명해주세요.`,
  });
}

// ============================================================================
// 3. Supervisor Creation
// ============================================================================

const SUPERVISOR_PROMPT = `당신은 OpenManager VIBE의 Multi-Agent Supervisor입니다.
사용자 요청을 분석하고 적절한 에이전트에게 작업을 위임합니다.

## 에이전트 목록
1. **nlq_agent**: 서버 상태/메트릭 조회 (CPU, Memory, Disk)
   - 예: "서버 상태", "CPU 사용률", "메모리 확인"

2. **analyst_agent**: 패턴 분석, 이상 탐지, 트렌드 예측
   - 예: "이상 감지", "트렌드 분석", "패턴 확인", "종합 분석"

3. **reporter_agent**: 인시던트 리포트, 장애 분석, RAG 검색
   - 예: "장애 분석", "원인 파악", "해결 방법", "과거 이력"

## 라우팅 규칙
- 단순 조회 → nlq_agent
- 분석/예측 → analyst_agent
- 장애/리포트 → reporter_agent
- 인사말/일반 대화 → 직접 응답

적절한 에이전트를 선택하여 작업을 위임하세요.`;

/**
 * Create Multi-Agent Supervisor Workflow
 */
export async function createMultiAgentSupervisor() {
  const checkpointer = await getAutoCheckpointer();

  // Create worker agents
  const nlqAgent = createNLQAgent();
  const analystAgent = createAnalystAgent();
  const reporterAgent = createReporterAgent();

  // Create supervisor with automatic handoffs
  const workflow = createSupervisor({
    agents: [nlqAgent, analystAgent, reporterAgent],
    llm: getSupervisorModel(),
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
  });

  // Compile with checkpointer for session persistence
  return workflow.compile({
    checkpointer,
  });
}

// ============================================================================
// 4. Execution Functions
// ============================================================================

export interface SupervisorExecutionOptions {
  sessionId?: string;
}

/**
 * Execute supervisor workflow (single response)
 */
export async function executeSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): Promise<{
  response: string;
  sessionId: string;
}> {
  const app = await createMultiAgentSupervisor();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const result = await app.invoke(
    {
      messages: [new HumanMessage(query)],
    },
    config
  );

  // Extract final response from messages
  const messages = result.messages || [];
  const lastMessage = messages[messages.length - 1];
  const response =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : '응답을 생성할 수 없습니다.';

  console.log(`✅ [Supervisor] Completed. Session: ${sessionId}`);

  return { response, sessionId };
}

/**
 * Stream supervisor workflow
 */
export async function* streamSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): AsyncGenerator<{
  type: 'token' | 'agent_start' | 'agent_end' | 'final';
  content: string;
  metadata?: Record<string, unknown>;
}> {
  const app = await createMultiAgentSupervisor();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const stream = await app.streamEvents(
    {
      messages: [new HumanMessage(query)],
    },
    {
      version: 'v2',
      ...config,
    }
  );

  let finalContent = '';

  for await (const event of stream) {
    // LLM token streaming
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (chunk?.content && typeof chunk.content === 'string') {
        finalContent += chunk.content;
        yield {
          type: 'token',
          content: chunk.content,
          metadata: { node: event.name },
        };
      }
    }

    // Agent start
    if (event.event === 'on_chain_start' && event.tags?.includes('agent')) {
      yield {
        type: 'agent_start',
        content: event.name || 'unknown_agent',
        metadata: { tags: event.tags },
      };
    }

    // Agent end
    if (event.event === 'on_chain_end' && event.tags?.includes('agent')) {
      yield {
        type: 'agent_end',
        content: event.name || 'unknown_agent',
        metadata: { output: event.data?.output },
      };
    }
  }

  // Final response
  yield {
    type: 'final',
    content: finalContent,
    metadata: { sessionId },
  };
}

/**
 * Create AI SDK compatible streaming response using toUIMessageStream
 * This integrates LangGraph with Vercel AI SDK v5
 */
export async function createSupervisorStreamResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const generator = streamSupervisor(query, { sessionId });

        for await (const chunk of generator) {
          if (chunk.type === 'token') {
            // AI SDK v5 Data Stream Protocol: text part
            const dataStreamText = `0:${JSON.stringify(chunk.content)}\n`;
            controller.enqueue(encoder.encode(dataStreamText));
          } else if (chunk.type === 'final') {
            // AI SDK v5 Data Stream Protocol: finish message
            const finishMessage = `d:${JSON.stringify({ finishReason: 'stop' })}\n`;
            controller.enqueue(encoder.encode(finishMessage));
            console.log('📤 Supervisor stream completed (AI SDK v5 Protocol)');
          }
        }

        controller.close();
      } catch (error) {
        console.error('❌ Supervisor streaming error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
        controller.enqueue(encoder.encode(errorStream));
        controller.close();
      }
    },
  });
}

// ============================================================================
// 5. Export Tools for External Use
// ============================================================================

export {
  getServerMetricsTool,
  detectAnomaliesTool,
  predictTrendsTool,
  analyzePatternTool,
  searchKnowledgeBaseTool,
  recommendCommandsTool,
};
