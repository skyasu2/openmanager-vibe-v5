/**
 * NLQ SubGraph Workflow
 * NLQ Agent를 독립 SubGraph로 구현
 *
 * ## Workflow
 * parse_intent → extract_params → validate → execute_query → format_response
 *                                    ↓
 *                               error? → retry (max 2)
 *
 * ## Architecture
 * - 독립 상태 관리 (NlqSubState)
 * - 자체 에러 핸들링 및 재시도
 * - Main Supervisor에서 노드로 호출됨
 */

import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getNLQModel } from '../../lib/model-config';
import {
  NlqSubState,
  type NlqSubStateType,
  type NlqIntent,
  type NlqExtractedParams,
  MAX_NLQ_RETRIES,
  NLQ_PARSE_NODE,
  NLQ_EXTRACT_NODE,
  NLQ_VALIDATE_NODE,
  NLQ_EXECUTE_NODE,
  NLQ_FORMAT_NODE,
  NLQ_RETRY_NODE,
  parseTimeExpression,
  parseAggregationExpression,
  parseMetricExpression,
  parseFilterExpression,
  createDefaultExtractedParams,
} from '../../lib/nlq-state';
import { getServerMetricsAdvancedTool } from '../../agents/nlq-agent';

// ============================================================================
// 1. Prompts
// ============================================================================

const INTENT_PARSER_PROMPT = `당신은 서버 모니터링 쿼리 분석기입니다.
사용자의 자연어 질문을 분석하여 의도(intent)를 파악하세요.

가능한 Intent 종류:
- metrics: 현재 서버 메트릭 조회 (예: "현재 CPU 상태", "서버 상태 보여줘")
- historical: 과거 데이터 조회 (예: "지난 6시간 CPU", "어제 메모리 사용량")
- comparison: 비교 쿼리 (예: "오전과 오후 CPU 비교", "서버 A와 B 비교")
- filter: 조건부 필터링 (예: "CPU 80% 이상인 서버", "critical 상태 서버")
- aggregation: 집계 쿼리 (예: "평균 CPU", "최대 메모리 사용량")
- logs: 로그 조회 (예: "최근 에러 로그", "서버 로그 보여줘")
- status: 상태 요약 (예: "전체 상태 요약", "알림 상태")

응답은 반드시 다음 JSON 형식으로만 출력하세요:
{"intent": "<intent_type>", "confidence": <0.0-1.0>}`;

const PARAM_EXTRACTOR_PROMPT = `당신은 서버 모니터링 쿼리 파라미터 추출기입니다.
사용자 질문에서 다음 파라미터를 추출하세요:

1. serverId: 특정 서버 ID (없으면 null)
2. metric: 조회할 메트릭 (cpu, memory, disk, network, all)
3. timeRange: 시간 범위 (current, last1h, last6h, last24h)
4. filters: 필터 조건 배열 [{field, operator, value}]
5. aggregation: 집계 함수 (avg, max, min, count, none)
6. sortBy: 정렬 기준 (cpu, memory, disk, network, name)
7. sortOrder: 정렬 순서 (asc, desc)
8. limit: 결과 제한 개수

응답은 반드시 다음 JSON 형식으로만 출력하세요:
{"serverId": null, "metric": "all", "timeRange": "current", "filters": [], "aggregation": "none", "sortBy": null, "sortOrder": "desc", "limit": null}`;

// ============================================================================
// 2. Node Functions
// ============================================================================

/**
 * Parse Intent Node
 * 사용자 쿼리에서 의도 파악
 */
