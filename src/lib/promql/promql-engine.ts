/**
 * Lightweight PromQL Engine
 *
 * Prometheus 호환 내부 쿼리 레이어. 사용자 UI 없음 — 내부 데이터 처리 전용.
 *
 * 지원 쿼리 패턴:
 *   node_cpu_usage_percent                          → 전체 서버 CPU
 *   node_cpu_usage_percent{server_type="web"}        → 라벨 필터링
 *   avg(node_cpu_usage_percent)                      → 집계 (avg, max, min, sum, count)
 *   max(node_cpu_usage_percent) by (server_type)     → 그룹 집계
 *   up == 0                                          → 비교 연산
 *   rate(node_cpu_usage_percent[1h])                 → 변화율 (시뮬레이션)
 *
 * 향후 실제 Prometheus 연결 시 HTTP API adapter로 교체 가능.
 *
 * @created 2026-02-04
 */

import type {
  HourlyData,
  PrometheusLabels,
  PrometheusTarget,
} from '@/data/hourly-data';
import type { PromQLResult, PromQLSample } from '@/types/processed-metrics';

// ============================================================================
// Types
// ============================================================================

type LabelMatcher = {
  name: string;
  value: string;
  op: '=' | '!=' | '=~' | '!~';
};

type AggregateFunc = 'avg' | 'max' | 'min' | 'sum' | 'count';

type ParsedQuery = {
  type: 'instant' | 'aggregate' | 'comparison' | 'rate';
  metricName: string;
  matchers: LabelMatcher[];
  aggregateFunc?: AggregateFunc;
  groupBy?: string[];
  comparisonOp?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  comparisonValue?: number;
  rangeWindow?: string;
};

// ============================================================================
// Metric Name → Prometheus Target Field Mapping
// ============================================================================

const METRIC_FIELD_MAP: Record<string, keyof PrometheusTarget['metrics']> = {
  node_cpu_usage_percent: 'node_cpu_usage_percent',
  node_memory_usage_percent: 'node_memory_usage_percent',
  node_filesystem_usage_percent: 'node_filesystem_usage_percent',
  node_network_transmit_bytes_rate: 'node_network_transmit_bytes_rate',
  node_load1: 'node_load1',
  node_load5: 'node_load5',
  node_boot_time_seconds: 'node_boot_time_seconds',
  node_procs_running: 'node_procs_running',
  node_http_request_duration_milliseconds:
    'node_http_request_duration_milliseconds',
  up: 'up',
};

// ============================================================================
// Parser
// ============================================================================

function parseLabelMatchers(matcherStr: string): LabelMatcher[] {
  const matchers: LabelMatcher[] = [];
  // Match: key="value" or key!="value" or key=~"value" or key!~"value"
  const re = /(\w+)\s*(=~|!~|!=|=)\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(matcherStr)) !== null) {
    const name = match[1];
    const op = match[2] as LabelMatcher['op'];
    const value = match[3];
    if (name && value !== undefined) {
      matchers.push({ name, op, value });
    }
  }
  return matchers;
}

