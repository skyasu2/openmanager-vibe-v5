/**
 * NLQ SubGraph State Definition
 * NLQ Agent의 독립적인 상태 관리를 위한 SubGraph 상태 정의
 *
 * ## Architecture (Phase 2)
 * - parse_intent → extract_params → validate → execute_query → format_response
 * - 자체 retry 로직 및 error handling
 * - Main Supervisor와 분리된 독립 상태
 */

import { Annotation } from '@langchain/langgraph';

// ============================================================================
// 1. NLQ Intent Types
// ============================================================================

export type NlqIntent =
  | 'metrics' // 현재 메트릭 조회 (CPU, 메모리, 디스크)
  | 'historical' // 과거 데이터 조회 (시간 범위)
  | 'comparison' // 비교 쿼리 (시점 간, 서버 간)
  | 'filter' // 필터링 쿼리 (조건부)
  | 'aggregation' // 집계 쿼리 (평균, 최대, 최소)
  | 'logs' // 로그 조회
  | 'status' // 상태 조회
  | 'unknown'; // 파싱 실패

export type TimeRangeType = 'current' | 'last1h' | 'last6h' | 'last24h' | 'custom';
export type AggregationType = 'avg' | 'max' | 'min' | 'count' | 'none';
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'all';

// ============================================================================
// 2. Filter Condition Type
// ============================================================================

export interface FilterCondition {
  field: 'cpu' | 'memory' | 'disk' | 'network' | 'status';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string;
}

// ============================================================================
// 3. NLQ Parsed Parameters
// ============================================================================

export interface NlqExtractedParams {
  // 대상
  serverId?: string;
  serverType?: string; // 'web', 'database', 'cache' 등
  location?: string; // 'Seoul-ICN', 'Busan-PUS' 등

  // 메트릭
  metric: MetricType;

  // 시간 범위
  timeRange: TimeRangeType;
  startMinute?: number; // 0-1439
  endMinute?: number;

  // 필터
  filters: FilterCondition[];
  filterMode: 'AND' | 'OR';

  // 집계
  aggregation: AggregationType;

  // 정렬/제한
  sortBy?: 'cpu' | 'memory' | 'disk' | 'network' | 'name';
  sortOrder: 'asc' | 'desc';
  limit?: number;
}

// ============================================================================
// 4. NLQ Query Result
// ============================================================================

export interface NlqQueryResult {
  success: boolean;
  servers: Array<{
    id: string;
    name: string;
    type: string;
    location: string;
    metrics: Record<string, number>;
    dataPoints?: number;
    timeRange?: string;
  }>;
  summary?: {
    total: number;
    matchedFromTotal: string;
  };
  error?: string;
  timestamp: string;
}

// ============================================================================
// 5. NLQ SubGraph State
// ============================================================================

export const NlqSubState = Annotation.Root({
  // 입력
  originalQuery: Annotation<string>({
    reducer: (_: string, next: string) => next,
    default: () => '',
  }),

  // 파싱 결과
  parsedIntent: Annotation<NlqIntent>({
    reducer: (_: NlqIntent, next: NlqIntent) => next,
    default: () => 'unknown',
  }),

  extractedParams: Annotation<NlqExtractedParams | null>({
    reducer: (
      _: NlqExtractedParams | null,
      next: NlqExtractedParams | null
    ) => next,
    default: () => null,
  }),

  // 실행 결과
  queryResults: Annotation<NlqQueryResult | null>({
    reducer: (_: NlqQueryResult | null, next: NlqQueryResult | null) => next,
    default: () => null,
  }),

  // 재시도 카운터
  retryCount: Annotation<number>({
    reducer: (_: number, next: number) => next,
    default: () => 0,
  }),

  // 에러 메시지
  lastError: Annotation<string | null>({
    reducer: (_: string | null, next: string | null) => next,
    default: () => null,
  }),

  // 최종 출력
  formattedResponse: Annotation<string>({
    reducer: (_: string, next: string) => next,
    default: () => '',
  }),

  // 실행 상태
  executionStatus: Annotation<'pending' | 'parsing' | 'executing' | 'formatting' | 'completed' | 'failed'>({
    reducer: (
      _: 'pending' | 'parsing' | 'executing' | 'formatting' | 'completed' | 'failed',
      next: 'pending' | 'parsing' | 'executing' | 'formatting' | 'completed' | 'failed'
    ) => next,
    default: () => 'pending',
  }),
});

export type NlqSubStateType = typeof NlqSubState.State;

// ============================================================================
// 6. Constants
// ============================================================================

export const MAX_NLQ_RETRIES = 2;
export const NLQ_PARSE_NODE = 'parse_intent';
export const NLQ_EXTRACT_NODE = 'extract_params';
export const NLQ_VALIDATE_NODE = 'validate';
export const NLQ_EXECUTE_NODE = 'execute_query';
export const NLQ_FORMAT_NODE = 'format_response';
export const NLQ_RETRY_NODE = 'retry';

// ============================================================================
// 7. Helper Functions
// ============================================================================

/**
 * Create initial NLQ SubGraph state from a query string
 */
