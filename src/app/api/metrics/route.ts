/**
 * 🏗️ Infrastructure Layer - 서버 메트릭 API
 *
 * PromQL 쿼리 API (POST)
 * - Single Source of Truth: MetricsProvider
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMockSystem } from '@/__mocks__/data';
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
  const mockSystem = getMockSystem();
  const servers = mockSystem.getServers();

  // 간단한 PromQL 쿼리 파싱 (실제로는 더 복잡한 파서가 필요)
  if (query.includes('cpu_usage_percent')) {
    return servers.map((server) => ({
      metric: {
        __name__: 'cpu_usage_percent',
        instance: server.id,
        job: server.role || 'unknown',
        environment: server.environment || 'production',
      },
      value: [
        time || Math.floor(Date.now() / 1000),
        (server.cpu || 0).toString(),
      ],
    }));
  }

  if (query.includes('memory_usage_percent')) {
    return servers.map((server) => ({
      metric: {
        __name__: 'memory_usage_percent',
        instance: server.id,
        job: server.role || 'unknown',
        environment: server.environment || 'production',
      },
      value: [
        time || Math.floor(Date.now() / 1000),
        (server.memory || 0).toString(),
      ],
    }));
  }

  if (query.includes('server_status')) {
    return servers.map((server) => {
      let statusValue = 2; // normal/healthy
      if (server.status === 'offline') statusValue = 3;
      else if (server.status === 'online') statusValue = 2;
      else statusValue = 1; // any other status (warning, etc.)

      return {
        metric: {
          __name__: 'server_status',
          instance: server.id,
          job: server.role || 'unknown',
          environment: server.environment || 'production',
          status: server.status || 'unknown',
        },
        value: [time || Math.floor(Date.now() / 1000), statusValue.toString()],
      };
    });
  }

  // 기본적으로 빈 결과 반환
  return [];
}