function parsePromQL(query: string): ParsedQuery {
  const trimmed = query.trim();

  // rate(metric[window])
  const rateMatch = trimmed.match(
    /^rate\(\s*(\w+)(?:\{([^}]*)\})?\s*\[(\w+)\]\s*\)$/
  );
  if (rateMatch) {
    return {
      type: 'rate',
      metricName: rateMatch[1]!,
      matchers: rateMatch[2] ? parseLabelMatchers(rateMatch[2]) : [],
      rangeWindow: rateMatch[3],
    };
  }

  // aggregate(metric{labels}) by (groupLabels)
  const aggMatch = trimmed.match(
    /^(avg|max|min|sum|count)\(\s*(\w+)(?:\{([^}]*)\})?\s*\)(?:\s+by\s+\(([^)]+)\))?$/
  );
  if (aggMatch) {
    const groupBy = aggMatch[4]
      ? aggMatch[4].split(',').map((s) => s.trim())
      : undefined;
    return {
      type: 'aggregate',
      aggregateFunc: aggMatch[1] as AggregateFunc,
      metricName: aggMatch[2]!,
      matchers: aggMatch[3] ? parseLabelMatchers(aggMatch[3]) : [],
      groupBy,
    };
  }

  // metric{labels} op value (comparison)
  const compMatch = trimmed.match(
    /^(\w+)(?:\{([^}]*)\})?\s*(==|!=|>=|<=|>|<)\s*(\d+(?:\.\d+)?)$/
  );
  if (compMatch) {
    return {
      type: 'comparison',
      metricName: compMatch[1]!,
      matchers: compMatch[2] ? parseLabelMatchers(compMatch[2]) : [],
      comparisonOp: compMatch[3] as ParsedQuery['comparisonOp'],
      comparisonValue: Number.parseFloat(compMatch[4]!),
    };
  }

  // Simple metric selector: metric or metric{labels}
  const simpleMatch = trimmed.match(/^(\w+)(?:\{([^}]*)\})?$/);
  if (simpleMatch) {
    return {
      type: 'instant',
      metricName: simpleMatch[1]!,
      matchers: simpleMatch[2] ? parseLabelMatchers(simpleMatch[2]) : [],
    };
  }

  // Fallback: treat as metric name
  return {
    type: 'instant',
    metricName: trimmed,
    matchers: [],
  };
}

// ============================================================================
// Label Matching
// ============================================================================

function matchLabels(
  labels: PrometheusLabels,
  matchers: LabelMatcher[]
): boolean {
  for (const m of matchers) {
    const labelValue = labels[m.name as keyof PrometheusLabels] ?? '';
    switch (m.op) {
      case '=':
        if (labelValue !== m.value) return false;
        break;
      case '!=':
        if (labelValue === m.value) return false;
        break;
      case '=~':
        if (!new RegExp(m.value).test(labelValue)) return false;
        break;
      case '!~':
        if (new RegExp(m.value).test(labelValue)) return false;
        break;
    }
  }
  return true;
}

// ============================================================================
// Data Extraction
// ============================================================================

function extractSamples(
  hourlyData: HourlyData,
  parsed: ParsedQuery,
  slotIndex?: number
): PromQLSample[] {
  const dataPoint =
    hourlyData.dataPoints[slotIndex ?? 0] ?? hourlyData.dataPoints[0];
  if (!dataPoint) return [];

  const fieldKey = METRIC_FIELD_MAP[parsed.metricName];
  if (!fieldKey) return [];

  const samples: PromQLSample[] = [];

  for (const [, target] of Object.entries(dataPoint.targets)) {
    if (!matchLabels(target.labels, parsed.matchers)) continue;

    const value = target.metrics[fieldKey];
    if (value === undefined) continue;

    samples.push({
      labels: {
        instance: target.instance,
        job: target.job,
        ...target.labels,
      },
      value: Number(value),
    });
  }

  return samples;
}

// ============================================================================
// Aggregation
// ============================================================================

function applyAggregation(
  samples: PromQLSample[],
  func: AggregateFunc,
  groupBy?: string[]
): PromQLSample[] {
  if (!groupBy || groupBy.length === 0) {
    // Global aggregation
    if (samples.length === 0) return [];
    const values = samples.map((s) => s.value);
    const result = computeAgg(func, values);
    return [{ labels: {}, value: result }];
  }

  // Group by labels
  const groups = new Map<string, number[]>();
  const groupLabelsMap = new Map<string, Record<string, string>>();

  for (const sample of samples) {
    const key = groupBy.map((g) => sample.labels[g] ?? '').join('|');
    const existing = groups.get(key) ?? [];
    existing.push(sample.value);
    groups.set(key, existing);

    if (!groupLabelsMap.has(key)) {
      const labels: Record<string, string> = {};
      for (const g of groupBy) {
        labels[g] = sample.labels[g] ?? '';
      }
      groupLabelsMap.set(key, labels);
    }
  }

  const results: PromQLSample[] = [];
  for (const [key, values] of groups) {
    results.push({
      labels: groupLabelsMap.get(key) ?? {},
      value: computeAgg(func, values),
    });
  }

  return results;
}