export function createNlqSubState(query: string): NlqSubStateType {
  return {
    originalQuery: query,
    parsedIntent: 'unknown',
    extractedParams: null,
    queryResults: null,
    retryCount: 0,
    lastError: null,
    formattedResponse: '',
    executionStatus: 'pending',
  };
}

/**
 * Create default extracted params
 */
export function createDefaultExtractedParams(): NlqExtractedParams {
  return {
    metric: 'all',
    timeRange: 'current',
    filters: [],
    filterMode: 'AND',
    aggregation: 'none',
    sortOrder: 'desc',
  };
}

/**
 * Parse time expression to TimeRangeType
 * 자연어 시간 표현을 TimeRangeType으로 변환
 */
export function parseTimeExpression(text: string): TimeRangeType {
  const lowered = text.toLowerCase();

  // 현재
  if (
    lowered.includes('현재') ||
    lowered.includes('지금') ||
    lowered.includes('now') ||
    lowered.includes('current')
  ) {
    return 'current';
  }

  // 1시간
  if (
    lowered.includes('1시간') ||
    lowered.includes('한 시간') ||
    lowered.includes('last hour') ||
    lowered.includes('last 1h')
  ) {
    return 'last1h';
  }

  // 6시간
  if (
    lowered.includes('6시간') ||
    lowered.includes('여섯 시간') ||
    lowered.includes('last 6h')
  ) {
    return 'last6h';
  }

  // 24시간 / 하루 / 어제
  if (
    lowered.includes('24시간') ||
    lowered.includes('하루') ||
    lowered.includes('어제') ||
    lowered.includes('yesterday') ||
    lowered.includes('last 24h') ||
    lowered.includes('last day')
  ) {
    return 'last24h';
  }

  return 'current';
}

/**
 * Parse aggregation expression
 */
export function parseAggregationExpression(text: string): AggregationType {
  const lowered = text.toLowerCase();

  if (lowered.includes('평균') || lowered.includes('avg') || lowered.includes('average')) {
    return 'avg';
  }
  if (lowered.includes('최대') || lowered.includes('max') || lowered.includes('highest')) {
    return 'max';
  }
  if (lowered.includes('최소') || lowered.includes('min') || lowered.includes('lowest')) {
    return 'min';
  }
  if (lowered.includes('개수') || lowered.includes('count') || lowered.includes('몇 개')) {
    return 'count';
  }

  return 'none';
}

/**
 * Parse metric expression
 */
export function parseMetricExpression(text: string): MetricType {
  const lowered = text.toLowerCase();

  if (lowered.includes('cpu') || lowered.includes('씨피유') || lowered.includes('프로세서')) {
    return 'cpu';
  }
  if (lowered.includes('memory') || lowered.includes('메모리') || lowered.includes('램') || lowered.includes('ram')) {
    return 'memory';
  }
  if (lowered.includes('disk') || lowered.includes('디스크') || lowered.includes('저장')) {
    return 'disk';
  }
  if (lowered.includes('network') || lowered.includes('네트워크') || lowered.includes('트래픽')) {
    return 'network';
  }

  return 'all';
}

/**
 * Parse filter expression from natural language
 * "CPU 80% 이상" → { field: 'cpu', operator: '>', value: 80 }
 */
export function parseFilterExpression(text: string): FilterCondition | null {
  // 패턴: "메트릭 숫자% 연산자"
  const patterns = [
    // "CPU 80% 이상" or "CPU > 80"
    /(?<metric>cpu|memory|메모리|disk|디스크|network|네트워크)\s*(?<value>\d+)%?\s*(?<op>이상|초과|이하|미만|above|below|over|under|>|<|>=|<=)/i,
    // "80% 이상인 CPU"
    /(?<value>\d+)%?\s*(?<op>이상|초과|이하|미만)\s*(?:인\s*)?(?<metric>cpu|memory|메모리|disk|디스크|network|네트워크)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.groups) {
      const { metric: rawMetric, value, op } = match.groups;

      // Map metric
      let field: FilterCondition['field'] = 'cpu';
      if (rawMetric.toLowerCase().includes('memory') || rawMetric.includes('메모리')) {
        field = 'memory';
      } else if (rawMetric.toLowerCase().includes('disk') || rawMetric.includes('디스크')) {
        field = 'disk';
      } else if (rawMetric.toLowerCase().includes('network') || rawMetric.includes('네트워크')) {
        field = 'network';
      }

      // Map operator
      let operator: FilterCondition['operator'] = '>=';
      if (op.includes('초과') || op === '>' || op.toLowerCase() === 'above' || op.toLowerCase() === 'over') {
        operator = '>';
      } else if (op.includes('이상') || op === '>=') {
        operator = '>=';
      } else if (op.includes('미만') || op === '<' || op.toLowerCase() === 'below' || op.toLowerCase() === 'under') {
        operator = '<';
      } else if (op.includes('이하') || op === '<=') {
        operator = '<=';
      }

      return {
        field,
        operator,
        value: Number(value),
      };
    }
  }

  return null;
}