async function parseIntentNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  try {
    const llm = getNLQModel();
    const result = await llm.invoke([
      new SystemMessage(INTENT_PARSER_PROMPT),
      new HumanMessage(state.originalQuery),
    ]);

    // Parse JSON response
    const content =
      typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const intent = parsed.intent as NlqIntent;

      return {
        parsedIntent: intent,
        executionStatus: 'parsing',
      };
    }

    // Fallback: 규칙 기반 파싱
    const query = state.originalQuery.toLowerCase();
    let intent: NlqIntent = 'metrics';

    if (
      query.includes('로그') ||
      query.includes('log') ||
      query.includes('에러')
    ) {
      intent = 'logs';
    } else if (
      query.includes('비교') ||
      query.includes('compare') ||
      query.includes('vs')
    ) {
      intent = 'comparison';
    } else if (
      query.includes('평균') ||
      query.includes('최대') ||
      query.includes('최소') ||
      query.includes('avg') ||
      query.includes('max') ||
      query.includes('min')
    ) {
      intent = 'aggregation';
    } else if (
      query.includes('이상') ||
      query.includes('이하') ||
      query.includes('초과') ||
      query.includes('미만') ||
      query.includes('>') ||
      query.includes('<')
    ) {
      intent = 'filter';
    } else if (
      query.includes('지난') ||
      query.includes('어제') ||
      query.includes('시간') ||
      query.includes('yesterday') ||
      query.includes('last')
    ) {
      intent = 'historical';
    } else if (
      query.includes('상태') ||
      query.includes('요약') ||
      query.includes('summary')
    ) {
      intent = 'status';
    }

    return {
      parsedIntent: intent,
      executionStatus: 'parsing',
    };
  } catch (error) {
    return {
      parsedIntent: 'unknown',
      lastError: `Intent parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      executionStatus: 'parsing',
    };
  }
}

/**
 * Extract Parameters Node
 * 쿼리에서 상세 파라미터 추출
 */
async function extractParamsNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  try {
    const query = state.originalQuery;
    const params = createDefaultExtractedParams();

    // 1. 메트릭 추출
    params.metric = parseMetricExpression(query);

    // 2. 시간 범위 추출
    params.timeRange = parseTimeExpression(query);

    // 3. 집계 함수 추출
    params.aggregation = parseAggregationExpression(query);

    // 4. 필터 조건 추출
    const filter = parseFilterExpression(query);
    if (filter) {
      params.filters = [filter];
    }

    // 5. 정렬/제한 추출
    const limitMatch = query.match(/(?:top|상위)\s*(\d+)/i);
    if (limitMatch) {
      params.limit = Number.parseInt(limitMatch[1], 10);
      params.sortOrder = 'desc';
    }

    const bottomMatch = query.match(/(?:bottom|하위)\s*(\d+)/i);
    if (bottomMatch) {
      params.limit = Number.parseInt(bottomMatch[1], 10);
      params.sortOrder = 'asc';
    }

    // Intent에 따른 추가 처리
    if (state.parsedIntent === 'historical' || state.parsedIntent === 'aggregation') {
      // 과거 데이터나 집계 쿼리는 최소 last1h
      if (params.timeRange === 'current') {
        params.timeRange = 'last1h';
      }
    }

    if (state.parsedIntent === 'aggregation' && params.aggregation === 'none') {
      // 집계 쿼리인데 집계 함수가 없으면 기본값 avg
      params.aggregation = 'avg';
    }

    return {
      extractedParams: params,
      executionStatus: 'executing',
    };
  } catch (error) {
    return {
      lastError: `Parameter extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      executionStatus: 'failed',
    };
  }
}

/**
 * Validate Parameters Node
 * 파라미터 유효성 검사
 */
async function validateNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  const params = state.extractedParams;

  if (!params) {
    return {
      lastError: 'No parameters extracted',
      executionStatus: 'failed',
    };
  }

  // 유효성 검사
  const validMetrics = ['cpu', 'memory', 'disk', 'network', 'all'];
  if (!validMetrics.includes(params.metric)) {
    return {
      lastError: `Invalid metric: ${params.metric}`,
      executionStatus: 'failed',
    };
  }

  const validTimeRanges = ['current', 'last1h', 'last6h', 'last24h', 'custom'];
  if (!validTimeRanges.includes(params.timeRange)) {
    return {
      lastError: `Invalid time range: ${params.timeRange}`,
      executionStatus: 'failed',
    };
  }

  // 필터 유효성 검사
  for (const filter of params.filters) {
    if (typeof filter.value === 'number' && (filter.value < 0 || filter.value > 100)) {
      // 퍼센트 값 범위 체크 (0-100)
      console.warn(`Filter value out of typical range: ${filter.value}`);
    }
  }

  return {
    executionStatus: 'executing',
  };
}

/**
 * Execute Query Node
 * 실제 쿼리 실행
 */
async function executeQueryNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  try {
    const params = state.extractedParams;
    if (!params) {
      return {
        lastError: 'No parameters to execute',
        executionStatus: 'failed',
      };
    }

    // TimeRange 변환 (custom은 지원하지 않음)
    const toolTimeRange =
      params.timeRange === 'custom' ? 'last24h' : params.timeRange;

    // Advanced Tool 호출
    const result = await getServerMetricsAdvancedTool.invoke({
      serverId: params.serverId,
      metric: params.metric,
      timeRange: toolTimeRange,
      filters: params.filters.length > 0 ? params.filters : undefined,
      aggregation: params.aggregation,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      limit: params.limit,
    });

    return {
      queryResults: result as typeof state.queryResults,
      executionStatus: 'formatting',
    };
  } catch (error) {
    return {
      lastError: `Query execution failed: ${error instanceof Error ? error.message : String(error)}`,
      executionStatus: 'failed',
    };
  }
}

/**
 * Format Response Node
 * 결과를 사용자 친화적 형식으로 변환
 */