function computeAgg(func: AggregateFunc, values: number[]): number {
  if (values.length === 0) return 0;
  switch (func) {
    case 'avg':
      return (
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
        100
      );
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'count':
      return values.length;
  }
}

// ============================================================================
// Comparison
// ============================================================================

function applyComparison(
  samples: PromQLSample[],
  op: string,
  threshold: number
): PromQLSample[] {
  return samples.filter((s) => {
    switch (op) {
      case '==':
        return s.value === threshold;
      case '!=':
        return s.value !== threshold;
      case '>':
        return s.value > threshold;
      case '<':
        return s.value < threshold;
      case '>=':
        return s.value >= threshold;
      case '<=':
        return s.value <= threshold;
      default:
        return false;
    }
  });
}

// ============================================================================
// Rate (Simulated)
// ============================================================================

function computeRate(
  hourlyDataMap: Map<number, HourlyData>,
  parsed: ParsedQuery,
  currentHour: number
): PromQLSample[] {
  // Parse window (e.g., "1h" -> 1 hour)
  const windowMatch = parsed.rangeWindow?.match(/^(\d+)h$/);
  const windowHours = windowMatch ? Number.parseInt(windowMatch[1]!, 10) : 1;

  const prevHour = (((currentHour - windowHours) % 24) + 24) % 24;
  const currentData = hourlyDataMap.get(currentHour);
  const prevData = hourlyDataMap.get(prevHour);

  if (!currentData || !prevData) return [];

  const currentSamples = extractSamples(currentData, parsed, 3);
  const prevSamples = extractSamples(prevData, parsed, 3);

  const prevMap = new Map<string, number>();
  for (const s of prevSamples) {
    prevMap.set(s.labels['instance'] ?? '', s.value);
  }

  return currentSamples.map((s) => {
    const prevValue = prevMap.get(s.labels['instance'] ?? '') ?? s.value;
    const delta = s.value - prevValue;
    return {
      labels: s.labels,
      value: Math.round(delta * 100) / 100,
    };
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * PromQL 쿼리 실행
 *
 * @param query - PromQL 쿼리 문자열
 * @param hourlyData - 현재 시간대 hourly data
 * @param hourlyDataMap - 전체 시간대 데이터 맵 (rate 계산용, optional)
 * @param currentHour - 현재 시 (0-23)
 * @param slotIndex - 현재 슬롯 인덱스 (0-5)
 */
export function executePromQL(
  query: string,
  hourlyData: HourlyData,
  hourlyDataMap?: Map<number, HourlyData>,
  currentHour?: number,
  slotIndex?: number
): PromQLResult {
  const parsed = parsePromQL(query);

  switch (parsed.type) {
    case 'rate': {
      const samples =
        hourlyDataMap && currentHour !== undefined
          ? computeRate(hourlyDataMap, parsed, currentHour)
          : [];
      return { resultType: 'vector', result: samples };
    }

    case 'aggregate': {
      const samples = extractSamples(hourlyData, parsed, slotIndex);
      const aggregated = applyAggregation(
        samples,
        parsed.aggregateFunc!,
        parsed.groupBy
      );
      return { resultType: 'vector', result: aggregated };
    }

    case 'comparison': {
      const samples = extractSamples(hourlyData, parsed, slotIndex);
      const filtered = applyComparison(
        samples,
        parsed.comparisonOp!,
        parsed.comparisonValue!
      );
      return { resultType: 'vector', result: filtered };
    }

    case 'instant':
    default: {
      const samples = extractSamples(hourlyData, parsed, slotIndex);
      return { resultType: 'vector', result: samples };
    }
  }
}

/**
 * PromQL 쿼리 파싱 (테스트/디버그용)
 */
export function debugParsePromQL(query: string): ParsedQuery {
  return parsePromQL(query);
}
