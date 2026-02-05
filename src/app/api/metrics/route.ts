/**
 * 🏗️ Infrastructure Layer - 서버 메트릭 API
 *
 * PromQL 쿼리 API (POST)
 * - Single Source of Truth: MetricsProvider
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { metricsProvider } from '@/services/metrics/MetricsProvider';
import debug from '@/utils/debug';

interface PrometheusMetricResult {
  metric: {
    __name__: string;
    instance: string;
    job: string;
    environment: string;
    status?: string;
  };
  value: [number, string];
}

/**
 * 🔍 Prometheus 쿼리 API (PromQL 호환)
 */
export async function POST(request: NextRequest) {
  try {
    const { query, time, timeout: _timeout } = await request.json();

    // PromQL 쿼리 파싱 및 실행 시뮬레이션
    const result = await executePromQLQuery(query, time);

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: result,
      },
    });
  } catch (error) {
    debug.error('❌ PromQL 쿼리 실행 실패:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Query execution failed',
        errorType: 'bad_data',
      },
      { status: 400 }
    );
  }
}

/**
 * 📊 PromQL 쿼리 시뮬레이션 실행
 */
async function executePromQLQuery(
  query: string,
  time?: number
): Promise<PrometheusMetricResult[]> {
  const metrics = metricsProvider.getAllServerMetrics();
  const ts = time || Math.floor(Date.now() / 1000);

  // 간단한 PromQL 쿼리 파싱
  if (query.includes('cpu_usage_percent')) {
    return metrics.map((m) => ({
      metric: {
        __name__: 'cpu_usage_percent',
        instance: m.serverId,
        job: m.serverType,
        environment: m.environment ?? 'production',
      },
      value: [ts, m.cpu.toString()],
    }));
  }

  if (query.includes('memory_usage_percent')) {
    return metrics.map((m) => ({
      metric: {
        __name__: 'memory_usage_percent',
        instance: m.serverId,
        job: m.serverType,
        environment: m.environment ?? 'production',
      },
      value: [ts, m.memory.toString()],
    }));
  }

  if (query.includes('server_status')) {
    return metrics.map((m) => {
      let statusValue = 2; // normal/healthy
      if (m.status === 'offline') statusValue = 3;
      else if (m.status === 'online') statusValue = 2;
      else statusValue = 1; // any other status (warning, critical, etc.)

      return {
        metric: {
          __name__: 'server_status',
          instance: m.serverId,
          job: m.serverType,
          environment: m.environment ?? 'production',
          status: m.status,
        },
        value: [ts, statusValue.toString()],
      };
    });
  }

  // 기본적으로 빈 결과 반환
  return [];
}