async function formatResponseNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  const results = state.queryResults;

  if (!results || !results.success) {
    return {
      formattedResponse: `쿼리 실행 실패: ${results?.error || state.lastError || '알 수 없는 오류'}`,
      executionStatus: 'failed',
    };
  }

  const params = state.extractedParams;
  const servers = results.servers || [];

  // 응답 생성
  let response = '';

  // 쿼리 컨텍스트 설명
  if (params) {
    if (params.timeRange !== 'current') {
      response += `[${params.timeRange} 기준] `;
    }
    if (params.aggregation !== 'none') {
      response += `(${params.aggregation} 집계) `;
    }
  }

  if (servers.length === 0) {
    response += '조건에 맞는 서버가 없습니다.';
  } else if (servers.length === 1) {
    const server = servers[0];
    response += `${server.name} (${server.type}): `;
    const metricsStr = Object.entries(server.metrics)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(', ');
    response += metricsStr;
  } else {
    response += `총 ${servers.length}대 서버:\n`;
    for (const server of servers.slice(0, 10)) {
      // 최대 10개만 표시
      const metricsStr = Object.entries(server.metrics)
        .map(([k, v]) => `${k}: ${v}%`)
        .join(', ');
      response += `- ${server.name}: ${metricsStr}\n`;
    }
    if (servers.length > 10) {
      response += `... 외 ${servers.length - 10}대\n`;
    }
  }

  // 요약 추가
  if (results.summary) {
    response += `\n[요약: ${results.summary.matchedFromTotal}]`;
  }

  return {
    formattedResponse: response.trim(),
    executionStatus: 'completed',
  };
}

/**
 * Retry Node
 * 에러 발생 시 재시도
 */
async function retryNode(
  state: NlqSubStateType
): Promise<Partial<NlqSubStateType>> {
  return {
    retryCount: state.retryCount + 1,
    lastError: null,
    executionStatus: 'pending',
  };
}

// ============================================================================
// 3. Routing Functions
// ============================================================================

function shouldRetry(state: NlqSubStateType): 'retry' | 'end' {
  if (state.executionStatus === 'failed' && state.retryCount < MAX_NLQ_RETRIES) {
    console.log(
      `[NLQ SubGraph] Retrying (${state.retryCount + 1}/${MAX_NLQ_RETRIES}): ${state.lastError}`
    );
    return 'retry';
  }
  return 'end';
}

function afterValidate(state: NlqSubStateType): 'execute' | 'retry' | 'end' {
  if (state.executionStatus === 'failed') {
    return shouldRetry(state) === 'retry' ? 'retry' : 'end';
  }
  return 'execute';
}

function afterExecute(state: NlqSubStateType): 'format' | 'retry' | 'end' {
  if (state.executionStatus === 'failed') {
    return shouldRetry(state) === 'retry' ? 'retry' : 'end';
  }
  return 'format';
}

// ============================================================================
// 4. Build SubGraph
// ============================================================================

/**
 * Create NLQ SubGraph
 */
export function createNlqSubGraph() {
  const workflow = new StateGraph(NlqSubState)
    .addNode(NLQ_PARSE_NODE, parseIntentNode)
    .addNode(NLQ_EXTRACT_NODE, extractParamsNode)
    .addNode(NLQ_VALIDATE_NODE, validateNode)
    .addNode(NLQ_EXECUTE_NODE, executeQueryNode)
    .addNode(NLQ_FORMAT_NODE, formatResponseNode)
    .addNode(NLQ_RETRY_NODE, retryNode)
    // Edges
    .addEdge('__start__', NLQ_PARSE_NODE)
    .addEdge(NLQ_PARSE_NODE, NLQ_EXTRACT_NODE)
    .addEdge(NLQ_EXTRACT_NODE, NLQ_VALIDATE_NODE)
    .addConditionalEdges(NLQ_VALIDATE_NODE, afterValidate, {
      execute: NLQ_EXECUTE_NODE,
      retry: NLQ_RETRY_NODE,
      end: END,
    })
    .addConditionalEdges(NLQ_EXECUTE_NODE, afterExecute, {
      format: NLQ_FORMAT_NODE,
      retry: NLQ_RETRY_NODE,
      end: END,
    })
    .addEdge(NLQ_FORMAT_NODE, END)
    .addEdge(NLQ_RETRY_NODE, NLQ_PARSE_NODE);

  return workflow.compile();
}

// ============================================================================
// 5. Exports
// ============================================================================

export const nlqSubGraph = createNlqSubGraph();

/**
 * Execute NLQ SubGraph with a query
 * Main Supervisor에서 호출하는 엔트리 포인트
 */
export async function executeNlqSubGraph(query: string): Promise<{
  success: boolean;
  response: string;
  intent: NlqIntent;
  params: NlqExtractedParams | null;
  results: typeof NlqSubState.State.queryResults;
}> {
  const initialState = {
    originalQuery: query,
    parsedIntent: 'unknown' as NlqIntent,
    extractedParams: null,
    queryResults: null,
    retryCount: 0,
    lastError: null,
    formattedResponse: '',
    executionStatus: 'pending' as const,
  };

  const finalState = await nlqSubGraph.invoke(initialState);

  return {
    success: finalState.executionStatus === 'completed',
    response: finalState.formattedResponse || finalState.lastError || 'No response',
    intent: finalState.parsedIntent,
    params: finalState.extractedParams,
    results: finalState.queryResults,
  };
}
