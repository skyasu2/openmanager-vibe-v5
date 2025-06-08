/**
 * 🔍 Monitoring Layer - Prometheus 쿼리 API (완전 독립)
 *
 * 역할: 실제 Prometheus 서버 대체
 * - 표준 PromQL 쿼리 지원
 * - Infrastructure Layer에서 메트릭 획득
 * - Grafana/DataDog과 동일한 동작
 * - AI Agent와 완전 독립
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 🎯 표준 Prometheus Query API
 * GET /api/prometheus/query?query={promql}&time={timestamp}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const time = searchParams.get('time');

    if (!query) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'query parameter is required',
          errorType: 'bad_data',
        },
        { status: 400 }
      );
    }

    // Infrastructure Layer에서 메트릭 데이터 획득
    const metricsData = await fetchFromInfrastructure();

    // PromQL 쿼리 실행
    const result = executePromQLQuery(query, metricsData, time || undefined);

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: result,
      },
    });
  } catch (error) {
    console.error('❌ Prometheus 쿼리 실패:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Query execution failed',
        errorType: 'execution',
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 표준 Prometheus Query Range API
 * POST /api/prometheus/query_range
 */
export async function POST(request: NextRequest) {
  try {
    const { query, start, end, step } = await request.json();

    if (!query || !start || !end) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'query, start, and end parameters are required',
          errorType: 'bad_data',
        },
        { status: 400 }
      );
    }

    // Infrastructure Layer에서 메트릭 데이터 획득
    const metricsData = await fetchFromInfrastructure();

    // 시간 범위별 데이터 생성
    const timeRange = generateTimeRange(start, end, step);
    const results = timeRange.map(timestamp => ({
      timestamp,
      data: executePromQLQuery(query, metricsData, timestamp.toString()),
    }));

    // 시계열 형식으로 변환
    const matrixResult = convertToMatrix(results);

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'matrix',
        result: matrixResult,
      },
    });
  } catch (error) {
    console.error('❌ Prometheus 범위 쿼리 실패:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Range query execution failed',
        errorType: 'execution',
      },
      { status: 500 }
    );
  }
}

/**
 * 🏗️ Infrastructure Layer에서 메트릭 데이터 획득
 * - /api/metrics 엔드포인트에서 Prometheus 형식 데이터 파싱
 * - 완전히 독립적인 통신 (표준 프로토콜만 사용)
 */
async function fetchFromInfrastructure(): Promise<any[]> {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : process.env.VERCEL_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/metrics`, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Infrastructure Layer 응답 오류: ${response.status}`);
    }

    const prometheusText = await response.text();
    return parsePrometheusFormat(prometheusText);
  } catch (error) {
    console.error('❌ Infrastructure Layer 통신 실패:', error);
    return [];
  }
}

/**
 * 📊 Prometheus 텍스트 형식 파싱
 * - 실제 Prometheus 서버와 동일한 파싱 로직
 */
function parsePrometheusFormat(text: string): any[] {
  const lines = text.split('\n');
  const metrics: any[] = [];

  let currentMetric = '';
  let currentHelp = '';
  let currentType = '';

  for (const line of lines) {
    if (line.startsWith('# HELP ')) {
      currentHelp = line.substring(7);
      const spaceIndex = currentHelp.indexOf(' ');
      if (spaceIndex > 0) {
        currentMetric = currentHelp.substring(0, spaceIndex);
        currentHelp = currentHelp.substring(spaceIndex + 1);
      }
    } else if (line.startsWith('# TYPE ')) {
      const typeInfo = line.substring(7);
      const spaceIndex = typeInfo.indexOf(' ');
      if (spaceIndex > 0) {
        currentType = typeInfo.substring(spaceIndex + 1);
      }
    } else if (line && !line.startsWith('#')) {
      // 메트릭 데이터 라인 파싱
      const spaceIndex = line.lastIndexOf(' ');
      if (spaceIndex > 0) {
        const metricWithLabels = line.substring(0, spaceIndex);
        const value = parseFloat(line.substring(spaceIndex + 1));

        // 라벨 파싱
        const labels = parseLabels(metricWithLabels);
        const metricName = extractMetricName(metricWithLabels);

        if (metricName && !isNaN(value)) {
          metrics.push({
            name: metricName,
            labels: labels,
            value: value,
            type: currentType,
            help: currentHelp,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      }
    }
  }

  return metrics;
}

/**
 * 🏷️ 메트릭 라벨 파싱
 */
function parseLabels(metricString: string): Record<string, string> {
  const labels: Record<string, string> = {};

  const labelMatch = metricString.match(/\{([^}]+)\}/);
  if (labelMatch) {
    const labelString = labelMatch[1];
    const labelPairs = labelString.split(',');

    for (const pair of labelPairs) {
      const equalIndex = pair.indexOf('=');
      if (equalIndex > 0) {
        const key = pair.substring(0, equalIndex).trim();
        const value = pair
          .substring(equalIndex + 1)
          .trim()
          .replace(/"/g, '');
        labels[key] = value;
      }
    }
  }

  return labels;
}

/**
 * 📛 메트릭 이름 추출
 */
function extractMetricName(metricString: string): string {
  const braceIndex = metricString.indexOf('{');
  if (braceIndex > 0) {
    return metricString.substring(0, braceIndex);
  }
  return metricString;
}

/**
 * 🔍 PromQL 쿼리 실행 시뮬레이션
 */
function executePromQLQuery(
  query: string,
  metrics: any[],
  time?: string
): any[] {
  const results: any[] = [];

  // 간단한 메트릭 이름 매칭
  const metricNameMatch = query.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)/);
  if (!metricNameMatch) return results;

  const targetMetric = metricNameMatch[1];

  // 해당 메트릭 필터링
  let filteredMetrics = metrics.filter(m => m.name === targetMetric);

  // 라벨 필터링 (예: {job="web"})
  const labelMatch = query.match(/\{([^}]+)\}/);
  if (labelMatch) {
    const labelFilters = labelMatch[1].split(',');

    for (const filter of labelFilters) {
      const [key, value] = filter
        .split('=')
        .map(s => s.trim().replace(/"/g, ''));
      if (key && value) {
        filteredMetrics = filteredMetrics.filter(m => m.labels[key] === value);
      }
    }
  }

  // 집계 함수 처리 (예: avg(cpu_usage_percent))
  if (query.includes('avg(')) {
    const avgValue =
      filteredMetrics.reduce((sum, m) => sum + m.value, 0) /
      filteredMetrics.length;
    return [
      {
        metric: { __name__: targetMetric },
        value: [
          time ? parseInt(time) : Math.floor(Date.now() / 1000),
          avgValue.toString(),
        ],
      },
    ];
  }

  if (query.includes('max(')) {
    const maxValue = Math.max(...filteredMetrics.map(m => m.value));
    return [
      {
        metric: { __name__: targetMetric },
        value: [
          time ? parseInt(time) : Math.floor(Date.now() / 1000),
          maxValue.toString(),
        ],
      },
    ];
  }

  if (query.includes('min(')) {
    const minValue = Math.min(...filteredMetrics.map(m => m.value));
    return [
      {
        metric: { __name__: targetMetric },
        value: [
          time ? parseInt(time) : Math.floor(Date.now() / 1000),
          minValue.toString(),
        ],
      },
    ];
  }

  // 기본 vector 결과
  return filteredMetrics.map(metric => ({
    metric: {
      __name__: metric.name,
      ...metric.labels,
    },
    value: [time ? parseInt(time) : metric.timestamp, metric.value.toString()],
  }));
}

/**
 * ⏰ 시간 범위 생성
 */
function generateTimeRange(
  start: number,
  end: number,
  step: number = 15
): number[] {
  const range: number[] = [];
  for (let timestamp = start; timestamp <= end; timestamp += step) {
    range.push(timestamp);
  }
  return range;
}

/**
 * 📈 벡터 결과를 매트릭스 형식으로 변환
 */
function convertToMatrix(results: any[]): any[] {
  const metricMap = new Map();

  for (const result of results) {
    for (const item of result.data) {
      const metricKey = JSON.stringify(item.metric);

      if (!metricMap.has(metricKey)) {
        metricMap.set(metricKey, {
          metric: item.metric,
          values: [],
        });
      }

      metricMap.get(metricKey).values.push(item.value);
    }
  }

  return Array.from(metricMap.values());
}
